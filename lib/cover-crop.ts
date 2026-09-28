import { deflateSync, inflateSync } from "node:zlib";

/**
 * GPT Image renders landscape covers on a 1536x1024 (3:2) canvas even when the
 * prompt asks for 16:9, and often letterboxes the 16:9 picture inside it. This
 * centre-crops a PNG to the requested ratio without an image library.
 * Supported: 8-bit truecolour (RGB, RGBA) and greyscale, non-interlaced, which
 * is what the image tool writes. Anything else comes back unchanged.
 */

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Ancillary chunks that stay valid after a crop. */
const KEPT_ANCILLARY = new Set(["sRGB", "gAMA", "cHRM", "iCCP", "pHYs"]);
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };

export type CropResult = { bytes: Buffer; width: number; height: number; cropped: boolean };

type Chunk = { type: string; data: Buffer };

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function readChunks(bytes: Buffer): Chunk[] | null {
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(SIGNATURE)) return null;
  const chunks: Chunk[] = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (offset + 12 + length > bytes.length) return null;
    chunks.push({ type, data: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
}

function writeChunk(type: string, data: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Reconstructs every scanline; returns raw rows (without filter bytes) and the original filtered rows. */
function unfilter(raw: Buffer, width: number, height: number, bpp: number) {
  const stride = width * bpp;
  const rows: Buffer[] = [];
  const filtered: Buffer[] = [];
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const start = y * (stride + 1);
    const filter = raw[start];
    const line = raw.subarray(start + 1, start + 1 + stride);
    const out = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bpp ? out[x - bpp] : 0;
      const up = previous[x];
      const upLeft = x >= bpp ? previous[x - bpp] : 0;
      const value = line[x];
      if (filter === 0) out[x] = value;
      else if (filter === 1) out[x] = (value + left) & 0xff;
      else if (filter === 2) out[x] = (value + up) & 0xff;
      else if (filter === 3) out[x] = (value + ((left + up) >> 1)) & 0xff;
      else if (filter === 4) out[x] = (value + paeth(left, up, upLeft)) & 0xff;
      else throw new Error("Unknown PNG filter.");
    }
    rows.push(out);
    filtered.push(raw.subarray(start, start + 1 + stride));
    previous = out;
  }
  return { rows, filtered };
}

/** The centred crop box for a target ratio. */
export function cropBox(width: number, height: number, ratioWidth: number, ratioHeight: number) {
  const targetHeight = Math.round((width * ratioHeight) / ratioWidth);
  if (targetHeight <= height) return { x: 0, y: Math.floor((height - targetHeight) / 2), width, height: targetHeight };
  const targetWidth = Math.round((height * ratioWidth) / ratioHeight);
  return { x: Math.floor((width - targetWidth) / 2), y: 0, width: targetWidth, height };
}

export function cropPngToRatio(input: Uint8Array, ratioWidth: number, ratioHeight: number): CropResult {
  const bytes = Buffer.from(input);
  const chunks = readChunks(bytes);
  const header = chunks?.find((chunk) => chunk.type === "IHDR")?.data;
  if (!chunks || !header || header.length < 13) return { bytes, width: 0, height: 0, cropped: false };
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const [depth, colorType, , , interlace] = header.subarray(8, 13);
  const channels = CHANNELS[colorType];
  const box = cropBox(width, height, ratioWidth, ratioHeight);
  const unchanged = { bytes, width, height, cropped: false };
  if (box.width === width && box.height === height) return unchanged;
  if (depth !== 8 || !channels || interlace !== 0) return unchanged;

  const bpp = channels;
  const raw = inflateSync(Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data)));
  if (raw.length < height * (width * bpp + 1)) return unchanged;
  const { rows, filtered } = unfilter(raw, width, height, bpp);

  const lines: Buffer[] = [];
  for (let y = box.y; y < box.y + box.height; y += 1) {
    if (box.width === width && y > box.y) {
      // Same width: the original filter of this row only references the kept row above.
      lines.push(filtered[y]);
    } else {
      lines.push(Buffer.concat([Buffer.from([0]), rows[y].subarray(box.x * bpp, (box.x + box.width) * bpp)]));
    }
  }

  const ihdr = Buffer.from(header);
  ihdr.writeUInt32BE(box.width, 0);
  ihdr.writeUInt32BE(box.height, 4);
  const ancillary = chunks.filter((chunk) => KEPT_ANCILLARY.has(chunk.type));
  const output = Buffer.concat([
    SIGNATURE,
    writeChunk("IHDR", ihdr),
    ...ancillary.map((chunk) => writeChunk(chunk.type, Buffer.from(chunk.data))),
    writeChunk("IDAT", deflateSync(Buffer.concat(lines))),
    writeChunk("IEND", Buffer.alloc(0)),
  ]);
  return { bytes: output, width: box.width, height: box.height, cropped: true };
}

/** Width and height from a PNG header, or null for other formats. */
export function pngSize(input: Uint8Array) {
  const bytes = Buffer.from(input);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(SIGNATURE)) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

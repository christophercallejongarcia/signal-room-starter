import test from "node:test";
import assert from "node:assert/strict";
import { deflateSync, inflateSync } from "node:zlib";
import { cropBox, cropPngToRatio, pngSize } from "../lib/cover-crop.ts";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  return Buffer.concat([head, data, Buffer.alloc(4)]);
}

function pixel(x, y) {
  return [(x * 7 + y) & 0xff, (y * 5) & 0xff, (x ^ y) & 0xff];
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** RGB PNG whose rows cycle through all five filters, so the crop has to reconstruct them. */
function encode(width, height) {
  const stride = width * 3;
  const lines = [];
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const raw = Buffer.from(Array.from({ length: width }, (_, x) => pixel(x, y)).flat());
    const filter = y % 5;
    const out = Buffer.alloc(stride);
    for (let i = 0; i < stride; i += 1) {
      const left = i >= 3 ? raw[i - 3] : 0;
      const up = previous[i];
      const upLeft = i >= 3 ? previous[i - 3] : 0;
      const predictor = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][filter];
      out[i] = (raw[i] - predictor) & 0xff;
    }
    lines.push(Buffer.from([filter]), out);
    previous = raw;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([SIGNATURE, chunk("IHDR", ihdr), chunk("tEXt", Buffer.from("c2pa\0drop me")), chunk("IDAT", deflateSync(Buffer.concat(lines))), chunk("IEND", Buffer.alloc(0))]);
}

/** Minimal decoder for the crop output. */
function decode(bytes) {
  let offset = 8;
  const idat = [];
  let width = 0;
  let height = 0;
  const types = [];
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    types.push(type);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    }
    if (type === "IDAT") idat.push(data);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 3;
  const rows = [];
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = Buffer.alloc(stride);
    for (let i = 0; i < stride; i += 1) {
      const left = i >= 3 ? out[i - 3] : 0;
      const up = previous[i];
      const upLeft = i >= 3 ? previous[i - 3] : 0;
      out[i] = (line[i] + [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][filter]) & 0xff;
    }
    rows.push(out);
    previous = out;
  }
  return { width, height, rows, types };
}

test("the crop box keeps the centre band of a 3:2 render", () => {
  assert.deepEqual(cropBox(1536, 1024, 16, 9), { x: 0, y: 80, width: 1536, height: 864 });
  assert.deepEqual(cropBox(1024, 1024, 16, 9), { x: 0, y: 224, width: 1024, height: 576 });
  assert.deepEqual(cropBox(1024, 1536, 4, 5), { x: 0, y: 128, width: 1024, height: 1280 });
  assert.deepEqual(cropBox(2000, 900, 16, 9), { x: 200, y: 0, width: 1600, height: 900 });
});

test("a vertical crop reconstructs every filter and keeps the exact pixels", () => {
  const result = cropPngToRatio(encode(48, 32), 16, 9);
  assert.equal(result.cropped, true);
  assert.deepEqual([result.width, result.height], [48, 27]);
  assert.deepEqual(pngSize(result.bytes), { width: 48, height: 27 });
  const decoded = decode(result.bytes);
  assert.deepEqual(decoded.types, ["IHDR", "IDAT", "IEND"], "metadata of the uncropped image is dropped");
  for (let y = 0; y < 27; y += 1) {
    for (let x = 0; x < 48; x += 1) {
      assert.deepEqual([...decoded.rows[y].subarray(x * 3, x * 3 + 3)], pixel(x, y + 2));
    }
  }
});

test("a horizontal crop re-encodes the kept columns", () => {
  const result = cropPngToRatio(encode(40, 18), 16, 9);
  assert.deepEqual([result.width, result.height], [32, 18]);
  const decoded = decode(result.bytes);
  assert.deepEqual([...decoded.rows[5].subarray(0, 3)], pixel(4, 5));
});

test("an image already at the ratio or not a PNG comes back unchanged", () => {
  const exact = encode(32, 18);
  assert.equal(cropPngToRatio(exact, 16, 9).cropped, false);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  assert.equal(cropPngToRatio(jpeg, 16, 9).bytes.equals(jpeg), true);
});

#!/usr/bin/env node
/**
 * Sets a thumbnail headline with a real font instead of letting the image
 * model draw it: exact spelling, fixed position, real typeface. The glyphs
 * become SVG paths (opentype.js), sharp lays them onto the rendered image.
 *
 * Usage: node scripts/thumbnail-text.mjs <in.png> <out.png> <spec.json>
 *
 * Positions and sizes are fractions of the image, so a spec works for any
 * render size. Spec:
 * {
 *   "lines": [{ "segments": [{ "text": "WO STEHST", "color": "#111" }], "font": "anton",
 *               "size": 0.2, "x": 0.05, "y": 0.08, "align": "left", "maxWidth": 0.55, "tracking": 0 }],
 *   "shadow": { "color": "#000", "opacity": 0.35, "blur": 10, "dx": 0, "dy": 6 },
 *   "stroke": { "color": "#000", "width": 0 }
 * }
 * y is the top of the capital letters; size is the font size as a share of the image height.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const THUMBNAIL_FONTS = {
  anton: "assets/fonts/Anton-Regular.ttf",
  archivo: "assets/fonts/ArchivoBlack-Regular.ttf",
};

const fontCache = new Map();
function loadFont(name) {
  const file = THUMBNAIL_FONTS[name];
  if (!file) throw new Error(`Unknown font "${name}". Known: ${Object.keys(THUMBNAIL_FONTS).join(", ")}.`);
  if (!fontCache.has(name)) fontCache.set(name, opentype.loadSync(path.join(ROOT, file)));
  return fontCache.get(name);
}

const escape = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

/** One line as SVG paths plus its pixel box. */
function layoutLine(line, width, height) {
  const font = loadFont(line.font ?? "anton");
  const segments = line.segments ?? [{ text: line.text, color: line.color ?? "#ffffff" }];
  const tracking = line.tracking ?? 0;
  let size = (line.size ?? 0.15) * height;
  const measure = (fontSize) => segments.reduce((sum, segment) => sum + font.getAdvanceWidth(segment.text, fontSize, { letterSpacing: tracking }), 0);
  const maxWidth = (line.maxWidth ?? 1) * width;
  const natural = measure(size);
  if (natural > maxWidth) size *= maxWidth / natural;
  const lineWidth = measure(size);
  const capHeight = ((font.tables.os2?.sCapHeight || font.unitsPerEm * 0.7) / font.unitsPerEm) * size;
  const anchorX = (line.x ?? 0.05) * width;
  const left = line.align === "center" ? anchorX - lineWidth / 2 : line.align === "right" ? anchorX - lineWidth : anchorX;
  const top = (line.y ?? 0.05) * height;
  const baseline = top + capHeight;
  let cursor = left;
  const paths = segments.map((segment) => {
    const glyphs = font.getPath(segment.text, cursor, baseline, size, { letterSpacing: tracking });
    cursor += font.getAdvanceWidth(segment.text, size, { letterSpacing: tracking });
    return { d: glyphs.toPathData(2), color: segment.color ?? "#ffffff" };
  });
  return { paths, box: { x: Math.round(left), y: Math.round(top), width: Math.round(lineWidth), height: Math.round(capHeight), size: Math.round(size) } };
}

export async function overlayText(input, output, spec) {
  const image = sharp(input);
  const { width, height } = await image.metadata();
  const lines = spec.lines.map((line) => layoutLine(line, width, height));
  const shadow = spec.shadow;
  const stroke = spec.stroke?.width ? spec.stroke : null;
  const all = lines.flatMap((line) => line.paths);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
    shadow ? `<defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${shadow.blur ?? 10}"/></filter></defs>` : "",
    shadow ? `<g filter="url(#s)" transform="translate(${shadow.dx ?? 0} ${shadow.dy ?? 6})" fill="${escape(shadow.color ?? "#000")}" fill-opacity="${shadow.opacity ?? 0.35}">${all.map((p) => `<path d="${p.d}"/>`).join("")}</g>` : "",
    ...all.map((p) => `<path d="${p.d}" fill="${escape(p.color)}"${stroke ? ` stroke="${escape(stroke.color)}" stroke-width="${stroke.width}" paint-order="stroke"` : ""}/>`),
    "</svg>",
  ].join("");
  await image.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toFile(output);
  return { width, height, boxes: lines.map((line) => line.box) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [input, output, specFile] = process.argv.slice(2);
  if (!input || !output || !specFile) {
    console.error("Usage: node scripts/thumbnail-text.mjs <in.png> <out.png> <spec.json>");
    process.exit(1);
  }
  const result = await overlayText(input, output, JSON.parse(await readFile(specFile, "utf8")));
  await writeFile(`${output}.text.json`, `${JSON.stringify({ spec: JSON.parse(await readFile(specFile, "utf8")), ...result }, null, 2)}\n`);
  console.log(JSON.stringify(result));
}

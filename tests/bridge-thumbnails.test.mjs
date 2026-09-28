import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assertImageFiles,
  buildThumbnailImageInput,
  buildThumbnailPlanInput,
  normalizeThumbnailPlan,
  thumbnailPlanOutputSchema,
  validateFaces,
  validateThumbnailRequest,
} from "../bridge/thumbnails.mjs";

const faces = [
  { id: "gesicht-00m40s-aufmerksam", path: "/stills/gesicht-00m40s-aufmerksam.png" },
  { id: "gesicht-06m56s-erklaerend", path: "/stills/gesicht-06m56s-erklaerend.png" },
];
const references = [
  { id: "AAAAAAAAAA1", title: "Master Claude", channelTitle: "Kanal A", factor: 99.8, views: 500_000, path: "/cache/AAAAAAAAAA1.jpg" },
  { id: "AAAAAAAAAA2", title: "Learn Claude", channelTitle: "Kanal B", factor: 34.9, views: 200_000, path: "/cache/AAAAAAAAAA2.jpg" },
];

function request() {
  return validateThumbnailRequest({ video: { title: "Die 6 Stufen", brief: "Hook" }, references, faces });
}

function variant(extra = {}) {
  return {
    label: "Treppe",
    textOverlay: "Welche Stufe bist du?",
    concept: "Treppe mit sechs Stufen",
    face: "gesicht-06m56s-erklaerend",
    inspiredBy: [{ videoId: "AAAAAAAAAA2", borrowed: "Symbole in einer Reihe" }],
    imagePrompt: {
      subject: "Chris rechts",
      expression: "erklärend",
      text: { content: "egal", placement: "links oben", style: "fett" },
      keyVisual: "Treppe",
      background: "dunkel",
      composition: "Drittel",
      palette: "Koralle",
      styleNotes: "Kontrast",
      avoid: [],
    },
    ...extra,
  };
}

test("the request needs absolute image paths for stills and references", () => {
  assert.equal(request().count, 3);
  assert.throws(() => validateThumbnailRequest({ video: { title: "T" }, references, faces: [] }), /faces must list/);
  assert.throws(() => validateThumbnailRequest({ video: { title: "T" }, references: [], faces }), /references must list/);
  assert.throws(() => validateThumbnailRequest({ video: { title: "T" }, references: [{ ...references[0], path: "relative.jpg" }], faces }), /absolute/);
  assert.throws(() => validateFaces([{ id: "a", path: "/etc/passwd" }]), /absolute PNG, JPEG or WebP/);
  assert.throws(() => validateThumbnailRequest({ video: { title: "T" }, references: [{ ...references[0], id: "x" }], faces }), /YouTube id/);
});

test("only real image bytes pass to Codex", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "bridge-thumbnails-"));
  try {
    const good = path.join(dir, "a.png");
    const fake = path.join(dir, "b.png");
    await writeFile(good, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]));
    await writeFile(fake, "#!/bin/sh");
    await assertImageFiles([good]);
    await assert.rejects(assertImageFiles([fake]), (error) => /not an image/.test(error.message) && !error.message.includes(dir));
    await assert.rejects(assertImageFiles([path.join(dir, "missing.png")]), (error) => !error.message.includes(dir));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the plan schema limits faces and Outliers to the offered ids", () => {
  const schema = thumbnailPlanOutputSchema(request());
  const item = schema.properties.variants.items;
  assert.equal(schema.properties.variants.minItems, 3);
  assert.deepEqual(item.properties.face.enum, faces.map((face) => face.id));
  assert.deepEqual(item.properties.inspiredBy.items.properties.videoId.enum, ["AAAAAAAAAA1", "AAAAAAAAAA2"]);
  assert.equal(item.additionalProperties, false);
  assert.equal(item.properties.imagePrompt.additionalProperties, false);
});

test("the planner sees the reference thumbnails as images, never the stills", () => {
  const input = buildThumbnailPlanInput(request());
  assert.equal(input[0].type, "text");
  assert.match(input[0].text, /exactly three distinct 16:9/);
  assert.match(input[0].text, /label, concept and every borrowed note are German/);
  assert.match(input[0].text, /"videoId": "AAAAAAAAAA1"/);
  assert.deepEqual(input.slice(1), references.map((reference) => ({ type: "local_image", path: reference.path })));
});

test("the plan is normalized: overlay wins over the prompt text, unknown ids fail", () => {
  const [first] = normalizeThumbnailPlan({ variants: [variant(), variant(), variant()] }, request());
  assert.equal(first.imagePrompt.text.content, "Welche Stufe bist du?");
  assert.throws(() => normalizeThumbnailPlan({ variants: [variant({ face: "random" }), variant(), variant()] }, request()), /unknown face/);
  assert.throws(() => normalizeThumbnailPlan({ variants: [variant()] }, request()), /exactly 3/);
});

test("the render prompt is JSON and orders the images: chosen still, other stills, then style references", () => {
  const [planned] = normalizeThumbnailPlan({ variants: [variant(), variant(), variant()] }, request());
  const render = buildThumbnailImageInput(request(), planned);
  assert.deepEqual(render.images, ["/stills/gesicht-06m56s-erklaerend.png", "/stills/gesicht-00m40s-aufmerksam.png", "/cache/AAAAAAAAAA2.jpg"]);
  const json = JSON.parse(render.text.slice(render.text.indexOf("{")));
  assert.equal(json.text.content, "Welche Stufe bist du?");
  assert.equal(json.canvas.aspectRatio, "16:9");
  assert.match(json.inputImages.face, /Images 1-2: real photos of Chris/);
  assert.match(json.inputImages.style, /Image 3: Outlier thumbnails/);
  assert.ok(json.avoid.includes("letterbox bars, borders or frames"));
  assert.equal(render.text.includes("/stills/"), false, "paths travel as image input, not inside the prompt");
});

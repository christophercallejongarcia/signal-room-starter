import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  PERSON_LOOK,
  assertImageFiles,
  buildThumbnailImageInput,
  buildThumbnailPlanInput,
  normalizeThumbnailPlan,
  thumbnailPlanOutputSchema,
  validateFaces,
  validateThumbnailRequest,
  validateThumbnailStage,
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

test("Chris' picks carry his note and the rules reach the planner as binding", () => {
  const picked = validateThumbnailRequest({
    video: { title: "T" },
    references: [{ ...references[0], source: "manual", note: "Helles Licht, echtes Lachen" }],
    faces,
    rules: "1. Mobil lesbar.",
  });
  const [text] = buildThumbnailPlanInput(picked);
  assert.match(text.text, /"why": "picked by Chris as a style he likes"/);
  assert.match(text.text, /"chrisSays": "Helles Licht, echtes Lachen"/);
  assert.match(text.text, /<rules>\n1\. Mobil lesbar\.\n<\/rules>/);
  assert.doesNotMatch(buildThumbnailPlanInput(request())[0].text, /<rules>/);
});

test("the plan is normalized: overlay wins over the prompt text, unknown ids fail", () => {
  const [first] = normalizeThumbnailPlan({ variants: [variant(), variant(), variant()] }, request());
  assert.equal(first.imagePrompt.text.content, "Welche Stufe bist du?");
  assert.throws(() => normalizeThumbnailPlan({ variants: [variant({ face: "random" }), variant(), variant()] }, request()), /unknown face/);
  assert.throws(() => normalizeThumbnailPlan({ variants: [variant()] }, request()), /exactly 3/);
});

const BASE = "/runs/run-20260928T200000Z-abcdef/variant-1-background.png";

function planned() {
  return normalizeThumbnailPlan({ variants: [variant({ textOverlay: "Größer denken" }), variant(), variant()] }, request())[0];
}

function stagePrompt(stage) {
  const render = buildThumbnailImageInput({ ...request(), base: BASE }, planned(), stage);
  assert.match(render.text, /The JSON below is the complete image prompt/);
  return { render, json: JSON.parse(render.text.slice(render.text.indexOf("{"))) };
}

test("the render stage is background, person or text; person and text need an absolute base image", () => {
  assert.deepEqual(validateThumbnailStage({ stage: "background", base: "/x.png" }), { stage: "background" });
  assert.deepEqual(validateThumbnailStage({ stage: "person", base: BASE }), { stage: "person", base: BASE });
  assert.throws(() => validateThumbnailStage({ stage: "final" }), /stage must be one of background, person, text/);
  assert.throws(() => validateThumbnailStage({ stage: "text" }), /base must be an absolute PNG, JPEG or WebP path/);
  assert.throws(() => validateThumbnailStage({ stage: "person", base: "relativ/geheim.png" }), (error) => /base must be/.test(error.message) && !error.message.includes("geheim"));
  assert.throws(() => buildThumbnailImageInput(request(), planned(), "person"), /needs the approved previous layer/);
});

test("the background stage forbids person and text and sends only the inspiring thumbnails as style", () => {
  const { render, json } = stagePrompt("background");
  assert.deepEqual(render.images, ["/cache/AAAAAAAAAA2.jpg"]);
  assert.match(json.rule, /No person, no face, no hands, no text or letters/);
  assert.match(json.inputImages.style, /^Image 1: Outlier thumbnails from other creators, style reference only/);
  assert.match(json.emptyArea, /side where Chris will stand \(see composition\) calm and empty/);
  assert.equal(json.keyVisual, "Treppe");
  assert.equal(json.composition, "Drittel");
  assert.equal(json.canvas.aspectRatio, "16:9");
  assert.ok(json.avoid.includes("any person, face, hands or body parts"));
  assert.ok(json.avoid.includes("any text, letters or numbers"));
  assert.equal(json.look, undefined);
  assert.equal(json.text, undefined);
  assert.equal(render.text.includes("Größer denken"), false, "the words come later");
  assert.equal(render.text.includes(PERSON_LOOK.skin), false);
});

test("the person stage puts the approved background first, then the stills, and applies the person look", () => {
  const { render, json } = stagePrompt("person");
  assert.deepEqual(render.images, [BASE, "/stills/gesicht-06m56s-erklaerend.png", "/stills/gesicht-00m40s-aufmerksam.png"]);
  assert.match(json.inputImages.base, /^Image 1: the approved background\. Keep it unchanged except where Chris is placed/);
  assert.match(json.inputImages.face, /^Images 2-3: real photos of Chris/);
  assert.deepEqual(json.person, { subject: "Chris rechts", expression: "erklärend", composition: "Drittel" });
  assert.deepEqual(json.look, PERSON_LOOK);
  assert.match(json.look.skin, /never pale or grey/);
  assert.match(json.look.face, /3 to 5 percent narrower/);
  assert.match(json.look.identity, /clearly recognizable/);
  for (const item of ["pale or grey skin", "flat lighting", "wide-angle distortion of the face"]) assert.ok(json.avoid.includes(item), item);
  assert.match(json.rule, /No text/);
  assert.equal(render.text.includes("Größer denken"), false);
  assert.equal(render.text.includes("/stills/"), false, "paths travel as image input, not inside the prompt");
  assert.equal(render.text.includes(BASE), false);
});

test("the text stage sees only the approved person layer and adds exactly the overlay", () => {
  const { render, json } = stagePrompt("text");
  assert.deepEqual(render.images, [BASE]);
  assert.match(json.inputImages.base, /Change nothing else in the image/);
  assert.equal(json.text.content, "Größer denken");
  assert.match(json.text.rule, /spelled exactly as given including umlauts/);
  assert.equal(json.text.placement, "links oben");
  assert.equal(json.look, undefined);
  assert.equal(render.text.includes(PERSON_LOOK.face), false);
  assert.ok(json.avoid.includes("any words other than text.content"));
});

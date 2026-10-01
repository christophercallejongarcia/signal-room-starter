import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { draftCheckFrom, parseRatingRequest, rankDrafts } from "../lib/thumbnail-builder.ts";
import { markThumbnailReference } from "../lib/thumbnail-run.ts";
import { DRAFT_RECIPE_ORDER, draftChunks, isDraftRendering, rateThumbnailDraft, rerenderThumbnailDraft, runThumbnailDrafts } from "../lib/thumbnail-drafts.ts";
import { THUMBNAIL_RECIPE_NAMES } from "../lib/thumbnail-recipe-names.ts";
import { readRun } from "../lib/adapters/storage/thumbnail-store.ts";

const NOW = "2026-09-29T22:00:00.000Z";
const FACES = ["shooting-lachen-frontal", "signatur-studio"];

function png(width, height) {
  const rows = [];
  for (let y = 0; y < height; y += 1) rows.push(Buffer.from([0]), Buffer.alloc(width * 3, y));
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "ascii");
    return Buffer.concat([head, data, Buffer.alloc(4)]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

function draftVariant(number, recipe, layout = "person-right") {
  return {
    label: `Entwurf ${number}`,
    textOverlay: `Idee ${number}`,
    concept: "Gleiches Abo, anderes Ergebnis.",
    face: FACES[0],
    recipe,
    inspiredBy: [{ videoId: "AAAAAAAAAA1", borrowed: "Zwei Kacheln mit Plus." }],
    imagePrompt: {
      subject: "Chris rechts",
      expression: "lacht",
      text: { content: `Idee ${number}`, placement: "oben", style: "fett" },
      keyVisual: "Kacheln",
      background: "schwarz",
      composition: "rechts",
      palette: "Schwarz, Orange",
      styleNotes: "klar",
      avoid: [],
      elements: {
        layout,
        backdrop: "black",
        object: { kind: "logo-equation", description: "Claude-Kachel plus Team-Kachel" },
        textStyle: "sentence-chalk",
        textPlacement: "top",
        wardrobe: "hoodie-cream",
        gesture: "none",
      },
    },
  };
}

const goodCheck = {
  recognizable: true, textExact: true, wordCount: 3, elementCount: 3, cornerFree: true, numbersConsistent: true, skinOk: true,
  faceBigEnough: true, eyeContact: true, textClearOfFace: true, readableSmall: true, score: 8, notes: "Klar und warm.",
};

async function draftSetup(dir, { count = 4, render } = {}) {
  await markThumbnailReference({ videoId: "AAAAAAAAAA1" }, {
    listYoutubeOutliers: async () => [{
      id: "yt-AAAAAAAAAA1", videoId: "AAAAAAAAAA1", channelId: "UC1", channelTitle: "Kanal", title: "Outlier",
      thumbnailUrl: "https://i.ytimg.com/vi/AAAAAAAAAA1/maxresdefault.jpg", url: "https://www.youtube.com/watch?v=AAAAAAAAAA1",
      publishedAt: NOW, durationSeconds: 900, views: 1000, likes: 0, comments: 0, subscribers: 10, channelMedian: 100, baselineCount: 30,
      factor: 10, viewsPerSubscriber: 1, viewsPerDay: 1, market: "en", topics: [], queries: [], source: "search", measuredAt: NOW, firstSeenAt: NOW,
    }],
  }, { now: new Date(NOW), dir, fetch: async () => { throw new Error("offline"); } });
  const calls = [];
  const deps = {
    dir,
    inline: true,
    now: () => new Date(NOW),
    rules: async () => ({ text: "Regel 4: drei Elemente.", source: "regeln.md" }),
    faces: async () => FACES.map((id) => ({ id, path: `/stills/${id}.jpg` })),
    cacheReference: async (reference) => `/cache/${reference.videoId}.jpg`,
    bridge: async (route, body) => {
      calls.push([route, body]);
      if (route === "plan") {
        return { variants: Array.from({ length: body.count }, (_, index) => draftVariant(index + 1, index === 0 ? "logo-equation" : "icon-halo", index === 0 ? "no-person" : "person-right")) };
      }
      if (route === "check") return { check: body.textOverlay === "Idee 2" ? { ...goodCheck, elementCount: 5, score: 9 } : goodCheck };
      return render ? render(body) : { image: { mimeType: "image/png", data: png(48, 32).toString("base64") } };
    },
  };
  return { deps, calls, count };
}

test("a draft run plans many variants, renders each once and checks it", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "thumb-drafts-"));
  try {
    const { deps, calls } = await draftSetup(dir);
    const run = await runThumbnailDrafts({ title: "Die 6 Stufen", count: 4, direction: "Abo-Vergleich" }, deps);
    const [plan] = calls;
    assert.equal(plan[0], "plan");
    assert.deepEqual([plan[1].drafts, plan[1].count, plan[1].direction], [true, 4, "Abo-Vergleich"]);
    assert.deepEqual(plan[1].recipes, ["abo-comparison", "hands-presenting", "icon-halo", "word-behind-head"]);
    assert.equal(run.kind, "drafts");
    assert.ok(run.variants.every((variant) => variant.draft?.pending), "the route answers with pending drafts");
    const stored = await readRun(run.id, { dir });
    assert.equal(calls.filter(([route]) => route === "render").length, 4);
    assert.ok(calls.filter(([route]) => route === "render").every(([, body]) => body.stage === "draft" && body.variant.recipe));
    const checks = calls.filter(([route]) => route === "check");
    assert.equal(checks.length, 4);
    const checkOf = (text) => checks.find(([, body]) => body.textOverlay === text)[1];
    assert.equal(checkOf("Idee 1").withPerson, false, "a draft without Chris is checked without face photos");
    assert.equal(checkOf("Idee 1").faces, undefined);
    assert.equal(checkOf("Idee 2").faces.length, 2);
    assert.equal(checkOf("Idee 2").rules, "Regel 4: drei Elemente.");
    const [first, second] = stored.variants;
    assert.equal(first.draft.pending, undefined);
    assert.deepEqual([first.draft.width, first.draft.height], [48, 27]);
    assert.equal(first.draft.check.passed, true);
    assert.equal(second.draft.check.passed, false, "five focus areas fail the formula");
    assert.equal(rankDrafts(stored.variants)[0].id !== "variant-2", true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a failed draft keeps the error and can be rendered again; ratings are stored", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "thumb-drafts-"));
  try {
    let fail = true;
    const { deps } = await draftSetup(dir, {
      render: () => {
        if (fail) throw new Error("Codex did not generate a usable image.");
        return { image: { mimeType: "image/png", data: png(48, 27).toString("base64") } };
      },
    });
    const run = await runThumbnailDrafts({ title: "T", count: 3 }, deps);
    const failed = (await readRun(run.id, { dir })).variants[0];
    assert.match(failed.draft.error, /usable image/);
    fail = false;
    const again = await rerenderThumbnailDraft({ runId: run.id, variantId: failed.id }, deps);
    assert.ok(again.variants[0].draft.imageUrl && !again.variants[0].draft.error);
    const rated = await rateThumbnailDraft({ runId: run.id, variantId: failed.id, stars: 4, note: "Farbe gut" }, deps);
    assert.deepEqual(rated.variants[0].rating, { stars: 4, note: "Farbe gut", ratedAt: NOW });
    assert.throws(() => parseRatingRequest({ runId: run.id, variantId: failed.id, stars: 6 }), /1 to 5/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the check follows the hard criteria and a stale pending draft may render again", () => {
  assert.equal(draftCheckFrom({ check: goodCheck }, NOW).passed, true);
  assert.equal(draftCheckFrom({ check: { ...goodCheck, recognizable: false } }, NOW).passed, false);
  assert.equal(draftCheckFrom({ check: { ...goodCheck, recognizable: null, skinOk: null, faceBigEnough: null, eyeContact: null, textClearOfFace: null } }, NOW).passed, true, "no person, nothing to recognize");
  assert.equal(draftCheckFrom({ check: { ...goodCheck, eyeContact: false } }, NOW).passed, true, "eye contact is a should");
  assert.equal(draftCheckFrom({ check: { ...goodCheck, faceBigEnough: false } }, NOW).passed, false);
  assert.equal(draftCheckFrom({ check: { ...goodCheck, readableSmall: false } }, NOW).passed, false);
  assert.equal(draftCheckFrom({ check: { ...goodCheck, wordCount: 9 } }, NOW).passed, false);
  assert.equal(draftCheckFrom({ check: { ...goodCheck, cornerFree: false } }, NOW).passed, false);
  assert.equal(draftCheckFrom({}, NOW).passed, false);
  const fresh = { draft: { pending: true, renderedAt: NOW } };
  assert.equal(isDraftRendering(fresh, Date.parse(NOW) + 60_000), true);
  assert.equal(isDraftRendering(fresh, Date.parse(NOW) + 20 * 60_000), false);
});

test("twenty drafts plan in four chunks with Chris' idea twice; the order covers every recipe", async () => {
  const { THUMBNAIL_RECIPES } = await import("../bridge/thumbnails.mjs");
  const chunks = draftChunks(20);
  assert.deepEqual(chunks.map((chunk) => chunk.length), [5, 5, 5, 5]);
  assert.equal(chunks.flat().filter((id) => id === "abo-comparison").length, 2);
  assert.deepEqual([...new Set(DRAFT_RECIPE_ORDER)].sort(), Object.keys(THUMBNAIL_RECIPES).sort());
  assert.deepEqual(Object.keys(THUMBNAIL_RECIPE_NAMES).sort(), Object.keys(THUMBNAIL_RECIPES).sort(), "every recipe has a name in Cover Lab");
  assert.deepEqual(draftChunks(3), [["abo-comparison", "hands-presenting", "icon-halo"]]);
  assert.deepEqual(draftChunks(3, ["tier-cards", "ui-toggle"]), [["tier-cards", "ui-toggle", "tier-cards"]], "picked formats fill the slots");
});

test("variant ids go up to 20 for draft runs and stay path-safe", async () => {
  const { isThumbnailVariantId } = await import("../lib/thumbnail-builder.ts");
  for (const id of ["variant-1", "variant-9", "variant-10", "variant-20"]) assert.equal(isThumbnailVariantId(id), true, id);
  for (const id of ["variant-0", "variant-21", "variant-01", "variant-1/../x"]) assert.equal(isThumbnailVariantId(id), false, id);
});

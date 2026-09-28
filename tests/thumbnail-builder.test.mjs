import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";
import {
  THUMBNAIL_REFERENCES_MAX,
  inspirationFor,
  isThumbnailRunId,
  newThumbnailRunId,
  parseRenderImage,
  parseRenderRequest,
  parseThumbnailPlan,
  parseThumbnailRequest,
  pickReferences,
  thumbnailReferenceNote,
} from "../lib/thumbnail-builder.ts";
import {
  REFERENCE_LIBRARY_MAX,
  addReference,
  normalizeLibrary,
  parseReferenceMark,
  referenceFromOutlier,
  removeReference,
} from "../lib/thumbnail-library.ts";
import { loadFaceReferences, faceReferenceStatus } from "../lib/face-references.ts";
import { markThumbnailReference, rerenderThumbnailVariant, runThumbnailBuilder, thumbnailLibraryView, unmarkThumbnailReference } from "../lib/thumbnail-run.ts";
import { readLibrary, readRun } from "../lib/adapters/storage/thumbnail-store.ts";
import { pngSize } from "../lib/cover-crop.ts";

const NOW = "2026-09-28T20:00:00.000Z";
const FACES = ["gesicht-00m40s-aufmerksam", "gesicht-06m56s-erklaerend"];

function outlier(videoId, factor = 12, extra = {}) {
  return {
    id: `yt-${videoId}`,
    videoId,
    channelId: "UC123",
    channelTitle: "Kanal",
    title: `Outlier ${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    publishedAt: "2026-09-01T00:00:00.000Z",
    durationSeconds: 900,
    views: 120_000,
    likes: 1,
    comments: 1,
    subscribers: 10_000,
    channelMedian: 10_000,
    baselineCount: 30,
    factor,
    viewsPerSubscriber: 12,
    viewsPerDay: 4_000,
    market: "en",
    topics: ["claude"],
    queries: ["Claude Code"],
    source: "search",
    measuredAt: NOW,
    firstSeenAt: NOW,
    ...extra,
  };
}

function planVariant(number, extra = {}) {
  return {
    label: `Variante ${number}`,
    textOverlay: number === 1 ? "Stufe 1 bis 6" : `Idee ${number}`,
    concept: "Treppe mit sechs Stufen, Chris zeigt auf die oberste.",
    face: FACES[0],
    inspiredBy: [{ videoId: "AAAAAAAAAA1", borrowed: "Großes Gesicht rechts, Pfeil zum Objekt." }],
    imagePrompt: {
      subject: "Chris rechts im Bild",
      expression: "aufmerksam",
      text: { content: "Stufe 1 bis 6", placement: "links oben", style: "fett, weiß auf schwarz" },
      keyVisual: "Treppe mit genau sechs Stufen",
      background: "dunkles Studio",
      composition: "Gesicht rechts, Text links",
      palette: "Schwarz, Koralle",
      styleNotes: "hoher Kontrast",
      avoid: ["Logos"],
    },
    ...extra,
  };
}

/** A tiny 3:2 PNG (RGB, filter None) so the crop runs on real bytes. */
function png(width, height) {
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(Buffer.from([0]), Buffer.alloc(width * 3, y));
  }
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
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function tempDir() {
  return mkdtemp(path.join(tmpdir(), "thumb-builder-test-"));
}

test("the request needs a title, bounds the brief and accepts at most eight YouTube ids", () => {
  assert.deepEqual(parseThumbnailRequest({ title: "  Die 6 Stufen  ", brief: "Hook\r\n\r\n\r\nStufe 1" }), {
    title: "Die 6 Stufen",
    brief: "Hook\n\nStufe 1",
    referenceIds: [],
  });
  assert.throws(() => parseThumbnailRequest({ title: " " }), /title is required/);
  assert.throws(() => parseThumbnailRequest({ title: "T", referenceIds: ["../etc/passwd"] }), /11-character/);
  const many = Array.from({ length: THUMBNAIL_REFERENCES_MAX + 1 }, (_, index) => `AAAAAAAAA${String(index).padStart(2, "0")}`);
  assert.throws(() => parseThumbnailRequest({ title: "T", referenceIds: many }), /at most 8/);
});

test("references come from the library only; no pick means the newest marks", () => {
  const library = ["AAAAAAAAAA1", "AAAAAAAAAA2"].map((id) => referenceFromOutlier(outlier(id), NOW));
  assert.deepEqual(pickReferences(library, []).map((entry) => entry.videoId), ["AAAAAAAAAA1", "AAAAAAAAAA2"]);
  assert.deepEqual(pickReferences(library, ["AAAAAAAAAA2"]).map((entry) => entry.videoId), ["AAAAAAAAAA2"]);
  assert.throws(() => pickReferences(library, ["BBBBBBBBBB1"]), /Not in the reference library/);
});

test("the plan keeps only offered Outliers and known stills, and caps the overlay at four words", () => {
  const options = { referenceIds: ["AAAAAAAAAA1"], faces: FACES };
  const plan = parseThumbnailPlan({ variants: [planVariant(1), planVariant(2), planVariant(3)] }, options);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan[0].inspiredBy, [{ videoId: "AAAAAAAAAA1", borrowed: "Großes Gesicht rechts, Pfeil zum Objekt." }]);
  assert.throws(() => parseThumbnailPlan({ variants: [planVariant(1), planVariant(2)] }, options), /exactly 3/);
  assert.throws(() => parseThumbnailPlan({ variants: [planVariant(1, { face: "fremdes-gesicht" }), planVariant(2), planVariant(3)] }, options), /unknown face/);
  assert.throws(
    () => parseThumbnailPlan({ variants: [planVariant(1, { inspiredBy: [{ videoId: "ZZZZZZZZZZ9", borrowed: "x" }] }), planVariant(2), planVariant(3)] }, options),
    /names no Outlier/,
  );
  assert.throws(() => parseThumbnailPlan({ variants: [planVariant(1, { textOverlay: "eins zwei drei vier fünf" }), planVariant(2), planVariant(3)] }, options), /four overlay words/);
});

test("the render answer must be base64 image bytes", () => {
  assert.deepEqual(parseRenderImage({ image: { mimeType: "image/png", data: "iVBORw0KGgo=" } }), { mimeType: "image/png", data: "iVBORw0KGgo=" });
  assert.throws(() => parseRenderImage({ image: { mimeType: "image/svg+xml", data: "PHN2Zz4=" } }), /PNG, JPEG or WebP/);
  assert.throws(() => parseRenderImage({ image: { mimeType: "image/png", data: "not base64!" } }), /invalid/);
  assert.throws(() => parseRenderRequest({ runId: "../../x", variantId: "variant-1" }), /runId/);
});

test("run ids are sortable and path-safe", () => {
  const id = newThumbnailRunId(new Date(NOW), () => 0.5);
  assert.equal(id, "run-20260928T200000Z-ssssss");
  assert.ok(isThumbnailRunId(id));
  assert.equal(isThumbnailRunId("run-../../etc"), false);
});

test("the library stores a snapshot, keeps one row per video and removes by id", () => {
  const first = referenceFromOutlier(outlier("AAAAAAAAAA1", 12), NOW);
  assert.equal(first.url, "https://www.youtube.com/watch?v=AAAAAAAAAA1");
  assert.throws(() => referenceFromOutlier(outlier("AAAAAAAAAA2", 5, { thumbnailUrl: "https://evil.example/x.jpg" }), NOW), /i\.ytimg\.com/);
  let library = addReference({ references: [] }, first);
  library = addReference(library, referenceFromOutlier(outlier("AAAAAAAAAA2"), NOW));
  library = addReference(library, { ...first, factor: 20 });
  assert.deepEqual(library.references.map((entry) => [entry.videoId, entry.factor]), [["AAAAAAAAAA1", 20], ["AAAAAAAAAA2", 12]]);
  const { library: after, removed } = removeReference(library, "AAAAAAAAAA1");
  assert.equal(removed, true);
  assert.deepEqual(after.references.map((entry) => entry.videoId), ["AAAAAAAAAA2"]);
  assert.equal(removeReference(after, "AAAAAAAAAA1").removed, false);
  const full = { references: Array.from({ length: REFERENCE_LIBRARY_MAX }, (_, index) => ({ ...first, videoId: `B${String(index).padStart(10, "0")}` })) };
  assert.throws(() => addReference(full, referenceFromOutlier(outlier("CCCCCCCCCC1"), NOW)), /at most 60/);
  assert.deepEqual(normalizeLibrary({ references: [first, first, { videoId: "x" }] }).references.length, 1);
  assert.throws(() => parseReferenceMark({ videoId: "short" }), /11-character/);
});

test("face stills come from the configured folder only, as images, never a path in the status", async () => {
  const dir = await tempDir();
  try {
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    await writeFile(path.join(dir, "gesicht-00m40s-aufmerksam.png"), header);
    await writeFile(path.join(dir, "gesicht-06m56s-erklaerend.png"), header);
    await writeFile(path.join(dir, "kontaktbogen.png"), Buffer.from("not an image"));
    await writeFile(path.join(dir, "notizen.txt"), "x");
    assert.deepEqual(await loadFaceReferences({}), []);
    assert.deepEqual((await loadFaceReferences({ SIGNAL_ROOM_FACE_DIR: dir })).map((face) => face.id), FACES);
    const picked = await loadFaceReferences({ SIGNAL_ROOM_FACE_DIR: dir, SIGNAL_ROOM_FACE_FILES: "gesicht-06m56s-erklaerend.png" });
    assert.deepEqual(picked, [{ id: FACES[1], path: path.join(dir, "gesicht-06m56s-erklaerend.png") }]);
    await assert.rejects(loadFaceReferences({ SIGNAL_ROOM_FACE_DIR: dir, SIGNAL_ROOM_FACE_FILES: "../x.png" }), /plain file names/);
    await assert.rejects(loadFaceReferences({ SIGNAL_ROOM_FACE_DIR: "relativ/ordner" }), /absolute/);
    const status = await faceReferenceStatus({ SIGNAL_ROOM_FACE_DIR: dir });
    assert.deepEqual(status, { configured: true, count: 2, labels: FACES });
    assert.equal(JSON.stringify(status).includes(dir), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function libraryStorage(videos) {
  return { listYoutubeOutliers: async (query = {}) => videos.filter((video) => video.factor >= (query.minFactor ?? 3) && (!query.market || video.market === query.market)) };
}

test("marking reads the Outlier from storage, removing drops it again", async () => {
  const dir = await tempDir();
  try {
    const storage = libraryStorage([outlier("AAAAAAAAAA1", 12), outlier("AAAAAAAAAA2", 2)]);
    const noFetch = async () => { throw new Error("offline"); };
    const reference = await markThumbnailReference({ videoId: "AAAAAAAAAA1" }, storage, { now: new Date(NOW), dir, fetch: noFetch });
    assert.equal(reference.factor, 12);
    await assert.rejects(markThumbnailReference({ videoId: "AAAAAAAAAA2" }, storage, { dir, fetch: noFetch }), /not an Outlier from 3x/);
    const view = await thumbnailLibraryView(storage, { dir });
    assert.deepEqual(view.references.map((entry) => entry.videoId), ["AAAAAAAAAA1"]);
    assert.deepEqual(view.suggestions, []);
    await unmarkThumbnailReference("AAAAAAAAAA1", { dir });
    assert.deepEqual((await readLibrary({ dir })).references, []);
    await assert.rejects(unmarkThumbnailReference("AAAAAAAAAA1", { dir }), /not in the library/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a run plans once, renders three variants in parallel, crops to 16:9 and names its Outliers", async () => {
  const dir = await tempDir();
  try {
    const storage = libraryStorage([outlier("AAAAAAAAAA1", 12)]);
    await markThumbnailReference({ videoId: "AAAAAAAAAA1" }, storage, { now: new Date(NOW), dir, fetch: async () => { throw new Error("offline"); } });
    const calls = [];
    let renders = 0;
    const deps = {
      dir,
      now: () => new Date(NOW),
      faces: async () => FACES.map((id) => ({ id, path: `/stills/${id}.png` })),
      cacheReference: async (reference) => `/cache/${reference.videoId}.jpg`,
      bridge: async (route, body) => {
        calls.push([route, body]);
        if (route === "plan") return { variants: [planVariant(1), planVariant(2), planVariant(3)] };
        renders += 1;
        if (renders === 3) throw new Error("Codex did not save a usable cover image.");
        return { image: { mimeType: "image/png", data: png(48, 32).toString("base64") } };
      },
    };
    const run = await runThumbnailBuilder({ title: "Die 6 Stufen", brief: "Skript" }, deps);
    assert.equal(calls[0][0], "plan");
    assert.deepEqual(calls[0][1].faces.map((face) => face.id), FACES);
    assert.deepEqual(calls[0][1].references.map((reference) => [reference.id, reference.path]), [["AAAAAAAAAA1", "/cache/AAAAAAAAAA1.jpg"]]);
    assert.equal(calls.filter(([route]) => route === "render").length, 3);
    assert.equal(run.variants.length, 3);
    const [first] = run.variants;
    assert.equal(first.inspiredBy[0].title, "Outlier AAAAAAAAAA1");
    assert.equal(first.inspiredBy[0].url, "https://www.youtube.com/watch?v=AAAAAAAAAA1");
    assert.deepEqual([first.width, first.height], [48, 27]);
    assert.deepEqual(pngSize(await readFile(path.join(dir, "runs", run.id, "variant-1.png"))), { width: 48, height: 27 });
    const failed = run.variants.find((variant) => variant.error);
    assert.ok(failed && !failed.imageUrl, "a failed render keeps its plan without an image");
    assert.deepEqual(await readRun(run.id, { dir }), run);

    const again = await rerenderThumbnailVariant({ runId: run.id, variantId: failed.id }, deps);
    const fixed = again.variants.find((variant) => variant.id === failed.id);
    assert.ok(fixed.imageUrl && !fixed.error);

    const note = thumbnailReferenceNote(again, { "variant-1": "variante-1.png" });
    assert.match(note, /## Variante 1: Variante 1/);
    assert.match(note, /Datei: variante-1\.png/);
    assert.match(note, /Outlier AAAAAAAAAA1 \(Kanal\), 12,0x Kanal-Median, 120\.000 Aufrufe/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a run refuses an empty library and missing stills before calling the Bridge", async () => {
  const dir = await tempDir();
  try {
    const bridge = async () => { throw new Error("must not be called"); };
    await assert.rejects(runThumbnailBuilder({ title: "T" }, { dir, bridge, faces: async () => [] }), /library is empty/);
    await markThumbnailReference({ videoId: "AAAAAAAAAA1" }, libraryStorage([outlier("AAAAAAAAAA1")]), { dir, fetch: async () => { throw new Error("offline"); } });
    await assert.rejects(runThumbnailBuilder({ title: "T" }, { dir, bridge, faces: async () => [] }), /SIGNAL_ROOM_FACE_DIR/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("inspiration joins the planner's ids with the library snapshot", () => {
  const references = [referenceFromOutlier(outlier("AAAAAAAAAA1", 7.5), NOW)];
  assert.deepEqual(inspirationFor([{ videoId: "AAAAAAAAAA1", borrowed: "Pfeil" }, { videoId: "ZZZZZZZZZZ9", borrowed: "x" }], references), [{
    videoId: "AAAAAAAAAA1",
    title: "Outlier AAAAAAAAAA1",
    channelTitle: "Kanal",
    url: "https://www.youtube.com/watch?v=AAAAAAAAAA1",
    thumbnailUrl: "https://i.ytimg.com/vi/AAAAAAAAAA1/maxresdefault.jpg",
    factor: 7.5,
    views: 120_000,
    borrowed: "Pfeil",
  }]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";
import {
  THUMBNAIL_REFERENCES_MAX,
  inspirationFor,
  isThumbnailRunId,
  newThumbnailRunId,
  parseRenderImage,
  parseStageRequest,
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
  youtubeVideoIdFrom,
} from "../lib/thumbnail-library.ts";
import { loadFaceReferences, faceReferenceStatus } from "../lib/face-references.ts";
import {
  approveThumbnailStage,
  chooseThumbnailVariant,
  loadThumbnailRules,
  markThumbnailReference,
  renderThumbnailStage,
  runThumbnailBuilder,
  thumbnailLibraryView,
  unmarkThumbnailReference,
} from "../lib/thumbnail-run.ts";
import { exportRun, readLibrary, readRun, readVariantImage, saveRun } from "../lib/adapters/storage/thumbnail-store.ts";
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
    direction: "",
    referenceIds: [],
  });
  assert.equal(parseThumbnailRequest({ title: "T", direction: "  Sechs Kacheln  " }).direction, "Sechs Kacheln");
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
  assert.throws(() => parseStageRequest({ runId: "../../x", variantId: "variant-1", stage: "background" }), /runId/);
  assert.throws(() => parseStageRequest({ runId: "run-20260928T200000Z-abcdef", variantId: "variant-1", stage: "../x" }), /stage must be one of/);
  assert.deepEqual(parseStageRequest({ runId: "run-20260928T200000Z-abcdef", variantId: "variant-2", stage: "person" }), {
    runId: "run-20260928T200000Z-abcdef",
    variantId: "variant-2",
    stage: "person",
  });
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

test("a link Chris pasted becomes a manual reference with his note, looked up on YouTube", async () => {
  const dir = await tempDir();
  try {
    assert.equal(youtubeVideoIdFrom("https://www.youtube.com/watch?v=KBgZsV-0Fdo&t=3s"), "KBgZsV-0Fdo");
    assert.equal(youtubeVideoIdFrom("https://youtu.be/KBgZsV-0Fdo"), "KBgZsV-0Fdo");
    assert.equal(youtubeVideoIdFrom("https://evil.example/watch?v=KBgZsV-0Fdo"), null);
    const noFetch = async () => { throw new Error("offline"); };
    const lookup = async (videoId) => videoId === "KBgZsV-0Fdo"
      ? { videoId, title: "The 6 Claude Features", channelTitle: "Tristen O'Brien", thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, views: 1_300_000, publishedAt: NOW }
      : null;
    const storage = libraryStorage([]);
    const reference = await markThumbnailReference({ manual: true, url: "https://youtu.be/KBgZsV-0Fdo", note: "Helles Licht, echtes Lachen" }, storage, { now: new Date(NOW), dir, fetch: noFetch, lookup });
    assert.deepEqual([reference.source, reference.factor, reference.note, reference.channelTitle], ["manual", 0, "Helles Licht, echtes Lachen", "Tristen O'Brien"]);
    await assert.rejects(markThumbnailReference({ manual: true, url: "https://youtu.be/ZZZZZZZZZZ9" }, storage, { dir, fetch: noFetch, lookup }), /no public video/);
    await assert.rejects(markThumbnailReference({ manual: true, url: "keine url" }, storage, { dir, fetch: noFetch, lookup }), /YouTube video link/);
    const note = thumbnailReferenceNote({
      id: "run-20260929T200000Z-aaaaaa", title: "T", briefExcerpt: "", aspectRatio: "16:9", createdAt: NOW, referenceIds: [], faceCount: 1,
      variants: [{ ...planVariant(1), id: "variant-1", inspiredBy: inspirationFor([{ videoId: "KBgZsV-0Fdo", borrowed: "Lachen" }], [reference]) }],
    }, {});
    assert.match(note, /Tristen O'Brien\), von Chris gewählt, 1\.300\.000 Aufrufe/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("thumbnail rules come from an absolute Markdown file and are bounded", async () => {
  const dir = await tempDir();
  try {
    const file = path.join(dir, "thumbnails-kurzfassung.md");
    await writeFile(file, "# Regeln\r\n\r\n1. Mobil lesbar.\n");
    assert.deepEqual(await loadThumbnailRules({ SIGNAL_ROOM_THUMBNAIL_RULES: file }), { text: "# Regeln\n\n1. Mobil lesbar.", source: "thumbnails-kurzfassung.md" });
    assert.equal(await loadThumbnailRules({}), undefined);
    assert.equal(await loadThumbnailRules({ SIGNAL_ROOM_THUMBNAIL_RULES: "relativ.md" }), undefined);
    assert.equal(await loadThumbnailRules({ SIGNAL_ROOM_THUMBNAIL_RULES: path.join(dir, "fehlt.md") }), undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function renderAnswer() {
  return { image: { mimeType: "image/png", data: png(48, 32).toString("base64") } };
}

/** Library with one marked Outlier plus Bridge, stills and cache fakes; `calls` records every Bridge call. */
async function builderDeps(dir, render = async () => renderAnswer()) {
  await markThumbnailReference({ videoId: "AAAAAAAAAA1" }, libraryStorage([outlier("AAAAAAAAAA1", 12)]), { now: new Date(NOW), dir, fetch: async () => { throw new Error("offline"); } });
  const calls = [];
  let tick = 0;
  const deps = {
    dir,
    // Every call a new second, so re-renders get a new renderedAt.
    now: () => new Date(Date.parse(NOW) + 1000 * tick++),
    faces: async () => FACES.map((id) => ({ id, path: `/stills/${id}.png` })),
    cacheReference: async (reference) => `/cache/${reference.videoId}.jpg`,
    bridge: async (route, body) => {
      calls.push([route, body]);
      if (route === "plan") return { variants: [planVariant(1), planVariant(2), planVariant(3)] };
      return render(body);
    },
  };
  return { deps, calls };
}

async function exists(file) {
  return Boolean(await stat(file).catch(() => null));
}

test("a run plans once, renders only the three backgrounds in parallel, crops to 16:9 and names its Outliers", async () => {
  const dir = await tempDir();
  try {
    let renders = 0;
    const { deps, calls } = await builderDeps(dir, async () => {
      renders += 1;
      if (renders === 3) throw new Error("Codex did not save a usable cover image.");
      return renderAnswer();
    });
    const run = await runThumbnailBuilder({ title: "Die 6 Stufen", brief: "Skript" }, deps);
    assert.equal(calls[0][0], "plan");
    assert.deepEqual(calls[0][1].faces.map((face) => face.id), FACES);
    assert.deepEqual(calls[0][1].references.map((reference) => [reference.id, reference.path]), [["AAAAAAAAAA1", "/cache/AAAAAAAAAA1.jpg"]]);
    const renderCalls = calls.filter(([route]) => route === "render");
    assert.equal(renderCalls.length, 3);
    assert.ok(renderCalls.every(([, body]) => body.stage === "background" && body.base === undefined));
    assert.equal(run.variants.length, 3);
    const [first] = run.variants;
    assert.equal(first.inspiredBy[0].title, "Outlier AAAAAAAAAA1");
    assert.equal(first.inspiredBy[0].url, "https://www.youtube.com/watch?v=AAAAAAAAAA1");
    assert.deepEqual(Object.keys(first.layers), ["background"]);
    assert.deepEqual([first.layers.background.width, first.layers.background.height], [48, 27]);
    assert.match(first.layers.background.imageUrl, /\/image\/run-[^/]+\/variant-1\?stage=background&v=/);
    assert.equal(first.imagePath, undefined, "new runs carry no legacy image");
    assert.deepEqual(pngSize(await readFile(path.join(dir, "runs", run.id, "variant-1-background.png"))), { width: 48, height: 27 });
    const failed = run.variants.find((variant) => variant.layers.background.error);
    assert.ok(failed && !failed.layers.background.imageUrl, "a failed render keeps its plan and the error on the layer");
    assert.deepEqual(await readRun(run.id, { dir }), run);

    const again = await renderThumbnailStage({ runId: run.id, variantId: failed.id, stage: "background" }, deps);
    const fixed = again.variants.find((variant) => variant.id === failed.id).layers.background;
    assert.ok(fixed.imageUrl && !fixed.error);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("layers render strictly in order, each on the approved previous layer, and a variant is chosen after text", async () => {
  const dir = await tempDir();
  try {
    const { deps, calls } = await builderDeps(dir);
    const run = await runThumbnailBuilder({ title: "Die 6 Stufen" }, deps);
    const target = { runId: run.id, variantId: "variant-1" };
    const folder = path.join(dir, "runs", run.id);

    await assert.rejects(renderThumbnailStage({ ...target, stage: "person" }, deps), (error) => error.status === 409 && /Approve the background/.test(error.message));
    await assert.rejects(renderThumbnailStage({ ...target, stage: "text" }, deps), (error) => error.status === 409 && /Approve the person/.test(error.message));
    await assert.rejects(approveThumbnailStage({ ...target, stage: "person" }, deps), (error) => error.status === 409);
    await assert.rejects(chooseThumbnailVariant(target, deps), (error) => error.status === 409 && /approved text layer/.test(error.message));

    let state = await approveThumbnailStage({ ...target, stage: "background" }, deps);
    assert.ok(state.variants[0].layers.background.approvedAt);
    state = await renderThumbnailStage({ ...target, stage: "person" }, deps);
    let [route, body] = calls.at(-1);
    assert.equal(route, "render");
    assert.equal(body.stage, "person");
    assert.equal(body.base, path.join(folder, "variant-1-background.png"), "the approved background is the base image");
    assert.equal(body.variant.face, FACES[0]);
    await assert.rejects(renderThumbnailStage({ ...target, stage: "text" }, deps), (error) => error.status === 409, "person is rendered, not approved");

    await approveThumbnailStage({ ...target, stage: "person" }, deps);
    state = await renderThumbnailStage({ ...target, stage: "text" }, deps);
    [, body] = calls.at(-1);
    assert.equal(body.stage, "text");
    assert.equal(body.base, path.join(folder, "variant-1-person.png"));
    assert.deepEqual(Object.keys(state.variants[0].layers), ["background", "person", "text"]);
    assert.ok(await readVariantImage(run.id, "variant-1", { dir, stage: "text" }));
    assert.equal(await readVariantImage(run.id, "variant-1", { dir, stage: "../run" }), null);

    await approveThumbnailStage({ ...target, stage: "text" }, deps);
    state = await chooseThumbnailVariant(target, deps);
    assert.equal(state.chosenVariantId, "variant-1");

    const target2 = { dir: path.join(dir, "ablage") };
    const exported = await exportRun(run.id, target2.dir, { dir });
    assert.deepEqual(exported.files, [path.join(target2.dir, "variante-1.png")], "only the approved text layer is exported");
    const note = await readFile(exported.note, "utf8");
    assert.match(note, /Gewählt von Chris: Variante 1\./);
    assert.match(note, /## Variante 1: Variante 1 \(Gewählt von Chris\)/);
    assert.match(note, /## Variante 2: Variante 2\n\nDatei: Text-Ebene noch nicht freigegeben/);
    assert.match(note, /Outlier AAAAAAAAAA1 \(Kanal\), 12,0x Kanal-Median, 120\.000 Aufrufe/);

    // Rendering person again drops text with its file and clears the choice.
    state = await renderThumbnailStage({ ...target, stage: "person" }, deps);
    const layers = state.variants[0].layers;
    assert.deepEqual(Object.keys(layers), ["background", "person"]);
    assert.equal(layers.person.approvedAt, undefined);
    assert.ok(layers.background.approvedAt, "earlier layers stay approved");
    assert.equal(state.chosenVariantId, undefined);
    assert.equal(await exists(path.join(folder, "variant-1-text.png")), false);
    assert.equal(await exists(path.join(folder, "variant-1-person.png")), true);
    assert.deepEqual(await readRun(run.id, { dir }), state);
    await assert.rejects(chooseThumbnailVariant(target, deps), (error) => error.status === 409);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a failed re-render keeps the rendered layer; a failed first render stores the error, which cannot be approved", async () => {
  const dir = await tempDir();
  try {
    let fail = false;
    const { deps } = await builderDeps(dir, async () => {
      if (fail) throw new Error("Codex did not save a usable cover image.");
      return renderAnswer();
    });
    const run = await runThumbnailBuilder({ title: "T" }, deps);
    const target = { runId: run.id, variantId: "variant-2" };
    fail = true;
    await assert.rejects(renderThumbnailStage({ ...target, stage: "background" }, deps), (error) => error.status === 502);
    assert.deepEqual(await readRun(run.id, { dir }), run, "nothing changed");

    await approveThumbnailStage({ ...target, stage: "background" }, deps);
    await assert.rejects(renderThumbnailStage({ ...target, stage: "person" }, deps), (error) => error.status === 502);
    const stored = (await readRun(run.id, { dir })).variants[1].layers;
    assert.equal(stored.person.error, "Codex did not save a usable cover image.");
    assert.equal(stored.person.imagePath, undefined);
    await assert.rejects(approveThumbnailStage({ ...target, stage: "person" }, deps), (error) => error.status === 409 && /no rendered image/.test(error.message));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("renders of different variants finish in parallel without losing each other's layer", async () => {
  const dir = await tempDir();
  try {
    const { deps } = await builderDeps(dir, (body) => new Promise((resolve) => setTimeout(() => resolve(renderAnswer()), 10)));
    const run = await runThumbnailBuilder({ title: "T" }, deps);
    for (const variantId of ["variant-1", "variant-2"]) await approveThumbnailStage({ runId: run.id, variantId, stage: "background" }, deps);
    await Promise.all(["variant-1", "variant-2"].map((variantId) => renderThumbnailStage({ runId: run.id, variantId, stage: "person" }, deps)));
    const stored = await readRun(run.id, { dir });
    assert.ok(stored.variants[0].layers.person?.imagePath);
    assert.ok(stored.variants[1].layers.person?.imagePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a person render whose background was rendered again meanwhile is discarded", async () => {
  const dir = await tempDir();
  try {
    let release;
    const held = new Promise((resolve) => { release = resolve; });
    const { deps } = await builderDeps(dir, async (body) => {
      if (body.stage === "person") await held;
      return renderAnswer();
    });
    const run = await runThumbnailBuilder({ title: "T" }, deps);
    const target = { runId: run.id, variantId: "variant-1" };
    await approveThumbnailStage({ ...target, stage: "background" }, deps);
    const person = renderThumbnailStage({ ...target, stage: "person" }, deps);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await renderThumbnailStage({ ...target, stage: "background" }, deps);
    release();
    await assert.rejects(person, (error) => error.status === 409 && /changed while person was rendering/.test(error.message));
    assert.equal((await readRun(run.id, { dir })).variants[0].layers.person, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a run from before the layer flow stays readable, can be chosen and exported, but has no layer actions", async () => {
  const dir = await tempDir();
  try {
    const runId = "run-20260928T200008Z-3wqmu5";
    const [first] = parseThumbnailPlan({ variants: [planVariant(1), planVariant(2), planVariant(3)] }, { referenceIds: ["AAAAAAAAAA1"], faces: FACES });
    const legacy = {
      id: runId,
      title: "Alter Lauf",
      briefExcerpt: "",
      aspectRatio: "16:9",
      createdAt: NOW,
      referenceIds: ["AAAAAAAAAA1"],
      faceCount: 2,
      variants: [{
        ...first,
        id: "variant-1",
        inspiredBy: inspirationFor(first.inspiredBy, [referenceFromOutlier(outlier("AAAAAAAAAA1"), NOW)]),
        imagePath: `data/youtube-thumbnails/runs/${runId}/variant-1.png`,
        imageUrl: `/api/youtube/thumbnails/image/${runId}/variant-1?v=x`,
        width: 48,
        height: 27,
        renderedAt: NOW,
      }],
    };
    await saveRun(legacy, { dir });
    await mkdir(path.join(dir, "runs", runId), { recursive: true });
    await writeFile(path.join(dir, "runs", runId, "variant-1.png"), png(48, 27));
    assert.deepEqual(await readRun(runId, { dir }), legacy);
    assert.ok(await readVariantImage(runId, "variant-1", { dir }), "no stage serves the finished image");
    assert.equal(await readVariantImage(runId, "variant-1", { dir, stage: "background" }), null);

    const deps = { dir, bridge: async () => { throw new Error("must not be called"); }, faces: async () => FACES.map((id) => ({ id, path: `/stills/${id}.png` })) };
    await assert.rejects(renderThumbnailStage({ runId, variantId: "variant-1", stage: "background" }, deps), (error) => error.status === 409 && /read-only/.test(error.message));
    await assert.rejects(approveThumbnailStage({ runId, variantId: "variant-1", stage: "background" }, deps), (error) => error.status === 409);
    const chosen = await chooseThumbnailVariant({ runId, variantId: "variant-1" }, deps);
    assert.equal(chosen.chosenVariantId, "variant-1");

    const target = path.join(dir, "ablage");
    const exported = await exportRun(runId, target, { dir });
    assert.deepEqual(exported.files, [path.join(target, "variante-1.png")]);
    assert.match(thumbnailReferenceNote(chosen, { "variant-1": "variante-1.png" }), /## Variante 1: Variante 1 \(Gewählt von Chris\)\n\nDatei: variante-1\.png/);
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

import { STRATEGY_BRIDGE_URL } from "./config.ts";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cropPngToRatio } from "./cover-crop.ts";
import { createYoutubeClient, fetchVideos, YoutubeKeyMissingError } from "./adapters/sources/youtube-data-api.ts";
import { loadFaceReferences, type FaceReference } from "./face-references.ts";
import {
  THUMBNAIL_VARIANT_COUNT,
  finishedImage,
  hasLayerImage,
  inspirationFor,
  isLegacyVariant,
  laterStages,
  newThumbnailRunId,
  parseRenderImage,
  parseStageRequest,
  parseThumbnailPlan,
  parseThumbnailRequest,
  parseVariantRequest,
  pickReferences,
  previousStage,
  stageBlocker,
  thumbnailImageUrl,
  type ThumbnailLayer,
  type ThumbnailPlanVariant,
  type ThumbnailRun,
  type ThumbnailImageKind,
  type ThumbnailStage,
  type ThumbnailVariant,
} from "./thumbnail-builder.ts";
import type { StorageAdapter, YoutubeVideo } from "./contracts.ts";
import {
  REFERENCE_MIN_FACTOR,
  addReference,
  isYoutubeThumbnailUrl,
  isYoutubeVideoId,
  manualReference,
  parseReferenceMark,
  referenceFromOutlier,
  removeReference,
  type ThumbnailReference,
} from "./thumbnail-library.ts";
import * as store from "./adapters/storage/thumbnail-store.ts";

export class ThumbnailRunError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ThumbnailRunError";
    this.status = status;
  }
}

export type BridgeReference = { id: string; title: string; channelTitle: string; factor: number; views: number; source?: "manual"; note?: string; path: string };
export type BridgeInput = { video: { title: string; brief?: string }; references: BridgeReference[]; faces: FaceReference[]; rules?: string; direction?: string; textByCode?: boolean };

/** Chris' thumbnail playbook, short form, sent to the planner as binding rules. */
export const THUMBNAIL_RULES_MAX = 8_000;

/**
 * Reads the rule file named in SIGNAL_ROOM_THUMBNAIL_RULES (an absolute
 * Markdown path, e.g. the YT-OS playbook). Unset or unreadable means no rules;
 * a run never fails over it.
 */
export async function loadThumbnailRules(env: Record<string, string | undefined> = process.env) {
  const file = env.SIGNAL_ROOM_THUMBNAIL_RULES?.trim();
  if (!file || !path.isAbsolute(file) || path.extname(file).toLowerCase() !== ".md") return undefined;
  const text = await readFile(file, "utf8").catch(() => "");
  const bounded = text.replace(/\r\n?/g, "\n").trim().slice(0, THUMBNAIL_RULES_MAX);
  return bounded ? { text: bounded, source: path.basename(file) } : undefined;
}

export type ThumbnailRunDeps = {
  faces?: () => Promise<FaceReference[]>;
  rules?: () => Promise<{ text: string; source: string } | undefined>;
  bridge?: (route: "plan" | "render" | "check", body: unknown) => Promise<unknown>;
  cacheReference?: (reference: ThumbnailReference) => Promise<string>;
  now?: () => Date;
  /** Store root; tests point it at a temp folder. */
  dir?: string;
};

export async function callBridge(route: "plan" | "render" | "check", body: unknown) {
  let response: Response;
  try {
    response = await fetch(`${STRATEGY_BRIDGE_URL}/v1/thumbnails/${route}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ThumbnailRunError("The local Codex bridge is unreachable. Start it with `npm run bridge`.", 503);
  }
  const payload = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : `The thumbnail bridge answered with HTTP ${response.status}.`;
    throw new ThumbnailRunError(message, response.status >= 500 ? 503 : response.status);
  }
  return payload;
}

export async function requireFaces(load: () => Promise<FaceReference[]>) {
  let faces: FaceReference[];
  try {
    faces = await load();
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : "Face stills cannot be read.", 409);
  }
  if (faces.length === 0) {
    throw new ThumbnailRunError("No face stills configured. Set SIGNAL_ROOM_FACE_DIR (and optionally SIGNAL_ROOM_FACE_FILES) in .env.local.", 409);
  }
  return faces;
}

/** Downloads (once) every reference image; a thumbnail that cannot be fetched drops out of the run. */
export async function bridgeReferences(references: ThumbnailReference[], cache: (reference: ThumbnailReference) => Promise<string>) {
  const settled = await Promise.allSettled(references.map(async (reference) => ({
    id: reference.videoId,
    title: reference.title,
    channelTitle: reference.channelTitle,
    factor: reference.factor,
    views: reference.views,
    ...(reference.source === "manual" ? { source: "manual" as const } : {}),
    ...(reference.note ? { note: reference.note } : {}),
    path: await cache(reference),
  })));
  const ready = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  if (ready.length === 0) throw new ThumbnailRunError("None of the reference thumbnails could be downloaded from YouTube.", 502);
  return ready;
}

/** Decodes and crops one render to 16:9; nothing is written yet. */
export function fitRender(payload: unknown) {
  const image = parseRenderImage(payload);
  const bytes = Buffer.from(image.data, "base64");
  return image.mimeType === "image/png" ? cropPngToRatio(bytes, 16, 9) : { bytes, width: undefined, height: undefined };
}

/** Stores one fitted layer image; returns the layer. */
export async function persistLayer(runId: string, variantId: string, stage: ThumbnailImageKind, fitted: ReturnType<typeof fitRender>, now: string, dir?: string): Promise<ThumbnailLayer> {
  const saved = await store.writeVariantImage(runId, variantId, fitted.bytes, { dir, stage });
  return {
    imagePath: saved.imagePath,
    imageUrl: `${thumbnailImageUrl(runId, variantId, stage)}&v=${encodeURIComponent(now)}`,
    ...(fitted.width ? { width: fitted.width, height: fitted.height } : {}),
    renderedAt: now,
  };
}

export function planForBridge(variant: ThumbnailVariant | ThumbnailPlanVariant) {
  return {
    label: variant.label,
    textOverlay: variant.textOverlay,
    concept: variant.concept,
    face: variant.face,
    inspiredBy: variant.inspiredBy.map((entry) => ({ videoId: entry.videoId, borrowed: entry.borrowed })),
    imagePrompt: variant.imagePrompt,
    ...(variant.recipe ? { recipe: variant.recipe } : {}),
  };
}

/**
 * Run updates are read-modify-write on one run.json while renders of other
 * variants finish in parallel; one queue per run keeps them from overwriting
 * each other. The long Bridge call happens outside the queue.
 */
const runQueues = new Map<string, Promise<unknown>>();

export function withRunLock<T>(runId: string, task: () => Promise<T>): Promise<T> {
  const previous = runQueues.get(runId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  runQueues.set(runId, next);
  void next.catch(() => undefined).finally(() => {
    if (runQueues.get(runId) === next) runQueues.delete(runId);
  });
  return next;
}

export async function readRunOrFail(runId: string, dir?: string) {
  const run = await store.readRun(runId, { dir });
  if (!run) throw new ThumbnailRunError(`Unknown thumbnail run ${runId}.`, 404);
  return run;
}

export function variantOrFail(run: ThumbnailRun, variantId: string) {
  const variant = run.variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new ThumbnailRunError(`Unknown variant ${variantId}.`, 404);
  return variant;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The render failed.";
}

/**
 * One Thumbnail-Builder run: plan three variants against the reference
 * thumbnails, render the background layer of all three in parallel, crop to
 * 16:9 and store the run. Person and text follow per variant once Chris
 * approved the layer before. A failed render keeps its plan so it can be
 * rendered again.
 */
export async function runThumbnailBuilder(body: unknown, deps: ThumbnailRunDeps = {}): Promise<ThumbnailRun> {
  const request = parseThumbnailRequest(body);
  const now = deps.now ?? (() => new Date());
  const bridge = deps.bridge ?? callBridge;
  const dir = deps.dir;
  const library = await store.readLibrary({ dir });
  let references: ThumbnailReference[];
  try {
    references = pickReferences(library.references, request.referenceIds);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 400);
  }
  if (references.length === 0) {
    throw new ThumbnailRunError("The reference library is empty. Mark Outlier thumbnails first.", 409);
  }
  const faces = await requireFaces(deps.faces ?? (() => loadFaceReferences()));
  const ready = await bridgeReferences(references, deps.cacheReference ?? ((reference) => store.cacheReferenceImage(reference, { dir })));
  const rules = await (deps.rules ?? (() => loadThumbnailRules()))();
  const input: BridgeInput = {
    video: { title: request.title, ...(request.brief ? { brief: request.brief } : {}) },
    references: ready,
    faces,
    ...(rules ? { rules: rules.text } : {}),
    ...(request.direction ? { direction: request.direction } : {}),
  };

  let plan: ThumbnailPlanVariant[];
  try {
    plan = parseThumbnailPlan(await bridge("plan", input), { referenceIds: ready.map((reference) => reference.id), faces: faces.map((face) => face.id) });
  } catch (error) {
    if (error instanceof ThumbnailRunError) throw error;
    throw new ThumbnailRunError(error instanceof Error ? error.message : "The thumbnail plan is invalid.", 502);
  }

  const started = now();
  const runId = newThumbnailRunId(started);
  const planned: ThumbnailVariant[] = plan.map((variant, index) => ({
    id: `variant-${index + 1}`,
    label: variant.label,
    textOverlay: variant.textOverlay,
    concept: variant.concept,
    face: variant.face,
    inspiredBy: inspirationFor(variant.inspiredBy, references),
    imagePrompt: variant.imagePrompt,
    layers: {},
  }));
  const variants = await Promise.all(planned.map(async (variant): Promise<ThumbnailVariant> => {
    let background: ThumbnailLayer;
    try {
      const payload = await bridge("render", { ...input, variant: planForBridge(variant), stage: "background" });
      background = await persistLayer(runId, variant.id, "background", fitRender(payload), now().toISOString(), dir);
    } catch (error) {
      background = { renderedAt: now().toISOString(), error: errorMessage(error) };
    }
    return { ...variant, layers: { background } };
  }));
  const run: ThumbnailRun = {
    id: runId,
    title: request.title,
    briefExcerpt: request.brief.slice(0, 280),
    ...(request.direction ? { direction: request.direction } : {}),
    aspectRatio: "16:9",
    createdAt: started.toISOString(),
    referenceIds: ready.map((reference) => reference.id),
    faceCount: faces.length,
    ...(rules ? { rulesSource: rules.source } : {}),
    variants,
  };
  if (variants.length !== THUMBNAIL_VARIANT_COUNT) throw new ThumbnailRunError("The run lost a variant.", 500);
  await store.saveRun(run, { dir });
  return run;
}

/**
 * Renders one layer of a stored variant from its plan: { runId, variantId, stage }.
 * Person needs an approved background, text an approved person layer; the
 * approved layer goes to the Bridge as the base image. A successful render
 * replaces the layer, drops every later layer with its file and clears the
 * choice if it pointed at this variant. A failed render changes nothing that
 * was rendered before; a stage without an image keeps the error.
 */
export async function renderThumbnailStage(body: unknown, deps: ThumbnailRunDeps = {}): Promise<ThumbnailRun> {
  let target: { runId: string; variantId: string; stage: ThumbnailStage };
  try {
    target = parseStageRequest(body);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 400);
  }
  const { runId, variantId, stage } = target;
  const dir = deps.dir;
  const run = await readRunOrFail(runId, dir);
  const variant = variantOrFail(run, variantId);
  const blocker = stageBlocker(variant, stage);
  if (blocker) throw new ThumbnailRunError(blocker, 409);
  const previous = previousStage(stage);
  const baseLayer = previous ? variant.layers?.[previous] : undefined;
  const base = previous ? await store.variantImageFile(runId, variantId, { dir, stage: previous }) : null;
  if (previous && !base) throw new ThumbnailRunError(`The approved ${previous} image is missing. Render ${previous} again.`, 409);

  const faces = await requireFaces(deps.faces ?? (() => loadFaceReferences()));
  if (!faces.some((face) => face.id === variant.face)) {
    throw new ThumbnailRunError("The still this variant was planned with is no longer configured.", 409);
  }
  // The variant's own Outlier snapshot, so removing a thumbnail from the library does not orphan the run.
  const references: ThumbnailReference[] = variant.inspiredBy.map((source) => ({
    videoId: source.videoId,
    title: source.title,
    channelTitle: source.channelTitle,
    url: source.url,
    thumbnailUrl: source.thumbnailUrl,
    factor: source.factor,
    views: source.views,
    channelMedian: 0,
    market: "en",
    publishedAt: run.createdAt,
    measuredAt: run.createdAt,
    markedAt: run.createdAt,
  }));
  const ready = await bridgeReferences(references, deps.cacheReference ?? ((reference) => store.cacheReferenceImage(reference, { dir })));
  const input: BridgeInput = { video: { title: run.title }, references: ready, faces };
  const now = deps.now ?? (() => new Date());
  const bridge = deps.bridge ?? callBridge;

  let fitted: ReturnType<typeof fitRender> | null = null;
  let failure = "";
  try {
    fitted = fitRender(await bridge("render", { ...input, variant: planForBridge(variant), stage, ...(base ? { base } : {}) }));
  } catch (error) {
    failure = errorMessage(error);
  }

  return withRunLock(runId, async () => {
    const current = await readRunOrFail(runId, dir);
    const fresh = variantOrFail(current, variantId);
    // The base changed while this render ran (it was rendered again); this result belongs to an old base.
    if (previous && fresh.layers?.[previous]?.renderedAt !== baseLayer?.renderedAt) {
      throw new ThumbnailRunError(`The ${previous} layer changed while ${stage} was rendering. Render ${stage} again.`, 409);
    }
    const layers = { ...fresh.layers };
    if (!fitted) {
      if (hasLayerImage(layers[stage])) throw new ThumbnailRunError(failure, 502);
      layers[stage] = { renderedAt: now().toISOString(), error: failure };
      await store.saveRun(replaceVariant(current, { ...fresh, layers }), { dir });
      throw new ThumbnailRunError(failure, 502);
    }
    layers[stage] = await persistLayer(runId, variantId, stage, fitted, now().toISOString(), dir);
    for (const later of laterStages(stage)) {
      delete layers[later];
      await store.removeVariantImage(runId, variantId, later, { dir });
    }
    const next = replaceVariant(current, { ...fresh, layers });
    if (next.chosenVariantId === variantId) delete next.chosenVariantId;
    await store.saveRun(next, { dir });
    return next;
  });
}

export function replaceVariant(run: ThumbnailRun, variant: ThumbnailVariant): ThumbnailRun {
  return { ...run, variants: run.variants.map((candidate) => (candidate.id === variant.id ? variant : candidate)) };
}

/** Chris approves one rendered layer: { runId, variantId, stage }. */
export async function approveThumbnailStage(body: unknown, deps: Pick<ThumbnailRunDeps, "dir" | "now"> = {}): Promise<ThumbnailRun> {
  let target: { runId: string; variantId: string; stage: ThumbnailStage };
  try {
    target = parseStageRequest(body);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 400);
  }
  const { runId, variantId, stage } = target;
  const now = deps.now ?? (() => new Date());
  return withRunLock(runId, async () => {
    const run = await readRunOrFail(runId, deps.dir);
    const variant = variantOrFail(run, variantId);
    if (isLegacyVariant(variant)) throw new ThumbnailRunError("This variant comes from a run before the layer flow and is read-only.", 409);
    const layer = variant.layers?.[stage];
    if (!hasLayerImage(layer)) throw new ThumbnailRunError(`The ${stage} layer has no rendered image to approve.`, 409);
    const next = replaceVariant(run, { ...variant, layers: { ...variant.layers, [stage]: { ...layer, approvedAt: now().toISOString() } } });
    await store.saveRun(next, { dir: deps.dir });
    return next;
  });
}

/** Chris picks the variant he will use: { runId, variantId }. */
export async function chooseThumbnailVariant(body: unknown, deps: Pick<ThumbnailRunDeps, "dir"> = {}): Promise<ThumbnailRun> {
  let target: { runId: string; variantId: string };
  try {
    target = parseVariantRequest(body);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 400);
  }
  return withRunLock(target.runId, async () => {
    const run = await readRunOrFail(target.runId, deps.dir);
    const variant = variantOrFail(run, target.variantId);
    if (!finishedImage(variant)) throw new ThumbnailRunError("Only a variant with an approved text layer can be chosen.", 409);
    const next = { ...run, chosenVariantId: variant.id };
    await store.saveRun(next, { dir: deps.dir });
    return next;
  });
}

type OutlierStorage = Pick<StorageAdapter, "listYoutubeOutliers">;

/** Outlier thumbnails not yet in the library, strongest factor first. */
export const SUGGESTION_LIMIT = 48;

export async function thumbnailLibraryView(storage: OutlierStorage, options: { market?: "de" | "en"; dir?: string } = {}) {
  const [library, outliers] = await Promise.all([
    store.readLibrary({ dir: options.dir }),
    storage.listYoutubeOutliers({ minFactor: REFERENCE_MIN_FACTOR, limit: 200, ...(options.market ? { market: options.market } : {}) }),
  ]);
  const marked = new Set(library.references.map((reference) => reference.videoId));
  const suggestions = outliers
    .filter((video) => !marked.has(video.videoId) && isYoutubeVideoId(video.videoId) && isYoutubeThumbnailUrl(video.thumbnailUrl))
    .slice(0, SUGGESTION_LIMIT);
  return { references: library.references, suggestions, minFactor: REFERENCE_MIN_FACTOR };
}

/** Marks one Outlier thumbnail; every stored field comes from the Outlier row, not from the browser. */
type VideoLookup = (videoId: string) => Promise<Parameters<typeof manualReference>[0] | null>;

/** One videos.list call (1 quota unit) for a link Chris pasted. */
async function lookupVideo(videoId: string) {
  const [video] = await fetchVideos([videoId], createYoutubeClient());
  return video ?? null;
}

async function manualReferenceFor(videoId: string, now: Date, note: string | undefined, lookup: VideoLookup = lookupVideo) {
  let video;
  try {
    video = await lookup(videoId);
  } catch (error) {
    if (error instanceof YoutubeKeyMissingError) throw new ThumbnailRunError("YOUTUBE_API_KEY is not set; links cannot be looked up.", 409);
    throw new ThumbnailRunError(error instanceof Error ? error.message : "The YouTube lookup failed.", 502);
  }
  if (!video) throw new ThumbnailRunError(`YouTube knows no public video ${videoId}.`, 404);
  try {
    return manualReference(video, now.toISOString(), note);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 422);
  }
}

export async function markThumbnailReference(
  body: unknown,
  storage: OutlierStorage,
  options: { now?: Date; dir?: string; fetch?: typeof fetch; lookup?: VideoLookup } = {},
) {
  const now = options.now ?? new Date();
  const dir = options.dir;
  let mark: ReturnType<typeof parseReferenceMark>;
  try {
    mark = parseReferenceMark(body);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 400);
  }
  let reference: ThumbnailReference;
  if (mark.manual) {
    reference = await manualReferenceFor(mark.videoId, now, mark.note, options.lookup);
  } else {
    const outliers = await storage.listYoutubeOutliers({ minFactor: REFERENCE_MIN_FACTOR, limit: 200, ...(mark.market ? { market: mark.market } : {}) });
    const video: YoutubeVideo | undefined = outliers.find((candidate) => candidate.videoId === mark.videoId);
    if (!video) throw new ThumbnailRunError(`${mark.videoId} is not an Outlier from ${REFERENCE_MIN_FACTOR}x.`, 404);
    reference = referenceFromOutlier(video, now.toISOString(), mark.note);
  }
  let library;
  try {
    library = addReference(await store.readLibrary({ dir }), reference);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 409);
  }
  await store.writeLibrary(library, { dir });
  // Best effort: the run downloads it again if this fails.
  await store.cacheReferenceImage(reference, { dir, ...(options.fetch ? { fetch: options.fetch } : {}) }).catch(() => undefined);
  return reference;
}

export async function unmarkThumbnailReference(videoId: unknown, options: { dir?: string } = {}) {
  if (!isYoutubeVideoId(videoId)) throw new ThumbnailRunError("videoId must be an 11-character YouTube id.", 400);
  const { library, removed } = removeReference(await store.readLibrary(options), videoId);
  if (!removed) throw new ThumbnailRunError(`${videoId} is not in the library.`, 404);
  await store.writeLibrary(library, options);
  await store.removeReferenceImage(videoId, options);
  return library;
}

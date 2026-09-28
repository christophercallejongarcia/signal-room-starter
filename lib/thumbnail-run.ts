import { STRATEGY_BRIDGE_URL } from "./config.ts";
import { cropPngToRatio } from "./cover-crop.ts";
import { loadFaceReferences, type FaceReference } from "./face-references.ts";
import {
  THUMBNAIL_VARIANT_COUNT,
  inspirationFor,
  newThumbnailRunId,
  parseRenderImage,
  parseRenderRequest,
  parseThumbnailPlan,
  parseThumbnailRequest,
  pickReferences,
  thumbnailImageUrl,
  type ThumbnailPlanVariant,
  type ThumbnailRun,
  type ThumbnailVariant,
} from "./thumbnail-builder.ts";
import type { StorageAdapter, YoutubeVideo } from "./contracts.ts";
import {
  REFERENCE_MIN_FACTOR,
  addReference,
  isYoutubeThumbnailUrl,
  isYoutubeVideoId,
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

type BridgeReference = { id: string; title: string; channelTitle: string; factor: number; views: number; path: string };
type BridgeInput = { video: { title: string; brief?: string }; references: BridgeReference[]; faces: FaceReference[] };

export type ThumbnailRunDeps = {
  faces?: () => Promise<FaceReference[]>;
  bridge?: (route: "plan" | "render", body: unknown) => Promise<unknown>;
  cacheReference?: (reference: ThumbnailReference) => Promise<string>;
  now?: () => Date;
  /** Store root; tests point it at a temp folder. */
  dir?: string;
};

async function callBridge(route: "plan" | "render", body: unknown) {
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

async function requireFaces(load: () => Promise<FaceReference[]>) {
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
async function bridgeReferences(references: ThumbnailReference[], cache: (reference: ThumbnailReference) => Promise<string>) {
  const settled = await Promise.allSettled(references.map(async (reference) => ({
    id: reference.videoId,
    title: reference.title,
    channelTitle: reference.channelTitle,
    factor: reference.factor,
    views: reference.views,
    path: await cache(reference),
  })));
  const ready = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  if (ready.length === 0) throw new ThumbnailRunError("None of the reference thumbnails could be downloaded from YouTube.", 502);
  return ready;
}

/** Decodes, crops to 16:9 and stores one render; returns the variant's image fields. */
async function persistRender(runId: string, variantId: string, payload: unknown, now: string, dir?: string) {
  const image = parseRenderImage(payload);
  const bytes = Buffer.from(image.data, "base64");
  const fitted = image.mimeType === "image/png" ? cropPngToRatio(bytes, 16, 9) : { bytes, width: undefined, height: undefined };
  const saved = await store.writeVariantImage(runId, variantId, fitted.bytes, { dir });
  return {
    imagePath: saved.imagePath,
    imageUrl: `${thumbnailImageUrl(runId, variantId)}?v=${encodeURIComponent(now)}`,
    ...(fitted.width ? { width: fitted.width, height: fitted.height } : {}),
    renderedAt: now,
  };
}

function planForBridge(variant: ThumbnailVariant | ThumbnailPlanVariant) {
  return {
    label: variant.label,
    textOverlay: variant.textOverlay,
    concept: variant.concept,
    face: variant.face,
    inspiredBy: variant.inspiredBy.map((entry) => ({ videoId: entry.videoId, borrowed: entry.borrowed })),
    imagePrompt: variant.imagePrompt,
  };
}

async function renderVariant(
  runId: string,
  variant: ThumbnailVariant,
  input: BridgeInput,
  bridge: NonNullable<ThumbnailRunDeps["bridge"]>,
  now: () => Date,
  dir?: string,
): Promise<ThumbnailVariant> {
  try {
    const payload = await bridge("render", { ...input, variant: planForBridge(variant) });
    const { error: _previous, ...rest } = variant;
    return { ...rest, ...(await persistRender(runId, variant.id, payload, now().toISOString(), dir)) };
  } catch (error) {
    return { ...variant, error: error instanceof Error ? error.message : "The render failed." };
  }
}

/**
 * One Thumbnail-Builder run: plan three variants against the reference
 * thumbnails, render them in parallel with Chris' stills, crop to 16:9 and
 * store the run. A failed render keeps its plan so it can be rendered again.
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
  const input: BridgeInput = { video: { title: request.title, ...(request.brief ? { brief: request.brief } : {}) }, references: ready, faces };

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
  }));
  const variants = await Promise.all(planned.map((variant) => renderVariant(runId, variant, input, bridge, now, dir)));
  const run: ThumbnailRun = {
    id: runId,
    title: request.title,
    briefExcerpt: request.brief.slice(0, 280),
    aspectRatio: "16:9",
    createdAt: started.toISOString(),
    referenceIds: ready.map((reference) => reference.id),
    faceCount: faces.length,
    variants,
  };
  if (variants.length !== THUMBNAIL_VARIANT_COUNT) throw new ThumbnailRunError("The run lost a variant.", 500);
  await store.saveRun(run, { dir });
  return run;
}

/** Renders one stored variant again from its plan, with the current stills. */
export async function rerenderThumbnailVariant(body: unknown, deps: ThumbnailRunDeps = {}): Promise<ThumbnailRun> {
  const { runId, variantId } = parseRenderRequest(body);
  const dir = deps.dir;
  const run = await store.readRun(runId, { dir });
  if (!run) throw new ThumbnailRunError(`Unknown thumbnail run ${runId}.`, 404);
  const variant = run.variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new ThumbnailRunError(`Unknown variant ${variantId}.`, 404);
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
  const rendered = await renderVariant(run.id, variant, input, deps.bridge ?? callBridge, now, dir);
  if (rendered.error) throw new ThumbnailRunError(rendered.error, 502);
  const next = { ...run, variants: run.variants.map((candidate) => (candidate.id === variantId ? rendered : candidate)) };
  await store.saveRun(next, { dir });
  return next;
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
export async function markThumbnailReference(body: unknown, storage: OutlierStorage, options: { now?: Date; dir?: string; fetch?: typeof fetch } = {}) {
  const now = options.now ?? new Date();
  const dir = options.dir;
  let mark: { videoId: string; market?: "de" | "en" };
  try {
    mark = parseReferenceMark(body);
  } catch (error) {
    throw new ThumbnailRunError(error instanceof Error ? error.message : String(error), 400);
  }
  const outliers = await storage.listYoutubeOutliers({ minFactor: REFERENCE_MIN_FACTOR, limit: 200, ...(mark.market ? { market: mark.market } : {}) });
  const video: YoutubeVideo | undefined = outliers.find((candidate) => candidate.videoId === mark.videoId);
  if (!video) throw new ThumbnailRunError(`${mark.videoId} is not an Outlier from ${REFERENCE_MIN_FACTOR}x.`, 404);
  const reference = referenceFromOutlier(video, now.toISOString());
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

import { loadFaceReferences } from "./face-references.ts";
import {
  THUMBNAIL_DRAFT_DEFAULT,
  THUMBNAIL_DRAFT_MAX,
  THUMBNAIL_DRAFT_MIN,
  draftCheckFrom,
  inspirationFor,
  newThumbnailRunId,
  parseRatingRequest,
  parseThumbnailPlan,
  parseVariantRequest,
  parseThumbnailRequest,
  pickReferences,
  type ThumbnailPlanVariant,
  type ThumbnailRun,
  type ThumbnailVariant,
} from "./thumbnail-builder.ts";
import type { ThumbnailReference } from "./thumbnail-library.ts";
import {
  ThumbnailRunError,
  bridgeReferences,
  callBridge,
  errorMessage,
  fitRender,
  loadThumbnailRules,
  persistLayer,
  planForBridge,
  readRunOrFail,
  replaceVariant,
  requireFaces,
  variantOrFail,
  withRunLock,
  type BridgeInput,
  type ThumbnailRunDeps,
} from "./thumbnail-run.ts";
import * as store from "./adapters/storage/thumbnail-store.ts";

/**
 * Draft runs (Entwürfe): Chris tests many directions at once. The planner
 * spreads 3 to 20 variants over the recipes from the creator research; each
 * variant renders as one finished image, gets the Chris retouch pass and an
 * automatic check (recognizable, headline exact, at most three focus areas,
 * free corner, counts match, skin), and Chris rates the gallery. The winner
 * can go through the layer flow afterwards.
 */

/** A pending draft older than this was cut off (server restart) and may be rendered again. */
export const DRAFT_STALE_MS = 15 * 60_000;

export function isDraftRendering(variant: ThumbnailVariant, now = Date.now()) {
  return Boolean(variant.draft?.pending) && now - Date.parse(variant.draft?.renderedAt ?? "") < DRAFT_STALE_MS;
}

/** Renders at the same time; each Codex render takes one to two minutes. */
export const DRAFT_CONCURRENCY = Math.max(1, Math.min(6, Number(process.env.THUMBNAIL_DRAFT_CONCURRENCY) || 4));

export type DraftDeps = ThumbnailRunDeps & {
  /** Tests wait for the renders; the route answers after the plan and renders in the background. */
  inline?: boolean;
};

/** Recipe ids of bridge/thumbnails.mjs, in the order a draft run fills its slots; Chris' own idea twice. */
export const DRAFT_RECIPE_ORDER = [
  "abo-comparison", "icon-halo", "logo-equation", "terminal-command", "word-behind-head", "giant-face-stack",
  "graph-paper-curve", "cream-surprise", "ui-toggle", "tier-cards", "ai-os-command", "proof-pointing",
  "normal-vs-agent", "whiteboard-course", "old-vs-new", "stripe-outline", "open-head", "abo-comparison",
];
const DRAFT_CHUNK = 5;

/** Slots for count drafts, cycling through the recipes, cut into planning chunks of five. */
export function draftChunks(count: number, recipes: readonly string[] = DRAFT_RECIPE_ORDER) {
  const order = recipes.length > 0 ? recipes : DRAFT_RECIPE_ORDER;
  const slots = Array.from({ length: count }, (_, index) => order[index % order.length]);
  const chunks: string[][] = [];
  for (let start = 0; start < slots.length; start += DRAFT_CHUNK) chunks.push(slots.slice(start, start + DRAFT_CHUNK));
  return chunks;
}

function draftCount(value: unknown) {
  const count = typeof value === "number" && Number.isInteger(value) ? value : THUMBNAIL_DRAFT_DEFAULT;
  return Math.min(THUMBNAIL_DRAFT_MAX, Math.max(THUMBNAIL_DRAFT_MIN, count));
}

/** Plans the draft run and stores it with every draft pending; rendering continues in the background. */
export async function runThumbnailDrafts(body: unknown, deps: DraftDeps = {}): Promise<ThumbnailRun> {
  let request: ReturnType<typeof parseThumbnailRequest>;
  try {
    request = parseThumbnailRequest(body);
  } catch (error) {
    throw new ThumbnailRunError(errorMessage(error), 400);
  }
  const count = draftCount((body as { count?: unknown } | null)?.count);
  // Optional: the recipes to fill the slots with, e.g. the formats picked for one title.
  const requested = (body as { recipes?: unknown } | null)?.recipes;
  const recipes = Array.isArray(requested) ? requested.filter((id): id is string => typeof id === "string" && DRAFT_RECIPE_ORDER.includes(id)) : [];
  const now = deps.now ?? (() => new Date());
  const bridge = deps.bridge ?? callBridge;
  const dir = deps.dir;
  const library = await store.readLibrary({ dir });
  let references: ThumbnailReference[];
  try {
    references = pickReferences(library.references, request.referenceIds);
  } catch (error) {
    throw new ThumbnailRunError(errorMessage(error), 400);
  }
  if (references.length === 0) throw new ThumbnailRunError("The reference library is empty. Mark Outlier thumbnails first.", 409);
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

  // One planning call for 20 variants outlasts the Bridge's window; chunks of five plan in parallel, each with its own recipes.
  let plan: ThumbnailPlanVariant[];
  try {
    const chunks = draftChunks(count, recipes);
    const plans = await Promise.all(chunks.map(async (recipes) => parseThumbnailPlan(
      await bridge("plan", { ...input, drafts: true, count: recipes.length, recipes: [...new Set(recipes)] }),
      { referenceIds: ready.map((reference) => reference.id), faces: faces.map((face) => face.id), count: recipes.length },
    )));
    plan = plans.flat();
  } catch (error) {
    if (error instanceof ThumbnailRunError) throw error;
    throw new ThumbnailRunError(errorMessage(error), 502);
  }

  const started = now();
  const run: ThumbnailRun = {
    id: newThumbnailRunId(started),
    kind: "drafts",
    title: request.title,
    briefExcerpt: request.brief.slice(0, 280),
    ...(request.direction ? { direction: request.direction } : {}),
    aspectRatio: "16:9",
    createdAt: started.toISOString(),
    referenceIds: ready.map((reference) => reference.id),
    faceCount: faces.length,
    ...(rules ? { rulesSource: rules.source } : {}),
    variants: plan.map((variant, index): ThumbnailVariant => ({
      id: `variant-${index + 1}`,
      label: variant.label,
      textOverlay: variant.textOverlay,
      concept: variant.concept,
      face: variant.face,
      inspiredBy: inspirationFor(variant.inspiredBy, references),
      imagePrompt: variant.imagePrompt,
      ...(variant.recipe ? { recipe: variant.recipe } : {}),
      draft: { pending: true, renderedAt: started.toISOString() },
    })),
  };
  await store.saveRun(run, { dir });
  const rendering = renderDrafts(run, input, deps, rules?.text);
  if (deps.inline) await rendering;
  else void rendering.catch(() => undefined);
  return run;
}

/** Renders and checks every pending draft, DRAFT_CONCURRENCY at a time. */
async function renderDrafts(run: ThumbnailRun, input: BridgeInput, deps: DraftDeps, rules?: string) {
  const queue = run.variants.filter((variant) => variant.draft?.pending).map((variant) => variant.id);
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) await renderDraft(run.id, id, input, deps, rules);
  };
  await Promise.all(Array.from({ length: Math.min(DRAFT_CONCURRENCY, queue.length) }, worker));
}

async function renderDraft(runId: string, variantId: string, input: BridgeInput, deps: DraftDeps, rules?: string) {
  const dir = deps.dir;
  const now = deps.now ?? (() => new Date());
  const bridge = deps.bridge ?? callBridge;
  const variant = variantOrFail(await readRunOrFail(runId, dir), variantId);
  let draft: NonNullable<ThumbnailVariant["draft"]>;
  try {
    const fitted = fitRender(await bridge("render", { ...input, variant: planForBridge(variant), stage: "draft" }));
    draft = await persistLayer(runId, variantId, "draft", fitted, now().toISOString(), dir);
  } catch (error) {
    draft = { renderedAt: now().toISOString(), error: errorMessage(error) };
  }
  if (!draft.error) {
    try {
      const image = await store.variantImageFile(runId, variantId, { dir, stage: "draft" });
      if (!image) throw new Error("The draft image is missing.");
      const withPerson = variant.imagePrompt.elements?.layout !== "no-person";
      const answer = await bridge("check", {
        image,
        ...(withPerson ? { faces: input.faces.slice(0, 3) } : {}),
        withPerson,
        textOverlay: variant.textOverlay,
        idea: variant.concept,
        ...(rules ? { rules } : {}),
      });
      draft = { ...draft, check: draftCheckFrom(answer, now().toISOString()) };
    } catch (error) {
      draft = { ...draft, checkError: errorMessage(error) };
    }
  }
  await withRunLock(runId, async () => {
    const current = await readRunOrFail(runId, dir);
    await store.saveRun(replaceVariant(current, { ...variantOrFail(current, variantId), draft }), { dir });
  });
}

/** Renders one draft again, e.g. after a failed render: { runId, variantId }. */
export async function rerenderThumbnailDraft(body: unknown, deps: DraftDeps = {}): Promise<ThumbnailRun> {
  let target: { runId: string; variantId: string };
  try {
    target = parseVariantRequest(body);
  } catch (error) {
    throw new ThumbnailRunError(errorMessage(error), 400);
  }
  const { runId, variantId } = target;
  const dir = deps.dir;
  const run = await readRunOrFail(runId, dir);
  if (run.kind !== "drafts") throw new ThumbnailRunError("Only draft runs render drafts.", 409);
  const variant = variantOrFail(run, variantId);
  if (isDraftRendering(variant)) throw new ThumbnailRunError("This draft is still rendering.", 409);
  const faces = await requireFaces(deps.faces ?? (() => loadFaceReferences()));
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
    ...(source.source === "manual" ? { source: "manual" as const } : {}),
  }));
  const ready = await bridgeReferences(references, deps.cacheReference ?? ((reference) => store.cacheReferenceImage(reference, { dir })));
  const rules = await (deps.rules ?? (() => loadThumbnailRules()))();
  const pending = await withRunLock(runId, async () => {
    const current = await readRunOrFail(runId, dir);
    const fresh = variantOrFail(current, variantId);
    const next = replaceVariant(current, { ...fresh, draft: { pending: true, renderedAt: new Date().toISOString() } });
    await store.saveRun(next, { dir });
    return next;
  });
  const rendering = renderDraft(runId, variantId, { video: { title: run.title }, references: ready, faces }, deps, rules?.text);
  if (deps.inline) {
    await rendering;
    return readRunOrFail(runId, dir);
  }
  void rendering.catch(() => undefined);
  return pending;
}

/** Chris rates one draft: { runId, variantId, stars, note? }. */
export async function rateThumbnailDraft(body: unknown, deps: Pick<ThumbnailRunDeps, "dir" | "now"> = {}): Promise<ThumbnailRun> {
  let rating: ReturnType<typeof parseRatingRequest>;
  try {
    rating = parseRatingRequest(body);
  } catch (error) {
    throw new ThumbnailRunError(errorMessage(error), 400);
  }
  const now = deps.now ?? (() => new Date());
  return withRunLock(rating.runId, async () => {
    const run = await readRunOrFail(rating.runId, deps.dir);
    const variant = variantOrFail(run, rating.variantId);
    const next = replaceVariant(run, {
      ...variant,
      rating: { stars: rating.stars, ...(rating.note ? { note: rating.note } : {}), ratedAt: now().toISOString() },
    });
    await store.saveRun(next, { dir: deps.dir });
    return next;
  });
}

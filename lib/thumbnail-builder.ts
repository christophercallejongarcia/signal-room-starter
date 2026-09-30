import { COVER_IMAGE_DATA_MAX, COVER_TEXT_MAX } from "./cover-lab.ts";
import { COVER_FORMATS } from "./cover-formats.mjs";
import { bounded } from "./ideas.ts";
import { isYoutubeVideoId, type ThumbnailReference } from "./thumbnail-library.ts";

/**
 * The Thumbnail-Builder: three 16:9 YouTube thumbnails for one of Chris' own
 * videos. It builds on Cover Lab (same Bridge, same GPT-Image render in an
 * isolated workspace), adds Outlier thumbnails from the Referenz-Bibliothek as
 * image input, Chris' stills as the face, and a JSON image prompt per variant.
 * Every variant names the Outlier thumbnails it borrowed from. A variant is
 * built in three layers that Chris approves one at a time: background, then
 * Chris on it, then the words.
 */

export const THUMBNAIL_VARIANT_COUNT = 3;
export const THUMBNAIL_TITLE_MAX = 200;
/** The script is context, not an instruction; the first 16k characters carry hook and stages. */
export const THUMBNAIL_BRIEF_MAX = 16_000;
/** Reference thumbnails one run may send to the Bridge. */
export const THUMBNAIL_REFERENCES_MAX = 8;
export const THUMBNAIL_INSPIRED_MAX = 3;
export const THUMBNAIL_DIRECTION_MAX = 1_500;
const LINE_MAX = 600;

export const THUMBNAIL_FORMAT = COVER_FORMATS.youtube;

export type ThumbnailRequest = {
  title: string;
  brief: string;
  /** Chris' (or the editor's) picture idea, binding for the planner. */
  direction: string;
  /** Library ids to offer; empty means the newest THUMBNAIL_REFERENCES_MAX entries. */
  referenceIds: string[];
};

/** Layer order of the Ebenen-Ablauf; each stage renders on top of the approved previous one. */
export const THUMBNAIL_STAGES = ["background", "person", "text"] as const;
export type ThumbnailStage = (typeof THUMBNAIL_STAGES)[number];
/** Stored image kinds: the three layers plus the one-shot draft of a draft run. */
export type ThumbnailImageKind = ThumbnailStage | "draft";

export function isThumbnailImageKind(value: unknown): value is ThumbnailImageKind {
  return value === "draft" || isThumbnailStage(value);
}

/** A draft run plans many variants at once; each renders in one image and gets an automatic check. */
export const THUMBNAIL_DRAFT_MIN = 3;
export const THUMBNAIL_DRAFT_MAX = 20;
export const THUMBNAIL_DRAFT_DEFAULT = 15;

export type ThumbnailImagePrompt = {
  subject: string;
  expression: string;
  text: { content: string; placement: string; style: string };
  keyVisual: string;
  background: string;
  composition: string;
  palette: string;
  styleNotes: string;
  avoid: string[];
  /** The three-element choice (backdrop, one object, text) of plans made with the formula. */
  elements?: ThumbnailElements;
};

export type ThumbnailElements = {
  layout: (typeof ELEMENT_CHOICES.layout)[number];
  backdrop: (typeof ELEMENT_CHOICES.backdrop)[number];
  object: { kind: (typeof ELEMENT_CHOICES.objectKind)[number]; description: string };
  textStyle: (typeof ELEMENT_CHOICES.textStyle)[number];
  textPlacement: (typeof ELEMENT_CHOICES.textPlacement)[number];
  wardrobe?: "hoodie-cream" | "hoodie-charcoal" | "hoodie-rust" | "tee-black" | "overshirt-dark";
  gesture?: "none" | "hands-clasped" | "pointing" | "holding-phone";
};

/** Mirrors the enums in bridge/thumbnails.mjs. */
const ELEMENT_CHOICES = {
  layout: ["person-right", "person-left", "person-center", "no-person"],
  backdrop: ["cream", "coral", "charcoal", "navy", "black", "royal-blue", "light-grey", "graph-paper", "split"],
  objectKind: [
    "terminal-window", "browser-window", "icon-tiles", "logo-equation", "device", "chart-card",
    "icon-halo", "whiteboard", "monitor-wall", "pixel-mascot", "tier-cards", "old-new-pills", "phone-duel",
    "curve-chart", "ui-toggle", "open-head",
  ],
  textStyle: ["condensed-caps", "serif", "sentence-chalk", "geometric-black", "grotesk-serif-mix", "stacked-caps"],
  textPlacement: ["beside", "behind-person", "bottom", "top", "label-box"],
  wardrobe: ["hoodie-cream", "hoodie-charcoal", "hoodie-rust", "tee-black", "overshirt-dark"],
  gesture: ["none", "hands-clasped", "pointing", "holding-phone"],
} as const;

function oneOf<T extends string>(value: unknown, choices: readonly T[], where: string, field: string): T {
  if (typeof value !== "string" || !(choices as readonly string[]).includes(value)) throw new Error(`${where}: ${field} is invalid.`);
  return value as T;
}

function elementsFrom(value: unknown, where: string): ThumbnailElements | undefined {
  if (value === undefined) return undefined;
  if (!isObject(value) || !isObject(value.object)) throw new Error(`${where}: elements are invalid.`);
  const description = bounded(value.object.description, LINE_MAX);
  if (!description) throw new Error(`${where}: elements.object.description is empty.`);
  return {
    layout: oneOf(value.layout, ELEMENT_CHOICES.layout, where, "layout"),
    backdrop: oneOf(value.backdrop, ELEMENT_CHOICES.backdrop, where, "backdrop"),
    object: { kind: oneOf(value.object.kind, ELEMENT_CHOICES.objectKind, where, "object.kind"), description },
    textStyle: oneOf(value.textStyle, ELEMENT_CHOICES.textStyle, where, "textStyle"),
    textPlacement: oneOf(value.textPlacement, ELEMENT_CHOICES.textPlacement, where, "textPlacement"),
    ...(value.wardrobe !== undefined ? { wardrobe: oneOf(value.wardrobe, ELEMENT_CHOICES.wardrobe, where, "wardrobe") } : {}),
    ...(value.gesture !== undefined ? { gesture: oneOf(value.gesture, ELEMENT_CHOICES.gesture, where, "gesture") } : {}),
  };
}

export type ThumbnailInspiration = {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnailUrl: string;
  factor: number;
  views: number;
  /** "manual" when Chris picked the thumbnail by link; then factor is 0. */
  source?: "outlier" | "manual";
  /** What this variant took from the Outlier thumbnail, in the planner's words. */
  borrowed: string;
};

/** "12,3x Kanal-Median" for a measured Outlier, "von Chris gewählt" for a link pick. */
export function referenceStrength(reference: { factor: number; source?: "outlier" | "manual" }) {
  if (reference.source === "manual") return "von Chris gewählt";
  return `${reference.factor.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x Kanal-Median`;
}

/** What the automatic image check found on a draft. passed is derived from the hard criteria. */
export type ThumbnailCheck = {
  passed: boolean;
  /** 1 to 10: how strongly it would make a viewer in Chris' niche click. */
  score: number;
  /** null for a draft without Chris. */
  recognizable: boolean | null;
  textExact: boolean;
  wordCount: number;
  elementCount: number;
  cornerFree: boolean;
  numbersConsistent: boolean;
  skinOk: boolean | null;
  faceBigEnough: boolean | null;
  eyeContact: boolean | null;
  textClearOfFace: boolean | null;
  readableSmall: boolean;
  notes: string;
  checkedAt: string;
};

export type ThumbnailRating = { stars: number; note?: string; ratedAt: string };

/** One rendered layer. A failed first render keeps only renderedAt and error. */
export type ThumbnailLayer = {
  imagePath?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  renderedAt: string;
  approvedAt?: string;
  error?: string;
};

export type ThumbnailVariant = {
  id: string;
  label: string;
  textOverlay: string;
  concept: string;
  /** Label of the still used for the expression, e.g. gesicht-00m40s-aufmerksam. */
  face: string;
  inspiredBy: ThumbnailInspiration[];
  imagePrompt: ThumbnailImagePrompt;
  /** Layer flow; missing on runs from before it, which only carry the finished image below. */
  layers?: Partial<Record<ThumbnailStage, ThumbnailLayer>>;
  /** Draft runs: the recipe the variant follows, its one-shot image and the automatic check. */
  recipe?: string;
  draft?: ThumbnailLayer & { pending?: boolean; check?: ThumbnailCheck; checkError?: string };
  /** Chris' own rating of a draft. */
  rating?: ThumbnailRating;
  /** Legacy finished image (person, text and background in one render), read-only. */
  imagePath?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  renderedAt?: string;
  error?: string;
};

export type ThumbnailRun = {
  id: string;
  /** "drafts": many one-shot variants with an automatic check; missing means the layer flow. */
  kind?: "drafts";
  title: string;
  /** Bounded excerpt of the brief, enough to recognise the run later. */
  briefExcerpt: string;
  /** The picture idea the run was given, if any. */
  direction?: string;
  aspectRatio: "16:9";
  createdAt: string;
  referenceIds: string[];
  faceCount: number;
  /** File name of the rule set the planner followed, if any (SIGNAL_ROOM_THUMBNAIL_RULES). */
  rulesSource?: string;
  variants: ThumbnailVariant[];
  /** The variant Chris picked; needs an approved text layer or a legacy finished image. */
  chosenVariantId?: string;
};

export type ThumbnailRenderImage = { mimeType: "image/png" | "image/jpeg" | "image/webp"; data: string };

/** One planned variant as the Bridge returns it, before the app joins the Outlier snapshot. */
export type ThumbnailPlanVariant = Pick<ThumbnailVariant, "label" | "textOverlay" | "concept" | "face" | "imagePrompt" | "recipe"> & {
  inspiredBy: { videoId: string; borrowed: string }[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

/** Keeps line breaks (the script has sections) but bounds the size. */
function boundedBlock(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "";
}

/** The only parser for the browser-to-server Thumbnail-Builder request. */
export function parseThumbnailRequest(body: unknown): ThumbnailRequest {
  const input = isObject(body) ? body : {};
  const title = bounded(input.title, THUMBNAIL_TITLE_MAX);
  if (!title) throw new Error("title is required.");
  const brief = boundedBlock(input.brief, THUMBNAIL_BRIEF_MAX);
  const direction = boundedBlock(input.direction, THUMBNAIL_DIRECTION_MAX);
  const raw = input.referenceIds === undefined ? [] : input.referenceIds;
  if (!Array.isArray(raw)) throw new Error("referenceIds must be a list of YouTube ids.");
  if (raw.some((id) => !isYoutubeVideoId(id))) throw new Error("referenceIds must be 11-character YouTube ids.");
  const referenceIds = [...new Set(raw as string[])];
  if (referenceIds.length > THUMBNAIL_REFERENCES_MAX) throw new Error(`Pick at most ${THUMBNAIL_REFERENCES_MAX} reference thumbnails.`);
  return { title, brief, direction, referenceIds };
}

/** POST /api/youtube/thumbnails/choose: { runId, variantId }. */
export function parseVariantRequest(body: unknown): { runId: string; variantId: string } {
  const input = isObject(body) ? body : {};
  if (!isThumbnailRunId(input.runId)) throw new Error("runId is invalid.");
  if (!isThumbnailVariantId(input.variantId)) throw new Error("variantId is invalid.");
  return { runId: input.runId, variantId: input.variantId };
}

/** POST /api/youtube/thumbnails/render and /approve: { runId, variantId, stage }. */
export function parseStageRequest(body: unknown): { runId: string; variantId: string; stage: ThumbnailStage } {
  const ids = parseVariantRequest(body);
  const stage = isObject(body) ? body.stage : undefined;
  if (!isThumbnailStage(stage)) throw new Error(`stage must be one of ${THUMBNAIL_STAGES.join(", ")}.`);
  return { ...ids, stage };
}

export function isThumbnailStage(value: unknown): value is ThumbnailStage {
  return typeof value === "string" && (THUMBNAIL_STAGES as readonly string[]).includes(value);
}

/** Runs from before the layer flow: one finished image per variant, no layers. */
export function isLegacyVariant(variant: ThumbnailVariant) {
  return variant.layers === undefined && variant.draft === undefined;
}

/** A layer counts once it has an image and no error. */
export function hasLayerImage(layer: ThumbnailLayer | undefined): layer is ThumbnailLayer & { imagePath: string; imageUrl: string } {
  return Boolean(layer?.imagePath && layer.imageUrl && !layer.error);
}

export function isLayerApproved(layer: ThumbnailLayer | undefined) {
  return hasLayerImage(layer) && Boolean(layer.approvedAt);
}

/** The stages after this one; re-rendering a stage drops them. */
export function laterStages(stage: ThumbnailStage): ThumbnailStage[] {
  return THUMBNAIL_STAGES.slice(THUMBNAIL_STAGES.indexOf(stage) + 1);
}

export function previousStage(stage: ThumbnailStage): ThumbnailStage | undefined {
  return THUMBNAIL_STAGES[THUMBNAIL_STAGES.indexOf(stage) - 1];
}

/** Why a stage cannot render yet, in plain words; null when it may. */
export function stageBlocker(variant: ThumbnailVariant, stage: ThumbnailStage): string | null {
  if (isLegacyVariant(variant)) return "This variant comes from a run before the layer flow and is read-only.";
  const previous = previousStage(stage);
  if (previous && !isLayerApproved(variant.layers?.[previous])) return `Approve the ${previous} layer before rendering ${stage}.`;
  return null;
}

/** The first stage not approved yet; text once everything is approved. */
export function currentStage(variant: ThumbnailVariant): ThumbnailStage {
  return THUMBNAIL_STAGES.find((stage) => !isLayerApproved(variant.layers?.[stage])) ?? "text";
}

/** The newest layer with an image, for the big picture on the card. */
export function latestLayerStage(variant: ThumbnailVariant): ThumbnailStage | undefined {
  return [...THUMBNAIL_STAGES].reverse().find((stage) => hasLayerImage(variant.layers?.[stage]));
}

/** The finished thumbnail: the approved text layer, a draft image, or the legacy image of an older run. */
export function finishedImage(variant: ThumbnailVariant): { stage?: ThumbnailImageKind; imagePath: string } | null {
  if (variant.draft) return hasLayerImage(variant.draft) ? { stage: "draft", imagePath: variant.draft.imagePath } : null;
  if (isLegacyVariant(variant)) return variant.imagePath && !variant.error ? { imagePath: variant.imagePath } : null;
  const text = variant.layers?.text;
  return isLayerApproved(text) && text?.imagePath ? { stage: "text", imagePath: text.imagePath } : null;
}

/** The requested references in library order, or the newest marks when none were picked. */
export function pickReferences(library: ThumbnailReference[], ids: string[]): ThumbnailReference[] {
  if (ids.length === 0) return library.slice(0, THUMBNAIL_REFERENCES_MAX);
  const missing = ids.filter((id) => !library.some((entry) => entry.videoId === id));
  if (missing.length > 0) throw new Error(`Not in the reference library: ${missing.join(", ")}.`);
  return library.filter((entry) => ids.includes(entry.videoId));
}

function line(source: Record<string, unknown>, field: string, where: string, max = LINE_MAX) {
  const value = bounded(source[field], max);
  if (!value) throw new Error(`${where}: ${field} is empty.`);
  return value;
}

function imagePrompt(value: unknown, where: string): ThumbnailImagePrompt {
  if (!isObject(value)) throw new Error(`${where}: imagePrompt must be a JSON object.`);
  const text = isObject(value.text) ? value.text : {};
  const avoid = Array.isArray(value.avoid) ? value.avoid.map((item) => bounded(item, 200)).filter(Boolean).slice(0, 12) : [];
  const elements = elementsFrom(value.elements, where);
  return {
    subject: line(value, "subject", where),
    expression: line(value, "expression", where),
    text: {
      content: line(text, "content", `${where} text`, COVER_TEXT_MAX),
      placement: line(text, "placement", `${where} text`),
      style: line(text, "style", `${where} text`),
    },
    keyVisual: line(value, "keyVisual", where),
    background: line(value, "background", where),
    composition: line(value, "composition", where),
    palette: line(value, "palette", where),
    styleNotes: line(value, "styleNotes", where),
    avoid,
    ...(elements ? { elements } : {}),
  };
}

/** Validates the Bridge's image answer before any byte is written. */
export function parseRenderImage(value: unknown): ThumbnailRenderImage {
  const image = isObject(value) ? value.image : undefined;
  if (!isObject(image)) throw new Error("Thumbnail render answer has no image.");
  const mimeType = image.mimeType;
  if (mimeType !== "image/png" && mimeType !== "image/jpeg" && mimeType !== "image/webp") {
    throw new Error("Thumbnail image must be PNG, JPEG or WebP.");
  }
  const data = typeof image.data === "string" ? image.data.trim() : "";
  if (!data || data.length > COVER_IMAGE_DATA_MAX || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw new Error("Thumbnail image data is invalid.");
  }
  return { mimeType, data };
}

/**
 * Validates the Bridge's plan. Every variant must name at least one offered
 * reference and one configured face.
 */
export function parseThumbnailPlan(
  value: unknown,
  options: { referenceIds: string[]; faces: string[]; count?: number },
): ThumbnailPlanVariant[] {
  if (!isObject(value) || !Array.isArray(value.variants)) throw new Error("Thumbnail plan variants are missing.");
  const expected = options.count ?? THUMBNAIL_VARIANT_COUNT;
  if (value.variants.length !== expected) {
    throw new Error(`Thumbnail plan needs exactly ${expected} variants.`);
  }
  return value.variants.map((item, index) => {
    const where = `Thumbnail variant ${index + 1}`;
    if (!isObject(item)) throw new Error(`${where} is invalid.`);
    const textOverlay = line(item, "textOverlay", where, COVER_TEXT_MAX);
    if (textOverlay.split(/\s+/).filter(Boolean).length > 4) throw new Error(`${where} must use at most four overlay words.`);
    const face = line(item, "face", where, 120);
    if (!options.faces.includes(face)) throw new Error(`${where} names an unknown face still.`);
    const inspiredBy = (Array.isArray(item.inspiredBy) ? item.inspiredBy : [])
      .filter(isObject)
      .map((entry) => ({ videoId: String(entry.videoId ?? ""), borrowed: bounded(entry.borrowed, LINE_MAX) }))
      .filter((entry) => options.referenceIds.includes(entry.videoId) && entry.borrowed);
    const unique = inspiredBy.filter((entry, position) => inspiredBy.findIndex((other) => other.videoId === entry.videoId) === position);
    if (unique.length === 0) throw new Error(`${where} names no Outlier thumbnail it was inspired by.`);
    return {
      label: line(item, "label", where, 120),
      textOverlay,
      concept: line(item, "concept", where),
      face,
      inspiredBy: unique.slice(0, THUMBNAIL_INSPIRED_MAX),
      imagePrompt: imagePrompt(item.imagePrompt, where),
      ...(typeof item.recipe === "string" && /^[a-z-]{2,40}$/.test(item.recipe) ? { recipe: item.recipe } : {}),
    };
  });
}

/**
 * The automatic check of a draft, bounded; passed follows the hard criteria:
 * Chris recognizable (when shown), headline exact, at most six words in total,
 * two to four main blocks, free lower-right corner, consistent counts, skin
 * not pale or plastic, face at least a third of the height, no text over eyes
 * or mouth, headline readable at 168 px.
 */
export function draftCheckFrom(value: unknown, now: string): ThumbnailCheck {
  const check = isObject(value) && isObject(value.check) ? value.check : {};
  const flag = (field: string) => check[field] === true;
  const maybe = (field: string) => (check[field] === null || check[field] === undefined ? null : check[field] === true);
  const count = (field: string) => (typeof check[field] === "number" && Number.isFinite(check[field]) ? Math.max(0, Math.round(check[field] as number)) : 99);
  const result = {
    recognizable: maybe("recognizable"),
    textExact: flag("textExact"),
    wordCount: count("wordCount"),
    elementCount: count("elementCount"),
    cornerFree: flag("cornerFree"),
    numbersConsistent: flag("numbersConsistent"),
    skinOk: maybe("skinOk"),
    faceBigEnough: maybe("faceBigEnough"),
    eyeContact: maybe("eyeContact"),
    textClearOfFace: maybe("textClearOfFace"),
    readableSmall: flag("readableSmall"),
    score: Math.min(10, Math.max(1, count("score") === 99 ? 1 : count("score"))),
    notes: bounded(check.notes, 400),
  };
  // Hard criteria from the research of 105 creator thumbnails; eye contact is a should, not a must.
  const passed = result.recognizable !== false && result.textExact && result.wordCount <= 6 && result.elementCount <= 4
    && result.cornerFree && result.numbersConsistent && result.skinOk !== false
    && result.faceBigEnough !== false && result.textClearOfFace !== false && result.readableSmall;
  return { ...result, passed, checkedAt: now };
}

/** Best first: passed drafts by score, then the rest by score; unrendered last. */
export function rankDrafts(variants: ThumbnailVariant[]) {
  const weight = (variant: ThumbnailVariant) => {
    const check = variant.draft?.check;
    if (!check) return hasLayerImage(variant.draft) ? 0 : -1;
    return (check.passed ? 100 : 0) + check.score;
  };
  return [...variants].sort((a, b) => weight(b) - weight(a));
}

/** POST /api/youtube/thumbnails/rate: { runId, variantId, stars 1-5, note? }. */
export function parseRatingRequest(body: unknown): { runId: string; variantId: string; stars: number; note?: string } {
  const ids = parseVariantRequest(body);
  const input = isObject(body) ? body : {};
  const stars = input.stars;
  if (typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error("stars must be 1 to 5.");
  const note = bounded(input.note, 300);
  return { ...ids, stars, ...(note ? { note } : {}) };
}

/** Joins the planner's reference ids with the library snapshot the run offered. */
export function inspirationFor(entries: { videoId: string; borrowed: string }[], references: ThumbnailReference[]): ThumbnailInspiration[] {
  return entries.flatMap((entry) => {
    const reference = references.find((candidate) => candidate.videoId === entry.videoId);
    if (!reference) return [];
    return [{
      videoId: reference.videoId,
      title: reference.title,
      channelTitle: reference.channelTitle,
      url: reference.url,
      thumbnailUrl: reference.thumbnailUrl,
      factor: reference.factor,
      views: reference.views,
      ...(reference.source === "manual" ? { source: "manual" as const } : {}),
      borrowed: entry.borrowed,
    }];
  });
}

/** Run ids double as folder names under data/; keep them boring. */
export function isThumbnailRunId(value: unknown): value is string {
  return typeof value === "string" && /^run-[0-9]{8}T[0-9]{6}Z-[a-z0-9]{6}$/.test(value);
}

export function isThumbnailVariantId(value: unknown): value is string {
  // Draft runs hold up to THUMBNAIL_DRAFT_MAX (20) variants.
  return typeof value === "string" && /^variant-([1-9]|1[0-9]|20)$/.test(value);
}

export function newThumbnailRunId(now: Date, random = Math.random) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const suffix = Array.from({ length: 6 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(random() * 36)]).join("");
  return `run-${stamp}-${suffix}`;
}

/** Without a stage it is the legacy finished image. */
export function thumbnailImageUrl(runId: string, variantId: string, stage?: ThumbnailImageKind) {
  const url = `/api/youtube/thumbnails/image/${runId}/${variantId}`;
  return stage ? `${url}?stage=${stage}` : url;
}

/** Short Markdown note for the Ablage: which Outlier thumbnails inspired which variant. */
export function thumbnailReferenceNote(run: ThumbnailRun, files: Record<string, string>) {
  const lines = [
    `# Thumbnails: ${run.title}`,
    "",
    `Erzeugt am ${run.createdAt.slice(0, 10)} im Signal-Room-Thumbnail-Builder (Lauf ${run.id}), 16:9, mit Chris' Standbildern als Gesicht.`,
    "",
  ];
  const chosen = run.variants.findIndex((variant) => variant.id === run.chosenVariantId);
  if (chosen >= 0) lines.push(`Gewählt von Chris: Variante ${chosen + 1}.`, "");
  run.variants.forEach((variant, index) => {
    const title = `## Variante ${index + 1}: ${variant.label}`;
    lines.push(variant.id === run.chosenVariantId ? `${title} (Gewählt von Chris)` : title, "");
    const fallback = finishedImage(variant)?.imagePath ?? (isLegacyVariant(variant) ? "nicht gerendert" : "Text-Ebene noch nicht freigegeben");
    lines.push(`Datei: ${files[variant.id] ?? fallback}`);
    lines.push(`Text im Bild: "${variant.textOverlay}"`);
    lines.push(`Idee: ${variant.concept}`);
    lines.push(`Gesicht: ${variant.face}`, "");
    lines.push("Angeregt durch diese Outlier:", "");
    for (const source of variant.inspiredBy) {
      lines.push(`- ${source.title} (${source.channelTitle}), ${referenceStrength(source)}, ${source.views.toLocaleString("de-DE")} Aufrufe. ${source.url}`);
      lines.push(`  Übernommen: ${source.borrowed}`);
    }
    lines.push("");
  });
  return lines.join("\n");
}

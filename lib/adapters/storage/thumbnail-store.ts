import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { isThumbnailRunId, isThumbnailVariantId, thumbnailReferenceNote, type ThumbnailRun } from "../../thumbnail-builder.ts";
import { isYoutubeThumbnailUrl, isYoutubeVideoId, normalizeLibrary, type ThumbnailLibrary, type ThumbnailReference } from "../../thumbnail-library.ts";
import { sniffImageType, type ImageType } from "./cover-cache.ts";

/**
 * File store of the Thumbnail-Builder until the Referenz-Bibliothek gets a
 * Convex table (proposal with Thread 1). Everything lives in the ignored
 * data/youtube-thumbnails folder: library.json, the cached reference images
 * the Bridge reads, and one folder per run with run.json and the variants.
 */

export const THUMBNAIL_DIR = path.join(process.cwd(), "data", "youtube-thumbnails");
const MAX_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;
const RUN_LIST_MAX = 20;
const EXTENSIONS: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type StoreOptions = { dir?: string; fetch?: (url: string, init?: RequestInit) => Promise<Response> };

async function writeAtomic(file: string, bytes: string | Uint8Array) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function readLibrary(options: StoreOptions = {}): Promise<ThumbnailLibrary> {
  const file = path.join(options.dir ?? THUMBNAIL_DIR, "library.json");
  try {
    return normalizeLibrary(JSON.parse(await readFile(file, "utf8")));
  } catch {
    return { references: [] };
  }
}

export async function writeLibrary(library: ThumbnailLibrary, options: StoreOptions = {}) {
  await writeAtomic(path.join(options.dir ?? THUMBNAIL_DIR, "library.json"), `${JSON.stringify(library, null, 2)}\n`);
}

function referenceFile(videoId: string, dir: string) {
  return path.join(dir, "references", `${videoId}.jpg`);
}

/**
 * Local copy of a reference thumbnail; the Bridge's Codex run has no network.
 * Downloads once from i.ytimg.com and returns the absolute path.
 */
export async function cacheReferenceImage(reference: ThumbnailReference, options: StoreOptions = {}): Promise<string> {
  const dir = options.dir ?? THUMBNAIL_DIR;
  if (!isYoutubeVideoId(reference.videoId) || !isYoutubeThumbnailUrl(reference.thumbnailUrl)) {
    throw new Error("Reference thumbnail is not a YouTube image.");
  }
  const file = referenceFile(reference.videoId, dir);
  const existing = await stat(file).catch(() => null);
  if (existing?.isFile() && existing.size > 0) return file;
  const fetcher = options.fetch ?? fetch;
  const response = await fetcher(reference.thumbnailUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store", redirect: "error" });
  if (!response.ok) throw new Error(`The thumbnail of ${reference.videoId} answered with HTTP ${response.status}.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES || !sniffImageType(bytes)) {
    throw new Error(`The thumbnail of ${reference.videoId} is not a usable image.`);
  }
  await writeAtomic(file, bytes);
  return file;
}

export async function removeReferenceImage(videoId: string, options: StoreOptions = {}) {
  if (!isYoutubeVideoId(videoId)) return;
  await rm(referenceFile(videoId, options.dir ?? THUMBNAIL_DIR), { force: true });
}

function runDirectory(runId: string, dir: string) {
  if (!isThumbnailRunId(runId)) throw new Error("Thumbnail run id is invalid.");
  return path.join(dir, "runs", runId);
}

/** Writes one variant image below the run folder and returns its repo-relative path. */
export async function writeVariantImage(runId: string, variantId: string, bytes: Uint8Array, options: StoreOptions = {}) {
  const dir = options.dir ?? THUMBNAIL_DIR;
  if (!isThumbnailVariantId(variantId)) throw new Error("Thumbnail variant id is invalid.");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new Error("Generated thumbnail is too large.");
  const type = sniffImageType(bytes);
  if (!type) throw new Error("Generated thumbnail is not a supported image.");
  const folder = runDirectory(runId, dir);
  const file = path.join(folder, `${variantId}.${EXTENSIONS[type]}`);
  for (const other of Object.values(EXTENSIONS)) {
    if (other !== EXTENSIONS[type]) await rm(path.join(folder, `${variantId}.${other}`), { force: true });
  }
  await writeAtomic(file, bytes);
  return { file, imagePath: path.relative(process.cwd(), file).split(path.sep).join("/"), type };
}

export async function readVariantImage(runId: string, variantId: string, options: StoreOptions = {}) {
  if (!isThumbnailRunId(runId) || !isThumbnailVariantId(variantId)) return null;
  const folder = runDirectory(runId, options.dir ?? THUMBNAIL_DIR);
  for (const extension of Object.values(EXTENSIONS)) {
    try {
      const bytes = await readFile(path.join(folder, `${variantId}.${extension}`));
      const type = sniffImageType(bytes);
      if (type) return { bytes, type };
    } catch {
      // Try the next extension.
    }
  }
  return null;
}

export async function saveRun(run: ThumbnailRun, options: StoreOptions = {}) {
  const folder = runDirectory(run.id, options.dir ?? THUMBNAIL_DIR);
  await writeAtomic(path.join(folder, "run.json"), `${JSON.stringify(run, null, 2)}\n`);
}

export async function readRun(runId: string, options: StoreOptions = {}): Promise<ThumbnailRun | null> {
  if (!isThumbnailRunId(runId)) return null;
  try {
    return JSON.parse(await readFile(path.join(runDirectory(runId, options.dir ?? THUMBNAIL_DIR), "run.json"), "utf8")) as ThumbnailRun;
  } catch {
    return null;
  }
}

/** Newest first; the run id starts with a sortable UTC stamp. */
export async function listRuns(options: StoreOptions = {}): Promise<ThumbnailRun[]> {
  const dir = options.dir ?? THUMBNAIL_DIR;
  const names = await readdir(path.join(dir, "runs")).catch(() => [] as string[]);
  const ids = names.filter(isThumbnailRunId).sort().reverse().slice(0, RUN_LIST_MAX);
  const runs = await Promise.all(ids.map((id) => readRun(id, options)));
  return runs.filter((run): run is ThumbnailRun => Boolean(run));
}

/**
 * Copies a run's rendered variants into a folder outside the app (Chris' Ablage)
 * as variante-<n>.<ext> plus verweise.md naming the Outliers per variant.
 */
export async function exportRun(runId: string, target: string, options: StoreOptions = {}) {
  if (!path.isAbsolute(target)) throw new Error("The export folder must be an absolute path.");
  const run = await readRun(runId, options);
  if (!run) throw new Error(`Unknown thumbnail run ${runId}.`);
  await mkdir(target, { recursive: true });
  const files: Record<string, string> = {};
  for (const [index, variant] of run.variants.entries()) {
    const image = await readVariantImage(run.id, variant.id, options);
    if (!image) continue;
    const name = `variante-${index + 1}.${EXTENSIONS[image.type]}`;
    await writeFile(path.join(target, name), image.bytes);
    files[variant.id] = name;
  }
  await writeFile(path.join(target, "verweise.md"), `${thumbnailReferenceNote(run, files)}\n`);
  return { run, files: Object.values(files).map((name) => path.join(target, name)), note: path.join(target, "verweise.md") };
}

import type { YoutubeVideo } from "./contracts";
import { bounded } from "./ideas.ts";

/**
 * The Referenz-Bibliothek: Outlier thumbnails Chris marked as good examples.
 * Each entry is a snapshot of the Outlier row at marking time, so a later
 * refresh never changes why a thumbnail was kept. Until a Convex table exists
 * the library is one JSON file in data/ (lib/adapters/storage/thumbnail-store.ts).
 */

export type ThumbnailReference = {
  videoId: string;
  title: string;
  channelTitle: string;
  channelHandle?: string;
  url: string;
  thumbnailUrl: string;
  factor: number;
  views: number;
  channelMedian: number;
  market: "de" | "en";
  publishedAt: string;
  measuredAt: string;
  markedAt: string;
};

export type ThumbnailLibrary = { references: ThumbnailReference[] };

/** Outliers below this factor are not offered as references (ADR-0007 default). */
export const REFERENCE_MIN_FACTOR = 3;
/** Upper bound of the library; old entries have to be removed by hand. */
export const REFERENCE_LIBRARY_MAX = 60;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function isYoutubeVideoId(value: unknown): value is string {
  return typeof value === "string" && VIDEO_ID.test(value);
}

/** Only YouTube's own image host; the server downloads these bytes for the Bridge. */
export function isYoutubeThumbnailUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "i.ytimg.com";
  } catch {
    return false;
  }
}

/** The browser sends only the id (and the market it browsed); every other field comes from storage. */
export function parseReferenceMark(body: unknown): { videoId: string; market?: "de" | "en" } {
  const input = (body ?? {}) as Record<string, unknown>;
  if (!isYoutubeVideoId(input.videoId)) throw new Error("videoId must be an 11-character YouTube id.");
  const market = input.market;
  if (market !== undefined && market !== "de" && market !== "en") throw new Error(`market must be "de" or "en".`);
  return { videoId: input.videoId, ...(market ? { market } : {}) };
}

export function referenceFromOutlier(video: YoutubeVideo, now: string): ThumbnailReference {
  if (!isYoutubeVideoId(video.videoId)) throw new Error("The Outlier has no valid YouTube id.");
  if (!isYoutubeThumbnailUrl(video.thumbnailUrl)) throw new Error("The Outlier has no i.ytimg.com thumbnail.");
  return {
    videoId: video.videoId,
    title: bounded(video.title, 200),
    channelTitle: bounded(video.channelTitle, 120),
    ...(video.channelHandle ? { channelHandle: bounded(video.channelHandle, 120) } : {}),
    url: `https://www.youtube.com/watch?v=${video.videoId}`,
    thumbnailUrl: video.thumbnailUrl,
    factor: video.factor,
    views: video.views,
    channelMedian: video.channelMedian,
    market: video.market,
    publishedAt: video.publishedAt,
    measuredAt: video.measuredAt,
    markedAt: now,
  };
}

/** Newest mark first. Marking an entry again refreshes its snapshot and keeps one row. */
export function addReference(library: ThumbnailLibrary, reference: ThumbnailReference): ThumbnailLibrary {
  const others = library.references.filter((entry) => entry.videoId !== reference.videoId);
  if (others.length >= REFERENCE_LIBRARY_MAX) {
    throw new Error(`The library holds at most ${REFERENCE_LIBRARY_MAX} thumbnails. Remove one first.`);
  }
  return { references: [reference, ...others] };
}

export function removeReference(library: ThumbnailLibrary, videoId: string): { library: ThumbnailLibrary; removed: boolean } {
  const references = library.references.filter((entry) => entry.videoId !== videoId);
  return { library: { references }, removed: references.length !== library.references.length };
}

/** Tolerant read of the stored file: malformed rows drop out instead of breaking the view. */
export function normalizeLibrary(value: unknown): ThumbnailLibrary {
  const rows = value && typeof value === "object" && Array.isArray((value as ThumbnailLibrary).references)
    ? (value as ThumbnailLibrary).references
    : [];
  const seen = new Set<string>();
  const references = rows.filter((row): row is ThumbnailReference => {
    if (!row || typeof row !== "object" || !isYoutubeVideoId(row.videoId) || !isYoutubeThumbnailUrl(row.thumbnailUrl)) return false;
    if (seen.has(row.videoId)) return false;
    seen.add(row.videoId);
    return typeof row.title === "string" && typeof row.factor === "number";
  });
  return { references };
}

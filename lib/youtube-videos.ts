// Relative imports: convex/youtube.ts runs the same merge inside its mutation.
import type { YoutubeOutlierQuery, YoutubeVideo } from "./contracts";
import { YOUTUBE_DEFAULT_THRESHOLD } from "./config.ts";

/** Search terms kept on one video. */
export const YOUTUBE_VIDEO_QUERY_LIMIT = 10;
/** Largest page the Outlier query hands out. */
export const YOUTUBE_OUTLIER_LIMIT_MAX = 200;

/**
 * Folds a new measurement into the stored row. The newer measuredAt carries the
 * numbers; queries and topics accumulate; firstSeenAt stays the earliest; a
 * video once found by a Suchlauf keeps source "search".
 */
export function mergeYoutubeVideo(existing: YoutubeVideo | null, incoming: YoutubeVideo): YoutubeVideo {
  if (!existing) return incoming;
  const newer = Date.parse(incoming.measuredAt) >= Date.parse(existing.measuredAt) ? incoming : existing;
  return {
    ...newer,
    queries: [...new Set([...incoming.queries, ...existing.queries])].slice(0, YOUTUBE_VIDEO_QUERY_LIMIT),
    topics: [...new Set([...existing.topics, ...incoming.topics])],
    source: existing.source === "search" || incoming.source === "search" ? "search" : "watchlist",
    firstSeenAt: Date.parse(existing.firstSeenAt) <= Date.parse(incoming.firstSeenAt) ? existing.firstSeenAt : incoming.firstSeenAt,
  };
}

export type NormalizedOutlierQuery = Required<Pick<YoutubeOutlierQuery, "minFactor" | "limit">> & Omit<YoutubeOutlierQuery, "minFactor" | "limit">;

export function normalizeOutlierQuery(query: YoutubeOutlierQuery = {}): NormalizedOutlierQuery {
  const minFactor = typeof query.minFactor === "number" && Number.isFinite(query.minFactor) && query.minFactor > 0 ? query.minFactor : YOUTUBE_DEFAULT_THRESHOLD;
  const limit = typeof query.limit === "number" && Number.isFinite(query.limit) ? Math.min(Math.max(1, Math.floor(query.limit)), YOUTUBE_OUTLIER_LIMIT_MAX) : 50;
  return { ...query, minFactor, limit };
}

/** The Outlier predicate the file store and the Convex query share. */
export function matchesOutlierQuery(video: YoutubeVideo, query: NormalizedOutlierQuery) {
  if (video.factor < query.minFactor) return false;
  if (query.market && video.market !== query.market) return false;
  if (query.topic && !video.topics.includes(query.topic)) return false;
  if (query.publishedAfter && Date.parse(video.publishedAt) < Date.parse(query.publishedAfter)) return false;
  return true;
}

/** Strongest factor first, newer upload on a tie. */
export function sortOutliers(videos: YoutubeVideo[]) {
  return [...videos].sort((a, b) => b.factor - a.factor || Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id));
}

/** Parses the query string of GET /api/youtube/outliers. */
export function parseOutlierSearchParams(params: URLSearchParams, now: Date): YoutubeOutlierQuery {
  const number = (name: string) => {
    const raw = params.get(name);
    if (raw === null || raw === "") return undefined;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number.`);
    return value;
  };
  const market = params.get("market") ?? undefined;
  if (market !== undefined && market !== "de" && market !== "en") throw new Error(`market must be "de" or "en".`);
  const topic = params.get("topic") ?? undefined;
  if (topic !== undefined && !["claude", "agents", "ai-os", "automation"].includes(topic)) throw new Error("topic must be claude, agents, ai-os or automation.");
  const days = number("days");
  return {
    minFactor: number("minFactor"),
    limit: number("limit"),
    ...(market ? { market } : {}),
    ...(topic ? { topic: topic as YoutubeOutlierQuery["topic"] } : {}),
    ...(days ? { publishedAfter: new Date(now.getTime() - days * 86_400_000).toISOString() } : {}),
  };
}

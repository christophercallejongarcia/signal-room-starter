// Relative imports so both `node --test` and the Convex bundler can load this file without the "@/" alias.
import type { Creator, RunUsage, SignalRecord, YoutubeQuota, YoutubeVideo } from "../../contracts";
import { YOUTUBE_QUOTA_COST } from "../../config.ts";
import { youtubeBaseline, youtubeFormat, youtubeMetrics, type YoutubeBaseline } from "../scoring/youtube-outlier.ts";

/**
 * YouTube Data API v3 connector (ADR-0007). This file is the only place that
 * knows API field names; everything past it speaks SignalRecord, YoutubeVideo
 * and ResolvedChannel. Every call is counted in a quota ledger before it is
 * sent, because Google charges failed requests too. The API key travels only
 * in the request URL and never into an error message, log line or return value.
 */

const API_BASE = "https://www.googleapis.com/youtube/v3";
const PAGE_SIZE = 50;
const VIDEO_CONCURRENCY = 4;
const DESCRIPTION_MAX = 500;
const ERROR_MAX = 300;

type QuotaKind = keyof YoutubeQuota["calls"];

type ApiThumbnail = { url?: string; width?: number; height?: number };
type ApiThumbnails = Partial<Record<"default" | "medium" | "high" | "standard" | "maxres", ApiThumbnail>>;

type ApiChannel = {
  id?: string;
  snippet?: { title?: string; customUrl?: string; country?: string; defaultLanguage?: string; thumbnails?: ApiThumbnails };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean; videoCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
};

type ApiVideo = {
  id?: string;
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    channelTitle?: string;
    title?: string;
    description?: string;
    thumbnails?: ApiThumbnails;
    tags?: string[];
    liveBroadcastContent?: string;
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
};

type ApiPlaylistItem = { contentDetails?: { videoId?: string; videoPublishedAt?: string } };
type ApiSearchItem = { id?: { kind?: string; videoId?: string }; snippet?: { channelId?: string } };
type ApiList<T> = { items?: T[]; nextPageToken?: string };

/** Raised when Google answers quotaExceeded; a Suchlauf stops instead of burning more calls. */
export class YoutubeQuotaError extends Error {}
/** The key is missing. Collection skips YouTube rather than failing every channel. */
export class YoutubeKeyMissingError extends Error {}

export type YoutubeFetch = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type YoutubeClient = {
  get<T>(kind: QuotaKind, endpoint: string, params: Record<string, string | number | undefined>): Promise<T>;
  quota(): YoutubeQuota;
};

export function emptyQuota(): YoutubeQuota {
  return { units: 0, calls: { search: 0, videos: 0, channels: 0, playlistItems: 0 } };
}

export function addQuota(a: YoutubeQuota | undefined, b: YoutubeQuota | undefined): YoutubeQuota | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    units: a.units + b.units,
    calls: {
      search: a.calls.search + b.calls.search,
      videos: a.calls.videos + b.calls.videos,
      channels: a.calls.channels + b.calls.channels,
      playlistItems: a.calls.playlistItems + b.calls.playlistItems,
    },
  };
}

export function youtubeApiKey(): string | undefined {
  return process.env.YOUTUBE_API_KEY?.trim() || undefined;
}

function bounded(text: string, max = ERROR_MAX) {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : text;
}

/** Google's error body, reduced to reason and message. The request URL (with the key) is never part of it. */
function apiError(endpoint: string, status: number, body: unknown, apiKey: string) {
  const error = (body as { error?: { message?: string; errors?: { reason?: string }[] } } | null)?.error;
  const reason = error?.errors?.[0]?.reason ?? "";
  const message = (error?.message ?? "").split(apiKey).join("[key]").replace(/<[^>]+>/g, "");
  const text = bounded(`YouTube ${endpoint} answered ${status}${reason ? ` (${reason})` : ""}${message ? `: ${message}` : ""}`);
  return reason === "quotaExceeded" || reason === "dailyLimitExceeded" ? new YoutubeQuotaError(text) : new Error(text);
}

export function createYoutubeClient(options: { apiKey?: string; fetch?: YoutubeFetch } = {}): YoutubeClient {
  const apiKey = options.apiKey ?? youtubeApiKey();
  if (!apiKey) throw new YoutubeKeyMissingError("YOUTUBE_API_KEY is not set on the server.");
  const send = options.fetch ?? ((url: string) => fetch(url));
  const ledger = emptyQuota();
  return {
    async get<T>(kind: QuotaKind, endpoint: string, params: Record<string, string | number | undefined>) {
      ledger.calls[kind] += 1;
      ledger.units += YOUTUBE_QUOTA_COST[kind];
      const query = new URLSearchParams();
      for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== "") query.set(name, String(value));
      query.set("key", apiKey);
      let response: Awaited<ReturnType<YoutubeFetch>>;
      try {
        response = await send(`${API_BASE}/${endpoint}?${query}`);
      } catch (error) {
        // Network errors may echo the URL; only the class of failure leaves this function.
        throw new Error(`YouTube ${endpoint} unreachable (${error instanceof Error ? error.name : "network error"})`);
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) throw apiError(endpoint, response.status, body, apiKey);
      return body as T;
    },
    quota: () => structuredClone(ledger),
  };
}

// ---------------------------------------------------------------- parsing

/** ISO 8601 duration (PT1H2M3S, P1DT2H) in seconds; 0 for anything unreadable. */
export function parseIsoDuration(value: string | undefined): number {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value ?? "");
  if (!match) return 0;
  const [, d = "0", h = "0", m = "0", s = "0"] = match;
  return Number(d) * 86_400 + Number(h) * 3_600 + Number(m) * 60 + Number(s);
}

const CHANNEL_ID = /^UC[\w-]{22}$/;

/**
 * What Chris types or pastes: @handle, a youtube.com/@handle or /channel/UC… link,
 * or a bare channel id. Handles are case-insensitive on YouTube and stored lower-case.
 */
export function normalizeChannelInput(input: string): { id: string } | { handle: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (CHANNEL_ID.test(trimmed)) return { id: trimmed };
  const path = trimmed.replace(/^https?:\/\/(www\.|m\.)?youtube\.com\//i, "").replace(/[?#].*$/, "");
  const channel = /^channel\/(UC[\w-]{22})/.exec(path);
  if (channel) return { id: channel[1] };
  const handle = path.replace(/^@/, "").split("/")[0].toLowerCase();
  return /^[\w.-]{3,30}$/.test(handle) ? { handle } : null;
}

function count(value: string | undefined) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function bestThumbnail(thumbnails: ApiThumbnails | undefined) {
  return thumbnails?.maxres?.url ?? thumbnails?.standard?.url ?? thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url;
}

function languageMarket(...codes: (string | undefined)[]): "de" | "en" | undefined {
  for (const code of codes) {
    const lower = code?.toLowerCase() ?? "";
    if (lower.startsWith("de")) return "de";
    if (lower.startsWith("en")) return "en";
  }
  return undefined;
}

export type ResolvedChannel = {
  channelId: string;
  /** @handle, or the channel id when the channel has no handle. */
  handle: string;
  name: string;
  subscribers: number;
  avatarUrl?: string;
  url: string;
  uploadsPlaylistId: string;
  /** From the channel's declared language or country; absent when neither says. */
  market?: "de" | "en";
};

export function mapChannel(item: ApiChannel): ResolvedChannel | null {
  if (!item.id || !CHANNEL_ID.test(item.id)) return null;
  const customUrl = item.snippet?.customUrl?.trim();
  const handle = customUrl ? `@${customUrl.replace(/^@/, "").toLowerCase()}` : item.id;
  const country = item.snippet?.country?.toUpperCase();
  return {
    channelId: item.id,
    handle,
    name: item.snippet?.title?.trim() || handle,
    subscribers: item.statistics?.hiddenSubscriberCount ? 0 : count(item.statistics?.subscriberCount),
    avatarUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url,
    url: customUrl ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${item.id}`,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? `UU${item.id.slice(2)}`,
    market: languageMarket(item.snippet?.defaultLanguage) ?? (country && ["DE", "AT", "CH"].includes(country) ? "de" : undefined),
  };
}

/** One video as the rest of the app sees it, before a channel median is known. */
export type MeasuredVideo = {
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description?: string;
  publishedAt: string;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  thumbnailUrl?: string;
  topic: string;
  format: "long" | "short";
  /** Live or upcoming: no usable view count yet. */
  live: boolean;
  market?: "de" | "en";
};

export function mapVideo(item: ApiVideo): MeasuredVideo | null {
  const snippet = item.snippet;
  if (!item.id || !snippet?.channelId || !snippet.publishedAt || Number.isNaN(Date.parse(snippet.publishedAt))) return null;
  const title = snippet.title?.trim() || "Untitled video";
  const durationSeconds = parseIsoDuration(item.contentDetails?.duration);
  const description = snippet.description?.trim();
  return {
    videoId: item.id,
    channelId: snippet.channelId,
    channelTitle: snippet.channelTitle?.trim() || snippet.channelId,
    title,
    ...(description ? { description: bounded(description, DESCRIPTION_MAX) } : {}),
    publishedAt: new Date(snippet.publishedAt).toISOString(),
    durationSeconds,
    views: count(item.statistics?.viewCount),
    likes: count(item.statistics?.likeCount),
    comments: count(item.statistics?.commentCount),
    thumbnailUrl: bestThumbnail(snippet.thumbnails),
    topic: snippet.tags?.[0]?.trim().toLowerCase().slice(0, 40) || "youtube",
    format: youtubeFormat(durationSeconds, title),
    live: snippet.liveBroadcastContent === "live" || snippet.liveBroadcastContent === "upcoming",
    market: languageMarket(snippet.defaultAudioLanguage, snippet.defaultLanguage),
  };
}

export function videoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** The Signal a watchlist video is stored as. Same id as its YoutubeVideo. */
export function toSignal(video: MeasuredVideo, creator: Pick<Creator, "id">): SignalRecord {
  return {
    id: `yt-${video.videoId}`,
    externalId: video.videoId,
    creatorId: creator.id,
    title: video.title,
    publishedAt: video.publishedAt,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    durationSeconds: video.durationSeconds,
    thumbnailSeed: video.videoId,
    ...(video.thumbnailUrl ? { thumbnailUrl: video.thumbnailUrl } : {}),
    url: videoUrl(video.videoId),
    ...(video.description ? { caption: video.description } : {}),
    format: video.format,
    topic: video.topic,
  };
}

/** The read-model row of one measured video. */
export function toYoutubeVideo(
  video: MeasuredVideo,
  channel: Pick<ResolvedChannel, "handle" | "subscribers" | "market"> & { name?: string },
  baseline: YoutubeBaseline,
  context: { now: Date; source: YoutubeVideo["source"]; market: "de" | "en"; queries?: string[]; topics?: YoutubeVideo["topics"] },
): YoutubeVideo {
  const metrics = youtubeMetrics(video, baseline, channel.subscribers, context.now);
  const measuredAt = context.now.toISOString();
  return {
    id: `yt-${video.videoId}`,
    videoId: video.videoId,
    channelId: video.channelId,
    channelTitle: channel.name ?? video.channelTitle,
    ...(channel.handle.startsWith("@") ? { channelHandle: channel.handle } : {}),
    title: video.title,
    ...(video.description ? { description: video.description } : {}),
    ...(video.thumbnailUrl ? { thumbnailUrl: video.thumbnailUrl } : {}),
    url: videoUrl(video.videoId),
    publishedAt: video.publishedAt,
    durationSeconds: video.durationSeconds,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    subscribers: channel.subscribers,
    channelMedian: baseline.median,
    baselineCount: baseline.count,
    factor: metrics.factor,
    viewsPerSubscriber: metrics.viewsPerSubscriber,
    viewsPerDay: metrics.viewsPerDay,
    market: video.market ?? channel.market ?? context.market,
    topics: context.topics ?? [],
    queries: context.queries ?? [],
    source: context.source,
    measuredAt,
    firstSeenAt: measuredAt,
  };
}

// ---------------------------------------------------------------- calls

function chunks<T>(items: T[], size = PAGE_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** One channel by handle or id. channels.list, 1 unit. */
export async function resolveChannel(input: string, client: YoutubeClient): Promise<ResolvedChannel> {
  const target = normalizeChannelInput(input);
  if (!target) throw new Error(`"${bounded(input, 80)}" is not a YouTube handle, channel link or channel id`);
  const body = await client.get<ApiList<ApiChannel>>("channels", "channels", {
    part: "snippet,statistics,contentDetails",
    ...("id" in target ? { id: target.id } : { forHandle: `@${target.handle}` }),
  });
  const channel = (body.items ?? []).map(mapChannel).find(Boolean);
  if (!channel) throw new Error(`YouTube channel ${"id" in target ? target.id : `@${target.handle}`} not found`);
  return channel;
}

/** Many channels by id, 50 per call. */
export async function fetchChannels(ids: string[], client: YoutubeClient): Promise<Map<string, ResolvedChannel>> {
  const found = new Map<string, ResolvedChannel>();
  for (const part of chunks([...new Set(ids)])) {
    const body = await client.get<ApiList<ApiChannel>>("channels", "channels", { part: "snippet,statistics,contentDetails", id: part.join(","), maxResults: PAGE_SIZE });
    for (const item of body.items ?? []) {
      const channel = mapChannel(item);
      if (channel) found.set(channel.channelId, channel);
    }
  }
  return found;
}

/** Many videos by id, 50 per call. Unknown, private or deleted ids are simply absent. */
export async function fetchVideos(ids: string[], client: YoutubeClient): Promise<MeasuredVideo[]> {
  const parts = chunks([...new Set(ids)]);
  const answers: ApiVideo[][] = [];
  // A few 50-id pages at a time; order is kept by index.
  for (let i = 0; i < parts.length; i += VIDEO_CONCURRENCY) {
    const batch = await Promise.all(parts.slice(i, i + VIDEO_CONCURRENCY).map((part) =>
      client.get<ApiList<ApiVideo>>("videos", "videos", { part: "snippet,statistics,contentDetails", id: part.join(","), maxResults: PAGE_SIZE })));
    answers.push(...batch.map((body) => body.items ?? []));
  }
  return answers.flat().map(mapVideo).filter((video): video is MeasuredVideo => Boolean(video));
}

/**
 * The newest uploads of one channel from one playlistItems page (1 unit).
 * longformOnly says the page came from the UULF playlist, which YouTube fills
 * with non-Shorts only; then that membership is the Short/long-form decision.
 */
export type RecentUploads = { channelId: string; items: { videoId: string; publishedAt: string }[]; longformOnly: boolean };

/**
 * UULF is undocumented, so a 404 falls back to the full uploads playlist (UU)
 * and the duration heuristic decides instead.
 */
export async function recentUploads(channel: Pick<ResolvedChannel, "channelId" | "uploadsPlaylistId">, client: YoutubeClient, max = PAGE_SIZE): Promise<RecentUploads> {
  const read = async (playlistId: string) => {
    const body = await client.get<ApiList<ApiPlaylistItem>>("playlistItems", "playlistItems", { part: "contentDetails", playlistId, maxResults: Math.min(PAGE_SIZE, max) });
    return (body.items ?? []).flatMap((item) => {
      const videoId = item.contentDetails?.videoId;
      const publishedAt = item.contentDetails?.videoPublishedAt;
      return videoId ? [{ videoId, publishedAt: publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? publishedAt : "" }] : [];
    });
  };
  try {
    return { channelId: channel.channelId, items: await read(`UULF${channel.channelId.slice(2)}`), longformOnly: true };
  } catch (error) {
    if (!(error instanceof Error) || !/answered 404/.test(error.message)) throw error;
    return { channelId: channel.channelId, items: await read(channel.uploadsPlaylistId), longformOnly: false };
  }
}

/**
 * Settles Short versus long-form with YouTube's own split where it is known. A
 * video on a channel's UULF page is long-form whatever its length (a 90-second
 * landscape trailer is not a Short). A video of that channel missing from the
 * page but newer than its oldest entry would be on it if it were long-form, so
 * it is a Short. Everything else keeps the duration heuristic from mapVideo.
 */
export function applyUploadFormats(videos: MeasuredVideo[], uploads: RecentUploads[]): MeasuredVideo[] {
  const pages = new Map(uploads.filter((page) => page.longformOnly && page.items.length).map((page) => {
    const oldest = Math.min(...page.items.map((item) => Date.parse(item.publishedAt) || Infinity));
    return [page.channelId, { ids: new Set(page.items.map((item) => item.videoId)), oldest }];
  }));
  return videos.map((video) => {
    const page = pages.get(video.channelId);
    if (!page) return video;
    if (page.ids.has(video.videoId)) return { ...video, format: "long" };
    return Date.parse(video.publishedAt) >= page.oldest ? { ...video, format: "short" } : video;
  });
}

/** Video ids one search term finds. search.list, counted at 100 units. */
export async function searchVideoIds(
  term: string,
  options: { market: "de" | "en"; publishedAfter: string; maxResults: number },
  client: YoutubeClient,
): Promise<string[]> {
  const body = await client.get<ApiList<ApiSearchItem>>("search", "search", {
    part: "snippet",
    type: "video",
    q: term,
    order: "relevance",
    maxResults: Math.min(PAGE_SIZE, options.maxResults),
    publishedAfter: options.publishedAfter,
    relevanceLanguage: options.market,
    safeSearch: "none",
  });
  return (body.items ?? []).map((item) => item.id?.videoId).filter((id): id is string => Boolean(id));
}

/** Long-form videos with a usable view count; Shorts and live or upcoming streams drop out. */
export function measurableLongform(videos: MeasuredVideo[]) {
  return videos.filter((video) => video.format === "long" && !video.live);
}

/** What collecting one watchlist channel hands back to lib/collect.ts. */
export type YoutubeCollectResult = {
  records: SignalRecord[];
  usage: RunUsage;
  creatorPatch: Pick<Creator, "audience" | "name"> & Partial<Pick<Creator, "avatarUrl" | "url">>;
  youtubeVideos: YoutubeVideo[];
  youtubeQuota: YoutubeQuota;
};

/**
 * Backfill and refresh of one watchlist channel are the same pass: the channel's
 * subscriber count, then its newest 50 long-form uploads with fresh numbers. Long-form
 * keeps gaining views for weeks, so the whole page is re-measured every time;
 * that is 3 quota units per channel. Older stored videos keep their last numbers.
 */
export async function collectForChannel(creator: Creator, client: YoutubeClient = createYoutubeClient(), now = new Date()): Promise<YoutubeCollectResult> {
  const channelId = creator.id.replace(/^youtube-/, "");
  const channel = (await fetchChannels([channelId], client)).get(channelId);
  if (!channel) throw new Error(`YouTube channel ${channelId} not found`);
  const uploads = await recentUploads(channel, client, PAGE_SIZE);
  const videos = measurableLongform(applyUploadFormats(await fetchVideos(uploads.items.map((item) => item.videoId), client), [uploads]));
  const baseline = youtubeBaseline(videos);
  const market = creator.market ?? "de";
  return {
    records: videos.map((video) => toSignal(video, creator)),
    usage: { unreported: 0, computeUnits: 0, costUsd: 0 },
    creatorPatch: { audience: channel.subscribers, name: channel.name, ...(channel.avatarUrl ? { avatarUrl: channel.avatarUrl } : {}), url: channel.url },
    youtubeVideos: videos.map((video) => toYoutubeVideo(video, { ...channel, market }, baseline, { now, source: "watchlist", market })),
    youtubeQuota: client.quota(),
  };
}

/** Channel ids for a watchlist creator id and back. */
export function youtubeCreatorId(channelId: string) {
  return `youtube-${channelId}`;
}


import { randomUUID } from "node:crypto";
import type { CreatorCandidate, Run, RunError, StorageAdapter, YoutubeQuota, YoutubeSearchTerm, YoutubeTopic, YoutubeVideo } from "./contracts";
import {
  YOUTUBE_BASELINE_VIDEOS,
  YOUTUBE_CANDIDATE_MIN_VIEWS,
  YOUTUBE_DEFAULT_THRESHOLD,
  YOUTUBE_SEARCH_CHANNEL_LIMIT,
  YOUTUBE_SEARCH_RESULTS_PER_TERM,
  YOUTUBE_SEARCH_TERM_LIMIT,
  YOUTUBE_SEARCH_WINDOW_DAYS,
} from "./config.ts";
import { candidateKey } from "./candidates.ts";
import { defaultSearchTerms, missingTopics } from "./youtube-terms.ts";
import {
  createYoutubeClient,
  fetchChannels,
  fetchVideos,
  applyUploadFormats,
  measurableLongform,
  recentUploads,
  searchVideoIds,
  toYoutubeVideo,
  youtubeCreatorId,
  YoutubeQuotaError,
  type CountedVideo,
  type MeasuredVideo,
  type RecentUploads,
  type ResolvedChannel,
  type YoutubeClient,
} from "./adapters/sources/youtube-data-api.ts";
import { youtubeBaseline, type YoutubeBaseline } from "./adapters/scoring/youtube-outlier.ts";

/**
 * The Suchlauf, the way vidIQ reads a niche: search term, then videos, then the
 * channel median of each channel found, then the Outlier. Finds land in the
 * youtubeVideos read model, channels with an Outlier land as Kandidaten. Nothing
 * enters the watchlist: that stays Chris' click.
 */

export type YoutubeSearchStorage = Pick<StorageAdapter, "listCreators" | "listYoutubeSearchTerms" | "saveYoutubeVideos" | "mergeCandidates" | "saveRun">;

export type YoutubeSearchDeps = {
  storage: YoutubeSearchStorage;
  client: () => YoutubeClient;
  now: () => Date;
  resultsPerTerm: number;
  windowDays: number;
  channelLimit: number;
  /** Factor from which a find makes its channel a Kandidat. */
  candidateFactor: number;
};

export type YoutubeSearchResult = {
  runId: string;
  status: Run["status"];
  terms: string[];
  /** Topics none of the terms covered. */
  missingTopics: YoutubeTopic[];
  videosFound: number;
  shortsSkipped: number;
  /** Videos the API sent without a view count; they stay out of every median. */
  countsMissing: number;
  channelsMeasured: number;
  outliers: number;
  candidates: number;
  quota: YoutubeQuota;
  errors: string[];
};

type Find = { video: CountedVideo; queries: Set<string>; topics: Set<YoutubeTopic>; market: "de" | "en" };

const PLAYLIST_CONCURRENCY = 8;
const VIDEO_PAGE = 50;
const VIDEO_PAGE_CONCURRENCY = 4;
const compact = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

function describeCandidate(outliers: YoutubeVideo[], baseline: YoutubeBaseline, threshold: number) {
  const best = outliers[0];
  const queries = [...new Set(outliers.flatMap((video) => video.queries))].slice(0, 3);
  const count = outliers.length === 1 ? "1 Outlier" : `${outliers.length} Outlier`;
  return `${count} ab ${threshold}x, stärkster ${best.factor.toFixed(1)}x über dem Kanal-Median von ${compact.format(baseline.median)} Aufrufen (${baseline.count} Longform). Gefunden über ${queries.map((query) => `„${query}“`).join(", ")}.`;
}

/**
 * Kandidaten from the finds of one Suchlauf: every channel with at least one find
 * at or above the factor and YOUTUBE_CANDIDATE_MIN_VIEWS that is not already in the watchlist.
 */
export function candidatesFromFinds(
  finds: YoutubeVideo[],
  channels: Map<string, ResolvedChannel & { baseline: YoutubeBaseline }>,
  context: { tracked: Set<string>; threshold: number; runId: string; now: string; minViews?: number },
): CreatorCandidate[] {
  const minViews = context.minViews ?? YOUTUBE_CANDIDATE_MIN_VIEWS;
  const byChannel = new Map<string, YoutubeVideo[]>();
  for (const video of finds) {
    if (video.factor < context.threshold || video.views < minViews || context.tracked.has(youtubeCreatorId(video.channelId))) continue;
    byChannel.set(video.channelId, [...(byChannel.get(video.channelId) ?? []), video]);
  }
  const candidates: CreatorCandidate[] = [];
  for (const [channelId, outliers] of byChannel) {
    const channel = channels.get(channelId);
    if (!channel) continue;
    outliers.sort((a, b) => b.factor - a.factor);
    const markets = outliers.map((video) => video.market);
    const market = channel.market ?? (markets.filter((m) => m === "de").length > markets.length / 2 ? "de" : markets[0]);
    candidates.push({
      key: candidateKey("youtube", channelId),
      network: "youtube",
      externalId: channelId,
      handle: channel.handle,
      name: channel.name,
      url: channel.url,
      ...(channel.avatarUrl ? { avatarUrl: channel.avatarUrl } : {}),
      audience: channel.subscribers,
      market,
      reason: describeCandidate(outliers, channel.baseline, context.threshold),
      sources: [...new Set(outliers.flatMap((video) => video.queries))].map((label) => ({ kind: "youtube-search" as const, label, runId: context.runId, at: context.now })),
      evidence: outliers.slice(0, 5).map((video) => ({
        id: video.id,
        title: video.title,
        url: video.url,
        ...(video.thumbnailUrl ? { thumbnailUrl: video.thumbnailUrl } : {}),
        factor: video.factor,
        views: video.views,
        publishedAt: video.publishedAt,
      })),
      bestFactor: outliers[0].factor,
      outlierCount: outliers.length,
      channelMedian: channel.baseline.median,
      baselineCount: channel.baseline.count,
      dataAsOf: context.now,
      decision: "proposed",
      createdAt: context.now,
      updatedAt: context.now,
    });
  }
  return candidates;
}

function defaults(overrides: Partial<YoutubeSearchDeps>): YoutubeSearchDeps {
  if (!overrides.storage) throw new Error("runYoutubeSearch needs a storage");
  return {
    storage: overrides.storage,
    client: () => createYoutubeClient(),
    now: () => new Date(),
    resultsPerTerm: YOUTUBE_SEARCH_RESULTS_PER_TERM,
    windowDays: YOUTUBE_SEARCH_WINDOW_DAYS,
    channelLimit: YOUTUBE_SEARCH_CHANNEL_LIMIT,
    candidateFactor: YOUTUBE_DEFAULT_THRESHOLD,
    ...overrides,
  };
}

/** The stored terms, or the spec's start terms when Chris has none stored yet. */
export async function activeSearchTerms(storage: Pick<StorageAdapter, "listYoutubeSearchTerms">, now: Date): Promise<YoutubeSearchTerm[]> {
  const stored = await storage.listYoutubeSearchTerms();
  return stored.length ? stored : defaultSearchTerms(now.toISOString());
}

export async function runYoutubeSearch(options: { termIds?: string[] }, overrides: Partial<YoutubeSearchDeps>): Promise<YoutubeSearchResult> {
  const deps = defaults(overrides);
  const startedAt = deps.now();
  const runId = `run-${startedAt.toISOString()}-${randomUUID().slice(0, 8)}`;
  const all = await activeSearchTerms(deps.storage, startedAt);
  const wanted = options.termIds?.length ? all.filter((term) => options.termIds!.includes(term.id)) : all;
  const terms = wanted.slice(0, YOUTUBE_SEARCH_TERM_LIMIT);
  if (terms.length === 0) throw new Error("Keine Suchbegriffe ausgewählt.");

  const client = deps.client();
  const errors: RunError[] = [];
  const fail = (id: string, label: string, error: unknown) =>
    errors.push({ creatorId: id, handle: label, message: error instanceof Error ? error.message : String(error) });
  let quotaHit = false;

  // 1. Search term -> video ids, remembering which terms and topics found each.
  const publishedAfter = new Date(startedAt.getTime() - deps.windowDays * 86_400_000).toISOString();
  const hits = new Map<string, { queries: Set<string>; topics: Set<YoutubeTopic>; market: "de" | "en" }>();
  let termsSearched = 0;
  for (const term of terms) {
    if (quotaHit) break;
    try {
      const ids = await searchVideoIds(term.term, { market: term.market, publishedAfter, maxResults: deps.resultsPerTerm }, client);
      for (const id of ids) {
        const hit = hits.get(id) ?? { queries: new Set(), topics: new Set(), market: term.market };
        hit.queries.add(term.term);
        hit.topics.add(term.topic);
        hits.set(id, hit);
      }
      termsSearched += 1;
    } catch (error) {
      quotaHit = error instanceof YoutubeQuotaError;
      fail(`term:${term.id}`, `„${term.term}“`, error);
    }
  }

  // 2. Videos with numbers. Live and upcoming streams never count.
  let found: MeasuredVideo[] = [];
  if (!quotaHit && hits.size) {
    try {
      found = (await fetchVideos([...hits.keys()], client)).filter((video) => !video.live);
    } catch (error) {
      quotaHit = error instanceof YoutubeQuotaError;
      fail("videos", "videos.list", error);
    }
  }

  // 3. Channel median per channel, bounded; first found first. The heuristic
  // may call a short landscape video a Short, so every found channel is
  // measured and its UULF page settles the format afterwards.
  const channelIds = [...new Set(found.map((video) => video.channelId))].slice(0, deps.channelLimit);
  let channels = new Map<string, ResolvedChannel>();
  if (!quotaHit && channelIds.length) {
    try {
      channels = await fetchChannels(channelIds, client);
    } catch (error) {
      quotaHit = error instanceof YoutubeQuotaError;
      fail("channels", "channels.list", error);
    }
  }
  // One playlist page per channel, a few at a time: a full run measures 150 channels.
  const pages: RecentUploads[] = [];
  const queue = [...channels.values()];
  const worker = async () => {
    for (let channel = queue.shift(); channel && !quotaHit; channel = queue.shift()) {
      try {
        pages.push(await recentUploads(channel, client, YOUTUBE_BASELINE_VIDEOS + 10));
      } catch (error) {
        if (error instanceof YoutubeQuotaError) quotaHit = true;
        fail(youtubeCreatorId(channel.channelId), channel.handle, error);
      }
    }
  };
  await Promise.all(Array.from({ length: PLAYLIST_CONCURRENCY }, worker));
  // The baseline videos not already known from the search, in 50-id pages. A
  // page that fails leaves every channel with an id in it unmeasured: a median
  // over the search hits alone would be the wrong baseline (ADR-0007), so those
  // channels get no new factor and their stored measurements stay as they are.
  const known = new Map(found.map((video) => [video.videoId, video]));
  const ownerOf = new Map(pages.flatMap((page) => page.items.map((item) => [item.videoId, page.channelId] as const)));
  const missing = [...ownerOf.keys()].filter((id) => !known.has(id));
  const unmeasured = new Set<string>();
  const videoPages: string[][] = [];
  for (let i = 0; i < missing.length; i += VIDEO_PAGE) videoPages.push(missing.slice(i, i + VIDEO_PAGE));
  for (let i = 0; i < videoPages.length; i += VIDEO_PAGE_CONCURRENCY) {
    const group = videoPages.slice(i, i + VIDEO_PAGE_CONCURRENCY);
    const answers = quotaHit ? [] : await Promise.allSettled(group.map((ids) => fetchVideos(ids, client)));
    group.forEach((ids, index) => {
      const answer = answers[index];
      if (answer?.status === "fulfilled") {
        for (const video of answer.value) known.set(video.videoId, video);
        return;
      }
      for (const id of ids) unmeasured.add(ownerOf.get(id)!);
      if (!answer) return;
      if (answer.reason instanceof YoutubeQuotaError) quotaHit = true;
      fail("baseline", "videos.list", answer.reason);
    });
  }
  const settled = new Map(applyUploadFormats([...known.values()], pages).map((video) => [video.videoId, video]));
  const measured = new Map<string, ResolvedChannel & { baseline: YoutubeBaseline }>();
  for (const page of pages) {
    if (unmeasured.has(page.channelId)) continue;
    const channel = channels.get(page.channelId)!;
    const own = measurableLongform(page.items.map((item) => settled.get(item.videoId)).filter((video): video is MeasuredVideo => Boolean(video)));
    measured.set(page.channelId, { ...channel, baseline: youtubeBaseline(own) });
  }
  const longform = measurableLongform(found.map((video) => settled.get(video.videoId) ?? video));
  const finds: Find[] = longform.map((video) => {
    const hit = hits.get(video.videoId)!;
    return { video, queries: hit.queries, topics: hit.topics, market: video.market ?? hit.market };
  });

  // 4. Outlier: the found videos of measured channels, with their factor.
  const now = deps.now();
  const videos = finds.flatMap((find) => {
    const channel = measured.get(find.video.channelId);
    if (!channel) return [];
    return [toYoutubeVideo(find.video, channel, channel.baseline, {
      now,
      source: "search",
      market: find.market,
      queries: [...find.queries],
      topics: [...find.topics],
    })];
  });
  const saved = videos.length ? await deps.storage.saveYoutubeVideos(videos) : { inserted: 0, updated: 0 };

  const tracked = new Set((await deps.storage.listCreators()).map((creator) => creator.id));
  const candidates = candidatesFromFinds(videos, measured, { tracked, threshold: deps.candidateFactor, runId, now: now.toISOString() });
  if (candidates.length) await deps.storage.mergeCandidates(candidates);

  const finishedAt = deps.now();
  const quota = client.quota();
  const status: Run["status"] = termsSearched === 0 ? "failed" : errors.length ? "partial" : "ok";
  await deps.storage.saveRun({
    id: runId,
    kind: "youtube-search",
    status,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    creatorsChecked: measured.size,
    creatorsSkipped: Math.max(0, new Set(found.map((video) => video.channelId)).size - measured.size),
    recordsAdded: saved.inserted,
    recordsUpdated: saved.updated,
    errors,
    // The Data API is free; the quota is the budget, logged next to it.
    usage: { unreported: 0, computeUnits: 0, costUsd: 0 },
    youtubeQuota: quota,
    queries: terms.map((term) => term.term),
  });
  console.log(`YouTube-Suchlauf ${runId}: ${terms.length} Begriffe, ${videos.length} Longform, ${measured.size} Kanäle, ${candidates.length} Kandidaten, Quota ${quota.units} Einheiten (${quota.calls.search} Suchaufrufe).`);

  return {
    runId,
    status,
    terms: terms.map((term) => term.term),
    missingTopics: missingTopics(terms),
    videosFound: videos.length,
    shortsSkipped: found.filter((video) => (settled.get(video.videoId) ?? video).format === "short").length,
    countsMissing: [...settled.values()].filter((video) => video.views === null).length,
    channelsMeasured: measured.size,
    outliers: videos.filter((video) => video.factor >= deps.candidateFactor).length,
    candidates: candidates.length,
    quota,
    errors: errors.map((error) => `${error.handle}: ${error.message}`),
  };
}

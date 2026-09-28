import test from "node:test";
import assert from "node:assert/strict";
import { runYoutubeSearch } from "../lib/youtube-search.ts";
import { createYoutubeClient } from "../lib/adapters/sources/youtube-data-api.ts";
import { mergeCandidate } from "../lib/candidates.ts";
import { mergeYoutubeVideo } from "../lib/youtube-videos.ts";
import { channel, fakeYoutube, iso } from "./youtube-fake-api.mjs";

const NOW = new Date("2026-09-28T12:00:00.000Z");
const HOT = "UChotchannel000000000000";
const TRACKED = "UCtrackedchannel00000000";
const THIN = "UCthinchannel00000000000";

function memoryStorage(creators = []) {
  const videos = new Map();
  const candidates = new Map();
  const runs = [];
  return {
    videos, candidates, runs,
    async listCreators() { return creators; },
    async listYoutubeSearchTerms() {
      return [
        { id: "en:claude-code", term: "Claude Code", market: "en", topic: "claude", createdAt: "2026-09-01T00:00:00.000Z" },
        { id: "de:ki-agenten", term: "KI Agenten", market: "de", topic: "agents", createdAt: "2026-09-01T00:00:00.000Z" },
      ];
    },
    async saveYoutubeVideos(list) {
      let inserted = 0;
      for (const video of list) { if (!videos.has(video.id)) inserted += 1; videos.set(video.id, mergeYoutubeVideo(videos.get(video.id) ?? null, video)); }
      return { inserted, updated: list.length - inserted };
    },
    async mergeCandidates(list) {
      for (const candidate of list) candidates.set(candidate.key, mergeCandidate(candidates.get(candidate.key) ?? null, candidate));
      return { inserted: list.length, updated: 0 };
    },
    async saveRun(run) { runs.push(run); },
  };
}

function world() {
  const hot = channel(HOT, { now: NOW, customUrl: "hot", views: 2_000, subscribers: 40_000, extra: [
    { id: "hotHIT00001", channelId: HOT, publishedAt: iso(NOW, 2), duration: "PT15M", views: 20_000, title: "Claude Code in 15 Minuten", language: "de" },
    { id: "hotSHORT001", channelId: HOT, publishedAt: iso(NOW, 1), duration: "PT45S", views: 500_000, short: true },
  ] });
  const tracked = channel(TRACKED, { now: NOW, customUrl: "tracked", views: 1_000, extra: [
    { id: "trkHIT00001", channelId: TRACKED, publishedAt: iso(NOW, 3), duration: "PT20M", views: 9_000 },
  ] });
  const thin = channel(THIN, { now: NOW, customUrl: "thin", views: 100, count: 2, extra: [
    { id: "thinHIT0001", channelId: THIN, publishedAt: iso(NOW, 1), duration: "PT9M", views: 50_000 },
  ] });
  return {
    channels: [hot, tracked, thin],
    search: { "Claude Code": ["hotHIT00001", "hotSHORT001", "trkHIT00001", "thinHIT0001"], "KI Agenten": ["hotHIT00001"] },
  };
}

test("a Suchlauf measures each found channel and turns strong finds into Kandidaten", async () => {
  const api = fakeYoutube(world());
  const storage = memoryStorage([{ id: `youtube-${TRACKED}`, name: "T", handle: "@tracked", network: "youtube", audience: 1, accent: "#fff" }]);
  const result = await runYoutubeSearch({}, { storage, client: () => createYoutubeClient({ apiKey: "k", fetch: api.fetch }), now: () => NOW });

  assert.equal(result.status, "ok");
  assert.equal(result.shortsSkipped, 1, "the Short found by the search is dropped");
  const hit = storage.videos.get("yt-hotHIT00001");
  assert.equal(hit.factor, 10, "20,000 over the 2,000 median of the last 30 long-form uploads");
  assert.deepEqual(hit.queries.sort(), ["Claude Code", "KI Agenten"]);
  assert.deepEqual(hit.topics.sort(), ["agents", "claude"]);
  assert.equal(hit.market, "de", "the audio language wins over the term's market");
  assert.equal(storage.videos.get("yt-thinHIT0001").factor, 0, "three long-form videos are too few for a median");
  assert.equal(storage.videos.get("yt-trkHIT00001").factor, 9);

  assert.deepEqual([...storage.candidates.keys()], [`youtube:${HOT}`], "tracked and thin channels are no Kandidaten");
  const tiny = channel("UCtinychannel00000000000", { now: NOW, views: 40, extra: [{ id: "tinyHIT0001", channelId: "UCtinychannel00000000000", publishedAt: iso(NOW, 1), duration: "PT9M", views: 1_500 }] });
  const tinyWorld = { channels: [tiny], search: { "Claude Code": ["tinyHIT0001"] } };
  const tinyStorage = memoryStorage();
  await runYoutubeSearch({ termIds: ["en:claude-code"] }, { storage: tinyStorage, client: () => createYoutubeClient({ apiKey: "k", fetch: fakeYoutube(tinyWorld).fetch }), now: () => NOW });
  assert.equal(tinyStorage.videos.get("yt-tinyHIT0001").factor, 37.5, "the factor is still measured and shown");
  assert.equal(tinyStorage.candidates.size, 0, "1,500 views are below the Kandidat floor");
  const candidate = storage.candidates.get(`youtube:${HOT}`);
  assert.equal(candidate.decision, "proposed");
  assert.equal(candidate.bestFactor, 10);
  assert.match(candidate.reason, /1 Outlier ab 3x, stärkster 10\.0x/);
  assert.equal(candidate.evidence[0].id, "yt-hotHIT00001");

  const run = storage.runs[0];
  assert.equal(run.kind, "youtube-search");
  assert.deepEqual(run.queries, ["Claude Code", "KI Agenten"]);
  assert.equal(run.youtubeQuota.calls.search, 2);
  assert.equal(run.youtubeQuota.units, result.quota.units);
  assert.equal(result.quota.units, result.quota.calls.videos + result.quota.calls.channels + result.quota.calls.playlistItems, "search calls come from their own pot");
  assert.equal(api.requests.filter((r) => r.endpoint === "search").length, 2);
});

test("a second Suchlauf keeps Chris' rejection and adds the new source", async () => {
  const storage = memoryStorage();
  const client = () => createYoutubeClient({ apiKey: "k", fetch: fakeYoutube(world()).fetch });
  await runYoutubeSearch({ termIds: ["en:claude-code"] }, { storage, client, now: () => NOW });
  const key = `youtube:${HOT}`;
  storage.candidates.set(key, { ...storage.candidates.get(key), decision: "rejected" });
  const later = new Date(NOW.getTime() + 86_400_000);
  await runYoutubeSearch({}, { storage, client, now: () => later });
  const candidate = storage.candidates.get(key);
  assert.equal(candidate.decision, "rejected");
  assert.equal(candidate.dataAsOf, later.toISOString());
  assert.equal(candidate.sources.length, 3, "one source per term and run");
});

test("quotaExceeded stops the run instead of burning more calls, and the run says so", async () => {
  const api = fakeYoutube(world(), { fail: { search: { status: 403, body: { error: { message: "The request cannot be completed because you have exceeded your quota.", errors: [{ reason: "quotaExceeded" }] } } } } });
  const storage = memoryStorage();
  const result = await runYoutubeSearch({}, { storage, client: () => createYoutubeClient({ apiKey: "k", fetch: api.fetch }), now: () => NOW });
  assert.equal(result.status, "failed");
  assert.equal(api.requests.length, 1, "the second term is not searched after the quota error");
  assert.match(storage.runs[0].errors[0].message, /quotaExceeded/);
});

/** Reproduction of the review: 24 normal videos at 10,000 views; the search only finds the six weaker ones. */
function weakFindsWorld() {
  const id = "UCweakchannel00000000000";
  const normal = channel(id, { now: NOW, customUrl: "weak", views: 10_000, count: 24 });
  const finds = Array.from({ length: 6 }, (_, i) => ({ id: `weakFIND00${i}`, channelId: id, publishedAt: iso(NOW, 1 + i * 0.1), duration: "PT12M", views: i === 5 ? 5_000 : 1_000 }));
  normal.uploads.unshift(...finds);
  return { id, world: { channels: [normal], search: { "Claude Code": finds.map((v) => v.id) } } };
}

test("a failed baseline page leaves the channel unmeasured instead of a median over the search hits", async () => {
  const { id, world } = weakFindsWorld();
  const healthy = memoryStorage();
  await runYoutubeSearch({ termIds: ["en:claude-code"] }, { storage: healthy, client: () => createYoutubeClient({ apiKey: "k", fetch: fakeYoutube(world).fetch }), now: () => NOW });
  assert.equal(healthy.videos.get("yt-weakFIND005").factor, 0.5, "5,000 over the 10,000 median");
  assert.equal(healthy.candidates.size, 0);

  // The first videos call (search hits) works, the baseline page answers 503.
  const failing = fakeYoutube(world, { failWhen: (endpoint, _params, nth) => endpoint === "videos" && nth === 2 ? { status: 503, body: { error: { message: "backend error", errors: [{ reason: "backendError" }] } } } : null });
  const storage = memoryStorage();
  const result = await runYoutubeSearch({ termIds: ["en:claude-code"] }, { storage, client: () => createYoutubeClient({ apiKey: "k", fetch: failing.fetch }), now: () => NOW });
  assert.equal(result.status, "partial");
  assert.equal(result.channelsMeasured, 0);
  assert.equal(storage.videos.size, 0, "no factor from a wrong baseline is stored");
  assert.equal(storage.candidates.size, 0);
  assert.match(storage.runs[0].errors[0].message, /503/);
  assert.equal(storage.runs[0].creatorsSkipped, 1);
  void id;
});

test("videos without statistics stay out of the search baseline", async () => {
  const { world } = weakFindsWorld();
  for (const video of world.channels[0].uploads.slice(6, 18)) video.noStats = true;
  const storage = memoryStorage();
  const result = await runYoutubeSearch({ termIds: ["en:claude-code"] }, { storage, client: () => createYoutubeClient({ apiKey: "k", fetch: fakeYoutube(world).fetch }), now: () => NOW });
  assert.equal(result.countsMissing, 12);
  const find = storage.videos.get("yt-weakFIND005");
  assert.equal(find.baselineCount, 18);
  assert.equal(find.channelMedian, 10_000, "the twelve blanks do not pull the median down to 1,000");
  assert.equal(storage.candidates.size, 0);
});

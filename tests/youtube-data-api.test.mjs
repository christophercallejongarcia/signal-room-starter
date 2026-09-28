import test from "node:test";
import assert from "node:assert/strict";
import {
  applyUploadFormats,
  collectForChannel,
  createYoutubeClient,
  mapVideo,
  normalizeChannelInput,
  parseIsoDuration,
  recentUploads,
  resolveChannel,
  YoutubeKeyMissingError,
  YoutubeQuotaError,
} from "../lib/adapters/sources/youtube-data-api.ts";
import { channel, fakeYoutube } from "./youtube-fake-api.mjs";

const NOW = new Date("2026-09-28T12:00:00.000Z");
const KEY = "fake-test-key-not-real";
const CHANNEL = "UCabcdefghijklmnopqrstuv";

test("ISO 8601 durations become seconds; unreadable ones are 0", () => {
  assert.equal(parseIsoDuration("PT12M3S"), 723);
  assert.equal(parseIsoDuration("PT1H"), 3600);
  assert.equal(parseIsoDuration("P1DT2H"), 93_600);
  assert.equal(parseIsoDuration("PT0S"), 0);
  assert.equal(parseIsoDuration("P0D"), 0);
  assert.equal(parseIsoDuration("garbage"), 0);
  assert.equal(parseIsoDuration(undefined), 0);
});

test("channel input accepts handles, links and ids and rejects the rest", () => {
  assert.deepEqual(normalizeChannelInput("@Nate.Herk"), { handle: "nate.herk" });
  assert.deepEqual(normalizeChannelInput("https://www.youtube.com/@AIJason/videos"), { handle: "aijason" });
  assert.deepEqual(normalizeChannelInput(`https://youtube.com/channel/${CHANNEL}`), { id: CHANNEL });
  assert.deepEqual(normalizeChannelInput(CHANNEL), { id: CHANNEL });
  assert.equal(normalizeChannelInput("  "), null);
  assert.equal(normalizeChannelInput("https://www.youtube.com/@a"), null);
});

test("mapVideo is the one place with API fields: numbers, format, language, thumbnail", () => {
  const video = mapVideo({
    id: "abc123DEF45",
    snippet: {
      publishedAt: "2026-09-20T10:00:00Z",
      channelId: CHANNEL,
      channelTitle: "Chan",
      title: "  Claude Code in 10 Minuten ",
      description: "x".repeat(900),
      thumbnails: { medium: { url: "m" }, maxres: { url: "max" } },
      tags: ["Claude Code", "ai"],
      liveBroadcastContent: "none",
      defaultAudioLanguage: "de-DE",
    },
    contentDetails: { duration: "PT10M5S" },
    statistics: { viewCount: "12345", likeCount: "100" },
  });
  assert.equal(video.title, "Claude Code in 10 Minuten");
  assert.equal(video.views, 12345);
  assert.equal(video.comments, 0, "hidden comment counts read as 0");
  assert.equal(video.format, "long");
  assert.equal(video.market, "de");
  assert.equal(video.thumbnailUrl, "max");
  assert.equal(video.topic, "claude code");
  assert.ok([...video.description].length <= 500);
  assert.equal(mapVideo({ id: "x", snippet: { channelId: CHANNEL } }), null, "no publishedAt, no video");
  const short = mapVideo({ id: "s", snippet: { channelId: CHANNEL, publishedAt: "2026-09-20T10:00:00Z", title: "tip #shorts" }, contentDetails: { duration: "PT4M" } });
  assert.equal(short.format, "short", "#shorts in the title marks a Short even above three minutes");
});

test("every call is counted before it is sent; search is 100 units", async () => {
  const world = { channels: [channel(CHANNEL, { now: NOW, customUrl: "chan" })], search: { q: [] } };
  const api = fakeYoutube(world);
  const client = createYoutubeClient({ apiKey: KEY, fetch: api.fetch });
  await resolveChannel("@chan", client);
  await client.get("search", "search", { q: "q" });
  assert.deepEqual(client.quota(), { units: 101, calls: { search: 1, videos: 0, channels: 1, playlistItems: 0 } });
  assert.equal(api.requests[0].params.forHandle, "@chan");
});

test("the API key never reaches an error message", async () => {
  const api = fakeYoutube({ channels: [] }, {
    fail: { channels: { status: 400, body: { error: { message: `API key ${KEY} not valid`, errors: [{ reason: "badRequest" }] } } } },
  });
  const client = createYoutubeClient({ apiKey: KEY, fetch: api.fetch });
  await assert.rejects(resolveChannel("@chan", client), (error) => {
    assert.doesNotMatch(error.message, new RegExp(KEY));
    assert.match(error.message, /\[key\]/);
    return true;
  });
  const offline = createYoutubeClient({ apiKey: KEY, fetch: async (url) => { throw new Error(`connect ECONNREFUSED ${url}`); } });
  await assert.rejects(offline.get("videos", "videos", {}), (error) => !error.message.includes(KEY));
});

test("quotaExceeded becomes a YoutubeQuotaError; a missing key its own error", async () => {
  const api = fakeYoutube({ channels: [] }, { fail: { search: { status: 403, body: { error: { message: "quota", errors: [{ reason: "quotaExceeded" }] } } } } });
  const client = createYoutubeClient({ apiKey: KEY, fetch: api.fetch });
  await assert.rejects(client.get("search", "search", {}), YoutubeQuotaError);
  assert.throws(() => createYoutubeClient({ apiKey: "" }), YoutubeKeyMissingError);
});

test("uploads come from the long-form playlist; a 404 falls back to all uploads", async () => {
  const world = { channels: [channel(CHANNEL, { now: NOW, count: 3 })] };
  const client = createYoutubeClient({ apiKey: KEY, fetch: fakeYoutube(world).fetch });
  const page = await recentUploads({ channelId: CHANNEL, uploadsPlaylistId: `UU${CHANNEL.slice(2)}` }, client, 50);
  assert.equal(page.longformOnly, true);
  assert.equal(page.items.length, 3);
  const fallback = await recentUploads({ channelId: CHANNEL, uploadsPlaylistId: `UU${CHANNEL.slice(2)}` }, createYoutubeClient({ apiKey: KEY, fetch: fakeYoutube({ ...world, noUulf: true }).fetch }), 50);
  assert.equal(fallback.longformOnly, false);
});

test("the UULF page decides Short versus long-form over the duration heuristic", () => {
  const base = { channelId: CHANNEL, channelTitle: "c", title: "t", durationSeconds: 90, views: 1, likes: 0, comments: 0, topic: "x", live: false };
  const trailer = { ...base, videoId: "trailer", publishedAt: "2026-09-20T00:00:00.000Z", format: "short" };
  const vertical = { ...base, videoId: "vertical", publishedAt: "2026-09-21T00:00:00.000Z", format: "short" };
  const ancient = { ...base, videoId: "ancient", publishedAt: "2025-01-01T00:00:00.000Z", format: "short", durationSeconds: 600 };
  const page = { channelId: CHANNEL, longformOnly: true, items: [{ videoId: "trailer", publishedAt: "2026-09-20T00:00:00.000Z" }, { videoId: "older", publishedAt: "2026-09-01T00:00:00.000Z" }] };
  const [a, b, c] = applyUploadFormats([trailer, vertical, { ...ancient, format: "long" }], [page]);
  assert.equal(a.format, "long", "a 90-second landscape upload on UULF is long-form");
  assert.equal(b.format, "short", "newer than the page's oldest entry but missing from it: a Short");
  assert.equal(c.format, "long", "older than the page: the heuristic stands");
});

test("collecting a watchlist channel returns signals, fresh subscribers, read-model rows and quota", async () => {
  const world = { channels: [channel(CHANNEL, { now: NOW, customUrl: "chan", subscribers: 5_000, views: 1_000, count: 30 })] };
  world.channels[0].uploads[0].views = 9_000;
  const creator = { id: `youtube-${CHANNEL}`, name: "old", handle: "@chan", network: "youtube", audience: 1, accent: "#fff" };
  const result = await collectForChannel(creator, createYoutubeClient({ apiKey: KEY, fetch: fakeYoutube(world).fetch }), NOW);
  assert.equal(result.records.length, 30);
  assert.equal(result.records[0].id, `yt-${world.channels[0].uploads[0].id}`);
  assert.equal(result.records[0].format, "long");
  assert.equal(result.creatorPatch.audience, 5_000);
  const top = result.youtubeVideos.find((video) => video.views === 9_000);
  assert.equal(top.factor, 9, "9,000 views over a 1,000 median");
  assert.equal(top.source, "watchlist");
  assert.equal(result.youtubeQuota.units, 3, "channels + one playlist page + one videos call");
  assert.equal(result.usage.costUsd, 0);
});

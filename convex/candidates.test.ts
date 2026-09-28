/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");
// The generated api typing predates these modules; the runtime references resolve by path.
const candidates = (api as unknown as { candidates: Record<string, never> }).candidates as any;
const youtube = (api as unknown as { youtube: Record<string, never> }).youtube as any;

const T0 = "2026-09-28T10:00:00.000Z";
const candidate = {
  key: "youtube:UChotchannel000000000000",
  network: "youtube" as const,
  externalId: "UChotchannel000000000000",
  handle: "@hot",
  name: "Hot",
  audience: 40_000,
  market: "en" as const,
  reason: "1 Outlier",
  sources: [{ kind: "youtube-search" as const, label: "Claude Code", runId: "run-a", at: T0 }],
  evidence: [{ id: "yt-a", title: "A", url: "https://www.youtube.com/watch?v=a", factor: 5, views: 10_000, publishedAt: T0 }],
  bestFactor: 5,
  outlierCount: 1,
  channelMedian: 2_000,
  baselineCount: 30,
  dataAsOf: T0,
  decision: "proposed" as const,
  createdAt: T0,
  updatedAt: T0,
};

test("Convex claims a Kandidat atomically: the second claim conflicts, the stale settle is ignored", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(candidates.merge, { candidates: [candidate] });
  const claimed = await t.mutation(candidates.claim, { key: candidate.key, claimId: "a", now: T0 });
  expect(claimed.decision).toBe("selected");
  await expect(t.mutation(candidates.claim, { key: candidate.key, claimId: "b", now: T0 })).rejects.toThrow(/being added/);
  expect(await t.mutation(candidates.settle, { key: candidate.key, claimId: "b", result: { ok: true, creatorId: "x", now: T0 } })).toBeNull();
  const accepted = await t.mutation(candidates.settle, { key: candidate.key, claimId: "a", result: { ok: true, creatorId: "youtube-UChot", now: T0 } });
  expect(accepted).toMatchObject({ decision: "accepted", creatorId: "youtube-UChot" });
  expect(accepted.claimId).toBeUndefined();
  await expect(t.mutation(candidates.decide, { key: candidate.key, decision: "rejected", now: T0 })).rejects.toThrow(/already in the watchlist/);
});

test("Convex merge keeps a rejection and one row per key", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(candidates.merge, { candidates: [candidate] });
  await t.mutation(candidates.decide, { key: candidate.key, decision: "rejected", now: T0 });
  await t.mutation(candidates.merge, { candidates: [{ ...candidate, bestFactor: 8, dataAsOf: "2026-09-29T00:00:00.000Z", updatedAt: "2026-09-29T00:00:00.000Z" }] });
  const rows = await t.query(candidates.list, { network: "youtube" });
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ decision: "rejected", bestFactor: 8 });
});

test("the Outlier query filters by factor, market and publication window, strongest first", async () => {
  const t = convexTest(schema, modules);
  const video = (id: string, factor: number, market: "de" | "en", publishedAt: string) => ({
    id: `yt-${id}`, videoId: id, channelId: "UChot", channelTitle: "Hot", title: id, url: `https://www.youtube.com/watch?v=${id}`,
    publishedAt, durationSeconds: 600, views: 1, likes: 0, comments: 0, subscribers: 1, channelMedian: 1, baselineCount: 30,
    factor, viewsPerSubscriber: 1, viewsPerDay: 1, market, topics: ["claude" as const], queries: ["Claude Code"], source: "search" as const,
    measuredAt: T0, firstSeenAt: T0,
  });
  await t.mutation(youtube.saveVideos, { videos: [
    video("a", 12, "en", "2026-09-20T00:00:00.000Z"),
    video("b", 4, "en", "2026-09-21T00:00:00.000Z"),
    video("c", 2, "en", "2026-09-22T00:00:00.000Z"),
    video("d", 9, "de", "2026-09-23T00:00:00.000Z"),
    video("e", 20, "en", "2026-05-01T00:00:00.000Z"),
  ] });
  const rows = await t.query(youtube.outliers, { market: "en", publishedAfter: "2026-09-01T00:00:00.000Z" });
  expect(rows.map((row: { videoId: string }) => row.videoId)).toEqual(["a", "b"]);
  expect((await t.query(youtube.outliers, { minFactor: 10 })).map((row: { videoId: string }) => row.videoId)).toEqual(["e", "a"]);
});

test("hundreds of settled Kandidaten never push an open one out of the inbox page", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    for (let i = 0; i < 500; i += 1) {
      await ctx.db.insert("creatorCandidates", { ...candidate, key: `youtube:UCrejected${i}`, externalId: `UCrejected${i}`, bestFactor: 10, decision: "rejected" });
    }
    await ctx.db.insert("creatorCandidates", { ...candidate, key: "instagram:open", network: "instagram", externalId: "open", bestFactor: 50 });
  });
  await t.mutation(candidates.merge, { candidates: [{ ...candidate, bestFactor: 3 }] });
  const page = await t.query(candidates.list, { network: "youtube", limit: 200 });
  expect(page).toHaveLength(200);
  expect(page[0]).toMatchObject({ key: candidate.key, decision: "proposed" });
  expect(page.every((row: { network: string }) => row.network === "youtube")).toBe(true);
  expect((await t.query(candidates.list, { limit: 2 })).map((row: { key: string }) => row.key)).toEqual(["instagram:open", candidate.key]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { describeYoutubeOutlier, youtubeBaseline, youtubeFormat, youtubeMetrics } from "../lib/adapters/scoring/youtube-outlier.ts";
import { outlierScorer } from "../lib/adapters/scoring/outlier.ts";

const NOW = new Date("2026-09-28T12:00:00.000Z");
const day = (n) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

test("Shorts: three minutes and below, or tagged #shorts", () => {
  assert.equal(youtubeFormat(180), "short");
  assert.equal(youtubeFormat(181), "long");
  assert.equal(youtubeFormat(0), "short", "no duration is never long-form evidence");
  assert.equal(youtubeFormat(600, "Mein Setup #Shorts"), "short");
});

test("the baseline is the median of the newest 30 long-form videos; Shorts do not count", () => {
  const longform = Array.from({ length: 40 }, (_, i) => ({ views: i < 30 ? 1_000 : 100_000, publishedAt: day(i + 1), format: "long" }));
  const shorts = Array.from({ length: 20 }, (_, i) => ({ views: 1, publishedAt: day(i), format: "short" }));
  assert.deepEqual(youtubeBaseline([...shorts, ...longform]), { median: 1_000, count: 30 });
  assert.deepEqual(youtubeBaseline([{ views: 10, publishedAt: day(1), format: "long" }, { views: 30, publishedAt: day(2), format: "long" }]), { median: 20, count: 2 });
});

test("factor, views per subscriber and per day; 0 for a Short or a thin baseline", () => {
  const baseline = { median: 2_000, count: 30 };
  const metrics = youtubeMetrics({ views: 10_000, publishedAt: day(10), format: "long" }, baseline, 5_000, NOW);
  assert.deepEqual(metrics, { factor: 5, viewsPerSubscriber: 2, viewsPerDay: 1_000, ageDays: 10 });
  assert.equal(youtubeMetrics({ views: 10_000, publishedAt: day(10), format: "short" }, baseline, 5_000, NOW).factor, 0);
  assert.equal(youtubeMetrics({ views: 10_000, publishedAt: day(10), format: "long" }, { median: 2_000, count: 4 }, 0, NOW).factor, 0);
  assert.equal(youtubeMetrics({ views: 500, publishedAt: day(0.1), format: "long" }, baseline, 0, NOW).viewsPerDay, 500, "a fresh upload counts as one day old");
  assert.match(describeYoutubeOutlier(metrics, baseline, "long"), /5\.0x Kanal-Median .*30 Longform.*2\.00 Aufrufe pro Abo/);
  assert.match(describeYoutubeOutlier(metrics, { median: 0, count: 2 }, "long"), /erst 2 Longform/);
});

test("the scorer reads YouTube against the channel median and leaves Instagram on followers", () => {
  const yt = { id: "youtube-UCx", name: "Y", handle: "@y", network: "youtube", audience: 50_000, accent: "#fff" };
  const ig = { id: "instagram-a", name: "A", handle: "@a", network: "instagram", audience: 1_000, accent: "#fff" };
  const base = { likes: 0, comments: 0, durationSeconds: 600, thumbnailSeed: "s", topic: "t", title: "t" };
  const records = [
    ...Array.from({ length: 10 }, (_, i) => ({ ...base, id: `yt-${i}`, creatorId: yt.id, publishedAt: day(i + 2), views: 1_000, format: "long" })),
    { ...base, id: "yt-hit", creatorId: yt.id, publishedAt: day(1), views: 8_000, format: "long" },
    { ...base, id: "yt-short", creatorId: yt.id, publishedAt: day(1), views: 90_000, format: "short", durationSeconds: 40 },
    { ...base, id: "ig-1", creatorId: ig.id, publishedAt: day(1), views: 3_000, plays: 3_000, format: "reel", durationSeconds: 30 },
  ];
  const ranked = new Map(outlierScorer.rank(records, [yt, ig], NOW).map((signal) => [signal.id, signal]));
  assert.equal(ranked.get("yt-hit").outlier, 8, "8,000 over the 1,000 median; the Short does not move the baseline");
  assert.equal(ranked.get("yt-hit").channelMedian, 1_000);
  assert.equal(ranked.get("yt-hit").viewsPerSubscriber, 0.16);
  assert.equal(ranked.get("yt-short").outlier, 0, "Shorts never score");
  assert.equal(ranked.get("ig-1").outlier, 3, "Instagram stays plays over followers");
  assert.equal(ranked.get("ig-1").channelMedian, undefined);
});

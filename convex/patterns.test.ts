/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");
const signal = {
  id: "ig-a", creatorId: "creator-a", title: "Reel A", publishedAt: "2026-09-01T10:00:00.000Z",
  views: 4000, plays: 4000, likes: 10, comments: 2, durationSeconds: 30, thumbnailSeed: "a",
  topic: "ki-agenten", format: "reel" as const, transcript: "Beleg vor CTA", transcriptStatus: "ready" as const,
};
const comparison = (analysisId: string) => ({
  pattern: { id: "pattern-a", name: "Beleg", definition: "Beleg vor CTA", structure: ["Beleg", "CTA"], status: "candidate" as const, revision: 1, createdAt: "2026-09-10T10:00:00.000Z", updatedAt: "2026-09-10T10:00:00.000Z" },
  evidence: [{ id: "run-a:ig-a", patternId: "pattern-a", runId: "run-a", signalId: "ig-a", analysisId, verdict: "present" as const, explanation: "Explizit geprüft", quote: "Beleg", start: 0, end: 5, evaluatedAt: "2026-09-10T10:00:00.000Z", outlier: 4 }],
  run: { id: "run-a", patternId: "pattern-a", createdAt: "2026-09-10T10:00:00.000Z", windowDays: 90 as const, scope: { market: "de" as const, niche: "core" as const, topic: "ki-agenten", ageBucket: "8-30" as const, owned: false }, thresholds: { positiveReels: 5, positiveCreators: 3, negativeReels: 5 }, status: "insufficient" as const, positiveEvidenceIds: ["run-a:ig-a"], negativeEvidenceIds: [], unknownEvidenceIds: [], positiveCount: 1, negativeCount: 0, unknownCount: 0, positiveCreatorCount: 1, positiveMedian: 4, excluded: { duplicate: 0, market: 0, niche: 0, topic: 0, age: 0, owned: 0, incompleteAnalysis: 0, invalidOutlier: 0 }, caution: "Keine Kausalität." },
});

async function completeAnalysis(t: ReturnType<typeof convexTest>) {
  await t.mutation(api.signals.bulkUpsert, { records: [signal] });
  const [queued] = await t.query(api.transcriptAnalyses.list, { signalId: signal.id });
  await t.mutation(internal.transcriptAnalyses.claimInternal, {
    now: "2026-09-10T09:00:00.000Z", claimId: "pattern-worker", analysisId: queued.id,
  });
  await t.mutation(internal.transcriptAnalyses.settleInternal, {
    id: queued.id, claimId: "pattern-worker", status: "complete", now: "2026-09-10T09:01:00.000Z",
    framework: "none", findings: [], chunks: [{ index: 0, start: 0, end: signal.transcript.length, status: "complete" }],
    textLength: signal.transcript.length, complete: true,
  });
  return queued.id;
}

test("Convex atomically saves one idempotent Pattern comparison with separate evidence", async () => {
  const t = convexTest(schema, modules);
  const value = comparison(await completeAnalysis(t));
  await t.mutation(internal.patterns.saveInternal, value);
  await t.mutation(internal.patterns.saveInternal, value);
  expect(await t.query(api.patterns.list, { limit: 10 })).toEqual([value]);
  const counts = await t.run(async (ctx) => ({
    patterns: (await ctx.db.query("patterns").collect()).length,
    evidence: (await ctx.db.query("patternEvidence").collect()).length,
    runs: (await ctx.db.query("patternComparisonRuns").collect()).length,
  }));
  expect(counts).toEqual({ patterns: 1, evidence: 1, runs: 1 });
});

test("Convex rejects a new Pattern comparison after its transcript changes", async () => {
  const t = convexTest(schema, modules);
  const analysisId = await completeAnalysis(t);
  await t.mutation(api.signals.patchTranscript, {
    id: signal.id,
    patch: { transcriptWorkingCopy: "Eine neue Textfassung", transcriptUpdatedAt: "2026-09-10T09:02:00.000Z" },
  });

  await expect(t.mutation(internal.patterns.saveInternal, comparison(analysisId))).rejects.toThrow(/current|stale|text/i);
  expect(await t.query(api.patterns.list, { limit: 10 })).toEqual([]);
});

test("the public Pattern write fails closed without the server worker token", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(api.patterns.save, { ...comparison("analysis-a"), workerToken: "wrong" })).rejects.toThrow(/not authorized/i);
});

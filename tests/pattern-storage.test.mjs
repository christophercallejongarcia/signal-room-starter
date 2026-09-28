import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createTranscriptAnalysis } from "../lib/transcript-analysis.ts";

const patternSignal = {
  id: "ig-a", creatorId: "creator-a", title: "Reel A", publishedAt: "2026-09-01T10:00:00.000Z",
  views: 4000, plays: 4000, likes: 10, comments: 2, durationSeconds: 30, thumbnailSeed: "a",
  topic: "ki-agenten", format: "reel", transcript: "Beleg vor CTA", transcriptStatus: "ready",
};
const patternAnalysis = {
  ...createTranscriptAnalysis(patternSignal, "2026-09-10T09:00:00.000Z", "analysis-run-a"),
  status: "complete", attempts: 1, completedAt: "2026-09-10T09:01:00.000Z", complete: true,
  chunks: [{ index: 0, start: 0, end: patternSignal.transcript.length, status: "complete" }],
};
const comparison = {
  pattern: { id: "pattern-a", name: "Beleg", definition: "Beleg vor CTA", structure: ["Beleg", "CTA"], status: "candidate", revision: 1, createdAt: "2026-09-10T10:00:00.000Z", updatedAt: "2026-09-10T10:00:00.000Z" },
  evidence: [{ id: "run-a:ig-a", patternId: "pattern-a", runId: "run-a", signalId: "ig-a", analysisId: patternAnalysis.id, verdict: "present", explanation: "Beleg", quote: "Beleg", start: 0, end: 5, evaluatedAt: "2026-09-10T10:00:00.000Z", outlier: 4 }],
  run: { id: "run-a", patternId: "pattern-a", createdAt: "2026-09-10T10:00:00.000Z", windowDays: 90, scope: { market: "de", niche: "core", topic: "ki-agenten", ageBucket: "8-30", owned: false }, thresholds: { positiveReels: 5, positiveCreators: 3, negativeReels: 5 }, status: "insufficient", positiveEvidenceIds: ["run-a:ig-a"], negativeEvidenceIds: [], unknownEvidenceIds: [], positiveCount: 1, negativeCount: 0, unknownCount: 0, positiveCreatorCount: 1, positiveMedian: 4, excluded: { duplicate: 0, market: 0, niche: 0, topic: 0, age: 0, owned: 0, incompleteAnalysis: 0, invalidOutlier: 0 }, caution: "Keine Kausalität." },
};

test("file storage saves Pattern evidence separately and an identical run is a no-op", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "pattern-storage-"));
  const previous = process.cwd();
  process.chdir(dir);
  try {
    await mkdir(path.join(dir, "data"), { recursive: true });
    await writeFile(path.join(dir, "data", "store.json"), JSON.stringify({
      creators: [], signals: [patternSignal], transcriptDictionary: [], hashtagPosts: [], runs: [], ideas: [], scripts: [],
      formatReviews: [], hookRuns: [], briefings: [], slates: [], transcriptAnalyses: [patternAnalysis], patterns: [],
      patternEvidence: [], patternComparisonRuns: [],
    }), "utf8");
    const { fileStorage } = await import(`../lib/adapters/storage/file.ts?pattern=${Date.now()}`);
    await fileStorage.savePatternComparison(comparison);
    await fileStorage.savePatternComparison(comparison);
    assert.deepEqual(await fileStorage.listPatternComparisons(10), [comparison]);
    const raw = JSON.parse(await readFile(path.join(dir, "data", "store.json"), "utf8"));
    assert.equal(raw.patterns.length, 1);
    assert.equal(raw.patternEvidence.length, 1);
    assert.equal(raw.patternComparisonRuns.length, 1);
    assert.equal("evidence" in raw.patternComparisonRuns[0], false);
  } finally {
    process.chdir(previous);
    await rm(dir, { recursive: true, force: true });
  }
});

test("file storage rejects a new Pattern comparison after its transcript changes", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "pattern-storage-stale-"));
  const previous = process.cwd();
  process.chdir(dir);
  try {
    const signal = patternSignal;
    const analysis = patternAnalysis;
    await mkdir(path.join(dir, "data"), { recursive: true });
    await writeFile(path.join(dir, "data", "store.json"), JSON.stringify({
      creators: [], signals: [{ ...signal, transcript: "Eine neue Textfassung" }], transcriptDictionary: [], hashtagPosts: [],
      runs: [], ideas: [], scripts: [], formatReviews: [], hookRuns: [], briefings: [], slates: [],
      transcriptAnalyses: [analysis], patterns: [], patternEvidence: [], patternComparisonRuns: [],
    }), "utf8");
    const { fileStorage } = await import(`../lib/adapters/storage/file.ts?pattern-stale=${Date.now()}`);
    const staleComparison = {
      ...comparison,
      evidence: [{ ...comparison.evidence[0], analysisId: analysis.id, quote: "Beleg", start: 0, end: 5 }],
    };

    await assert.rejects(fileStorage.savePatternComparison(staleComparison), /current|stale|text/i);
    assert.deepEqual(await fileStorage.listPatternComparisons(10), []);
  } finally {
    process.chdir(previous);
    await rm(dir, { recursive: true, force: true });
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { CandidateConflictError, candidateKey, claimCandidate, decideCandidate, mergeCandidate, parseCandidateDecision, settleCandidate } from "../lib/candidates.ts";
import { acceptCandidate } from "../lib/candidate-intake.ts";

const T0 = "2026-09-28T10:00:00.000Z";
const T1 = "2026-09-28T11:00:00.000Z";

function candidate(overrides = {}) {
  return {
    key: "youtube:UChotchannel000000000000",
    network: "youtube",
    externalId: "UChotchannel000000000000",
    handle: "@hot",
    name: "Hot",
    audience: 40_000,
    market: "en",
    reason: "1 Outlier",
    sources: [{ kind: "youtube-search", label: "Claude Code", runId: "run-a", at: T0 }],
    evidence: [{ id: "yt-a", title: "A", url: "https://www.youtube.com/watch?v=a", factor: 5, views: 10_000, publishedAt: T0 }],
    bestFactor: 5,
    outlierCount: 1,
    channelMedian: 2_000,
    baselineCount: 30,
    dataAsOf: T0,
    decision: "proposed",
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

test("keys: YouTube channel ids keep their case, handles do not", () => {
  assert.equal(candidateKey("youtube", "UCAbC"), "youtube:UCAbC");
  assert.equal(candidateKey("instagram", "@Alan.Buildz"), "instagram:alan.buildz");
});

test("a merge keeps the decision, accumulates sources and never lets older numbers win", () => {
  const stored = candidate({ decision: "rejected", dataAsOf: T1, bestFactor: 7, updatedAt: T1 });
  const older = candidate({ sources: [{ kind: "youtube-search", label: "AI agents", runId: "run-0", at: T0 }], bestFactor: 3 });
  const merged = mergeCandidate(stored, older);
  assert.equal(merged.decision, "rejected");
  assert.equal(merged.bestFactor, 7, "the older find does not overwrite the newer measurement");
  assert.deepEqual(merged.sources.map((s) => s.label).sort(), ["AI agents", "Claude Code"]);
  const newer = mergeCandidate(stored, candidate({ dataAsOf: "2026-09-29T00:00:00.000Z", bestFactor: 9, evidence: [{ id: "yt-b", title: "B", url: "u", factor: 9, views: 1, publishedAt: T1 }] }));
  assert.equal(newer.bestFactor, 9);
  assert.deepEqual(newer.evidence.map((e) => e.id), ["yt-b", "yt-a"]);
});

test("claim, settle and decide follow the intake rules", () => {
  const claimed = claimCandidate(candidate(), "c1", T0);
  assert.equal(claimed.decision, "selected");
  assert.throws(() => claimCandidate(claimed, "c2", T0), (e) => e instanceof CandidateConflictError && e.reason === "claimed");
  assert.throws(() => decideCandidate(claimed, "rejected", T0), CandidateConflictError);
  assert.ok(claimCandidate(claimed, "c2", "2026-09-28T10:30:00.000Z"), "an expired claim is taken over");
  assert.equal(settleCandidate(claimed, "stale", { ok: true, creatorId: "x", now: T1 }), null);
  const failed = settleCandidate(claimed, "c1", { ok: false, error: "boom".repeat(200), now: T1 });
  assert.equal(failed.decision, "selected");
  assert.ok([...failed.acceptError].length <= 300);
  assert.equal(failed.claimId, undefined);
  const accepted = settleCandidate(claimCandidate(failed, "c3", T1), "c3", { ok: true, creatorId: "youtube-UChot", now: T1 });
  assert.equal(accepted.decision, "accepted");
  assert.equal(accepted.acceptError, undefined);
  assert.throws(() => decideCandidate(accepted, "rejected", T1), (e) => e.reason === "accepted");
  assert.throws(() => claimCandidate(accepted, "c4", T1), (e) => e.reason === "accepted");
});

test("the PATCH body only allows manual decisions on a known key shape", () => {
  assert.deepEqual(parseCandidateDecision({ key: "youtube:UCx", decision: "deferred" }), { key: "youtube:UCx", decision: "deferred" });
  assert.throws(() => parseCandidateDecision({ key: "youtube:UCx", decision: "accepted" }));
  assert.throws(() => parseCandidateDecision({ key: "UCx", decision: "rejected" }));
});

/** A store that applies the pure rules, like both real adapters do. */
function intakeStorage(rows, creators = []) {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return {
    creators,
    rows: byKey,
    async listCreators() { return creators; },
    async getCandidate(key) { return byKey.get(key) ?? null; },
    async claimCandidate(key, claimId, now) { const row = byKey.get(key); if (!row) return null; const next = claimCandidate(row, claimId, now); byKey.set(key, next); return next; },
    async settleCandidate(key, claimId, result) { const row = byKey.get(key); const next = row && settleCandidate(row, claimId, result); if (next) byKey.set(key, next); return next ?? null; },
  };
}

const creatorFor = (c) => ({ id: `youtube-${c.externalId}`, name: c.name, handle: c.handle, network: "youtube", audience: c.audience, accent: "#fff", market: "en" });

test("intake: one click backfills once, a concurrent click conflicts, a retry after failure continues", async () => {
  const row = candidate();
  const storage = intakeStorage([row]);
  let backfills = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const deps = {
    storage,
    now: () => new Date(T0),
    resolve: async (c) => creatorFor(c),
    backfill: async (creator) => { backfills += 1; await gate; storage.creators.push(creator); return { recordsAdded: 30 }; },
  };
  const first = acceptCandidate(row.key, deps);
  await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(acceptCandidate(row.key, deps), (e) => e instanceof CandidateConflictError && e.reason === "claimed");
  release();
  const done = await first;
  assert.equal(done.candidate.decision, "accepted");
  assert.equal(done.recordsAdded, 30);
  assert.equal(backfills, 1);
  const again = await acceptCandidate(row.key, deps);
  assert.equal(again.linked, true, "an accepted Kandidat answers as it is");
  assert.equal(backfills, 1);
});

test("intake: a failure leaves the Kandidat selected with its reason; an already tracked creator is linked without a backfill", async () => {
  const row = candidate();
  const storage = intakeStorage([row]);
  let fail = true;
  const deps = {
    storage,
    now: () => new Date(T0),
    resolve: async (c) => creatorFor(c),
    backfill: async () => { if (fail) throw new Error("videos.list answered 500"); return { recordsAdded: 3 }; },
  };
  await assert.rejects(acceptCandidate(row.key, deps), (e) => e.candidate?.decision === "selected" && /answered 500/.test(e.candidate.acceptError));
  fail = false;
  assert.equal((await acceptCandidate(row.key, deps)).candidate.decision, "accepted", "the retry claims again right away");

  const tracked = candidate({ key: "youtube:UCtracked", externalId: "UCtracked" });
  const linkStorage = intakeStorage([tracked], [creatorFor(tracked)]);
  let called = false;
  const linked = await acceptCandidate(tracked.key, { ...deps, storage: linkStorage, backfill: async () => { called = true; return { recordsAdded: 0 }; } });
  assert.equal(linked.linked, true);
  assert.equal(linked.candidate.creatorId, "youtube-UCtracked");
  assert.equal(called, false);
});

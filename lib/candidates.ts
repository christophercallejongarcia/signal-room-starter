// Relative imports: the Convex mutations in convex/candidates.ts run these same rules.
import type { CandidateDecision, CandidateEvidence, CandidateSettle, CandidateSource, CreatorCandidate, ManualCandidateDecision, Network } from "./contracts";
import { CANDIDATE_CLAIM_TIMEOUT_MS, CANDIDATE_EVIDENCE_LIMIT, CANDIDATE_SOURCE_LIMIT } from "./config.ts";

/**
 * Kandidaten (P4-05) and their watchlist intake (P4-09) as pure rules. Both
 * storage adapters apply them inside one write, so the file store and Convex
 * decide the same way. Nothing here calls a provider or touches the watchlist.
 */

export const CANDIDATE_DECISIONS: CandidateDecision[] = ["proposed", "selected", "accepted", "rejected", "deferred"];
export const MANUAL_DECISIONS: ManualCandidateDecision[] = ["proposed", "rejected", "deferred"];
const ERROR_MAX = 300;

/** Why a Kandidat cannot move right now. reason tells the route which status to answer. */
export class CandidateConflictError extends Error {
  readonly reason: "claimed" | "accepted";
  constructor(reason: "claimed" | "accepted", message: string) {
    super(message);
    this.reason = reason;
  }
}

/**
 * Normalised network/handle key. Instagram and TikTok handles are case-insensitive;
 * a YouTube channel id is case-sensitive and kept as it is.
 */
export function candidateKey(network: Network, externalId: string) {
  const id = externalId.trim().replace(/^@/, "");
  return `${network}:${network === "youtube" ? id : id.toLowerCase()}`;
}

function newerOrEqual(a: string, b: string) {
  return Date.parse(a) >= Date.parse(b);
}

function mergeSources(a: CandidateSource[], b: CandidateSource[]) {
  const byKey = new Map<string, CandidateSource>();
  for (const source of [...a, ...b]) byKey.set(`${source.kind}|${source.label}|${source.runId ?? ""}`, source);
  return [...byKey.values()].sort((x, y) => Date.parse(y.at) - Date.parse(x.at)).slice(0, CANDIDATE_SOURCE_LIMIT);
}

/** Strongest first; for the same video the newer measurement (incoming) wins. */
function mergeEvidence(current: CandidateEvidence[], incoming: CandidateEvidence[]) {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => b.factor - a.factor).slice(0, CANDIDATE_EVIDENCE_LIMIT);
}

/**
 * Folds one fresh find into the stored Kandidat. Sources always accumulate. The
 * numbers follow the newer dataAsOf, so an older find never overwrites a newer
 * measurement. The decision is never touched: a rejected or deferred Kandidat
 * stays so, whatever a later Suchlauf finds.
 */
export function mergeCandidate(existing: CreatorCandidate | null, incoming: CreatorCandidate): CreatorCandidate {
  if (!existing) return incoming;
  const fresher = newerOrEqual(incoming.dataAsOf, existing.dataAsOf);
  const numbers = fresher ? incoming : existing;
  const evidence = fresher ? mergeEvidence(existing.evidence, incoming.evidence) : mergeEvidence(incoming.evidence, existing.evidence);
  return {
    ...existing,
    network: existing.network,
    externalId: existing.externalId,
    handle: numbers.handle,
    name: numbers.name,
    ...(numbers.url ? { url: numbers.url } : {}),
    ...(numbers.avatarUrl ? { avatarUrl: numbers.avatarUrl } : {}),
    audience: numbers.audience,
    market: numbers.market,
    reason: numbers.reason,
    bestFactor: numbers.bestFactor,
    outlierCount: numbers.outlierCount,
    channelMedian: numbers.channelMedian,
    baselineCount: numbers.baselineCount,
    dataAsOf: numbers.dataAsOf,
    sources: mergeSources(existing.sources, incoming.sources),
    evidence,
    updatedAt: incoming.updatedAt,
  };
}

function claimIsLive(candidate: CreatorCandidate, now: string) {
  if (!candidate.claimId || !candidate.claimedAt) return false;
  return Date.parse(now) - Date.parse(candidate.claimedAt) < CANDIDATE_CLAIM_TIMEOUT_MS;
}

/** Chris' manual decision. Accepted is final here; removing a creator is a watchlist action. */
export function decideCandidate(candidate: CreatorCandidate, decision: ManualCandidateDecision, now: string): CreatorCandidate {
  if (!MANUAL_DECISIONS.includes(decision)) throw new Error(`decision must be one of ${MANUAL_DECISIONS.join(", ")}`);
  if (candidate.decision === "accepted") throw new CandidateConflictError("accepted", `${candidate.name} is already in the watchlist.`);
  if (claimIsLive(candidate, now)) throw new CandidateConflictError("claimed", `${candidate.name} is being added to the watchlist right now.`);
  const { claimId: _claim, claimedAt: _at, acceptError: _error, ...rest } = candidate;
  return { ...rest, decision, decidedAt: now, updatedAt: now };
}

/**
 * Claims the Kandidat for one intake. A live claim of another attempt is a
 * conflict, so a double click or a retry never starts a second paid backfill;
 * a claim older than CANDIDATE_CLAIM_TIMEOUT_MS is taken over.
 */
export function claimCandidate(candidate: CreatorCandidate, claimId: string, now: string): CreatorCandidate {
  if (candidate.decision === "accepted") throw new CandidateConflictError("accepted", `${candidate.name} is already in the watchlist.`);
  if (claimIsLive(candidate, now)) throw new CandidateConflictError("claimed", `${candidate.name} is being added to the watchlist right now.`);
  const { acceptError: _error, ...rest } = candidate;
  return { ...rest, decision: "selected", decidedAt: now, claimId, claimedAt: now, updatedAt: now };
}

/**
 * Ends the intake of the current claim. Success stores the creator id and
 * accepts; a failure keeps the Kandidat selected with the bounded reason, so
 * the next attempt starts again from there. A stale claim returns null.
 */
export function settleCandidate(candidate: CreatorCandidate, claimId: string, result: CandidateSettle): CreatorCandidate | null {
  if (candidate.claimId !== claimId) return null;
  const { claimId: _claim, claimedAt: _at, acceptError: _error, ...rest } = candidate;
  if (result.ok) return { ...rest, decision: "accepted", creatorId: result.creatorId, decidedAt: result.now, updatedAt: result.now };
  const chars = [...result.error];
  const error = chars.length > ERROR_MAX ? `${chars.slice(0, ERROR_MAX - 1).join("")}…` : result.error;
  return { ...rest, decision: "selected", acceptError: error, updatedAt: result.now };
}

/** Strongest first within a decision; accepted and rejected sink below the open ones. */
export function sortCandidates(candidates: CreatorCandidate[]) {
  const order: Record<CandidateDecision, number> = { selected: 0, proposed: 1, deferred: 2, accepted: 3, rejected: 4 };
  return [...candidates].sort((a, b) => order[a.decision] - order[b.decision] || b.bestFactor - a.bestFactor || a.key.localeCompare(b.key));
}

/** Parses the PATCH body of /api/candidates. */
export function parseCandidateDecision(input: unknown): { key: string; decision: ManualCandidateDecision } {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!key || key.length > 120 || !/^(youtube|instagram|tiktok):/.test(key)) throw new Error("key must be a Kandidat key like youtube:<channelId>.");
  if (typeof body.decision !== "string" || !MANUAL_DECISIONS.includes(body.decision as ManualCandidateDecision)) {
    throw new Error(`decision must be one of ${MANUAL_DECISIONS.join(", ")}.`);
  }
  return { key, decision: body.decision as ManualCandidateDecision };
}

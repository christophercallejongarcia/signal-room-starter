import { randomUUID } from "node:crypto";
import type { Creator, CreatorCandidate, StorageAdapter } from "./contracts";
import { CandidateConflictError } from "./candidates.ts";
import { logFailedBackfill, runBackfill, type CollectDeps, type CollectStep } from "./collect.ts";
import { createYoutubeClient, resolveChannel, youtubeCreatorId, type YoutubeClient } from "./adapters/sources/youtube-data-api.ts";

const ACCENTS = ["#b9ff5c", "#ff6546", "#5cc8ff", "#ffd75c", "#c77dff"];

export type IntakeStorage = Pick<StorageAdapter, "listCreators" | "claimCandidate" | "settleCandidate" | "getCandidate">;

export type IntakeDeps = {
  storage: IntakeStorage;
  now: () => Date;
  /** Builds the watchlist creator from the Kandidat with fresh channel numbers. */
  resolve: (candidate: CreatorCandidate) => Promise<Creator>;
  backfill: (creator: Creator) => Promise<CollectStep>;
  /** Records an intake that failed before the backfill logged its own run. */
  logFailure?: (candidate: CreatorCandidate, error: unknown) => Promise<void>;
};

export type IntakeResult = {
  candidate: CreatorCandidate;
  creator: Creator | null;
  /** True when the creator was already tracked and only got linked. */
  linked: boolean;
  recordsAdded: number;
};

async function resolveYoutube(candidate: CreatorCandidate, client: YoutubeClient): Promise<Creator> {
  const channel = await resolveChannel(candidate.externalId, client);
  return {
    id: youtubeCreatorId(channel.channelId),
    name: channel.name,
    handle: channel.handle,
    network: "youtube",
    audience: channel.subscribers,
    accent: ACCENTS[channel.channelId.length % ACCENTS.length],
    ...(channel.avatarUrl ? { avatarUrl: channel.avatarUrl } : {}),
    url: channel.url,
    // Missing market means "de"; the Kandidat's market carries over.
    ...(candidate.market === "en" ? { market: "en" as const } : {}),
  };
}

/** Watchlist id a Kandidat maps to, known before any provider call. */
export function creatorIdFor(candidate: CreatorCandidate) {
  if (candidate.network === "youtube") return youtubeCreatorId(candidate.externalId);
  return `${candidate.network}-${candidate.externalId.replace(/^@/, "").toLowerCase()}`;
}

/**
 * One intake, one YouTube client: resolving the channel and the backfill share
 * its quota ledger, so the logged run carries every call the click caused.
 */
export function defaultIntakeDeps(storage: IntakeStorage & CollectDeps["storage"]): IntakeDeps {
  let youtube: YoutubeClient | undefined;
  const client = () => (youtube ??= createYoutubeClient());
  return {
    storage,
    now: () => new Date(),
    async resolve(candidate) {
      if (candidate.network !== "youtube") throw new Error(`Watchlist intake for ${candidate.network} Kandidaten is not built yet.`);
      return resolveYoutube(candidate, client());
    },
    backfill: (creator) => runBackfill(creator, { storage }, creator.network === "youtube" ? { youtube: client() } : {}),
    logFailure: (candidate, error) => logFailedBackfill(storage, { id: creatorIdFor(candidate), handle: candidate.handle, network: candidate.network }, error, youtube),
  };
}

/**
 * Chris' one click (P4-09). The atomic claim keeps a double click or a retry
 * from starting a second paid backfill; an already tracked creator is linked
 * without one. Success accepts the Kandidat with the creator id. A failure
 * leaves it selected with the reason, and the next click starts over from the
 * stored state: the backfill is idempotent, so nothing is recorded twice.
 * An already accepted Kandidat is answered as it is.
 */
export async function acceptCandidate(key: string, deps: IntakeDeps): Promise<IntakeResult | null> {
  const claimId = randomUUID();
  let claimed: CreatorCandidate | null;
  try {
    claimed = await deps.storage.claimCandidate(key, claimId, deps.now().toISOString());
  } catch (error) {
    if (!(error instanceof CandidateConflictError) || error.reason !== "accepted") throw error;
    const candidate = await deps.storage.getCandidate(key);
    if (!candidate) return null;
    const creator = (await deps.storage.listCreators()).find((item) => item.id === candidate.creatorId) ?? null;
    return { candidate, creator, linked: true, recordsAdded: 0 };
  }
  if (!claimed) return null;

  try {
    const expectedId = creatorIdFor(claimed);
    const tracked = (await deps.storage.listCreators()).find((creator) => creator.id === expectedId);
    let creator = tracked;
    let recordsAdded = 0;
    if (!creator) {
      try {
        creator = await deps.resolve(claimed);
      } catch (error) {
        // The backfill never ran, so no run carries the calls resolving made.
        await deps.logFailure?.(claimed, error).catch(() => undefined);
        throw error;
      }
      recordsAdded = (await deps.backfill(creator)).recordsAdded;
    }
    const settled = await deps.storage.settleCandidate(key, claimId, { ok: true, creatorId: creator.id, now: deps.now().toISOString() });
    return { candidate: settled ?? claimed, creator, linked: Boolean(tracked), recordsAdded };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const settled = await deps.storage.settleCandidate(key, claimId, { ok: false, error: message, now: deps.now().toISOString() });
    throw Object.assign(new Error(message), { candidate: settled });
  }
}

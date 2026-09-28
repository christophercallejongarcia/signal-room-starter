import { randomUUID } from "node:crypto";
import type { Creator, Network, CoverCacheResult, RefreshResult, Run, RunError, RunUsage, SignalRecord, TranscriptCount, TranscriptSignalPatch, YoutubeQuota, YoutubeVideo } from "./contracts";
import { collectForCreator, type CollectResult } from "./adapters/sources/apify-instagram.ts";
import { collectForChannel, createYoutubeClient, youtubeApiKey, YoutubeQuotaError, type YoutubeClient } from "./adapters/sources/youtube-data-api.ts";
import { transcribeReels, type Transcriber } from "./adapters/sources/apify-transcripts.ts";
import { getStorage, type Storage } from "./adapters/storage/index.ts";
import { cacheCovers } from "./adapters/storage/cover-cache.ts";
import { REFRESH_CREATOR_LIMIT, TRANSCRIPT_LIMIT_PER_RUN, YOUTUBE_REFRESH_CHANNEL_LIMIT } from "./config.ts";
import { addUsage, pickRefreshBatch } from "./run-cost.ts";
import { boundedTranscriptError, pickTranscriptBatch } from "./transcripts.ts";

/** The slice of Storage a collection pass touches; the cron hands in one built over a Convex action context. */
export type CollectStorage = Pick<Storage, "listCreators" | "upsertCreator" | "listSignals" | "saveSignals" | "saveRun"> &
  Partial<Pick<Storage, "patchTranscript" | "saveYoutubeVideos">>;

/**
 * What one network's connector hands back for one creator. Instagram brings
 * records and Apify usage; YouTube adds the fresh channel numbers, the Outlier
 * read-model rows and the quota it used.
 */
export type NetworkCollectResult = CollectResult & {
  creatorPatch?: Partial<Pick<Creator, "audience" | "name" | "avatarUrl" | "url">>;
  youtubeVideos?: YoutubeVideo[];
};

/**
 * What one pass hands every connector call. The YouTube client is the pass's
 * quota ledger: one per run, so failed and preceding calls count too.
 */
export type CollectContext = { youtube?: YoutubeClient };

/** The Netzwerk-Weiche: each creator goes to the connector of its network. */
export async function collectForNetwork(creator: Creator, context: CollectContext = {}): Promise<NetworkCollectResult> {
  if (creator.network === "instagram") return collectForCreator(creator);
  if (creator.network === "youtube") return collectForChannel(creator, context.youtube ?? createYoutubeClient());
  throw new Error(`Network ${creator.network} has no connector yet`);
}

export type CollectDeps = {
  storage: CollectStorage;
  collect: (creator: Creator, context?: CollectContext) => Promise<NetworkCollectResult>;
  /** Opens the YouTube client, and with it the quota ledger, of one pass. */
  youtubeClient: () => YoutubeClient;
  cacheCovers: (records: SignalRecord[]) => Promise<CoverCacheResult>;
  now: () => Date;
  /** Creators one Delta-Refresh may touch. */
  creatorLimit: number;
  /** Fetches what is said in the given reels. */
  transcribe: Transcriber;
  /** Reels one Delta-Refresh may send to the transcript actor. */
  transcriptLimit: number;
  /** YouTube channels one refresh may touch. */
  youtubeLimit: number;
  /** False without YOUTUBE_API_KEY: YouTube channels are left out of the refresh instead of failing each. */
  youtubeEnabled: boolean;
  /** Networks this refresh covers. A YouTube-only refresh costs quota, never Apify money. */
  networks: Network[];
};

function defaultDeps(overrides: Partial<CollectDeps>): CollectDeps {
  // Storage is resolved lazily: a caller that brings its own (the Convex cron) never opens the server's.
  return {
    storage: overrides.storage ?? getStorage(),
    collect: collectForNetwork,
    cacheCovers,
    now: () => new Date(),
    creatorLimit: REFRESH_CREATOR_LIMIT,
    transcribe: transcribeReels,
    transcriptLimit: TRANSCRIPT_LIMIT_PER_RUN,
    youtubeLimit: YOUTUBE_REFRESH_CHANNEL_LIMIT,
    youtubeEnabled: Boolean(youtubeApiKey()),
    youtubeClient: () => createYoutubeClient(),
    networks: ["instagram", "youtube"],
    ...overrides,
  };
}

export type CollectStep = { recordsAdded: number; recordsUpdated: number; covers: CoverCacheResult; usage: RunUsage; youtubeQuota?: YoutubeQuota };

/** The ledger's figures, or none when the pass never opened a YouTube client. */
function ledger(client: YoutubeClient | undefined): { youtubeQuota?: YoutubeQuota } {
  return client ? { youtubeQuota: client.quota() } : {};
}

const NO_USAGE: RunUsage = { unreported: 0 };
/** What a YouTube Data API pass costs in dollars. */
const FREE: RunUsage = { unreported: 0, computeUnits: 0, costUsd: 0 };

/** Keeps the automatic pass compatible with the small fake stores used in tests. */
async function saveTranscriptBatch(deps: CollectDeps, records: SignalRecord[]) {
  if (!deps.storage.patchTranscript) return deps.storage.saveSignals(records);
  for (const record of records) {
    const patch: TranscriptSignalPatch = {
      ...(record.transcript !== undefined ? { transcript: record.transcript } : {}),
      ...(record.transcriptSegments !== undefined ? { transcriptSegments: record.transcriptSegments } : {}),
      ...(record.transcriptAttempts !== undefined ? { transcriptAttempts: record.transcriptAttempts } : {}),
      ...(record.transcriptUpdatedAt !== undefined ? { transcriptUpdatedAt: record.transcriptUpdatedAt } : {}),
      ...(record.transcriptError !== undefined ? { transcriptError: record.transcriptError } : {}),
      ...(record.transcriptStatus !== undefined ? { transcriptStatus: record.transcriptStatus } : {}),
      // A new actor response always starts a fresh review chain.
      transcriptWorkingCopy: null,
      transcriptCorrections: null,
    };
    await deps.storage.patchTranscript(record.id, patch);
  }
  return { inserted: 0, updated: records.length };
}

/**
 * One collection step for a creator: pull signals (backfill or delta-refresh
 * depending on lastCheckedAt), store them, advance the cursor, cache covers.
 * Idempotent per record and per cover. The cursor moves only after both
 * streams succeeded and the records are stored; an actor error propagates.
 */
export async function collectAndStore(creator: Creator, overrides: Partial<CollectDeps> = {}, context: CollectContext = {}): Promise<CollectStep> {
  const deps = defaultDeps(overrides);
  const startedAt = deps.now();
  const { records, usage, creatorPatch, youtubeVideos } = await deps.collect(creator, context);
  const saved = await deps.storage.saveSignals(records);
  if (youtubeVideos?.length && deps.storage.saveYoutubeVideos) await deps.storage.saveYoutubeVideos(youtubeVideos);
  // YouTube hands back the channel's current subscriber count; the Outlier ratio per Abo reads it.
  await deps.storage.upsertCreator({ ...creator, ...creatorPatch, lastCheckedAt: startedAt.toISOString() });
  const covers = await deps.cacheCovers(records);
  return { recordsAdded: saved.inserted, recordsUpdated: saved.updated, covers, usage };
}

/**
 * The transcript pass of a refresh: the outlier reels without an outcome yet go
 * to the transcript actor once, at most transcriptLimit of them. They are marked
 * pending before the actor is called. A reel with text stores it as ready, one
 * the actor answered without text is silent, one the actor left out while
 * answering others is missing. An actor failure marks every sent reel failed,
 * records the bounded cause and counts those failures on the run. The actor's
 * usage counts into the same run as the collection.
 */
async function transcribeOutliers(deps: CollectDeps, creators: Creator[]): Promise<{ count: TranscriptCount; usage: RunUsage }> {
  const count: TranscriptCount = { added: 0, silent: 0, missing: 0, failed: 0 };
  if (deps.transcriptLimit <= 0) return { count, usage: NO_USAGE };
  const batch = pickTranscriptBatch(await deps.storage.listSignals(), creators, { limit: deps.transcriptLimit, now: deps.now() });
  if (batch.length === 0) return { count, usage: NO_USAGE };

  const pendingAt = deps.now().toISOString();
  const pending = batch.map((reel) => {
    const { savedAt, ...stored } = reel;
    void savedAt;
    return {
      ...stored,
      transcriptStatus: "pending" as const,
      transcriptAttempts: Math.max(0, Math.floor(reel.transcriptAttempts ?? 0)) + 1,
      transcriptUpdatedAt: pendingAt,
    };
  });
  const attempts = new Map(pending.map((reel) => [reel.id, reel.transcriptAttempts]));
  await saveTranscriptBatch(deps, pending);

  let results: Awaited<ReturnType<Transcriber>>["results"] = [];
  let usage: RunUsage = NO_USAGE;
  try {
    ({ results, usage } = await deps.transcribe(batch));
  } catch (error) {
    await failTranscriptBatch(deps, batch, error, { unreported: 1 });
  }
  const answered = new Map(results.map((result) => [result.id, result.transcript]));
  if (![...answered.keys()].some((id) => batch.some((reel) => reel.id === id))) {
    await failTranscriptBatch(
      deps,
      batch,
      new Error(`transcript actor answered ${results.length} item(s), none for the ${batch.length} reel(s) sent`),
      usage,
    );
  }
  const patched: SignalRecord[] = [];
  for (const reel of batch) {
    // savedAt is Chris' mark: never part of what a refresh writes back.
    const { savedAt, ...stored } = reel;
    void savedAt;
    if (!answered.has(reel.id)) {
      patched.push({
        ...stored,
        transcriptStatus: "missing",
        transcriptAttempts: attempts.get(reel.id),
        transcriptUpdatedAt: deps.now().toISOString(),
      });
      count.missing += 1;
    } else if (answered.get(reel.id)) {
      const result = results.find((candidate) => candidate.id === reel.id);
      patched.push({
        ...stored,
        transcript: answered.get(reel.id)!,
        transcriptStatus: "ready",
        transcriptAttempts: attempts.get(reel.id),
        transcriptUpdatedAt: deps.now().toISOString(),
        ...(result?.segments?.length ? { transcriptSegments: result.segments } : {}),
      });
      count.added += 1;
    } else {
      patched.push({
        ...stored,
        transcriptStatus: "silent",
        transcriptAttempts: attempts.get(reel.id),
        transcriptUpdatedAt: deps.now().toISOString(),
      });
      count.silent += 1;
    }
  }
  await saveTranscriptBatch(deps, patched);
  return { count, usage };
}

/** An actor failure after the batch was marked pending. */
class TranscriptPassError extends Error {
  readonly failed: number;
  readonly usage: RunUsage;

  constructor(message: string, failed: number, usage: RunUsage) {
    super(message);
    this.failed = failed;
    this.usage = usage;
  }
}

async function failTranscriptBatch(deps: CollectDeps, batch: SignalRecord[], error: unknown, usage: RunUsage): Promise<never> {
  const message = boundedTranscriptError(error);
  const updatedAt = deps.now().toISOString();
  const failed = batch.map((reel) => {
    const { savedAt, ...stored } = reel;
    void savedAt;
    return {
      ...stored,
      transcriptStatus: "failed" as const,
      transcriptAttempts: Math.max(0, Math.floor(reel.transcriptAttempts ?? 0)) + 1,
      transcriptUpdatedAt: updatedAt,
      transcriptError: message,
    };
  });
  await saveTranscriptBatch(deps, failed);
  throw new TranscriptPassError(message, batch.length, usage);
}

function addCounts(a: CoverCacheResult, b: CoverCacheResult): CoverCacheResult {
  return { cached: a.cached + b.cached, skipped: a.skipped + b.skipped, failed: a.failed + b.failed };
}

function newRunId(startedAt: Date) {
  return `run-${startedAt.toISOString()}-${randomUUID().slice(0, 8)}`;
}

function runStatus(checked: number, failed: number, skipped: number, transcriptsFailed = false): Run["status"] {
  if (checked > 0 && failed >= checked) return "failed";
  return failed === 0 && skipped === 0 && !transcriptsFailed ? "ok" : "partial";
}

/**
 * First import for a newly added creator, logged as a backfill run. The error
 * is rethrown after the run is written so the caller can answer 502. A YouTube
 * caller that already resolved the channel hands in its client, so the run's
 * quota includes that call; the ledger is logged on success and on failure.
 */
export async function runBackfill(creator: Creator, overrides: Partial<CollectDeps> = {}, context: CollectContext = {}): Promise<CollectStep> {
  const deps = defaultDeps(overrides);
  const startedAt = deps.now();
  let step: CollectStep | undefined;
  let failure: unknown;
  let youtube = context.youtube;
  try {
    if (creator.network === "youtube") youtube ??= deps.youtubeClient();
    step = { ...(await collectAndStore(creator, deps, { youtube })), ...ledger(youtube) };
  } catch (error) {
    failure = error;
  }
  const finishedAt = deps.now();
  const message = failure instanceof Error ? failure.message : String(failure);
  await deps.storage.saveRun({
    id: newRunId(startedAt),
    kind: "backfill",
    status: step ? "ok" : "failed",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    creatorsChecked: 1,
    recordsAdded: step?.recordsAdded ?? 0,
    recordsUpdated: step?.recordsUpdated ?? 0,
    errors: step ? [] : [{ creatorId: creator.id, handle: creator.handle, message }],
    // A failed backfill ran the actors too, but their usage never came back: unknown, not free.
    // YouTube has no actor: the Data API is free, its calls are in the ledger either way.
    usage: step?.usage ?? (creator.network === "youtube" ? FREE : { unreported: 2 }),
    ...ledger(youtube),
  });
  if (!step) throw failure;
  return step;
}

/**
 * Logs a backfill that failed before it could start, e.g. while a YouTube
 * channel was being resolved, so the calls it made still appear with their quota.
 */
export async function logFailedBackfill(
  storage: Pick<CollectStorage, "saveRun">,
  creator: Pick<Creator, "id" | "handle" | "network">,
  error: unknown,
  youtube?: YoutubeClient,
  now = new Date(),
) {
  await storage.saveRun({
    id: newRunId(now),
    kind: "backfill",
    status: "failed",
    startedAt: now.toISOString(),
    finishedAt: now.toISOString(),
    durationMs: 0,
    creatorsChecked: 1,
    recordsAdded: 0,
    recordsUpdated: 0,
    errors: [{ creatorId: creator.id, handle: creator.handle, message: error instanceof Error ? error.message : String(error) }],
    usage: creator.network === "youtube" ? FREE : { unreported: 0 },
    ...ledger(youtube),
  });
}

/**
 * Delta-refresh over the watchlist: the Instagram creators (at most creatorLimit
 * per run, never-checked and stalest cursor first) and the YouTube channels (at
 * most youtubeLimit, same order). A failing creator is recorded in the run and
 * skipped; the others continue. Creators past a limit keep their lastCheckedAt
 * and the run ends partial, so the next run picks them up first. The run is
 * persisted even when every creator failed, so the Profile tab shows what
 * happened, what it cost and how much YouTube quota it used.
 */
export async function runRefresh(overrides: Partial<CollectDeps> = {}): Promise<RefreshResult> {
  const deps = defaultDeps(overrides);
  const startedAt = deps.now();
  const tracked = await deps.storage.listCreators();
  const instagram = deps.networks.includes("instagram") ? tracked.filter((c) => c.network === "instagram") : [];
  const youtube = deps.networks.includes("youtube") ? tracked.filter((c) => c.network === "youtube") : [];
  if (youtube.length && !deps.youtubeEnabled) {
    console.log(`Refresh leaves ${youtube.length} YouTube channel(s) out: YOUTUBE_API_KEY is not set here.`);
  }
  const igBatch = pickRefreshBatch(instagram, deps.creatorLimit);
  const ytBatch = pickRefreshBatch(deps.youtubeEnabled ? youtube : [], deps.youtubeLimit);
  const creators = [...igBatch.batch, ...ytBatch.batch];
  const skipped = [...igBatch.skipped, ...ytBatch.skipped];
  let recordsAdded = 0;
  let recordsUpdated = 0;
  let covers: CoverCacheResult = { cached: 0, skipped: 0, failed: 0 };
  let usage = NO_USAGE;
  const errors: RunError[] = [];
  // One client per run: its ledger counts every YouTube call, failed ones included.
  let youtubeClient: YoutubeClient | undefined;
  let quotaExhausted = false;
  const checked: Creator[] = [];

  for (const creator of creators) {
    // After quotaExceeded every further call would fail too: the rest keep their cursor for tomorrow.
    if (creator.network === "youtube" && quotaExhausted) {
      skipped.push(creator);
      continue;
    }
    checked.push(creator);
    try {
      if (creator.network === "youtube") youtubeClient ??= deps.youtubeClient();
      const step = await collectAndStore(creator, deps, { youtube: youtubeClient });
      recordsAdded += step.recordsAdded;
      recordsUpdated += step.recordsUpdated;
      covers = addCounts(covers, step.covers);
      usage = addUsage(usage, step.usage);
    } catch (error) {
      errors.push({ creatorId: creator.id, handle: creator.handle, message: error instanceof Error ? error.message : String(error) });
      if (error instanceof YoutubeQuotaError) quotaExhausted = true;
      // The failing creator's actors ran (one stream may have finished) but their usage is lost with the error.
      if (creator.network !== "youtube") usage = addUsage(usage, { unreported: 2 });
    }
  }
  if (quotaExhausted) console.log(`Refresh stopped YouTube after quotaExceeded; ${skipped.filter((c) => c.network === "youtube").length} channel(s) keep their cursor.`);
  const youtubeQuota = youtubeClient?.quota();

  // Transcripts ride on the same run and the same budget as the collection. A
  // failing actor is one logged error, never a lost refresh.
  let transcripts: TranscriptCount = { added: 0, silent: 0, missing: 0, failed: 0 };
  let transcriptsFailed = false;
  try {
    const pass = await transcribeOutliers(deps, instagram);
    transcripts = pass.count;
    usage = addUsage(usage, pass.usage);
  } catch (error) {
    transcriptsFailed = true;
    if (error instanceof TranscriptPassError) transcripts.failed += error.failed;
    errors.push({ creatorId: "transcripts", handle: "transcripts", message: error instanceof Error ? error.message : String(error) });
    // A mismatch still ran and was paid; any other failure lost its figure with the error.
    usage = addUsage(usage, error instanceof TranscriptPassError ? error.usage : { unreported: 1 });
  }

  // Second pass over the stored corpus: a cover that failed on an earlier run
  // is retried as long as its CDN link still resolves. Already cached files are skipped.
  // A network-scoped refresh only catches up the covers of its own networks.
  const covered = new Set([...instagram, ...youtube].map((creator) => creator.id));
  const catchUp = await deps.cacheCovers((await deps.storage.listSignals()).filter((signal) => covered.has(signal.creatorId)));
  covers = { cached: covers.cached + catchUp.cached, skipped: catchUp.skipped, failed: catchUp.failed };

  const finishedAt = deps.now();
  const run: Run = {
    id: newRunId(startedAt),
    kind: "refresh",
    status: runStatus(checked.length, errors.length - (transcriptsFailed ? 1 : 0), skipped.length, transcriptsFailed),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    creatorsChecked: checked.length,
    creatorsSkipped: skipped.length,
    recordsAdded,
    recordsUpdated,
    errors,
    usage,
    transcripts,
    ...(youtubeQuota ? { youtubeQuota } : {}),
  };
  await deps.storage.saveRun(run);
  if (youtubeQuota) console.log(`Refresh ${run.id}: YouTube-Quota ${youtubeQuota.units} Einheiten für ${checked.filter((c) => c.network === "youtube").length} Kanäle.`);

  return {
    creatorsChecked: checked.length,
    creatorsSkipped: skipped.length,
    recordsAdded,
    recordsUpdated,
    completedAt: run.finishedAt,
    covers,
    errors: errors.map((e) => `${e.handle}: ${e.message}`),
    runId: run.id,
    ...(youtubeQuota ? { youtubeQuota } : {}),
  };
}

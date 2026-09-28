import { mutation, query, type MutationCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { CreatorCandidate } from "../lib/contracts";
import { CANDIDATE_DECISION_ORDER, CandidateConflictError, claimCandidate, decideCandidate, mergeCandidate, settleCandidate, sortCandidates } from "../lib/candidates";
import { candidateDecision, candidateFields } from "./schema";

/**
 * Kandidaten (P4-05) and the watchlist-intake claim (P4-09). Every rule lives in
 * lib/candidates.ts; these mutations only apply it inside one transaction, so a
 * double click can never claim the same Kandidat twice.
 */

const LIST_MAX = 500;

function plain(row: { _id: unknown; _creationTime: unknown } & CreatorCandidate): CreatorCandidate {
  const { _id, _creationTime, ...rest } = row;
  return rest;
}

async function byKey(ctx: MutationCtx, key: string) {
  return ctx.db
    .query("creatorCandidates")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
}

/** A lib conflict crosses the Convex boundary as data, so the reason survives a prod deployment. */
function conflict(error: unknown): never {
  if (error instanceof CandidateConflictError) {
    throw new ConvexError({ kind: "candidate-conflict", reason: error.reason, message: error.message });
  }
  throw error;
}

export const list = query({
  args: {
    network: v.optional(v.union(v.literal("youtube"), v.literal("instagram"), v.literal("tiktok"))),
    decision: v.optional(candidateDecision),
    limit: v.optional(v.number()),
  },
  /**
   * Network and decision narrow the index range before the limit applies, one
   * decision group at a time in inbox order (open first). Hundreds of settled
   * Kandidaten therefore never push an open one out of the page.
   */
  handler: async (ctx, { network, decision, limit }) => {
    const cap = Math.min(Math.max(limit ?? 100, 1), LIST_MAX);
    const rows: CreatorCandidate[] = [];
    for (const group of decision ? [decision] : CANDIDATE_DECISION_ORDER) {
      if (rows.length >= cap) break;
      const page = network
        ? await ctx.db.query("creatorCandidates").withIndex("by_network_and_decision_and_bestFactor", (q) => q.eq("network", network).eq("decision", group)).order("desc").take(cap - rows.length)
        : await ctx.db.query("creatorCandidates").withIndex("by_decision_and_bestFactor", (q) => q.eq("decision", group)).order("desc").take(cap - rows.length);
      rows.push(...page.map(plain));
    }
    return sortCandidates(rows);
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("creatorCandidates")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return row ? plain(row) : null;
  },
});

/** Folds fresh finds in; decisions stay as Chris set them. */
export const merge = mutation({
  args: { candidates: v.array(v.object(candidateFields)) },
  handler: async (ctx, { candidates }) => {
    let inserted = 0;
    let updated = 0;
    for (const incoming of candidates) {
      const existing = await byKey(ctx, incoming.key);
      const merged = mergeCandidate(existing ? plain(existing) : null, incoming);
      if (existing) {
        await ctx.db.replace(existing._id, merged);
        updated += 1;
      } else {
        await ctx.db.insert("creatorCandidates", merged);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

export const decide = mutation({
  args: { key: v.string(), decision: v.union(v.literal("proposed"), v.literal("rejected"), v.literal("deferred")), now: v.string() },
  handler: async (ctx, { key, decision, now }) => {
    const existing = await byKey(ctx, key);
    if (!existing) return null;
    let next: CreatorCandidate;
    try {
      next = decideCandidate(plain(existing), decision, now);
    } catch (error) {
      conflict(error);
    }
    await ctx.db.replace(existing._id, next);
    return next;
  },
});

export const claim = mutation({
  args: { key: v.string(), claimId: v.string(), now: v.string() },
  handler: async (ctx, { key, claimId, now }) => {
    const existing = await byKey(ctx, key);
    if (!existing) return null;
    let next: CreatorCandidate;
    try {
      next = claimCandidate(plain(existing), claimId, now);
    } catch (error) {
      conflict(error);
    }
    await ctx.db.replace(existing._id, next);
    return next;
  },
});

export const settle = mutation({
  args: {
    key: v.string(),
    claimId: v.string(),
    result: v.union(
      v.object({ ok: v.literal(true), creatorId: v.string(), now: v.string() }),
      v.object({ ok: v.literal(false), error: v.string(), now: v.string() }),
    ),
  },
  handler: async (ctx, { key, claimId, result }) => {
    const existing = await byKey(ctx, key);
    if (!existing) return null;
    const next = settleCandidate(plain(existing), claimId, result);
    if (!next) return null;
    await ctx.db.replace(existing._id, next);
    return next;
  },
});

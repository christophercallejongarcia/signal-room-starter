import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { YoutubeVideo } from "../lib/contracts";
import { matchesOutlierQuery, mergeYoutubeVideo, normalizeOutlierQuery } from "../lib/youtube-videos";
import { youtubeSearchTermFields, youtubeVideoFields } from "./schema";

/** Rows the Outlier query scans at most before it answers with what it has. */
const OUTLIER_SCAN_MAX = 3_000;

function plain<T extends { _id: unknown; _creationTime: unknown }>(row: T): Omit<T, "_id" | "_creationTime"> {
  const { _id, _creationTime, ...rest } = row;
  return rest;
}

/** Idempotent on id: the newer measurement carries the numbers, queries and topics accumulate. */
export const saveVideos = mutation({
  args: { videos: v.array(v.object(youtubeVideoFields)) },
  handler: async (ctx, { videos }) => {
    let inserted = 0;
    let updated = 0;
    const seen = new Set<string>();
    for (const video of videos) {
      const existing = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_external_id", (q) => q.eq("id", video.id))
        .unique();
      if (existing) await ctx.db.replace(existing._id, mergeYoutubeVideo(plain(existing) as YoutubeVideo, video));
      else await ctx.db.insert("youtubeVideos", video);
      if (seen.has(video.id)) continue;
      seen.add(video.id);
      if (existing) updated += 1;
      else inserted += 1;
    }
    return { inserted, updated };
  },
});

/**
 * The stable Outlier query the Titel- and Thumbnail-Builder read: measured
 * YouTube videos at or above minFactor (default 3), strongest first, optionally
 * for one market, one topic and a publication window. publishedAfter is an ISO
 * instant the caller computes, because a query may not read the clock.
 */
export const outliers = query({
  args: {
    minFactor: v.optional(v.number()),
    market: v.optional(v.union(v.literal("de"), v.literal("en"))),
    topic: v.optional(youtubeVideoFields.topics.element),
    publishedAfter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalized = normalizeOutlierQuery(args);
    const found: Omit<Doc<"youtubeVideos">, "_id" | "_creationTime">[] = [];
    let scanned = 0;
    const rows = ctx.db
      .query("youtubeVideos")
      .withIndex("by_factor", (q) => q.gte("factor", normalized.minFactor))
      .order("desc");
    for await (const row of rows) {
      scanned += 1;
      const video = plain(row);
      if (matchesOutlierQuery(video as YoutubeVideo, normalized)) found.push(video);
      if (found.length >= normalized.limit || scanned >= OUTLIER_SCAN_MAX) break;
    }
    return found;
  },
});

export const listTerms = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("youtubeSearchTerms").withIndex("by_createdAt").take(200);
    return rows.map(plain);
  },
});

export const saveTerm = mutation({
  args: { term: v.object(youtubeSearchTermFields) },
  handler: async (ctx, { term }) => {
    const existing = await ctx.db
      .query("youtubeSearchTerms")
      .withIndex("by_external_id", (q) => q.eq("id", term.id))
      .unique();
    if (existing) await ctx.db.replace(existing._id, term);
    else await ctx.db.insert("youtubeSearchTerms", term);
    return null;
  },
});

export const removeTerm = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db
      .query("youtubeSearchTerms")
      .withIndex("by_external_id", (q) => q.eq("id", id))
      .unique();
    if (!existing) return false;
    await ctx.db.delete(existing._id);
    return true;
  },
});

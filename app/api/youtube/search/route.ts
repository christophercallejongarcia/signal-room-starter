import { NextResponse } from "next/server";
import { getStorage } from "@/lib/adapters/storage";
import { youtubeApiKey } from "@/lib/adapters/sources/youtube-data-api";
import { YOUTUBE_DAILY_QUOTA, YOUTUBE_SEARCH_TERM_LIMIT } from "@/lib/config";
import { activeSearchTerms, runYoutubeSearch } from "@/lib/youtube-search";
import { YOUTUBE_TOPICS } from "@/lib/youtube-terms";

export const runtime = "nodejs";
export const maxDuration = 300;

/** What the Outlier-Radar needs before a run: key present, the terms, the last Suchlauf. */
export async function GET() {
  const storage = getStorage();
  const [terms, runs] = await Promise.all([activeSearchTerms(storage, new Date()), storage.listRuns(50)]);
  return NextResponse.json({
    configured: Boolean(youtubeApiKey()),
    terms,
    topics: YOUTUBE_TOPICS,
    dailyQuota: YOUTUBE_DAILY_QUOTA,
    lastRun: runs.find((run) => run.kind === "youtube-search") ?? null,
  });
}

/** One Suchlauf over the chosen terms (all when none are named). Logged as a youtube-search Run with its quota. */
export async function POST(request: Request) {
  if (!youtubeApiKey()) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY fehlt in .env.local. Ohne Schlüssel kein Suchlauf." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { termIds?: unknown };
  const termIds = Array.isArray(body.termIds) ? body.termIds.filter((id): id is string => typeof id === "string").slice(0, YOUTUBE_SEARCH_TERM_LIMIT) : undefined;
  try {
    const result = await runYoutubeSearch({ termIds }, { storage: getStorage() });
    return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}

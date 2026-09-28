import { NextResponse } from "next/server";
import { getStorage } from "@/lib/adapters/storage";
import type { YoutubeOutlierQuery } from "@/lib/contracts";
import { normalizeOutlierQuery, parseOutlierSearchParams } from "@/lib/youtube-videos";

export const runtime = "nodejs";

/**
 * The builder-facing Outlier list: GET /api/youtube/outliers?minFactor=3&market=en&topic=claude&days=30&limit=50.
 * Every parameter is optional; minFactor defaults to 3, limit to 50 (max 200).
 */
export async function GET(request: Request) {
  let query: YoutubeOutlierQuery;
  try {
    query = normalizeOutlierQuery(parseOutlierSearchParams(new URL(request.url).searchParams, new Date()));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
  return NextResponse.json({ query, outliers: await getStorage().listYoutubeOutliers(query) });
}

import { NextResponse } from "next/server";
import { runBriefing } from "@/lib/briefing-run";
import { runRefresh } from "@/lib/collect";
import { runSlate } from "@/lib/slate-run";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Delta-Refresh: pulls the window since each creator's lastCheckedAt, logs the run, catches up missing covers.
 * Body {"network":"youtube"} refreshes only the YouTube watchlist (quota, no Apify) and skips briefing and slate,
 * which read Instagram reels.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { network?: unknown };
  if (body.network !== undefined && body.network !== "youtube" && body.network !== "instagram") {
    return NextResponse.json({ error: `network must be "youtube" or "instagram"` }, { status: 400 });
  }
  if (body.network === "youtube") return NextResponse.json(await runRefresh({ networks: ["youtube"], transcriptLimit: 0 }));
  const result = await runRefresh(body.network === "instagram" ? { networks: ["instagram"] } : {});

  // Every refresh leaves a briefing behind (T6.2). It reads the corpus the refresh
  // just wrote, so it runs after and never in place of the collection: a briefing
  // that throws costs the morning's list, never the run that was already logged.
  let briefingId: string | undefined;
  try {
    briefingId = (await runBriefing()).id;
  } catch (error) {
    console.error("Briefing after refresh failed:", error instanceof Error ? error.message : error);
  }

  // The slate reads the same corpus and needs the Bridge. One per day: a second
  // refresh finds the morning's slate and hands it back untouched.
  let slateId: string | undefined;
  try {
    slateId = (await runSlate()).id;
  } catch (error) {
    console.error("Slate after refresh failed:", error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ ...result, ...(briefingId ? { briefingId } : {}), ...(slateId ? { slateId } : {}) });
}

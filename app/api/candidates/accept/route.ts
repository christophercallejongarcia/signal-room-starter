import { NextResponse } from "next/server";
import { getStorage } from "@/lib/adapters/storage";
import { acceptCandidate, defaultIntakeDeps } from "@/lib/candidate-intake";
import { CandidateConflictError } from "@/lib/candidates";
import type { CreatorCandidate } from "@/lib/contracts";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * The one click that puts a Kandidat into the watchlist (P4-09): claim, resolve,
 * backfill, accept. A live claim answers 409, a failed intake 502 with the
 * Kandidat as it now stands, so the UI shows where it stopped.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { key?: unknown };
  if (typeof body.key !== "string" || !body.key) return NextResponse.json({ error: "key required" }, { status: 400 });
  try {
    const result = await acceptCandidate(body.key, defaultIntakeDeps(getStorage()));
    if (!result) return NextResponse.json({ error: `unknown Kandidat ${body.key}` }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CandidateConflictError) return NextResponse.json({ error: error.message, reason: error.reason }, { status: 409 });
    const candidate = (error as { candidate?: CreatorCandidate | null }).candidate ?? null;
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error), candidate }, { status: 502 });
  }
}

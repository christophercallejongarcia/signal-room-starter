import { NextResponse } from "next/server";
import { getStorage } from "@/lib/adapters/storage";
import { CANDIDATE_DECISIONS, CandidateConflictError, parseCandidateDecision } from "@/lib/candidates";
import type { CandidateDecision, Network } from "@/lib/contracts";

export const runtime = "nodejs";

const NETWORKS: Network[] = ["youtube", "instagram", "tiktok"];

/** Kandidaten, open ones first, strongest first. ?network=youtube&decision=proposed&limit=100 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const network = params.get("network") ?? undefined;
  const decision = params.get("decision") ?? undefined;
  if (network && !NETWORKS.includes(network as Network)) return NextResponse.json({ error: "unknown network" }, { status: 400 });
  if (decision && !CANDIDATE_DECISIONS.includes(decision as CandidateDecision)) return NextResponse.json({ error: "unknown decision" }, { status: 400 });
  const limit = Number(params.get("limit") ?? 100);
  const candidates = await getStorage().listCandidates({
    ...(network ? { network: network as Network } : {}),
    ...(decision ? { decision: decision as CandidateDecision } : {}),
    limit: Number.isFinite(limit) ? limit : 100,
  });
  return NextResponse.json({ candidates });
}

/** Chris' manual decision: proposed, rejected or deferred. None of them touches the watchlist. */
export async function PATCH(request: Request) {
  let input: ReturnType<typeof parseCandidateDecision>;
  try {
    input = parseCandidateDecision(await request.json().catch(() => ({})));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
  try {
    const candidate = await getStorage().decideCandidate(input.key, input.decision, new Date().toISOString());
    if (!candidate) return NextResponse.json({ error: `unknown Kandidat ${input.key}` }, { status: 404 });
    return NextResponse.json({ candidate });
  } catch (error) {
    if (error instanceof CandidateConflictError) return NextResponse.json({ error: error.message, reason: error.reason }, { status: 409 });
    throw error;
  }
}

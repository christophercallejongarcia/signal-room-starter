import { NextResponse } from "next/server";
import { ThumbnailRunError, approveThumbnailStage } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Approves one rendered layer: { runId, variantId, stage }. */
export async function POST(request: Request) {
  try {
    const run = await approveThumbnailStage(await request.json().catch(() => ({})));
    return NextResponse.json({ run });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The layer could not be approved." }, { status });
  }
}

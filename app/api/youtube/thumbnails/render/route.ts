import { NextResponse } from "next/server";
import { ThumbnailRunError, renderThumbnailStage } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Renders one layer of a stored variant from its plan: { runId, variantId, stage }. */
export async function POST(request: Request) {
  try {
    const run = await renderThumbnailStage(await request.json().catch(() => ({})));
    return NextResponse.json({ run });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The render failed." }, { status });
  }
}

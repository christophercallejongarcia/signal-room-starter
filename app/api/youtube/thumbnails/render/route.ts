import { NextResponse } from "next/server";
import { ThumbnailRunError, rerenderThumbnailVariant } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Renders one stored variant again from its plan: { runId, variantId }. */
export async function POST(request: Request) {
  try {
    const run = await rerenderThumbnailVariant(await request.json().catch(() => ({})));
    return NextResponse.json({ run });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The render failed." }, { status });
  }
}

import { NextResponse } from "next/server";
import { rerenderThumbnailDraft } from "@/lib/thumbnail-drafts";
import { ThumbnailRunError } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Renders one draft again in the background: { runId, variantId }. */
export async function POST(request: Request) {
  try {
    const run = await rerenderThumbnailDraft(await request.json().catch(() => ({})));
    return NextResponse.json({ run }, { status: 202 });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The draft render failed." }, { status });
  }
}

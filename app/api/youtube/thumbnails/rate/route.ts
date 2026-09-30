import { NextResponse } from "next/server";
import { rateThumbnailDraft } from "@/lib/thumbnail-drafts";
import { ThumbnailRunError } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Chris rates one draft: { runId, variantId, stars 1-5, note? }. */
export async function POST(request: Request) {
  try {
    const run = await rateThumbnailDraft(await request.json().catch(() => ({})));
    return NextResponse.json({ run });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The rating failed." }, { status });
  }
}

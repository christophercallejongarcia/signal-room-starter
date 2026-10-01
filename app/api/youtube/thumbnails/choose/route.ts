import { NextResponse } from "next/server";
import { ThumbnailRunError, chooseThumbnailVariant } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Marks the variant Chris uses: { runId, variantId }. */
export async function POST(request: Request) {
  try {
    const run = await chooseThumbnailVariant(await request.json().catch(() => ({})));
    return NextResponse.json({ run });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The variant could not be chosen." }, { status });
  }
}

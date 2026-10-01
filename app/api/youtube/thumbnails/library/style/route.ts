import { NextResponse } from "next/server";
import { decomposeReferenceStyle } from "@/lib/thumbnail-drafts";
import { ThumbnailRunError } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Decomposes one library thumbnail into its style JSON and stores it: { videoId }. */
export async function POST(request: Request) {
  try {
    const reference = await decomposeReferenceStyle(await request.json().catch(() => ({})));
    return NextResponse.json({ reference });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The style decomposition failed." }, { status });
  }
}

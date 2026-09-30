import { NextResponse } from "next/server";
import { runThumbnailDrafts } from "@/lib/thumbnail-drafts";
import { ThumbnailRunError } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** Plans a draft run ({ title, brief?, direction?, referenceIds?, count? }) and renders it in the background. */
export async function POST(request: Request) {
  try {
    const run = await runThumbnailDrafts(await request.json().catch(() => ({})));
    return NextResponse.json({ run }, { status: 202 });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The draft run failed." }, { status });
  }
}

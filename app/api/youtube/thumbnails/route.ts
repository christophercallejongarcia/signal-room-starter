import { NextResponse } from "next/server";
import { listRuns } from "@/lib/adapters/storage/thumbnail-store";
import { faceReferenceStatus } from "@/lib/face-references";
import { ThumbnailRunError, runThumbnailBuilder } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

/** The Thumbnail-Builder's state: latest runs and whether face stills are configured (count and labels only). */
export async function GET() {
  const [runs, faces] = await Promise.all([listRuns(), faceReferenceStatus()]);
  return NextResponse.json({ runs, faces });
}

/** Plans and renders three 16:9 variants: { title, brief?, referenceIds? }. */
export async function POST(request: Request) {
  try {
    const run = await runThumbnailBuilder(await request.json().catch(() => ({})));
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    const status = error instanceof ThumbnailRunError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The thumbnail run failed." }, { status });
  }
}

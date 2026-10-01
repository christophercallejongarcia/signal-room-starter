import { NextResponse } from "next/server";
import { getStorage } from "@/lib/adapters/storage";
import { ThumbnailRunError, markThumbnailReference, thumbnailLibraryView, unmarkThumbnailReference } from "@/lib/thumbnail-run";

export const runtime = "nodejs";

function failure(error: unknown, fallback: string) {
  const status = error instanceof ThumbnailRunError ? error.status : 500;
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status });
}

/** The Referenz-Bibliothek plus Outlier thumbnails to mark: GET ?market=en|de. */
export async function GET(request: Request) {
  const market = new URL(request.url).searchParams.get("market");
  if (market !== null && market !== "de" && market !== "en") {
    return NextResponse.json({ error: `market must be "de" or "en".` }, { status: 400 });
  }
  return NextResponse.json(await thumbnailLibraryView(getStorage(), market ? { market } : {}));
}

/** Marks one Outlier thumbnail: { videoId, market? }. */
export async function POST(request: Request) {
  try {
    const reference = await markThumbnailReference(await request.json().catch(() => ({})), getStorage());
    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    return failure(error, "The thumbnail could not be marked.");
  }
}

/** Removes one thumbnail from the library: DELETE ?videoId=… */
export async function DELETE(request: Request) {
  try {
    const library = await unmarkThumbnailReference(new URL(request.url).searchParams.get("videoId"));
    return NextResponse.json(library);
  } catch (error) {
    return failure(error, "The thumbnail could not be removed.");
  }
}

import { readVariantImage } from "@/lib/adapters/storage/thumbnail-store";
import { isThumbnailStage } from "@/lib/thumbnail-builder";

export const runtime = "nodejs";

/**
 * Serves one layer (?stage=background|person|text) or, without a stage, the
 * finished image of a run from before the layer flow. Ids and stage are
 * validated before a path is built.
 */
export async function GET(request: Request, context: { params: Promise<{ runId: string; variantId: string }> }) {
  const { runId, variantId } = await context.params;
  const stage = new URL(request.url).searchParams.get("stage");
  if (stage !== null && !isThumbnailStage(stage)) return new Response("stage must be background, person or text", { status: 400 });
  const image = await readVariantImage(runId, variantId, stage ? { stage } : {});
  if (!image) return new Response("thumbnail not found", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: { "content-type": image.type, "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

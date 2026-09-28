import { readVariantImage } from "@/lib/adapters/storage/thumbnail-store";

export const runtime = "nodejs";

/** Serves one rendered variant. Ids are validated before a path is built. */
export async function GET(_request: Request, context: { params: Promise<{ runId: string; variantId: string }> }) {
  const { runId, variantId } = await context.params;
  const image = await readVariantImage(runId, variantId);
  if (!image) return new Response("thumbnail not found", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: { "content-type": image.type, "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

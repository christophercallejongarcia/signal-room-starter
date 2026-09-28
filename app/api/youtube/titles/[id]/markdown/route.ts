import { TITLE_RUN_ID, titleRunMarkdown } from "@/lib/title-builder";
import { readTitleRun } from "@/lib/title-builder-store";

export const runtime = "nodejs";

/** One saved run as Markdown, for the video folder. ?download=1 saves it as titel-varianten.md. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = TITLE_RUN_ID.test(id) ? await readTitleRun(id) : null;
  if (!run) return Response.json({ error: "Diesen Titel-Lauf gibt es nicht." }, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(titleRunMarkdown(run), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "no-store",
      ...(download ? { "content-disposition": 'attachment; filename="titel-varianten.md"' } : {}),
    },
  });
}

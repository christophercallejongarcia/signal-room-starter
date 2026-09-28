import { NextResponse } from "next/server";
import { getStorage } from "@/lib/adapters/storage";
import { defaultSearchTerms, parseSearchTerm } from "@/lib/youtube-terms";

export const runtime = "nodejs";

/**
 * The start terms live in code until Chris changes the list. The first change
 * writes them into the store, so adding or removing one keeps the rest.
 */
async function seededStorage() {
  const storage = getStorage();
  if ((await storage.listYoutubeSearchTerms()).length === 0) {
    for (const term of defaultSearchTerms(new Date().toISOString())) await storage.saveYoutubeSearchTerm(term);
  }
  return storage;
}

export async function POST(request: Request) {
  let term;
  try {
    term = parseSearchTerm(await request.json().catch(() => ({})), new Date().toISOString());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
  const storage = await seededStorage();
  await storage.saveYoutubeSearchTerm(term);
  return NextResponse.json({ term, terms: await storage.listYoutubeSearchTerms() });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const storage = await seededStorage();
  const removed = await storage.removeYoutubeSearchTerm(body.id);
  if (!removed) return NextResponse.json({ error: `unknown term ${body.id}` }, { status: 404 });
  return NextResponse.json({ terms: await storage.listYoutubeSearchTerms() });
}

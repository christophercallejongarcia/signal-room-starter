import { NextResponse } from "next/server";
import type { Creator, Network } from "@/lib/contracts";
import { normalizeHandle, resolveProfile } from "@/lib/adapters/sources/apify-instagram";
import { createYoutubeClient, normalizeChannelInput, resolveChannel, youtubeCreatorId } from "@/lib/adapters/sources/youtube-data-api";
import { getStorage } from "@/lib/adapters/storage";
import { runBackfill } from "@/lib/collect";
import { parseCreatorMark, type CreatorMark } from "@/lib/creator-mark";

export const runtime = "nodejs";
export const maxDuration = 300;

const ACCENTS = ["#b9ff5c", "#ff6546", "#5cc8ff", "#ffd75c", "#c77dff"];

export async function GET() {
  return NextResponse.json({ creators: await getStorage().listCreators() });
}

/** Moves a creator between the views: owned sends them to Profile, foreign splits their Format Signals. */
export async function PATCH(request: Request) {
  // parseCreatorMark bounds and rejects the body; it is the only place that decides what a PATCH mark is.
  let mark: CreatorMark;
  try {
    mark = parseCreatorMark(await request.json().catch(() => ({})));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }

  const storage = getStorage();
  const creator = (await storage.listCreators()).find((c) => c.id === mark.id);
  if (!creator) return NextResponse.json({ error: `unknown creator ${mark.id}` }, { status: 404 });

  // Only the marks the body carries move; the other one keeps its value.
  const updated: Creator = {
    ...creator,
    ...(mark.owned === undefined ? {} : { owned: mark.owned }),
    ...(mark.foreign === undefined ? {} : { foreign: mark.foreign }),
  };
  await storage.upsertCreator(updated);
  return NextResponse.json({ creator: updated });
}

type AddInput = { handle: string; owned: boolean; market?: "en" };

/** Re-adding a tracked creator is a no-op, except for a ticked owned box: that still sets the mark. */
async function existingAnswer(id: string, owned: boolean) {
  const storage = getStorage();
  const existing = (await storage.listCreators()).find((c) => c.id === id);
  if (!existing) return null;
  // An unticked box never clears the mark; unmarking is the toggle in Tracked Channels.
  if (!owned || existing.owned) return NextResponse.json({ creator: existing, existing: true, recordsAdded: 0 });
  const marked: Creator = { ...existing, owned: true };
  await storage.upsertCreator(marked);
  return NextResponse.json({ creator: marked, existing: true, recordsAdded: 0 });
}

/**
 * YouTube: the channel is resolved first (1 quota unit), because the canonical id
 * is the channel id and a handle can change. Then the same backfill as Instagram.
 */
async function addYoutube({ handle, owned, market }: AddInput) {
  if (!normalizeChannelInput(handle)) return NextResponse.json({ error: "Enter a YouTube @handle, channel link or channel id." }, { status: 400 });
  try {
    const channel = await resolveChannel(handle, createYoutubeClient());
    const id = youtubeCreatorId(channel.channelId);
    const known = await existingAnswer(id, owned);
    if (known) return known;
    const creator: Creator = {
      id,
      name: channel.name,
      handle: channel.handle,
      network: "youtube",
      audience: channel.subscribers,
      accent: ACCENTS[channel.channelId.length % ACCENTS.length],
      ...(channel.avatarUrl ? { avatarUrl: channel.avatarUrl } : {}),
      url: channel.url,
      ...(owned ? { owned: true } : {}),
      ...(market ? { market } : {}),
    };
    const { recordsAdded, covers } = await runBackfill(creator);
    return NextResponse.json({ creator, existing: false, recordsAdded, covers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { handle?: string; network?: Network; owned?: boolean; market?: string };
  const network = body.network ?? "instagram";
  if (network !== "instagram" && network !== "youtube") {
    return NextResponse.json({ error: `Network ${network} has no connector yet` }, { status: 400 });
  }
  const owned = body.owned === true;
  if (body.market !== undefined && body.market !== "de" && body.market !== "en") {
    return NextResponse.json({ error: `market must be "de" or "en"` }, { status: 400 });
  }
  // Missing market means "de" everywhere; only "en" is worth storing.
  const market = body.market === "en" ? ("en" as const) : undefined;
  if (network === "youtube") return addYoutube({ handle: body.handle ?? "", owned, market });

  const handle = normalizeHandle(body.handle ?? "");
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });
  const id = `${network}-${handle}`;
  const known = await existingAnswer(id, owned);
  if (known) return known;

  try {
    const profile = await resolveProfile(handle);
    const creator: Creator = {
      id,
      name: profile.name,
      handle: `@${profile.handle}`,
      network,
      audience: profile.followers,
      accent: ACCENTS[handle.length % ACCENTS.length],
      avatarUrl: profile.avatarUrl,
      url: profile.url,
      // Set at add time, so the first backfill already lands in Profile instead of the feed.
      ...(owned ? { owned: true } : {}),
      ...(market ? { market } : {}),
    };
    const { recordsAdded, covers } = await runBackfill(creator);
    return NextResponse.json({ creator, existing: false, recordsAdded, covers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

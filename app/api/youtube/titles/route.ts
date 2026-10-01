import { NextResponse } from "next/server";
import { getStorage } from "@/lib/adapters/storage";
import { STRATEGY_AUDIENCE, STRATEGY_BRIDGE_URL } from "@/lib/config";
import {
  TITLE_MIN_FACTOR,
  TITLE_PACKET_WINDOW_DAYS,
  buildTitlePatterns,
  newTitleRun,
  parseTitleAnswer,
  parseTitleRequest,
  selectTitlePacket,
  type TitleRequestInput,
} from "@/lib/title-builder";
import { listTitleRuns, saveTitleRun } from "@/lib/title-builder-store";

export const runtime = "nodejs";
/** One Codex turn through the bridge; the bridge itself gives up after 120 s. */
export const maxDuration = 300;

const DAY = 86_400_000;

/** The stored YouTube Outlier the packet is cut from. The query cannot read the clock, so the window is computed here. */
async function loadPacket(now: number) {
  const outliers = await getStorage().listYoutubeOutliers({
    minFactor: TITLE_MIN_FACTOR,
    publishedAfter: new Date(now - TITLE_PACKET_WINDOW_DAYS * DAY).toISOString(),
    limit: 200,
  });
  const selected = selectTitlePacket(outliers, now);
  return { ...selected, patterns: buildTitlePatterns(selected.packet) };
}

/** History rail plus the packet a run would use right now, so the patterns show before the first run. */
export async function GET() {
  const now = Date.now();
  const [runs, { summary, patterns }] = await Promise.all([listTitleRuns(), loadPacket(now)]);
  return NextResponse.json({ runs, packet: summary, patterns });
}

/**
 * One Titel-Builder run: video, vidIQ ideas and the Outlier packet to the bridge,
 * checked variants back, saved as its own file.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  let input: TitleRequestInput;
  try {
    input = parseTitleRequest(body);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }

  const now = Date.now();
  const { packet, recent, summary, patterns } = await loadPacket(now);
  if (packet.length === 0) {
    return NextResponse.json(
      { error: `Kein YouTube-Outlier ab ${TITLE_MIN_FACTOR}x in den letzten ${TITLE_PACKET_WINDOW_DAYS} Tagen. Starte zuerst einen Suchlauf in Discover.` },
      { status: 409 },
    );
  }

  try {
    const response = await fetch(`${STRATEGY_BRIDGE_URL}/v1/titles`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workingTitle: input.workingTitle,
        source: input.source,
        ...(input.direction ? { direction: input.direction } : {}),
        audience: STRATEGY_AUDIENCE,
        count: input.count,
        outliers: packet.map((source) => ({
          title: source.title,
          channel: source.channelTitle,
          market: source.market,
          factor: source.factor,
          views: source.views,
          ageDays: Math.max(0, Math.round((now - Date.parse(source.publishedAt)) / DAY)),
        })),
        ideas: input.ideas,
        patterns: patterns.map(({ label, count, avgFactor }) => ({ label, count, avgFactor })),
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || `Der Bridge antwortete mit HTTP ${response.status}.`);
    }
    const variants = parseTitleAnswer(await response.json(), packet, input.ideas, recent);
    const run = newTitleRun(input, {
      id: `title-run-${crypto.randomUUID()}`,
      now: new Date(now).toISOString(),
      packet: summary,
      patterns,
      variants,
    });
    await saveTitleRun(run);
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  TITLE_CHECK_WINDOW_DAYS,
  TITLE_MIN_VIEWS,
  TITLE_PACKET_EN,
  buildTitlePatterns,
  checkTitle,
  detectTitlePatterns,
  newTitleRun,
  parseTitleAnswer,
  parseTitleRequest,
  selectTitlePacket,
  titleRunMarkdown,
} from "../lib/title-builder.ts";
import { titleRunPath } from "../lib/title-builder-store.ts";

const NOW = Date.parse("2026-09-28T12:00:00.000Z");
const DAY = 86_400_000;

function video(id, title, overrides = {}) {
  return {
    id: `yt-${id}`,
    videoId: id,
    channelId: `UC${id}`,
    channelTitle: `Kanal ${id}`,
    title,
    url: `https://www.youtube.com/watch?v=${id}`,
    publishedAt: new Date(NOW - 10 * DAY).toISOString(),
    durationSeconds: 900,
    views: 100_000,
    likes: 0,
    comments: 0,
    subscribers: 50_000,
    channelMedian: 10_000,
    baselineCount: 30,
    factor: 10,
    viewsPerSubscriber: 2,
    viewsPerDay: 10_000,
    market: "en",
    topics: ["claude"],
    queries: ["Claude Code"],
    source: "search",
    measuredAt: new Date(NOW).toISOString(),
    firstSeenAt: new Date(NOW).toISOString(),
    ...overrides,
  };
}

test("detects title patterns in English and German, umlauts included", () => {
  assert.deepEqual(detectTitlePatterns("Vom Fragensteller zum Chef: Die 6 Stufen, Claude zu nutzen"), ["stufen", "liste"]);
  assert.deepEqual(detectTitlePatterns("19 Claude Code Mistakes Pro Users Are Still Making"), ["liste", "warnung"]);
  assert.deepEqual(detectTitlePatterns("Build Your First AI Agent in 10 Minutes, No Coding"), ["zeit", "neu"]);
  assert.deepEqual(detectTitlePatterns("Why I Cancelled My Claude Code Subscription"), ["ich", "warum"]);
  assert.deepEqual(detectTitlePatterns("Schritt-für-Schritt-Anleitung für Anfänger"), ["einsteiger"]);
  assert.deepEqual(detectTitlePatterns("Ist das schon AGI?"), ["frage"]);
  // "pro Tag" is German for per day, not an insider promise.
  assert.deepEqual(detectTitlePatterns("3 Stunden pro Tag gespart"), ["zeit"]);
});

test("the packet keeps English first, drops noise below the view floor and outside the window", () => {
  const outliers = [
    video("de1", "Claude nutzen wie die Top 1 %", { market: "de", factor: 20 }),
    video("en1", "The 5 Levels of Claude Code", { factor: 12 }),
    video("en2", "Tiny channel fluke", { views: TITLE_MIN_VIEWS - 1, factor: 40 }),
    video("en3", "Old but gold", { publishedAt: new Date(NOW - 120 * DAY).toISOString() }),
    video("en4", "Stop Using Claude Code in Terminal", { factor: 8, publishedAt: new Date(NOW - 60 * DAY).toISOString() }),
    video("en5", "Below threshold", { factor: 2.9 }),
  ];
  const { packet, recent, summary } = selectTitlePacket(outliers, NOW);
  assert.deepEqual(packet.map((item) => item.videoId), ["en1", "en4", "de1"]);
  // The check window is shorter than the packet window.
  assert.deepEqual(recent.map((item) => item.videoId), ["de1", "en1"]);
  assert.equal(summary.en, 2);
  assert.equal(summary.de, 1);
  assert.equal(summary.recent, 2);
  assert.equal(summary.checkWindowDays, TITLE_CHECK_WINDOW_DAYS);
});

test("the packet caps the English share", () => {
  const many = Array.from({ length: TITLE_PACKET_EN + 5 }, (_, index) => video(`e${index}`, `Title ${index}`, { factor: 3 + index }));
  const { packet } = selectTitlePacket(many, NOW);
  assert.equal(packet.length, TITLE_PACKET_EN);
  assert.equal(packet[0].factor, 3 + TITLE_PACKET_EN + 4);
});

test("pattern stats count per market, strongest example first", () => {
  const { packet } = selectTitlePacket(
    [
      video("a", "The 5 Levels of Claude Code", { factor: 12 }),
      video("b", "7 Stages of AI Agents", { factor: 6 }),
      video("c", "Die 6 Stufen der KI", { market: "de", factor: 4 }),
      video("d", "Why I quit", { factor: 5 }),
    ],
    NOW,
  );
  const stufen = buildTitlePatterns(packet).find((stat) => stat.id === "stufen");
  assert.equal(stufen.count, 3);
  assert.equal(stufen.en, 2);
  assert.equal(stufen.de, 1);
  assert.equal(stufen.avgFactor, 7.3);
  assert.equal(stufen.examples[0].videoId, "a");
});

const recent = selectTitlePacket(
  [
    video("a", "The 5 Levels of Claude Code", { factor: 12 }),
    video("b", "7 Stages of AI Agents", { factor: 6 }),
    video("c", "Claude nutzen wie die Top 1 %: Schritt-für-Schritt-Anleitung", { market: "de", factor: 6.5 }),
  ],
  NOW,
).recent;

test("a variant whose pattern recent Outlier carry is backed, with the count in the reason", () => {
  const check = checkTitle("Die 6 Stufen, Claude zu nutzen", recent);
  assert.equal(check.verdict, "backed");
  assert.match(check.reason, /Muster „Stufen“ in 2 Outliern der letzten 6 Wochen, im Schnitt 9,0x/);
  assert.deepEqual(check.issues, []);
});

test("a variant without a recent pattern stays open and says so", () => {
  const check = checkTitle("Warum ich Claude anders nutze", recent);
  assert.equal(check.verdict, "open");
  assert.match(check.reason, /Ein Test ohne Beleg/);
});

test("the check flags length, dashes, copies and close German competition", () => {
  const long = checkTitle(`Claude ${"sehr ".repeat(20)}lang`, recent);
  assert.match(long.issues[0], /YouTube nimmt höchstens 100/);
  assert.ok(checkTitle("Claude nutzen – so geht es", recent).issues.includes("Enthält einen Gedankenstrich."));
  const copy = checkTitle("Claude nutzen wie die Top 1 %: Schritt für Schritt Anleitung", recent);
  assert.ok(copy.issues.some((issue) => issue.startsWith("Liest sich fast wie")));
  assert.ok(copy.issues.some((issue) => issue.startsWith("Nah an der deutschen Konkurrenz")));
  assert.equal(copy.competitor.videoId, "c");
});

test("the answer cites by position; out-of-range positions and duplicates fall away", () => {
  const packet = recent;
  const variants = parseTitleAnswer(
    {
      titles: [
        { title: "Die 6 Stufen, Claude zu nutzen", rationale: "Stufen wie a.", sources: [1, 1, 99], ideas: [1] },
        { title: "Die 6 Stufen, Claude zu nutzen", rationale: "Doppelt.", sources: [2], ideas: [] },
        { title: "Claude Code: 5 Stufen zum Chef", rationale: "Ohne Beleg.", sources: [42], ideas: [7] },
      ],
    },
    packet,
    ["Claude richtig nutzen"],
    recent,
  );
  assert.equal(variants.length, 2);
  assert.deepEqual(variants.map((variant) => variant.label), ["A", "B"]);
  assert.deepEqual(variants[0].sources.map((source) => source.videoId), ["a"]);
  assert.equal(variants[0].sourcesInferred, false);
  assert.deepEqual(variants[0].ideas, ["Claude richtig nutzen"]);
  // Nothing usable cited: the closest titles stand in, marked as inferred.
  assert.equal(variants[1].sourcesInferred, true);
  assert.equal(variants[1].sources[0].videoId, "a");
  assert.deepEqual(variants[1].ideas, []);
});

test("an answer without titles is refused", () => {
  assert.throws(() => parseTitleAnswer({ titles: [] }, recent, [], recent), /keinen Titel/);
  assert.throws(() => parseTitleAnswer({ titles: [{ title: " " }] }, recent, [], recent), /Titel 1 ist leer/);
});

test("the request needs a working title and splits vidIQ ideas by line", () => {
  assert.throws(() => parseTitleRequest({ workingTitle: " " }), /Arbeitstitel/);
  assert.throws(() => parseTitleRequest({ workingTitle: "X", count: 4 }), /3, 5 oder 10/);
  const input = parseTitleRequest({ workingTitle: " Die 6 Stufen ", source: "Skript", ideas: "- Idee eins\n\n2. Idee zwei\nIdee eins", count: 5 });
  assert.deepEqual(input, { workingTitle: "Die 6 Stufen", source: "Skript", ideas: ["Idee eins", "Idee zwei"], count: 5 });
});

test("the Markdown names every source with title, channel, factor and link, and escapes creator text", () => {
  const [variant] = parseTitleAnswer({ titles: [{ title: "Die 6 Stufen, Claude zu nutzen", rationale: "Stufen.", sources: [1], ideas: [] }] }, recent, [], recent);
  const hostile = { ...variant, sources: [{ ...variant.sources[0], title: "Evil](https://x.test) [click" }] };
  const run = newTitleRun(
    { workingTitle: "Vom Fragensteller zum Chef", source: "Skript", ideas: [], count: 5 },
    {
      id: "title-run-00000000-0000-4000-8000-000000000000",
      now: new Date(NOW).toISOString(),
      packet: selectTitlePacket([], NOW).summary,
      patterns: [],
      variants: [variant, { ...hostile, label: "B" }],
    },
  );
  const markdown = titleRunMarkdown(run);
  assert.match(markdown, /^# Titel-Varianten: Vom Fragensteller zum Chef/);
  assert.match(markdown, /## A: Die 6 Stufen, Claude zu nutzen/);
  assert.match(markdown, /- \[The 5 Levels of Claude Code\]\(https:\/\/www\.youtube\.com\/watch\?v=a\) · Kanal a · 12,0x Kanal-Median · 100\.000 Aufrufe · EN/);
  assert.match(markdown, /\[Evil\\\]\(https:\/\/x\.test\) \\\[click\]/);
  assert.doesNotMatch(markdown, /[–—]/);
});

test("run files only take generated ids", () => {
  assert.throws(() => titleRunPath("../store"), /Unknown title run id/);
  assert.match(titleRunPath("title-run-00000000-0000-4000-8000-000000000000", "/tmp/x"), /\/tmp\/x\/title-run-.*\.json$/);
});

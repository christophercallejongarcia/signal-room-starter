// Relative imports only: node --test loads this file directly.
import type { YoutubeVideo } from "./contracts";
import { bounded, boundedText } from "./ideas.ts";

/**
 * Titel-Builder (YouTube Submodul 2): German title variants for one video, read
 * from the patterns of current Outlier titles and checked against the Outlier of
 * the last weeks. Everything here is pure; the route owns clock, store and Bridge.
 */

/** Outlier in the pattern packet: at least this factor over the Kanal-Median. */
export const TITLE_MIN_FACTOR = 3;
/** Below this a factor is noise: 40 views of median and 1.500 views make 38x. Same floor as a Kandidat. */
export const TITLE_MIN_VIEWS = 5_000;
/** The pattern source: Outlier published in this window. */
export const TITLE_PACKET_WINDOW_DAYS = 90;
/** English Outlier are the pattern source, German ones show the competition. */
export const TITLE_PACKET_EN = 30;
export const TITLE_PACKET_DE = 10;
/** The check: every variant is read against the Outlier of the last six weeks. */
export const TITLE_CHECK_WINDOW_DAYS = 42;
/** A pattern backs a variant when at least this many recent Outlier carry it. */
export const TITLE_CHECK_MIN_SUPPORT = 2;
/** YouTube refuses longer titles. */
export const TITLE_MAX = 100;
/** Roughly what a phone shows before it cuts the title. */
export const TITLE_VISIBLE_MAX = 70;
export const TITLE_COUNTS = [3, 5, 10] as const;
export const TITLE_DEFAULT_COUNT = 5;
export const TITLE_WORKING_MAX = 150;
export const TITLE_SOURCE_MAX = 20_000;
export const TITLE_DIRECTION_MAX = 500;
export const TITLE_IDEAS_MAX = 20;
export const TITLE_IDEA_MAX = 150;
export const TITLE_RATIONALE_MAX = 400;
export const TITLE_SOURCES_PER_VARIANT = 3;
export const TITLE_SOURCE_EXCERPT = 240;
export const TITLE_RUN_HISTORY = 20;
/** Word overlap from which a German Outlier counts as close competition. */
export const TITLE_COLLISION_OVERLAP = 0.3;
/** Word overlap from which a variant reads as a copy of an Outlier title. */
export const TITLE_COPY_OVERLAP = 0.7;

export type TitlePatternId =
  | "stufen"
  | "liste"
  | "zeit"
  | "einsteiger"
  | "kontrast"
  | "ich"
  | "warnung"
  | "insider"
  | "neu"
  | "frage"
  | "warum";

/** Unicode word boundaries: \b in JavaScript does not know ä, ö, ü or ß. */
function words(source: string) {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${source})(?![\\p{L}\\p{N}])`, "iu");
}

/**
 * The title patterns, English and German in one rule each. A title may carry
 * several. Extend by adding an entry; the order is the order of the UI.
 */
export const TITLE_PATTERNS: { id: TitlePatternId; label: string; hint: string; test: RegExp }[] = [
  {
    id: "stufen",
    label: "Stufen",
    hint: "Ein Weg in Stufen oder von A nach B",
    test: words("levels?|stages?|stufen?|ebenen|tiers?|roadmap|(?:from|vom|von)\\s.{1,40}?\\s(?:to|zum|zur|bis)|zero to|beginner to|anfänger (?:zum|bis)"),
  },
  {
    id: "liste",
    label: "Zahl und Liste",
    hint: "Nennt die Zahl der Punkte vorweg",
    test: words(
      "\\d+\\+?\\s+(?:[\\p{L}'’-]+\\s+){0,3}?(?:levels?|stages?|steps?|ways?|mistakes?|tips?|tricks?|layers?|things?|rules?|habits?|tools?|use cases?|prompts?|skills?|reasons?|stufen|schritte|fehler|tipps|wege|regeln|ebenen|dinge|gründe|gewohnheiten)",
    ),
  },
  {
    id: "zeit",
    label: "Zeitangabe",
    hint: "Nennt eine Dauer: in 10 Minuten, 1000 Stunden",
    test: words("\\d+\\+?\\s*(?:min|mins|minutes?|minuten|sekunden|seconds?|hours?|stunden|days?|tagen?|weeks?|wochen)"),
  },
  {
    id: "einsteiger",
    label: "Einsteiger und Kurs",
    hint: "Verspricht den kompletten Einstieg",
    test: words("beginners?|anfänger|einsteiger|full course|crash course|course|kurs|komplettkurs|tutorial|guide|anleitung|step[- ]by[- ]step|schritt[- ]für[- ]schritt|from scratch"),
  },
  {
    id: "kontrast",
    label: "Kontrast",
    hint: "Stellt zwei Wege gegeneinander",
    test: words("vs\\.?|versus|instead of|statt|anstatt|compared|im vergleich|stop using|hör auf|forget|vergiss"),
  },
  {
    id: "ich",
    label: "Ich-Erfahrung",
    hint: "Erzählt aus eigener Erfahrung",
    test: /^(?:i|i've|i’ve|i'm|i’m|ich|my|mein|meine)(?![\p{L}\p{N}])|(?<![\p{L}\p{N}])(?:i (?:have |just )?(?:built|spent|tested|tried|cancell?ed|made|used|asked)|ich (?:habe|hab|baue|teste|nutze))(?![\p{L}\p{N}])/iu,
  },
  {
    id: "warnung",
    label: "Warnung",
    hint: "Warnt vor einem Fehler oder einem Weg",
    test: words("mistakes?|fehler|stop|don't|don’t|never|nie wieder|niemals|wrong|falsch|fails?|scheitert|holding you back|lüge|lie|problem|missing out|verpasst|verschenkst"),
  },
  {
    id: "insider",
    label: "Insider",
    hint: "Verspricht Wissen, das andere nicht haben",
    test: words("secrets?|geheimnis|nobody|niemand|kaum jemand|top 1\\s?%|(?:like|become) a pro|wie die top|wie ein profi|profis?|hidden|versteckt|reveals?|verrät|just told|kept it quiet|what i learned|was ich gelernt"),
  },
  {
    id: "neu",
    label: "Neuheit",
    hint: "Hängt am Neuen: neu, endlich, ändert alles",
    test: words("new|neue?[nrs]?|just (?:dropped|launched|built|got|released)|introducing|finally|endlich|changes everything|ändert alles|is here|ist da|first|erste"),
  },
  {
    id: "frage",
    label: "Frage",
    hint: "Stellt eine Frage, die das Video beantwortet",
    test: /\?/u,
  },
  {
    id: "warum",
    label: "Warum",
    hint: "Verspricht den Grund hinter etwas",
    test: words("why|warum|wieso|weshalb"),
  },
];

const patternById = new Map(TITLE_PATTERNS.map((pattern) => [pattern.id, pattern]));

export function titlePatternLabel(id: TitlePatternId) {
  return patternById.get(id)?.label ?? id;
}

/** Every pattern the title carries, in the canonical order. */
export function detectTitlePatterns(title: string): TitlePatternId[] {
  return TITLE_PATTERNS.filter((pattern) => pattern.test.test(title)).map((pattern) => pattern.id);
}

/** One Outlier as the Titel-Builder shows and cites it. Numbers are the snapshot at measuredAt. */
export type TitleSource = {
  videoId: string;
  title: string;
  channelTitle: string;
  channelHandle?: string;
  url: string;
  thumbnailUrl?: string;
  factor: number;
  views: number;
  market: "de" | "en";
  publishedAt: string;
};

export type TitlePatternStat = {
  id: TitlePatternId;
  label: string;
  hint: string;
  count: number;
  en: number;
  de: number;
  avgFactor: number;
  /** Strongest first, at most three. */
  examples: TitleSource[];
};

export type TitleCheckPattern = { id: TitlePatternId; label: string; recent: number; avgFactor: number; example?: TitleSource };

export type TitleCheck = {
  length: number;
  patterns: TitleCheckPattern[];
  /** backed: at least one pattern of the variant carries TITLE_CHECK_MIN_SUPPORT recent Outlier. */
  verdict: "backed" | "open";
  reason: string;
  /** The German Outlier of the check window whose words come closest, when any word is shared. */
  competitor?: TitleSource & { overlap: number };
  /** Plain-language problems: too long, dash, copy of an Outlier title. */
  issues: string[];
};

export type TitleVariant = {
  /** A, B, C … in the order the Bridge returned them. */
  label: string;
  title: string;
  rationale: string;
  sources: TitleSource[];
  /** True when the answer cited nothing usable and the sources were matched by word overlap. */
  sourcesInferred: boolean;
  /** The vidIQ ideas the variant names as its starting point. */
  ideas: string[];
  check: TitleCheck;
};

export type TitlePacketSummary = {
  minFactor: number;
  minViews: number;
  windowDays: number;
  checkWindowDays: number;
  outliers: number;
  en: number;
  de: number;
  recent: number;
};

export type TitleRun = {
  id: string;
  createdAt: string;
  workingTitle: string;
  sourceExcerpt: string;
  sourceLength: number;
  direction?: string;
  ideas: string[];
  requested: number;
  packet: TitlePacketSummary;
  patterns: TitlePatternStat[];
  variants: TitleVariant[];
};

export type TitleRequestInput = {
  workingTitle: string;
  source: string;
  ideas: string[];
  direction?: string;
  count: number;
};

/** Validates one Titel-Builder request. The ideas field is one vidIQ idea per line. */
export function parseTitleRequest(input: Record<string, unknown> | undefined): TitleRequestInput {
  const workingTitle = bounded(input?.workingTitle, TITLE_WORKING_MAX + 1);
  if (!workingTitle) throw new Error("Trag zuerst den Arbeitstitel des Videos ein.");
  if (workingTitle.length > TITLE_WORKING_MAX) throw new Error(`Der Arbeitstitel hat mehr als ${TITLE_WORKING_MAX} Zeichen.`);

  const rawSource = typeof input?.source === "string" ? input.source.trim() : "";
  if (rawSource.length > TITLE_SOURCE_MAX) {
    throw new Error(`Das Skript hat ${rawSource.length} Zeichen. Der Titel-Builder nimmt bis ${TITLE_SOURCE_MAX}, kürze es vorher.`);
  }

  const rawIdeas = Array.isArray(input?.ideas) ? input.ideas.join("\n") : typeof input?.ideas === "string" ? input.ideas : "";
  const ideas = [...new Set(rawIdeas.split(/\r?\n/).map((line) => bounded(line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/u, ""), TITLE_IDEA_MAX)).filter(Boolean))];
  if (ideas.length > TITLE_IDEAS_MAX) throw new Error(`Höchstens ${TITLE_IDEAS_MAX} vidIQ-Ideen, eine pro Zeile.`);

  const count = Number(input?.count ?? TITLE_DEFAULT_COUNT);
  if (!TITLE_COUNTS.includes(count as (typeof TITLE_COUNTS)[number])) {
    throw new Error(`Ein Lauf liefert ${TITLE_COUNTS.slice(0, -1).join(", ")} oder ${TITLE_COUNTS.at(-1)} Titel.`);
  }
  const direction = bounded(input?.direction, TITLE_DIRECTION_MAX);

  return {
    workingTitle,
    source: boundedText(rawSource, TITLE_SOURCE_MAX),
    ideas,
    count,
    ...(direction ? { direction } : {}),
  };
}

function asSource(video: YoutubeVideo): TitleSource {
  return {
    videoId: video.videoId,
    title: video.title,
    channelTitle: video.channelTitle,
    ...(video.channelHandle ? { channelHandle: video.channelHandle } : {}),
    url: video.url,
    ...(video.thumbnailUrl ? { thumbnailUrl: video.thumbnailUrl } : {}),
    factor: video.factor,
    views: video.views,
    market: video.market,
    publishedAt: video.publishedAt,
  };
}

const DAY = 86_400_000;

/**
 * The pattern packet and the check set out of the stored Outlier. English first,
 * because English titles are the pattern source; strongest factor first in each
 * market. The check set is every qualifying Outlier of the last six weeks.
 */
export function selectTitlePacket(outliers: YoutubeVideo[], now: number) {
  const packetAfter = now - TITLE_PACKET_WINDOW_DAYS * DAY;
  const checkAfter = now - TITLE_CHECK_WINDOW_DAYS * DAY;
  const qualifying = outliers
    .filter((video) => video.factor >= TITLE_MIN_FACTOR && video.views >= TITLE_MIN_VIEWS && video.title.trim())
    .filter((video) => Date.parse(video.publishedAt) >= packetAfter)
    .sort((a, b) => b.factor - a.factor || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const unique = [...new Map(qualifying.map((video) => [video.videoId, video])).values()];
  const en = unique.filter((video) => video.market === "en").slice(0, TITLE_PACKET_EN);
  const de = unique.filter((video) => video.market === "de").slice(0, TITLE_PACKET_DE);
  const recent = unique.filter((video) => Date.parse(video.publishedAt) >= checkAfter).map(asSource);
  const packet = [...en, ...de].map(asSource);
  const summary: TitlePacketSummary = {
    minFactor: TITLE_MIN_FACTOR,
    minViews: TITLE_MIN_VIEWS,
    windowDays: TITLE_PACKET_WINDOW_DAYS,
    checkWindowDays: TITLE_CHECK_WINDOW_DAYS,
    outliers: packet.length,
    en: en.length,
    de: de.length,
    recent: recent.length,
  };
  return { packet, recent, summary };
}

function mean(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** The patterns of the packet titles: how often, how strong, which examples. Empty patterns are left out. */
export function buildTitlePatterns(sources: TitleSource[]): TitlePatternStat[] {
  return TITLE_PATTERNS.map(({ id, label, hint, test }) => {
    const matching = sources.filter((source) => test.test(source.title)).sort((a, b) => b.factor - a.factor);
    return {
      id,
      label,
      hint,
      count: matching.length,
      en: matching.filter((source) => source.market === "en").length,
      de: matching.filter((source) => source.market === "de").length,
      avgFactor: Number(mean(matching.map((source) => source.factor)).toFixed(1)),
      examples: matching.slice(0, 3),
    };
  })
    .filter((stat) => stat.count > 0)
    .sort((a, b) => b.count - a.count || b.avgFactor - a.avgFactor);
}

/** German and English filler that carries no signal when two titles are compared. */
const STOPWORDS = new Set([
  "aber", "auch", "dein", "deine", "dass", "denn", "dich", "diese", "dieser", "doch", "eine", "einen",
  "einer", "eines", "from", "have", "hier", "ihre", "immer", "kann", "mehr", "mein", "meine", "nach",
  "nicht", "noch", "oder", "ohne", "schon", "sein", "sich", "sind", "that", "this", "über", "unter",
  "wenn", "were", "what", "wird", "with", "your", "just", "will", "zum", "zur", "vom", "von", "und",
  "the", "and", "for", "you", "die", "der", "das", "den", "wie", "mit", "für",
  // The niche itself: every title names the tool, so sharing it says nothing about closeness.
  "claude", "code", "anthropic",
]);

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^\p{L}\p{Nd}]+/u)
      .filter((token) => token.length >= 3 && !STOPWORDS.has(token)),
  );
}

/** Jaccard over the content words. A small corpus, so a readable measure beats a clever one. */
export function titleOverlap(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

/** The Outlier whose titles read closest to this one; the strongest factor breaks a tie. */
export function similarSources(title: string, sources: TitleSource[], limit = TITLE_SOURCES_PER_VARIANT) {
  return sources
    .map((source) => ({ source, score: titleOverlap(title, source.title) }))
    .sort((a, b) => b.score - a.score || b.source.factor - a.source.factor)
    .slice(0, limit)
    .map(({ source }) => source);
}

function formatFactor(value: number) {
  return `${value.toFixed(1).replace(".", ",")}x`;
}

const DASH = /[‒-―]|\s-\s/u;

/**
 * The check against the Outlier of the last weeks: which patterns the variant
 * carries and how many recent Outlier carry them too, the closest German
 * competitor, and the plain problems a person would fix before a test.
 */
export function checkTitle(title: string, recent: TitleSource[], packet: TitleSource[] = recent): TitleCheck {
  const length = [...title].length;
  const weeks = Math.round(TITLE_CHECK_WINDOW_DAYS / 7);
  const patterns = detectTitlePatterns(title).map((id): TitleCheckPattern => {
    const pattern = patternById.get(id)!;
    const matching = recent.filter((source) => pattern.test.test(source.title)).sort((a, b) => b.factor - a.factor);
    return {
      id,
      label: pattern.label,
      recent: matching.length,
      avgFactor: Number(mean(matching.map((source) => source.factor)).toFixed(1)),
      ...(matching[0] ? { example: matching[0] } : {}),
    };
  });
  const carrying = patterns
    .filter((pattern) => pattern.recent >= TITLE_CHECK_MIN_SUPPORT)
    .sort((a, b) => b.recent - a.recent || b.avgFactor - a.avgFactor);

  let reason: string;
  if (carrying.length > 0) {
    reason = carrying
      .slice(0, 2)
      .map((pattern) => `Muster „${pattern.label}“ in ${pattern.recent} Outliern der letzten ${weeks} Wochen, im Schnitt ${formatFactor(pattern.avgFactor)}`)
      .join("; ") + ".";
  } else if (patterns.length > 0) {
    reason = `Die Muster dieses Titels (${patterns.map((pattern) => pattern.label).join(", ")}) kommen in den Outliern der letzten ${weeks} Wochen seltener als ${TITLE_CHECK_MIN_SUPPORT}-mal vor. Ein Test ohne Beleg.`;
  } else {
    reason = `Der Titel trägt keines der bekannten Muster. Ein Test ohne Beleg aus den letzten ${weeks} Wochen.`;
  }

  const german = recent
    .filter((source) => source.market === "de")
    .map((source) => ({ ...source, overlap: Number(titleOverlap(title, source.title).toFixed(2)) }))
    .filter((source) => source.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.factor - a.factor);
  const competitor = german[0];

  const issues: string[] = [];
  if (length > TITLE_MAX) issues.push(`${length} Zeichen, YouTube nimmt höchstens ${TITLE_MAX}.`);
  else if (length > TITLE_VISIBLE_MAX) issues.push(`${length} Zeichen, am Handy wird nach etwa ${TITLE_VISIBLE_MAX} abgeschnitten.`);
  if (DASH.test(title)) issues.push("Enthält einen Gedankenstrich.");
  const copied = packet.find((source) => titleOverlap(title, source.title) >= TITLE_COPY_OVERLAP);
  if (copied) issues.push(`Liest sich fast wie der Outlier-Titel „${copied.title}“ (${copied.channelTitle}).`);
  if (competitor && competitor.overlap >= TITLE_COLLISION_OVERLAP) {
    issues.push(`Nah an der deutschen Konkurrenz: „${competitor.title}“ (${competitor.channelTitle}).`);
  }

  return {
    length,
    patterns,
    verdict: carrying.length > 0 ? "backed" : "open",
    reason,
    ...(competitor ? { competitor } : {}),
    issues,
  };
}

/** A1 … the variant labels the A/B test refers to. */
export function variantLabel(index: number) {
  return String.fromCharCode(65 + (index % 26));
}

/**
 * Validates what the Bridge returned. Sources are positions into the packet the
 * route sent (1-based), never titles, so the model cannot cite an Outlier the
 * app did not select. A variant without a usable position gets the Outlier whose
 * titles read closest, marked as inferred.
 */
export function parseTitleAnswer(
  value: unknown,
  packet: TitleSource[],
  ideas: string[],
  recent: TitleSource[],
): TitleVariant[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Die Titel-Antwort muss ein Objekt sein.");
  const raw = (value as { titles?: unknown }).titles;
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("Die Titel-Antwort enthält keinen Titel.");

  const seen = new Set<string>();
  const variants: TitleVariant[] = [];
  raw.forEach((entry, index) => {
    const item = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    const title = bounded(item.title, TITLE_MAX + 50);
    if (!title) throw new Error(`Titel ${index + 1} ist leer.`);
    const key = title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const rationale = bounded(item.rationale, TITLE_RATIONALE_MAX);

    const positions = Array.isArray(item.sources) ? item.sources : [];
    const cited = [...new Set(positions.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= packet.length))]
      .slice(0, TITLE_SOURCES_PER_VARIANT)
      .map((n) => packet[n - 1]);
    const ideaPositions = Array.isArray(item.ideas) ? item.ideas : [];
    const usedIdeas = [...new Set(ideaPositions.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= ideas.length))].map(
      (n) => ideas[n - 1],
    );

    variants.push({
      label: variantLabel(variants.length),
      title,
      rationale,
      sources: cited.length > 0 ? cited : similarSources(title, packet),
      sourcesInferred: cited.length === 0,
      ideas: usedIdeas,
      check: checkTitle(title, recent, packet),
    });
  });
  return variants;
}

/** One logged run. The caller owns id and clock, so this stays pure. */
export function newTitleRun(
  input: TitleRequestInput,
  options: { id: string; now: string; packet: TitlePacketSummary; patterns: TitlePatternStat[]; variants: TitleVariant[] },
): TitleRun {
  return {
    id: options.id,
    createdAt: options.now,
    workingTitle: input.workingTitle,
    sourceExcerpt: bounded(input.source, TITLE_SOURCE_EXCERPT),
    sourceLength: input.source.length,
    ...(input.direction ? { direction: input.direction } : {}),
    ideas: input.ideas,
    requested: input.count,
    packet: options.packet,
    patterns: options.patterns,
    variants: options.variants,
  };
}

/** Run ids are generated here and double as file names, so anything else is refused. */
export const TITLE_RUN_ID = /^title-run-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function formatViews(value: number) {
  return value.toLocaleString("de-DE");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });
}

/** Creator text in Markdown: no line breaks, no link or emphasis syntax that could break the file. */
function mdText(value: string) {
  return value.replace(/\s+/g, " ").replace(/([\\`*_[\]<>|])/g, "\\$1").trim();
}

/** The run as a Markdown file for the video folder. German, one section per variant. */
export function titleRunMarkdown(run: TitleRun) {
  const weeks = Math.round(run.packet.checkWindowDays / 7);
  const lines = [
    `# Titel-Varianten: ${mdText(run.workingTitle)}`,
    "",
    `Erzeugt am ${formatDate(run.createdAt)} im Titel-Builder von Signal Room. Muster aus ${run.packet.outliers} Outliern der letzten ${run.packet.windowDays} Tage (${run.packet.en} englisch, ${run.packet.de} deutsch), ab ${run.packet.minFactor}x Kanal-Median und ${formatViews(run.packet.minViews)} Aufrufen. Geprüft gegen ${run.packet.recent} Outlier der letzten ${weeks} Wochen.`,
    "",
    "YouTube testet bis zu drei Titel gleichzeitig. Die Zahlen der Outlier sind der Stand zum Zeitpunkt der Messung.",
  ];
  if (run.ideas.length > 0) {
    lines.push("", "Eingespielte vidIQ-Ideen:", "", ...run.ideas.map((idea) => `- ${mdText(idea)}`));
  }
  for (const variant of run.variants) {
    const check = variant.check;
    lines.push(
      "",
      `## ${variant.label}: ${mdText(variant.title)}`,
      "",
      `- Länge: ${check.length} Zeichen`,
      `- Muster: ${check.patterns.length > 0 ? check.patterns.map((pattern) => pattern.label).join(", ") : "keines erkannt"}`,
      `- Prüfung: ${check.verdict === "backed" ? "belegt" : "offen"}. ${check.reason}`,
    );
    if (check.competitor) {
      lines.push(
        `- Nächster deutscher Outlier: [${mdText(check.competitor.title)}](${check.competitor.url}) von ${mdText(check.competitor.channelTitle)}, ${formatFactor(check.competitor.factor)}, Wortnähe ${Math.round(check.competitor.overlap * 100)} %`,
      );
    }
    for (const issue of check.issues) lines.push(`- Hinweis: ${mdText(issue)}`);
    if (variant.rationale) lines.push(`- Begründung: ${mdText(variant.rationale)}`);
    lines.push("", variant.sourcesInferred ? "Angeregt von (nach Wortnähe zugeordnet):" : "Angeregt von:", "");
    for (const source of variant.sources) {
      lines.push(
        `- [${mdText(source.title)}](${source.url}) · ${mdText(source.channelTitle)} · ${formatFactor(source.factor)} Kanal-Median · ${formatViews(source.views)} Aufrufe · ${source.market.toUpperCase()}`,
      );
    }
    for (const idea of variant.ideas) lines.push(`- vidIQ-Idee: ${mdText(idea)}`);
  }
  lines.push("");
  return lines.join("\n");
}

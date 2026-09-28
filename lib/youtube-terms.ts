import type { YoutubeSearchTerm, YoutubeTopic } from "./contracts";

/** The four themes of Chris' niche. A Suchlauf covers each with at least one term. */
export const YOUTUBE_TOPICS: { id: YoutubeTopic; label: string }[] = [
  { id: "claude", label: "Claude und Claude Code" },
  { id: "agents", label: "KI-Agents" },
  { id: "ai-os", label: "KI-Betriebssystem" },
  { id: "automation", label: "KI-Automatisierung für Business" },
];

const TOPIC_IDS = new Set<string>(YOUTUBE_TOPICS.map((topic) => topic.id));
export const YOUTUBE_TERM_MAX = 80;

/** Start terms from the spec. English channels are the Outlier source, German ones the direct competition. */
const DEFAULT_TERMS: { term: string; market: "de" | "en"; topic: YoutubeTopic }[] = [
  { term: "Claude Code", market: "en", topic: "claude" },
  { term: "Claude AI tutorial", market: "en", topic: "claude" },
  { term: "AI agents", market: "en", topic: "agents" },
  { term: "agentic workflows", market: "en", topic: "agents" },
  { term: "AI operating system", market: "en", topic: "ai-os" },
  { term: "AI automation for business", market: "en", topic: "automation" },
  { term: "Claude Code deutsch", market: "de", topic: "claude" },
  { term: "KI Agenten", market: "de", topic: "agents" },
  { term: "KI Betriebssystem", market: "de", topic: "ai-os" },
  { term: "KI Automatisierung Selbstständige", market: "de", topic: "automation" },
];

function normalizeTerm(term: string) {
  return term.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** Canonical id: market plus the lower-cased term, so the same term twice is one row. */
export function searchTermId(market: "de" | "en", term: string) {
  const slug = normalizeTerm(term).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return `${market}:${slug}`;
}

export function defaultSearchTerms(now: string): YoutubeSearchTerm[] {
  return DEFAULT_TERMS.map((entry) => ({ id: searchTermId(entry.market, entry.term), ...entry, createdAt: now }));
}

/** Validates one term from the Discover form. Throws a readable reason. */
export function parseSearchTerm(input: unknown, now: string): YoutubeSearchTerm {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const term = typeof body.term === "string" ? normalizeTerm(body.term) : "";
  if (!term) throw new Error("Suchbegriff fehlt.");
  if ([...term].length > YOUTUBE_TERM_MAX) throw new Error(`Suchbegriff ist länger als ${YOUTUBE_TERM_MAX} Zeichen.`);
  if (body.market !== "de" && body.market !== "en") throw new Error(`market muss "de" oder "en" sein.`);
  if (typeof body.topic !== "string" || !TOPIC_IDS.has(body.topic)) throw new Error(`topic muss eines von ${[...TOPIC_IDS].join(", ")} sein.`);
  return { id: searchTermId(body.market, term), term, market: body.market, topic: body.topic as YoutubeTopic, createdAt: now };
}

/** Topics a term list leaves uncovered; the Suchlauf warns about them. */
export function missingTopics(terms: Pick<YoutubeSearchTerm, "topic">[]): YoutubeTopic[] {
  const covered = new Set(terms.map((term) => term.topic));
  return YOUTUBE_TOPICS.map((topic) => topic.id).filter((id) => !covered.has(id));
}

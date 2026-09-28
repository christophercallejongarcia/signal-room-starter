import type { Idea, Network } from "./contracts";
import { DEFAULT_OUTLIER_THRESHOLD, type OutlierThreshold } from "./discover-filter.ts";
import { YOUTUBE_DEFAULT_THRESHOLD } from "./config.ts";

/**
 * The desk-wide network toggle (YouTube or Instagram). The URL carries it, so a
 * reload, a shared link and the separate /creator and /script routes all read
 * the same view; localStorage remembers the last choice when a link has none.
 */
export const NETWORK_PARAM = "network";
export const NETWORK_STORAGE_KEY = "signal-room.network";
export const DESK_NETWORKS = ["youtube", "instagram"] as const;
export type DeskNetwork = (typeof DESK_NETWORKS)[number];
export const DEFAULT_NETWORK: DeskNetwork = "instagram";

/** The Schwelle a network opens on: followers for Instagram (ADR-0003), the channel median for YouTube (ADR-0007). */
const DEFAULT_THRESHOLDS: Record<DeskNetwork, OutlierThreshold> = { instagram: DEFAULT_OUTLIER_THRESHOLD, youtube: YOUTUBE_DEFAULT_THRESHOLD as OutlierThreshold };

export function parseNetwork(value: unknown): DeskNetwork | null {
  return DESK_NETWORKS.find((network) => network === value) ?? null;
}

/** URL first, then the remembered choice, then Instagram. */
export function resolveNetwork(search: string, stored: string | null): DeskNetwork {
  return parseNetwork(new URLSearchParams(search).get(NETWORK_PARAM)) ?? parseNetwork(stored) ?? DEFAULT_NETWORK;
}

export function defaultThreshold(network: Network | undefined): OutlierThreshold {
  return network === "youtube" ? DEFAULT_THRESHOLDS.youtube : DEFAULT_THRESHOLDS.instagram;
}

/** The desk URL for one tab and network, keeping every other query parameter. */
export function deskSearch(current: string, tab: string, network: DeskNetwork): string {
  const query = new URLSearchParams(current);
  query.set("tab", tab);
  query.set(NETWORK_PARAM, network);
  return `?${query}`;
}

function urlNetwork(url: string | undefined): DeskNetwork | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtube.com" || host === "youtu.be") return "youtube";
    if (host === "instagram.com") return "instagram";
  } catch {
    return null;
  }
  return null;
}

/**
 * Which network an Idea came from: its source Signal's creator, else the host of
 * its source link (an Outlier from the YouTube radar has a link but no Signal).
 * Null for an Idea without a source; it belongs to both views.
 */
export function ideaNetwork(idea: Pick<Idea, "sourceSignalId" | "sourceUrl">, signalNetworks: Map<string, Network>): DeskNetwork | null {
  const fromSignal = idea.sourceSignalId ? parseNetwork(signalNetworks.get(idea.sourceSignalId)) : null;
  return fromSignal ?? urlNetwork(idea.sourceUrl);
}

/** The Ideas of one network plus every Idea without a source. */
export function ideasForNetwork<T extends Pick<Idea, "sourceSignalId" | "sourceUrl">>(ideas: T[], network: DeskNetwork, signalNetworks: Map<string, Network>): T[] {
  return ideas.filter((idea) => {
    const origin = ideaNetwork(idea, signalNetworks);
    return origin === null || origin === network;
  });
}

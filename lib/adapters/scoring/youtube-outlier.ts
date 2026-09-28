// Relative imports so both `node --test` and the Convex bundler can load this file without the "@/" alias.
import { YOUTUBE_BASELINE_VIDEOS, YOUTUBE_MIN_BASELINE, YOUTUBE_SHORT_MAX_SECONDS } from "../../config.ts";

const DAY = 86_400_000;

/**
 * Short or long-form, decided in one place. The API has no Shorts flag: a video
 * up to YOUTUBE_SHORT_MAX_SECONDS or one tagged #shorts counts as a Short.
 * A video without a duration (live, processing) is never long-form evidence.
 */
export function youtubeFormat(durationSeconds: number, title = ""): "long" | "short" {
  if (!(durationSeconds > YOUTUBE_SHORT_MAX_SECONDS)) return "short";
  return /#shorts\b/i.test(title) ? "short" : "long";
}

export type BaselineVideo = { views: number; publishedAt: string; format?: string };
export type YoutubeBaseline = { median: number; count: number };

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Median views of the channel's newest YOUTUBE_BASELINE_VIDEOS long-form videos.
 * Shorts are ignored. The video being scored may be part of the set: the baseline
 * is the channel's recent normal, not "everything but this one".
 */
export function youtubeBaseline(videos: BaselineVideo[]): YoutubeBaseline {
  const longform = videos
    .filter((video) => video.format === "long")
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, YOUTUBE_BASELINE_VIDEOS);
  return { median: median(longform.map((video) => video.views)), count: longform.length };
}

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export type YoutubeMetrics = {
  /** views / channel median; 0 for a Short or a baseline under YOUTUBE_MIN_BASELINE. */
  factor: number;
  viewsPerSubscriber: number;
  viewsPerDay: number;
  ageDays: number;
};

/** Every number the Outlier-Radar shows for one video, measured against `now`. */
export function youtubeMetrics(
  video: { views: number; publishedAt: string; format?: string },
  baseline: YoutubeBaseline,
  subscribers: number,
  now: Date,
): YoutubeMetrics {
  const ageDays = Math.max(0, (now.getTime() - Date.parse(video.publishedAt)) / DAY);
  const usable = video.format === "long" && baseline.count >= YOUTUBE_MIN_BASELINE && baseline.median > 0;
  return {
    factor: usable ? round(video.views / baseline.median) : 0,
    viewsPerSubscriber: subscribers > 0 ? round(video.views / subscribers) : 0,
    // A video younger than a day counts as one day old, so a fresh upload is not inflated.
    viewsPerDay: Math.round(video.views / Math.max(1, ageDays)),
    ageDays: round(ageDays, 1),
  };
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** The plain-language reason under a YouTube card. No verdict word: that depends on the chosen Schwelle. */
export function describeYoutubeOutlier(metrics: YoutubeMetrics, baseline: YoutubeBaseline, format?: string) {
  if (format !== "long") return "Short: kein Outlier-Faktor, nur Longform zählt";
  if (baseline.count < YOUTUBE_MIN_BASELINE) {
    return `Kanal-Median fehlt: erst ${baseline.count} Longform-Videos gemessen, gebraucht werden ${YOUTUBE_MIN_BASELINE}`;
  }
  const parts = [`${metrics.factor.toFixed(1)}x Kanal-Median (${compact.format(baseline.median)} über ${baseline.count} Longform)`];
  if (metrics.viewsPerSubscriber > 0) parts.push(`${metrics.viewsPerSubscriber.toFixed(2)} Aufrufe pro Abo`);
  parts.push(`${compact.format(metrics.viewsPerDay)} Aufrufe pro Tag`);
  return parts.join(" · ");
}

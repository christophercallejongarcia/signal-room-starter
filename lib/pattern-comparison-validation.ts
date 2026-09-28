import type { PatternEvidence, SignalRecord, TranscriptAnalysis } from "./contracts.ts";
import { analysisText, hashTranscriptText, TRANSCRIPT_ANALYSIS_VERSION } from "./transcript-analysis.ts";

export function isCurrentCompleteAnalysis(signal: SignalRecord, analysis: TranscriptAnalysis) {
  const source = analysisText(signal);
  return Boolean(
    source
    && analysis.signalId === signal.id
    && analysis.textVersion === source.textVersion
    && analysis.textHash === hashTranscriptText(source.text)
    && analysis.analysisVersion === TRANSCRIPT_ANALYSIS_VERSION
    && analysis.status === "complete"
    && analysis.complete,
  );
}

/** Rejects evaluated evidence when its exact analyzed text is no longer current. */
export function validateCurrentPatternEvidence(
  evidence: readonly PatternEvidence[],
  signals: readonly SignalRecord[],
  analyses: readonly TranscriptAnalysis[],
) {
  const signalById = new Map(signals.map((signal) => [signal.id, signal]));
  const analysisById = new Map(analyses.map((analysis) => [analysis.id, analysis]));
  for (const item of evidence) {
    if (item.verdict === "unknown") continue;
    const signal = signalById.get(item.signalId);
    const analysis = item.analysisId ? analysisById.get(item.analysisId) : undefined;
    if (!signal || !analysis || !isCurrentCompleteAnalysis(signal, analysis)) {
      throw new Error(`Pattern comparison is stale because Reel ${item.signalId} no longer has the evaluated current analysis.`);
    }
    const source = analysisText(signal);
    if (!source || !item.quote || !Number.isInteger(item.start) || !Number.isInteger(item.end)
      || item.start! < 0 || item.end! <= item.start! || source.text.slice(item.start, item.end) !== item.quote) {
      throw new Error(`Pattern comparison evidence for Reel ${item.signalId} does not match the current text.`);
    }
  }
}

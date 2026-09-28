import test from "node:test";
import assert from "node:assert/strict";
import { parsePatternDiscoveryRequest } from "../lib/pattern-discovery-run.ts";
import { TRANSCRIPT_ANALYSIS_FULL_TEXT_MAX_CHARS } from "../lib/transcript-analysis.ts";
import { validatePatternDiscoveryRequest } from "../bridge/pattern-discovery.mjs";

test("pattern discovery accepts one bounded comparison scope and rejects unknown or oversized input", () => {
  assert.deepEqual(parsePatternDiscoveryRequest({ sourceSignalIds: ["ig-a", "ig-a", "ig-b"], market: "de", niche: "core", topic: "KI-Agenten", ageBucket: "8-30", owned: false }), {
    sourceSignalIds: ["ig-a", "ig-b"], market: "de", niche: "core", topic: "KI-Agenten", ageBucket: "8-30", owned: false,
  });
  assert.throws(() => parsePatternDiscoveryRequest({ sourceSignalIds: [], market: "de", niche: "core", topic: "x", ageBucket: "8-30", owned: false }), /between 1 and 20/i);
  assert.throws(() => parsePatternDiscoveryRequest({ sourceSignalIds: ["ig-a"], market: "fr", niche: "core", topic: "x", ageBucket: "8-30", owned: false }), /market/i);
  assert.throws(() => parsePatternDiscoveryRequest({ sourceSignalIds: ["ig-a"], market: "de", niche: "core", topic: "x", ageBucket: "8-30", owned: false, surprise: true }), /unexpected/i);
});

test("Pattern discovery accepts the same complete-text limit as transcript analysis", () => {
  const text = "x".repeat(TRANSCRIPT_ANALYSIS_FULL_TEXT_MAX_CHARS);
  assert.doesNotThrow(() => validatePatternDiscoveryRequest({ action: "evaluate", definition: "Beleg vor CTA", signalId: "ig-a", text }));
  assert.doesNotThrow(() => validatePatternDiscoveryRequest({
    action: "hypothesize",
    sources: Array.from({ length: 20 }, (_, index) => ({ signalId: `ig-${index}`, text })),
  }));
  assert.throws(() => validatePatternDiscoveryRequest({ action: "evaluate", definition: "Beleg vor CTA", signalId: "ig-a", text: `${text}x` }), /bounded|large/i);
});

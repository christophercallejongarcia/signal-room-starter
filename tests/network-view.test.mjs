import test from "node:test";
import assert from "node:assert/strict";
import { defaultThreshold, deskSearch, ideasForNetwork, networkAfterCapture, resolveNetwork } from "../lib/network-view.ts";
import { parseThreshold, tabPath } from "../lib/creator-detail.ts";

test("the URL wins over the remembered choice, which wins over Instagram", () => {
  assert.equal(resolveNetwork("?network=youtube", "instagram"), "youtube");
  assert.equal(resolveNetwork("?tab=ideas", "youtube"), "youtube");
  assert.equal(resolveNetwork("?network=tiktok", null), "instagram", "an unknown value falls through");
  assert.equal(resolveNetwork("", "garbage"), "instagram");
});

test("each network opens on its own Schwelle; a link's threshold only counts when selectable", () => {
  assert.equal(defaultThreshold("youtube"), 3);
  assert.equal(defaultThreshold("instagram"), 2);
  assert.equal(defaultThreshold(undefined), 2);
  assert.equal(parseThreshold("?threshold=5", null), 5);
  assert.equal(parseThreshold("?threshold=4", null), null, "no threshold in the link: the creator's network decides");
});

test("desk links keep other parameters and carry tab and network", () => {
  assert.equal(deskSearch("?from=x", "ideas", "youtube"), "?from=x&tab=ideas&network=youtube");
  assert.equal(deskSearch("?tab=discover&network=instagram", "profile", "youtube"), "?tab=profile&network=youtube");
  assert.equal(tabPath("channels", "youtube"), "/?tab=channels&network=youtube");
  assert.equal(tabPath("channels"), "/?tab=channels");
});

test("Ideas follow their source Signal, else their source link; Ideas without a source show in both views", () => {
  const signals = new Map([["ig-1", "instagram"], ["yt-1", "youtube"]]);
  const ideas = [
    { id: "a", sourceSignalId: "ig-1" },
    { id: "b", sourceSignalId: "yt-1" },
    { id: "c", sourceUrl: "https://www.youtube.com/watch?v=x" },
    { id: "d", sourceUrl: "https://www.instagram.com/reel/x/" },
    { id: "e" },
    { id: "f", sourceSignalId: "gone", sourceUrl: "https://youtu.be/x" },
  ];
  assert.deepEqual(ideasForNetwork(ideas, "youtube", signals).map((idea) => idea.id), ["b", "c", "e", "f"]);
  assert.deepEqual(ideasForNetwork(ideas, "instagram", signals).map((idea) => idea.id), ["a", "d", "e"]);
});

test("an Idea captured from the Instagram Briefing while YouTube is selected stays visible in Ideas", () => {
  const signals = new Map([["ig-direkt", "instagram"]]);
  const briefingIdea = { id: "new", sourceSignalId: "ig-direkt", sourceUrl: "https://www.instagram.com/reel/x/" };
  const target = networkAfterCapture(briefingIdea, "youtube", signals);
  assert.equal(target, "instagram");
  assert.deepEqual(ideasForNetwork([briefingIdea], target, signals).map((idea) => idea.id), ["new"]);
  assert.equal(networkAfterCapture({ id: "form" }, "youtube", signals), "youtube", "an Idea without a source keeps the view");
  assert.equal(networkAfterCapture({ id: "radar", sourceUrl: "https://youtu.be/x" }, "youtube", signals), "youtube");
});

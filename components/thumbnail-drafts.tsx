"use client";

import { ArrowCounterClockwise, CheckCircle, CircleNotch, Star, WarningCircle, XCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { rankDrafts, type ThumbnailCheck, type ThumbnailRun, type ThumbnailVariant } from "@/lib/thumbnail-builder";

/** Recipe names as Chris reads them. */
const RECIPE_NAMES: Record<string, string> = {
  "icon-halo": "Icon-Bogen (Tristen)",
  "terminal-command": "Terminal-Befehl (Tristen)",
  "word-behind-head": "Wort hinter dem Kopf (Tristen)",
  "cream-surprise": "Creme mit Staunen (Tristen)",
  "logo-equation": "Logo-Gleichung (Nate, Jack)",
  "whiteboard-course": "Whiteboard-Kurs (Nate)",
  "proof-pointing": "Beweis mit Zeigefinger (Nate, Jack)",
  "old-vs-new": "Alt gegen Neu (Nate, Jack)",
  "tier-cards": "Stufen-Karten (Mark)",
  "ai-os-command": "KI-OS-Kommandozentrale (Mark)",
  "stripe-outline": "Streifen-Gliederung (Mark)",
  "graph-paper-curve": "Millimeterpapier-Kurve (Kallaway)",
  "normal-vs-agent": "Normal gegen Agent (Kallaway)",
  "open-head": "Offener Kopf (Kallaway)",
  "ui-toggle": "UI-Umschalter (Jeff Su)",
  "giant-face-stack": "Riesengesicht mit Stapel-Text (Riley Brown)",
  "abo-comparison": "Abo-Vergleich (deine Idee)",
};

/** A pending draft older than this was cut off (server restart); mirrors DRAFT_STALE_MS. */
const STALE_MS = 15 * 60_000;

export function draftIsRendering(variant: ThumbnailVariant, now = Date.now()) {
  return Boolean(variant.draft?.pending) && now - Date.parse(variant.draft?.renderedAt ?? "") < STALE_MS;
}

/** Plain-language reasons why a draft failed the automatic check. */
function checkReasons(check: ThumbnailCheck) {
  const reasons: string[] = [];
  if (check.recognizable === false) reasons.push("du bist nicht sofort erkennbar");
  if (!check.textExact) reasons.push("Text weicht ab");
  if (check.wordCount > 6) reasons.push(`${check.wordCount} Wörter`);
  if (check.elementCount > 4) reasons.push(`${check.elementCount} Blöcke`);
  if (!check.cornerFree) reasons.push("Ecke unten rechts belegt");
  if (!check.numbersConsistent) reasons.push("Zahl passt nicht zum Bild");
  if (check.skinOk === false) reasons.push("Haut blass oder künstlich");
  if (check.faceBigEnough === false) reasons.push("Gesicht zu klein");
  if (check.textClearOfFace === false) reasons.push("Text über Augen oder Mund");
  if (!check.readableSmall) reasons.push("klein nicht lesbar");
  if (check.eyeContact === false) reasons.push("kein Blick in die Kamera (Soll)");
  return reasons;
}

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = (await response.json().catch(() => ({}))) as { run?: ThumbnailRun; error?: string };
  if (!response.ok || !payload.run) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload.run;
}

/**
 * The gallery of a draft run: best checked drafts first, each with the
 * automatic check, Chris' stars and note, a re-render and the choice.
 */
export function DraftGallery({ run, disabled, onRunChanged }: { run: ThumbnailRun; disabled: boolean; onRunChanged: (run: ThumbnailRun) => void }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const ranked = rankDrafts(run.variants);
  const done = run.variants.filter((variant) => variant.draft && !variant.draft.pending).length;
  const passed = run.variants.filter((variant) => variant.draft?.check?.passed).length;
  const rendering = run.variants.filter((variant) => draftIsRendering(variant)).length;

  async function act(key: string, task: () => Promise<ThumbnailRun>) {
    setBusy(key);
    setError("");
    try {
      onRunChanged(await task());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Das hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="thumb-drafts">
      <p className="thumb-drafts-summary">
        {rendering > 0 && <><CircleNotch className="spin" size={13} /> {rendering} Entwürfe rendern gerade, die Seite lädt sie selbst nach. </>}
        <strong>{done} von {run.variants.length}</strong> fertig · <strong>{passed}</strong> haben die automatische Prüfung bestanden · sortiert nach Prüfung und Klick-Punkten.
      </p>
      {error && <p className="yt-bad"><WarningCircle size={13} /> {error}</p>}
      <div className="thumb-draft-grid">
        {ranked.map((variant) => {
          const draft = variant.draft;
          const check = draft?.check;
          const renderingNow = draftIsRendering(variant);
          const chosen = run.chosenVariantId === variant.id;
          const reasons = check ? checkReasons(check) : [];
          const note = notes[variant.id] ?? variant.rating?.note ?? "";
          return (
            <article className={chosen ? "thumb-draft chosen" : "thumb-draft"} key={variant.id}>
              <div className="thumb-art">
                {draft?.imageUrl && !draft.error && !renderingNow ? (
                  <img src={draft.imageUrl} alt={`Entwurf: ${variant.textOverlay}`} />
                ) : (
                  <span>{renderingNow ? <><CircleNotch className="spin" size={16} /> Rendert…</> : draft?.error ?? "Nicht gerendert"}</span>
                )}
              </div>
              <div className="thumb-variant-body">
                <div className="thumb-draft-head">
                  <span className="kicker">{RECIPE_NAMES[variant.recipe ?? ""] ?? variant.recipe ?? "Entwurf"}</span>
                  {check && (
                    <span className={check.passed ? "thumb-check ok" : "thumb-check bad"} title={check.notes}>
                      {check.passed ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />} {check.score}/10
                    </span>
                  )}
                  {chosen && <span className="thumb-chosen">Gewählt</span>}
                </div>
                <p className="cover-overlay">„{variant.textOverlay}“</p>
                <p className="thumb-concept">{variant.concept}</p>
                {check && (
                  <p className="thumb-check-notes">
                    {check.notes}
                    {reasons.length > 0 && <><br /><strong>Prüfung:</strong> {reasons.join(", ")}</>}
                  </p>
                )}
                {draft?.checkError && <p className="thumb-check-notes">Prüfung fehlgeschlagen: {draft.checkError}</p>}
                <div className="thumb-stars" role="group" aria-label="Bewertung">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      type="button"
                      key={stars}
                      aria-label={`${stars} Sterne`}
                      aria-pressed={variant.rating?.stars === stars}
                      disabled={Boolean(busy)}
                      onClick={() => act(`${variant.id}-rate`, () => post("/api/youtube/thumbnails/rate", { runId: run.id, variantId: variant.id, stars, ...(note ? { note } : {}) }))}
                    >
                      <Star size={16} weight={(variant.rating?.stars ?? 0) >= stars ? "fill" : "regular"} />
                    </button>
                  ))}
                </div>
                <input
                  className="thumb-draft-note"
                  value={note}
                  maxLength={300}
                  placeholder="Was gefällt dir, was nicht?"
                  onChange={(event) => setNotes((current) => ({ ...current, [variant.id]: event.target.value }))}
                  onBlur={() => {
                    if (variant.rating && note !== (variant.rating.note ?? "")) {
                      void act(`${variant.id}-rate`, () => post("/api/youtube/thumbnails/rate", { runId: run.id, variantId: variant.id, stars: variant.rating!.stars, note }));
                    }
                  }}
                />
                <div className="thumb-draft-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={disabled || renderingNow || Boolean(busy)}
                    onClick={() => act(`${variant.id}-render`, () => post("/api/youtube/thumbnails/drafts/render", { runId: run.id, variantId: variant.id }))}
                  >
                    <ArrowCounterClockwise size={13} /> Neu rendern
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={!draft?.imageUrl || Boolean(draft?.error) || renderingNow || Boolean(busy) || chosen}
                    onClick={() => act(`${variant.id}-choose`, () => post("/api/youtube/thumbnails/choose", { runId: run.id, variantId: variant.id }))}
                  >
                    <CheckCircle size={13} /> {chosen ? "Gewählt" : "Wählen"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

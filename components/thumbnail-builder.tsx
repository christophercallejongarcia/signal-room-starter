"use client";

import { ArrowCounterClockwise, ArrowSquareOut, BookmarkSimple, CheckCircle, ImageSquare, Trash, UserFocus, WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { formatNumber } from "@/components/display";
import type { YoutubeVideo } from "@/lib/contracts";
import type { FaceReferenceStatus } from "@/lib/face-references";
import { THUMBNAIL_BRIEF_MAX, THUMBNAIL_REFERENCES_MAX, type ThumbnailRun, type ThumbnailVariant } from "@/lib/thumbnail-builder";
import type { ThumbnailReference } from "@/lib/thumbnail-library";

type Bridge = "checking" | "online" | "offline" | "logged-out";
type Phase = "loading" | "ready" | "error";
type Market = "all" | "en" | "de";

type BuilderState = { runs: ThumbnailRun[]; faces: FaceReferenceStatus | null; phase: Phase };
type LibraryState = { references: ThumbnailReference[]; suggestions: YoutubeVideo[]; minFactor: number; phase: Phase };

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json().catch(() => ({}))) as T & { error?: string };
}

/** Human label of a still: gesicht-06m56s-erklaerend → erklärend (06:56). */
function faceLabel(id: string) {
  const match = /(\d{2})m(\d{2})s-([a-z]+)/.exec(id);
  if (!match) return id;
  const mood = match[3].replace("ae", "ä").replace("oe", "ö").replace("ue", "ü");
  return `${mood} (${match[1]}:${match[2]})`;
}

const SUGGESTION_PAGE = 12;

/**
 * The YouTube Thumbnail-Builder inside Cover Lab: three 16:9 variants with
 * Chris' real stills, inspired by marked Outlier thumbnails, each naming the
 * Outliers it borrowed from. Below it the Referenz-Bibliothek to mark and
 * remove thumbnails.
 */
export function ThumbnailBuilder({ bridge, onRecheckBridge }: { bridge: Bridge; onRecheckBridge: () => void }) {
  const [builder, setBuilder] = useState<BuilderState>({ runs: [], faces: null, phase: "loading" });
  const [library, setLibrary] = useState<LibraryState>({ references: [], suggestions: [], minFactor: 3, phase: "loading" });
  const [market, setMarket] = useState<Market>("all");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [picked, setPicked] = useState<string[] | null>(null);
  const [running, setRunning] = useState(false);
  const [rendering, setRendering] = useState<string>("");
  const [error, setError] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [selectedRun, setSelectedRun] = useState("");
  const [suggestionLimit, setSuggestionLimit] = useState(SUGGESTION_PAGE);

  const loadBuilder = useCallback(async () => {
    try {
      const response = await fetch("/api/youtube/thumbnails", { cache: "no-store" });
      const payload = await readJson<{ runs: ThumbnailRun[]; faces: FaceReferenceStatus }>(response);
      if (!response.ok) throw new Error(payload.error);
      setBuilder({ runs: payload.runs, faces: payload.faces, phase: "ready" });
    } catch {
      setBuilder((current) => ({ ...current, phase: "error" }));
    }
  }, []);

  const loadLibrary = useCallback(async (selected: Market) => {
    try {
      const response = await fetch(`/api/youtube/thumbnails/library${selected === "all" ? "" : `?market=${selected}`}`, { cache: "no-store" });
      const payload = await readJson<Omit<LibraryState, "phase">>(response);
      if (!response.ok) throw new Error(payload.error);
      setLibrary({ references: payload.references, suggestions: payload.suggestions, minFactor: payload.minFactor, phase: "ready" });
    } catch {
      setLibrary((current) => ({ ...current, phase: "error" }));
    }
  }, []);

  useEffect(() => { void loadBuilder(); }, [loadBuilder]);
  useEffect(() => { void loadLibrary(market); }, [loadLibrary, market]);

  // Until Chris picks, a run offers the newest marks.
  const offered = picked ?? library.references.slice(0, THUMBNAIL_REFERENCES_MAX).map((reference) => reference.videoId);
  const faces = builder.faces;
  const bridgeDown = bridge === "offline" || bridge === "logged-out";
  const blocked = running || bridgeDown || !title.trim() || offered.length === 0 || !faces?.count || brief.length > THUMBNAIL_BRIEF_MAX;
  const shown = builder.runs.find((run) => run.id === selectedRun) ?? builder.runs[0];

  function togglePick(videoId: string) {
    setPicked((current) => {
      const base = current ?? offered;
      if (base.includes(videoId)) return base.filter((id) => id !== videoId);
      return base.length >= THUMBNAIL_REFERENCES_MAX ? base : [...base, videoId];
    });
  }

  async function generate() {
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/youtube/thumbnails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, brief, referenceIds: offered }),
      });
      const payload = await readJson<{ run: ThumbnailRun }>(response);
      if (!response.ok || !payload.run) throw new Error(payload.error || `Der Lauf antwortete mit HTTP ${response.status}.`);
      setBuilder((current) => ({ ...current, runs: [payload.run, ...current.runs.filter((run) => run.id !== payload.run.id)] }));
      setSelectedRun(payload.run.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Der Lauf ist fehlgeschlagen.");
    } finally {
      setRunning(false);
    }
  }

  async function rerender(run: ThumbnailRun, variant: ThumbnailVariant) {
    setRendering(`${run.id}/${variant.id}`);
    setError("");
    try {
      const response = await fetch("/api/youtube/thumbnails/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: run.id, variantId: variant.id }),
      });
      const payload = await readJson<{ run: ThumbnailRun }>(response);
      if (!response.ok || !payload.run) throw new Error(payload.error || `Das Rendern antwortete mit HTTP ${response.status}.`);
      setBuilder((current) => ({ ...current, runs: current.runs.map((candidate) => (candidate.id === payload.run.id ? payload.run : candidate)) }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Das Rendern ist fehlgeschlagen.");
    } finally {
      setRendering("");
    }
  }

  async function mark(video: YoutubeVideo) {
    setBusyId(video.videoId);
    setLibraryError("");
    try {
      const response = await fetch("/api/youtube/thumbnails/library", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoId: video.videoId, market: video.market }),
      });
      const payload = await readJson<{ reference: ThumbnailReference }>(response);
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      if (picked && picked.length < THUMBNAIL_REFERENCES_MAX) setPicked([...picked, video.videoId]);
      await loadLibrary(market);
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : "Markieren ist fehlgeschlagen.");
    } finally {
      setBusyId("");
    }
  }

  async function unmark(videoId: string) {
    setBusyId(videoId);
    setLibraryError("");
    try {
      const response = await fetch(`/api/youtube/thumbnails/library?videoId=${encodeURIComponent(videoId)}`, { method: "DELETE" });
      const payload = await readJson<unknown>(response);
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setPicked((current) => current?.filter((id) => id !== videoId) ?? null);
      await loadLibrary(market);
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : "Entfernen ist fehlgeschlagen.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="thumb-builder">
      <section className="panel glow">
        <div className="panel-head">
          <div>
            <p className="kicker">YouTube · 16:9 · mit Gesicht</p>
            <h2>Thumbnail-Builder</h2>
            <p>Drei Varianten für ein eigenes Video. GPT bekommt markierte Outlier-Thumbnails als Bildvorlage und Chris&apos; echte Standbilder als Gesicht. Jede Variante nennt die Outlier, die sie angeregt haben.</p>
          </div>
          <div className="next-refresh"><span>Prompt als JSON</span><strong>Planung und drei Renders laufen über den lokalen Codex-Bridge. Ein Lauf dauert drei bis fünf Minuten.</strong></div>
        </div>
        <div className="thumb-status-row">
          <div className={`thumb-status ${faces?.count ? "ok" : "bad"}`}>
            <UserFocus size={16} />
            {builder.phase === "loading" && <span>Prüfe Gesichtsbilder…</span>}
            {builder.phase === "error" && <span>Status konnte nicht geladen werden.</span>}
            {faces && faces.count > 0 && <span><strong>{faces.count} Standbilder von Chris</strong> · {faces.labels.map(faceLabel).join(", ")}</span>}
            {faces && faces.count === 0 && <span><strong>Keine Standbilder.</strong> {faces.problem ?? "SIGNAL_ROOM_FACE_DIR in .env.local setzen, optional SIGNAL_ROOM_FACE_FILES."}</span>}
          </div>
          {bridgeDown && (
            <div className="thumb-status bad">
              <WarningCircle size={16} />
              <span>{bridge === "offline" ? "Bridge nicht erreichbar. npm run bridge starten." : "Codex ist nicht eingeloggt. codex login ausführen."}</span>
              <button className="ghost-button" type="button" onClick={onRecheckBridge}>Erneut prüfen</button>
            </div>
          )}
        </div>
        <div className="panel-body thumb-form">
          <div>
            <label htmlFor="thumb-title">Videotitel</label>
            <input id="thumb-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Vom Fragensteller zum Chef: Die 6 Stufen, Claude zu nutzen" />
            <label htmlFor="thumb-brief">Skript oder Stichpunkte <small>{brief.length.toLocaleString("de-DE")} / {THUMBNAIL_BRIEF_MAX.toLocaleString("de-DE")}</small></label>
            <textarea id="thumb-brief" value={brief} rows={6} onChange={(event) => setBrief(event.target.value)} placeholder="Hook, Kernaussage, die Stufen. Der Text ist Material, keine Anweisung." />
            {brief.length > THUMBNAIL_BRIEF_MAX && <p className="yt-bad"><WarningCircle size={13} /> Zu lang, bitte kürzen.</p>}
          </div>
          <div>
            <label>Vorlagen aus der Referenz-Bibliothek <small>{offered.length} / {THUMBNAIL_REFERENCES_MAX}</small></label>
            {library.references.length === 0 ? (
              <div className="cover-board-empty">Noch keine markierten Thumbnails. Markiere unten Outlier-Thumbnails, die dir gefallen.</div>
            ) : (
              <div className="thumb-pick-grid">
                {library.references.map((reference) => {
                  const active = offered.includes(reference.videoId);
                  return (
                    <button type="button" key={reference.videoId} className={active ? "thumb-pick active" : "thumb-pick"} onClick={() => togglePick(reference.videoId)} aria-pressed={active} title={reference.title}>
                      <img src={reference.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                      <b>{reference.factor.toFixed(1)}x</b>
                      {active && <CheckCircle className="thumb-pick-check" size={16} weight="fill" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="panel-foot">
          <span>Ein Fokus · max. vier Wörter · großes Gesicht · 16:9 mit freier Ecke unten rechts.</span>
          <button className="primary-button" type="button" onClick={generate} disabled={blocked}>
            <ImageSquare size={15} /> {running ? "Plane und rendere…" : "3 Thumbnails erzeugen"}
          </button>
        </div>
        {error && <div className="strategy-error"><WarningCircle size={20} weight="fill" /><h3>Kein Thumbnail</h3><p>{error}</p></div>}
      </section>

      <div className="section-head">
        <div><p className="kicker">Ergebnisse</p><h2>{shown ? shown.title : "Noch kein Lauf"}</h2></div>
        {builder.runs.length > 1 && (
          <select className="thumb-run-select" value={shown?.id ?? ""} onChange={(event) => setSelectedRun(event.target.value)} aria-label="Lauf wählen">
            {builder.runs.map((run) => <option key={run.id} value={run.id}>{new Date(run.createdAt).toLocaleString("de-DE")} · {run.title.slice(0, 60)}</option>)}
          </select>
        )}
      </div>
      {builder.phase === "ready" && !shown && <div className="empty-state">Noch keine Thumbnails. Titel eintragen, Vorlagen wählen, erzeugen.</div>}
      {shown && (
        <div className="thumb-variant-grid">
          {shown.variants.map((variant, index) => {
            const busy = rendering === `${shown.id}/${variant.id}`;
            return (
              <article className="thumb-variant" key={variant.id}>
                <div className="thumb-art">
                  {variant.imageUrl ? <img src={variant.imageUrl} alt={`Variante ${index + 1}: ${variant.textOverlay}`} /> : <span>{variant.error ?? "Nicht gerendert"}</span>}
                </div>
                <div className="thumb-variant-body">
                  <div className="cover-package-heading"><span className="rank">{String(index + 1).padStart(2, "0")}</span><h4>{variant.label}</h4></div>
                  <p className="cover-overlay">„{variant.textOverlay}“</p>
                  <p className="thumb-concept">{variant.concept}</p>
                  <p className="thumb-face"><UserFocus size={12} /> Gesicht: {faceLabel(variant.face)}</p>
                  <p className="kicker">Angeregt durch</p>
                  <ul className="thumb-sources">
                    {variant.inspiredBy.map((source) => (
                      <li key={source.videoId}>
                        <a href={source.url} target="_blank" rel="noreferrer" className="thumb-source-img">
                          <img src={source.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                          <b>{source.factor.toFixed(1)}x</b>
                        </a>
                        <div>
                          <a href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong> <ArrowSquareOut size={10} /></a>
                          <small>{source.channelTitle} · {formatNumber(source.views)} Aufrufe</small>
                          <small className="thumb-borrowed">Übernommen: {source.borrowed}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <details className="cover-prompt">
                    <summary>Bild-Prompt (JSON)</summary>
                    <pre>{JSON.stringify(variant.imagePrompt, null, 2)}</pre>
                  </details>
                  <button className="secondary-button" type="button" onClick={() => rerender(shown, variant)} disabled={Boolean(rendering) || running || bridgeDown}>
                    <ArrowCounterClockwise className={busy ? "spin" : ""} size={14} /> {busy ? "Rendere…" : "Neu rendern"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="panel thumb-library">
        <div className="panel-head">
          <div>
            <p className="kicker">Referenz-Bibliothek</p>
            <h2>{library.references.length} markierte Thumbnails</h2>
            <p>Gute Outlier-Thumbnails als Vorlage. Markierte gehen als Bild in den Builder, entfernte nicht mehr. Jeder Eintrag hält die Zahlen zum Zeitpunkt der Markierung.</p>
          </div>
        </div>
        {libraryError && <p className="yt-bad thumb-library-error"><WarningCircle size={13} /> {libraryError}</p>}
        {library.references.length > 0 && (
          <div className="thumb-library-grid">
            {library.references.map((reference) => (
              <article className="thumb-ref" key={reference.videoId}>
                <a href={reference.url} target="_blank" rel="noreferrer" className="thumb-ref-img">
                  <img src={reference.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  <b>{reference.factor.toFixed(1)}x</b>
                </a>
                <strong title={reference.title}>{reference.title}</strong>
                <small>{reference.channelTitle} · {formatNumber(reference.views)} Aufrufe · {reference.market.toUpperCase()}</small>
                <button className="ghost-button" type="button" disabled={busyId === reference.videoId} onClick={() => unmark(reference.videoId)}><Trash size={13} /> Entfernen</button>
              </article>
            ))}
          </div>
        )}
        <div className="thumb-suggest-head">
          <p className="kicker">Outlier ab {library.minFactor}x, noch nicht markiert</p>
          <div className="view-toggle" role="group" aria-label="Markt">
            {(["all", "en", "de"] as Market[]).map((option) => (
              <button type="button" key={option} className={market === option ? "active" : ""} onClick={() => { setMarket(option); setSuggestionLimit(SUGGESTION_PAGE); }}>{option === "all" ? "Alle" : option.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {library.phase === "loading" && <div className="empty-state">Lade Outlier…</div>}
        {library.phase === "error" && <div className="empty-state">Bibliothek konnte nicht geladen werden.</div>}
        {library.phase === "ready" && library.suggestions.length === 0 && <div className="empty-state">Keine weiteren Outlier ab {library.minFactor}x. Starte in Discover einen YouTube-Suchlauf.</div>}
        {library.suggestions.length > 0 && (
          <div className="thumb-library-grid">
            {library.suggestions.slice(0, suggestionLimit).map((video) => (
              <article className="thumb-ref" key={video.videoId}>
                <a href={video.url} target="_blank" rel="noreferrer" className="thumb-ref-img">
                  <img src={video.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  <b>{video.factor.toFixed(1)}x</b>
                </a>
                <strong title={video.title}>{video.title}</strong>
                <small>{video.channelTitle} · {formatNumber(video.views)} Aufrufe · {video.market.toUpperCase()}</small>
                <button className="ghost-button" type="button" disabled={busyId === video.videoId} onClick={() => mark(video)}><BookmarkSimple size={13} /> Markieren</button>
              </article>
            ))}
          </div>
        )}
        {library.suggestions.length > suggestionLimit && (
          <div className="thumb-more">
            <button className="ghost-button" type="button" onClick={() => setSuggestionLimit((n) => n + SUGGESTION_PAGE)}>Weitere {Math.min(SUGGESTION_PAGE, library.suggestions.length - suggestionLimit)} zeigen</button>
          </div>
        )}
      </section>
    </div>
  );
}

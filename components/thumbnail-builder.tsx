"use client";

import {
  ArrowCounterClockwise,
  ArrowSquareOut,
  BookmarkSimple,
  CheckCircle,
  Circle,
  CircleNotch,
  ImageSquare,
  LinkSimple,
  Star,
  Trash,
  UserFocus,
  WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { formatNumber } from "@/components/display";
import type { YoutubeVideo } from "@/lib/contracts";
import type { FaceReferenceStatus } from "@/lib/face-references";
import {
  THUMBNAIL_BRIEF_MAX,
  THUMBNAIL_REFERENCES_MAX,
  THUMBNAIL_STAGES,
  currentStage,
  finishedImage,
  hasLayerImage,
  isLayerApproved,
  isLegacyVariant,
  latestLayerStage,
  laterStages,
  type ThumbnailRun,
  type ThumbnailStage,
  type ThumbnailVariant,
} from "@/lib/thumbnail-builder";
import type { ThumbnailReference } from "@/lib/thumbnail-library";

type Bridge = "checking" | "online" | "offline" | "logged-out";
type Phase = "loading" | "ready" | "error";
type Market = "all" | "en" | "de";

type BuilderState = { runs: ThumbnailRun[]; faces: FaceReferenceStatus | null; phase: Phase };
/** What one variant is doing right now; one task per variant at a time. */
type VariantTask = { action: "render" | "approve" | "choose"; stage?: ThumbnailStage };
type StepStatus = "open" | "rendering" | "rendered" | "approved" | "failed";
type LibraryState = { references: ThumbnailReference[]; suggestions: YoutubeVideo[]; minFactor: number; phase: Phase };

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json().catch(() => ({}))) as T & { error?: string };
}

/** Human label of a face photo: gesicht-06m56s-erklaerend → erklärend (06:56), shooting-lachen-frontal → lachen frontal. */
function faceLabel(id: string) {
  const umlauts = (text: string) => text.replace(/ae/g, "ä").replace(/oe/g, "ö").replace(/ue/g, "ü");
  const match = /(\d{2})m(\d{2})s-([a-z]+)/.exec(id);
  if (!match) return umlauts(id.replace(/^(shooting|gesicht|foto)-/, "").replace(/-/g, " "));
  return `${umlauts(match[3])} (${match[1]}:${match[2]})`;
}

/** Badge on a reference thumbnail: the factor, or "Chris" for a link pick. */
function factorBadge(reference: { factor: number; source?: "outlier" | "manual" }) {
  return reference.source === "manual" ? "Chris" : `${reference.factor.toFixed(1)}x`;
}

const SUGGESTION_PAGE = 12;

const STAGE_LABELS: Record<ThumbnailStage, string> = { background: "Hintergrund", person: "Person", text: "Text" };
const STATUS_LABELS: Record<StepStatus, string> = { open: "offen", rendering: "rendert", rendered: "gerendert", approved: "freigegeben", failed: "Fehler" };

function stepStatus(variant: ThumbnailVariant, stage: ThumbnailStage, task: VariantTask | undefined): StepStatus {
  if (task?.action === "render" && task.stage === stage) return "rendering";
  const layer = variant.layers?.[stage];
  if (isLayerApproved(layer)) return "approved";
  if (hasLayerImage(layer)) return "rendered";
  return layer?.error ? "failed" : "open";
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "rendering") return <CircleNotch className="spin" size={13} />;
  if (status === "approved") return <CheckCircle size={13} weight="fill" />;
  if (status === "rendered") return <CheckCircle size={13} />;
  if (status === "failed") return <WarningCircle size={13} weight="fill" />;
  return <Circle size={13} />;
}

function variantKey(run: ThumbnailRun, variant: ThumbnailVariant) {
  return `${run.id}/${variant.id}`;
}

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
  const [tasks, setTasks] = useState<Record<string, VariantTask>>({});
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({});
  /** The step Chris clicked per variant; without one the card shows the newest layer. */
  const [views, setViews] = useState<Record<string, ThumbnailStage>>({});
  const [error, setError] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");
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

  function setTask(key: string, task: VariantTask | null) {
    setTasks((current) => {
      const next = { ...current };
      if (task) next[key] = task;
      else delete next[key];
      return next;
    });
  }

  function setVariantError(key: string, message: string) {
    setVariantErrors((current) => ({ ...current, [key]: message }));
  }

  function showStage(key: string, stage: ThumbnailStage | null) {
    setViews((current) => {
      const next = { ...current };
      if (stage) next[key] = stage;
      else delete next[key];
      return next;
    });
  }

  function applyRun(run: ThumbnailRun) {
    setBuilder((current) => ({ ...current, runs: current.runs.map((candidate) => (candidate.id === run.id ? run : candidate)) }));
  }

  async function postRun(url: string, body: Record<string, string>) {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await readJson<{ run: ThumbnailRun }>(response);
    if (!response.ok || !payload.run) throw new Error(payload.error || `Der Server antwortete mit HTTP ${response.status}.`);
    return payload.run;
  }

  async function renderStage(run: ThumbnailRun, variant: ThumbnailVariant, stage: ThumbnailStage) {
    const key = variantKey(run, variant);
    setTask(key, { action: "render", stage });
    setVariantError(key, "");
    showStage(key, null);
    try {
      applyRun(await postRun("/api/youtube/thumbnails/render", { runId: run.id, variantId: variant.id, stage }));
    } catch (reason) {
      setVariantError(key, reason instanceof Error ? reason.message : "Das Rendern ist fehlgeschlagen.");
      // A first render stores its error on the layer; reload so the step shows it.
      void loadBuilder();
    } finally {
      setTask(key, null);
    }
  }

  /** Approves a layer and immediately renders the next one. */
  async function approve(run: ThumbnailRun, variant: ThumbnailVariant, stage: ThumbnailStage) {
    const key = variantKey(run, variant);
    setTask(key, { action: "approve", stage });
    setVariantError(key, "");
    let approved: ThumbnailRun;
    try {
      approved = await postRun("/api/youtube/thumbnails/approve", { runId: run.id, variantId: variant.id, stage });
      applyRun(approved);
    } catch (reason) {
      setVariantError(key, reason instanceof Error ? reason.message : "Freigeben ist fehlgeschlagen.");
      setTask(key, null);
      return;
    }
    const next = laterStages(stage)[0];
    const fresh = approved.variants.find((candidate) => candidate.id === variant.id) ?? variant;
    if (next) await renderStage(approved, fresh, next);
    else setTask(key, null);
  }

  async function choose(run: ThumbnailRun, variant: ThumbnailVariant) {
    const key = variantKey(run, variant);
    setTask(key, { action: "choose" });
    setVariantError(key, "");
    try {
      applyRun(await postRun("/api/youtube/thumbnails/choose", { runId: run.id, variantId: variant.id }));
    } catch (reason) {
      setVariantError(key, reason instanceof Error ? reason.message : "Wählen ist fehlgeschlagen.");
    } finally {
      setTask(key, null);
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

  async function addLink() {
    setBusyId("link");
    setLibraryError("");
    try {
      const response = await fetch("/api/youtube/thumbnails/library", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manual: true, url: linkUrl.trim(), note: linkNote.trim() }),
      });
      const payload = await readJson<{ reference: ThumbnailReference }>(response);
      if (!response.ok || !payload.reference) throw new Error(payload.error || `HTTP ${response.status}`);
      if (picked && picked.length < THUMBNAIL_REFERENCES_MAX) setPicked([...picked, payload.reference.videoId]);
      setLinkUrl("");
      setLinkNote("");
      await loadLibrary(market);
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : "Der Link konnte nicht hinzugefügt werden.");
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
            <p>Drei Varianten für ein eigenes Video. GPT bekommt markierte Outlier-Thumbnails als Bildvorlage und Chris&apos; echte Standbilder als Gesicht. Jede Variante entsteht in drei Ebenen: Hintergrund, Person, Text. Du gibst jede Ebene frei, erst dann rendert die nächste.</p>
          </div>
          <div className="next-refresh"><span>Prompt als JSON</span><strong>Ein Lauf plant drei Varianten und rendert zuerst nur die drei Hintergründe, das dauert zwei bis vier Minuten. Person und Text folgen pro Variante nach deiner Freigabe.</strong></div>
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
                      <b>{factorBadge(reference)}</b>
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
            <ImageSquare size={15} /> {running ? "Plane und rendere drei Hintergründe…" : "Planen und 3 Hintergründe rendern"}
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
      {builder.phase === "loading" && <div className="empty-state">Lade Läufe…</div>}
      {builder.phase === "error" && <div className="empty-state">Läufe konnten nicht geladen werden.</div>}
      {builder.phase === "ready" && !shown && <div className="empty-state">Noch keine Thumbnails. Titel eintragen, Vorlagen wählen, Hintergründe rendern.</div>}
      {shown && (
        <div className="thumb-variant-grid">
          {shown.variants.map((variant, index) => {
            const key = variantKey(shown, variant);
            const task = tasks[key];
            const legacy = isLegacyVariant(variant);
            const chosen = shown.chosenVariantId === variant.id;
            const current = currentStage(variant);
            const viewed = views[key] ?? latestLayerStage(variant);
            const viewedLayer = viewed ? variant.layers?.[viewed] : undefined;
            const imageUrl = legacy ? variant.imageUrl : hasLayerImage(viewedLayer) ? viewedLayer.imageUrl : undefined;
            // A clicked, already approved earlier step can be rendered again; that drops the layers after it.
            const clicked = views[key];
            const focus = clicked && clicked !== current && isLayerApproved(variant.layers?.[clicked]) ? clicked : current;
            const focusLayer = variant.layers?.[focus];
            const dropped = laterStages(focus).filter((stage) => variant.layers?.[stage]);
            const problem = variantErrors[key] || (task ? "" : focusLayer?.error ?? "");
            const placeholder = task?.action === "render" && task.stage
              ? `Rendere ${STAGE_LABELS[task.stage]}…`
              : (legacy ? variant.error : variant.layers?.background?.error) ?? "Noch nicht gerendert";
            const locked = Boolean(task) || bridgeDown;
            return (
              <article className={chosen ? "thumb-variant chosen" : "thumb-variant"} key={variant.id}>
                <div className="thumb-art">
                  {imageUrl ? <img src={imageUrl} alt={`Variante ${index + 1}: ${variant.textOverlay}`} /> : <span className="thumb-art-empty">{placeholder}</span>}
                  {imageUrl && task?.action === "render" && task.stage && <em className="thumb-art-busy"><CircleNotch className="spin" size={12} /> Rendere {STAGE_LABELS[task.stage]}…</em>}
                  {chosen && <strong className="thumb-chosen"><Star size={12} weight="fill" /> Gewählt</strong>}
                </div>
                <div className="thumb-variant-body">
                  <div className="cover-package-heading"><span className="rank">{String(index + 1).padStart(2, "0")}</span><h4>{variant.label}</h4></div>
                  {legacy ? (
                    <p className="thumb-legacy">Älterer Lauf: fertiges Bild in einem Durchgang, ohne Ebenen.</p>
                  ) : (
                    <ol className="thumb-steps" aria-label="Ebenen">
                      {THUMBNAIL_STAGES.map((stage) => {
                        const status = stepStatus(variant, stage, task);
                        return (
                          <li key={stage}>
                            <button
                              type="button"
                              className={`thumb-step ${status}${viewed === stage ? " viewing" : ""}`}
                              disabled={!hasLayerImage(variant.layers?.[stage])}
                              aria-pressed={viewed === stage}
                              onClick={() => showStage(key, stage)}
                            >
                              <StepIcon status={status} />
                              <span>{STAGE_LABELS[stage]}</span>
                              <small>{STATUS_LABELS[status]}</small>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {problem && <p className="yt-bad thumb-variant-error"><WarningCircle size={13} /> {problem}</p>}
                  {finishedImage(variant) && (
                    chosen ? (
                      <p className="thumb-chosen-note"><Star size={13} weight="fill" /> Diese Variante ist gewählt.</p>
                    ) : (
                      <button className="primary-button thumb-choose" type="button" onClick={() => choose(shown, variant)} disabled={Boolean(task)}>
                        <Star size={14} /> {task?.action === "choose" ? "Wähle…" : "Diese Variante wählen"}
                      </button>
                    )
                  )}
                  {!legacy && (
                    <div className="thumb-actions">
                      {focus === current && hasLayerImage(focusLayer) && !isLayerApproved(focusLayer) && (
                        <button className="primary-button" type="button" onClick={() => approve(shown, variant, focus)} disabled={Boolean(task) || (bridgeDown && focus !== "text")}>
                          <CheckCircle size={14} /> {task?.action === "approve" ? "Gebe frei…" : "Freigeben"}
                        </button>
                      )}
                      <button className="secondary-button" type="button" onClick={() => renderStage(shown, variant, focus)} disabled={locked}>
                        <ArrowCounterClockwise className={task?.action === "render" && task.stage === focus ? "spin" : ""} size={14} />
                        {task?.action === "render" && task.stage === focus ? "Rendere…" : hasLayerImage(focusLayer) || focusLayer?.error ? `${STAGE_LABELS[focus]} neu rendern` : `${STAGE_LABELS[focus]} rendern`}
                      </button>
                      {dropped.length > 0 && <small className="thumb-actions-note">Verwirft {dropped.map((stage) => STAGE_LABELS[stage]).join(" und ")}.</small>}
                    </div>
                  )}
                  <p className="cover-overlay">„{variant.textOverlay}“</p>
                  <p className="thumb-concept">{variant.concept}</p>
                  <p className="thumb-face"><UserFocus size={12} /> Gesicht: {faceLabel(variant.face)}</p>
                  <p className="kicker">Angeregt durch</p>
                  <ul className="thumb-sources">
                    {variant.inspiredBy.map((source) => (
                      <li key={source.videoId}>
                        <a href={source.url} target="_blank" rel="noreferrer" className="thumb-source-img">
                          <img src={source.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                          <b>{factorBadge(source)}</b>
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
            <p>Gute Thumbnails als Vorlage: Outlier aus Signal Room oder per Link von dir gewählt. Markierte gehen als Bild in den Builder, entfernte nicht mehr. Jeder Eintrag hält die Zahlen zum Zeitpunkt der Markierung.</p>
          </div>
        </div>
        <form className="thumb-link-form" onSubmit={(event) => { event.preventDefault(); void addLink(); }}>
          <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="YouTube-Link eines Thumbnails, das dir gefällt" aria-label="YouTube-Link" />
          <input value={linkNote} maxLength={300} onChange={(event) => setLinkNote(event.target.value)} placeholder="Ein Satz: Was gefällt dir daran?" aria-label="Was gefällt dir daran?" />
          <button className="secondary-button" type="submit" disabled={!linkUrl.trim() || busyId === "link"}><LinkSimple size={13} /> {busyId === "link" ? "Hole Video…" : "Hinzufügen"}</button>
        </form>
        {libraryError && <p className="yt-bad thumb-library-error"><WarningCircle size={13} /> {libraryError}</p>}
        {library.references.length > 0 && (
          <div className="thumb-library-grid">
            {library.references.map((reference) => (
              <article className="thumb-ref" key={reference.videoId}>
                <a href={reference.url} target="_blank" rel="noreferrer" className="thumb-ref-img">
                  <img src={reference.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  <b>{factorBadge(reference)}</b>
                </a>
                <strong title={reference.title}>{reference.title}</strong>
                <small>{reference.channelTitle} · {formatNumber(reference.views)} Aufrufe · {reference.market.toUpperCase()}</small>
                {reference.note && <small className="thumb-ref-note">„{reference.note}“</small>}
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

"use client";

import { ArrowClockwise, ArrowSquareOut, CheckCircle, Clock, Lightbulb, MagnifyingGlass, Plus, Prohibit, WarningCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatNumber, timeAgo } from "@/components/display";
import { creatorPath } from "@/lib/creator-detail";
import type { CandidateDecision, CreatorCandidate, Run, YoutubeSearchTerm, YoutubeTopic, YoutubeVideo } from "@/lib/contracts";
import type { IdeaInput } from "@/lib/ideas";

type SearchMeta = {
  configured: boolean;
  terms: YoutubeSearchTerm[];
  topics: { id: YoutubeTopic; label: string }[];
  dailyQuota: number;
  dailySearchCalls: number;
  running: boolean;
  lastRun: Run | null;
};

type SearchAnswer = {
  status: Run["status"];
  videosFound: number;
  channelsMeasured: number;
  outliers: number;
  candidates: number;
  missingTopics: YoutubeTopic[];
  quota: NonNullable<Run["youtubeQuota"]>;
  errors: string[];
};

type Phase = "loading" | "ready" | "error";
type CandidateView = "open" | "deferred" | "rejected" | "accepted";

const VIEWS: { id: CandidateView; label: string; decisions: CandidateDecision[] }[] = [
  { id: "open", label: "Offen", decisions: ["proposed", "selected"] },
  { id: "deferred", label: "Zurückgestellt", decisions: ["deferred"] },
  { id: "rejected", label: "Verworfen", decisions: ["rejected"] },
  { id: "accepted", label: "In der Watchlist", decisions: ["accepted"] },
];

/** Rows and cards revealed per click, so the radar never pushes the watchlist feed off the page. */
const PAGE = 12;

/** P4-09: the watchlist aims for 20 to 30 YouTube channels; a bigger list is never trimmed. */
const WATCHLIST_TARGET = "20 bis 30";

/** Two separate pots: units for everything but search, and the daily search calls. */
function quotaLine(run: Pick<Run, "youtubeQuota"> | null | undefined, daily: number, dailySearch: number) {
  const quota = run?.youtubeQuota;
  if (!quota) return "Quota: noch kein Lauf";
  const share = ((quota.units / daily) * 100).toFixed(1).replace(".", ",");
  return `Quota: ${quota.units.toLocaleString("de-DE")} Einheiten (${share} % von ${daily.toLocaleString("de-DE")}), ${quota.calls.search} von ${dailySearch} Suchaufrufen am Tag`;
}

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json().catch(() => ({}))) as T & { error?: string };
}

/**
 * The Outlier-Radar in Discover (YouTube): Suchbegriffe, the Suchlauf with its
 * quota, the Outlier it found and the Kanal-Kandidaten Chris takes into the
 * watchlist with one click. Every number comes with its reason and evidence.
 */
export function YoutubeRadar({
  threshold,
  trackedYoutube,
  onWatchlistChanged,
  onCreateIdea,
}: {
  threshold: number;
  trackedYoutube: number;
  onWatchlistChanged: () => void;
  onCreateIdea: (input: IdeaInput) => void;
}) {
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [metaPhase, setMetaPhase] = useState<Phase>("loading");
  const [candidates, setCandidates] = useState<CreatorCandidate[]>([]);
  const [candidatePhase, setCandidatePhase] = useState<Phase>("loading");
  const [outliers, setOutliers] = useState<YoutubeVideo[]>([]);
  const [outlierPhase, setOutlierPhase] = useState<Phase>("loading");
  const [search, setSearch] = useState<{ running: boolean; answer: SearchAnswer | null; error: string }>({ running: false, answer: null, error: "" });
  const [pending, setPending] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [view, setView] = useState<CandidateView>("open");
  const [termError, setTermError] = useState("");
  const [candidateLimit, setCandidateLimit] = useState(PAGE);
  const [outlierLimit, setOutlierLimit] = useState(PAGE);

  async function loadMeta() {
    try {
      const response = await fetch("/api/youtube/search", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMeta(await response.json());
      setMetaPhase("ready");
    } catch {
      setMetaPhase("error");
    }
  }

  async function loadCandidates() {
    try {
      const response = await fetch("/api/candidates?network=youtube&limit=200", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCandidates((await response.json()).candidates);
      setCandidatePhase("ready");
    } catch {
      setCandidatePhase("error");
    }
  }

  async function loadOutliers() {
    try {
      const response = await fetch(`/api/youtube/outliers?minFactor=${threshold}&days=90&limit=48`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setOutliers((await response.json()).outliers);
      setOutlierPhase("ready");
    } catch {
      setOutlierPhase("error");
    }
  }

  useEffect(() => {
    loadMeta();
    loadCandidates();
  }, []);

  useEffect(() => {
    loadOutliers();
  }, [threshold]);

  async function runSearch() {
    if (search.running) return;
    setSearch({ running: true, answer: null, error: "" });
    try {
      const response = await fetch("/api/youtube/search", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const payload = await readJson<SearchAnswer>(response);
      if (!response.ok && !payload.quota) throw new Error(payload.error || `Der Suchlauf antwortete mit HTTP ${response.status}.`);
      setSearch({ running: false, answer: payload, error: response.ok ? "" : payload.errors?.join(" · ") || "Der Suchlauf ist fehlgeschlagen." });
    } catch (error) {
      setSearch({ running: false, answer: null, error: error instanceof Error ? error.message : "Der Suchlauf ist fehlgeschlagen." });
    }
    await Promise.all([loadMeta(), loadCandidates(), loadOutliers()]);
  }

  async function addTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setTermError("");
    const response = await fetch("/api/youtube/terms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ term: form.get("term"), market: form.get("market"), topic: form.get("topic") }),
    });
    const payload = await readJson<{ terms: YoutubeSearchTerm[] }>(response);
    if (!response.ok) return setTermError(payload.error || `HTTP ${response.status}`);
    setMeta((current) => (current ? { ...current, terms: payload.terms } : current));
    formElement.reset();
  }

  async function removeTerm(id: string) {
    setTermError("");
    const response = await fetch("/api/youtube/terms", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    const payload = await readJson<{ terms: YoutubeSearchTerm[] }>(response);
    if (!response.ok) return setTermError(payload.error || `HTTP ${response.status}`);
    setMeta((current) => (current ? { ...current, terms: payload.terms } : current));
  }

  function placeCandidate(candidate: CreatorCandidate | null | undefined) {
    if (!candidate) return;
    setCandidates((current) => current.map((item) => (item.key === candidate.key ? candidate : item)));
  }

  async function accept(candidate: CreatorCandidate) {
    if (pending) return;
    setPending(candidate.key);
    setRowErrors((current) => ({ ...current, [candidate.key]: "" }));
    try {
      const response = await fetch("/api/candidates/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: candidate.key }) });
      const payload = await readJson<{ candidate?: CreatorCandidate | null }>(response);
      placeCandidate(payload.candidate);
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      onWatchlistChanged();
    } catch (error) {
      setRowErrors((current) => ({ ...current, [candidate.key]: error instanceof Error ? error.message : "Aufnahme fehlgeschlagen." }));
    } finally {
      setPending(null);
    }
  }

  async function decide(candidate: CreatorCandidate, decision: "proposed" | "rejected" | "deferred") {
    if (pending) return;
    setPending(candidate.key);
    setRowErrors((current) => ({ ...current, [candidate.key]: "" }));
    try {
      const response = await fetch("/api/candidates", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: candidate.key, decision }) });
      const payload = await readJson<{ candidate?: CreatorCandidate }>(response);
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      placeCandidate(payload.candidate);
    } catch (error) {
      setRowErrors((current) => ({ ...current, [candidate.key]: error instanceof Error ? error.message : "Entscheidung nicht gespeichert." }));
    } finally {
      setPending(null);
    }
  }

  const nowMs = Date.now();
  const activeView = VIEWS.find((item) => item.id === view) ?? VIEWS[0];
  const shown = candidates.filter((candidate) => activeView.decisions.includes(candidate.decision));
  const counts = Object.fromEntries(VIEWS.map((item) => [item.id, candidates.filter((c) => item.decisions.includes(c.decision)).length])) as Record<CandidateView, number>;
  const topics = meta?.topics ?? [];
  const lastRun = meta?.lastRun ?? null;

  return (
    <section className="yt-radar" aria-label="Outlier-Radar">
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="kicker">Outlier-Radar / YouTube Data API</p>
            <h2>Suchlauf wie vidIQ</h2>
            <p>
              Suchbegriff, dann Videos, dann der Median der letzten 30 Longform-Videos jedes gefundenen Kanals. Ein Outlier liegt ab {threshold}x über diesem Median. Shorts zählen nicht.
            </p>
          </div>
          <button className="primary-button" type="button" onClick={runSearch} disabled={search.running || !meta?.configured}>
            {search.running ? <ArrowClockwise className="spin" size={15} /> : <MagnifyingGlass size={15} />}
            {search.running ? "Suche läuft, etwa eine Minute" : "Suchlauf starten"}
          </button>
        </div>

        <div className="yt-status">
          {metaPhase === "loading" && <span>Lade Suchbegriffe…</span>}
          {metaPhase === "error" && <span className="yt-bad"><WarningCircle size={14} /> Suchbegriffe konnten nicht geladen werden.</span>}
          {meta && !meta.configured && <span className="yt-bad"><WarningCircle size={14} /> YOUTUBE_API_KEY fehlt in .env.local. Ohne Schlüssel kein Suchlauf.</span>}
          {meta && lastRun && (
            <span>
              Letzter Suchlauf {timeAgo(lastRun.startedAt, nowMs)} · {lastRun.status} · {lastRun.creatorsChecked} Kanäle gemessen · {quotaLine(lastRun, meta.dailyQuota, meta.dailySearchCalls)}
            </span>
          )}
          {meta && !lastRun && meta.configured && <span>Noch kein Suchlauf. Mit den zehn Start-Begriffen kostet er rund 300 von {formatNumber(meta.dailyQuota)} Einheiten und 10 von {meta.dailySearchCalls} Suchaufrufen am Tag.</span>}
        </div>

        {search.answer && (
          <div className="yt-status yt-result" role="status">
            <CheckCircle size={14} weight="fill" />
            <span>
              {search.answer.videosFound} Longform-Videos, {search.answer.channelsMeasured} Kanäle gemessen, {search.answer.outliers} Outlier ab 3x, {search.answer.candidates} Kanäle als Kandidaten. {quotaLine({ youtubeQuota: search.answer.quota }, meta?.dailyQuota ?? 10_000, meta?.dailySearchCalls ?? 100)}.
              {search.answer.missingTopics.length > 0 && ` Ohne Begriff: ${search.answer.missingTopics.map((id) => topics.find((t) => t.id === id)?.label ?? id).join(", ")}.`}
            </span>
          </div>
        )}
        {search.error && <div className="yt-status yt-bad" role="alert"><WarningCircle size={14} /><span>{search.error}</span></div>}

        <div className="yt-terms">
          {topics.map((topic) => {
            const terms = meta?.terms.filter((term) => term.topic === topic.id) ?? [];
            return (
              <div key={topic.id} className="yt-topic">
                <span className="yt-topic-label">{topic.label}</span>
                <div className="yt-chips">
                  {terms.map((term) => (
                    <span key={term.id} className="yt-chip">
                      {term.term} <small>{term.market.toUpperCase()}</small>
                      <button type="button" aria-label={`${term.term} entfernen`} onClick={() => removeTerm(term.id)}><X size={11} /></button>
                    </span>
                  ))}
                  {terms.length === 0 && <span className="yt-chip empty">kein Begriff</span>}
                </div>
              </div>
            );
          })}
          <form className="yt-term-form" onSubmit={addTerm}>
            <input name="term" placeholder="Neuer Suchbegriff" maxLength={80} required aria-label="Neuer Suchbegriff" />
            <select name="market" defaultValue="en" aria-label="Markt"><option value="en">EN</option><option value="de">DE</option></select>
            <select name="topic" defaultValue="claude" aria-label="Thema">{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}</select>
            <button className="ghost-button" type="submit"><Plus size={13} /> Begriff</button>
          </form>
          {termError && <p className="yt-bad" role="alert">{termError}</p>}
        </div>
      </div>

      <div className="section-head">
        <div><p className="kicker">Kanal-Kandidaten</p><h2>Kanäle mit starken Outliern</h2></div>
        <p className="note">Ziel {WATCHLIST_TARGET} YouTube-Kanäle in der Watchlist, aktuell {trackedYoutube}. Aufnehmen startet den Backfill, Verwerfen und Zurückstellen ändern die Watchlist nicht.</p>
      </div>
      <div className="pill-group yt-views" role="tablist" aria-label="Kandidaten-Status">
        {VIEWS.map((item) => (
          <button key={item.id} type="button" className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setCandidateLimit(PAGE); }}>{item.label} {counts[item.id]}</button>
        ))}
      </div>
      <table className="desk-table yt-candidates">
        <thead><tr><th>Kanal</th><th>Beleg</th><th className="hide-sm">Outlier</th><th className="right">Aktion</th></tr></thead>
        <tbody>
          {candidatePhase === "loading" && <tr><td colSpan={4}><div className="empty-state">Lade Kandidaten…</div></td></tr>}
          {candidatePhase === "error" && <tr><td colSpan={4}><div className="empty-state">Kandidaten konnten nicht geladen werden.</div></td></tr>}
          {candidatePhase === "ready" && shown.length === 0 && (
            <tr><td colSpan={4}><div className="empty-state">{view === "open" ? "Keine offenen Kandidaten. Ein Suchlauf schlägt Kanäle mit Outliern vor." : "Hier liegt nichts."}</div></td></tr>
          )}
          {shown.slice(0, candidateLimit).map((candidate) => {
            const busy = pending === candidate.key;
            const error = rowErrors[candidate.key] || candidate.acceptError;
            return (
              <tr key={candidate.key}>
                <td>
                  <div className="creator-cell">
                    <span className="creator-avatar">{candidate.avatarUrl ? <img src={candidate.avatarUrl} alt="" referrerPolicy="no-referrer" /> : candidate.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      {candidate.url ? <a className="creator-link strong" href={candidate.url} target="_blank" rel="noreferrer">{candidate.name}</a> : <strong>{candidate.name}</strong>}
                      <small>{candidate.handle} · {candidate.audience ? `${formatNumber(candidate.audience)} Abos` : "Abos verborgen"} · {candidate.market.toUpperCase()}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong className="lime">{candidate.bestFactor.toFixed(1)}x</strong> <span className="muted">{candidate.reason}</span>
                  {error && <p className="yt-bad"><WarningCircle size={12} /> {error}</p>}
                </td>
                <td className="hide-sm">
                  <div className="yt-evidence">
                    {candidate.evidence.slice(0, 3).map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" title={`${item.factor.toFixed(1)}x · ${formatNumber(item.views)} Aufrufe · ${item.title}`}>
                        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} loading="lazy" referrerPolicy="no-referrer" /> : <span />}
                        <b>{item.factor.toFixed(1)}x</b>
                      </a>
                    ))}
                  </div>
                </td>
                <td className="right">
                  <div className="controls">
                    {candidate.decision === "accepted" ? (
                      candidate.creatorId ? <Link className="ghost-button" href={creatorPath(candidate.creatorId, { from: "discover", threshold })}><CheckCircle size={13} weight="fill" /> In der Watchlist</Link> : <span className="status-chip"><CheckCircle size={13} weight="fill" /> In der Watchlist</span>
                    ) : (
                      <>
                        <button className="primary-button" type="button" disabled={Boolean(pending)} onClick={() => accept(candidate)}>
                          {busy ? <ArrowClockwise className="spin" size={13} /> : <Plus size={13} weight="bold" />} {busy ? "Backfill läuft" : candidate.acceptError ? "Erneut aufnehmen" : "In Watchlist"}
                        </button>
                        {candidate.decision !== "deferred" && (
                          <button className="icon-button" type="button" disabled={Boolean(pending)} title="Zurückstellen" aria-label="Zurückstellen" onClick={() => decide(candidate, "deferred")}><Clock size={14} /></button>
                        )}
                        {candidate.decision !== "rejected" ? (
                          <button className="icon-button" type="button" disabled={Boolean(pending)} title="Verwerfen" aria-label="Verwerfen" onClick={() => decide(candidate, "rejected")}><Prohibit size={14} /></button>
                        ) : (
                          <button className="ghost-button" type="button" disabled={Boolean(pending)} onClick={() => decide(candidate, "proposed")}>Wieder vorschlagen</button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {shown.length > candidateLimit && (
        <div className="feed-pagination">
          <button className="ghost-button" type="button" onClick={() => setCandidateLimit((n) => n + PAGE)}>Weitere {Math.min(PAGE, shown.length - candidateLimit)} von {shown.length - candidateLimit} Kandidaten zeigen</button>
        </div>
      )}

      <div className="section-head">
        <div><p className="kicker">Outlier aus Suche und Watchlist</p><h2>Videos ab {threshold}x Kanal-Median, letzte 90 Tage</h2></div>
        <p className="note">Aufrufe geteilt durch den Median der letzten 30 Longform-Videos des Kanals. Stand der Zahlen: Zeitpunkt der Messung.</p>
      </div>
      {outlierPhase === "loading" && <div className="empty-state">Lade Outlier…</div>}
      {outlierPhase === "error" && <div className="empty-state">Outlier konnten nicht geladen werden.</div>}
      {outlierPhase === "ready" && outliers.length === 0 && <div className="empty-state">Noch keine Outlier ab {threshold}x. Starte einen Suchlauf oder senke die Schwelle.</div>}
      {outliers.length > 0 && (
        <div className="signal-grid cols-4">
          {outliers.slice(0, outlierLimit).map((video) => (
            <article className="signal-card" key={video.id}>
              <div className="signal-media">
                {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
                <div className="badge-row"><span><span className="badge outlier">{video.factor.toFixed(1)}x</span></span><span className="badge format">{video.market.toUpperCase()}</span></div>
              </div>
              <div className="signal-content">
                <div className="signal-meta">
                  <span>{video.channelHandle ?? video.channelTitle}</span>
                  <span>{timeAgo(video.publishedAt, nowMs)}</span>
                  <span>{video.source === "search" ? "Suche" : "Watchlist"}</span>
                </div>
                <h2>{video.title}</h2>
                <p>
                  {video.factor.toFixed(1)}x Kanal-Median ({formatNumber(video.channelMedian)} über {video.baselineCount} Longform)
                  {video.queries.length > 0 && ` · gefunden über „${video.queries[0]}“`}
                </p>
                <div className="signal-stats">
                  <span><strong>{formatNumber(video.views)}</strong> Aufrufe</span>
                  <span title="Aufrufe pro Abonnent"><strong>{video.viewsPerSubscriber ? video.viewsPerSubscriber.toFixed(2) : "–"}</strong> pro Abo</span>
                  <span><strong>{formatNumber(video.viewsPerDay)}</strong> pro Tag</span>
                </div>
                <div className="signal-actions">
                  <span className="signal-buttons">
                    <button className="ghost-button" type="button" onClick={() => onCreateIdea({ title: video.title, sourceCreator: video.channelHandle ?? video.channelTitle, sourceUrl: video.url })}>
                      <Lightbulb size={13} /> Create idea
                    </button>
                  </span>
                  <a className="signal-link" href={video.url} target="_blank" rel="noreferrer">Auf YouTube <ArrowSquareOut size={11} /></a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {outliers.length > outlierLimit && (
        <div className="feed-pagination">
          <button className="ghost-button" type="button" onClick={() => setOutlierLimit((n) => n + PAGE)}>Weitere {Math.min(PAGE, outliers.length - outlierLimit)} von {outliers.length - outlierLimit} Outliern zeigen</button>
        </div>
      )}
    </section>
  );
}

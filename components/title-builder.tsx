"use client";

import { ArrowRight, ArrowSquareOut, ArrowsClockwise, CheckCircle, Copy, FileText, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { formatNumber } from "@/components/display";
import {
  TITLE_COUNTS,
  TITLE_DEFAULT_COUNT,
  TITLE_IDEAS_MAX,
  TITLE_SOURCE_MAX,
  TITLE_VISIBLE_MAX,
  TITLE_WORKING_MAX,
  type TitlePacketSummary,
  type TitlePatternStat,
  type TitleRun,
  type TitleVariant,
} from "@/lib/title-builder";

type BridgeHealth = "checking" | "online" | "offline" | "logged-out";

const bridgeCopy: Record<BridgeHealth, { label: string; hint: string; tone: "muted" | "ok" | "bad" }> = {
  checking: { label: "Prüfe den Bridge", hint: "Einen Moment.", tone: "muted" },
  online: { label: "Bridge erreichbar, Codex eingeloggt", hint: "Bereit.", tone: "ok" },
  offline: { label: "Bridge nicht erreichbar", hint: "Starte npm run bridge in einem zweiten Terminal.", tone: "bad" },
  "logged-out": { label: "Codex nicht eingeloggt", hint: "Führe codex login im Terminal aus und prüfe dann erneut.", tone: "bad" },
};

type State = {
  phase: "loading" | "ready" | "error";
  runs: TitleRun[];
  packet: TitlePacketSummary | null;
  patterns: TitlePatternStat[];
  selected: string | null;
  running: boolean;
  error: string;
};

function factor(value: number) {
  return `${value.toFixed(1).replace(".", ",")}x`;
}

function stamp(iso: string) {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * The Titel-Builder tab (YouTube Submodul 2): German title variants for one
 * video, read from the patterns of the stored YouTube Outlier and checked
 * against the Outlier of the last weeks. Every variant names the Outlier that
 * led to it; the check says in words why it is backed or open.
 */
export function TitleBuilder({ bridge, onRecheckBridge }: { bridge: BridgeHealth; onRecheckBridge: () => void }) {
  const [state, setState] = useState<State>({ phase: "loading", runs: [], packet: null, patterns: [], selected: null, running: false, error: "" });
  const [workingTitle, setWorkingTitle] = useState("");
  const [source, setSource] = useState("");
  const [ideas, setIdeas] = useState("");
  const [direction, setDirection] = useState("");
  const [count, setCount] = useState<number>(TITLE_DEFAULT_COUNT);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/youtube/titles", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { runs: TitleRun[]; packet: TitlePacketSummary; patterns: TitlePatternStat[] };
      setState((current) => ({ ...current, phase: "ready", runs: payload.runs, packet: payload.packet, patterns: payload.patterns }));
    } catch {
      setState((current) => ({ ...current, phase: "error" }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function generate() {
    if (state.running) return;
    setState((current) => ({ ...current, running: true, error: "" }));
    try {
      const response = await fetch("/api/youtube/titles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workingTitle, source, ideas, direction, count }),
      });
      const payload = (await response.json().catch(() => ({}))) as { run?: TitleRun; error?: string };
      if (!response.ok || !payload.run) throw new Error(payload.error || `Der Titel-Lauf antwortete mit HTTP ${response.status}.`);
      const run = payload.run;
      setState((current) => ({ ...current, running: false, runs: [run, ...current.runs], selected: run.id }));
    } catch (error) {
      setState((current) => ({ ...current, running: false, error: error instanceof Error ? error.message : "Der Titel-Lauf ist fehlgeschlagen." }));
    }
  }

  async function copy(variant: TitleVariant) {
    try {
      await navigator.clipboard.writeText(variant.title);
      setCopied(variant.title);
    } catch {
      setCopied(null);
    }
  }

  const status = bridgeCopy[bridge];
  const sourceLength = source.trim().length;
  const ideaCount = ideas.split(/\r?\n/).filter((line) => line.trim()).length;
  const packet = state.packet;
  const weeks = packet ? Math.round(packet.checkWindowDays / 7) : 6;
  const blocked = state.running || bridge === "offline" || bridge === "logged-out" || !workingTitle.trim() || packet?.outliers === 0;
  const shown = state.runs.find((run) => run.id === state.selected) ?? state.runs[0] ?? null;

  return (
    <div className="view-stack tb">
      <section className="hero">
        <div>
          <p className="hero-kicker">Titel-Builder / YouTube-Outlier</p>
          <h1>Titel</h1>
          <p className="hero-sub">
            Titel-Varianten für den A/B-Test auf YouTube. Englische Outlier liefern die Muster, deutsche zeigen die Konkurrenz. Jede Variante nennt die Outlier, die sie angeregt haben, und wird gegen die Outlier der letzten {weeks} Wochen geprüft.
          </p>
        </div>
        <div className="stat-blocks">
          <div><strong>{packet?.outliers ?? "–"}</strong><span>Outlier im Paket</span></div>
          <div><strong>{packet ? `${packet.en}/${packet.de}` : "–"}</strong><span>englisch / deutsch</span></div>
          <div className="lime"><strong>{packet?.recent ?? "–"}</strong><span>Outlier der letzten {weeks} Wochen</span></div>
        </div>
      </section>

      <div className="two-col">
        <section className="panel glow">
          <div className="panel-head">
            <div>
              <p className="kicker">Video</p>
              <h2>Wofür schreiben wir Titel</h2>
              <p>Arbeitstitel und Skript beschreiben, was das Video wirklich zeigt. Titel, die das Skript nicht einlöst, sind verboten. vidIQ-Ideen gehen als Anregung mit, eine pro Zeile.</p>
            </div>
            <div className="control-cluster">
              <div>
                <span>Titel</span>
                <select value={count} onChange={(event) => setCount(Number(event.target.value))} aria-label="Anzahl Titel">
                  {TITLE_COUNTS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={`bridge-status ${status.tone}`}>
            <span className="dot" aria-hidden="true" />
            <div>
              <strong>{status.label}</strong>
              <p>{status.hint}</p>
            </div>
            <button className="ghost-button" type="button" onClick={onRecheckBridge}>
              <ArrowsClockwise size={13} /> Erneut prüfen
            </button>
          </div>

          <div className="evidence-note">
            {state.phase === "loading" && <span>Lade die YouTube-Outlier…</span>}
            {state.phase === "error" && <span className="yt-bad"><WarningCircle size={13} /> Die Outlier konnten nicht geladen werden.</span>}
            {packet && packet.outliers > 0 && (
              <>
                <strong>{packet.outliers} Outlier als Musterquelle</strong>
                <span>ab {packet.minFactor}x Kanal-Median und {formatNumber(packet.minViews)} Aufrufen, letzte {packet.windowDays} Tage. Titel aus dem Paket sind Fremdtext und gehen nur als Daten an das Modell.</span>
              </>
            )}
            {packet && packet.outliers === 0 && (
              <>
                <strong>Keine YouTube-Outlier</strong>
                <span>Starte zuerst einen Suchlauf in Discover. Ohne Outlier schreibt der Titel-Builder nichts.</span>
              </>
            )}
          </div>

          <div className="panel-body tb-form">
            <div>
              <label htmlFor="tb-working">Arbeitstitel</label>
              <input id="tb-working" type="text" maxLength={TITLE_WORKING_MAX} placeholder="Vom Fragensteller zum Chef: Die 6 Stufen, Claude zu nutzen" value={workingTitle} onChange={(event) => setWorkingTitle(event.target.value)} />
              <label htmlFor="tb-source" className="tb-second">Skript oder Zusammenfassung</label>
              <textarea id="tb-source" style={{ minHeight: 180 }} placeholder="Das Skript oder zwei Sätze, worum es geht." value={source} onChange={(event) => setSource(event.target.value)} />
              <p className={sourceLength > TITLE_SOURCE_MAX ? "count over" : "count"}>
                {formatNumber(sourceLength)} / {formatNumber(TITLE_SOURCE_MAX)} Zeichen
              </p>
            </div>
            <div>
              <label htmlFor="tb-ideas">Ideen aus vidIQ · optional</label>
              <textarea id="tb-ideas" placeholder={"Eine Idee pro Zeile, zum Beispiel\nClaude richtig nutzen: 6 Stufen"} value={ideas} onChange={(event) => setIdeas(event.target.value)} />
              <p className={ideaCount > TITLE_IDEAS_MAX ? "count over" : "count"}>{ideaCount} / {TITLE_IDEAS_MAX} Ideen</p>
              <label htmlFor="tb-direction" className="tb-second">Richtung · optional</label>
              <input id="tb-direction" type="text" placeholder="Die Zahl 6 muss vorne stehen." value={direction} onChange={(event) => setDirection(event.target.value)} />
            </div>
          </div>
          <div className="panel-foot">
            <span>Läuft über den lokalen Bridge. Kein API-Schlüssel, nichts wird veröffentlicht.</span>
            <button className="primary-button" type="button" onClick={generate} disabled={blocked}>
              {state.running ? <ArrowsClockwise className="spin" size={15} /> : null}
              {state.running ? "Schreibt Titel" : `${count} Titel schreiben`} {!state.running && <ArrowRight size={15} />}
            </button>
          </div>

          {state.running && (
            <div className="strategy-loading">
              <span /><span /><span />
              <p>Schreibt Titel gegen {packet?.outliers ?? 0} Outlier, dauert etwa eine Minute</p>
            </div>
          )}
          {state.error && (
            <div className="strategy-error" role="alert">
              <WarningCircle size={20} weight="fill" />
              <h3>Keine Titel</h3>
              <p>{state.error}</p>
            </div>
          )}

          {shown && (
            <div className="hook-board">
              <div className="hook-board-head">
                <span>{shown.variants.length} Varianten für „{shown.workingTitle}“</span>
                <span className="tb-head-actions">
                  <span className="num">{stamp(shown.createdAt)}</span>
                  <a className="ghost-button" href={`/api/youtube/titles/${shown.id}/markdown`} target="_blank" rel="noreferrer"><FileText size={12} /> Markdown</a>
                </span>
              </div>
              <p className="tb-note">YouTube testet bis zu drei Titel gleichzeitig. Geprüft gegen {shown.packet.recent} Outlier der letzten {Math.round(shown.packet.checkWindowDays / 7)} Wochen; die Zahlen sind der Stand der Messung.</p>
              {shown.variants.map((variant) => (
                <article className="tb-variant" key={variant.label}>
                  <span className="tb-label">{variant.label}</span>
                  <div className="tb-main">
                    <div className="tb-title-row">
                      <h3>{variant.title}</h3>
                      <button className="icon-button" type="button" title="Titel kopieren" aria-label={`Titel ${variant.label} kopieren`} onClick={() => copy(variant)}>
                        {copied === variant.title ? <CheckCircle size={14} weight="fill" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="tb-chips">
                      <span className={variant.check.verdict === "backed" ? "tb-chip ok" : "tb-chip open"}>{variant.check.verdict === "backed" ? "belegt" : "offen"}</span>
                      <span className={variant.check.length > TITLE_VISIBLE_MAX ? "tb-chip warn" : "tb-chip"}>{variant.check.length} Zeichen</span>
                      {variant.check.patterns.map((pattern) => (
                        <span className="tb-chip" key={pattern.id} title={`${pattern.recent} Outlier der letzten ${weeks} Wochen`}>{pattern.label} · {pattern.recent}</span>
                      ))}
                    </div>
                    {variant.rationale && <p>{variant.rationale}</p>}
                    <p className="tb-check">{variant.check.reason}</p>
                    {variant.check.issues.map((issue) => (
                      <p className="yt-bad" key={issue}><WarningCircle size={12} /> {issue}</p>
                    ))}
                    {variant.check.competitor && variant.check.issues.every((issue) => !issue.startsWith("Nah an")) && (
                      <p className="tb-check">
                        Nächster deutscher Outlier: <a href={variant.check.competitor.url} target="_blank" rel="noreferrer">{variant.check.competitor.title}</a> ({variant.check.competitor.channelTitle}, {factor(variant.check.competitor.factor)}), Wortnähe {Math.round(variant.check.competitor.overlap * 100)} %
                      </p>
                    )}
                    <p className="tb-sources-head">{variant.sourcesInferred ? "Angeregt von, nach Wortnähe zugeordnet" : "Angeregt von"}</p>
                    <ul className="tb-sources">
                      {variant.sources.map((item) => (
                        <li key={item.videoId}>
                          <a className="tb-thumb" href={item.url} target="_blank" rel="noreferrer" aria-label={item.title}>
                            {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span />}
                            <b>{factor(item.factor)}</b>
                          </a>
                          <div>
                            <a href={item.url} target="_blank" rel="noreferrer">{item.title} <ArrowSquareOut size={10} /></a>
                            <small>{item.channelHandle ?? item.channelTitle} · {factor(item.factor)} Kanal-Median · {formatNumber(item.views)} Aufrufe · {item.market.toUpperCase()}</small>
                          </div>
                        </li>
                      ))}
                      {variant.ideas.map((idea) => (
                        <li key={idea} className="tb-idea"><span className="tb-chip">vidIQ</span><div>{idea}</div></li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!shown && state.phase === "ready" && !state.running && (
            <div className="empty-state">Noch kein Lauf. Arbeitstitel eintragen, Skript einfügen, Titel schreiben.</div>
          )}
        </section>

        <aside className="tb-aside">
          <div className="history-rail">
            <div className="rail-head"><span>Muster der Outlier-Titel</span></div>
            {state.patterns.length === 0 && <div className="empty-state">{state.phase === "loading" ? "Lade Muster…" : "Noch keine Muster."}</div>}
            {state.patterns.map((pattern) => (
              <article key={pattern.id} className="tb-pattern">
                <div>
                  <div className="when">{pattern.label}<strong>{factor(pattern.avgFactor)} im Schnitt</strong></div>
                  <p>{pattern.hint}. Zum Beispiel: {pattern.examples[0]?.title}</p>
                </div>
                <span className="num" title={`${pattern.en} englisch, ${pattern.de} deutsch`}>{pattern.count}</span>
              </article>
            ))}
          </div>

          <div className="history-rail">
            <div className="rail-head">
              <span>Verlauf</span>
              <button className="ghost-button" type="button" onClick={load}><ArrowsClockwise size={12} /> {state.runs.length} gespeichert</button>
            </div>
            {state.runs.length === 0 && <div className="empty-state">Jeder Lauf landet hier.</div>}
            {state.runs.map((run) => (
              <article key={run.id} className={shown?.id === run.id ? "active" : undefined}>
                <button type="button" onClick={() => setState((current) => ({ ...current, selected: run.id }))}>
                  <div className="when">{stamp(run.createdAt)}<strong>{run.variants.length} Titel</strong></div>
                  <p>{run.workingTitle}</p>
                </button>
                <span className="num">{run.ideas.length > 0 ? `${run.ideas.length} vidIQ` : ""}</span>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

# 07 — Strategy-Provider über Codex SDK mit echter Evidenz

**What to build:** "Generate angle" in Ideas arbeitet mit den echten Top-Outlier-Reels statt Demo-Daten und läuft über das Codex-Abo (lokaler Bridge, kein API-Key). Der Bridge bekommt als Evidenz die zehn stärksten Outlier der letzten 30 Tage (Titel, Caption-Auszug, Plays, Outlier, Creator) plus Chris' Ziel und Zielgruppe (KI-Betriebssystem für Mittelstand, deutschsprachig). Antwort auf Deutsch, strukturiert wie bisher (angle, rationale, opening, proofToShow, cautions). Die UI zeigt, ob der Bridge erreichbar und Codex eingeloggt ist.

**Blocked by:** 01 — Glossar und ADRs anlegen

**Status:** done

- [x] Bridge-Health in Ideas sichtbar (erreichbar / nicht erreichbar / Codex nicht eingeloggt) mit Hinweis, was zu tun ist
- [x] Evidenz-Paket wird aus dem Convex-Korpus gebaut, nicht aus Demo-Fixtures; Schwelle und Zeitfenster stehen in der Konfiguration
- [x] Prompt nutzt die Begriffe aus CONTEXT.md, antwortet auf Deutsch
- [x] Antwort wird als Idee-Entwurf angezeigt und ist speicherbar (Persistenz kommt in 08)
- [x] Test: Evidenz-Auswahl (Top-N nach Outlier im Fenster) gegen Fixture; Bridge-Schema-Validierung bleibt grün

## Umsetzung

- Evidenzpaket: `lib/strategy-evidence.ts` (`selectEvidence`, `captionExcerpt`), Konfiguration in `lib/config.ts` (`STRATEGY_EVIDENCE_WINDOW_DAYS` 30, `STRATEGY_EVIDENCE_LIMIT` 10, Schwelle `OUTLIER_THRESHOLD`).
- Ziel und Zielgruppe: `STRATEGY_GOAL` und `STRATEGY_AUDIENCE` lesen `NEXT_PUBLIC_STRATEGY_GOAL` / `NEXT_PUBLIC_STRATEGY_AUDIENCE`. Chris' Positionierung gehört in `.env.local`, nicht ins Repo (CONTRIBUTING.md, AGENTS.md, README-Boundary).
- Bridge-Health: `bridge/auth.mjs` liest `CODEX_API_KEY` bzw. `$CODEX_HOME/auth.json`; `GET /health` liefert `codex`, ein Lauf ohne Login endet mit 503 statt Codex-Spawn.
- Prompt: `bridge/request.mjs` nutzt die Begriffe aus `CONTEXT.md` und fordert deutsche Antwort; Evidenz-Felder sind Titel, Creator, Caption-Auszug, Plays, Outlier.
- UI: Ideas zeigt Bridge-Status (erreichbar / nicht erreichbar / nicht eingeloggt) mit Handlungshinweis, das aktive Evidenzpaket samt Creators, und übernimmt die Antwort als Captured Idea in eine Sitzungsliste. UI-Texte bleiben englisch wie der Rest der Shell, deutsch ist nur die Modell-Antwort. Persistenz folgt in 08.
- Tests: `tests/strategy-evidence.test.mjs` (11), `tests/bridge-request.test.mjs` (10).
- Verifiziert gegen den echten Korpus: 9 Creators, 1093 Signale, 10 Outlier-Reels als Evidenz, Codex-Lauf lieferte einen deutschen Entwurf, der die tatsächlichen Reels benennt.

## Review-Fixes

- Clean-Room-Grenze: Ziel und Zielgruppe standen als Klartext in `lib/config.ts` und verletzten CONTRIBUTING.md ("production prompts"), AGENTS.md ("identity-specific strategy") und die README-Boundary ("personal audience profiles or brand strategy"). Sie liegen jetzt in `.env.local` (gitignored), `.env.example` bekommt nur Platzhalter.
- `IdeaDraft` → `CapturedIdea`: `CONTEXT.md` verbietet "Draft" als Synonym für Idea.
- Neue UI-Texte waren deutsch in einer sonst englischen Shell; zurück auf Englisch. Deutsch ist nur die Modell-Antwort (ADR-0004).
- Sortier-Fehler: `selectEvidence` rundete vor dem Sortieren, dadurch entschied bei 8.04 gegen 7.96 die Play-Zahl über den letzten Platz. Sortiert wird jetzt auf dem exakten Faktor, gerundet wird nur für die Anzeige. Test: "ranks on the exact outlier, not the rounded one".
- Doppelter Threshold-Alias entfernt, `IdeasView`-Props gebündelt, Bridge-Obergrenzen kommentiert.

Bewusst so gelassen: Die Schwelle ist `OUTLIER_THRESHOLD`, also dieselbe wie in Discover. Eine zweite Schwelle wäre ein zweiter Wahrheitsbegriff für denselben Begriff (CONTEXT.md "Schwelle"). Die Freitextfelder Idea und Goal aus dem Ideas-Formular fließen in das Ziel ein; die Felder existierten vorher ungenutzt und sind der natürliche Ort für eine Abweichung vom Standardziel.

# 21 — Ehrliche Prognose an der Idea

**What to build:** Eine Idea sagt vor der Produktion, was sie wahrscheinlich bringt und woran sie scheitern kann. Der Develop-Lauf liefert neben dem Storyboard eine Prognose: eine Reichweiten-Spanne, eine Einstufung des Potenzials, das größte Risiko und die Spannung, die das Reel auflöst. Die Prognose stützt sich auf das Evidenzpaket, also auf vergleichbare Reels aus dem Korpus, nicht auf eine freie Schätzung; fehlt vergleichbare Evidenz, steht dort "keine Prognose" statt einer Zahl. Ideen-Liste und Detail zeigen die Prognose, damit Chris schwache Ideen fallen lässt, bevor Produktionszeit hineingeht.

**Blocked by:** 08 — Ideas: Capture und Develop

**Status:** ready-for-human

- [x] Prognose (Reichweiten-Spanne, Potenzial, größtes Risiko, Spannung) wird an der Idea gespeichert und in Liste und Detail gezeigt
- [x] Die Spanne leitet sich aus vergleichbaren Reels des Evidenzpakets ab; ohne Vergleichsbasis steht "keine Prognose", keine erfundene Zahl
- [x] Der Bridge antwortet gegen ein erweitertes Schema; eine Antwort ohne Prognose-Feld lässt das Storyboard trotzdem entstehen
- [x] Test: Ableitung der Spanne aus einem Evidenz-Fixture und der Fall ohne Vergleichsbasis

## Comments

**2026-08-29, Umsetzung (unbeaufsichtigter Batch)**

Neuer Typ `Forecast` in `lib/contracts.ts` und Feld `forecast` an der Idea: `range` (low/high Plays oder null), `potential` (`low`/`medium`/`high` oder null), `comparable` (Anzahl), `risk`, `tension`. Convex-Schema (`forecastFields`) und beide Storage-Adapter nehmen es über `settleIdeaDevelop` mit; `applyStoryboard` in `lib/ideas.ts` schreibt es neben das Storyboard und löscht bei einem Lauf ohne Prognose die alte, damit Storyboard und Prognose nie aus verschiedenen Läufen stammen. Schema mit `npx convex dev --once` deployed.

Ableitung in `lib/forecast.ts`: der Bridge antwortet gegen das erweiterte `storyboardOutputSchema` mit `forecast.comparable` (Paket-Titel, exakt kopiert), `risk`, `tension`. `deriveForecast` matcht die Titel gegen das Evidenzpaket wie ein Beleg (unbekannte Titel fallen weg, Duplikate zählen einmal), nimmt Spanne = min/max Plays und Potenzial nach Median-Outlier (≥5 high, ≥3 medium, sonst low). Unter 2 Vergleichsreels: `range` und `potential` null, UI "No forecast: no comparable reel in the evidence". `parseForecastAnswer` liefert bei fehlendem oder kaputtem Feld null, `parseStoryboard` läuft davon unberührt, also entsteht das Storyboard trotzdem.

UI (`components/signal-room.tsx`): Zeile unter dem Idea-Titel mit Spanne, Potenzial und Anzahl Vergleichsreels; im aufgeklappten Storyboard zusätzlich "Forecast", "Biggest risk", "Tension". CSS `.forecast-line`.

Tests: `tests/forecast.test.mjs` (9) für Spanne aus Evidenz-Fixture, Potenzial-Stufen, unbekannte und doppelte Titel, Fall ohne Vergleichsbasis, fehlendes Feld; `tests/ideas.test.mjs` +2 (Prognose neben Storyboard, Lauf ohne Prognose); `tests/bridge-storyboard.test.mjs` +2 (Schema und Prompt). Suite 243 grün, Typecheck und Build sauber. Doku: CONTEXT.md (Begriff "Prognose"), ADR-0004, docs/ARCHITECTURE.md.

Annahmen, ohne Rückfrage entschieden:
- Vergleichbarkeit entscheidet der Bridge (welche Reels), die Zahl rechnet die App. Ein freier Schätzwert vom Modell wird nirgends gelesen.
- Mindestens 2 Vergleichsreels für eine Spanne; ein einzelnes Reel ist eine Anekdote, keine Spanne.
- Potenzial-Grenzen 3x und 5x sind gesetzt, nicht aus Daten kalibriert. Das Evidenzpaket enthält nur Reels über der Schwelle (2x), deshalb liegen die Stufen darüber.
- Spanne ist min/max der Plays, keine Perzentile: bei höchstens 10 Reels im Paket wäre alles andere Scheingenauigkeit.
- Nicht live gegen den Bridge geprüft (Batch-Lauf ohne Codex-Session). Der Bridge-Vertrag ist über Schema-Test abgedeckt; ein echter Develop-Lauf steht zur Sichtprüfung aus.

**2026-08-29, Review-Fixes**

Standards- und Spec-Review parallel gelaufen, Befunde abgearbeitet:

- Titel-Matching lag doppelt (`lib/hooks-board.ts` für Belege, `lib/forecast.ts` für Vergleichsreels) und war im Forecast asymmetrisch: zitierte Titel wurden whitespace-kollabiert, Paket-Titel nicht, ein gespeicherter Titel mit Doppel-Leerzeichen oder Zeilenumbruch hätte nie gematcht. Jetzt eine Funktion `citedEvidence` in `lib/strategy-evidence.ts`, beide Seiten über denselben Key. Test dafür in `tests/forecast.test.mjs`.
- `askBridge` bekam das Evidenzpaket zweimal (im Request und als Argument). Liest jetzt `request.evidence`.
- `SettleDevelop.forecast` war optional und nullable; jetzt `Forecast | null` Pflicht auf dem Storyboard-Zweig.
- `Forecast.comparable` (Zahl) und `ForecastAnswer.comparable` (Titel) hießen gleich. Gespeichertes Feld heißt `comparableCount`. Convex-Schema neu deployed; es lag noch kein Dokument mit Prognose in der Tabelle.
- Spec-Lücke: antwortet der Bridge ohne Prognose-Feld, zeigte die UI gar nichts. Jetzt steht an jeder entwickelten Idea eine Prognose-Zeile, ohne Prognose "No forecast: the bridge answered without one", bei zu wenig Vergleichsreels "No forecast: fewer than two comparable reels in the evidence".

Bewusst gelassen: Risiko und Spannung stehen nur im aufgeklappten Storyboard, die Liste zeigt Spanne, Potenzial und Anzahl Vergleichsreels. Die Potenzial-Grenzen (3x, 5x) bleiben gesetzt, siehe Annahmen oben. Suite 244 grün, Typecheck und Build sauber.

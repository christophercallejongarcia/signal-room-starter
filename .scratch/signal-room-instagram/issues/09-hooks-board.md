# 09 — Hooks-Board (ersetzt Titles)

**What to build:** Der Titles-Tab wird für Instagram zum Hooks-Board. Chris fügt ein Transkript (bis 20.000 Zeichen), eine Idee oder einen Einzeiler ein, wählt Anzahl (5, 10, 15) und bekommt Hook-Varianten für die ersten drei Sekunden, gruppiert nach Hypothese (Neugier-Lücke, Liste, Kontrast, Versprechen, Story). Jede Variante nennt die ähnlichsten Outlier-Hooks aus dem Korpus als Beleg. Jeder Lauf landet in einer History rechts, mit Zeichenzahl und Datum, und ist wieder aufrufbar.

**Blocked by:** 07 — Strategy-Provider über Codex SDK mit echter Evidenz

**Status:** done

- [x] Eingabe bis 20.000 Zeichen wird angenommen, größere Eingaben mit klarer Meldung abgelehnt
- [x] Ergebnis gruppiert nach Hypothese, je Variante Belege aus dem Outlier-Korpus
- [x] Tabelle `hookRuns` in Convex, History-Rail zeigt die letzten Läufe
- [x] Parallel gestartete Läufe bekommen eigene Einträge
- [x] Test: Eingabe-Validierung, Gruppierung des Antwort-Schemas

## Comments

**2026-08-26, implementation**

Der Titles-Tab ist jetzt das Hooks-Board (`hooks`), Titles gibt es nicht mehr.

- `lib/hooks-board.ts` ist der reine Kern: `parseHookRequest` (Eingabe bis `HOOK_INPUT_MAX` = 20.000 Zeichen, Anzahl aus `HOOK_COUNTS` = 5/10/15), `parseHookBoard` (validiert die Bridge-Antwort und hängt die Belege an), `similarEvidence`, `groupHooks`, `newHookRun`.
- Fünf Hypothesen als `HOOK_HYPOTHESES`: Neugier-Lücke, Liste, Kontrast, Versprechen, Story. Leere Gruppen fallen weg, die Reihenfolge ist fest.
- Belege kommen ausschließlich aus dem Evidenzpaket (`lib/strategy-evidence.ts`, dasselbe wie beim Develop-Lauf). Nennt die Antwort einen Titel, den das Paket nicht führt, fällt er weg; eine Variante ohne brauchbare Nennung bekommt über `similarEvidence` die wortähnlichsten Outlier-Hooks.
- Neue Bridge-Route `/v1/hooks` (`hooksOutputSchema` erzwingt die Hypothese als Enum). Das Body-Limit der Bridge steigt auf 128 KB, damit ein 20.000-Zeichen-Transkript in UTF-8 durchpasst.
- Tabelle `hookRuns` in Convex (`convex/hookRuns.ts`, Indizes `by_external_id`, `by_createdAt`) plus Datei-Adapter. Jeder Lauf schreibt eine eigene Zeile mit eigener id, kein Claim: parallel gestartete Läufe überschreiben sich nicht.
- `POST /api/hooks` erzeugt einen Lauf, `GET /api/hooks` liefert die letzten `HOOK_RUN_HISTORY` (20) für die History-Rail. Ein Klick in der Rail lädt den Lauf wieder aufs Board.
- Tests: `tests/hooks-board.test.mjs` (18) und `tests/bridge-hooks.test.mjs` (9). `npm run check` grün, 177 Tests.

Nach dem Review nachgezogen:

- `hooksOutputSchema` wird pro Lauf aus der angeforderten Anzahl gebaut (`minItems` = `maxItems` = count). Ein Lauf über 15 kann nicht mehr mit drei Hooks zurückkommen und die gespeicherte Zahl widerlegen. Die Bridge rastet eine Anzahl dazwischen auf einen der drei Werte ein, statt sie nur zu klemmen.
- Ein Beleg zeigt den Hook des Outlier-Reels, nicht den Caption-Auszug. Bei Instagram ist der Titel eines Signals bereits die erste Caption-Zeile; das Feld `title` fiel weg, `HookEvidence` ist jetzt `{ hook, creator, outlier }`.
- Der Generate-Knopf bleibt bei zu langer Eingabe klickbar, sonst erreicht die gezählte Absage den Nutzer nie. Der Zeichenzähler zeigt exakte Zahlen statt "20.5K".
- `bounded` kommt jetzt aus `lib/ideas.ts` statt doppelt zu existieren; die Bounds stehen bei den anderen Knöpfen in `lib/config.ts`.
- `docs/SECURITY.md` beschreibt den neuen Kanal: das Quellmaterial ist der einzige Prompt-Eingang, den Chris selbst tippt, beidseitig begrenzt (20.000 in der App, 24.000 in der Bridge), Body-Cap 128 KB.

Live geprüft gegen den echten Korpus und den lokalen Codex-Bridge: ein Lauf über ein Transkript, danach zwei parallel gestartete Läufe (5 und 15 Hooks). Beide landeten als eigene Einträge in `hookRuns`, mit der angeforderten Anzahl und Belegen aus echten Reels.

**Annahmen** (unattended entschieden, ohne Rückfrage):

- Der Lauf speichert nur einen Auszug der Eingabe (`sourceExcerpt`, 240 Zeichen) plus `sourceLength`, nicht das ganze Transkript. "Wieder aufrufbar" heißt: das gruppierte Board kommt zurück, nicht die Quelle.
- Der Tab heißt "Hooks", nicht "Titles". Die Hypothesen-Labels stehen auf Deutsch, weil die Hooks selbst auf Deutsch zurückkommen; die übrige UI bleibt englisch.

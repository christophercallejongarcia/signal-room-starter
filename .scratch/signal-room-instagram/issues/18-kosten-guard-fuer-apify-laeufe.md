# 18 — Kosten-Guard für Apify-Läufe

**What to build:** Chris sieht, was ein Run gekostet hat, und ein Run kann nicht unbemerkt teuer werden. Backfill und Delta-Refresh protokollieren die verbrauchten Apify-Compute-Units und die daraus geschätzten Kosten am Run. Ein konfigurierbares Limit begrenzt, wie viele Creators ein Delta-Refresh anfasst; wird es erreicht, endet der Run als `partial`, und die nicht geprüften Creators behalten ihr `lastCheckedAt`, damit der nächste Lauf dort weitermacht. Der Profile-Tab zeigt neben jedem Run die Kosten und darüber die Summe des laufenden Monats.

**Blocked by:** None — can start immediately

**Status:** done

- [x] `runs` speichert verbrauchte Compute-Units und geschätzte Kosten in Dollar, für Backfill und Delta-Refresh
- [x] Limit für Creators pro Delta-Refresh in der Konfiguration; beim Erreichen endet der Run als `partial`, die übrigen Creators behalten ihr `lastCheckedAt`
- [x] Profile-Tab zeigt Kosten je Run und die Monatssumme
- [x] Liefert ein Actor-Lauf keine Verbrauchszahl, steht am Run "unbekannt" statt einer erfundenen Null
- [x] Test: Kostenberechnung und Limit-Abbruch gegen Fixture

## Comments

**2026-08-29, umgesetzt (unbeaufsichtigter Batch, Branch `afk/batch-20260829-1704`)**

Annahmen, weil niemand fragen konnte:

- Der Apify-Client startet den Actor über `POST /acts/{id}/runs?waitForFinish=60`, pollt `GET /actor-runs/{id}?waitForFinish=60` bis zum Terminal-Status und liest dann das Dataset. Nur das Run-Objekt trägt `stats.computeUnits` und `usageTotalUsd`; die beiden `run-sync`-Endpunkte liefern den OUTPUT-Record bzw. die Items, nie das Run-Objekt (Apify-Doku geprüft). Ein Run, der nicht `SUCCEEDED` endet, wirft. Das Zeitbudget ist der Actor-Timeout plus 90 s für Poll und Dataset-Lesen.
- Kosten sind primär `usageTotalUsd` (deckt auch Pay-per-Result-Actors ab). Fehlt der Betrag, wird aus Compute-Units mal `APIFY_USD_PER_COMPUTE_UNIT` geschätzt, Standard 0,40 (Apify-Listenpreis), per Env überschreibbar.
- "Unbekannt" ist am Run als `usage.unreported` (Zahl der Actor-Läufe ohne Nutzungszahl) modelliert; `computeUnits`/`costUsd` fehlen ganz, wenn kein Actor-Lauf etwas meldete. Ein fehlgeschlagener Creator zählt als zwei unreported Actor-Läufe (beide Streams), weil seine Nutzung mit dem Fehler verloren geht. Teilweise gemeldete Runs zeigen `$0.08+`, nie eine Zahl, die vollständig aussieht.
- Limit `REFRESH_CREATOR_LIMIT`, Standard 25. Reihenfolge: nie geprüfte Creators zuerst, dann ältester `lastCheckedAt`. So wandert ein begrenzter Refresh über die ganze Liste.
- Alte Runs ohne `usage` bleiben gültig (Feld optional im Schema), lesen im Tab als "unknown" und zählen in der Monatssumme als "runs without a figure".
- Monatssumme: `GET /api/runs` liest bis zu 100 Runs (die Obergrenze beider Stores) und summiert die des laufenden UTC-Monats.

Der erste Wurf rief `run-sync` auf und las dessen Antwort als Run-Objekt; das Spec-Review hat das gegen die Apify-Doku gefangen (`run-sync` gibt den OUTPUT-Record zurück, der Instagram-Scraper schreibt keinen, jeder Lauf wäre mit "returned no dataset" gescheitert). Deshalb jetzt `tests/apify-client.test.mjs` mit gefaktem `fetch` gegen `tests/fixtures/apify-run.json` (Run-Objekt nach Doku-Beispiel). Nicht live gegen Apify getestet, weil kein Token im Batch; der nächste echte Refresh ist die Probe.

Monatssumme: `monthUsage` meldet `truncated`, wenn alle 100 gelesenen Runs im laufenden Monat liegen; der Tab zeigt dann `$x.xx+`.

Neu: `lib/run-cost.ts`, `tests/run-cost.test.mjs`, `tests/apify-client.test.mjs`, `tests/fixtures/apify-run.json`. Geändert: Apify-Client, Instagram-Adapter (gibt `{ records, usage }` zurück), `lib/collect.ts`, Contracts, Convex-Schema, Config, `/api/runs`, Profile-Tab, `.env.example`, CONTEXT.md. 223 Tests grün, Typecheck grün, Build grün.

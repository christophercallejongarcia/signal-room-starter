# 06 — Daily Watch Cron

**What to build:** Der Refresh läuft täglich ohne Zutun. Ein Convex-Cron stößt den Delta-Refresh zur festen Uhrzeit an. Tracked Channels zeigt in der "Next refresh"-Box die echte nächste Laufzeit und den letzten Lauf. Läuft der Cron in der Cloud, muss die Sammel-Logik dort erreichbar sein (Convex Action mit Apify-Token als Convex-Env), nicht nur im lokalen Next-Server.

**Blocked by:** 05 — Delta-Refresh mit Run-Log

**Status:** done

- [x] Cron-Definition in Convex, täglich 10:00 Europe/Berlin
- [x] Der Cron erzeugt einen Run-Eintrag genau wie der manuelle Refresh
- [x] Apify-Token liegt als Convex-Environment-Variable, nicht im Client
- [x] "Next refresh" und "Last run" in Tracked Channels zeigen echte Werte
- [x] Manuell ausgelöster Testlauf über das Convex-Dashboard dokumentiert

## Comments

2026-08-29: Umgesetzt. Cron in `convex/crons.ts`: zwei Jobs (`0 8 * * *`, `0 9 * * *`), weil Convex-Crons nur UTC kennen; die Action `internal.refresh.run` (`convex/refresh.ts`, `"use node"`) prüft mit `isRefreshHour` (`lib/refresh-schedule.ts`), ob gerade 10:00 Europe/Berlin ist, und nur der passende Slot arbeitet (Sommer 08:00 UTC, Winter 09:00 UTC, inklusive Umstellungstag getestet). Die Action fährt denselben `runRefresh` wie `POST /api/refresh` über einen Storage aus `ctx.runQuery`/`ctx.runMutation`, schreibt denselben Run nach `runs` und danach das Tages-Briefing ohne Angles (`runBriefing({ angles: false })`, kein Bridge in der Cloud). `APIFY_TOKEN` per `npx convex env set` auf dev (`robust-shepherd-280`) gesetzt, nie im Client. Tracked Channels: "Next refresh" rechnet `nextRefreshAt` in Berlin-Zeit, "Last run" zeigt den neuesten Run aus `GET /api/runs`.

Annahmen: (1) In der Cloud gibt es keinen Datenträger, also cacht der Cron keine Cover; der nächste lokale Refresh holt sie über den Catch-up-Pass nach, solange die CDN-Links gelten. Convex File Storage für Cover wäre ein eigenes Ticket. (2) Convex-Actions enden nach 10 Minuten; `REFRESH_CREATOR_LIMIT` auf dem Deployment begrenzt den Sweep, abgeschnittene Läufe holen die unveränderten Cursor am nächsten Tag nach. (3) `next-env.d.ts` (vor dem Ticket geändert) und die losen `docs/assets/*.png` bleiben unangetastet.

Testlauf (manuell, Cloud): `npx convex run refresh:run '{"force":true,"creatorLimit":1}'` am 2026-08-29 19:28 UTC. Ergebnis: Run `run-2026-08-29T19:28:17.920Z-793c28a9`, 1 Creator geprüft, 8 übersprungen (Limit), +1/~1 Records, 0 Fehler, 28 s, usage 0,058 CU / 0 USD, Briefing `briefing-2026-08-29` geschrieben. Ohne `force` außerhalb der Stunde: Log "is not the local sweep hour; skipping". Im Dashboard: Functions → `refresh:run` → Args `{"force":true,"creatorLimit":1}` → Run.

Tests: `tests/refresh-schedule.test.mjs` (Sommer, Winter, Umstellungstag, Guard, Cron-Specs), `tests/briefing-run.test.mjs` (Cron-Pfad ohne Bridge/Disk, lokaler Pfad bei Bridge down).

2026-08-29 (Review): Standards-Achse ohne harten Verstoß; übernommen: Cron heißt jetzt `daily sweep (…)` wie der Glossar-Begriff, `refreshCronSlots` liefert `{ utcHour, spec }` statt String-Parsing, `REFRESH_ZONE_LABEL` statt Literal "Berlin", und der Convex-Storage-Ausschnitt für Collect + Briefing ist einmal deklariert (`collectStorageOver` in `lib/adapters/storage/convex.ts`), genutzt vom HTTP-Client und von der Action. Spec-Achse: `docs/SPEC.md` T6.1 auf Convex-Cron und Tracked Channels aktualisiert. Offen und bewusst so gelassen: ein von Convex nach 10:59 Berlin verspäteter Cron überspringt den Tag mit Log-Zeile, und ein Lauf, den die 10-Minuten-Grenze abbricht, hinterlässt keinen Run-Eintrag (Cursor bleiben, nächster Tag holt nach). Zweiter Cloud-Testlauf nach dem Refactor: `run-2026-08-29T19:32:12.779Z-d8f4c8ca`, 1 Creator, ~4 Records, 0 Fehler.

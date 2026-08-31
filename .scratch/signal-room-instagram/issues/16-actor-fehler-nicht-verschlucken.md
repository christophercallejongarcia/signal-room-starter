# 16 — Actor-Fehler nicht verschlucken, Cursor nur nach Erfolg vorrücken

**What to build:** Ein fehlgeschlagener Apify-Lauf darf keine Reels verlieren. Heute fängt `collectForCreator` jeden Actor-Fehler mit `.catch(() => [])` ab, `collectAndStore` setzt `lastCheckedAt` trotzdem auf jetzt, und der nächste Delta-Refresh fragt nur noch nach neueren Beiträgen. Der Zeitraum des fehlgeschlagenen Laufs wird nie nachgeholt. Der Refresh meldet dabei HTTP 200 ohne Fehler, die UI sagt "Refreshed just now". Künftig: `lastCheckedAt` rückt nur vor, wenn beide Streams (reels, posts) erfolgreich waren und das Speichern durch ist. Ein Teil- oder Totalausfall wird als Fehler im Ergebnis gemeldet und der Cursor bleibt stehen. `recordsAdded` zählt tatsächlich neu eingefügte Datensätze, nicht die vom Actor gelieferten.

Quelle: Codex-Review SR-003 (`reviews/review-20260824-165924-b94c73.md`).

**Blocked by:** None — can start immediately. Überschneidet sich mit 05 (Delta-Refresh mit Run-Log); wer 05 baut, sollte dieses Ticket mit erledigen.

**Status:** done

- [x] Schlägt einer der beiden Actor-Läufe fehl, bleibt `lastCheckedAt` des Creators unverändert
- [x] `/api/refresh` meldet den Creator in `errors`, die UI zeigt den Fehlerzustand statt "Refreshed just now"
- [x] `recordsAdded` ist die Zahl tatsächlich neu gespeicherter Signale (Storage gibt inserted/updated zurück)
- [x] Test: Actor-Fehler in einem Stream → kein Cursor-Vorlauf, Fehler im Ergebnis; Erfolg in beiden → Cursor rückt vor
- [x] Test: zweiter Lauf mit denselben Records meldet `recordsAdded: 0`

## Comments

2026-08-24: Mit Ticket 05 erledigt. `collectForCreator` wirft bei Stream-Fehlern (mit Stream-Namen im Text), `collectAndStore` rückt `lastCheckedAt` erst nach `saveSignals` vor, `recordsAdded` kommt aus `SaveResult.inserted`. Tests in `tests/collect.test.mjs`.

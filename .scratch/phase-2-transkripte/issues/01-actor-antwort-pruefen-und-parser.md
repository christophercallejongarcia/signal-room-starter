# 01 — Actor-Antwort prüfen und Parser auf ein echtes Fixture bringen

**What to build:** Ein Delta-Refresh liefert zum ersten Mal ein Transkript mit Status `ready`. Dafür wird die heutige Antwortform des Transkript-Actors an einem echten Lauf mit ein bis zwei Reels mit Sprache geprüft, das gelieferte Dataset-Item ungekürzt als Test-Fixture abgelegt und der Parser darauf angepasst. Bis der Fixture-Test grün ist, bleibt die Automatik im Daily Sweep aus (Transkript-Limit 0 in der Convex-Umgebung).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

**Handgriff für Chris:** den Prüf-Lauf starten (Apify-Token, ein bis zwei bekannte Reels mit Sprache, wenige Cent). Das Ticket enthält dafür ein kleines Skript oder einen `npx convex run`-Aufruf mit `transcriptLimit: 2` und `creatorLimit: 0`; das rohe Dataset-Item landet als Datei unter den Test-Fixtures.

- [x] Ein echtes Dataset-Item des Actors liegt als Fixture im Repo, unverändert
- [x] Der Parser liest Shortcode, Text und (falls geliefert) Segmente aus genau dieser Form; die bisherige tolerante Feldsuche bleibt als Rückfall
- [x] Ein Item ohne Text ergibt weiter `silent`, ein nicht genanntes Reel bleibt offen
- [x] Test gegen das echte Fixture (Vorbild `tests/apify-transcripts.test.mjs`)
- [x] Automatik im Daily Sweep bleibt bis zum grünen Test aus; der Ticket-Kommentar hält fest, welcher Wert in der Convex-Umgebung gesetzt ist und wann er wieder hochgesetzt wurde
- [x] Nach dem grünen Test: ein lokaler Refresh mit kleinem Limit liefert mindestens ein Reel mit `ready`

## Prüfprotokoll 2026-08-31

- Der Actor `apple_yang/instagram-transcripts-scraper` lief mit zwei Korpus-URLs. Der Lauf `ZtnsY0p4ER7ROuNde` lieferte das Dataset `B5NuHKXIsFqGbpDLd` mit zwei Items. Die Rohantwort liegt als `tests/fixtures/apify-transcript-items.json` im Repo. Die Items enthalten `code`, `url`, `text` und `segments[]` mit `start`, `end` und `text`.
- `lib/adapters/sources/apify-transcripts.ts` bevorzugt diese aktuelle Form. Die Suche in URL-Feldern, `shortCode`, `shortcode`, `transcript`, `transcription` und älteren Segmentfeldern bleibt als Fallback erhalten.
- `TRANSCRIPT_LIMIT_PER_RUN=0` wurde am 2026-08-31 in der Convex-Dev-Deployment gesetzt. Nach dem grünen Fixture-Test wurde der Wert am 2026-08-31 um 21:59 Europe/Berlin wieder auf `20` gesetzt. Der aktuelle Wert ist `20`.
- Der manuelle Prüf-Refresh `npx convex run refresh:run '{"force":true,"creatorLimit":0,"transcriptLimit":2}'` lieferte zwei `ready`-Transkripte. Beim ersten Lauf griff noch die alte Untergrenze und prüfte einen Creator. Nach der Korrektur prüfte `npx convex run refresh:run '{"force":true,"creatorLimit":0,"transcriptLimit":0}'` null Creator und rief keinen Transcript-Actor auf.

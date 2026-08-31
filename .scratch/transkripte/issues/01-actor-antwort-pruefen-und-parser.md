# 01 — Actor-Antwort prüfen und Parser auf ein echtes Fixture bringen

**What to build:** Ein Delta-Refresh liefert zum ersten Mal ein Transkript mit Status `ready`. Dafür wird die heutige Antwortform des Transkript-Actors an einem echten Lauf mit ein bis zwei Reels mit Sprache geprüft, das gelieferte Dataset-Item ungekürzt als Test-Fixture abgelegt und der Parser darauf angepasst. Bis der Fixture-Test grün ist, bleibt die Automatik im Daily Sweep aus (Transkript-Limit 0 in der Convex-Umgebung).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

**Handgriff für Chris:** den Prüf-Lauf starten (Apify-Token, ein bis zwei bekannte Reels mit Sprache, wenige Cent). Das Ticket enthält dafür ein kleines Skript oder einen `npx convex run`-Aufruf mit `transcriptLimit: 2` und `creatorLimit: 0`; das rohe Dataset-Item landet als Datei unter den Test-Fixtures.

- [ ] Ein echtes Dataset-Item des Actors liegt als Fixture im Repo, unverändert
- [ ] Der Parser liest Shortcode, Text und (falls geliefert) Segmente aus genau dieser Form; die bisherige tolerante Feldsuche bleibt als Rückfall
- [ ] Ein Item ohne Text ergibt weiter `silent`, ein nicht genanntes Reel bleibt offen
- [ ] Test gegen das echte Fixture (Vorbild `tests/apify-transcripts.test.mjs`)
- [ ] Automatik im Daily Sweep bleibt bis zum grünen Test aus; der Ticket-Kommentar hält fest, welcher Wert in der Convex-Umgebung gesetzt ist und wann er wieder hochgesetzt wurde
- [ ] Nach dem grünen Test: ein lokaler Refresh mit kleinem Limit liefert mindestens ein Reel mit `ready`

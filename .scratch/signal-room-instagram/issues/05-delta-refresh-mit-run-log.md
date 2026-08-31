# 05 — Delta-Refresh mit Run-Log

**What to build:** Der Refresh-Button und die API holen nur, was seit dem letzten Lauf neu ist, und aktualisieren Plays, Likes und Kommentare bereits bekannter Reels. Jeder Lauf wird als Run gespeichert: Start, Dauer, geprüfte Creators, neue und aktualisierte Records, Fehler pro Creator. Profile zeigt die letzten zehn Runs. Fehler bei einem Creator brechen den Lauf nicht ab.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Zweiter Refresh direkt nach dem ersten fordert bei Apify nur das Fenster seit `lastCheckedAt` an (mit einem Tag Überlappung für Nachzügler)
- [x] Bekannte Reels bekommen aktualisierte Plays/Likes/Kommentare, keine Duplikate
- [x] Neue Tabelle `runs` in Convex, ein Eintrag pro Lauf mit den genannten Feldern
- [x] Profile-Tab listet die letzten zehn Runs mit Status und Zahlen
- [x] Ein fehlschlagender Creator wird im Run vermerkt, die übrigen laufen durch
- [x] Test: Fenster-Berechnung und Merge-Logik gegen Fixtures

## Comments

2026-08-24: Umgesetzt zusammen mit Ticket 16. Fenster und Merge in `lib/refresh-window.ts`, Run-Log in `lib/collect.ts` (`runRefresh`), Convex `runs` mit `convex/runs.ts`, `GET /api/runs`, Profile-Tab-Tabelle. Tests: `tests/refresh-window.test.mjs`, `tests/collect.test.mjs`. Live-Lauf gegen Apify nicht ausgeführt (Kosten); Konvex-Schema auf dev deployed.

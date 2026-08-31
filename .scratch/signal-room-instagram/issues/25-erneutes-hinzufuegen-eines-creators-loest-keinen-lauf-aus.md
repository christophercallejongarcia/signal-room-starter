# 25 — Erneutes Hinzufügen eines Creators löst keinen Apify-Lauf aus und sagt das nicht

**What to build:** Wer in Tracked Channels einen Creator über "Add to daily watch" einträgt, erwartet einen Apify-Lauf, der dessen Reels einsammelt. Ist der Handle schon getrackt, antwortet `POST /api/creators` heute mit `{ existing: true, recordsAdded: 0 }`, die UI schließt den Dialog kommentarlos und es passiert nichts sichtbares. Genau das ist im Loom passiert: `@aiagentgeorg` war seit dem Backfill um 08:12 Berlin (92 Datensätze, Run "backfill ok") bereits in der Liste, das erneute Hinzufügen war ein stiller No-op. Künftig sagt der Dialog bei einem bekannten Handle, dass der Creator schon läuft (Name, letzter Check, Korpusgröße) und bietet an derselben Stelle "Jetzt aktualisieren" an, das den Delta-Refresh nur für diesen Creator startet. Ein voller 90-Tage-Backfill wird nicht wiederholt; der kostet zwei Actor-Läufe und liefert dieselben Datensätze (Ticket 18, Kosten-Guard).

Quelle: Loom "Epify Lauf für Creator Auswahl prüfen" (2026-08-30), https://www.loom.com/share/7291e13c7e9d4c6a936feb08664f6783

**Befund:**

- `app/api/creators/route.ts`: Bei `existing` ohne `owned`-Wechsel kommt HTTP 200 mit `recordsAdded: 0` zurück, kein `runBackfill`, kein `saveRun`. Der Client (`components/signal-room.tsx`, `addCreator`) unterscheidet nicht zwischen "neu angelegt" und "gab es schon", er ruft `loadStore()` und schließt den Dialog.
- Der Erst-Backfill für `@aiagentgeorg` lief korrekt: Run vom 2026-08-30 06:12 UTC, `kind: backfill`, `status: ok`, 92 Datensätze. Der Apify-Pfad selbst ist nicht defekt.
- Nebenbefund, nicht Teil dieses Tickets: Die Spalte "Corpus" zeigt für Georg "92 videos · 0 median", weil 65 seiner 92 Datensätze `format: post` ohne `plays` sind und der Median in `signal-room.tsx` über `plays ?? views` aller Signale gerechnet wird. Im Discover-Feed erscheinen dieselben Posts mit "8 plays · 0.0x". Chris will nur Reels: siehe Ticket 26 (Posts-Stream abschalten, Bestand bereinigen).

**Blocked by:** None — can start immediately. Baut auf dem Per-Creator-Refresh aus 05 auf (Controls-Spalte, ⟳).

**Status:** ready-for-agent

- [ ] `POST /api/creators` antwortet bei bekanntem Handle mit `existing: true` plus `lastCheckedAt`, `name` und Korpusgröße, unverändert HTTP 200 und ohne Actor-Lauf
- [ ] Der Dialog bleibt bei `existing: true` offen und zeigt: "@handle läuft bereits seit <Datum>, <n> Videos, zuletzt geprüft <Zeit>" mit den Aktionen "Jetzt aktualisieren" und "Schließen"
- [ ] "Jetzt aktualisieren" startet den bestehenden Delta-Refresh nur für diesen Creator (derselbe Pfad wie ⟳ in der Controls-Spalte), zeigt den Ladezustand im Dialog und danach `recordsAdded`
- [ ] Ein noch nicht getrackter Handle verhält sich wie heute: Backfill, Dialog schließt, Liste lädt neu
- [ ] Getickte "This is my own account"-Box bei bekanntem Handle setzt weiterhin nur die Markierung (bestehendes Verhalten aus 12)
- [ ] Test: bekannter Handle → kein `runBackfill`, kein neuer Run in `saveRun`, Antwort enthält `existing: true` und `lastCheckedAt`
- [ ] Test: "Jetzt aktualisieren" ruft den Refresh mit genau einem Creator auf
- [ ] Docs: `CONTEXT.md` (Watchlist-Abschnitt) beschreibt das Verhalten beim erneuten Hinzufügen

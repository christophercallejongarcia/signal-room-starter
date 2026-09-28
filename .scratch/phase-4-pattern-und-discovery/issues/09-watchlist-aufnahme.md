# 09: Geprüfte Kandidaten idempotent in die Watchlist aufnehmen

**What to build:** Chris nimmt ausgewählte Kandidaten bewusst in die aktive Watchlist auf und sieht Backfill, Teilfehler und nächsten Refresh.

**Blocked by:** [P4-05: Creator-Kandidaten aus manueller Auswahl und Dossiers prüfen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/05-creator-kandidaten-inbox.md>); [P4-06: Hashtag-Autoren und starke Reel-Funde als Kandidaten bewerten](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/06-hashtag-kandidaten-anreichern.md>)

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Aufnahmeansicht zeigt aktuelle Belege, Markt, Nischenklasse und Auswirkungen des Backfills. Nur die ausdrückliche Aufnahmeaktion startet den bestehenden Ablauf.
- [ ] Atomarer Kandidaten-Claim verhindert doppelte kostenpflichtige Aufnahmen bei Doppelklick/Retry. Bereits getrackter Creator wird verbunden, ohne neuen Backfill.
- [ ] Erfolg setzt accepted, speichert die Creator-ID und zeigt echte Reels sowie den nächsten Daily Sweep. Markt und Nischenklasse bleiben erhalten.
- [ ] Fehler beim Auflösen, Sammeln oder Speichern zeigen den erreichten Stand; erneuter Versuch setzt dort fort und erfasst keine Duplikate. Ein laufender Versuch wird nicht parallel gestartet.
- [ ] Ablehnen und Zurückstellen beeinflussen die Watchlist nicht. Ziel 20 bis 30 wird angezeigt; größere bestehende Listen werden weder beschnitten noch automatisch umsortiert.
- [ ] Aufnahme bleibt auch ohne Quellenfähigkeiten aus Tickets 07/08 nutzbar, weil die Kandidatenquelle den bestätigten Ablauf nicht verändert.
- [ ] Tests prüfen konkurrierende Aufnahme, bestehenden Creator, Teilfehler mit Retry, unveränderte verworfene Kandidaten und persistierte Watchlist. Demo simuliert Aufnahme ohne externe Kosten.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


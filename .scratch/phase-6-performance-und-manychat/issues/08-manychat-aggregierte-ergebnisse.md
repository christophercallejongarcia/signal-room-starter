# 08: Aggregierte ManyChat-Ergebnisse am eigenen Reel ergänzen

**What to build:** Chris trägt aggregierte Kampagnenergebnisse aus ManyChat ein und sieht Auslieferung und Klicks neben dem zugehörigen Reel.

**Blocked by:** [P6-07: Freigegebenes Paket exportieren und externen Test dokumentieren](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/07-manychat-export-und-testprotokoll.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Erfassungsdialog verlangt Kampagne, Berichtszeitraum, Quellenbezug und Erfassungszeit; Runs, Sends, Klicks und gemeldete CTR bleiben getrennte optionale Zahlen.
- [ ] Jeder Datensatz ist als manuell erfasst markiert. Keine E-Mail-Adressen, Kontaktlisten, Chattexte, Tokens oder personenbezogenen Exporte werden angenommen.
- [ ] Derselbe Kampagnen-/Zeitraum-Schlüssel ist idempotent aktualisierbar. Überlappende kumulative Zeiträume werden nicht addiert; Verlaufsansicht zeigt den jeweiligen Stand.
- [ ] CTR-Zählweise wird dokumentiert; eine vom Anbieter berichtete CTR wird nicht blind aus totalen Klicks/Sends neu berechnet. Unbekannt ist keine Null, Sends ist nicht automatisch Runs.
- [ ] Zuordnung zeigt Publication, Reel, freigegebene Paket- und PDF-Version. Neue Handoff-Versionen überschreiben keine alten Berichtsdaten.
- [ ] Die Ansicht trennt Reichweite, Kommentare, Auslieferungen und Klicks. Daraus werden keine unbelegten Leads, Umsätze oder Kausalitätsaussagen abgeleitet.
- [ ] Tests prüfen fehlende Werte, invaliden Zeitraum/Zähler, doppelte Eingabe, überlappende Berichte, Revisionszuordnung und abgewiesene Kontaktfelder; Demo verwendet ausschließlich synthetische Aggregate.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


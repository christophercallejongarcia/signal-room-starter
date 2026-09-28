# 02: Auch ältere eigene Reels gezielt messen und den Verlauf zeigen

**What to build:** Chris sieht eine datierte Messhistorie seiner verknüpften Reels; geplante und manuelle Messläufe aktualisieren auch Veröffentlichungen außerhalb des normalen Delta-Fensters.

**Blocked by:** [P6-01: Eigene Veröffentlichung mit der verwendeten Skriptfassung verbinden](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/01-publication-zuordnung.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Die direkte Reel-Metrics-Operation des vorhandenen Instagram-Adapters wird gegen aktuelle offizielle Provider-Dokumentation/Fixture geprüft und einzeln eingeführt.
- [ ] Täglich bis 30 Tage alte und wöchentlich 31 bis 90 Tage alte verknüpfte Reels werden fällig; ältere Reels sind manuell aktualisierbar. Höchstens 20 fällige Reels pro Run, älteste fällige zuerst.
- [ ] Messpunkte speichern echte Erfassungszeit, Alter, Quelle, Followerstand und nur gelieferte Metriken. Fehlende Plays/Views/Likes/Comments sind unbekannt, keine Null.
- [ ] Retries desselben logischen Runs erzeugen pro Reel genau einen Messpunkt. Sinkende Zähler bleiben als gemeldete Korrektur sichtbar; Teilfehler erhalten den letzten gültigen Stand.
- [ ] Manueller und geplanter Lauf teilen die Anwendungsschnittstelle; normale Creator-Cursor, Transkripte und Saved-Marken werden nicht verändert. Kostenbudget, Mengenlimit und Nutzung sind sichtbar.
- [ ] UI zeigt Verlauf, letzten Messzeitpunkt, ausstehend/veraltet/fehlgeschlagen und manuelle Aktualisierung. Messfensterwerte werden nur aus tatsächlich passenden Beobachtungen gebildet.
- [ ] Tests prüfen ein älteres Reel außerhalb Delta, 24-Stunden-/Wochenfenster ohne Messung, fehlende Werte, echte Null, doppelte Antwort, Sinkwert, Teilfehler und Limits; keine Provideraufrufe in der Demo.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


# 07: Ähnliche Creator aus ausgewählten Seeds entdecken

**What to build:** Chris startet eine begrenzte Suche nach ähnlichen Creatorn und sieht nachvollziehbare Vorschläge samt Ausgangs-Creator.

**Blocked by:** [P4-06: Hashtag-Autoren und starke Reel-Funde als Kandidaten bewerten](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/06-hashtag-kandidaten-anreichern.md>)

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Vor Implementierung wird die aktuelle Provider-Fähigkeit anhand offizieller Dokumentation und einer normalisierten Fixture geprüft; keine unbestätigten Antwortfelder werden vorausgesetzt.
- [ ] Die Aktion zeigt Seeds und Grenzen vor dem Lauf. Der Discovery-Adapter liefert nur normalisierte Kandidaten mit Herkunft, keine Providerobjekte.
- [ ] Eine Ebene ähnlicher Creator wird gelesen; keine rekursive Ausweitung. Kandidaten benutzen denselben Schlüssel, dieselbe Review-Liste und dieselbe Anreicherung aus Ticket 06.
- [ ] Leere oder fehlende relatedProfiles melden keine Vorschläge geliefert. Providerfehler sind davon unterscheidbar und überschreiben keine vorhandenen Kandidaten.
- [ ] Bereits getrackte und verworfene Creator werden erkannt. Ein neuer Quellenfund setzt keine menschliche Entscheidung zurück.
- [ ] Run protokolliert Anfrageumfang, Ergebnisse und Nutzung; Budget und Mengenlimit gelten vor weiterer Anreicherung.
- [ ] Tests decken leere/abweichende Antworten, doppelte Seeds, Wiederholung, Quellenbezug und ausbleibende automatische Aufnahme ab. Demo enthält einen leeren Suchlauf.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


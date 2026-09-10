# 02: Pattern-Kandidaten mit geprüfter Vergleichsgruppe vorschlagen

**What to build:** Chris sieht aus mehreren Volltranskripten abgeleitete Strukturhypothesen mit Leistungsbelegen und einer vergleichbaren Gruppe ohne dieses Pattern.

**Blocked by:** [P4-01: Volltranskript in der Reel-Ansicht analysieren](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/01-volltranskript-analyse.md>)

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Ein Pattern-Vergleich prüft dieselbe gespeicherte Definition explizit auf Vorhandensein oder Abwesenheit. Nicht analysiert, unvollständig und veraltet sind unbekannt, nicht negativ.
- [ ] Konfigurierbare Startwerte aus der Spec: fünf Beleg-Reels aus drei Creatorn und fünf negative Vergleichs-Reels; unter der Grenze bleibt der Befund eine unzureichend belegte Hypothese.
- [ ] Vergleich trennt Sprachmarkt, Nischenklasse, Topic, Veröffentlichungsaltersgruppe und Owned Creators; Fenster, Stichproben, Erfassungszeit und ausgeschlossene Daten sind sichtbar.
- [ ] Beide Gruppen zeigen Reel-Links, Fundstellen, Outlier-Median und Differenz. Nur positive Differenz mit erfüllter Basis erzeugt einen Kandidaten; keine Kausalitätsbehauptung.
- [ ] Chris kann fehlende Vergleichs-Reels einzeln über die vorhandene manuelle Transkriptaktion ergänzen. Ohne bewusste Auswahl erfolgt kein kostenpflichtiger Vergleichs-Backfill.
- [ ] Kandidaten und Vergleichsläufe sind persistiert, begrenzt und über Definition/Datenbasis idempotent; erneuter Lauf erhöht Belegzahlen nicht durch Duplikate.
- [ ] Tests prüfen Grenzen, doppelte Reels, nur einen Creator, fehlende Follower, echte Null, unbekannte Abwesenheit, positive/negative Differenz und Markttrennung; Demo zeigt beide Evidenzzustände.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


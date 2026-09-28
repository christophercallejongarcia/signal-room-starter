# 03: Pattern bestätigen, umbenennen, zusammenführen und verwerfen

**What to build:** Chris führt eine kuratierte Pattern-Bibliothek und kann jede Entscheidung anhand der Belege wieder nachvollziehen.

**Blocked by:** [P4-02: Pattern-Kandidaten mit geprüfter Vergleichsgruppe vorschlagen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/02-pattern-kandidaten-vergleich.md>)

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Kandidatenkarte und Detailansicht zeigen Definition, Vergleich, Belege und getrennte Aktionen Bestätigen, Umbenennen, Zusammenführen und Verwerfen.
- [ ] Nur eine menschliche Entscheidung setzt confirmed; jeder Übergang prüft erwartete Revision und speichert Zeitpunkt sowie vorherigen Stand.
- [ ] Zusammenführen dedupliziert Belege, erhält die alte ID als Alias und verweist auf genau ein Ziel. Selbstbezüge und Alias-Zyklen werden abgelehnt.
- [ ] Identisch verworfene Kandidaten erscheinen bei Wiederholung nicht neu. Eine bewusste Neubewertung mit neuer Evidenz bleibt möglich.
- [ ] Veraltete oder entfallene Belege werden sichtbar; frühere Freigaben und später referenzierte Pattern-Revisionen werden nicht rückwirkend verändert.
- [ ] Bestehende Format Signals und Format-Review behalten ihre Hook-Taxonomie; die neue Bibliothek ist als eigener Bereich darin erkennbar.
- [ ] Tests prüfen Kuration, konkurrierende Änderung, Merge-Kette, Zyklen, Duplikate, Wiederholung und fehlende Belege. Demo enthält Kandidat, bestätigtes, verworfenes und zusammengeführtes Pattern.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


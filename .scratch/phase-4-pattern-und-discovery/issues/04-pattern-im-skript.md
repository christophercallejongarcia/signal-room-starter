# 04: Bestätigte Pattern im Skriptstudio verwenden

**What to build:** Chris wählt bestätigte Pattern als Strukturhilfe für Hook und Draft und kann anschließend nachvollziehen, welche Pattern-Fassung verwendet wurde.

**Blocked by:** [P4-03: Pattern bestätigen, umbenennen, zusammenführen und verwerfen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/03-pattern-kuration.md>)

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Script-Auswahl zeigt bestätigte Pattern mit Belegen; Auswählen und Abwählen bleibt optional und vom bestehenden PAS/BBB/none-Framework getrennt.
- [ ] Die Auswahl speichert Pattern-ID, Revision, Name, Struktur und Beleg-IDs am Script. Änderung erhöht die Skriptrevision und ist bei Approved erst nach Wiederöffnen erlaubt.
- [ ] Hook- und Draft-Läufe erhalten nur ausgewählte, begrenzte Pattern-Snapshots und gültige kanonische Beleg-IDs; unbekannte Antwortreferenzen werden verworfen beziehungsweise als ungültige Antwort abgelehnt.
- [ ] Ein späteres Umbenennen, Verwerfen oder Zusammenführen ändert einen historischen Script-Snapshot nicht; die Oberfläche weist auf einen neuen Bibliotheksstand hin.
- [ ] Ohne Pattern-Auswahl funktionieren bestehende Skripte und beide Generierungswege unverändert. Anti-Kopie-Prüfung, Hook-Treue und Storyboard-Freigabe bleiben aktiv.
- [ ] Tests prüfen bestätigte versus vorgeschlagene Pattern, gespeicherte Revision, gesperrtes Script, begrenztes Paket, unbekannte ID und unveränderten Legacy-Ablauf; Demo zeigt die Verwendung.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


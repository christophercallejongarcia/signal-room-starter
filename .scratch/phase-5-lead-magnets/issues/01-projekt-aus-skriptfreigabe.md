# 01: Lead Magnet aus einer archivierten Skriptfreigabe starten

**What to build:** Chris startet bewusst einen Lead Magnet an einem Approved-Skript und findet ein dauerhaft mit genau dieser Skriptfassung verbundenes Research-Projekt.

**Blocked by:** Keine offenen Implementierungstickets. Das bereits umgesetzte Skriptstudio ist die Grundlage.

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Neue Skriptfreigabe speichert idempotent einen unveränderlichen ApprovedScriptSnapshot mit Abschnitten, Hook/Angle, Framework, Belegen und optionalen Pattern-Snapshots.
- [ ] Ein bereits aktuell freigegebenes Skript kann beim ersten Start archiviert werden. Verlorene historische Fassungen werden nicht erfunden.
- [ ] Lead Magnet erstellen prüft den aktuellen Approved-Stand atomar und erzeugt genau ein aktives Projekt je Produktionsvorhaben; Doppelklick öffnet dasselbe Projekt.
- [ ] Lead-Magnets-Hauptbereich und Detailansicht zeigen Quellfassung, Forschungsfrage, Nutzenversprechen, Status und nächste Aktion. Entwürfe sind bearbeitbar und nach Neuladen erhalten.
- [ ] Wiederöffnen des Scripts verändert den Snapshot nicht. Neue Skriptfassung übernehmen ist ausdrücklich, zeigt den Unterschied und entwertet nachgelagerte Freigaben.
- [ ] Das additive Modell erlaubt fehlende Pattern und fehlende PDF. Phase 4 ist kein Blocker; die gemeinsame Snapshot-Grenze ist später auch ohne Lead Magnet für Publications nutzbar.
- [ ] Tests prüfen Start-Gate, Revisionskonflikt, Doppelklick, aktuelle Alt-Freigabe und unveränderliche Historie; Demo zeigt Projektstart ohne Bridge.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


# Weiterarbeit: Phasen 4 bis 6

Stand: 2026-09-10. Drei Specs, 27 Umsetzungstickets. Diese Runde erstellt Planung und Tracker-Dateien; sie implementiert keine Produktfunktion und führt keine Discovery-, Vault- oder ManyChat-Aktion aus.

## Ausgangslage

Das Skriptstudio ist laut allen sechs Phase-3-Tickets erledigt und im aktuellen Code vorhanden. Transkriptstatus, manuelle Versuche, Arbeitsfassung und Wörterbuch sind ebenfalls implementiert. Das Wörterbuch-Ticket steht noch auf ready-for-agent; diese Statusabweichung ist keine Aufforderung, die Funktion doppelt zu bauen. Ältere Ist-Befunde vom 31. August gelten nicht als aktueller Datenbankstand.

Die vorhandenen Format Signals analysieren den gesprochenen Einstieg mit Caption-Fallback. Sie sind keine vollständige Pattern-Bibliothek. Creator-Discovery liegt bisher als Research-Dossier und Importskript vor. Owned Creators sind bereits vorhanden, aber es fehlen Publikationszuordnung und Messhistorie. Lead-Magnet-Projekte und ManyChat-Pakete existieren noch nicht im Datenvertrag.

## Specs und Tickets

| Phase | Spec | Ticketübersicht | Anzahl |
| --- | --- | --- | ---: |
| 4: Pattern und Discovery | [Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>) | [Tickets und Einstieg](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/README.md>) | 9 |
| 5: Lead Magnets | [Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>) | [Tickets und Einstieg](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/README.md>) | 10 |
| 6: Performance und ManyChat | [Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>) | [Tickets und Einstieg](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/README.md>) | 8 |

## Empfohlene Reihenfolge

1. **P4-01 starten.** Ein vollständig analysiertes Reel mit überprüfbaren Fundstellen ist die erste Abnahme. Danach P4-02 bis P4-04: Vergleich, menschliche Kuration und Verwendung im Skript.
2. P4-05 und P4-06 erschließen die vorhandenen Dossiers und frische Stichproben. Danach ist P4-09 für bewusste Watchlist-Aufnahmen möglich. P4-07/P4-08 ergänzen neue Suchwege nacheinander über denselben Discovery-Adapter. Die Audits haben Vorrang vor älteren Tabellenempfehlungen.
3. **P5-01 als nächste gemeinsame Grundlage.** Es liefert Lead-Magnet-Projekt und unveränderliche Script-Snapshots. Kernpfad: P5-02 → P5-06 → P5-07 → P5-09 → P5-10. P5-08 kann direkt nach P5-01 erfolgen und liefert die für den finalen Export erforderliche CTA-Entscheidung.
4. P5-03 → P5-04 → P5-05 ergänzen bewusstes Vault-Lesen, EA Brain und die bestätigte Wissensablage. Fehlende Community-Treffer sollen den Kernpfad nicht blockieren. Diese Tickets sind für den vollständigen Phasenumfang trotzdem erforderlich.
5. P6-01 → P6-02 erfasst eigene Veröffentlichungen und ihre Messhistorie. Technisch reicht dafür P5-01; wer schon Reels veröffentlicht, kann diesen Teil vor dem vollständigen PDF-Ausbau umsetzen, damit Messzeitpunkte nicht verloren gehen. P6-03 ergänzt Learnings und braucht P4-04. P6-04 ergänzt die eigene Stimme unabhängig von der statistischen Mindestbasis.
6. P6-05 bereitet das ManyChat-Paket nach P5-08 vor. P6-06 benötigt zusätzlich Publication aus P6-01 und freigegebene PDF aus P5-10. Danach folgen Paketexport/Testprotokoll P6-07 und manuelle Kampagnenergebnisse P6-08.

Die bestätigte fachliche Reihenfolge bleibt Phase 4 → Phase 5 → Phase 6. Die Ticketkanten zeigen zusätzlich, welche Arbeit technisch früher beginnen kann. Es besteht kein Auftrag, mehrere Implementierungen oder Agenten gleichzeitig zu starten.

## Entscheidungen und Arbeitsannahmen

| Punkt | Behandlung im Plan |
| --- | --- |
| Mindestbelege für neue Pattern | Vorläufig fünf Reels aus drei Creatorn plus fünf geprüft negative Vergleichs-Reels. Konfigurierbar, keine bereits bestätigte Produktentscheidung. |
| Fehlendes Volltranskript | Unbekannt, niemals automatischer Beleg für Pattern-Abwesenheit. |
| Creator-Zielgröße | 20 bis 30 als Orientierung. Keine automatische Aufnahme, Löschung oder erzwungene Reduktion bestehender Watchlist. |
| DE-/EN-Research | Spätere Nischen-Audits und datierte Zahlen erhalten; Markt und fremde Nische getrennt. |
| Script-Historie | Neue unveränderliche Freigabe-Snapshots in P5-01, gemeinsam für PDF und spätere Publication. |
| Pattern bei Lead Magnets | Optional. Phase 5 wartet technisch nicht auf alle Phase-4-Tickets. |
| PDF-CTA | Je Guide entschieden; none ist gültig. Undecided blockiert nur den finalen Export. |
| PDF-Design | Eine erste modulare A4-Variante als Arbeitsannahme. Weitere Varianten bleiben offen. |
| Eigene Kennzahlen | Gezielte Reel-Abfrage zusätzlich zum Delta-Refresh. Keine rückgerechneten historischen Messpunkte. |
| Monatliche Learnings | Ab zehn belegten Publications; zusätzliche Mindestgröße je Vergleichsgruppe. Cloud berechnet, lokaler Bridge formuliert. |
| ManyChat | Versionierter lokaler Handoff. Kein Hosting, kein Versand und keine Konfiguration. |

## Konkrete Stolperstellen aus dem Bestand

- Hermes verwendet in den Produktionsunterlagen sowohl SYSTEM als auch JARVIS. Eine Handoff-Freigabe muss eine eindeutige Wahl erzwingen; das gesperrte Script darf dabei nicht still geändert werden.
- Die fünf CTA-Pakete sind Referenzfälle, keine jetzt zu erzeugenden PDFs. Technische Behauptungen benötigen weiterhin passende Primärbelege; Reichweite eines Reels ist dafür kein Nachweis.
- Der öffentliche PDF-Link entsteht nach einer menschlichen Bereitstellung. Ein lokaler Download oder Vault-Pfad reicht ManyChat nicht. P6-06 vergleicht die erreichbaren Bytes mit der freigegebenen PDF.
- Die aktuelle ManyChat-Quick-Automation-Hilfe enthält widersprüchliche Aussagen zu E-Mail ohne Opening DM. Der Plan unterstützt bewusst den beschlossenen Flow mit Opening DM und kennzeichnet den Quellenstand in der Spec.
- AGENTS verlangt Coral, aktuelle CSS-Tokens enthalten Lime. Neue UI folgt der Nutzerregel; ein globales Redesign ist nicht Teil dieser Planung.
- README enthält noch die ältere Aussage, dass die gesamte Scratch-Ablage ignoriert sei. Tracker-Regeln, ADR-Nachtrag und aktuelle Gitignore zeigen: Specs/Tickets sind versionierbar, nur AFK-Logs bleiben ignoriert. Bestehende Eltern-Tickets werden in dieser Runde nicht geschlossen oder umgeschrieben.

## Testgrenzen und Abschluss

Jedes Ticket schneidet einen bedienbaren Ablauf einschließlich Persistenz und Tests. Bestehende Anwendungsfalltests mit Fake-Storage, Fake-Bridge und Fake-Connector sind die Hauptgrenze. Neue atomare Convex-Funktionen folgen zusätzlich den generierten Testvorgaben. Freigaben, Belegauflösung und ausbleibende ungewollte Außenwirkung werden geprüft. UI und PDF benötigen eine konkrete visuelle Abnahme.

Status ready-for-agent bedeutet ausreichend ausformuliert, nicht ohne Blocker startbar und nicht erledigt. Externe Laufzeitvoraussetzungen sind von Code-Abhängigkeiten getrennt. Echte eigene Performance verlangt veröffentlichte Reels; die Implementierung kann mit synthetischen Fixtures abgenommen werden. Ein echter Instagram-Test bleibt eine spätere menschliche Aktion.

## Prüfung dieser Planungsrunde

Am 2026-09-10 bestanden: `npm run check` mit Typprüfung, 428 Tests und Produktionsbuild. Zusätzlich geprüft: alle lokalen Links der 34 erstellten beziehungsweise aktualisierten Planungsdateien, Pflichtfelder der 27 Tickets und der Abhängigkeitsgraph mit 29 Kanten ohne Zyklus. `git diff --check` meldet keine Fehler.

Diese Prüfung bestätigt die Planungskonsistenz und den unveränderten aktuellen Produktstand. Die neuen Funktionen sind noch nicht implementiert oder live abgenommen. Die bestehenden Research-Dossiers, das Importskript und ältere Tickets wurden nicht verändert.

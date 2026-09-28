# Phase 6: Eigene Performance und ManyChat-Übergabe

Stand: 2026-09-10. Spezifiziert, Implementierung offen. 8 Tickets mit Status `ready-for-agent`.

Eigene veröffentlichte Reels werden mit ihrer tatsächlichen Produktionsfassung verbunden und gezielt gemessen. Ein separates ManyChat-Paket bereitet die menschliche Einrichtung vor.

[Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>) · [Phasenübergreifende Reihenfolge](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/PHASEN-4-BIS-6.md>)

## Einstieg

P6-01 beginnt nach P5-01. Die Paketvorbereitung P6-05 kann unabhängig von der Performance nach P5-08 beginnen. P6-06 verbindet beide Pfade und benötigt zusätzlich P5-10.

`ready-for-agent` bedeutet ausformuliert. Ein Ticket darf erst starten, wenn seine verlinkten Blocker erledigt sind. Unabhängige Pfade dürfen nacheinander in beliebiger Reihenfolge abgearbeitet werden; die Nummerierung erzeugt keine zusätzlichen Abhängigkeiten.

## Tickets

| Ticket | Ergebnis | Blockiert durch |
| --- | --- | --- |
| [P6-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/01-publication-zuordnung.md>) | Eigene Veröffentlichung mit der verwendeten Skriptfassung verbinden | [P5-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/01-projekt-aus-skriptfreigabe.md>) |
| [P6-02](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/02-eigene-messhistorie.md>) | Auch ältere eigene Reels gezielt messen und den Verlauf zeigen | [P6-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/01-publication-zuordnung.md>) |
| [P6-03](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/03-eigene-performance-learnings.md>) | Eigene Ergebnisse vergleichen und monatliche Learnings ableiten | [P6-02](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/02-eigene-messhistorie.md>), [P4-04](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/04-pattern-im-skript.md>) |
| [P6-04](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/04-sprachprofil-aus-publikationen.md>) | Sprachprofil ausschließlich aus veröffentlichten Skripten aktualisieren | [P6-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/01-publication-zuordnung.md>) |
| [P6-05](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/05-manychat-paket-entwurf.md>) | ManyChat-Übergabe mit konkreter Nachrichtenfolge vorbereiten | [P5-08](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/08-cta-und-keyword.md>) |
| [P6-06](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/06-manychat-validierung.md>) | Keyword, öffentliche PDF-Version und Kanalgrenzen prüfen | [P6-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/01-publication-zuordnung.md>), [P6-05](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/05-manychat-paket-entwurf.md>), [P5-10](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/10-pdf-freigabe-und-export.md>) |
| [P6-07](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/07-manychat-export-und-testprotokoll.md>) | Freigegebenes Paket exportieren und externen Test dokumentieren | [P6-06](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/06-manychat-validierung.md>) |
| [P6-08](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/08-manychat-aggregierte-ergebnisse.md>) | Aggregierte ManyChat-Ergebnisse am eigenen Reel ergänzen | [P6-07](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/07-manychat-export-und-testprotokoll.md>) |

## Phasenabnahme

Eigene Messwerte und Learnings bleiben zur verwendeten Skriptfassung rückverfolgbar. Eine freigegebene PDF und ein veröffentlichtes Owned Reel ergeben ein geprüftes exportierbares ManyChat-Paket. Externe Tests/Aktivierung bleiben getrennt dokumentiert.

Pro Ticket: erforderliche Tests, Convex-Abnahme der neuen Speichergrenze, Demo ohne Credentials, mobile Zustände und `npm run check`. Reale kostenpflichtige Läufe, Veröffentlichung, Versand und Änderungen an fremden Systemen sind keine implizite Folge eines Implementierungstickets.

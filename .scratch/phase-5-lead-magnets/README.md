# Phase 5: Lead Magnets

Stand: 2026-09-10. Spezifiziert, Implementierung offen. 10 Tickets mit Status `ready-for-agent`.

Ein bewusst gewähltes freigegebenes Skript führt über geprüftes Research und bearbeitbare Module zu einer individuell freigegebenen PDF.

[Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>) · [Phasenübergreifende Reihenfolge](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/PHASEN-4-BIS-6.md>)

## Einstieg

P5-01 schafft das Projekt und den gemeinsamen unveränderlichen Script-Snapshot. Phase 4 ist dafür kein technischer Blocker. Der Kernpfad ist P5-01 → P5-02 → P5-06 → P5-07 → P5-09 → P5-10; P5-08 liefert die zusätzlich benötigte CTA-Entscheidung.

`ready-for-agent` bedeutet ausformuliert. Ein Ticket darf erst starten, wenn seine verlinkten Blocker erledigt sind. Unabhängige Pfade dürfen nacheinander in beliebiger Reihenfolge abgearbeitet werden; die Nummerierung erzeugt keine zusätzlichen Abhängigkeiten.

## Tickets

| Ticket | Ergebnis | Blockiert durch |
| --- | --- | --- |
| [P5-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/01-projekt-aus-skriptfreigabe.md>) | Lead Magnet aus einer archivierten Skriptfreigabe starten | Keine offenen Tickets |
| [P5-02](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/02-primaerquellen-dossier.md>) | Primärquellen als prüfbares Research-Dossier erfassen | [P5-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/01-projekt-aus-skriptfreigabe.md>) |
| [P5-03](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/03-vault-recherche.md>) | Community-Wissen bewusst aus dem Vault recherchieren | [P5-02](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/02-primaerquellen-dossier.md>) |
| [P5-04](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/04-ea-brain-recherche.md>) | Aktuelle Research-Lücken über EA Brain ergänzen | [P5-03](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/03-vault-recherche.md>) |
| [P5-05](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/05-community-notiz-ablage.md>) | Geprüftes Community-Wissen in einer Themennotiz ergänzen | [P5-04](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/04-ea-brain-recherche.md>) |
| [P5-06](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/06-research-freigabe.md>) | Dossier und Gliederung vor dem Text freigeben | [P5-02](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/02-primaerquellen-dossier.md>) |
| [P5-07](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/07-modularer-inhaltseditor.md>) | Freigegebenes Research in einen modularen Guide entwickeln | [P5-06](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/06-research-freigabe.md>) |
| [P5-08](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/08-cta-und-keyword.md>) | PDF-CTA und Kommentar-Keyword bewusst festlegen | [P5-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/01-projekt-aus-skriptfreigabe.md>) |
| [P5-09](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/09-pdf-vorschau-und-layoutpruefung.md>) | Individuelle PDF-Vorschau mit Layoutbericht erzeugen | [P5-07](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/07-modularer-inhaltseditor.md>) |
| [P5-10](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/10-pdf-freigabe-und-export.md>) | Geprüfte PDF-Version freigeben und lokal exportieren | [P5-08](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/08-cta-und-keyword.md>), [P5-09](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/09-pdf-vorschau-und-layoutpruefung.md>) |

## Phasenabnahme

Research und Gliederung wurden getrennt von der finalen PDF freigegeben. Export liefert exakt die geprüften Bytes. Vault- und EA-Brain-Pfade funktionieren bewusst und mit nachvollziehbarer interner Herkunft.

Pro Ticket: erforderliche Tests, Convex-Abnahme der neuen Speichergrenze, Demo ohne Credentials, mobile Zustände und `npm run check`. Reale kostenpflichtige Läufe, Veröffentlichung, Versand und Änderungen an fremden Systemen sind keine implizite Folge eines Implementierungstickets.

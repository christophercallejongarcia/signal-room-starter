# Phase 4: Pattern-Bibliothek und Creator-Discovery

Stand: 2026-09-10. Spezifiziert, Implementierung offen. 9 Tickets mit Status `ready-for-agent`.

Aus vollständigen Transkripten werden belegte und menschlich bestätigte Pattern. Neue Creator landen zunächst in einer prüfbaren Kandidatenliste.

[Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>) · [Phasenübergreifende Reihenfolge](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/PHASEN-4-BIS-6.md>)

## Einstieg

P4-01 startet die Inhaltsanalyse. P4-05 kann unabhängig davon mit der Kandidatenliste beginnen. Beide brauchen weder Phase 5 noch Phase 6.

`ready-for-agent` bedeutet ausformuliert. Ein Ticket darf erst starten, wenn seine verlinkten Blocker erledigt sind. Unabhängige Pfade dürfen nacheinander in beliebiger Reihenfolge abgearbeitet werden; die Nummerierung erzeugt keine zusätzlichen Abhängigkeiten.

## Tickets

| Ticket | Ergebnis | Blockiert durch |
| --- | --- | --- |
| [P4-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/01-volltranskript-analyse.md>) | Volltranskript in der Reel-Ansicht analysieren | Keine offenen Tickets |
| [P4-02](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/02-pattern-kandidaten-vergleich.md>) | Pattern-Kandidaten mit geprüfter Vergleichsgruppe vorschlagen | [P4-01](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/01-volltranskript-analyse.md>) |
| [P4-03](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/03-pattern-kuration.md>) | Pattern bestätigen, umbenennen, zusammenführen und verwerfen | [P4-02](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/02-pattern-kandidaten-vergleich.md>) |
| [P4-04](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/04-pattern-im-skript.md>) | Bestätigte Pattern im Skriptstudio verwenden | [P4-03](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/03-pattern-kuration.md>) |
| [P4-05](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/05-creator-kandidaten-inbox.md>) | Creator-Kandidaten aus manueller Auswahl und Dossiers prüfen | Keine offenen Tickets |
| [P4-06](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/06-hashtag-kandidaten-anreichern.md>) | Hashtag-Autoren und starke Reel-Funde als Kandidaten bewerten | [P4-05](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/05-creator-kandidaten-inbox.md>) |
| [P4-07](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/07-aehnliche-creator.md>) | Ähnliche Creator aus ausgewählten Seeds entdecken | [P4-06](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/06-hashtag-kandidaten-anreichern.md>) |
| [P4-08](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/08-themen-reel-suche.md>) | Creator über Themen und Reel-Suche entdecken | [P4-07](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/07-aehnliche-creator.md>) |
| [P4-09](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/09-watchlist-aufnahme.md>) | Geprüfte Kandidaten idempotent in die Watchlist aufnehmen | [P4-05](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/05-creator-kandidaten-inbox.md>), [P4-06](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/06-hashtag-kandidaten-anreichern.md>) |

## Phasenabnahme

Ein bestätigtes Pattern ist im Skriptstudio mit Belegen verwendbar. Ein geprüfter Creator kann ohne doppelte Backfills in die Watchlist aufgenommen werden. Alle Discovery-Quellen und Zustände sind abgenommen.

Pro Ticket: erforderliche Tests, Convex-Abnahme der neuen Speichergrenze, Demo ohne Credentials, mobile Zustände und `npm run check`. Reale kostenpflichtige Läufe, Veröffentlichung, Versand und Änderungen an fremden Systemen sind keine implizite Folge eines Implementierungstickets.

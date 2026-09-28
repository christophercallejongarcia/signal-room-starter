# 08: PDF-CTA und Kommentar-Keyword bewusst festlegen

**What to build:** Chris entscheidet über das Angebot in der PDF und das Kommentar-Keyword für ihre Auslieferung und erhält getrennte CTA-Entwürfe.

**Blocked by:** [P5-01: Lead Magnet aus einer archivierten Skriptfreigabe starten](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/01-projekt-aus-skriptfreigabe.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] PDF-CTA hat undecided, none oder offer mit Text/Ziel/validierter URL. Undecided blockiert nur finalen Export, nicht Research oder Inhaltsarbeit.
- [ ] Drei kurze Keyword-Vorschläge oder eigene Eingabe stehen zur Wahl; genau ein primäres Keyword ist aktiv und wird mit Materialversprechen gespeichert.
- [ ] PDF-Angebots-CTA, gesprochener Skript-CTA, Caption-Entwurf und Kommentar-CTA sind getrennte Felder; die Oberfläche zeigt die aktuelle Skriptfassung neben dem Vorschlag.
- [ ] Keyword-/Textänderung editiert kein Approved-Skript. Die UI führt zu Wiederöffnen, neuer Freigabe und bewusster Snapshot-Übernahme; SYSTEM/JARVIS dient als Konfliktfall.
- [ ] Kein CTA ist eine gültige PDF-Entscheidung und schaltet keine fiktive Angebotsschaltfläche ein. Platzhalter bleiben für den finalen Export gesperrt.
- [ ] CTA-Änderungen erhalten eine Revision und entwerten vorhandene PDF-/Handoff-Freigaben; ein späteres Paket liest die gespeicherte Wahl.
- [ ] Tests prüfen alle CTA-Zustände, ungültige URL, leere Platzhalter, Keyword-Auswahl, Script-Lock und Revisionsänderung; Demo macht beide Entscheidungen getrennt bedienbar.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


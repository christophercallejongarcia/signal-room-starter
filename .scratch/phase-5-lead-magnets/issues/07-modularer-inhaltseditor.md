# 07: Freigegebenes Research in einen modularen Guide entwickeln

**What to build:** Chris generiert aus freigegebenem Research einen individuellen Lead-Magnet-Entwurf und bearbeitet dessen Module mit nachvollziehbaren Quellenbezügen.

**Blocked by:** [P5-06: Dossier und Gliederung vor dem Text freigeben](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/06-research-freigabe.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Texterstellung ist nur für aktuell freigegebenes Dossier und Gliederung erlaubt. Sie nutzt den vorhandenen lokalen Bridge mit begrenztem Paket ohne Netz.
- [ ] Bearbeitbare Module umfassen Nutzen, Quickstart, Schritte, Praxisbeispiel, Screenshot, Code/Prompt, Vergleich, Checkliste, Nugget, Hinweis und CTA. Reihenfolge und Inhaltsrevision bleiben gespeichert.
- [ ] Modellantworten können nur bekannte Finding-/Quellen-IDs referenzieren; unbelegte technische Ergänzungen sind vor Export zu klären. Manuelle neue Sachbehauptungen werden ebenfalls geprüft.
- [ ] Keine Community-Attribution und keine unbestätigte persönliche Erfahrung werden als öffentliche Aussage übernommen. Interne Provenienz bleibt in der Research-Ansicht sichtbar.
- [ ] Ein Claim mit erwarteter Revision verhindert Überschreiben gleichzeitiger Bearbeitung; längere Guides entstehen in begrenzten Abschnitten mit erkennbarem Fortschritt.
- [ ] Die Leseansicht folgt denselben Modulen. Änderungen entwerten PDF-Prüfungen; reine Formulierungskorrekturen ohne neue Fakten entwerten nicht unnötig die Research-Freigabe.
- [ ] Tests prüfen fehlendes Gate, gültige Belege, erfundene IDs, neue Claims, Teilfehler und konkurrierenden Edit. Demo zeigt mehrere Modultypen ohne Bridge.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


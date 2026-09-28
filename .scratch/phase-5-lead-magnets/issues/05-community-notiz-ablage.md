# 05: Geprüftes Community-Wissen in einer Themennotiz ergänzen

**What to build:** Chris prüft eine konkrete Vorschau und ergänzt ausgewertetes Community-Wissen als datierten Abschnitt einer kanonischen Vault-Notiz.

**Blocked by:** [P5-04: Aktuelle Research-Lücken über EA Brain ergänzen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/04-ea-brain-recherche.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Die Aktion zeigt Zielnotiz und exakten Anhang mit Forschungsfrage, Tenor, Nuggets, relevanten Hinweisen, verworfenen Aussagen und internen Belegen.
- [ ] Nur die menschliche Bestätigung der Vorschau schreibt. Der kanonische Themen-/Repository-Schlüssel findet eine vorhandene Notiz oder legt eine neue im erlaubten Bereich an.
- [ ] Research-Lauf-ID und Anhang-Hash verhindern doppelte Einträge nach Retry; die bestehende Notiz und ihre manuellen Abschnitte bleiben erhalten.
- [ ] Ändert sich die Notiz nach der Vorschau, fordert die App eine erneute Prüfung des konkreten Diffs statt den fremden Stand zu überschreiben.
- [ ] Der lokale Schreibadapter begrenzt Zielnamen und Inhalte, verhindert Pfad-/Symlink-Ausbruch und verändert kein Community-Rohmaterial.
- [ ] Ein Ablagefehler ist unabhängig vom Dossierstatus; erneuter Versuch bleibt möglich. Öffentliche Quellen werden nicht ungefragt zu Community-Wissensnotizen.
- [ ] Tests mit temporärem synthetischem Vault prüfen Vorschau ohne Write, bewussten Anhang, Deduplizierung, konkurrierende Bearbeitung und sichere Zielauflösung.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


# 03: Community-Wissen bewusst aus dem Vault recherchieren

**What to build:** Chris sucht aus dem Lead-Magnet-Dossier gezielt im ausgewerteten Vault-Wissen und übernimmt nur selbst gewählte Findings.

**Blocked by:** [P5-02: Primärquellen als prüfbares Research-Dossier erfassen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/02-primaerquellen-dossier.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Vault-Recherche startet ausschließlich über eine eigene Aktion mit sichtbarer Forschungsfrage. Öffnen, Refresh oder normale Texterstellung starten keinen Scan.
- [ ] Ein lokaler Vault-Leseadapter arbeitet nur in konfigurierten Wissensbereichen und liefert begrenzte Treffer mit internem Notiz-/Post-Bezug und Datum.
- [ ] Auswahl eines Treffers erzeugt ein intern belegtes Finding; kein Rohpost und keine Mitgliederdaten werden automatisch zum öffentlichen Dokumentinhalt.
- [ ] Bestehende kanonische Themennotizen werden erkennbar wiederverwendet. Das Dossier hält getrennt, ob ein Fund aus Vault oder öffentlicher Primärquelle stammt.
- [ ] Nicht verbundener Vault, keine Treffer und Lesefehler sind getrennte Zustände; Research kann mit Primärquellen fortgesetzt werden.
- [ ] Freie Browser-Dateipfade, Pfadflucht und Symlink-Ausbruch sind ausgeschlossen. Der Leseadapter schreibt weder Notizen noch Rohmaterial.
- [ ] Tests prüfen expliziten Start, begrenzte Suche, Trefferübernahme, keine Treffer, Zugriff außerhalb des Bereichs und ausbleibende Writes; Demo verwendet synthetische Vault-Treffer.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


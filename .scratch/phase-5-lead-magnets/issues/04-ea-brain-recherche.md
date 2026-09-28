# 04: Aktuelle Research-Lücken über EA Brain ergänzen

**What to build:** Chris ergänzt gezielt aktuelle Community-Findings über EA Brain und prüft sie im selben Dossier wie bestehende Vault-Funde.

**Blocked by:** [P5-03: Community-Wissen bewusst aus dem Vault recherchieren](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/03-vault-recherche.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Die separate EA-Brain-Lesefähigkeit nutzt die eigene Codex-OAuth-Verbindung mit mcp:read; es werden keine Claude-Zugangsdaten kopiert.
- [ ] Vor Umsetzung wird die tatsächlich verfügbare lokale MCP-Lesegrenze geprüft und dokumentiert. Der Browser und allgemeine Bridge-Textläufe erhalten keine freien MCP-/Netzwerkrechte.
- [ ] Ein bewusst gestarteter, begrenzter Suchlauf nennt Forschungsfrage, Quellenumfang und Ergebnisstand. Nur ausgewählte Findings werden übernommen.
- [ ] Resultate tragen interne Quellen-/Post-IDs und Datum; Deduplizierung berücksichtigt bereits vorhandene Vault-/Dossier-Belege.
- [ ] Verbindung fehlt, OAuth abgelaufen, keine Treffer und Providerfehler sind sichtbare unterschiedliche Zustände; fehlende Community-Ergebnisse blockieren keine belegte PDF.
- [ ] Zugänge und rohe Auth-Fehler erscheinen weder in Convex-Inhaltsrecords, Browser, Logs mit Inhalten noch Git. Quellenmaterial bleibt untrusted input.
- [ ] Tests mit Fake-MCP prüfen Grenzen, Duplikate, Auswahl, Ausfall und ausbleibende externen Writes. Demo greift nie auf echte Community-Inhalte zu.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


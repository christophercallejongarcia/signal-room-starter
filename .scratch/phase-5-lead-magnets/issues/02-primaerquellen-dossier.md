# 02: Primärquellen als prüfbares Research-Dossier erfassen

**What to build:** Chris baut ein quellenbasiertes Dossier aus bewusst ausgewählten offiziellen Dokumentationen und Repository-Seiten und sieht belegte Findings sowie offene Aussagen.

**Blocked by:** [P5-01: Lead Magnet aus einer archivierten Skriptfreigabe starten](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/01-projekt-aus-skriptfreigabe.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Quellen werden vor Abruf als Liste ausgewählt; manueller Quellenbezug und begrenzter HTTPS-Abruf funktionieren über einen serverseitigen Research-Port.
- [ ] Quellen tragen Typ, kanonischen Bezug, öffentliche URL, Titel, Version/Commit soweit verfügbar, Prüfdatum, begrenzten Auszug und Sichtbarkeit.
- [ ] Findings tragen Aussage, praktischen Schritt, konkrete Quellenfundstelle, Prüfstatus und dokumentiert/persönlich getestet. Eine erfolgreiche URL-Prüfung allein bestätigt keine Behauptung.
- [ ] Primärquellen haben für technische Fakten Vorrang. Widersprüche und nicht belegte Funktionen werden sichtbar; ein eigenes Bewertungsschema kann ohne erfundenes Repository als eigene Redaktion erfasst werden.
- [ ] Private Netzadressen, gefährliche Weiterleitungen, übergroße Antworten, ausführbares HTML/Markdown und unbeschränkte Folgeabrufe sind ausgeschlossen. Keine Installation oder Ausführung von Repository-Code.
- [ ] Bridge-Synthese erhält nur begrenzte normalisierte Quellen. Unbekannte Quellen-IDs und erfundene Fundstellen werden abgelehnt; ein Fehler erhält vorhandenes Research.
- [ ] Tests prüfen Belegauflösung, Widerspruch, fehlende Primärquelle, private URL/Redirect, Größenlimit, Prompt-Injection und idempotenten Quellenbezug. Demo enthält einen bewusst unbelegten Claim.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


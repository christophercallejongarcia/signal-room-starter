# 09: Individuelle PDF-Vorschau mit Layoutbericht erzeugen

**What to build:** Chris rendert den Guide im gemeinsamen modularen Design und prüft alle Seiten sowie den automatischen Layoutbericht.

**Blocked by:** [P5-07: Freigegebenes Research in einen modularen Guide entwickeln](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/07-modularer-inhaltseditor.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Der Renderer erhält ausschließlich ein öffentliches Dokumentmodell; interne Community-Quelle, Mitgliedernamen, lokale Pfade und private Links sind weder Text noch Metadaten oder Asset-Beschriftung.
- [ ] Ein initiales lesbares A4-Markendesign mit Coral-Akzent unterstützt die Module aus dem Editor. Seitenzahl folgt dem Inhalt; Code, Tabellen, Screenshots und Diagramme bleiben lesbar.
- [ ] Renderer lädt nur geprüfte Assets und führt weder Quellcode noch beliebige Remote-Skripte aus. Schrift-/Renderer-/Designversion und Dokument-Hash sind am Artefakt gespeichert.
- [ ] Die interne Vorschau funktioniert bei noch offenem CTA und ist klar nicht final. PDF-Bytes und Assets liegen außerhalb von Git, Metadaten im operativen Store.
- [ ] Layoutbericht prüft Überlauf, abgeschnittene Inhalte, unlesbare Codeblöcke, fehlende Assets, fehlerhafte Links, leere Seiten und inkonsistente Elemente; unklare Umbrüche bleiben menschliche Prüfpunkte.
- [ ] Fertig gerenderte Seiten sind vollständig durchsehbar. Fehler zeigen betroffene Seite/Modul und eine erneute Renderaktion, ohne den Inhaltsentwurf zu verlieren.
- [ ] Tests rendern einen synthetischen mehrseitigen Guide mit langem Code, Tabelle und fehlendem Bild; Sicherheitsprüfung scannt öffentlichen Text/Metadaten/Links. Alle Seiten werden zusätzlich visuell geprüft.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


# 08: Creator über Themen und Reel-Suche entdecken

**What to build:** Chris sucht gezielt nach Themen und übernimmt Autoren relevanter Such-Reels in die gemeinsame Kandidatenliste.

**Blocked by:** [P4-07: Ähnliche Creator aus ausgewählten Seeds entdecken](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/07-aehnliche-creator.md>)

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Eine gesonderte Fähigkeit des bereits eingeführten Discovery-Adapters liest begrenzte Themen-/Reel-Suchergebnisse; offizielle Provider-Eingabe und -Antwort werden vor Umsetzung geprüft.
- [ ] Suchbegriff, Markt und ausgewiesene Seitengrenze sind validiert. Der Run zeigt aktive Suche, Teilergebnis, keine Treffer und Fehler.
- [ ] Treffer nennen Quell-Reel, Autor und Suchbegriff. Wiederholte starke Treffer erhöhen keine Rohzähler durch doppelte Reel-IDs und ersetzen keine Themenprüfung.
- [ ] EN-Recherche ist ein eigener Suchpfad; bestehender DE-Hashtag-Sweep und bisherige Markttrennung bleiben erhalten.
- [ ] Relevante unbekannte Creator werden in dieselbe Kandidatenliste aufgenommen; erst eine bewusste Anreicherung beziehungsweise Watchlist-Freigabe löst Folgeschritte aus.
- [ ] Mengen- und Kosten-Guards aus dem vorhandenen Discovery-Run gelten auch für Pagination; ein Fortsetzen ist bewusst und kann keine unbegrenzte Kette starten.
- [ ] Tests prüfen Suchvalidierung, Seitenlimit, Deduplizierung über mehrere Quellen, Marktgrenze und Providerfehler; Demo zeigt eine vollständige Suche bis zum Kandidaten.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


# Phase 4: Pattern-Bibliothek und Creator-Discovery

Status: ready-for-agent
Stand: 2026-09-10

## Problem Statement

Chris kann Reels transkribieren und daraus Skripte entwickeln. Format Signals klassifiziert aber nur den Einstieg. Wiederkehrende Spannungsbögen, Beweise, Übergänge und CTA-Platzierungen sind weder als belegte Pattern gespeichert noch im Skriptstudio auswählbar. Rising Creators zeigt bereits bekannte Creator. Neue Creator werden bisher außerhalb der App recherchiert und über ein Importskript aufgenommen.

Die vorhandenen DE- und EN-Dossiers zeigen zwei Probleme: Hohe Outlier bedeuten nicht automatisch Themenpassung; gepinnte alte Reels und kleine Stichproben verzerren Empfehlungen. Unanalysierte Transkripte dürfen außerdem nicht als Beleg für die Abwesenheit eines Patterns dienen.

## Solution

Die Reel-Ansicht bekommt eine belegte Inhaltsanalyse. Im Bereich Format Signals stehen daneben eine Pattern-Bibliothek und prüfbare Kandidaten. Chris bestätigt, benennt um, führt zusammen oder verwirft. Bestätigte Pattern können als Strukturhilfe in neue Skripte einfließen.

Creator-Discovery erhält eine getrennte Kandidatenliste aus manuellen Einträgen, bestehenden Dossiers, Hashtag-Funden, ähnlichen Creatorn und Reel-Suchen. Jede Empfehlung zeigt Themenpassung, mehrere Reels, Datenalter und nachvollziehbare Kennzahlen. Erst die Aufnahmeaktion startet Backfill und Daily Sweep. 20 bis 30 aktive Creator sind eine Zielgröße, keine automatische Auswahl oder Löschgrenze.

## User Stories

1. Als Chris will ich vollständige Transkripte auf PAS, BBB und bekannte Merkmale prüfen, damit ich den gesprochenen Aufbau verstehe.
2. Als Chris will ich Hook, Spannung, offene Schleifen, Beweise, Beispiele, Übergänge, Rhythmus und CTA getrennt sehen, damit ich gezielt Strukturen studiere.
3. Als Chris will ich zu jedem Befund eine echte Fundstelle öffnen, damit ich die Interpretation prüfen kann.
4. Als Chris will ich vorhandene Zeitmarken sehen, damit ich die Stelle im Reel wiederfinde.
5. Als Chris will ich Original und verwendete Arbeitsfassung unterscheiden, damit Korrekturen nachvollziehbar bleiben.
6. Als Chris will ich veraltete Analysen erkennen, damit ich nicht mit überholten Fundstellen arbeite.
7. Als Chris will ich Analysen nachholen und erneut versuchen, damit ein ausgeschalteter Bridge keine Reels dauerhaft überspringt.
8. Als Chris will ich übergreifende Pattern erst ab mehreren unabhängigen Belegen sehen, damit Einzelbeispiele keine Regel werden.
9. Als Chris will ich passende Reels ohne das Pattern vergleichen, damit ich die vermutete Wirkung einschätzen kann.
10. Als Chris will ich eine fehlende Vergleichsbasis erkennen, damit unvollständige Daten keine scheinbare Gewissheit erzeugen.
11. Als Chris will ich Vergleichs-Reels bewusst transkribieren, damit ich Evidenzlücken gezielt schließe.
12. Als Chris will ich ein Pattern bestätigen, umbenennen, zusammenführen oder verwerfen, damit die Bibliothek kuratiert bleibt.
13. Als Chris will ich frühere Pattern-Bezeichnungen und Belege wiederfinden, damit Zusammenführungen keine Historie verlieren.
14. Als Chris will ich ein bestätigtes Pattern im Skript wählen oder abwählen, damit ich seine Struktur bewusst teste.
15. Als Chris will ich Pattern und PAS/BBB getrennt wählen, damit eine beobachtete Struktur kein neues Framework vortäuscht.
16. Als Chris will ich manuelle Creator und Dossier-Funde prüfen, damit die bisherige Recherche nutzbar wird.
17. Als Chris will ich die späteren Nischen-Audits sehen, damit verworfene Empfehlungen nicht erneut oben erscheinen.
18. Als Chris will ich neue Creator aus Hashtags, ähnlichen Creatorn und Reel-Suchen finden, damit die Watchlist über bekannte Namen hinauswächst.
19. Als Chris will ich DE, EN und fremde Nischen getrennt betrachten, damit die Empfehlungen zur Zielgruppe passen.
20. Als Chris will ich Beispiel-Reels, Median, stärksten Outlier und Anteil starker Reels sehen, damit ich eine Aufnahme begründen kann.
21. Als Chris will ich Stichprobengröße, Alter und fehlende Werte erkennen, damit einzelne alte Treffer nicht als aktueller Erfolg gelten.
22. Als Chris will ich Kandidaten bestätigen, zurückstellen und ablehnen, damit allein meine Auswahl die Watchlist verändert.
23. Als Chris will ich bereits getrackte Creator erkennen, damit erneute Funde keinen zweiten Backfill auslösen.
24. Als Chris will ich nach einem fehlgeschlagenen Backfill gezielt fortsetzen, damit bereits erfolgreiche Schritte erhalten bleiben.
25. Als Chris will ich Kosten und begrenzte Suchläufe sehen, damit Discovery nicht unbegrenzt weiterläuft.
26. Als Chris will ich die Abläufe mit synthetischen Beispielen bedienen, damit ich keine Zugänge für die Demo brauche.

## Implementation Decisions

### Bestehendes erhalten

Phase 2 und Phase 3 liefern Transkript, Arbeitsfassung, Skriptstatus und Freigaben. Das Wörterbuch ist im Code vorhanden, obwohl sein Ticket noch offen ist. Es wird nicht erneut gebaut. Format Signals und monatlicher Format-Review behalten ihre bisherige Hook-Taxonomie und Kennzahlen. Neue Volltext-Pattern sind eigene Objekte. PAS, BBB und `none` bleiben die bestehenden Framework-Werte. Outlier und Channel-Relative behalten die Bedeutung aus ADR-0003.

### Inhaltsanalyse und Pattern

- Eine `TranscriptAnalysis` referenziert Signal-ID, verwendete Textfassung, Text-Hash, Analyseversion, Erstellzeit und Run. Befunde nennen Merkmal, Erklärung und eine wörtliche Fundstelle mit Zeichenpositionen. Zeitmarken werden ausschließlich aus belegten Segmenten übernommen. Bei nicht eindeutig zuordenbarer Arbeitsfassung bleibt die Zeitmarke leer.
- Bekannte Merkmale werden für jedes fertige Volltranskript zur Analyse vorgemerkt. Ein lokaler Worker verarbeitet begrenzte Batches über den bestehenden Bridge. Ein Cloud-Refresh darf Arbeit vormerken, kann aber den lokalen Bridge nicht aufrufen. Ohne lokalen Worker bleibt die Arbeit sichtbar ausstehend. Manueller Start und begrenztes Nachholen bestehender Transkripte verwenden denselben Lauf.
- Run-Zustände: `queued`, `running`, `complete`, `failed`; getrennt vom Transkriptstatus. Claim mit Ablaufzeit, begrenzte Versuche und expliziter Retry. Ein gleiches Signal mit gleichem Text-Hash und gleicher Analyseversion wird nicht doppelt analysiert. Ein spätes Ergebnis ersetzt keine neuere Fassung. Alte gültige Ergebnisse bleiben als veraltet lesbar.
- Modellantworten werden gegen erlaubte Merkmale und tatsächlich übergebene Textbereiche geprüft. Unbekannte IDs, erfundene Zitate und ungültige Positionen werden abgelehnt. Lange Texte werden in begrenzte Teile mit Originalpositionen zerlegt; unvollständige Analyse wird als solche ausgewiesen. Keine still gekürzte Analyse gilt als Volltextanalyse.
- Ein `Pattern` hat kanonische ID, Name, Definition, Strukturmerkmale, Status `candidate`, `confirmed`, `rejected` oder `merged`, Revision und menschliche Entscheidungen. Belege und Vergleichsläufe liegen separat, damit Listen nicht unbegrenzt in einem Convex-Dokument wachsen. Bestätigungen ersetzen keine Evidenzprüfung.
- Zusammenführen erhält die Quell-ID als Alias auf das Ziel. Selbstbezüge und Zyklen sind verboten; Belege werden nach Signal und Textfassung dedupliziert. Bestehende Skript-Snapshots bleiben unverändert. Ein abgelehnter Kandidat wird bei einem identischen Folgelauf nicht erneut vorgeschlagen.

### Evidenz und Vergleich

- Vorläufige, konfigurierbare Startwerte: mindestens fünf verschiedene Beleg-Reels aus drei Creatorn und mindestens fünf vollständig analysierte Vergleichs-Reels. Das sind Arbeitsannahmen dieses Plans, keine bereits bestätigten Produktentscheidungen und kein Signifikanznachweis.
- Vergleich nur innerhalb Instagram-Reels, gleichem Sprachmarkt, gleicher Nischenklasse, gleichem Topic und einem ausgewiesenen 90-Tage-Fenster. Owned Creators bleiben getrennt. Veröffentlichungsalter wird in 0–7, 8–30 und 31–90 Tage gruppiert. Gezählt werden vollständige, aktuelle Analysen, welche dieselbe Pattern-Definition ausdrücklich auf Vorhandensein oder Abwesenheit geprüft haben. „Unbekannt“ ist eine dritte Kategorie.
- Ein Discovery-Lauf für neue Pattern erzeugt zuerst eine Strukturhypothese. Dieselbe Definition wird anschließend auf Beleg- und Vergleichsgruppe geprüft. Die reine Abwesenheit eines frei formulierten Modell-Labels ist kein negativer Beleg.
- Der Vergleich zeigt beide Stichproben, Signal-IDs, Creator-Verteilung, Erfassungszeit, Outlier-Median, Median-Differenz und fehlende Werte. Ein Kandidat wird vorgeschlagen, wenn die Mindestbasis erfüllt und die Differenz positiv ist. Kein Kausalitäts- oder Erfolgsversprechen; Selektionsverzerrung durch bevorzugt transkribierte starke Reels bleibt sichtbar.
- Fehlende Gegenbelege lassen sich über die vorhandene manuelle Transkript-Aktion ergänzen. Auswahl zeigt Umfang und kostenpflichtigen Lauf. Kein stiller Backfill schwacher Reels. Duplikate, fehlende Follower und ungültige Kennzahlen dürfen den Vergleich nicht verbessern. Outlier-Daten ohne brauchbare Followerbasis gelten für diese Auswertung als unbekannt.

### Übergabe an Scripts

Bestätigte Pattern ergänzen die Skript-Auswahl als optionale Referenzen. Gespeichert werden Pattern-ID, Revision, Name, Struktur und ausgewählte Beleg-IDs. Framework bleibt separat. Hook- und Draft-Pakete erhalten nur ausgewählte, begrenzte Pattern-Belege. Neue Vorschläge referenzieren kanonische IDs; unbekannte Referenzen werden abgelehnt. Anti-Kopie-Prüfung und Skriptfreigabe gelten weiter. Eine Änderung der Pattern-Auswahl ist eine Skriptrevision; freigegebene Skripte müssen dafür wieder geöffnet werden. Kandidaten werden nicht automatisch zur Schreibregel.

### Creator-Discovery

- Ein `CreatorCandidate` liegt getrennt von der Watchlist: Netzwerk, normalisierter Handle, kanonischer Kandidatenschlüssel, Markt, Nischen-Fit mit Begründung, Entdeckungsquellen, Beispiel-Reels, Prüfstand und Entscheidung. Status: `proposed`, `shortlisted`, `rejected`, `accepted`. Anreicherung und Backfill haben eigene Run-Zustände.
- Kanonische Identität folgt dem bestehenden Netzwerk/Handle-Vertrag; Signal-IDs folgen dem bestehenden Shortcode-Vertrag. Keine breite ID-Migration. Später gelieferte Provider-IDs bleiben Adapter-Metadaten, bis eine eigene Migration beschlossen wird.
- Die bestehenden Dossiers werden bewusst als strukturierte Kandidaten übernommen. Neuere Nischen-Audits haben Vorrang vor älteren Tabellenempfehlungen. Unbelegte Formatannahmen bleiben als ungeprüft markiert. Dossier-Zahlen bleiben datierte Research-Belege und werden nicht als frisch abgerufene Werte ausgegeben. Das vorhandene Importskript ist keine Discovery-Schnittstelle und wird nicht automatisch ausgeführt.
- Quellenfolge: manuell/Dossier, vorhandene Hashtag-Autoren und starke Einzel-Reels, ähnliche Creator, Themen-/Reel-Suche. Jede zusätzliche Provider-Fähigkeit wird einzeln umgesetzt und mit einem normalisierten Vertrag abgeschirmt. Fehlende `relatedProfiles` ergeben „keine Vorschläge geliefert“, keine erfundene Liste. Der bestehende deutsche Hashtag-Sweep wird nicht still auf Englisch umgestellt.
- Kandidaten-Anreicherung sammelt höchstens zwölf aktuelle Reel-Beispiele innerhalb von 90 Tagen je ausgewähltem Kandidaten und dokumentiert Ausschlüsse. Ältere gepinnte Treffer werden separat gezeigt und zählen nicht zur aktuellen Basis. Daten bleiben im Kandidatenbereich, bis Chris aufnimmt. Beispieltexte sind untrusted input.
- Kennzahlen: Median der Plays mit Views-Fallback, bester Outlier, Anteil Reels ab der ausgewiesenen Outlier-Schwelle, neueste Veröffentlichung, Stichprobengröße und Erfassungszeit. Themenpassung zuerst: Kern-Fit, Teil-Fit, fremde Nische; kein unbegründeter Gesamtscore. Unter drei gültigen aktuellen Reels lautet das Urteil „zu wenig Daten“.
- Kosten werden pro Discovery-Run gespeichert. Startwerte: höchstens zehn Kandidaten-Anreicherungen pro Run, höchstens zwölf Reels je Kandidat, begrenzte Seiten und keine automatische Rekursion. Ein explizites Kostenbudget muss gesetzt sein, bevor ein bezahlter Suchlauf startet. Laufkosten nachträglich zu messen ersetzt kein vorgelagertes Mengenlimit. Unbekannte Nutzung wird als unbekannt angezeigt und verhindert weitere automatische Folgeläufe.
- Aufnahme ist eine eigene menschliche Aktion. Kandidat wird atomar beansprucht, dann folgt der bestehende Aufnahme-/Backfill-Ablauf. Wiederholung bei bereits getracktem Creator ist ein No-op. Teilfehler lassen den Kandidaten mit konkretem Fortsetzungsschritt stehen. Ablehnung schreibt keinen Creator. Keine automatische Reduktion einer bestehenden Watchlist über 30.

### Speicherung, UI und Vertrauen

Neue Objekte ergänzen die Speicherverträge additiv; bisherige Records bleiben lesbar. Convex erhält vollständige Persistenz, der Datei-Store den notwendigen lokalen Fallback. Änderungen an einzelnen Adaptern werden nacheinander umgesetzt. Claims und Freigaben werden an der Speichergrenze geprüft. Listen sind begrenzt oder paginiert. Bridge, Zugänge und private Anweisungen bleiben serverseitig; Textläufe bleiben ohne Netz. App-Zustände umfassen Laden, leer, Fehler, ausstehend, veraltet und vollständig. Phosphor, vorhandene Radien, keine horizontale Seitenüberbreite. Die AGENTS-Vorgabe zu Coral gilt für neue Akzente; der abweichende bestehende Lime-Stand ist kein Auftrag zum globalen Redesign.

## Testing Decisions

Primäre Testgrenze sind Anwendungsfälle mit kontrollierbarer Uhr, Fake-Storage, Fake-Bridge und Fake-Connector, nach dem Vorbild der Skript- und Refresh-Läufe. Geprüft werden gespeicherter Zustand, sichtbare Belege, Konflikte und ausbleibende Provider-Aufrufe; keine Prompt-Snapshots.

- Analyse: echte Fundstellen, korrigierter Text, fehlende Zeitmarken, lange Texte, Ausfall, abgelaufener Claim, veraltetes Ergebnis, idempotentes Nachholen.
- Vergleich: genau unter/an der Mindestbasis, drei Creator, Duplikate, unbekannte Abwesenheit, Markt-/Nischentrennung, schwache Vergleichsgruppe, fehlende Follower, deterministische Ergebnisse.
- Kuration und Scripts: alle vier Entscheidungen, Alias-Zyklen, unveränderte historische Referenzen, nur bestätigte Pattern in Schreibpaketen, gesperrtes Approved-Skript.
- Discovery: Normalisierung, spätere Audit-Entscheidung, leere ähnliche Creator, Grenzen, Teilfehler, bereits getrackt, Doppelklick, Wiederaufnahme ohne zweiten Backfill.
- Neue atomare Convex-Funktionen werden nach den generierten Convex-Testvorgaben geprüft; diese Tests müssen im vollständigen Check enthalten sein. Speicherung wird zusätzlich gegen Convex abgenommen, nicht nur gegen den Datei-Store.
- Manuelle UI-Abnahme bei 360 und 1440 CSS-Pixeln sowie synthetischer leerer Store. `npm run check` muss vor Ticketabschluss bestehen. Sicherheits- und Architekturdokumentation sowie Glossar werden mit der jeweiligen Schnittstelle aktualisiert.

## Out of Scope

Automatische Watchlist-Aufnahme, vollautomatische Pattern-Bestätigung, neues Outlier-Scoring, Training eines Modells, visuelle Vollanalyse stummer Reels, Veröffentlichung, Nachrichtenversand, Lead-Magnet-Erstellung und Lernen aus eigenen Ergebnissen. Eine Caption-Heuristik darf ein fehlendes Volltranskript nicht ersetzen.

## Further Notes

Zwei unabhängig startbare Pfade: Inhaltsanalyse → Vergleich → Kuration → Script-Anwendung sowie Kandidatenliste → Quellen/Anreicherung → bestätigte Watchlist-Aufnahme. Die Ticketnummern bestimmen keine künstliche Gesamtkette.

Die spätere Research-Dokumentation enthält bereits Reels von `@alan.buildz`. Der frühere Hinweis „noch nicht getrackt“ gilt daher nicht als aktueller Befund. Der Kandidat dient als Abgleichfall: erst den tatsächlichen Store lesen, bei vorhandenem Creator keinen neuen Backfill starten. In dieser Planungsrunde wurden keine Live-Creator importiert und keine aktuellen Bestandszahlen behauptet.

Quellen: [Produktentscheidungen, Abschnitte 7/8/13–15](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/CONTENT-INTELLIGENCE-DECISIONS.md>), [Grilling-Protokoll](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/CONTENT-INTELLIGENCE-GRILLING-PROTOKOLL.md>), [DE-Dossier](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/creator-research/dossier-de.md>), [EN-Dossier](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/creator-research/dossier-en.md>), [Glossar](</Users/cristobalcallejongarcia/dev/signal-room-starter/CONTEXT.md>), [ADRs](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/adr/README.md>).

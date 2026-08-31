# Content Intelligence, Skriptstudio und Lead Magnets

**Entscheidungsstand:** 31. August 2026  
**Status:** Produktentscheidungen bestätigt, noch nicht in Tickets zerlegt  
**Geltungsbereich:** Signal Room, private Creator-Intelligence-App

## Zweck dieses Dokuments

Dieses Dokument hält die Entscheidungen aus der Grill-Session zum nächsten Produktausbau fest. Es beschreibt, was in die App soll, weshalb es gebraucht wird, wie die Arbeitsbereiche zusammenhängen und welche Grenzen gelten.

Für diesen Funktionsbereich ersetzt es die ältere Annahme aus `docs/SPEC.md`, nach der eine Idea direkt zu einem Storyboard entwickelt wird. Zukünftig entsteht aus einer Idea zuerst ein eigenständiges Skriptprojekt. Das Storyboard folgt erst nach der Skriptfreigabe.

Dieses Dokument ist noch kein Ticket-Plan. Konkrete Datenverträge, Migrationen, API-Schnittstellen und vertikale Umsetzungstickets werden daraus im nächsten Planungsschritt abgeleitet.

## 1. Zielbild

Signal Room soll hochperformante Reels in Chris' Nische finden und deren vollständigen Inhalt als belegbare Research-Basis speichern. Aus diesen Quellen entstehen eigene Skripte, bestätigte Copywriting-Pattern und individuelle Lead Magnets. Nach der Veröffentlichung fließt die Performance des eigenen Reels zurück in das System.

Der gewünschte Arbeitsablauf lautet:

1. Reels und passende Creator entdecken.
2. Hochperformante Reels bewerten und transkribieren.
3. Eine interessante Quelle als Idea erfassen.
4. Aus der Idea ein eigenständiges Skriptprojekt erstellen.
5. Mehrere Hooks und Angles prüfen, einen auswählen und das Skript schreiben.
6. Das Skript redaktionell freigeben.
7. Erst danach Storyboard, Caption, CTA und bei Bedarf einen Lead Magnet erstellen.
8. Den Lead Magnet aus Primärquellen, Community-Wissen und ergänzender Recherche aufbauen.
9. Das eigene Reel veröffentlichen und seine Performance mit Skript, Pattern, CTA und Lead Magnet verbinden.
10. Aus den Ergebnissen lernen, welche Strukturen im eigenen Content funktionieren.

## 2. Bestätigter Ist-Befund

### 2.1 Transkripte sind vorgesehen, funktionieren aber noch nicht

`SignalRecord` besitzt bereits `transcript` und `transcriptStatus`. Convex speichert beide Felder am Signal. Die UI zeigt vollständige Transkripte jedoch nirgends an.

Zum Zeitpunkt der Prüfung enthielt Convex:

- 1.242 Signals
- 1.138 Reels
- 0 Transkripte mit Status `ready`
- 20 Transkriptversuche mit Status `silent`
- 1.222 Signals ohne Transkriptstatus

Der Befund deutet auf eine nicht unterstützte Antwortform des aktuellen Transkript-Actors hin. Die als `silent` gespeicherten Ergebnisse gelten im vorhandenen Code fälschlich als endgültig und werden nicht erneut versucht. Vor weiteren kostenpflichtigen Läufen muss ein aktuelles Actor-Ergebnis geprüft und der Parser angepasst werden.

Betroffene Grundlagen:

- `lib/contracts.ts`
- `lib/transcripts.ts`
- `lib/adapters/sources/apify-transcripts.ts`
- `lib/collect.ts`
- `convex/schema.ts`

### 2.2 Der aktuelle Ideas-Ablauf nutzt das Quell-Reel nicht

Eine Idea kann über `sourceSignalId` mit einem Reel verbunden sein. `Develop Idea` lädt dieses Reel und sein vollständiges Transkript derzeit nicht für die Entwicklung.

Die bestehende Route sendet stattdessen ein allgemeines Paket der stärksten Outlier-Reels. Darin stehen nur Titel, Creator, ein kurzer Caption-Ausschnitt, Plays und Outlier. Der Bridge-Prompt erzeugt Hook, drei Beats, CTA, Caption und Takeaway direkt aus diesem Paket.

Es gibt keine deterministische Codezeile, die eine Caption in Hook und Beats kopiert. Die beobachteten Dopplungen entstehen durch den Prompt und die fehlende semantische Prüfung. Das Ergebnis wird nur auf Pflichtfelder, Textlänge und exakt drei Beats geprüft.

Konsequenz: Der bestehende Storyboard-Ablauf darf nicht als Skriptstudio erweitert werden. Er wird durch eine klare Kette aus Idea, Skriptfreigabe und anschließendem Storyboard ersetzt.

### 2.3 Die bestehende Pattern-Erkennung ist zu oberflächlich

Die vorhandene Format-Analyse erkennt zehn regelbasierte Hook-Formen aus kurzen Textanfängen. Sie analysiert noch keine vollständigen Skripte, keine Spannungsführung, keine Beweise, keine Übergänge und keine CTA-Platzierung.

### 2.4 Eine echte Creator-Discovery fehlt

Die App bewertet bisher nur bereits getrackte Creator. `Rising Creators` entdeckt keine neuen Accounts. Der Hashtag-Sweep könnte fremde `ownerHandle` liefern, enthält im aktuellen Store aber keine Datensätze.

Die aktuelle Convex-Watchlist enthielt bei der Prüfung zehn Creator. `@alan.buildz` war noch nicht enthalten und soll als erster konkreter Kandidat für den neuen Discovery-Ablauf dienen.

## 3. Zentrales Produktobjekt

Jedes relevante Reel wird zu einem dauerhaften Research-Datensatz. Der Datensatz verbindet:

- Creator und kanonische Reel-ID
- URL, Caption und veröffentlichte Kennzahlen
- vollständiges Originaltranskript
- korrigierte Arbeitsfassung des Transkripts
- Score und verständliche Score-Begründung
- erkannte Frameworks und Pattern
- daraus erstellte Ideas und Skripte
- Storyboard, Caption und CTA
- zugehörigen Lead Magnet
- spätere Performance des eigenen veröffentlichten Reels

Idea, Skript und Lead Magnet bleiben eigene Artefakte. Sie verweisen auf das Reel, statt dessen Inhalte unkontrolliert zu kopieren.

## 4. Transkripte

### 4.1 Automatische Auswahl

Nicht jedes gesammelte Reel wird automatisch transkribiert. Die automatische Auswahl folgt dem kombinierten Performance-Score. Ein manuell interessantes Reel kann unabhängig vom Score transkribiert werden.

### 4.2 Manueller Transkript-Button

Jedes Reel ohne fertiges Transkript erhält die Aktion `Transkribieren`.

Für fehlgeschlagene oder fälschlich als stumm erkannte Reels gibt es `Erneut versuchen`. Ein Status darf einen erneuten Versuch nicht dauerhaft blockieren.

Während der Verarbeitung zeigt die Oberfläche einen klaren Ladezustand. Nach Erfolg öffnet sie das vollständige Transkript. Fehler zeigen eine verständliche Ursache und eine erneute Aktion.

### 4.3 Original und Korrekturen

Das Originaltranskript bleibt unverändert erhalten. Eine zweite Arbeitsfassung korrigiert nur erkennbare Transkriptionsfehler, insbesondere:

- falsch erkannte Produktnamen
- Creator-Namen und Eigennamen
- Repository- und Tool-Namen
- offensichtlich falsch erkannte Einzelwörter

Füllwörter, Satzbau, Rhythmus und Ausdruck bleiben erhalten. Die Arbeitsfassung ist keine stilistische Glättung.

Korrekturen erscheinen als markierte Vorschläge. Chris kann sie übernehmen, bearbeiten oder ablehnen. Wiederkehrende Korrekturen können in ein persönliches Wörterbuch aufgenommen werden. Jede Änderung bleibt zum Original rückverfolgbar.

### 4.4 Anzeige

Die Reel-Ansicht zeigt:

- Originaltranskript
- korrigierte Arbeitsfassung, falls vorhanden
- Transkriptstatus
- Korrekturhinweise
- erkannte Skriptabschnitte und Pattern
- Zeitmarken, sofern die Quelle sie liefert

## 5. Ideas und Skriptstudio

### 5.1 Klare Trennung

`Ideas` bleibt eine Inbox für Themen, Chancen und gespeicherte Ausgangspunkte.

`Scripts` wird ein eigener Hauptbereich für die eigentliche Schreibarbeit.

`Lead Magnets` wird ein eigener Hauptbereich für Recherche, Inhaltsentwurf, PDF, CTA und Freigabe.

### 5.2 Neue Bedeutung von Develop Idea

`Develop Idea` erstellt kein Storyboard mehr. Die Aktion eröffnet ein Skriptprojekt und verbindet es mit:

- der Idea
- dem Quell-Reel
- dem vollständigen Transkript
- den Kennzahlen des Reels
- weiteren ausgewählten Evidence-Reels
- bekannten und vorgeschlagenen Copywriting-Frameworks

### 5.3 Skriptstatus

Ein Skript durchläuft diese Stufen:

1. `Hook Selection`
2. `Draft`
3. `Review`
4. `Approved`

Ein freigegebenes Skript kann anschließend in Storyboard und Lead-Magnet-Recherche weitergegeben werden.

### 5.4 Hook- und Angle-Auswahl

Das System schreibt zunächst drei bis fünf unterschiedliche gesprochene Hooks und Angles. Jeder Vorschlag erklärt kurz:

- welche Hypothese er verfolgt
- welches Framework oder Pattern er nutzt
- auf welche Reel-Belege er sich stützt
- weshalb er zum Thema passt

Chris wählt oder bearbeitet einen Vorschlag. Erst danach entsteht das vollständige Skript.

### 5.5 Skripteditor

Der Editor verbindet zwei Ansichten:

- strukturierte Abschnitte für Hook, Beats, Übergänge und CTA
- eine zusammenhängende Leseansicht des gesprochenen Skripts

Änderungen bleiben zwischen beiden Ansichten synchron.

Gesprochener Hook, Storyboard-Beats, Caption, Kommentar-CTA und Lead-Magnet-CTA sind unterschiedliche Felder. Sie dürfen nicht mehr aus derselben Caption-Zeile befüllt werden.

### 5.6 Storyboard

Das Storyboard wird erst nach der Skriptfreigabe erzeugt. Seine Hook und Beats werden aus dem freigegebenen Skript abgeleitet.

Vorhandene Storyboards bleiben als `Legacy` sichtbar. Sie werden nicht automatisch überschrieben. Chris kann sie bei Bedarf aus einem freigegebenen Skript neu erzeugen.

## 6. Copywriting, Stimme und Anti-Slop

### 6.1 Frameworks

Die App verwendet einen hybriden Ansatz aus bekannten Frameworks und empirisch erkannten Mustern.

Das wahrscheinlich gemeinte Standard-Framework aus dem Simtent YouTube OS ist `PAS`:

- Problem
- Agitation
- Solution

`BBB` ergänzt erklärende Abschnitte:

- Behaupten
- Begründen
- Beispiel

Das System empfiehlt ein Framework mit Begründung. Chris kann es auswählen, wechseln oder ohne festes Framework schreiben.

### 6.2 Sprache

Neue Skripte lernen Struktur, Rhythmus und Spannungsführung aus erfolgreichen Reels. Formulierungen werden nicht kopiert.

Die eigene Stimme wird nur aus tatsächlich veröffentlichten Skripten weiterentwickelt. Generierte und verworfene Entwürfe verändern das Sprachprofil nicht.

### 6.3 Qualitätsprüfung

`anti-response-patterns` wirkt bereits während der Generierung als Stilregel.

`slop-check` dient anschließend als Lektorats-Gate für einen fertigen Entwurf. Es soll die Stimme erhalten und nur notwendige Änderungen vorschlagen.

Bekannter technischer Befund: Die internen Pfade des lokalen `slop-check` zeigen derzeit auf `.Codex/skills/slop-check`, während die Dateien unter `.agents/skills/slop-check` liegen. Dieser Pfadfehler gehört in die spätere Umsetzung.

## 7. Pattern-Bibliothek

### 7.1 Hybridmodell

Jedes vollständige Transkript wird sofort auf bekannte Merkmale geprüft. Dazu gehören:

- PAS, BBB und weitere bestätigte Frameworks
- Hook-Typ
- Spannungsaufbau
- offene Schleifen
- Beweisführung
- Beispiele und Demonstrationen
- Übergänge
- Satzlänge und Rhythmus
- CTA-Typ und CTA-Platzierung

Übergreifende Pattern werden erst vorgeschlagen, wenn mehrere Reels Belege liefern und ein Performance-Zusammenhang erkennbar ist.

### 7.2 Menschliche Bestätigung

Ein neues Pattern wird nicht automatisch kanonisch. Die App zeigt es als Kandidat. Chris kann es bestätigen, umbenennen, zusammenführen oder verwerfen.

### 7.3 Sichtbare Belege

Jedes Pattern zeigt:

- relevante Transkriptstellen
- Zeitmarken, sofern vorhanden
- Reel-Link und Creator
- Performance des Reels
- Vergleich mit passenden Reels ohne dieses Pattern
- verständliche Erklärung des vermuteten Zusammenhangs

## 8. Creator-Discovery

### 8.1 Zielgröße

Die App erzeugt eine größere Kandidatenliste. Chris bestätigt daraus 20 bis 30 Creator für die aktive Watchlist.

Neue Kandidaten werden nicht automatisch dauerhaft getrackt.

### 8.2 Quellen

Die Discovery kombiniert:

- ähnliche Accounts zu vorhandenen Creatorn
- Themen und Hashtags
- Autoren starker Einzel-Reels
- wiederholt hohe Performance in der Zielnische
- bereits bekannte manuelle Kandidaten wie `@alan.buildz`

### 8.3 Kandidatenkarte

Jeder Kandidat zeigt mindestens:

- Themenpassung
- mehrere relevante Beispiel-Reels
- stärksten Outlier
- Median-Performance
- Anteil starker Reels
- Aktualität der Veröffentlichungen
- verständliche Aufnahmeempfehlung

Erst die menschliche Bestätigung startet Backfill und regelmäßige Aktualisierung.

## 9. Rückführung der eigenen Performance

Eigene veröffentlichte Reels werden regelmäßig aktualisiert und mit dem ursprünglichen Produktionspfad verbunden:

- Skriptversion
- gewählter Hook und Angle
- Frameworks und Pattern
- Caption
- Kommentar-Keyword
- Lead Magnet
- spätere Kennzahlen

Die erste Zuordnung erfolgt anhand von Veröffentlichungsdatum und Titel beziehungsweise erster Caption-Zeile. Ein eindeutiger Treffer wird verbunden. Bei mehreren oder unsicheren Treffern wählt Chris das richtige Reel. Danach speichert die App die kanonische Reel-ID.

Die eigenen Ergebnisse sind die wichtigste Feedbackquelle. Fremde Creator liefern Hypothesen. Eigene veröffentlichte Reels zeigen, welche davon für Chris funktionieren.

## 10. Lead Magnets

### 10.1 Individuelles Artefakt pro Reel

Jedes Reel erhält einen eigenen Lead Magnet. PDFs werden nicht zwischen Reels wiederverwendet. Bereits gewonnenes Wissen darf nach bewusster Auswahl erneut als Research-Basis dienen.

### 10.2 Startpunkt

Die Recherche beginnt erst über die bewusste Aktion `Lead Magnet erstellen` an einem freigegebenen Skript. Nicht jedes freigegebene Skript erzeugt automatisch eine PDF.

### 10.3 Quellenhierarchie

Die Recherche arbeitet in dieser Reihenfolge:

1. offizielle Dokumentation oder offizielles Repository
2. Repository-Inhalt, Beispiele, Issues und Releases
3. vorhandenes Community-Wissen im Vault
4. aktuelle Recherche über `EA Brain`
5. ergänzende seriöse Webquellen, wenn sie eine konkrete Lücke schließen

Primärquellen klären, was ein Tool tatsächlich kann. Community-Wissen liefert Erfahrungen, ungewöhnliche Workflows und praktische Abkürzungen.

### 10.4 Definition eines Nuggets

Ein Nugget wird übernommen, wenn es:

- konkret ist
- zum Thema des Reels passt
- nachvollziehbar ist
- einen praktischen Schritt verbessert
- einen reproduzierbaren Workflow, Prompt, Anwendungsfall oder eine hilfreiche Einstellung liefert

Ein interessanter Satz ohne praktischen Nutzen reicht nicht.

### 10.5 Kritische Stimmen

Die Recherche sucht nicht pflichtmäßig nach negativen Stimmen. Der erste Blick gilt dem Community-Tenor und den hilfreichen Anwendungserfahrungen.

Ein kritischer Punkt erscheint nur, wenn er Zeit, Geld, Datenqualität oder das erwartete Ergebnis wesentlich betrifft. In der PDF wird er leicht formuliert, zum Beispiel als `Darauf solltest du achten` oder `Bitte beachte`.

### 10.6 Community-Herkunft

Die öffentliche PDF nennt weder die EA-Community noch einzelne Mitglieder. Erkenntnisse erscheinen als redaktionell geprüfte Praxistipps von Chris.

Die PDF behauptet keine persönliche Praxiserfahrung, wenn Chris den Schritt nicht selbst getestet hat. Expertenpositionierung entsteht durch Auswahl, Prüfung, Synthese und verständliche Erklärung.

Intern bleibt die Herkunft jedes Community-Fundes nachvollziehbar.

### 10.7 Inhaltliche Qualitätslatte

Eine Recherche ist fertig, sobald sie folgende Qualitätsprüfung besteht:

- klares Nutzenversprechen
- funktionierender Quickstart auf Basis der Quellen
- konkreter Anwendungsfall
- nachvollziehbare Schritte
- mindestens ein wertvoller Nugget
- passende Screenshots, Codeblöcke oder Diagramme
- relevante Einschränkungen
- geprüfte Primärquellen

Installationen und praktische Testläufe sind keine Pflicht. Die Recherche prüft Dokumentation, Repository-Struktur, Issues und vorhandene Beispiele. Unsicherheit wird intern gekennzeichnet. Nicht geprüfte Schritte werden nicht als persönlich bestätigte Ergebnisse beschrieben.

### 10.8 Umfang

Die Länge folgt dem Wert der Findings und der Komplexität des Themas. Es gibt keine feste Seitenzahl.

Orientierung:

- Quick Guide: etwa 6 bis 10 Seiten
- Praxis-Playbook: etwa 12 bis 18 Seiten
- Build-Spezifikation: etwa 20 bis 30 Seiten

Diese Klassen sind keine Limits. Ein längeres Dokument muss seine Länge durch konkrete Schritte, Beispiele, Screenshots, Tabellen, Codeblöcke und relevante Fallstricke rechtfertigen.

### 10.9 Bearbeitung und Design

Der Lead Magnet wird als strukturierter Entwurf in der App bearbeitet. Er besteht aus modularen Abschnitten wie:

- Ergebnisversprechen
- Quickstart
- Schritt-für-Schritt-Anleitung
- Praxisbeispiel
- Screenshot mit Markierungen
- Codeblock oder kopierbarer Prompt
- Vergleich
- Checkliste
- Praxis-Nugget
- optionaler Hinweis
- CTA

Ein gemeinsames Markensystem hält Typografie, Farben, Seitenraster und CTA-Bereich konsistent. Die Module werden pro Thema individuell zusammengesetzt.

Visuals werden nur eingesetzt, wenn sie etwas erklären. Dekorative Bilder sind kein Qualitätsmerkmal.

### 10.10 PDF-Freigabe

Vor der Texterstellung gibt Chris das Research-Dossier und die Gliederung frei.

Vor dem finalen Export prüft die App:

- abgeschnittene Inhalte
- unlesbare Codeblöcke
- fehlende Bilder
- fehlerhafte Links
- schlechte Seitenumbrüche
- inkonsistente Seitenelemente

Danach gibt Chris die finale PDF frei.

### 10.11 CTA

Der CTA hängt vom aktuellen Angebot und Ziel ab. Er wird pro Lead Magnet festgelegt.

Wenn noch kein Ziel feststeht, bleiben Research und Inhalt bearbeitbar. Der finale Export wartet auf eine bewusste CTA-Entscheidung. `Kein CTA` ist eine gültige Auswahl. Ein Platzhalter darf nie in eine veröffentlichte PDF gelangen.

## 11. EA-Community und Vault

### 11.1 EA Brain

`EA Brain` ist in Claude Code bereits als verbundener MCP registriert. Codex erhält nach Abschluss dieser Entscheidungsphase einen eigenen OAuth-Zugang mit dem Scope `mcp:read`.

Die Claude-Zugangsdaten werden nicht kopiert. OpenRouter ist für diesen Zugriff nicht erforderlich.

### 11.2 Aktiver Vault

Der produktive Obsidian-Vault liegt unter:

`/Users/cristobalcallejongarcia/chriscasa`

Community-Rohmaterial liegt bereits unter:

`knowledge/skool/early-ai-adopters/posts/`

Ausgewertetes Community-Wissen liegt unter:

`knowledge/skool/`

Fertige Reel-PDFs liegen unter:

`content/reels/leadmagnete/`

### 11.3 Ablageregel

Für jedes Tool, Feature oder Repository entsteht eine kanonische Community-Wissensnotiz. Neue Recherche wird mit Datum ergänzt und mit den zugrunde liegenden Posts verlinkt.

Die Notiz enthält:

- Thema und Forschungsfrage
- Community-Tenor
- übernehmbare Praxis-Nuggets
- relevante Hinweise
- verworfene oder unbelegte Aussagen
- interne Beleglinks
- Datum der letzten Prüfung

Die App durchsucht den Vault nicht automatisch. Chris startet die Vault-Recherche bewusst. Danach kann `EA Brain` fehlende oder aktuelle Aspekte ergänzen.

### 11.4 Speichergrenze

Convex speichert den operativen App-Zustand:

- Reel und Transkript
- Idea und Skript
- Pattern und Freigaben
- Lead-Magnet-Entwurf
- CTA und Exportstatus
- Verknüpfung zur eigenen Performance

Der Vault speichert das wiederverwendbare, über die Community recherchierte Wissen. Die öffentliche PDF enthält keine Community-Attribution.

## 12. ManyChat-Übergabe

Signal Room konfiguriert in dieser Ausbaustufe keine externe ManyChat-Automation. Vor jeder externen Änderung bleibt eine menschliche Freigabe erforderlich.

Die App erzeugt stattdessen ein vollständiges Übergabepaket. Die Anforderungen beruhen auf der aktuellen offiziellen ManyChat-Dokumentation. Die Quellen und Detailprüfung stehen in `docs/MANYCHAT-REEL-LEAD-MAGNET-RESEARCH.md`.

### 12.1 Empfohlener Ablauf

Der Flow wird so vorbereitet:

1. Die Reel-Caption fordert einen Kommentar mit einem eindeutigen Keyword.
2. Der Kommentar-Trigger gilt für dieses konkrete Reel.
3. ManyChat veröffentlicht optional eine von bis zu drei wechselnden Antwortvarianten.
4. Eine Opening DM fragt mit einem normalen Button oder einer Quick Reply, ob der Guide geschickt werden soll.
5. Der Klick gilt als Opt-in und öffnet das 24-Stunden-Nachrichtenfenster.
6. Optional folgen E-Mail-Abfrage oder Follow-Prüfung.
7. Die Auslieferungs-DM sendet den freigegebenen Lead-Magnet-Link.
8. Optional erinnert ein Follow-up innerhalb des 24-Stunden-Fensters, wenn der Link nicht geklickt wurde.

Ein direkter Website-Button in der ersten DM gilt nicht als Opt-in. Ohne normale Button- oder Quick-Reply-Interaktion stehen die geplante E-Mail-Abfrage, Follow-Prüfung und Follow-up-Logik nicht wie vorgesehen zur Verfügung.

### 12.2 Benötigte Inhalte und Felder

Das Übergabepaket enthält:

- Lead-Magnet-ID und PDF-Version
- eindeutigen Automationsnamen
- Reel-ID, Shortcode und Reel-Link
- gesprochenen CTA im Skript
- Caption-CTA
- ein oder mehrere Kommentar-Keywords
- optional ausgeschlossene Keywords
- ein bis drei natürliche öffentliche Reply-Varianten
- Aktivierung und Text der Opening DM
- Button- oder Quick-Reply-Label der Opening DM
- optionale E-Mail-Abfrage mit Text und Nutzenbegründung
- optionale Follow-Prüfung mit Aufforderungstext
- Auslieferungstext
- öffentliche HTTPS-URL der freigegebenen PDF
- Link-Label
- optionales Follow-up mit Wartezeit, Text und Link
- Kampagnen-Tag und optionalen Auslieferungs-Tag
- optionales Angebot oder Kampagnenziel
- Link zur Datenschutzerklärung, wenn personenbezogene Daten erhoben werden
- Freigabezeitpunkt

Das Kommentar-Keyword wird aus kurzen Vorschlägen gewählt oder von Chris bearbeitet. Caption, gesprochener CTA und Trigger müssen exakt dasselbe Keyword verwenden. Die App warnt vor Überschneidungen mit anderen aktiven Automationen.

### 12.3 Auslieferungsform

Standard ist eine öffentlich erreichbare HTTPS-URL zur freigegebenen PDF. Diese Form unterstützt Klickmessung, CTR und einen Follow-up für nicht geklickte Links.

ManyChat unterstützt alternativ einen direkten PDF-Block in Instagram. Diese Variante gehört in den Flow Builder und muss auf dem echten Instagram-Kanal geprüft werden. Signal Room behauptet keine feste Dateigrößengrenze, solange die offizielle Dokumentation für Instagram keinen belastbaren Wert nennt.

### 12.4 Plattformgrenzen

Die Übergabe und Prüfung berücksichtigen:

- Der Kommentar-Trigger reagiert nur auf den ersten Kommentar einer Person unter dem betreffenden Reel.
- Eine Opening DM enthält nur einen einzelnen Content-Block.
- Ein Button-Label bleibt unter 20 Zeichen.
- Instagram-Textblöcke mit Buttons bleiben unter 640 Zeichen.
- Textblöcke ohne Buttons bleiben unter 1.000 Zeichen.
- Ein Instagram-Textblock unterstützt höchstens drei Buttons.
- Follow-ups müssen innerhalb des geöffneten 24-Stunden-Fensters liegen.
- Das Instagram-Konto muss als Business- oder Creator-Konto korrekt mit ManyChat verbunden sein.
- Conversation Routing und Instagram-Berechtigungen müssen korrekt gesetzt sein.
- Unvollständige Blöcke, fehlende Anhänge und nicht unterstützte Tarif-Funktionen dürfen die Veröffentlichung nicht unbemerkt blockieren.

### 12.5 Test- und Freigabeansicht

Signal Room zeigt eine menschlich prüfbare Ablaufansicht mit der genauen Nachrichtenreihenfolge. Vor der Übergabe werden mindestens geprüft:

- Reel-Zuordnung
- identisches Keyword in Skript, Caption und Trigger
- natürliche öffentliche Antworten
- Opening DM mit echtem Interaktionsbutton
- Zeichen- und Button-Limits
- öffentlich erreichbarer PDF-Link
- mobile Darstellung und Download
- Follow-up nur bei nicht geklicktem Link
- Follow-up innerhalb des 24-Stunden-Fensters
- vollständige Tags und Kampagnenzuordnung
- keine Platzhalter
- vorhandene Datenschutzerklärung bei E-Mail-Erfassung

Die Builder-Vorschau reicht nicht als finale Abnahme. Actions, Smart Delays und Teile der Eingabevalidierung müssen mit einem echten Instagram-Test geprüft werden.

### 12.6 Datenschutz

Eine E-Mail-Abfrage bleibt standardmäßig deaktiviert. Sie wird nur aktiviert, wenn Zweck, Rechtsgrundlage, Datenschutzhinweis und spätere Nutzung feststehen.

Der spätere ManyChat-Prozess braucht Regeln für Auskunft, Export, Abmeldung, Löschung und Aufbewahrungsfrist. Im Lead-Magnet-Flow werden keine sensiblen Daten erhoben.

## 13. Sicherheits- und Vertrauensgrenzen

- Gesammelte Captions, Transkripte und Community-Inhalte bleiben untrusted input.
- Provider-Antworten bleiben hinter Adaptern.
- Zugangsdaten, OAuth-Sitzungen und Tokens bleiben serverseitig und außerhalb von Git.
- Der Korpus und gerenderte Dateien bleiben außerhalb von Git, sofern die bestehende Ablage dies vorsieht.
- Keine Veröffentlichung, Nachricht, externe Automation oder Löschung erfolgt ohne menschliche Freigabe.
- Primärquellen bleiben intern nachvollziehbar.
- Jede angezeigte Bewertung braucht einen verständlichen Grund und sichtbare Belege.
- Demo-Modus muss ohne Accounts und Credentials weiter funktionieren.

## 14. Bestätigte Umsetzungsreihenfolge

### Phase 1: EA Brain für Codex

- MCP-Server mit reinem Lesezugriff registrieren
- OAuth-Freigabe durchführen
- Suchzugriff prüfen

### Phase 2: Transkript-Grundlage

- aktuellen Actor-Output prüfen
- Parser korrigieren
- Status- und Retry-Modell ändern
- automatische Auswahl nach Performance-Score
- manuellen Transkript-Button bauen
- Original und Korrekturversion anzeigen
- Fehler-, Lade-, Leer- und Erfolgszustände ergänzen

### Phase 3: Ideas und Skriptstudio

- Ideas zur Inbox vereinfachen
- eigenständiges Skriptmodell und Scripts-Bereich ergänzen
- Quell-Reel und Volltranskript anbinden
- Hook- und Angle-Auswahl bauen
- strukturierten Editor und Leseansicht bauen
- Freigabe-Gate vor dem Storyboard einführen
- Legacy-Storyboards erhalten und gezielt erneuerbar machen

### Phase 4: Pattern und Creator-Discovery

- bekannte Frameworks und neue Pattern-Kandidaten modellieren
- Transkriptbelege und Performance-Vergleiche anzeigen
- menschliche Pattern-Freigabe bauen
- Kandidaten aus mehreren Discovery-Quellen sammeln
- Creator-Kandidaten bewerten
- 20 bis 30 bestätigte Creator verwalten
- `@alan.buildz` als ersten realen Kandidaten prüfen

### Phase 5: Lead Magnets

- bewussten Start aus einem freigegebenen Skript bauen
- Research-Dossier und Freigabe modellieren
- Community-Recherche und Vault-Ablage anbinden
- strukturierten Inhaltseditor bauen
- modulares PDF-Designsystem und Rendering ergänzen
- automatische Layoutprüfung und finale Freigabe bauen

### Phase 6: Feedback und ManyChat-Übergabe

- eigene Reels zuordnen
- Kennzahlen regelmäßig aktualisieren
- Performance mit Skript, Pattern, CTA und Lead Magnet verbinden
- ManyChat-Übergabepaket erzeugen
- tatsächliche ManyChat-Automation in einer eigenen Design- und Grill-Session planen

## 15. Bewusst offene Entscheidungen

Diese Punkte werden nicht vorab festgeschrieben:

- konkreter CTA eines einzelnen Lead Magnets
- exaktes Angebot am Ende einer PDF
- konkrete Gewichtung des kombinierten Performance-Scores
- finale visuelle Varianten innerhalb des gemeinsamen PDF-Designsystems
- konkrete ManyChat-Automation und deren externe Konfiguration
- genaue Anzahl von Pattern-Belegen, bevor ein Kandidat vorgeschlagen wird

Diese offenen Punkte blockieren die ersten drei Umsetzungsphasen nicht.

## 16. Definition of Done für den Gesamtausbau

Der Ausbau ist abgeschlossen, wenn:

- hochperformante Reels zuverlässig automatisch transkribiert werden
- jedes Reel manuell transkribiert oder erneut versucht werden kann
- Original und korrigierte Fassung getrennt und rückverfolgbar bleiben
- Ideas eigenständige Skriptprojekte öffnen
- Skripte aus dem Quell-Reel und vollständigen Transkript entstehen
- Hook, Skript, Storyboard, Caption und CTA getrennte Felder besitzen
- Storyboards erst nach Skriptfreigabe entstehen
- Pattern sichtbare Transkript- und Performance-Belege besitzen
- neue Pattern und Creator vor dauerhafter Aufnahme bestätigt werden
- 20 bis 30 passende Creator aktiv beobachtet werden können
- veröffentlichte eigene Reels mit Skript und Lead Magnet verbunden werden
- jeder Lead Magnet ein freigegebenes Research-Dossier besitzt
- Community-Wissen intern nachvollziehbar im Vault gespeichert wird
- individuelle PDFs aus strukturierten Entwürfen entstehen
- PDF-Layout und Links vor der Freigabe geprüft werden
- ein vollständiges ManyChat-Übergabepaket erzeugt werden kann
- Demo-Modus, Tests, Sicherheitsgrenzen und menschliche Freigaben erhalten bleiben

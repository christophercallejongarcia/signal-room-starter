# Phase 6: Eigene Performance und ManyChat-Übergabe

Status: ready-for-agent
Stand: 2026-09-10

## Problem Statement

Owned Creators sind bereits erfasst und im Profile-Bereich sichtbar. Die App kennt aber keine belastbare Verbindung eines veröffentlichten eigenen Reels zu Skriptfassung, gewähltem Hook, Pattern, Caption und Lead Magnet. Der Delta-Refresh fragt nach Veröffentlichungsdatum ab und erfasst deshalb ältere Reels nicht zuverlässig erneut. Aktuelle Kennzahlen überschreiben frühere Werte; daraus entsteht noch kein Verlauf.

Ein lokaler PDF-Export ist außerdem kein auslieferbarer ManyChat-Flow. Es fehlen ein vollständiges Übergabepaket, die Prüfung seiner konkreten Texte und ein dokumentierter Test auf Instagram. Die App darf einen lokalen Freigabestatus nicht als externe Aktivierung darstellen.

## Solution

Chris registriert eine Veröffentlichung mit Datum, Titel beziehungsweise Caption und der tatsächlich verwendeten freigegebenen Skriptfassung. Die App ordnet ein passendes Owned Reel eindeutig zu oder lässt Chris bei Unsicherheit wählen. Sie speichert danach seine kanonische ID und aktualisiert gezielt dessen Kennzahlen. Datierte Messungen zeigen, welche eigenen Ansätze funktionieren. Nur tatsächlich veröffentlichte Skripte dienen als Sprachbeispiele.

Für den Lead Magnet entsteht unabhängig davon ein bearbeitbares ManyChat-Übergabepaket. Vor der finalen Übergabe müssen das veröffentlichte Reel und eine öffentlich erreichbare freigegebene PDF-Version feststehen. Chris prüft Nachrichtenfolge, Keyword, Links und Grenzen und exportiert das Paket. Einrichtung, Tests auf Instagram und Aktivierung erfolgen außerhalb der App durch einen Menschen.

## User Stories

1. Als Chris will ich ein veröffentlichtes Reel dem verwendeten Skript zuordnen, damit seine Ergebnisse den richtigen Entwurf bewerten.
2. Als Chris will ich Datum und Caption als erste Suchhilfe nutzen, damit ich die Reel-ID nicht abtippen muss.
3. Als Chris will ich einen eindeutigen Treffer automatisch verbinden, damit unnötige Bestätigungen entfallen.
4. Als Chris will ich mehrere oder unsichere Treffer selbst prüfen, damit keine falsche Produktion verknüpft wird.
5. Als Chris will ich die kanonische Reel-ID dauerhaft speichern, damit geänderte Captions die Zuordnung nicht auflösen.
6. Als Chris will ich eine falsche Zuordnung korrigieren, damit Performance und Sprachbeispiele bereinigt werden können.
7. Als Chris will ich die tatsächlich verwendete Skriptversion samt Hook und Angle sehen, damit neuere Entwürfe die Historie nicht verändern.
8. Als Chris will ich Caption, Keyword, Pattern und PDF-Version am veröffentlichten Reel sehen, damit der Produktionspfad vollständig bleibt.
9. Als Chris will ich auch ältere eigene Reels gezielt aktualisieren, damit der Verlauf nach dem ersten Tag weiterwächst.
10. Als Chris will ich Messzeit und fehlende Kennzahlen sehen, damit alte oder unbekannte Werte nicht als aktuelle Null erscheinen.
11. Als Chris will ich ähnliche Beobachtungsalter vergleichen, damit ein alter Bestseller nicht mit einem frischen Reel gleichgesetzt wird.
12. Als Chris will ich Performance nach Hook, Framework, Pattern und CTA prüfen, damit ich meine nächste Hypothese wähle.
13. Als Chris will ich bei zu wenig Daten keine Erfolgsbehauptung sehen, damit kleine Serien nicht überinterpretiert werden.
14. Als Chris will ich monatliche, belegte Learnings sehen, damit neue Ergebnisse in die Planung zurückfließen.
15. Als Chris will ich ausschließlich tatsächlich veröffentlichte Skripte als Sprachbeispiele verwenden, damit verworfene Entwürfe meine Stimme nicht verändern.
16. Als Chris will ich das ManyChat-Paket vor der Veröffentlichung vorbereiten, damit Texte und Keyword rechtzeitig fertig sind.
17. Als Chris will ich Spoken CTA, Caption-CTA und Trigger gemeinsam prüfen, damit das gewählte Keyword überall identisch ist.
18. Als Chris will ich Überschneidungen mit bekannten aktiven Kampagnen sehen, damit ich konkurrierende Trigger vermeiden kann.
19. Als Chris will ich öffentliche Antworten, Opening DM und Auslieferung in Reihenfolge bearbeiten, damit ich den Empfangsablauf prüfen kann.
20. Als Chris will ich optionale E-Mail-Abfrage, Follow-Prüfung und Follow-up bewusst aktivieren, damit keine Zusatzabfrage unbemerkt entsteht.
21. Als Chris will ich Zeichen-, Byte- und Button-Grenzen prüfen, damit das Paket in den Zielkanal passt.
22. Als Chris will ich die öffentliche PDF-URL gegen die freigegebene Datei prüfen, damit der richtige Guide ausgeliefert wird.
23. Als Chris will ich ein konkret versioniertes Paket freigeben und exportieren, damit die Übergabe eindeutig ist.
24. Als Chris will ich externe Einrichtung und echten Instagram-Test separat dokumentieren, damit eine Vorschau nicht als bestandener Live-Test gilt.
25. Als Chris will ich aggregierte ManyChat-Ergebnisse ergänzen, damit Auslieferung und Klicks neben Reel-Kennzahlen sichtbar werden.
26. Als Chris will ich die gesamte Kette synthetisch testen, damit echte Veröffentlichung keine Voraussetzung für die Entwicklung ist.

## Implementation Decisions

### Veröffentlichungszuordnung

- Neues Objekt `Publication`: eigene ID, Idea-ID, unveränderlicher Approved-Script-Snapshot, vom Menschen erfasstes Veröffentlichungsdatum, verwendeter Titel/erste Caption-Zeile, tatsächliche Caption, Kommentar-CTA/Keyword, optionaler Lead Magnet mit PDF-Version und optionale bestätigte Pattern-Snapshots. `sourceSignalId` der Idea bleibt das fremde Research-Reel; `publishedSignalId` ist die getrennte Verknüpfung zum eigenen Reel.
- Phase 5, Ticket 01 liefert die gemeinsame Snapshot-Grenze. Das Erstellen einer Publication verlangt keinen Lead Magnet. Optional fehlende Pattern, PDF oder Caption werden als fehlend gezeigt, nicht aus einem späteren Entwurf ergänzt. Eine Skriptfassung, die nicht archiviert wurde, bleibt „historische Fassung unbekannt“ und ist nicht als Sprachquelle zugelassen.
- Erst eine menschliche Aktion „Veröffentlichung erfassen“ macht das Vorhaben zur Matching-Eingabe. Sie veröffentlicht nichts und überspringt keine Idea-Produktionsstufe. `Idea.status = published` allein ist kein belegtes Owned Reel und keine ausreichende Lernbasis.
- Konservative Arbeitsannahme für automatisches Matching: exakt eine unverbundene Instagram-Reel-ID eines passenden Owned Creators am eingegebenen Veröffentlichungstag in Europe/Berlin und exakte normalisierte Übereinstimmung von Titel oder erster Caption-Zeile. Fehlender/platzhalterartiger Titel, mehrere Treffer, anderer Tag und nur ähnliche Texte ergeben Vorschläge. Unscharfe Suche darf keine automatische Verknüpfung schreiben. Aus mehreren Owned Creators muss der Ziel-Creator feststehen.
- Verknüpfen prüft Owned-Markierung, Format, kanonische ID und Einzigartigkeit an der Speichergrenze. Ein Reel kann nur einer Publication zugeordnet sein. Eine Publication hat ein Reel und höchstens einen individuellen Lead Magnet. Doppelklick und Retry sind idempotent. Caption-Änderungen nach der Verbindung lösen kein Rematching aus.
- Korrekturen erfolgen bewusst mit protokollierter alter/neuer Zuordnung. Abgeleitete Learnings und Sprachpakete werden ungültig; Messungen bleiben an ihrem jeweiligen Signal. Historische PDF-/Paketversionen werden nicht umgeschrieben. Verknüpfte Skripte werden nicht automatisch wieder geöffnet.

### Gezielte Messungen

- Ein eigener Metrics-Run fragt bereits zugeordnete Reel-URLs/Shortcodes direkt ab. Er verwendet den vorhandenen Apify-Zugang hinter einer getrennten Operation des Instagram-Adapters. Er verändert weder den Discovery-Korpus noch `lastCheckedAt` des normalen Creator-Refreshs. Vor Umsetzung wird die direkte Reel-Abfrage mit der aktuellen Provider-Dokumentation und einem begrenzten Fixture verifiziert; kein erfundener Endpunkt.
- Startwerte als Betriebsvorschlag: täglich Reels bis 30 Tage, wöchentlich Reels von 31 bis 90 Tagen; ältere Reels nur manuell. Höchstens 20 fällige Reels pro Run, älteste fällige Messung zuerst. Mengenlimit, konfiguriertes Kostenbudget und Nutzungsprotokoll; keine unbegrenzten Wiederholungen. Ein fehlender Kostenwert ist unbekannt und gestattet keine unkontrollierten Folgeläufe.
- `PerformanceObservation` liegt separat: Signal-ID, Run-ID, tatsächlicher Erfassungszeitpunkt, Veröffentlichungsalter, Provider, Plays/Views/Likes/Comments soweit geliefert, verwendete Followerzahl samt Stand und daraus abgeleitete Werte. Fehlende Werte bleiben optional. Der für aktuelle Signal-Karten geltende Normalisierungsvertrag bleibt erhalten; die Messhistorie darf keine unbekannten Rohwerte in echte Nullen verwandeln.
- Idempotenz pro Signal und logischem Messlauf. Ein Retry schreibt keinen zweiten Punkt für dieselbe Messung. Sinkende Zähler werden nicht künstlich angehoben; die UI kennzeichnet eine mögliche Provider-Korrektur. Teilfehler erhalten die letzte gültige Messung mit sichtbarem Alter. Gelöschte/private/nicht gelieferte Reels haben einen Fehlerstatus, keine Null-Performance.
- Ohne historische Messung gibt es keine rückgerechnete 24-Stunden- oder Sieben-Tage-Zahl. Vergleichspunkte verwenden nur tatsächlich in den Fenstern 24–48 Stunden, 7–8 Tage und 30–31 Tage erfasste Werte, jeweils die früheste vorhandene Messung. Fehlt sie, bleibt dieser Vergleich offen. Das aktuelle Endergebnis kann weiterhin mit seinem wirklichen Alter angezeigt werden.

### Eigene Learnings und Stimme

- Die Performance-Ansicht bleibt beim Owned-Bereich und verlinkt Publication, Skript-Snapshot und optional Lead Magnet/Pattern. Fremde Creator bleiben Hypothesenquelle und fließen nicht als eigene Ergebnisse ein. Öffentliche Plays und Comments belegen keine Saves, Leads oder Verkäufe.
- Filter nach Hook/Angle, Framework, bestätigtem Pattern, CTA/Keyword und vorhandener PDF. Vergleich nur innerhalb desselben Owned Creators und Messfensters. Jede Zahl nennt Stichprobengröße, Messbasis und konkrete Reels. Keine Prozentverbesserung ohne gültigen Nenner und keine Kausalitätsbehauptung.
- Monatlicher Review übernimmt die fachliche Absicht des alten Tickets „Retained Learnings“. Unter zehn eindeutig zugeordneten veröffentlichten Reels wird ein Lauf mit „zu wenig Daten“ protokolliert. Einzelne Vergleiche benötigen zusätzlich mindestens drei Reels je Gruppe mit Messung im gleichen Fenster; diese Gruppengrenze ist eine vorläufige Arbeitsannahme. Fehlen sie, entstehen keine gruppenspezifischen Empfehlungen.
- Convex darf die deterministischen Vergleiche und einen ausstehenden Syntheseauftrag berechnen. Formulierte Learnings entstehen nur im lokalen Bridge; Cloud-Cron und localhost werden nicht direkt verbunden. Der lokale Worker holt offene Monatsläufe nach. Ein Monat plus Daten-Hash ist idempotent. Modelltext wird auf tatsächlich mitgegebene Publication-/Signal-IDs und berechnete Werte geprüft.
- `Learning` enthält Hypothese, Population, Vergleich, Beleg-IDs, Datenstand und nächsten überprüfbaren Versuch. Chris kann einen Vorschlag behalten oder verwerfen. Keine automatische Änderung von Scoring, Frameworks oder Pattern-Status.
- Sprachbeispiele werden aus tatsächlich zugeordneten veröffentlichten Skript-Snapshots gewählt. Reopened Scripts, neue Drafts, Approved ohne Veröffentlichung, fremde Transkripte und synthetische Fixtures sind ausgeschlossen. Chris sieht die Quellen und startet bewusst die Aktualisierung eines versionierten Sprachprofils. Das Paket ergänzt künftige Hook-/Draft-Läufe, verändert bestehende Skripte aber nicht. Falsche Zuordnung und entfernte Owned-Markierung entwerten betroffene Beispiele. Ein ausgeschaltetes Sprachprofil fällt auf die bestehenden Stilregeln zurück.

### ManyChat-Paket

- Ein `ManyChatHandoff` ist ein lokaler versionierter Entwurf mit Lead-Magnet-ID, optionaler Publication während der Vorbereitung, freigegebenem Script-Snapshot und später exakter PDF-Version. Status `draft`, `review`, `approved`, `exported`; externe Einrichtung/Tests/Aktivierung sind getrennte menschlich dokumentierte Angaben mit Zeitpunkt.
- Pflichtumfang bei Freigabe: kanonische Reel-ID, Shortcode, URL, Automationsname, `Specific post or reel`, primäres Kommentar-Keyword, optionale Alias-/Ausschlusswörter, gesprochener CTA, Caption-CTA, Entscheidung zu öffentlichen Antworten mit bei Aktivierung ein bis drei Varianten, Opening-DM-Text mit echtem Interaktionsbutton/Quick Reply, Auslieferungstext, öffentliche HTTPS-PDF-URL, Link-Label, Kampagnen-Tag, optionaler Auslieferungs-Tag/Ziel und Freigabezeit.
- Primäres Keyword ist die aktive Wahl aus Phase 5. Alias-Keywords erweitern den Trigger, ersetzen aber nicht dieses Wort in Skript und Caption. Keyword-Prüfung verwendet normalisierte ganze Wörter; Schreibweise wird einheitlich vorgeschlagen. Widersprüche wie SYSTEM/JARVIS blockieren die Freigabe. Die App bearbeitet kein freigegebenes Skript automatisch.
- Lokales Kampagnenregister speichert bekannte Keywords, Reel-Begrenzung, Status und Zeitpunkt der letzten menschlichen Bestätigung. Warnungen berücksichtigen gleichen Reel-Scope und All-Reels-Trigger. Ohne ManyChat-Leseintegration bedeutet kein lokaler Konflikt nicht, dass extern keiner existiert; die Vollständigkeit des Registers muss Chris bei Übergabe bestätigen.
- E-Mail-Abfrage, Follow-Prüfung und Follow-up sind standardmäßig aus. Aktivierung verlangt die jeweiligen Texte und Entscheidungen. Für E-Mail müssen Zweck, dokumentierte Grundlage, Hinweis-URL und spätere Nutzung festgehalten sein. Diese Angaben sind menschliche Eingaben, keine automatische rechtliche Freigabe. Es werden weder Kontaktlisten noch E-Mail-Adressen gespeichert. Der Export enthält auch den menschlichen Prüfpunkt für Auskunft, Export, Abmeldung, Löschung und Aufbewahrungsregel.
- Gewählter Ablauf: Kommentar → optionale öffentliche Antwort → Opening DM → Interaktion → optionale E-Mail-Abfrage → optionale Follow-Prüfung → Auslieferung → optionaler Follow-up nur ohne Linkklick innerhalb des Messaging-Fensters. Ohne Interaktion wird kein Öffnen des Fensters unterstellt. Die App führt keine dieser Nachrichten aus.

### Aktuell geprüfte Plattformgrenzen

Die folgenden Quellen wurden am 2026-09-10 erneut gelesen. Implementierte Limits erhalten eine Regelversion mit Prüfdatum und werden vor der externen Abnahme erneut abgeglichen.

- Erster Kommentar pro Person/Reel; erste private Antwort als einzelner Content-Block; keine User-Input- oder Delay-Blöcke darin. Ein Website-Button allein öffnet kein Interaktionsfenster. Die konkrete Kanalverbindung sowie Original-/Remix-Berechtigung werden im Zielkonto geprüft. [Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)
- Button-Label unter 20 Zeichen; höchstens drei Buttons pro Instagram-Textblock. Dynamische Variablen müssen mit aufgelöstem Testwert geprüft werden, nicht nur als kurzer Platzhalter. [Buttons](https://help.manychat.com/hc/en-us/articles/14281157003292-Buttons)
- Text mit Buttons höchstens 640 Zeichen, ohne Buttons höchstens 1.000. Die Hilfe nennt zusätzlich eine 1.000-Byte-Grenze für Instagram-Textnachrichten. Unicode-Zeichen und UTF-8-Bytes werden getrennt geprüft; eine ungeklärte Serialisierungsgrenze wird als offener Zielkanaltest ausgewiesen. Keine automatische Aufteilung der Opening DM. [Instagram troubleshooting](https://help.manychat.com/hc/en-us/articles/14281308423452-Instagram-automation-troubleshooting)
- Der gewählte Flow nutzt immer die Opening DM. Die Quick-Automation-Hilfe beschreibt an einer Stelle E-Mail als erste Nachricht ohne Opening DM, schließt solche Zusatznachrichten später aber aus. Der Plan verallgemeinert diese widersprüchliche Stelle nicht zu einer zusätzlichen unterstützten Variante. [Quick Automation](https://help.manychat.com/hc/en-us/articles/16654065283100-Quick-Automation-Auto-DM-links-from-comments)
- Follow-up muss innerhalb des geöffneten 24-Stunden-Fensters liegen. Der Entwurf prüft Wartezeit und Bedingungen; tatsächliche Interaktion und Versandzeit können nur ManyChat und der menschliche Live-Test belegen. [Messaging windows](https://help.manychat.com/hc/en-us/articles/23358636027932-Understanding-messaging-windows)
- Builder-Vorschau ersetzt keinen Instagram-Test von Actions, Smart Delays und Eingabevalidierung. Das Paket enthält dafür getrennte Prüfpunkte. [Preview automations](https://help.manychat.com/hc/en-us/articles/14281198254620-How-to-preview-automations-in-Manychat)

### Auslieferungslink, Freigabe und Export

- Die öffentliche URL wird nach menschlicher Bereitstellung eingetragen. Ein begrenzter serverseitiger Abruf ohne Cookies/Auth prüft HTTPS, erlaubte öffentliche Ziele samt Weiterleitungen, PDF-Signatur und Byte-Hash gegen das freigegebene Artefakt. Login-Seite, HTML-Downloadseite, lokaler Link, falsche Version und defekter Download blockieren. Das Paket bevorzugt einen direkten PDF-Link; Hosting wird nicht gebaut.
- Preview zeigt die exakte Nachrichtenfolge, Branches und eine Liste aus maschinell bestandenen, fehlgeschlagenen und menschlich offenen Prüfungen. Platzhalter, fehlende Tags, Keyword-Konflikte und Versionsabweichungen blockieren. Fehlende Tarif-/Kanalprüfung bleibt ein sichtbarer manueller Prüfpunkt.
- Finale Handoff-Freigabe bindet Revision, Script-/PDF-Snapshot, Keywords, Texte, Linkprüfung und Regelversion. Änderung entwertet diese Freigabe. Freigabe ist nur bei bestätigtem veröffentlichtem Owned Reel und freigegebener PDF möglich. Der vorbereitende Entwurf funktioniert vorher mit sichtbaren Lücken.
- Export als menschenlesbares Markdown und versioniertes JSON enthält ausschließlich das genehmigte Paket. Das JSON ist ein Übergabeformat von Signal Room, kein behauptetes natives ManyChat-Importformat. Kein API-Write, Browser-Klick in ManyChat, Versand oder Hosting-Upload.
- Nach externer Einrichtung kann Chris Testprotokoll und Aktivierungszeit eintragen. Getrennt zu bestätigen: korrekter Kanal/Reel, neuer Testkontakt für den ersten Kommentar, Keyword, Opening-Interaktion, Download auf Smartphone, Tags, optionale Branches und Follow-up-Bedingung. Ein Handoff darf schon vor diesem Test exportiert werden; „auf Instagram geprüft“ erst nach dokumentiertem Test. Lokaler Status beweist keine tatsächliche Aktivierung.

### Aggregierte ManyChat-Ergebnisse

Optionaler manueller Erfassungsdialog für Berichtszeitraum, externen Automationsbezug, Quelle/Erfassungszeit, Runs, Sends, Klicks und gemeldete CTR. Werte sind Aggregationen und werden als manuell erfasst gekennzeichnet. Unterschiedliche Zählweisen bleiben erhalten; Provider-CTR wird nicht durch eine unpassende eigene Formel ersetzt. Duplikate werden pro Kampagne und Zeitraum ersetzt, überlappende kumulative Perioden nicht summiert. Keine Personenprofile, Kommentartexte, Tokens, Empfängerlisten oder unzulässige Hochrechnung zu Verkäufen.

### Betrieb und Verträge

Convex speichert Publication, Messpunkte, Learnings, Sprachprofil und Handoff-Metadaten separat mit begrenzten Queries. Datei-Fallback bleibt nutzbar. Vorhandene Scores und Statusketten werden nicht ersetzt. Neue Storage-Operationen prüfen Revisionen, referenzierte IDs und atomare Zuordnungen. Alle neuen UI-Wege haben Lade-, Leer-, Fehler-, Konflikt-, Ausstehend- und Erfolgszustände; synthetische Demo ohne Providerzugriff bleibt erhalten. Dokumentation und Glossar werden pro Ticket ergänzt.

## Testing Decisions

Hauptgrenze sind Publication-, Metrics- und Handoff-Anwendungsfälle mit kontrollierter Uhr, Fake-Storage, Fake-Connector und Fake-Bridge. Vorbilder: Owned-Filter, Refresh-Idempotenz, Script-Snapshot/Freigabe aus Phase 5 und vorhandene Run-Tests. Keine Tests gegen Promptformulierungen.

- Matching: eindeutiger Treffer, doppelte Titel, gleiche Captions, Zeitzonenwechsel, fehlender Owned Creator, fremdes Research-Reel, bereits zugeordnet, konkurrierende Requests, Korrektur und Legacy-Fassung.
- Metrics: altes Reel außerhalb Delta-Fenster, fehlende statt null Kennzahl, teilweise Antwort, gesunkener Zähler, Retry ohne zweiten Punkt, ausstehende Messfenster, Kosten-/Mengenlimit.
- Learnings: 9/10 Publikationen, zu kleine Untergruppen, verschiedene Beobachtungsalter, erfundene Beleg-ID, veralteter Monatslauf; keine Wirkung auf fremde Outlier-Gruppen. Sprachpaket schließt nicht veröffentlichte und unbekannte Skriptfassungen aus.
- Handoff: alle optionalen Zweige, falscher Button-Typ, 19/20 Zeichen im Label, 640/641 Zeichen, UTF-8 mit Umlauten/Emoji, 24-Stunden-Grenze, fehlende Kanalprüfung, SYSTEM/JARVIS, unvollständiges Register, Platzhalter.
- PDF-Link: privates Ziel, Redirect, HTML statt PDF, falscher Hash, abgelaufener Link; jede Inhaltsänderung entwertet Freigabe. Export löst keinen externen Write aus.
- Convex-Tests für atomare Zuordnung, Mess-Idempotenz und Freigaben nach generierten Vorgaben; `npm run check` inklusive neuer Tests. Synthetische Ende-zu-Ende-Abnahme des Produktflusses und mobile Prüfung bei 360 CSS-Pixeln.
- Externe Instagram-Abnahme ist ein menschlicher Betriebsnachweis. Automatisierte Tests senden keine Nachrichten. Entwicklung und interne Abnahme können vollständig mit Fixtures erfolgen, reale Wirksamkeitsbewertung benötigt später echte Veröffentlichungen.

## Out of Scope

ManyChat-API-Integration, automatische Einrichtung/Aktivierung, tatsächlicher Nachrichtenversand, Publizieren von Reels/PDFs, Kontaktverwaltung, Meta-Insights-Adapter, automatische Umsatzattribution, automatische Änderung der Stimme aus Drafts, Training/Fine-Tuning und externe Automation ohne eigene Design-/Grill-Session.

## Further Notes

Performance-Grundlage und Paketvorbereitung sind getrennte Pfade. Die Performance braucht Phase 5 nur für den gemeinsamen Script-Snapshot. Pattern-Vergleiche brauchen zusätzlich Phase 4, Ticket 04. Die finale ManyChat-Übergabe braucht Phase 5, Ticket 10 und ein tatsächlich veröffentlichtes Owned Reel. Diese Laufzeitvoraussetzung blockiert keine Implementierung mit synthetischen Fixtures.

Das alte Ticket 24 „Retained Learnings“ bleibt unverändert als historische Anforderung. Seine Umsetzung wird durch Phase 6, Ticket 03 abgedeckt; es darf nicht zusätzlich als zweiter konkurrierender Monatslauf gebaut werden. Zehn veröffentlichte Ergebnisse sind weiterhin das übergeordnete Mindestniveau. Die frühere Vorstellung einer direkt im Cloud-Cron laufenden Codex-Synthese wird an ADR-0004 angepasst.

Quellen: [Produktentscheidungen, Abschnitte 9/12–15](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/CONTENT-INTELLIGENCE-DECISIONS.md>), [ManyChat-Research](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/MANYCHAT-REEL-LEAD-MAGNET-RESEARCH.md>), [Retained Learnings](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/signal-room-instagram/issues/24-retained-learnings-aus-veroeffentlichten-ideas.md>), [Lead-Magnet-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>), [ADR-0004](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/adr/0004-codex-sdk-fuer-text-und-bilder.md>).

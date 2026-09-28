# Phase 5: Lead Magnets

Status: ready-for-agent
Stand: 2026-09-10

## Problem Statement

Freigegebene Skripte können ein konkretes Material versprechen, die App hat dafür aber weder Research-Dossier noch bearbeitbaren Lead Magnet oder PDF-Freigabe. Die fünf vorhandenen CTA-Pakete zeigen den Bedarf. Zugleich belegt die Quellenprüfung, dass Aussagen erfolgreicher Reels fachlich falsch oder zu weitgehend sein können. Reichweite ist kein Beleg für eine technische Behauptung.

Der bestehende Skriptvertrag speichert die aktuelle Abschnittsliste und eine Revisionsnummer, aber kein unveränderliches Archiv jeder Freigabe. Ein Lead Magnet benötigt eine belastbare Quellfassung, die auch nach dem Wiederöffnen des Skripts erhalten bleibt.

## Solution

Chris startet an einem freigegebenen Skript bewusst `Lead Magnet erstellen`. Ein eigener Hauptbereich führt von Research über die Freigabe von Dossier und Gliederung zu einem modularen Inhaltsentwurf. Ein individuelles PDF entsteht aus geprüften Quellen und ausgewählten Praxis-Nuggets. Nach Layout- und Linkprüfung gibt Chris genau diese PDF-Fassung frei und exportiert sie lokal beziehungsweise in die festgelegte Vault-Ablage.

Offizielle Quellen klären technische Aussagen. Bewusst gestartete Vault- und EA-Brain-Recherche ergänzt Erfahrung. Interne Herkunft bleibt nachvollziehbar; im öffentlichen Artefakt stehen nur freigegebene Inhalte und öffentliche Quellen. Der CTA wird pro Lead Magnet gewählt. `Kein CTA` ist eine gültige Entscheidung.

## User Stories

1. Als Chris will ich einen Lead Magnet bewusst aus einem Approved-Skript starten, damit nicht jeder Entwurf eine PDF erzeugt.
2. Als Chris will ich die exakte freigegebene Skriptfassung wiederfinden, damit spätere Änderungen meine Research-Basis nicht verändern.
3. Als Chris will ich ein bestehendes Projekt beim zweiten Klick öffnen, damit keine doppelten Lead Magnets entstehen.
4. Als Chris will ich geänderte Skriptquellen ausdrücklich übernehmen, damit ich die Auswirkungen auf Freigaben sehe.
5. Als Chris will ich Research-Frage und Nutzenversprechen bearbeiten, damit die Recherche das Versprechen des Reels erfüllt.
6. Als Chris will ich offizielle Dokumentation und Repository-Belege zuerst prüfen, damit ich technische Aussagen belegen kann.
7. Als Chris will ich Quellen mit Fundstelle, Version und Prüfdatum sehen, damit Aussagen rückverfolgbar bleiben.
8. Als Chris will ich Widersprüche und fehlende Primärbelege erkennen, damit ich keine erfundenen Fähigkeiten verspreche.
9. Als Chris will ich den Vault nur per bewusster Aktion durchsuchen, damit meine Wissensbasis gezielt einfließt.
10. Als Chris will ich EA Brain für aktuelle Lücken nutzen, damit vorhandenes Community-Wissen ergänzt wird.
11. Als Chris will ich ohne erreichbaren Community-Zugang weiterarbeiten, damit gute Primärquellen allein ausreichen können.
12. Als Chris will ich Nuggets auswählen, bearbeiten oder verwerfen, damit jeder Tipp einen praktischen Schritt verbessert.
13. Als Chris will ich kritische Hinweise nur bei materiellem Nutzen übernehmen, damit der Guide fokussiert bleibt.
14. Als Chris will ich die interne Herkunft eines Tipps sehen, damit seine öffentliche Zusammenfassung überprüfbar bleibt.
15. Als Chris will ich Community-Wissen in einer fortlaufenden Notiz je Thema ergänzen, damit ich es bewusst wiederverwenden kann.
16. Als Chris will ich Dossier und Gliederung vor dem Text freigeben, damit ich Recherchefehler früh abfange.
17. Als Chris will ich Quickstart, Schritte, Beispiele, Code, Prompts, Screenshots und Checklisten als Module bearbeiten, damit der Inhalt zum Thema passt.
18. Als Chris will ich neue technische Behauptungen im Editor erkennen, damit das Research-Gate nicht nachträglich umgangen wird.
19. Als Chris will ich den Umfang vom Nutzen abhängig machen, damit keine Seitenzahl den Inhalt künstlich verlängert.
20. Als Chris will ich ein gemeinsames PDF-Design mit passenden Modulen, damit die Guides zusammengehören und individuell bleiben.
21. Als Chris will ich Keyword-Vorschläge bearbeiten und auswählen, damit das Reel ein klares Material verspricht.
22. Als Chris will ich PDF-Angebots-CTA und Kommentar-Keyword getrennt entscheiden, damit Auslieferung und Angebot verschiedene Aufgaben erfüllen.
23. Als Chris will ich ohne CTA-Ziel weiter recherchieren, damit nur der finale Export auf diese Entscheidung wartet.
24. Als Chris will ich Layoutfehler, fehlende Bilder und kaputte Links vor der Freigabe sehen, damit die PDF lesbar ausgeliefert wird.
25. Als Chris will ich genau die geprüften PDF-Bytes freigeben, damit beim Export keine andere Fassung entsteht.
26. Als Chris will ich nach Änderungen erneut prüfen und freigeben, damit eine alte Freigabe nicht für neue Inhalte gilt.
27. Als Chris will ich die fertige PDF herunterladen und im Vault ablegen, damit ich sie später bewusst veröffentlichen kann.
28. Als Chris will ich alle Zustände mit synthetischem Material sehen, damit der Ablauf ohne Accounts funktioniert.

## Implementation Decisions

### Startpunkt, Revisionen und Übergaben

- Eine unveränderliche `ApprovedScriptSnapshot` speichert Skript-ID, Revision, freigegebene Abschnitte, gewählten Hook und Angle, Framework, optionale Pattern-Referenzen, Beleg-IDs, Freigabezeit und Inhalts-Hash. Neue Freigaben erzeugen idempotent einen Snapshot; vorhandene aktuell Approved-Skripte können beim ersten bewussten Start eingefroren werden. Nicht mehr vorhandene historische Texte werden nicht rekonstruiert.
- Diese Snapshot-Grenze gehört Phase 5, Ticket 01. Phase 6 verwendet sie erneut. Phase 4 ist kein technischer Blocker für Phase 5: Pattern-Referenzen sind optional; fehlen sie, bleibt das kenntlich.
- Ein `LeadMagnet` trägt kanonische ID, Idea-ID, Script-Snapshot-ID, Nutzenversprechen, Forschungsfrage, Status, Revision und Zeitpunkte. Pro Produktionsvorhaben gibt es ein aktives Projekt; wiederholtes Erstellen öffnet es. Ein weiterer eigener Reel-Einsatz braucht ein neues individuelles Projekt und eine neue PDF. Wissensbausteine dürfen bewusst kopiert werden, fertige PDF-Versionen nicht an mehrere Reels gebunden werden.
- Eine neue Skriptrevision ersetzt die Quelle nicht automatisch. `Neue Skriptfassung übernehmen` zeigt den Unterschied, bindet einen neuen Snapshot und entwertet nachgelagerte Freigaben. Die alte Quelle und bereits exportierte PDF bleiben historisch lesbar. Ein laufender Run darf nicht auf eine mittlerweile geänderte Basis schreiben.

### Status und Freigaben

Der redaktionelle Status lautet `research`, `research-review`, `draft`, `pdf-review`, `approved`. Erst die menschliche Freigabe des Dossiers UND der Gliederung gestattet die Texterstellung. Die spätere PDF-Freigabe ist davon getrennt. Research, Text und Rendering besitzen eigene Run-Zustände mit Claim, Ablaufzeit, Abbruch/Fehler und explizitem Retry.

Jede Freigabe bindet einen Hash der abhängigen Revisionen. Inhaltliche Änderungen an Quellen, ausgewählten Findings, Gliederung oder Skriptquelle entwerten die Research-Freigabe. Text-, Visual-, Design- oder CTA-Änderungen entwerten mindestens Layoutprüfung und PDF-Freigabe. Ein normaler Textfeinschliff braucht keine neue Research-Freigabe, sofern keine neue technische Aussage oder Quelle hinzukommt. Neu hinzugefügte Sachbehauptungen werden vor Export erneut belegt und geprüft. Ein Client kann Status und Hash nicht frei als „freigegeben“ setzen; die Speichergrenze validiert Voraussetzungen und erwartete Revision.

### Research-Dossier

- `ResearchSource` speichert Typ, kanonischen Quellenbezug, öffentliche URL oder internen Beleg, Titel, Abrufdatum, Version/Commit soweit verfügbar, begrenzten Auszug, Sichtbarkeit und Prüfstatus. `ResearchFinding` trägt Aussage, konkrete Anwendung, Quellen-IDs mit Fundstellen, Status `proposed`, `accepted`, `rejected` oder `needs-evidence` sowie Kennzeichnung als dokumentiert oder persönlich getestet. Quellen, Findings und Abschnitte sind getrennte Records statt unbegrenzt wachsender Arrays.
- Reihenfolge: offizielle Dokumentation/Repository, relevante Beispiele/Issues/Releases, bewusst gewähltes Vault-Wissen, EA Brain für Lücken, ergänzende seriöse Webquelle mit begründetem Bedarf. Eine Community-Mehrheit bestätigt keine undokumentierte Tool-Fähigkeit. Ein eigenes Bewertungsschema darf als redaktioneller Inhalt ohne erfundenes Repository erscheinen.
- Erste technische Schnittstelle ist ein serverseitiger, begrenzter Quellenleser für bewusst gewählte öffentliche HTTPS-Quellen. Automatische Quellenvorschläge werden vor Abruf als auswählbare Liste gezeigt. Keine Installation oder Ausführung von Repository-Code. Primärquellen müssen für die technische Behauptung tatsächlich etwas belegen; ein HTTP-Erfolg oder ein offizieller Domainname genügt nicht.
- Quellenleser prüft Ziel, Weiterleitungen und aufgelöste Adresse gegen lokale/private Netze, begrenzt Dateigröße, Laufzeit und Folgeabrufe und speichert normalisierte Ergebnisse. Inhalte sind untrusted input. Rohes HTML, ausführbares Markdown und Provider-Objekte gelangen nicht in Editor oder Modellanweisungen.
- Research-Gate: klares Nutzenversprechen, belegter Quickstart, konkreter Anwendungsfall, nachvollziehbare Schritte, mindestens ein praktisch brauchbarer Nugget, passende erklärende Visuals oder begründeter Verzicht, relevante Einschränkungen und geprüfte Primärbelege für technische Aussagen. Nugget kann auch aus Primärquellen stammen. Kein Quellenzahl- oder Seitenzahl-Gate.
- Ungeprüfte Behauptungen blockieren ihre Verwendung im öffentlichen Inhalt. Fehlende Community-Treffer blockieren nicht das gesamte Projekt. Chris kann problematische Aussagen entfernen und mit belegten Inhalten weiterarbeiten. Es wird nie eine persönliche Ausführung behauptet, nur weil Quellen gelesen wurden.

### Vault und EA Brain

- Vault-Lesen und Vault-Schreiben sind getrennte bewusste Aktionen. Produktiver Vault und erlaubte Unterbereiche werden lokal serverseitig konfiguriert; der Browser übergibt keine frei wählbaren Dateisystempfade. Es gibt keinen automatischen Scan beim Öffnen eines Skripts oder bei einem Refresh.
- Vault-Recherche liefert begrenzte Treffer aus ausgewertetem Community-Wissen; Originalposts bleiben interne Belege. EA Brain ist eine getrennte Lese-Schnittstelle mit eigener Codex-OAuth-Verbindung und Scope `mcp:read`. Laut Grilling-Protokoll wurde dieser Zugang eingerichtet; die Umsetzung prüft die aktuelle Erreichbarkeit, ohne Zugangsdaten zu kopieren. Auth-Material bleibt außerhalb von Convex-Inhaltsrecords, Browser und Git.
- Keine pauschale Freigabe von Netzwerk oder MCP-Werkzeugen für bestehende Textläufe. Recherchezugriff erfolgt über spezifische lokale Adapter; der Codex-Bridge synthetisiert ausschließlich das begrenzte, bereits gelesene Paket und bleibt für Textläufe ohne Netz. Falls die aktuelle MCP-Anbindung dies nicht unterstützt, muss der Adapter einen klaren Verbindungsfehler melden; keine erfundene Tool-Integration.
- Speichern ausgewerteten Community-Wissens erzeugt eine Änderungsansicht für genau eine kanonische Themennotiz. Chris bestätigt den datierten Anhang mit Tenor, Nuggets, relevanten Hinweisen, verworfenen Aussagen und internen Quellenlinks. Idempotenzschlüssel je Research-Lauf verhindert doppelte Anhänge. Gleichzeitige externe Bearbeitung liefert einen Konflikt statt Überschreiben.
- Die kanonische Themennotiz erhält einen stabilen Themen-/Repository-Schlüssel und einen begrenzten Dateinamen. Pfadflucht, Symlink-Ausbruch und Änderungen am Rohmaterial sind ausgeschlossen. Research aus öffentlichen Quellen wird nicht ungefragt als Community-Wissen in den Vault geschrieben.

### Inhaltsentwurf und CTA

- Der Hauptbereich Lead Magnets zeigt Status, Quellskript, letzte Änderung und nächste erforderliche Aktion. Die Detailansicht verbindet Quellen, Findings, Gliederung, Module und Vorschau. Module: Nutzenversprechen, Quickstart, Schritte, Praxisbeispiel, Screenshot mit Markierungen, Code/Prompt, Vergleich, Checkliste, Nugget, optionaler Hinweis und CTA.
- Generierung verwendet ausschließlich den freigegebenen Dossier-/Gliederungsstand. Zurückgelieferte Quellen- und Finding-IDs werden gegen das Paket aufgelöst. Der Editor erlaubt manuelle Änderungen und zeigt ungeklärte Quellenbezüge. Generierung ersetzt keinen gleichzeitig bearbeiteten Entwurf. Lange Guides werden in begrenzten Abschnitten erstellt.
- Ein Nugget bleibt über Finding-ID intern belegt. Der Renderer erhält ein eigenes öffentliches Dokumentmodell ohne Community-Namen, Mitgliedernamen, interne Links, lokale Pfade oder interne Kommentare. Prüfung umfasst sichtbaren Text, Links, PDF-Metadaten, Dateinamen und eingebettete Asset-Beschriftungen. Offizielle öffentliche Primärquellen bleiben klickbar.
- PDF-CTA: `undecided`, `none` oder `offer` mit Ziel, Text und validierter URL. Ohne Entscheidung sind Entwurf und interne Vorschau erlaubt; finaler Export ist gesperrt. Platzhalter bleiben gesperrt, auch bei vermeintlich gesetztem CTA.
- Kommentar-Keyword ist separat. Drei kurze Vorschläge oder eigene Eingabe, genau eine aktive Wahl für den ersten Ausbau; zusätzliche Alias-Keywords erst im ManyChat-Paket. Kommentar-CTA und Caption-Entwurf bleiben getrennt vom gesprochenen CTA und vom PDF-Angebots-CTA. Keine Änderung am gesperrten Skript. Bei Abweichung muss Chris es wieder öffnen und neu freigeben; der Lead Magnet übernimmt danach den neuen Snapshot ausdrücklich.

### PDF, Prüfung und Export

- Startdesign als veränderbare Arbeitsannahme: ein gemeinsames gut lesbares A4-Hochformat mit Markenfarben, Coral-Akzent, vorhandenen Schriften soweit lokal verfügbar, wiederkehrender Quellen- und Seitenlogik. Weitere visuelle Varianten bleiben spätere redaktionelle Wahl. 6–10, 12–18 und 20–30 Seiten sind Orientierungsklassen, keine technischen Limits.
- Ein lokaler Renderer hinter einem austauschbaren PDF-Port erzeugt Vorschauen aus dem öffentlichen Dokumentmodell. Er führt keinen Quellcode aus und lädt keine beliebigen Remote-Ressourcen. Erklärende Screenshots, Codeblöcke und Diagramme werden als geprüfte Assets eingebunden. Renderer-/Font-Version und Dokument-Hash werden am Ergebnis gespeichert.
- Layoutbericht prüft Überlauf, unlesbare Codeblöcke, fehlende Assets, leere/fehlerhafte Seiten, ungünstige Umbrüche, konsistente Seitenelemente und externe Links. Automatische Geometriechecks ersetzen keine menschliche Seitenprüfung. Nicht zuverlässig maschinell bewertbare Umbrüche werden als menschliche Prüfpunkte geführt. Nicht erreichbare Quellen werden repariert, ersetzt oder mit begründeter Ausnahme erneut geprüft; fehlende Pflichtinhalte und Platzhalter sind nicht übersteuerbar.
- `PdfArtifact` bindet Lead-Magnet-ID, Inhaltsrevision, Designversion, Byte-Hash, Seitenzahl, Prüfbericht und Freigabe. Chris genehmigt die konkrete Vorschau. Export liefert dieselben Bytes; kein stiller Neurender nach Freigabe. Änderungen erzeugen eine neue Artefaktversion.
- PDF-Bytes und Assets bleiben im ignorierten lokalen Artefaktspeicher. Convex enthält operativen Zustand und Metadaten, keine unbeschränkten Binärdaten. Lokale Downloadrouten sind keine öffentlichen Auslieferungslinks. `Im Vault ablegen` kopiert nach bewusster Aktion nur freigegebene PDF-Bytes in die vereinbarte Lead-Magnet-Ablage, ohne bestehende Versionen zu überschreiben.
- Öffentliche Bereitstellung ist eine spätere menschliche Aktion. Phase 6 nimmt die anschließend eingetragene öffentliche HTTPS-URL entgegen und prüft sie gegen das freigegebene Artefakt. Phase 5 wählt und konfiguriert keinen Hosting-Anbieter.

### Verträge und Betrieb

Operativer Zustand in Convex, lokaler Datei-Fallback nach ADR-0005, Wissen im Vault. Neue Port-Methoden sind additiv. Alte Scripts, Ideas und Legacy-Storyboards bleiben lesbar. Jede Anbindung wird in einem eigenen Ticket eingeführt; keine gleichzeitige Ersetzung bestehender Adapter. Claims, Revisionsprüfungen und Freigaben passieren an der Speichergrenze. Browser-Eingaben und Modellantworten werden begrenzt und validiert. Die UI zeigt Laden, leer, laufend, Fehler, blockierte Freigabe, veraltet und vollständig. Demo nutzt synthetische Quellen und Artefakte, ruft keine Provider auf und durchsucht keinen Vault.

## Testing Decisions

Primäre Grenze ist der vollständige Lead-Magnet-Anwendungsfall mit Fake-Storage, kontrollierter Uhr und ersetzbaren Research-, Bridge-, Vault- und PDF-Ports. Vorbilder sind Script-Claims, Lektorat-Antwortvalidierung, Cover-Cache und Storyboard-Freigabe. Gute Tests prüfen sichtbares Verhalten und gespeicherte Fassungen, nicht Promptformulierungen oder private Hilfsfunktionen.

- Start nur aus aktueller Freigabe; Doppelklick; spätere Skriptänderung; unveränderlicher Snapshot; unbekannte historische Fassung.
- Quellenparser, konkrete Belegauflösung, Quellenhierarchie, widersprüchlicher Claim, fehlender Community-Treffer, unzulässige URL/Weiterleitung und übergroße Antwort.
- Vault nur nach Aktion; sichere Zielauflösung; bewusster Anhang; idempotenter Retry; konkurrierende Notizbearbeitung; unabhängiger EA-Brain-Ausfall.
- Research-Freigabe vor Text; neue technische Behauptung; veralteter Run; Änderung entwertet passende Freigaben; fehlender CTA; explizit `none`.
- Öffentlicher Export enthält keine privaten Provenienzfelder, inklusive Metadaten und Links. Synthetische adversariale Quellen prüfen Prompt-Injection und Rendering-Injection.
- PDF-Port mit synthetischem langen Code, langen URLs, mehrseitigen Tabellen, fehlendem Bild und Seitenumbruch. Render-Smoke-Test prüft echte Datei/Seiten und Byte-Identität zwischen Freigabe und Export. Alle Seiten des Abnahmedokuments werden visuell geprüft.
- Convex-Transaktionen für Start, Revision und Freigabe nach generierten Testvorgaben; vollständiges `npm run check` inklusive neuer Prüfungen. Demo bei 360 und 1440 CSS-Pixeln; Dokumentation erklärt jeden Adapter und dessen Vertrauensgrenze.

## Out of Scope

Öffentliches Hosting, automatischer Upload, ManyChat-Konfiguration oder Versand, E-Mail-Liste, wiederverwendete PDF für mehrere Reels, automatische Vault-Vollsynchronisation, Repository-Installation, Ausführung fremden Codes, feste Seitenzahl und fertige Guides zu den fünf Reel-Themen. Diese Phase baut den Produktionsablauf; einzelne Guides entstehen anschließend daraus.

## Further Notes

Phase 5 benötigt Phase 3, nicht die vollständige Phase 4. Community-Anbindungen sind optionale Pfade; das Research-Gate muss ohne sie funktionieren. Der CTA eines konkreten Guides und weitere Designvarianten bleiben bewusst offen, blockieren aber die Umsetzung nicht.

Die bestehenden Reel-Unterlagen nennen bei Hermes sowohl `SYSTEM` als auch `JARVIS`. Keine dieser Varianten wird still als verbindlich übernommen. Dieses Beispiel gehört in die Keyword-Konsistenz-Abnahme. Die Quellenprüfung hat Vorrang vor unbelegten Behauptungen der Quell-Reels. Öffentliche PDFs dürfen insbesondere das private Signal-Room-Repository nicht offenlegen.

Quellen: [Produktentscheidungen, Abschnitte 10/11/13](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/CONTENT-INTELLIGENCE-DECISIONS.md>), [Grilling-Protokoll](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/CONTENT-INTELLIGENCE-GRILLING-PROTOKOLL.md>), [CTA-Quellenprüfung](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/REEL-CTA-SOURCE-AUDIT.md>), [Fünf CTA-Pakete](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/FIVE-REELS-FORMATNAHE-SKRIPTE-MIT-CTA.md>), [Skriptstudio-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-3-skriptstudio/spec.md>), [Sicherheitsmodell](</Users/cristobalcallejongarcia/dev/signal-room-starter/docs/SECURITY.md>).

Lokale Ablagevereinbarung aus den Produktentscheidungen: aktiver Vault `/Users/cristobalcallejongarcia/chriscasa`, ausgewertetes Community-Wissen `/Users/cristobalcallejongarcia/chriscasa/knowledge/skool/`, Rohmaterial `/Users/cristobalcallejongarcia/chriscasa/knowledge/skool/early-ai-adopters/posts/`, fertige PDFs `/Users/cristobalcallejongarcia/chriscasa/content/reels/leadmagnete/`. Diese Pfade sind Betriebsreferenzen, keine vom Browser übergebbaren Parameter.

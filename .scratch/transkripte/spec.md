# Spec: Transkript-Grundlage

**Status:** ready-for-agent
**Stand:** 2026-08-31
**Quellen:** `docs/CONTENT-INTELLIGENCE-DECISIONS.md` (Abschnitte 2.1, 4, 13, Phase 2 in 14), `docs/CONTENT-INTELLIGENCE-GRILLING-PROTOKOLL.md` (Q35, Q40, Q42)
**Vorgänger:** Ticket 20 in `.scratch/signal-room-instagram/issues/` (Transkripte im Korpus, umgesetzt, aber live nie erfolgreich)
**Blockiert:** `.scratch/skriptstudio/spec.md` (das Skriptstudio liest das Volltranskript)

## Problem Statement

Chris will von einem hochperformanten Reel nicht nur die Caption sehen, sondern lesen, was darin gesagt wird. Das ist die Research-Basis für eigene Skripte, für Pattern und später für Lead Magnets.

Heute steht der Korpus bei 1.242 Signals und 1.138 Reels, aber bei null Transkripten mit Status `ready`. Zwanzig Reels tragen `silent`, obwohl sie gesprochenen Inhalt haben; der Parser hat die Antwortform des Actors nicht verstanden, und der Code behandelt `silent` als endgültig. Diese zwanzig Reels würden nie wieder angefragt. Die Automatik wählt außerdem nur über den Outlier-Faktor aus, nicht über den kombinierten Score, den Discover und Briefing schon benutzen. Und selbst ein vorhandenes Transkript zeigt die UI nirgends an. Es gibt keinen Weg, ein einzelnes Reel von Hand zu transkribieren.

## Solution

Ein Reel bekommt sein Transkript auf zwei Wegen: automatisch im Delta-Refresh, wenn sein kombinierter Score über der Transkript-Schwelle liegt, oder von Hand über die Aktion `Transkribieren` an der Karte. Fehlgeschlagene und fälschlich stumme Reels lassen sich mit `Erneut versuchen` nachholen; kein Status blockiert einen manuellen Versuch dauerhaft. Die Automatik zahlt trotzdem nie zweimal für dasselbe Reel.

Das Originaltranskript bleibt unverändert. Daneben entsteht eine Arbeitsfassung, in der nur erkennbar falsch transkribierte Wörter korrigiert sind (Produktnamen, Creator-Namen, Repository- und Tool-Namen, offensichtliche Einzelwörter). Korrekturen erscheinen als markierte Vorschläge, Chris übernimmt, bearbeitet oder verwirft sie einzeln; wiederkehrende Korrekturen wandern in ein persönliches Wörterbuch. Jede Änderung bleibt zum Original rückverfolgbar.

Die Reel-Ansicht (aus Discover-Karte, Briefing-Zeile und Creator-Detailseite geöffnet) zeigt Transkriptstatus, Original, Arbeitsfassung, Korrekturvorschläge und Zeitmarken, wenn der Actor sie liefert. Laden, Fehler mit verständlicher Ursache, Leerzustand und Erfolg sind eigene Zustände. Der Profile-Tab zeigt, was ein Run an Transkripten geholt und gekostet hat.

Bevor irgendein weiterer kostenpflichtiger Lauf startet, wird die aktuelle Antwortform des Actors an einem echten Ergebnis geprüft, als Fixture festgehalten und der Parser darauf angepasst. Die zwanzig falschen `silent`-Einträge werden einmalig zurückgesetzt.

## User Stories

1. Als Chris will ich, dass ein Reel mit hohem kombinierten Score im nächsten Delta-Refresh automatisch transkribiert wird, damit die stärksten Reels der Nische ohne mein Zutun lesbar werden.
2. Als Chris will ich, dass die Automatik ein Reel nie zweimal bezahlt, damit der Apify-Verbrauch planbar bleibt.
3. Als Chris will ich an jedem Reel ohne fertiges Transkript die Aktion `Transkribieren`, damit ich ein Reel, das mich interessiert, unabhängig vom Score lesen kann.
4. Als Chris will ich an einem stummen, fehlenden oder fehlgeschlagenen Reel die Aktion `Erneut versuchen`, damit ein Fehlurteil des Actors oder ein Aussetzer mich nicht dauerhaft vom Inhalt trennt.
5. Als Chris will ich während der Verarbeitung einen klaren Ladezustand sehen und keinen zweiten Lauf für dasselbe Reel starten können, damit ich nicht doppelt zahle.
6. Als Chris will ich nach einem Erfolg direkt das vollständige Transkript sehen, damit ich nicht erst suchen muss, wo es liegt.
7. Als Chris will ich bei einem Fehler die Ursache in einem Satz lesen und den Lauf mit einem Klick wiederholen können, damit ich nicht in Logs schauen muss.
8. Als Chris will ich das Originaltranskript unverändert behalten, damit ich jederzeit prüfen kann, was der Actor wirklich geliefert hat.
9. Als Chris will ich eine Arbeitsfassung, in der Produktnamen, Creator-Namen, Repository- und Tool-Namen und offensichtlich falsche Wörter korrigiert sind, damit ich das Transkript ohne Stolpern lesen und weiterverwenden kann.
10. Als Chris will ich, dass die Arbeitsfassung Füllwörter, Satzbau und Rhythmus des Originals behält, damit sie keine stilistische Glättung ist und die Sprechweise des Creators erkennbar bleibt.
11. Als Chris will ich Korrekturvorschläge markiert sehen und einzeln übernehmen, bearbeiten oder ablehnen, damit nichts ungeprüft in die Arbeitsfassung gelangt.
12. Als Chris will ich eine übernommene Korrektur in mein Wörterbuch aufnehmen, damit dieselbe Verwechslung im nächsten Transkript nicht wieder vorgeschlagen, sondern direkt angewendet wird.
13. Als Chris will ich Wörterbuch-Korrekturen in der Arbeitsfassung genauso rückgängig machen können wie andere, damit ein falscher Wörterbucheintrag nicht unsichtbar Schaden anrichtet.
14. Als Chris will ich für jede Korrektur sehen, was das Original war, damit jede Änderung rückverfolgbar bleibt.
15. Als Chris will ich in der Reel-Ansicht Original und Arbeitsfassung umschalten, damit ich beide Fassungen vergleichen kann.
16. Als Chris will ich Zeitmarken sehen, wenn der Actor sie liefert, damit ich eine Stelle im Reel wiederfinde.
17. Als Chris will ich am Reel den Transkriptstatus mit Zeitpunkt und Zahl der Versuche sehen, damit ich weiß, ob es sich lohnt, es nochmal zu versuchen.
18. Als Chris will ich im Profile-Tab je Run sehen, wie viele Transkripte geholt, stumm, fehlend oder fehlgeschlagen sind und was der Lauf gekostet hat, damit der Kosten-Guard auch Transkripte abdeckt.
19. Als Chris will ich, dass ein manueller Transkript-Lauf als eigener Run protokolliert wird, damit seine Kosten in der Monatssumme auftauchen.
20. Als Chris will ich die Transkript-Schwelle über die Umgebung setzen können, damit ich den Verbrauch ohne Code-Änderung steuern kann.
21. Als Chris will ich, dass Demo-Modus ohne Actor funktioniert und ein Beispiel-Reel mit Transkript und Arbeitsfassung zeigt, damit ich die Ansicht ohne Credentials sehe.
22. Als Chris will ich, dass Hooks-Board, Format Signals und Evidenzpaket weiter die Hook-Quelle lesen und die Arbeitsfassung bevorzugen, wenn sie da ist, damit die Korrekturen überall ankommen.
23. Als Chris will ich, dass die zwanzig heute falsch als `silent` gespeicherten Reels wieder offen sind, damit die Automatik sie beim nächsten Lauf holt.

## Implementation Decisions

### Reihenfolge: erst Actor prüfen, dann bauen

- Der erste Schritt ist ein einzelner echter Actor-Lauf mit einem bis zwei bekannten Reels mit Sprache. Das gelieferte Dataset-Item wird ungekürzt als Test-Fixture abgelegt. Der Parser wird auf genau diese Form angepasst; die bisherige tolerante Feldsuche bleibt als Rückfall.
- Bis dieser Fixture-Test grün ist, bleibt die Automatik ausgeschaltet (Transkript-Limit 0 in der Convex-Umgebung). Das ist ein Handgriff für Chris und steht als Schritt im ersten Ticket.
- Einmalige Bereinigung: alle Signals mit Status `silent` oder `missing` und ohne `transcript` verlieren ihren Status, damit die Automatik sie wieder sieht. Idempotente interne Mutation nach dem Muster der Stufen-Migration der Ideas, dazu dasselbe für den Datei-Store beim Laden.

### Statusmodell

- `transcriptStatus` bekommt zwei weitere Werte: `pending` (angefordert, Actor läuft) und `failed` (Actor-Fehler, mit Ursache). `ready`, `silent`, `missing` bleiben.
- Neue Felder am Signal: `transcriptAttempts` (Zähler), `transcriptUpdatedAt` (Zeitpunkt des letzten Ergebnisses oder Fehlers), `transcriptError` (begrenzte Fehlermeldung, nur bei `failed`), `transcriptSegments` (Zeitmarken, nur wenn der Actor sie liefert: Start, Ende, Text).
- Endgültig für die Automatik: `ready`, `silent`, `missing`. Die Automatik fasst nur Reels ohne Status an. `failed` und `pending` zählen für die Automatik ebenfalls als nicht anzufassen, damit ein systematischer Fehler nicht in jedem Lauf Geld kostet; `failed` wird nur von Hand wiederholt.
- Nichts ist endgültig für den manuellen Weg: `Erneut versuchen` erlaubt jeden Status außer `ready` und einem frischen `pending`.
- `pending` wird beim Start des manuellen Laufs gesetzt und wirkt als Sperre: ein zweiter Klick antwortet mit einem Konflikt, ein Reload zeigt den Ladezustand. Ein `pending`, das älter ist als ein konfigurierter Zeitraum (Standard 10 Minuten), gilt als abgebrochen und wird wie `failed` behandelt; das Prädikat dafür steht neben dem bestehenden Prädikat für den Transkript-Ausgang in der Transkript-Logik, nicht in der UI.

### Automatische Auswahl über den kombinierten Score

- Die Batch-Auswahl des Delta-Refresh liest den `score` des Outlier-Scorers (Outlier, Channel-Relative, Velocity), nicht mehr den nackten Outlier-Faktor. Die Gewichtung des Scores selbst bleibt unverändert; sie ist laut Entscheidungsdokument bewusst offen.
- Neue Konfiguration `TRANSCRIPT_SCORE_THRESHOLD` (Umgebung, Standard so gewählt, dass ein Reel mit Outlier 2 und ohne weitere Boosts gerade darüber liegt). Stärkste zuerst, Limit `TRANSCRIPT_LIMIT_PER_RUN` wie bisher.
- Auswahl-Regeln bleiben: nur `format: "reel"`, nur mit URL, nur ohne Status.

### Manueller Lauf

- Neue Route `POST /api/signals/transcribe` mit Body `{ id }`. Sie ruft eine reine Lauf-Funktion in der Transkript-Logik, die dieselben Abhängigkeiten nimmt wie der Refresh (Storage, Transcriber, Uhr): Status auf `pending`, ein Actor-Lauf mit genau diesem Reel, Ergebnis schreiben, Run protokollieren.
- Der manuelle Lauf ist ein eigener `Run` mit neuer Art `transcript`: ein geprüftes Reel, Transkript-Zähler, Nutzung und Kosten wie jeder andere Run. So sieht der Profile-Tab ihn und die Monatssumme stimmt.
- Antwort der Route: das aktualisierte Signal. Die Route wartet auf den Actor (Timeout wie der Develop-Lauf); die Sperre über `pending` gilt trotzdem, weil Reload und Doppelklick sonst zwei Läufe starten.
- `TranscriptCount` am Run bekommt `failed` dazu.

### Original und Arbeitsfassung

- `transcript` bleibt das unveränderte Original. Es wird nie überschrieben, außer durch einen neuen Actor-Lauf, der dann auch Arbeitsfassung und Korrekturen verwirft.
- Neue Felder am Signal: `transcriptWorkingCopy` (materialisierte Arbeitsfassung, damit Leser sie ohne Rechnen bekommen) und `transcriptCorrections` (Liste). Eine Korrektur trägt: id, `original` (der Wortlaut im Transkript), `replacement`, `reason` (kurz), `source` (`bridge` oder `dictionary`), `status` (`proposed`, `accepted`, `rejected`), Zeitpunkt.
- Die Arbeitsfassung ist eine reine Funktion aus Original plus akzeptierten Korrekturen. Sie wird bei jeder Statusänderung neu berechnet und gespeichert. Ohne akzeptierte Korrektur gibt es keine Arbeitsfassung; die UI zeigt dann nur das Original.
- Korrektur-Vorschläge kommen vom Bridge über einen neuen Endpunkt `/v1/transcript-corrections`. Eingabe: Originaltranskript, Creator-Handle, Caption, Wörterbuch. Ausgabe gegen ein festes Schema: Liste aus `original`, `replacement`, `reason`. Der Bridge ist die untrusted Seite: ein Vorschlag, dessen `original` nicht wörtlich im Transkript vorkommt, fällt weg; Ersetzungen sind längenbegrenzt; die Liste ist gedeckelt. Der Prompt beschränkt sich ausdrücklich auf Erkennungsfehler und verbietet Umformulierungen.
- Vorschläge werden bewusst angefordert (Aktion `Korrekturen vorschlagen` in der Reel-Ansicht), nicht automatisch nach jedem Transkript. Das spart Bridge-Läufe für Reels, die Chris nie liest.
- Wörterbuch: neue Tabelle `transcriptDictionary` mit `wrong`, `right`, Zeitpunkt. Beim Anfordern von Vorschlägen werden Wörterbuch-Treffer zuerst deterministisch als Korrekturen mit `source: dictionary` und Status `accepted` angelegt; sie sind wie jede andere Korrektur ablehnbar. Der Bridge bekommt das Wörterbuch als Kontext, damit er dieselben Namen nicht anders vorschlägt.
- Akzeptieren, Bearbeiten (Ersetzung ändern), Ablehnen und "Ins Wörterbuch" laufen über `PATCH /api/signals/transcript` mit einem geparsten Body nach dem Muster der Signal-Markierung. Der Storage bekommt dafür einen Port, der nur die Transkript-Felder eines Signals patcht (Convex-Mutation an der Signals-Tabelle, Datei-Store analog).

### Hook-Quelle

- `hookOf` liest die Arbeitsfassung, wenn vorhanden, sonst das Original, sonst wie bisher. Damit kommen Korrekturen in Hooks-Board, Format Signals, Format-Review und Evidenzpaket an, ohne dass ein Aufrufer sich ändert.

### Anzeige

- Reel-Ansicht: ein Panel, das an der Discover-Karte, der Briefing-Zeile und der Zeile der Creator-Detailseite geöffnet wird und das Signal mit Cover, Kennzahlen, Caption und dem Transkriptbereich zeigt. Es ist die eine Stelle für Transkript, Status, Aktionen und Korrekturen; die Karte selbst zeigt nur ein Status-Badge.
- Zustände des Transkriptbereichs: kein Transkript (Aktion `Transkribieren`), `pending` (Ladezustand, Aktionen gesperrt), `silent`/`missing`/`failed` (Erklärung in einem Satz plus `Erneut versuchen`), `ready` (Original, Umschalter zur Arbeitsfassung, Korrekturliste, Aktion `Korrekturen vorschlagen`).
- Korrekturen sind in der Arbeitsfassung markiert; die Liste darunter zeigt je Korrektur Original, Ersetzung, Grund, Quelle und die drei Aktionen.
- Profile-Tab: die Run-Zeile zeigt die Transkript-Zahlen (offen aus Ticket 20) und die Art `transcript` für manuelle Läufe.
- Demo-Modus: die Fixtures bekommen ein Reel mit Original, zwei akzeptierten Korrekturen und einem offenen Vorschlag; `Transkribieren` im Demo-Modus schreibt ein festes Beispiel ohne Actor.

### Schema und Ablage

- Convex-Schema: die neuen Signal-Felder, der erweiterte Status-Union, die neue Run-Art, `failed` im Transkript-Zähler, die Wörterbuch-Tabelle.
- Transkripte bleiben in Convex (operativer App-Zustand laut Speichergrenze). Nichts davon geht in den Vault oder nach Git.
- Transkripte, Captions und Bridge-Antworten bleiben untrusted input: alle Texte begrenzt, Vorschläge validiert, nie als Anweisung an den Bridge ausgeführt.

## Testing Decisions

Gute Tests hier prüfen von außen sichtbares Verhalten: welche Reels ein Lauf anfragt, welcher Status hinterher am Signal steht, was der Run zählt, was eine Korrektur mit der Arbeitsfassung macht. Kein Test prüft, wie der Parser intern nach Feldern sucht; er prüft, dass das echte Fixture die erwarteten Transkripte liefert.

Seams, alle vorhanden:

- Der Refresh mit Fake-Storage und Fake-Transcriber (Vorbild `tests/transcript-run.test.mjs`): Auswahl über den Score, Statusmodell, Zähler, Kosten, ausgeschaltete Automatik bei Limit 0, Bereinigung der alten `silent`-Einträge.
- Die Batch-Auswahl allein (Vorbild `tests/transcripts.test.mjs`): Schwelle über den Score, Sortierung, Ausschluss von `pending`/`failed`.
- Der Actor-Parser mit dem echten Fixture (Vorbild `tests/apify-transcripts.test.mjs`): Shortcode-Zuordnung, Text, Segmente, ein Item ohne Text.
- Der manuelle Lauf als reine Funktion mit denselben Fakes: Sperre über `pending`, Konflikt beim zweiten Start, abgelaufenes `pending`, Erfolg, Fehler mit Ursache, eigener Run.
- Korrekturen als reine Funktionen (neuer Test nach dem Muster von `tests/ideas.test.mjs`): Arbeitsfassung aus Original plus akzeptierten Korrekturen, Akzeptieren/Bearbeiten/Ablehnen, Wörterbuch-Treffer, Vorschlag ohne Fundstelle fällt weg, Body-Parser.
- Bridge-Vertrag (Vorbild `tests/bridge-hooks.test.mjs`): Schema des neuen Endpunkts und die Validierung der Antwort.

Kein UI-Test; das Repo hat keine. Die Zustände der Reel-Ansicht werden von Hand nach der RUNBOOK-Liste geprüft, das Ticket nennt sie einzeln.

## Out of Scope

- Erkannte Skriptabschnitte und Pattern im Transkript (Phase 4). Der Transkriptbereich reserviert dafür keinen Platz, er wird später ergänzt.
- Das Skriptstudio und alles, was ein Transkript weiterverarbeitet (eigene Spec).
- Änderung der Score-Gewichtung.
- Wegfall des Posts-Streams (Ticket 26) und die übrigen offenen Tickets in `.scratch/signal-room-instagram/`.
- Automatische Korrekturvorschläge nach jedem Transkript.
- Ein Wörterbuch-Editor als eigene Ansicht; Einträge entstehen nur aus Korrekturen. Löschen eines Eintrags ist eine Zeile in der Korrekturliste, mehr nicht.

## Further Notes

- Actor bleibt `apple_yang/instagram-transcripts-scraper`; Wechsel nur, wenn der Prüf-Lauf zeigt, dass er die Reels wirklich nicht beantwortet.
- `TRANSCRIPT_LIMIT_PER_RUN` und die neue Schwelle wirken auch in der Convex-Umgebung des Daily Sweep; der erste Ticket-Kommentar hält fest, welcher Wert dort gesetzt wurde.
- Korrekturen sind Wortersetzungen, keine Diff-Positionen. Kommt ein `original` mehrfach vor, wird jedes Vorkommen ersetzt; der Vorschlag sagt das mit der Anzahl.
- CONTEXT.md bekommt die Begriffe "Arbeitsfassung", "Korrektur", "Wörterbuch" und "Reel-Ansicht"; "Transkript" wird um die neuen Status ergänzt.

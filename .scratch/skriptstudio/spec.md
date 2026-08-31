# Spec: Skriptstudio

**Status:** ready-for-agent
**Stand:** 2026-08-31
**Quellen:** `docs/CONTENT-INTELLIGENCE-DECISIONS.md` (Abschnitte 2.2, 3, 5, 6, 13, Phase 3 in 14), `docs/CONTENT-INTELLIGENCE-GRILLING-PROTOKOLL.md` (Q36, Q37, Q44, Q50 bis Q53, Q60)
**Vorgänger:** Tickets 08 (Ideas: Capture und Develop) und 22 (Produktionsstufen) in `.scratch/signal-room-instagram/issues/`
**Blockiert durch:** `.scratch/transkripte/spec.md`, mindestens bis Transkripte mit Status `ready` im Korpus liegen. Die Arbeitsfassung ist willkommen, aber nicht Voraussetzung.

## Problem Statement

Chris erfasst eine Idea von einem starken Reel und klickt `Develop Idea`. Was er bekommt, ist ein Storyboard aus einem allgemeinen Paket der stärksten Outlier-Reels: Titel, Handle, Caption-Ausschnitt, Plays, Outlier. Das Quell-Reel und sein Transkript spielen keine Rolle. Hook, Beats, CTA und Caption entstehen in einem Wurf aus demselben Prompt, weshalb sich Caption-Zeilen in Hook und Beats wiederholen. Es gibt keinen Ort, an dem Chris ein Skript schreibt, keine Auswahl zwischen mehreren Hooks und Angles, kein Framework, keine Freigabe. Das Storyboard kommt vor dem Skript, obwohl es aus dem Skript folgen sollte.

## Solution

`Develop Idea` eröffnet ein Skriptprojekt statt ein Storyboard. Das Skript ist ein eigenes Objekt mit eigenem Hauptbereich `Scripts`. Es verbindet die Idea, das Quell-Reel mit Volltranskript (Arbeitsfassung, sonst Original) und Kennzahlen, weitere ausgewählte Evidence-Reels und ein empfohlenes Framework (`PAS`, `BBB` oder keins).

Ein Skript durchläuft `Hook Selection`, `Draft`, `Review`, `Approved`. In `Hook Selection` schreibt der Bridge drei bis fünf unterschiedliche gesprochene Hooks mit Angle; jeder erklärt seine Hypothese, sein Framework, seine Belege aus dem Paket und warum er zum Thema passt. Chris wählt oder bearbeitet einen. Erst dann entsteht das vollständige Skript als strukturierte Abschnitte (Hook, Beats, Übergänge, CTA) mit einer zusammenhängenden Leseansicht, die synchron bleibt. Chris bearbeitet, lässt einen Lektorat-Lauf laufen, der nur Slop markiert und die Stimme lässt, und gibt frei.

Das Storyboard entsteht nur aus einem freigegebenen Skript. Sein Hook ist der Skript-Hook, Beats, Caption und CTA werden daraus abgeleitet und dürfen nicht dieselbe Zeile sein. Bestehende Storyboards bleiben als `Legacy` sichtbar und lassen sich gezielt aus einem freigegebenen Skript neu erzeugen. `Ideas` wird zur Inbox: erfassen, entwickeln, verwerfen.

## User Stories

1. Als Chris will ich, dass `Develop Idea` ein Skriptprojekt eröffnet, damit ich aus einer Idea ein eigenes Skript schreibe statt ein Storyboard zu bekommen.
2. Als Chris will ich, dass das Skriptprojekt das Quell-Reel mit Volltranskript und Kennzahlen kennt, damit der Bridge aus dem Inhalt schreibt und nicht aus einem Caption-Ausschnitt.
3. Als Chris will ich weitere Evidence-Reels aus dem Paket zum Skript hinzufügen oder entfernen, damit ich steuere, welche Belege einfließen.
4. Als Chris will ich zuerst drei bis fünf gesprochene Hooks mit Angle sehen, damit ich die Richtung wähle, bevor ein ganzes Skript geschrieben wird.
5. Als Chris will ich bei jedem Hook-Vorschlag Hypothese, Framework, Belege und Themenpassung lesen, damit ich nicht nach Bauchgefühl wähle.
6. Als Chris will ich einen Hook bearbeiten oder einen eigenen schreiben, bevor das Skript entsteht, damit meine Formulierung den Ton setzt.
7. Als Chris will ich ein empfohlenes Framework mit Begründung sehen und es wechseln oder abwählen, damit ich nicht an ein Schema gebunden bin.
8. Als Chris will ich das Skript als Abschnitte (Hook, Beats, Übergänge, CTA) und als zusammenhängende Leseansicht sehen, damit ich strukturiert arbeite und trotzdem den Fluss höre.
9. Als Chris will ich in beiden Ansichten bearbeiten und die andere Ansicht sofort aktuell sehen, damit ich nicht zwei Fassungen pflege.
10. Als Chris will ich, dass Skript-Hook, Storyboard-Beats, Caption, Kommentar-CTA und Lead-Magnet-CTA getrennte Felder sind, damit nie wieder eine Caption-Zeile als Hook erscheint.
11. Als Chris will ich, dass das Skript Struktur, Rhythmus und Spannung aus starken Reels lernt, aber keine Formulierungen kopiert, damit es meins ist.
12. Als Chris will ich einen Lektorat-Lauf, der Slop markiert und Änderungen vorschlägt, die ich einzeln übernehme, damit meine Stimme bleibt.
13. Als Chris will ich das Skript von Hand auf `Review` und `Approved` setzen, damit die Freigabe eine Entscheidung ist und kein Automatismus.
14. Als Chris will ich ein freigegebenes Skript wieder öffnen und als neue Revision bearbeiten, damit ich nach einem Dreh-Versuch nachbessern kann.
15. Als Chris will ich, dass das Storyboard nur aus einem freigegebenen Skript entsteht, damit Storyboard und Skript nie auseinanderlaufen.
16. Als Chris will ich, dass der Storyboard-Hook wörtlich der Skript-Hook ist, damit die ersten drei Sekunden feststehen.
17. Als Chris will ich, dass Caption und CTA vom Storyboard-Lauf abgelehnt werden, wenn sie den Hook oder einen Beat wiederholen, damit die Dopplung von heute nicht wiederkommt.
18. Als Chris will ich, dass die Prognose wie bisher neben dem Storyboard steht, damit ich vor dem Dreh weiß, was das Reel bringen kann.
19. Als Chris will ich alte Storyboards als `Legacy` sehen und nicht verlieren, damit laufende Produktionen weitergehen.
20. Als Chris will ich ein Legacy-Storyboard gezielt aus einem freigegebenen Skript neu erzeugen, damit die Idea auf den neuen Weg wechselt, wenn ich will.
21. Als Chris will ich im Ideas-Tab nur Inbox-Arbeit sehen (erfassen, entwickeln, verwerfen) und zu einer Idea mit Skript den Skriptstatus und einen Link, damit der Tab nicht zwei Aufgaben trägt.
22. Als Chris will ich einen `Scripts`-Tab mit Zähler je Status und einer Liste, damit ich sehe, welches Skript wartet.
23. Als Chris will ich eine eigene Seite pro Skript, damit der Editor Platz hat und ich sie per Link öffnen kann.
24. Als Chris will ich, dass ein zweiter Hook- oder Draft-Lauf für dasselbe Skript den ersten sauber ersetzt und nie zwei Läufe zugleich schreiben, damit nichts halb überschrieben wird.
25. Als Chris will ich einen Bridge-Ausfall als verständlichen Fehler mit erneuter Aktion sehen, damit ich nicht raten muss, ob ich klicken darf.
26. Als Chris will ich, dass Demo-Modus je Status ein Beispielskript zeigt, damit ich Editor und Liste ohne Credentials sehe.
27. Als Chris will ich, dass der Skripttext nicht im Vault oder in Git landet, damit die Speichergrenze gilt.

## Implementation Decisions

### Das Skript als Objekt

- Neues Objekt `Script` in einer eigenen Tabelle `scripts`, ein Index nach `ideaId`. Genau ein aktives Skript je Idea; ein zweites `Develop` auf derselben Idea öffnet das vorhandene Skript, statt ein neues anzulegen.
- Felder: id, `ideaId`, `sourceSignalId` (wenn die Idea eins hat), `evidenceSignalIds` (die zusätzlich gewählten Reels des Pakets), `status` (`hook-selection`, `draft`, `review`, `approved`), `framework` (`pas`, `bbb`, `none`) mit `frameworkReason`, `hookOptions` (Liste), `selectedHookId`, `sections`, `revision` (Zähler, steigt bei jeder Änderung an den Abschnitten), `approvedRevision`, `approvedAt`, `runId` (nur während ein Bridge-Lauf läuft), Zeitpunkte.
- Eine Hook-Option trägt: id, `hook` (gesprochen), `angle` (ein Satz), `hypothesis` (frei formuliert, nicht die fünf Hooks-Board-Hypothesen; das Board bleibt ein eigenes Werkzeug), `framework`, `evidence` (Belege nach dem Muster des Hooks-Boards: Hook des Reels, Handle, Outlier, dazu die Signal-id), `fit` (Themenpassung, ein Satz). Chris' Bearbeitung einer Option überschreibt `hook` und `angle` und markiert die Option als `edited`.
- `sections` ist die Quelle der Wahrheit: eine geordnete Liste aus Abschnitten mit `kind` (`hook`, `beat`, `transition`, `cta`), `label` (bei Beats) und `text` (gesprochen). Genau ein `hook`, genau ein `cta`, zwei bis fünf Beats, Übergänge optional zwischen Beats. Die Leseansicht ist eine reine Rendering-Funktion über die Liste; jede Bearbeitung in der Leseansicht schreibt in den Abschnitt, aus dem der Absatz kommt. Keine Freitext-Rückübersetzung.
- Die Statusübergänge stehen an einer Stelle, nach dem Muster der Produktionsstufen: `hook-selection -> draft` (nur durch einen erfolgreichen Draft-Lauf), `draft -> review`, `review -> draft`, `review -> approved` (von Hand), `approved -> draft` (Wiederöffnen, erhöht die Revision). Alles andere ist ein verbotener Zug mit demselben Fehlertyp wie bei den Ideas, damit der Grund auch auf einem Prod-Deployment ankommt.
- Ein `approved` Skript ist unveränderlich; der Editor ist gesperrt, bis Chris wiederöffnet.

### Develop Idea

- `POST /api/ideas/develop` legt das Skript an (Status `hook-selection`) und startet den Hook-Lauf. Die Idea geht auf `developing`; der bestehende Claim über `developRunId` bleibt der Kollisionsschutz für die Idea, der Skript-Lauf hat seinen eigenen `runId`-Claim.
- Der Hook-Lauf geht an einen neuen Bridge-Endpunkt `/v1/script-hooks`. Eingabe: Idea (Titel, Ziel), Quell-Reel (Titel, Handle, Caption, Plays, Outlier, Volltranskript: Arbeitsfassung, sonst Original), die gewählten Evidence-Reels mit demselben Umfang (Transkript, wenn vorhanden), die bekannten Frameworks mit Kurzdefinition, Ziel und Zielgruppe aus der Konfiguration. Ausgabe gegen ein festes Schema: drei bis fünf Optionen, ein empfohlenes Framework mit Grund.
- Belege werden wie im Hooks-Board gegen das Paket aufgelöst: ein genannter Titel, den das Paket nicht führt, fällt weg; eine Option ohne Beleg bekommt keine erfundenen.
- Das Paket für die Evidence-Auswahl ist das bestehende Evidenzpaket (Fenster und Anzahl aus der Konfiguration), erweitert um das Transkript je Eintrag, wo eins liegt. Das Quell-Reel ist immer dabei, auch wenn es nicht mehr im Fenster liegt.
- Ohne Quell-Reel (Idea aus dem Formular) läuft der Hook-Lauf nur mit dem Paket; das Skript sagt das in seiner Kopfzeile.

### Draft-Lauf

- `POST /api/scripts/<id>/draft` mit der gewählten Option und dem Framework. Neuer Bridge-Endpunkt `/v1/script-draft`; Eingabe wie beim Hook-Lauf plus der gewählte Hook und Angle; Ausgabe gegen ein festes Schema: die Abschnittsliste.
- Anti-Kopie-Prüfung vor dem Speichern, deterministisch: kein Satz des Entwurfs ab acht Wörtern darf wörtlich (normalisiert auf Kleinschreibung und Leerraum) in einem der mitgegebenen Transkripte oder Captions stehen. Ein Treffer lehnt den Lauf mit dem zitierten Satz ab; das Skript bleibt in `hook-selection`.
- Der Hook-Abschnitt des Entwurfs ist wörtlich der gewählte Hook; eine Antwort mit anderem Hook wird abgelehnt.
- Prompt-Regeln des Bridge für Hook- und Draft-Lauf: Struktur, Rhythmus, Spannungsführung aus den Reels lernen, Formulierungen nicht übernehmen; die Stilregeln von `anti-response-patterns` als feste Anweisung; Antwort auf Deutsch.
- Ein zweiter Draft-Lauf (aus `hook-selection` nach Ablehnung oder aus `draft` mit anderer Option) ersetzt die Abschnitte vollständig und erhöht die Revision.

### Editor

- Route `/script/<id>` nach dem Muster der Creator-Detailseite; Zurück-Link zum `Scripts`-Tab.
- Zwei Spalten oder Umschalter: Abschnitte links, Leseansicht rechts. Beide bearbeitbar, beide schreiben in dieselbe Abschnittsliste; Speichern über `PATCH /api/scripts/<id>` mit geparstem Body (Abschnitte, Framework, Statuszug). Jeder Abschnittstext ist längenbegrenzt.
- Kopfzeile: Idea-Titel, Quell-Reel mit Link, Status, Revision, Framework mit Wechsler, Belege.
- Lektorat: `POST /api/scripts/<id>/lint` an einen neuen Bridge-Endpunkt `/v1/script-lint`, der die Regeln von `slop-check` (Regex-Stufe und Modell-Stufe) auf die Abschnitte anwendet. Ausgabe: Vorschläge mit Abschnitts-id, `original`, `replacement`, `reason`; validiert wie Transkript-Korrekturen (Fundstelle muss existieren, Längen begrenzt, Liste gedeckelt). Chris übernimmt einzeln. Der bekannte Pfadfehler des lokalen `slop-check` (Verweise auf `.Codex/skills/slop-check`, Dateien unter `.agents/skills/slop-check`) wird in diesem Schritt behoben, weil der Bridge die Regeln von dort liest.
- Bridge-Läufe sperren das Skript über `runId`; ein zweiter Klick antwortet mit Konflikt, ein Fehler gibt den Claim frei und zeigt die Ursache mit erneuter Aktion.

### Storyboard nach Freigabe

- `POST /api/scripts/<id>/storyboard`, nur für `approved`, sonst Konflikt mit Grund. Der bestehende Bridge-Endpunkt `/v1/storyboard` bekommt eine zweite Eingabeform: das freigegebene Skript statt nur Idea plus Paket. Der Bridge verdichtet die Beats auf genau drei, schreibt Caption, CTA und Takeaway.
- Deterministisch vor dem Speichern: `hook` wird aus dem Skript gesetzt, nicht aus der Antwort. Caption-Zeilen, CTA und Beat-Details dürfen weder untereinander noch mit dem Hook übereinstimmen (normalisierter Vergleich); ein Treffer lehnt den Lauf ab.
- Das Storyboard trägt neu `scriptId` und `scriptRevision`. Ein Storyboard ohne `scriptId` ist `Legacy` und wird so gezeigt. Weicht `scriptRevision` von `approvedRevision` ab, zeigt die Idea "Storyboard älter als das Skript".
- Die Prognose entsteht wie bisher neben dem Storyboard aus den vergleichbaren Reels des Pakets.
- Der alte Weg (Storyboard direkt aus Idea plus Paket) wird entfernt; `Develop again` an einer Idea öffnet das Skript.
- Storyboard bekommt zwei optionale Felder `commentCta` (Kommentar-Keyword-Aufruf) und `leadMagnetCta`. Sie bleiben in diesem Ausbau leer und werden in der Lead-Magnet- und ManyChat-Phase befüllt; die Felder werden jetzt angelegt, damit die Trennung der fünf Felder im Schema steht.

### Ideas als Inbox, Scripts als Bereich

- Ideas-Tab: Liste, Erfassen, `Develop`, `Drop`. Eine Idea mit Skript zeigt Skriptstatus und den Link zur Skriptseite; das Storyboard bleibt wie bisher aufklappbar, mit `Legacy`-Badge ohne `scriptId`. Zählerleiste und manuelle Stufenzüge bleiben unverändert.
- Neuer Haupt-Tab `Scripts` zwischen `Ideas` und `Cover Lab`: Zähler je Status, Liste (Idea-Titel, Hook, Status, Revision, Quell-Reel, zuletzt geändert), Klick öffnet die Skriptseite.
- Storage-Ports: Skripte auflisten, speichern, Lauf claimen und settlen (nach dem Muster der Idea-Läufe), Status ziehen. Convex-Functions an der neuen Tabelle, Datei-Store analog.
- Demo-Modus: Fixtures mit je einem Skript in `hook-selection`, `draft`, `review`, `approved`; Bridge-Läufe im Demo antworten mit festen Beispielen.

### Grenzen

- Skript, Hook-Optionen und Bridge-Antworten sind untrusted input: alles begrenzt, gegen Schema validiert, nie als Anweisung weitergereicht.
- Der Bridge bleibt der einzige KI-Endpunkt (ADR-0004). Kein zweiter Provider.
- Nichts aus diesem Bereich wird veröffentlicht oder extern geschrieben; Freigaben sind Klicks von Chris.

## Testing Decisions

Gute Tests prüfen, was von außen sichtbar ist: welcher Statuszug erlaubt ist, was ein Lauf am Skript hinterlässt, welche Antwort abgelehnt wird und warum, wie Abschnitte und Leseansicht zusammenhängen. Keine Tests gegen Prompt-Text.

Seams, alle vorhanden oder nach vorhandenem Muster:

- Skript-Logik als reine Funktionen (Vorbild `tests/ideas.test.mjs`): jeder erlaubte und mindestens ein verbotener Zug, Revision beim Wiederöffnen, Anlegen aus einer Idea, Auswahl und Bearbeitung einer Option, Leseansicht aus Abschnitten und Schreiben zurück, Body-Parser.
- Antwort-Validierung (Vorbild `tests/bridge-storyboard.test.mjs`, `tests/bridge-hooks.test.mjs`): Hook-Optionen mit Belegauflösung gegen das Paket, Abschnitte des Entwurfs, Anti-Kopie-Prüfung mit einem echten Transkript-Fixture, Hook-Abweichung, Storyboard-Dopplungsprüfung, Lektorat-Vorschläge ohne Fundstelle.
- Lauf-Funktionen mit Fake-Storage und Fake-Bridge (Vorbild `tests/slate-run.test.mjs`): Develop legt Skript an und claimt, zweiter Develop öffnet das vorhandene, Draft aus falscher Stufe ist ein Konflikt, Storyboard nur aus `approved`, Legacy-Kennzeichnung, veraltetes Storyboard bei neuer Revision, freigegebener Claim nach Fehler.
- Bridge-Vertrag (Vorbild `tests/bridge-request.test.mjs`): Schemas der drei neuen Endpunkte und die zweite Eingabeform von `/v1/storyboard`.

Kein UI-Test; Editor-Zustände (leer, Lauf läuft, Fehler, gesperrt nach Freigabe, Legacy-Badge) werden von Hand nach der RUNBOOK-Liste geprüft und im Ticket einzeln aufgeführt.

## Out of Scope

- Pattern-Bibliothek, Abschnittserkennung in fremden Transkripten, Pattern-Freigabe (Phase 4).
- Creator-Discovery (Phase 4).
- Lead Magnets, Research-Dossier, PDF (Phase 5).
- Zuordnung eigener veröffentlichter Reels, Rückführung der Performance, lernendes Sprachprofil (Phase 6). Das Skript bekommt dafür jetzt kein Feld; die Verbindung läuft später über die Idea.
- ManyChat-Übergabepaket (Phase 6). `commentCta` und `leadMagnetCta` werden nur angelegt, nicht befüllt.
- Cover Lab und Hooks-Board bleiben, wie sie sind; das Hooks-Board bekommt keine Anbindung an das Skript.
- Änderungen an den Produktionsstufen der Idea oder an `canTransition`.

## Further Notes

- Reihenfolge innerhalb der Spec: Objekt und Statusmodell zuerst, dann Develop mit Hook-Lauf, dann Draft und Editor, dann Lektorat, dann Storyboard-Gate und Legacy, zuletzt Tabs und Demo-Fixtures. Jede Stufe ist für sich demobar.
- Die Hypothesen der Hook-Optionen sind frei formuliert, weil die fünf Hooks-Board-Hypothesen für Angles zu eng sind. Wenn sich in der Praxis wiederkehrende Typen zeigen, ist das ein Pattern-Kandidat für Phase 4.
- Die Zahl "acht Wörter" der Anti-Kopie-Prüfung ist eine Konfigurationskonstante, keine Produktentscheidung.
- CONTEXT.md bekommt die Begriffe "Skript", "Skriptstatus", "Hook-Option", "Abschnitt", "Leseansicht", "Lektorat", "Legacy-Storyboard"; "Storyboard" und "Idea" werden auf den neuen Ablauf umgeschrieben; "Develop-Lauf" bezeichnet künftig den Hook-Lauf.
- `docs/SPEC.md` T5.2 beschreibt noch Idea → Storyboard; ein Verweis auf diese Spec ersetzt den Absatz, der Rest bleibt als Historie.

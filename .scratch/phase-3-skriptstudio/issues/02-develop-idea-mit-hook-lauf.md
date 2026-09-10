# 02 — Develop Idea eröffnet Skriptprojekt mit Hook-Lauf

**What to build:** `Develop Idea` legt ein Skript in `hook-selection` an und startet den Hook-Lauf; ein zweites `Develop` auf derselben Idea öffnet das vorhandene Skript. Der Bridge schreibt drei bis fünf unterschiedliche gesprochene Hooks mit Angle; jede Option erklärt Hypothese (frei formuliert), Framework, Belege aus dem Paket und Themenpassung. Dazu kommt ein empfohlenes Framework (`PAS`, `BBB` oder keins) mit Begründung, das Chris wechseln oder abwählen kann. Chris wählt eine Option oder bearbeitet Hook und Angle; die Option ist dann `edited`. Ohne Quell-Reel läuft der Lauf nur mit dem Paket und die Kopfzeile sagt das. Eine Idea mit Skript zeigt im Ideas-Tab Skriptstatus und Link zur Skriptseite. Ein zweiter Klick während eines Laufs antwortet mit Konflikt; ein Bridge-Fehler gibt den Claim frei und zeigt die Ursache mit erneuter Aktion. Demo-Modus antwortet mit festen Beispiel-Optionen.

**Blocked by:** 01 — Skript-Objekt, Statusmodell und Scripts-Bereich

**Status:** done

- [x] `POST /api/ideas/develop` legt das Skript an und startet den Hook-Lauf; Idea geht auf `developing`, `developRunId` bleibt der Kollisionsschutz der Idea, der Skript-Lauf claimt eigenen `runId`
- [x] Neuer Bridge-Endpunkt `/v1/script-hooks` mit festem Schema: Eingabe Idea, Quell-Reel mit Volltranskript (Arbeitsfassung, sonst Original) und Kennzahlen, Evidence-Reels mit Transkript wo vorhanden, Frameworks mit Kurzdefinition, Ziel und Zielgruppe aus der Konfiguration; Ausgabe drei bis fünf Optionen plus Framework-Empfehlung mit Grund
- [x] Belegauflösung wie im Hooks-Board: nicht im Paket geführte Titel fallen weg, keine erfundenen Belege
- [x] Evidenzpaket wie bestehend (Fenster und Anzahl aus der Konfiguration), erweitert um Transkripte; das Quell-Reel ist immer dabei, auch außerhalb des Fensters; Evidence-Reels lassen sich am Skript hinzufügen und entfernen
- [x] Prompt-Regeln: Struktur und Spannungsführung lernen, Formulierungen nicht übernehmen; Stilregeln von anti-response-patterns als feste Anweisung; Antwort auf Deutsch; Bridge-Antworten als untrusted input begrenzt und gegen Schema validiert
- [x] Hook-Auswahl auf der Skriptseite: Optionen mit Hypothese, Framework, Belegen und Fit; wählen, bearbeiten (überschreibt `hook` und `angle`, markiert `edited`) oder eigenen Hook schreiben
- [x] Ideas-Tab: Idea mit Skript zeigt Skriptstatus und Link zur Skriptseite
- [x] Tests: Lauf-Funktion mit Fake-Storage und Fake-Bridge (Develop legt an und claimt, zweiter Develop öffnet das vorhandene, freigegebener Claim nach Fehler); Antwort-Validierung mit Belegauflösung gegen das Paket; Bridge-Vertrag des neuen Endpunkts
- [x] CONTEXT.md: "Develop-Lauf" bezeichnet künftig den Hook-Lauf

**Verifiziert:** `npm run check` mit 382 Tests und Produktions-Build. Der Fehlerpfad lässt ein leeres Skript für einen erneuten Hook-Lauf offen; ein befülltes Skript wird ohne neuen Bridge-Aufruf geöffnet.

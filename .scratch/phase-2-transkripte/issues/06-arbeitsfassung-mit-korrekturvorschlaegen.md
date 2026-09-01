# 06 — Arbeitsfassung mit Korrekturvorschlägen

**What to build:** In der Reel-Ansicht fordert Chris mit `Korrekturen vorschlagen` Vorschläge für falsch erkannte Wörter an (Produktnamen, Creator-Namen, Repository- und Tool-Namen, offensichtliche Einzelwörter). Die Vorschläge erscheinen markiert; Chris übernimmt, bearbeitet oder verwirft jeden einzeln. Aus Original plus akzeptierten Korrekturen entsteht die Arbeitsfassung, zwischen der und dem Original die Ansicht umschaltet. Jede Korrektur zeigt Original, Ersetzung, Grund und Quelle. Ein neuer Actor-Lauf verwirft Arbeitsfassung und Korrekturen. Die Hook-Quelle liest die Arbeitsfassung, wenn vorhanden, damit Hooks-Board, Format Signals, Format-Review und Evidenzpaket die Korrekturen sehen.

**Blocked by:** 04 — Reel-Ansicht

**Status:** done

- [x] Signal trägt `transcriptWorkingCopy` und `transcriptCorrections` (id, original, replacement, reason, source, status, Zeitpunkt); Schema und Datei-Store passen
- [x] Arbeitsfassung ist eine reine Funktion aus Original plus akzeptierten Korrekturen und wird bei jeder Statusänderung neu gespeichert; ohne akzeptierte Korrektur gibt es keine
- [x] Bridge-Endpunkt `/v1/transcript-corrections` gegen festes Schema; Prompt beschränkt auf Erkennungsfehler, verbietet Umformulierung; Vorschlag ohne wörtliche Fundstelle fällt weg, Längen begrenzt, Liste gedeckelt
- [x] `PATCH /api/signals/transcript` mit geparstem Body für Akzeptieren, Bearbeiten, Ablehnen (Vorbild Signal-Markierung)
- [x] Ein `original`, das mehrfach vorkommt, wird überall ersetzt; der Vorschlag nennt die Anzahl
- [x] Neuer Actor-Lauf löscht Arbeitsfassung und Korrekturen
- [x] `hookOf` bevorzugt die Arbeitsfassung
- [x] UI: Umschalter Original/Arbeitsfassung, Markierungen im Text, Korrekturliste mit drei Aktionen, Lade- und Fehlerzustand des Bridge-Laufs
- [x] Demo-Fixture: ein Reel mit zwei akzeptierten Korrekturen und einem offenen Vorschlag
- [x] Tests: Korrektur-Funktionen (Vorbild `tests/ideas.test.mjs`), Bridge-Vertrag (Vorbild `tests/bridge-hooks.test.mjs`), Hook-Quelle liest die Arbeitsfassung
- [x] CONTEXT.md: Begriffe "Arbeitsfassung" und "Korrektur"; "Hook-Quelle" ergänzt

## Comments

2026-09-01: Implementiert in Verträgen, Datei- und Convex-Store, Bridge, Transcript-API, Reel-Ansicht, Hook-Quelle und Demo-Fixture. Korrekturen werden wörtlich validiert, bei mehrfachen Fundstellen überall ersetzt und bei einem neuen Actor-Lauf gelöscht. Tests für Pure Functions, Bridge-Vertrag, Hook-Quelle und Transkriptanzeige ergänzt. `npm run check` folgt als Abschlussprüfung.

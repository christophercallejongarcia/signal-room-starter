# 04 — Editor: Abschnitte und Leseansicht synchron

**What to build:** Die Skriptseite wird zum Editor. Zwei Spalten oder Umschalter: Abschnitte auf der einen Seite, zusammenhängende Leseansicht auf der anderen. Beide sind bearbeitbar und schreiben in dieselbe Abschnittsliste; die Leseansicht ist eine reine Rendering-Funktion, jede Bearbeitung dort schreibt in den Abschnitt, aus dem der Absatz kommt — keine Freitext-Rückübersetzung. Chris zieht das Skript von Hand auf `Review` und `Approved`, kann aus `Review` zurück nach `Draft` und ein freigegebenes Skript wiederöffnen (neue Revision). Bei `approved` ist der Editor gesperrt, bis wiedergeöffnet wird. Baubar parallel zu 02/03 gegen die Demo-Fixtures aus Ticket 01.

**Blocked by:** 01 — Skript-Objekt, Statusmodell und Scripts-Bereich

**Status:** done

- [x] `PATCH /api/scripts/<id>` mit geparstem Body (Abschnitte, Framework, Statuszug); jeder Abschnittstext längenbegrenzt; Struktur-Regeln (genau ein Hook, genau ein CTA, zwei bis fünf Beats) bleiben beim Speichern gewahrt
- [x] Abschnitts-Ansicht und Leseansicht bearbeiten dieselbe Liste; Änderungen erscheinen sofort in der jeweils anderen Ansicht
- [x] Jede Änderung an den Abschnitten erhöht die Revision
- [x] Manuelle Statuszüge in der UI: `draft -> review`, `review -> draft`, `review -> approved`, Wiederöffnen `approved -> draft` mit Revisionssprung; verbotene Züge zeigen den Grund
- [x] Editor-Sperre bei `approved`; Kopfzeile zeigt Status, Revision und Framework mit Wechsler
- [x] Tests: Leseansicht aus Abschnitten und Schreiben zurück, Body-Parser mit Längengrenzen, Statuszüge über die PATCH-Logik
- [x] Manuelle RUNBOOK-Prüfung der Editor-Zustände: leer, Lauf läuft, Fehler, gesperrt nach Freigabe
- [x] CONTEXT.md: Begriff "Leseansicht"

**Verifiziert:** `npm run check` mit 381 Tests und Produktions-Build. Preview geprüft für leeren Editor, synchrones Schreiben zwischen beiden Ansichten, `Draft -> Review -> Approved -> Draft`, laufenden Run und Approved-Sperre. PATCH-Fehlerpfade liefern `400` und `409` wie erwartet.

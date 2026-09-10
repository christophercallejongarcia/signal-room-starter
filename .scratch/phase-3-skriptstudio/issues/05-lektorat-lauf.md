# 05 — Lektorat-Lauf

**What to build:** Im Editor startet Chris einen Lektorat-Lauf, der nur Slop markiert und die Stimme lässt. Der Bridge wendet die Regeln von slop-check (Regex-Stufe und Modell-Stufe) auf die Abschnitte an und liefert Vorschläge mit Abschnitts-id, `original`, `replacement` und `reason`. Chris übernimmt jeden Vorschlag einzeln; nichts wird automatisch geändert. Vorschläge ohne Fundstelle im Abschnitt werden verworfen, Längen sind begrenzt, die Liste ist gedeckelt — validiert wie die Transkript-Korrekturen. Der bekannte Pfadfehler des lokalen slop-check wird dabei behoben, weil der Bridge die Regeln von dort liest. Während des Laufs ist das Skript über `runId` gesperrt; Demo-Modus antwortet mit festen Beispiel-Vorschlägen.

**Blocked by:** 04 — Editor: Abschnitte und Leseansicht synchron

**Status:** done

- [x] `POST /api/scripts/<id>/lint`; neuer Bridge-Endpunkt `/v1/script-lint` mit festem Schema
- [x] Regex-Stufe und Modell-Stufe der slop-check-Regeln im Bridge; Pfadfehler des lokalen Skills dabei behoben
- [x] Validierung wie Transkript-Korrekturen: Fundstelle muss im genannten Abschnitt existieren, Längen begrenzt, Liste gedeckelt; Bridge-Antwort als untrusted input
- [x] Einzelne Übernahme im Editor; Übernahme schreibt in den Abschnitt und erhöht die Revision
- [x] `runId`-Claim, Konflikt bei zweitem Klick, Freigabe des Claims nach Fehler mit Ursache und erneuter Aktion
- [x] Tests: Antwort-Validierung (Vorschlag ohne Fundstelle fällt weg, Deckel, Längen); Lauf-Funktion mit Fakes; Bridge-Vertrag des neuen Endpunkts
- [x] CONTEXT.md: Begriff "Lektorat"

**Verifiziert:** `npm run check` mit 393 Tests und Produktions-Build. Der lokale `.agents/skills/slop-check`-Pfad, die Regex- und Modell-Stufe, die Untrusted-Response-Filter und der guarded `runId`-Claim sind durch fokussierte Tests abgedeckt.

# 23 — Produktions-Slate aus den Tagessignalen

**What to build:** Chris fängt den Tag nicht mit einem leeren Feld an, sondern mit zehn Vorschlägen. Nach dem Refresh erzeugt ein Lauf zehn Short-Form-Startpunkte aus den Signalen der letzten 24 Stunden, jeder mit einem Themen-Etikett und dem Signal, aus dem er stammt. Gefällt einer nicht, lässt er sich einzeln neu erzeugen, ohne die anderen zu verwerfen. Ein Freitextfeld nimmt die Richtung für den nächsten Durchlauf auf ("mehr Werkzeug, weniger Meinung") und fließt in den nächsten Lauf ein. Ein Klick macht aus einem Startpunkt eine Idea mit Quell-Signal.

**Blocked by:** 11 — Tägliches Briefing

**Status:** ready-for-human

- [x] Zehn Short-Form-Startpunkte aus den Signalen der letzten 24 Stunden, je mit Themen-Etikett und Quell-Signal
- [x] Einzelner Startpunkt neu erzeugbar, die übrigen bleiben unverändert
- [x] Richtung für den nächsten Durchlauf wird gespeichert und wirkt im nächsten Lauf
- [x] Ein Startpunkt wird per Klick zur Idea mit `sourceSignalId`
- [x] Der Slate ist persistiert; ein Reload zeigt denselben Stand, ein zweiter Refresh am selben Tag erzeugt keinen zweiten Slate

## Comments

**Umgesetzt (2026-08-30, Branch `ticket-23`)**

- `lib/slate.ts` hält die reine Rechnung: `slateSources` (dieselbe Auswahl wie das Briefing über `selectBriefingSignals`, höchstens `SLATE_SOURCE_LIMIT` 12, nur Reels mit Titel und Handle), `parseSlateAnswer`/`parseSlateStart` (exakt `count` Startpunkte, Quelle als 1-basierte Position ins Paket, sonst wird die Antwort ganz abgelehnt), `newSlate`, `replaceStart`, `withDirection`, `ideaFromStart`, `parseSlateDirection`, `parseSlatePosition`. 11 Tests in `tests/slate.test.mjs`.
- `lib/slate-run.ts` ist der Lauf: `runSlate` (ein Dokument je Tag, ein zweiter Lauf am selben Tag gibt das bestehende zurück, `force` baut neu; Richtung vom neuesten gespeicherten Slate, auch vom Vortag), `regenerateStart` (Paket aus dem Fenster des Slates, die übrigen Pitches gehen als `taken` mit, nur die eine Position ändert sich). 9 Tests in `tests/slate-run.test.mjs`.
- Bridge-Route `/v1/slate` (`validateSlateRequest`, `slateOutputSchema(count, sourceCount)`, `buildSlatePrompt` in `bridge/request.mjs`), 5 Tests in `tests/bridge-slate.test.mjs`. `briefingPacket` aus `lib/briefing.ts` ist jetzt die gemeinsame Paket-Projektion für Briefing und Slate.
- Tabelle `slates` (Convex, `convex/slates.ts`) mit `by_external_id` und `by_day`; `listSlates`/`saveSlate` in beiden Storage-Adaptern.
- Routen: `GET/POST/PATCH /api/slates`, `POST /api/slates/regenerate`, `POST /api/slates/ideas`. `POST /api/refresh` läuft den Slate nach dem Briefing, ein Fehler kostet nur das Slate.
- UI: Abschnitt "Production slate" unter der Briefing-Liste (Day-Picker, zehn Zeilen mit Themen-Etikett, Pitch, Quell-Reel, Regenerate, Create idea / "In ideas", Richtungs-Formular). Demo-Modus zeigt nur den Hinweis.
- Doku: CONTEXT.md (Slate, Startpunkt, Richtung), ARCHITECTURE.md, SECURITY.md, SPEC.md T6.5, README.

**Annahmen ohne Rückfrage**

- **Zweiter Refresh lässt das Slate stehen statt es zu überschreiben.** Das Briefing überschreibt sein Tagesdokument; das Slate nicht, weil Chris darin schon Startpunkte neu erzeugt oder zu Ideas gemacht haben kann. "Rebuild today's slate" (`force`) ist der bewusste Weg.
- **Quelle als Position, nicht als Titel.** Zwei Reels können denselben Titel tragen (im Korpus real: zwei „Claude sabotiert dich ohne Warnung“ von @denizdeke). Der Bridge nennt die Nummer im Paket; das Schema bindet sie an 1..n.
- **Richtung lebt am Slate und wandert auf den nächsten Tag.** Ein eigener Settings-Store wäre eine zweite Tabelle für einen String; so bleibt sie beim Dokument, an dem sie eingegeben wurde, und `directionApplied` sagt, was der letzte Lauf bekam.
- **Richtung wirkt sofort auf das Neu-Erzeugen einzelner Startpunkte**, nicht erst auf das Slate von morgen. "Nächster Durchlauf" meint jeden Lauf nach dem Speichern.
- **Kein Slate aus dem Convex-Cron.** Der Cron hat keinen Bridge (wie beim Angle). Nach dem Cron-Sweep entsteht das Slate über den Knopf oder den nächsten lokalen Refresh.
- **Create idea bleibt im Briefing-Tab** statt wie beim Briefing in den Ideas-Tab zu springen, damit mehrere Startpunkte nacheinander übernommen werden können. Die Zeile zeigt "In ideas".
- **Idea-Ziel** ist `<topic>. Aus <handle>: „<Quelltitel>“`, der Pitch ist der Arbeitstitel.
- **Leeres Fenster schreibt ein leeres Slate** und fragt den Bridge nicht.

**Verifiziert**

- `npm run check` grün (304 Tests), Convex-Typecheck grün, `npx convex dev --once` hat die Tabelle angelegt.
- Live gegen den echten Korpus (10 Creators, 1238 Signale, 7 Reels im 24h-Fenster): 10 Startpunkte auf Deutsch in 55 s, über fünf Reels verteilt. Zweiter Lauf: dasselbe Dokument, eine Zeile. Richtung „mehr Werkzeug, weniger Meinung“ gespeichert, Position 3 neu erzeugt (46 s), die anderen neun byte-gleich, `directionApplied` gesetzt. Position 3 als Idea übernommen, `ideaId` am Startpunkt.
- Im Browser geprüft: Abschnitt rendert mit Etiketten, "In ideas" an Position 3, Richtung im Formular.

**Offen gelassen**

- Die Test-Idea `idea-slate-live-test` steht im Dev-Deployment in `ideas` (kein Lösch-Pfad, wie schon bei Ticket 11).
- Das Slate von heute im Dev-Deployment enthält den Live-Test-Stand (Position 3 regeneriert und als Idea markiert).

**Code-Review (zwei parallele Agenten, Standards und Spec) und was daraus geändert wurde**

Standards-Achse:

- Routen entschieden den Status per Regex auf der Fehlermeldung bzw. antworteten 409 auf alles. Jetzt gibt es `SlateRefusal` in `lib/slate.ts` (unbekannte Position, Startpunkt schon Idea, Fenster ohne Reel): 409 genau dafür, 500 für den Store, 502 für den Bridge, wie bei `ForbiddenMoveError`.
- `(await listSlates()).find(...)` stand dreimal; jetzt `findSlate` in `lib/slate-run.ts`. `regenerateStart` hatte `startAt` nachgebaut; jetzt `requireStart` aus `lib/slate.ts`.
- Die Grenzen 300/120 in `slateSources` spiegeln `MAX_TITLE`/`MAX_CREATOR` des Bridge und tragen die ganze Positions-Kopplung; jetzt benannte Konstanten mit Kommentar.
- Ungenutztes entfernt: `creatorName` in `SlateSource`, `force` in den Deps von `regenerateStart`, der Re-Export von `SLATE_SIZE` samt tautologischem Test. `parseSlateCompose` und `parseSlatePosition` haben jetzt Tests; Phosphor-Import wieder alphabetisch.
- Nicht geändert: die vier Fetch-Handler in der Shell teilen sich schon `slateAnswer`/`placeSlate`, eine weitere Schicht lohnt für vier Aufrufer nicht.

Spec-Achse:

- **Richtung an einem älteren Tag hätte keinen Lauf erreicht**, weil `runSlate` sie vom neuesten Slate liest. Das Formular steht jetzt nur am neuesten Slate; ältere Tage zeigen, welche Richtung sie bekommen haben, und sagen, wo die nächste gesetzt wird.
- **`directionApplied` blieb nach dem Löschen der Richtung stehen.** `replaceStart` setzt es jetzt neu oder entfernt es. Test dazu.
- Als Scope-Creep markiert: `force`/"Rebuild today's slate", der Day-Picker mit 14 Tagen, `taken`, `regeneratedAt`, `directionApplied`, leeres Slate ohne Bridge-Aufruf, zweiter Klick wird abgelehnt. Bewusst behalten: ohne `force` gäbe es im Datei-Store keinen Weg zu einem neuen Slate am selben Tag (ADR-0005), der Picker ist das Pendant zum Briefing, `taken` ist das, was "die übrigen bleiben" für den neuen Startpunkt bedeutet, und die beiden Stempel sagen der UI, was passiert ist.
- Bestätigt als offen: kein Slate aus dem Convex-Cron (kein Bridge in der Cloud); nach dem Cron-Sweep entsteht es über den Knopf oder den nächsten lokalen Refresh. Keine Richtung vor dem ersten Slate, weil sie am Dokument lebt. Tagesgrenze in UTC wie beim Briefing.

Danach: `npm run check` grün, Convex-Typecheck grün.

# 12 — Eigener Account im Profile

**What to build:** Chris' eigener Instagram-Handle wird als Creator mit Kennzeichen "owned" geführt. Er wird wie alle anderen gesammelt, taucht aber nicht im Competitor-Feed auf, sondern im Profile-Tab: eigene Reels sortiert nach Outlier, Kennzahlen (Follower, Ø Plays, bester Outlier), damit Chris sieht, welches eigene Format zuletzt gezündet hat.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Owned-Kennzeichen setzbar beim Hinzufügen und in Tracked Channels
- [x] Owned Creators sind aus Discover, Briefing und Format Signals ausgeschlossen
- [x] Profile zeigt eigene Reels als Tabelle nach Outlier, plus Kennzahlen
- [x] Test: Ausschluss-Prädikat für owned Creators

## Comments

**Umgesetzt (unbeaufsichtigter Batch, 2026-08-26)**

- Das Ausschluss-Prädikat steht in `lib/discover-filter.ts` neben `isOutlier`: `isOwned(creator)` liest die Markierung, `withoutOwned(signals, creators)` siebt eine Signalliste damit. Discover (`filterScope`), Briefing, Trend Radar und das Evidenzpaket filtern über `withoutOwned`; Format Signals (`buildFormatSignals`) und Format-Review (`findRisingCreators`) prüfen `isOwned` je Reel in ihrer bestehenden Schleife, weil sie ohnehin je Signal über den Creator gehen.
- Setzbar an zwei Stellen: Checkbox "This is my own account" im Add-Dialog (`POST /api/creators`) und der Personen-Knopf je Zeile in Tracked Channels (`PATCH /api/creators`), dazu ein Chip "Own account" in der Statusspalte.
- `parseForeignMark` ist zu `parseCreatorMark` in `lib/creator-mark.ts` geworden: derselbe PATCH nimmt jetzt `owned`, `foreign` oder beides, jede Markierung optional, mindestens eine verlangt. Nur die Markierungen im Body bewegen sich, die andere behält ihren Wert. Im Frontend liegt darunter ein `markCreator`, `toggleForeign` und `toggleOwned` hängen daran.
- Profile: Kennzahlen im Hero (Follower, Videos, Ø Plays, bester Outlier), darunter eine Tabelle "Owned lanes" mit Follower, Reels, Ø Plays und bestem Outlier je eigenem Account, darunter alle eigenen Reels nach Outlier absteigend.
- `tests/owned-creators.test.mjs` (7 Tests) deckt das Prädikat und den Ausschluss in Discover und Format Signals ab, `tests/creator-mark.test.mjs` (2 Tests) den Parser. 137 Tests grün, `npm run check` grün.

**Entscheidungen, die im Batch ohne Rückfrage getroffen wurden**

- **Ausschluss auch in Trend Radar, Format-Review und Evidenzpaket**, obwohl der Ticket-Text nur Discover, Briefing und Format Signals nennt. Alle drei lesen dieselbe Frage ("was läuft in der Nische"), und ein eigener Reel mit 49x Outlier hätte das Evidenzpaket des Strategy-Providers dominiert, also hätte die Idea-Entwicklung Chris' eigene Reels zurückgespielt. Profile ist die einzige Stelle, an der eigene Zahlen stehen.
- **Der Add-Dialog setzt die Markierung nur, er löscht sie nie.** Ein schon beobachteter Handle nochmal mit gesetzter Checkbox hinzugefügt bekommt `owned: true` nachgetragen; ohne Häkchen bleibt eine bestehende Markierung stehen. Entfernen geht über den Knopf in Tracked Channels, sonst würde ein beiläufiges Wieder-Hinzufügen die Lane still aus Profile werfen.
- **Owned schlägt foreign.** Ein Creator mit beiden Markierungen erscheint weder in der eigenen noch in der Foreign-Gruppe der Format Signals. Getestet.
- **Kein Backfill-Verhalten geändert.** Owned Creators werden weiter wie jeder andere gesammelt und gescort; nur die Anzeige trennt.

**Verifiziert**

- `npm run check` (Typecheck, 137 Tests, Build) grün.
- Gegen das echte Convex-Deployment: `PATCH` mit `owned`, ohne Markierung (400 "owned or foreign required") und mit unbekannter id (404). Im Browser den eigenen Account markiert, Discover fiel von 1089/9/886 auf 1008/8/816 (Videos, Kanäle, visual reads), der Creator verschwand aus dem Kanal-Filter, Profile zeigte die Lane mit 77K Followern, 85 Reels, 72.6K Ø Plays und 49.52x bestem Outlier, Reels nach Outlier sortiert. Anschließend über den Knopf in Tracked Channels wieder entmarkiert, der Datenstand steht wie vorher.

**Code-Review (zwei parallele Agenten, Standards und Spec) und was daraus geändert wurde**

- **Die Checkbox war für einen schon beobachteten Handle wirkungslos.** `POST /api/creators` kehrte für existierende Creators zurück, bevor die Markierung gesetzt wurde. Jetzt trägt der Weg `owned: true` nach (siehe Entscheidung oben).
- **"visual reads" in der Discover-Leiste zählte weiter eigene Reels**, während "videos" und "channels" daneben schon gefiltert waren. Alle drei lesen jetzt denselben Korpus; DiscoverView leitet ihn einmal je Render ab statt dreimal.
- **`0.00x` als "strongest outlier" ohne einen einzigen eigenen Reel** las sich wie eine Messung. Ohne Reels steht jetzt "—", im Hero wie je Lane; die doppelte Rechnung dahinter ist zu `laneStats` zusammengezogen.
- **Der Rollback in `markCreator` schrieb den ganzen Creator zurück** und hätte damit eine parallele Änderung an einem anderen Feld überschrieben. Er stellt jetzt nur die Felder wieder her, die der fehlgeschlagene Request gesendet hat.
- **CONTEXT.md und SPEC.md behaupteten, `withoutOwned` halte auch Format Signals und Format-Review sauber.** Dort prüft `isOwned` je Reel. Beide Texte nennen jetzt das richtige Prädikat je Stelle.
- Die Parser-Tests sind aus `tests/owned-creators.test.mjs` in `tests/creator-mark.test.mjs` gezogen, `.niche-chip.owned` steht in `app/globals.css` hinter der Basisregel statt davor.

Nicht geändert (bewusst): der breitere Ausschluss und der Umbau von `parseForeignMark` zu `parseCreatorMark`, beide von der Spec-Achse als Scope-Creep markiert. Der Ausschluss steht oben als Entscheidung; der Parser musste `owned` im selben PATCH annehmen, und zwei fast gleiche Parser für denselben Endpunkt wären die schlechtere Antwort gewesen. Für den POST-Pfad gibt es keinen Test, weil dieses Repo keine Route-Tests hat; die Prüfung lief im Browser gegen das echte Backend.

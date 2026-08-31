# 15 — Monatlicher Format-Review

**What to build:** Einmal im Monat berechnet ein Cron die Format-Muster über die letzten 90 Tage neu und vergleicht mit dem Vormonat: welche Muster gewinnen, welche verlieren, welche kleinen Creators (unter 50k Follower) mit hohem Outlier neue Muster zeigen. Das Ergebnis liegt als Review-Dokument vor und wird in Format Signals als "Was sich geändert hat" angezeigt.

**Blocked by:** 10 — Format Signals aus Captions

**Status:** done

- [x] Convex-Cron am 1. jedes Monats
- [x] Tabelle `formatReviews` mit Diff zum Vormonat
- [x] Format-Signals-Tab zeigt den letzten Review
- [x] Test: Diff-Berechnung gegen zwei Fixture-Zustände

## Comments

**Umgesetzt (unbeaufsichtigter Batch, 2026-08-26)**

- `lib/format-review.ts` hält die reine Rechnung: `diffPatterns` (Union beider Musterlisten, verschwundene Muster bleiben mit 0 als `gone` drin), `findRisingCreators`, `previousReview` und `buildFormatReview`. 16 Tests in `tests/format-review.test.mjs`, darunter die geforderte Diff-Berechnung über zwei Fixture-Zustände (Monat 1 → Monat 2: `die-besten` steigt, `question` fällt, `nie-wieder` verschwindet, `kommentiere` kommt neu dazu).
- `convex/crons.ts` läuft `internal.formatReviews.generate` am 1. jedes Monats um 03:00 UTC, also nach dem Daily-Refresh. Tabelle `formatReviews` mit `by_external_id` und `by_periodEnd`.
- `GET /api/format-reviews` liefert den letzten Review, der Format-Signals-Tab rendert ihn als "What changed" plus "Small accounts to watch".

**Entscheidungen, die im Batch ohne Rückfrage getroffen wurden**

- **Bewegung über den Anteil, nicht über die Anzahl.** Wächst der Korpus, wächst jede Anzahl mit; der Anteil am Outlier-Korpus ist die ehrliche Größe. Unter einem Punkt Bewegung (`SHARE_EPSILON`) liest sich das Muster als `flat`.
- **Ein Dokument je Lauftag** (`format-review-<YYYY-MM-DD>`), damit ein zweiter Lauf überschreibt statt zu duplizieren. `previousReview` überspringt genau dieses Dokument als Vergleichsbasis, sonst würde ein Zweitlauf am selben Tag gegen sich selbst diffen und einen Monat ohne Bewegung melden.
- **`POST /api/format-reviews` als manueller Lauf.** Der Convex-Cron ist der Zeitplan, aber der Datei-Store hat keinen (ADR-0005); ohne die Route sähe eine Installation ohne Convex nie einen Review. Der Knopf "Run review now" im Tab hängt daran.
- **Kleine Creators aus beiden Nischen**, jeweils mit ihrer `foreign`-Markierung. Ein kleiner nische-fremder Account mit neuem Muster ist genau der Fall, für den der Foreign-Block existiert. Der Muster-Diff selbst bleibt auf der eigenen Nische.
- **`lib/adapters/scoring/outlier.ts` auf relative Imports umgestellt** und `allowImportingTsExtensions` in `convex/tsconfig.json` ergänzt, damit der Convex-Bundler die geteilte Rechnung laden kann. Der `@/`-Alias existiert im Convex-Runtime nicht.

**Verifiziert**

- `npm run typecheck`, `npx tsc --noEmit -p convex/tsconfig.json`, 127 Tests, `npm run build` grün.
- `npx convex dev --once` deployt Schema, Funktionen und Cron; `npx convex run formatReviews:generate '{}'` läuft im Convex-Runtime durch und schreibt `format-review-2026-08-26`.
- Gegen den echten Korpus (9 Creators, 1089 Signale): 42 Outlier-Reels, 6 Muster, "Small accounts to watch" listet @denizdeke (27.9k, Die besten X, 8.0x), @christopher_thanisch (36.1k, Kommentiere X, 7.6x), @sebastiankauffmann (39k, Tag N der Journey, 6.5x). Im Browser geprüft.

**Code-Review (zwei parallele Agenten, Standards und Spec) und was daraus geändert wurde**

Spec-Achse:

- **Bug: ein `gone`-Muster kam im Folgemonat als `new` zurück.** `moveOf` prüfte `previousCount === 0` vor `count === 0`; ein mit `count: 0` gespeichertes `gone`-Muster las sich in der nächsten Runde als neu und wäre nie aus der Liste verschwunden. `gone` wird jetzt zuerst entschieden, und `diffPatterns` wirft Muster raus, die auf beiden Seiten bei 0 stehen: gemeldet genau einmal, im Review des Verschwindens. Regressionstest über drei Generationen.
- **Nische-fremde Creators konnten nie `new` zeigen.** Der `patternMove`-Fallback war `flat`. Ein Muster, das in keinem Outlier der eigenen Nische vorkommt, liest sich jetzt als `new` — das ist der einzige Weg, auf dem ein foreign-Eintrag überhaupt in die Liste kommt. Dazu kam das Label vorher aus der Diff-Liste und fiel bei foreign auf die rohe id zurück; jetzt über `patternLabel` aus `FORMAT_PATTERNS`.
- Die Deckelung auf 5 steht jetzt im UI-Text statt still im Code.

Standards-Achse:

- **`.collect()` über den ganzen Korpus in der Cron-Mutation** verstieß gegen `convex/_generated/ai/guidelines.md`. Ersetzt durch einen Range-Query über `by_published` ab Fensteranfang, `order("desc")` plus `take(MAX_SIGNALS)`, damit eine Kürzung die ältesten Zeilen trifft und nicht die, um die es geht.
- **Die Bewegung stand nur im `title`-Attribut** (unsichtbar auf Touch, nicht per Tastatur erreichbar), gegen die AGENTS.md-Regel "Every score shown to a person needs a plain-language reason". Jetzt eine sichtbare Legende über der Liste.
- **Doppelte Rechnung** in Route und Cron zu `reviewCorpus` zusammengezogen, doppelter Upsert-Block in `convex/formatReviews.ts` zu einem `write`-Helper.
- **`FormatReview` und Co. nach `lib/contracts.ts` verschoben**, zu den anderen gespeicherten Entitäten; der Rück-Import von contracts nach format-review ist weg.
- **`previousReviewId.slice(-10)`** ersetzt durch ein echtes Feld `previousPeriodEnd`.
- Toter Typ `RisingSettings` gelöscht, Kommentar zu `MAX_FORMAT_REVIEWS` korrigiert.

Nicht geändert (bewusst): `POST /api/format-reviews`, foreign-Creators in der Rising-Liste, `FORMAT_REVIEW_RISING_LIMIT`, die Storage-Adapter-Erweiterung. Die Spec-Achse hat sie als Scope-Creep markiert; sie stehen oben schon als bewusste Entscheidung, und ohne sie hätte eine Installation ohne Convex nie einen Review.

Nach den Änderungen: 129 Tests grün, `npm run check` grün, Convex neu deployt, `formatReviews:generate` gegen den echten Korpus durchgelaufen. Der Diff-Pfad wurde zusätzlich gegen das echte Backend geprüft, indem ein Vormonats-Review eingespielt wurde (`up`/`new`/`gone`/`down` korrekt, `previousPeriodEnd` gesetzt); das Testdokument und das daraus abgeleitete wurden anschließend wieder aus dem Dev-Deployment gelöscht.
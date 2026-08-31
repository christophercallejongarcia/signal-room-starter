# 10 — Format Signals aus Captions

**What to build:** Format Signals zeigt wiederkehrende Hook-Muster der Outlier-Reels statt Demo-Daten. Regelbasiert aus der ersten Caption-Zeile: "Kommentiere X", "Die besten X", "Tag N der Journey", "X vs. Y", "Nie wieder X", "Der geheime X", Zahl-am-Anfang, Frage. Pro Muster: Anzahl Reels, durchschnittlicher Outlier, Anteil an allen Outliern, drei Beispiel-Reels mit Cover, kleine Trend-Linie über Wochen. Sortiert nach durchschnittlichem Outlier.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Muster-Erkennung als reine Funktion über Captions, mindestens acht Muster, erweiterbar über eine Liste
- [x] Format-Signals-Tab zeigt echte Muster mit Kennzahlen und Beispielen
- [x] Reels ohne erkanntes Muster landen in "Unklassifiziert" mit Anteil
- [x] Test: jedes Muster mit positivem und negativem Caption-Beispiel
- [x] Creators lassen sich als "Nische fremd" kennzeichnen; ihre Format Signals erscheinen in einer eigenen Gruppe, damit Muster aus anderen Nischen importierbar sind, ohne die eigenen Kennzahlen zu verwässern

## Notes

- Muster-Erkennung: `lib/format-signals.ts`, `FORMAT_PATTERNS` mit zehn Mustern (kommentiere, die-besten, tag-n, nie-wieder, der-geheime, hoer-auf, so-machst-du, x-vs-y, number-first, question). Reihenfolge zaehlt, erster Treffer gewinnt, die zwei generischen Muster stehen hinten.
- Annahme: fehlt einem Signal die Caption, tritt der Titel an ihre Stelle. Der Instagram-Connector leitet den Titel ohnehin aus der ersten Caption-Zeile ab, und Demo-Fixtures haben gar keine Caption.
- Annahme: gelesen wird das 90-Tage-Fenster (`FORMAT_WINDOW_DAYS`), passend zum Backfill-Horizont; Schwelle ist der in Discover gewaehlte Wert.
- Nische fremd: `Creator.foreign`, umgeschaltet ueber den Globus-Knopf in Tracked Channels, persistiert ueber `PATCH /api/creators`. Eigener Block "Foreign niche" im Tab, eigener Anteils-Nenner.
- Tests: `tests/format-signals.test.mjs`, 20 Faelle.

## Review

- Spec-Review fand eine echte Fehlklassifikation: `so-machst-du` (`^(so|wie)\s`) stand vor `question` und schluckte "Wie kriegst du das hin?". `question` steht jetzt hinter den sechs verankerten Idiomen und vor den drei losen Mustern. Getestet in beide Richtungen.
- Standards-Review fand die fehlende Validierungs-Abdeckung fuer `PATCH /api/creators` (AGENTS.md verlangt Tests fuer request validation). Die Pruefung liegt jetzt als `parseForeignMark` in `lib/format-signals.ts`, die Route faengt den Wurf als 400 ab, analog zu `newIdea` in der Ideas-Route.
- `toGroup` heisst jetzt `groupByPattern` und nimmt `GroupSettings` statt fuenf Positionsargumente.
- Bewusst nicht geaendert: der Rest-Block heisst "Unclassified", nicht "Unklassifiziert". Der Tab ist durchgehend englisch, nur die Muster-Labels sind deutsch, weil sie die Captions woertlich zitieren.

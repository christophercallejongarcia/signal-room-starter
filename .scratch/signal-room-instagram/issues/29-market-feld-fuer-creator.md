# 29 — Market-Feld für Creator: deutsche und englische Kohorte trennen

**What to build:** Creator bekommen ein Feld `market: "de" | "en"` (optional, fehlend = `"de"`). Hintergrund: ~20 englischsprachige Creator derselben Nische kommen als Pattern-Quelle in die Watchlist. Der englische Markt spielt ein anderes Algorithmus-Umfeld (andere Reichweiten-Baselines), seine Hook-Patterns sollen die deutschen Kennzahlen nicht verwässern. Das vorhandene `foreign`-Flag ist dafür falsch: Es bedeutet nischen-fremd, nicht fremdsprachig, und trennt außerdem nur die Format-Signals-Anzeige, nicht Outlier-Score und Transkript-Budget. Sobald echte nischen-fremde deutsche Creator dazukommen, wären beide Fälle nicht mehr unterscheidbar (Codex-Zweitmeinung vom 2026-09-06, Option c).

Quelle: Grilling-Session Chris 2026-09-06, Q8. Dossier der Kandidaten: `.scratch/phase-4-pattern-und-discovery/creator-research/`.

**Befund:**

- `convex/schema.ts`, Tabelle `creators` (~Zeile 363): hat `owned` und `foreign` als optionale Flags, kein Sprach-/Markt-Feld.
- `lib/format-signals.ts` (~Zeile 207): gruppiert nur nach `foreign` in "own" vs. "Foreign niche".
- `lib/format-review.ts` (~Zeile 184): monatlicher Review diffed nur die own-Gruppe; englische Creator wären dort unsichtbar, wenn sie fälschlich über `foreign` liefen.
- `lib/transcripts.ts` (~Zeile 84): globales Transkript-Budget (20 pro Lauf, Score ≥ 20) kennt keine Markt-Priorisierung; englische Creator konkurrieren sonst mit der Kern-Nische um Slots.
- `app/api/creators/route.ts` und Add-Dialog in `components/signal-room.tsx` (~Zeile 643): reichen `owned` durch, `market` fehlt.

**Blocked by:** None — can start immediately. Muss fertig sein, bevor englische Creator eingepflegt werden.

**Status:** done (2026-09-10)

- [x] Schema: `market: v.optional(v.union(v.literal("de"), v.literal("en")))` an `creators`; `creators:upsert` reicht das Feld durch (v.any + clean), fehlend gilt als `"de"`
- [x] `POST /api/creators` akzeptiert `market` (validiert, nur `"en"` wird gespeichert), Add-Dialog hat einen Market-Select (Default German)
- [x] Format Signals: `buildFormatSignals` liefert dritte Gruppe `en`, FormatsView rendert Block "English market" vor "Foreign niche"; `foreign` unangetastet, gewinnt bei Kombination
- [x] Format-Review unverändert: rechnet über die `own`-Gruppe, aus der EN-Creator jetzt herausfallen; EN-Patterns erscheinen als eigene Sektion in Format Signals
- [x] Transkript-Priorisierung: `pickTranscriptBatch` sortiert alle qualifizierten DE-Reels vor jedes EN-Reel (einfachste Regel, die das Budget der Kern-Nische garantiert; kein eigenes Budget-System)
- [x] Tracked Channels zeigt ein EN-Chip für `market: "en"` (DE ist der badge-lose Default)
- [x] Tests: en/de/foreign-Gruppierung, fehlendes `market` = own, DE-vor-EN im Transkript-Batch (396 Tests grün)
- [x] Docs: CONTEXT.md-Absatz zur Abgrenzung `foreign` vs. `market` ergänzt

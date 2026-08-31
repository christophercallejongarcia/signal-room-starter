# 04 — Creator-Detailseite

**What to build:** Klick auf einen Creator in Tracked Channels oder auf den Handle einer Karte öffnet eine Detailseite. Oben eine Stat-Leiste: Views im Korpus, durchschnittlicher Outlier, stärkster Outlier, Anzahl Reels. Darunter "Every retained upload": Tabelle aller Reels des Creators mit Cover, Titel, Datum, Plays, Outlier (in Lime ab Schwelle), Link zu Instagram. Sortierbar nach Datum, Plays, Outlier. Zurück-Navigation zur Liste.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Eigene Route pro Creator, erreichbar aus Tracked Channels und von den Discover-Karten
- [x] Stat-Leiste mit den vier Kennzahlen, berechnet aus dem gespeicherten Korpus
- [x] Tabelle aller Reels, sortierbar, Outlier-Spalte hervorgehoben ab Schwelle
- [x] Optik entspricht dem Dark/Lime-System (Referenz: Frame cue_0008)
- [x] Test: Kennzahlen-Berechnung (Durchschnitt, Maximum) gegen Fixture

## Implementation

- Route: `app/creator/[id]/page.tsx` → `components/creator-detail.tsx`. Links built by `creatorPath` in `lib/creator-detail.ts`, wired into the Discover card handle and the creator name in Tracked Channels.
- Stat bar and sorting are pure functions in `lib/creator-detail.ts` (`creatorStats`, `sortCreatorReels`, `creatorReels`), covered by `tests/creator-detail.test.mjs`.
- Back link goes to `/?tab=channels`; the shell reads the `tab` query parameter once on mount, so the return lands on the list the creator was opened from.
- The detail page ranks with the same scorer as the desk (`outlierScorer` live, `demoScorer` on demo fixtures), so an outlier reads identically on both pages.
- The link carries the tab it was opened from and the outlier threshold Discover was reading at (`creatorPath`), so the back link returns to that list and the lime column agrees with the desk instead of hard-coding `2x`. Opened from Tracked Channels, which has no threshold control, the page falls back to the default.
- Assumption, decided without asking: the hero also shows name, handle, follower count, the owned/foreign chips and a profile link. The ticket only specifies the stat bar, but a detail page that never names the creator it belongs to would be worse.
- Display helpers shared by both pages (`formatNumber`, `timeAgo`, `formatOutlier`, `networkName`, `CoverImage`) moved out of `components/signal-room.tsx` into `components/display.tsx`, and the ranking call into `lib/rank-corpus.ts`, instead of being duplicated.
- Reviewed on both axes. Fixed from the reports: back link now follows the origin tab, the threshold is inherited rather than hard-coded, reel covers crop 4:5, the four-block stat bar gets its own mobile rule, the CSS uses `--radius-pill`/`--radius-card`/`--accent-soft`, `laneStats` in Profile delegates to `creatorStats`, and the module talks about signals rather than reels because the corpus holds posts too.

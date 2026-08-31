# 28 — Das Briefing zeigt die gecachten Cover, nicht die Platzhalter-Grafik

**What to build:** Die Reels im Morning Briefing tragen dasselbe Cover wie in Discover. Heute zeigt jede Briefing-Zeile die generative Platzhalter-Grafik mit Shortcode und Topic ("DcmHI / aitools"), obwohl das Cover im Cache liegt und Discover es anzeigt. Der Grund: Der Convex-Cron komponiert das Briefing in der Cloud ohne Zugriff auf das Cover-Verzeichnis auf der Platte und übergibt deshalb `withCovers: records => records`; die Briefing-Items werden ohne `coverUrl` gespeichert, und `CoverImage` hat für ein Item ohne `coverUrl` und ohne `thumbnailUrl` nur die Grafik. Künftig wird die Cover-URL nicht mehr im Briefing gespeichert, sondern beim Lesen ergänzt: `/api/briefings` läuft die Items durch `withCoverUrls` (Schlüssel `thumbnailSeed`, das ist die externe Reel-ID), genau wie `/api/signals` es für Discover tut. Das gilt für alte wie neue Briefings, egal ob Cron oder Hand-Refresh sie komponiert hat.

Quelle: Screenshot Morning Briefing vom 2026-08-29 21:32 (Cron-Lauf, "no angles: the bridge was unreachable"), Chris am 2026-08-30.

**Befund:**

- `convex/refresh.ts` Zeile 51: `runBriefing({ storage, withCovers: async (records) => records, angles: false })`. Das ist Absicht (Cron darf weder Bridge noch Platte anfassen, Ticket 06/11), aber die Folge ist ein Briefing ohne Cover.
- `lib/briefing.ts` Zeile 99: `coverUrl` wird nur ins Item kopiert, wenn das Signal sie hat. Beim Hand-Refresh über `/api/refresh` hat es sie, beim Cron nicht.
- `app/api/briefings/route.ts` gibt die Dokumente unverändert zurück. `app/api/signals/route.ts` dagegen ruft `withCoverUrls(signals)` auf, deshalb funktioniert Discover.
- `components/display.tsx`, `CoverImage`: Reihenfolge `coverUrl ?? thumbnailUrl`, sonst `SignalArtwork`. Briefing-Items führen keine `thumbnailUrl`, also direkt Grafik.
- `withCoverUrls` verlangt `externalId`; `BriefingItem` heißt das Feld `thumbnailSeed`. Ein kleiner Adapter oder ein zweiter Parameter für den Schlüssel reicht.

**Blocked by:** None — can start immediately. Baut auf dem Cover-Cache aus 02 auf.

**Status:** ready-for-agent

- [ ] `GET /api/briefings` ergänzt `coverUrl` auf jedem Item, dessen Cover im Cache liegt (ein Verzeichnis-Read pro Request, nicht ein Stat pro Item)
- [ ] `lib/briefing.ts` speichert `coverUrl` nicht mehr im Item; das Feld wird ausschließlich beim Lesen gesetzt (Schema-Feld bleibt optional, alte Dokumente bleiben gültig)
- [ ] `runBriefing` braucht `withCovers` nicht mehr; der Cron-Aufruf in `convex/refresh.ts` und die Tests verlieren den Stub
- [ ] Ein Reel ohne gecachtes Cover zeigt weiterhin die Platzhalter-Grafik, kein kaputtes Bild
- [ ] Test: Briefing-Route mit einem Cache-Fixture liefert `coverUrl` für vorhandene und keins für fehlende Cover
- [ ] Test: ein per Cron komponiertes Briefing (ohne `coverUrl` im Dokument) rendert nach dem Lesen mit Cover
- [ ] Docs: CONTEXT.md beschreibt, dass Cover-URLs beim Lesen ergänzt werden, nicht gespeichert

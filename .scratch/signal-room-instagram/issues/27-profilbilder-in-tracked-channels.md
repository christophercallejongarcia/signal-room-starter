# 27 — Profilbilder der Creator in Tracked Channels statt Farbkästen

**What to build:** Die Creator-Zeile in Tracked Channels zeigt das echte Instagram-Profilbild. Heute steht dort nur ein farbiger Kasten, obwohl jeder Creator eine `avatarUrl` hat: Die Links zeigen auf das Instagram-CDN, sind signiert, laufen nach Tagen ab und antworten dem Browser mit 403 (Stichprobe am 2026-08-30: alle zehn Creator, HTTP 403). Das `<img>` bricht, der Kasten bleibt in der Akzentfarbe ohne Bild und ohne Initialen. Künftig wird das Profilbild beim Anlegen des Creators und bei jedem Sweep einmal heruntergeladen und wie die Reel-Cover aus Ticket 02 lokal abgelegt; die UI lädt es über eine eigene Route. Ist kein Bild gecacht oder lädt es nicht, zeigt der Kasten die Initialen auf der Akzentfarbe, nie eine leere Fläche.

Quelle: Screenshot Tracked Channels, Chris am 2026-08-30.

**Befund:**

- `components/signal-room.tsx` Zeile 1917 und 2798: `<img src={creator.avatarUrl} referrerPolicy="no-referrer">`, direkt gegen das CDN. Bei Ladefehler kein `onError`-Fallback, die Initialen erscheinen nur, wenn `avatarUrl` fehlt.
- `lib/adapters/storage/cover-cache.ts` hat bereits Download mit Größenlimit, Magic-Byte-Prüfung, https-Guard und die Route `app/api/covers/[id]/route.ts`. Derselbe Mechanismus passt für Avatare; nur der Schlüssel ist die Creator-ID statt der externen Reel-ID.
- `resolveProfile` in `apify-instagram.ts` liefert bei jedem Backfill eine frische `avatarUrl`. Der Sweep (`runRefresh`) aktualisiert sie heute nicht; ein Creator behält die URL vom Anlegetag.

**Blocked by:** None — can start immediately. Nutzt den Cover-Cache aus 02.

**Status:** ready-for-agent

- [ ] Avatar-Cache: beim Anlegen (`POST /api/creators`) und beim Sweep wird das Profilbild einmal geholt und unter der Creator-ID abgelegt, mit denselben Guards wie der Cover-Cache (https only, Größenlimit, Bildtyp geprüft)
- [ ] Eigene Route (z. B. `/api/creators/[id]/avatar`) liefert das gecachte Bild mit langem Cache-Header, 404 wenn nichts da ist
- [ ] Tracked Channels und Creator-Detailseite laden den Avatar über diese Route; bei 404 oder `onError` erscheinen die Initialen auf der Akzentfarbe
- [ ] Ein Creator mit abgelaufener CDN-URL zeigt weiterhin sein Bild, sofern es einmal gecacht wurde
- [ ] Bestand: ein einmaliger Lauf (oder der nächste Sweep) holt die Bilder der zehn vorhandenen Creator nach
- [ ] Test: Avatar-Download mit Fixture, 404-Fallback der Route, Initialen-Fallback im Render
- [ ] Docs: CONTEXT.md nennt den Avatar-Cache neben dem Cover-Cache

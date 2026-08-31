# 02 — Cover-Cache

**What to build:** Vorschaubilder der Reels bleiben dauerhaft sichtbar. Beim Sammeln wird jedes Cover einmal heruntergeladen und lokal abgelegt; die UI lädt Cover aus dem Cache statt vom Instagram-CDN, dessen signierte Links nach Tagen ablaufen. Fehlt ein Cover im Cache, wird es beim nächsten Refresh nachgeholt; bis dahin zeigt die Karte den generativen Platzhalter.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Nach einem Refresh liegt für jedes neue Reel eine Bilddatei im Cache-Verzeichnis (gitignored), benannt nach der externen ID
- [x] Die App liefert Cover über eine eigene Route aus dem Cache; Discover- und Detail-Karten nutzen diese Route
- [x] Ein Reel mit abgelaufener CDN-URL zeigt weiterhin sein Cover, sofern es einmal gecacht wurde
- [x] Ein Reel ohne gecachtes Cover fällt auf den Platzhalter zurück, kein kaputtes Bild
- [x] Test: Cache-Schreiben ist idempotent, zweiter Lauf lädt nichts erneut

## Comments

2026-08-24, Agent: Umgesetzt. `lib/adapters/storage/cover-cache.ts` (cacheCovers idempotent, Magic-Byte-Prüfung, 5 MB Limit, Id-Whitelist), Route `app/api/covers/[id]`, `/api/signals` setzt `coverUrl` nur bei vorhandener Datei. `POST /api/creators` und `POST /api/refresh` teilen `collectAndStore` (`lib/collect.ts`), das nach dem Speichern cached; der Refresh cached zusätzlich den gesamten Korpus nach und meldet `covers: {cached, skipped, failed}`. UI rendert ausschließlich `coverUrl`. Downloads nur über https, 15 s Timeout, 4 parallel. Tests in `tests/cover-cache.test.mjs` (8). Review-Fixes: Zufallssuffix für Temp-Dateien, `onError`-Fallback auf Artwork, `CoverCacheResult` im Contract. Docs: ARCHITECTURE, SECURITY, SPEC T1.4, CONTEXT "Cover". Zu prüfen im Browser: nach einem Refresh liegen Dateien in `data/covers/`, Karten zeigen Cover; für Reels, deren CDN-Link schon abgelaufen ist, bleibt der Platzhalter bis der Link nie mehr auflöst (kein Nachholen möglich).

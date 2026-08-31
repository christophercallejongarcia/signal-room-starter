# 01 — Glossar und ADRs anlegen

**What to build:** Ein frischer Agent versteht die Projektsprache ohne Nachfragen. `CONTEXT.md` erklärt Creator, Signal, Reel, Watchlist, Backfill, Delta-Refresh, Run, Outlier (Plays geteilt durch Follower), Channel-Relative (Plays geteilt durch Median des Creators), Schwelle, Owned Creator, Format Signal, Hook. ADRs halten die gefallenen Entscheidungen fest: Convex statt Supabase, Apify Instagram-Scraper mit Reels+Posts-Merge, Outlier-Definition, Codex SDK für Text und Bilder (lokaler Bridge, Subscription statt API-Key), Datei-Store nur als Fallback.

**Blocked by:** None — can start immediately

**Status:** done

- [x] `CONTEXT.md` im Repo-Root mit allen genannten Begriffen, je ein Satz Definition und ein Satz, welche Synonyme vermieden werden
- [x] Mindestens vier ADRs unter `docs/adr/` (Convex, Apify, Outlier-Definition, Codex SDK) im Format Kontext / Entscheidung / Konsequenzen
- [x] `docs/SPEC.md` verweist auf CONTEXT.md und ADRs
- [x] Bestehende Tests laufen weiter grün

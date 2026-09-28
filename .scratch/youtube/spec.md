# YouTube in Signal Room: Outlier-Radar, Titel- und Thumbnail-Builder

Captain-Auftrag von Chris, Stand 2026-09-28. Planung und Vorgeschichte liegen im öffentlichen Repo YT-OS unter `/Users/cristobalcallejongarcia/dev/YT-OS/.scratch/yt-os/` (Tickets 04, 09, 11, 15, 18, 19).

## Ziel

Signal Room findet in Chris' Nische YouTube-Kanäle, die auf YouTube richtig gut laufen, und daraus Outlier-Videos, ähnlich wie vidIQ oder 1of10. Aus diesen Outliern entstehen Titel- und Thumbnail-Vorschläge für Chris' eigene Videos.

Erster echter Einsatz: Titel und Thumbnail für Video 1, "Vom Fragensteller zum Chef: Die 6 Stufen, Claude zu nutzen" (Skript: `/Users/cristobalcallejongarcia/dev/YT-OS/videos/01-stufenleiter/skript.md`).

## Entschieden

**Datenquelle** (YT-OS Ticket 04): YouTube Data API v3 für Metadaten und Zahlen, kostenlos, 10.000 Einheiten pro Tag. Transkripte nur für Outlier, über einen Apify-Actor oder lokal per yt-dlp, gedeckelt wie heute. Details und Quota-Rechnung: `/Users/cristobalcallejongarcia/dev/YT-OS/.scratch/yt-os/assets/youtube-datenquelle.md`.

**Outlier** (YT-OS Ticket 11): Nur Longform zählt, Shorts fliegen raus. Primärer Faktor ist Aufrufe geteilt durch den Median der Aufrufe der letzten 30 Longform-Videos desselben Kanals. Das weicht bewusst von ADR-0003 ab (dort Plays durch Follower), deshalb bekommt YouTube ein eigenes ADR. Aufrufe pro Abonnent, Alter und Aufrufe pro Tag werden zusätzlich angezeigt. Die Schwelle ist in der Oberfläche wählbar wie bei Reels, Vorgabe 3x. Die Zahlen werden regelmäßig aufgefrischt, weil Longform wochenlang wächst.

**Suche wie vidIQ:** Suchbegriff, dann Videos, dann Kanal-Median, dann Outlier. Kanäle mit starken Outliern landen als Kandidaten, Chris nimmt sie bewusst in die Watchlist auf. Das Konzept aus P4-05 (Kandidaten-Inbox) und P4-09 (Watchlist-Aufnahme) nutzen statt es doppelt zu bauen.

**Sprache und Themen:** Englisch und Deutsch. Englische Kanäle sind die Outlier-Quelle, deutsche zeigen die direkte Konkurrenz. Themen: Claude und Claude Code, KI-Agents, KI-Betriebssystem, KI-Automatisierung für Business. Start-Suchbegriffe, von Chris erweiterbar:

- Englisch: "Claude Code", "Claude AI tutorial", "AI agents", "agentic workflows", "AI operating system", "AI automation for business"
- Deutsch: "Claude Code deutsch", "KI Agenten", "KI Betriebssystem", "KI Automatisierung Selbstständige"

**Thumbnails** (Rat von Jay, 28.09.): Bild über GPT via Codex SDK wie in Cover Lab (ADR-0004). Der Prompt ist JSON. Beispiel-Thumbnails aus den Outliern gehen als Bild-Input mit. Signal Room sammelt gute Thumbnails als Referenz-Bibliothek. Heute erzeugt Cover Lab bei "face" ein beliebiges Gesicht. Neu: echte Standbilder von Chris als Referenz. Die Standbilder kommen aus dem Dreh von Video 1 (Rohmaterial `/Users/cristobalcallejongarcia/Movies/YT-OS/01-stufenleiter/`, Haupt-Take `DJI_20260927160458_0009_D.MP4`) und liegen unter `/Users/cristobalcallejongarcia/Movies/YT-OS/gesicht/`, nie in einem Repo.

**Titel** (Rat von Jay): Vorschläge aus den Mustern aktueller Outlier-Titel der Nische, geprüft gegen die Outlier der letzten Wochen. Ideen aus vidIQ kann Chris von Hand einspielen. Pro Video mehrere Varianten für den A/B-Test in YouTube.

## Submodule und Grenzen

1. **Grundgerüst, zuerst.** YouTube-Adapter (`lib/adapters/sources/`), Netzwerk-Weiche in `lib/collect.ts` und `app/api/creators/route.ts`, Suchlauf, Outlier-Rechnung, Anzeige in Discover, ADR für die YouTube-Outlier-Definition. Nur dieser Thread ändert das Convex-Schema.
2. **Titel-Builder**, nach dem Grundgerüst. Eigener Bereich, kein Schema-Umbau ohne Absprache mit Thread 1.
3. **Thumbnail-Builder**, nach dem Grundgerüst und parallel zu 2. Baut auf Cover Lab auf.

Ab sofort parallel und ohne Code-Grenze:

- **API-Schlüssel:** Der Waiter legt in der Google Cloud Console einen Schlüssel an, beschränkt auf YouTube Data API v3. Vorher fragt der Captain Chris einmal um Erlaubnis, weil es sein Google-Konto ist. Der Schlüssel steht nur in `.env.local` als `YOUTUBE_API_KEY`, nie im Chat, in Logs oder in Commits.
- **Gesicht:** 10 bis 15 Standbilder aus dem Haupt-Take ziehen, verschiedene Ausdrücke, scharf, gut ausgeleuchtet. Chris wählt die besten aus.

## Abnahme

- Ein Suchlauf mit mindestens einem Begriff pro Thema liefert Kanäle und Outlier mit Faktor, sichtbar in Signal Room.
- Mindestens 10 Kanäle stehen als Kandidaten bereit, Chris kann sie mit einem Klick in die Watchlist aufnehmen.
- Watchlist-Kanäle werden aufgefrischt. Der Quota-Verbrauch pro Lauf wird angezeigt oder geloggt.
- Für Video 1 liegen 5 Titel-Varianten und 3 Thumbnail-Varianten mit Chris' Gesicht vor, jeweils mit Verweis auf die Outlier, die sie angeregt haben.
- `npm run check` ist grün.

## Rahmen

- Repo privat (ADR-0006). Nie nach `upstream` pushen.
- Jeder Cook arbeitet in einem eigenen Worktree. `main` enthält seit Commit `13c6e68` den P4-Stand, darauf aufbauen. Die offenen P4-Branches und -Worktrees nicht anfassen.
- Convex: eine Dev-Datenbank für alle. Schema-Änderungen nur additiv (optionale Felder, neue Tabellen) und nur aus Thread 1.
- Kein Merge nach `main` ohne Chris' Freigabe. Nichts wird auf YouTube hochgeladen oder veröffentlicht.
- Texte an Chris auf Deutsch, echte Umlaute, keine Gedankenstriche.

## Nicht jetzt

- Playbooks Hooks und Titel (15), Thumbnails (18), Konkurrenz (19). Die Builder lesen sie, sobald es sie gibt.
- TikTok und Instagram-Änderungen.

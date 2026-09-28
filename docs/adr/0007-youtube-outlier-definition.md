# ADR-0007: YouTube-Outlier-Definition

Status: akzeptiert, 2026-09-28

## Kontext

ADR-0003 misst Instagram-Reels an der Follower-Zahl (`plays / audience`). Für YouTube taugt das nicht. Longform-Videos werden überwiegend über Suche und Empfehlungen gesehen, nicht von Abonnenten, und die Abonnentenzahl liefert die API nur auf drei signifikante Stellen gerundet. Ein Kanal mit 800.000 Abos und 20.000 Aufrufen pro Video hätte nach ADR-0003 nie einen Outlier, obwohl ein Video mit 200.000 Aufrufen für diesen Kanal zehnmal so gut läuft wie üblich. vidIQ und 1of10 lesen YouTube deshalb gegen den eigenen Normalwert des Kanals. Chris hat das am 2026-09-28 so entschieden (YT-OS Ticket 11).

Die Datenquelle ist die YouTube Data API v3 (YT-OS Ticket 04, Recherche in `YT-OS/.scratch/yt-os/assets/youtube-datenquelle.md`). Sie ist kostenlos, begrenzt aber auf 10.000 Quota-Einheiten am Tag, und `search.list` zählt 100 Einheiten.

## Entscheidung

Rechnung in `lib/adapters/scoring/youtube-outlier.ts`, Begriffe in `CONTEXT.md`:

- **Nur Longform zählt.** Ein Short bekommt den Faktor 0 und geht nicht in den Median ein. Short oder Longform entscheidet YouTubes eigene Playlist `UULF<Kanal>` (nur Nicht-Shorts): Was dort steht, ist Longform, auch ein 90-Sekunden-Trailer im Querformat. Ein Video desselben Kanals, das neuer ist als der älteste Eintrag der Seite und trotzdem fehlt, ist ein Short (`applyUploadFormats`). Nur wo die Playlist nichts sagt (404, ältere Videos), gilt die Heuristik `Dauer ≤ 180 s oder #shorts im Titel`.
- **Faktor = Aufrufe / Kanal-Median.** Der Kanal-Median ist der Median der Aufrufe der letzten 30 Longform-Videos desselben Kanals (`YOUTUBE_BASELINE_VIDEOS`). Das gemessene Video darf selbst darin liegen, der Median ist der jüngste Normalwert des Kanals.
- **Mindestens 5 Longform-Videos** (`YOUTUBE_MIN_BASELINE`), sonst ist der Faktor 0 und die UI sagt, warum.
- **Nebenzahlen, nur angezeigt:** Aufrufe pro Abo, Aufrufe pro Tag seit Veröffentlichung (ein Video jünger als ein Tag zählt als ein Tag), Alter.
- **Schwelle** in Discover wählbar (1,5x, 2x, 3x, 5x), für YouTube getrennt von Instagram gespeichert, Vorgabe 3x (`YOUTUBE_DEFAULT_THRESHOLD`).
- **Kandidat** wird ein Kanal, wenn ein Suchfund mindestens die Vorgabe-Schwelle und mindestens 5.000 Aufrufe hat (`YOUTUBE_CANDIDATE_MIN_VIEWS`). Ohne die Untergrenze macht ein Kanal mit 40 Aufrufen Median aus 1.500 Aufrufen einen bedeutungslosen 38x-Outlier. Der Faktor wird trotzdem gemessen und gezeigt.

Die Zahlen werden aufgefrischt, weil Longform wochenlang wächst: Jeder Refresh misst die letzten 50 Longform-Videos jedes Watchlist-Kanals neu (3 Einheiten pro Kanal). Ein Suchlauf misst jeden gefundenen Kanal mit einer Playlist-Seite und die Videos in 50er-Paketen.

## Konsequenzen

- Der YouTube-Faktor ist nicht mit dem Instagram-Outlier vergleichbar. Beide heißen in der UI "Outlier", die Erklärzeile nennt die Bezugsgröße ("x Kanal-Median" gegen "x follower reach").
- `UULF` ist nicht dokumentiert. Fällt es weg, greift die Dauer-Heuristik; kurze Querformat-Videos würden dann als Short verworfen.
- Der Median braucht frische Zahlen des ganzen Fensters. Das kostet bei YouTube nur Quota, deshalb misst jeder Refresh die ganze letzte Seite neu statt nur neue Videos.
- Seit dem 27.08.2026 zählt YouTube Aufrufe ab dem ersten Frame. Videos davor und danach sind im Median nur eingeschränkt vergleichbar, bis das Fenster aus dem Übergang herausgewachsen ist.
- Die YouTube API Developer Policies verbieten abgeleitete Kennzahlen aus API-Daten. Für ein privates Ein-Personen-Werkzeug ist das Risiko ein gesperrter Schlüssel; Rückfall ist `streamers/youtube-channel-scraper` über Apify, weil nur `mapVideo` die Quellfelder kennt.
- Der Quota-Zähler rechnet `search.list` mit 100 Einheiten. Ein Suchlauf mit den zehn Start-Begriffen kostete am 2026-09-28 1.274 Einheiten (13 % des Tagesbudgets).

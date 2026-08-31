# 14 — Trend Radar über Instagram-Hashtags

**What to build:** Trend Radar zeigt, welche Themen in der Nische gerade Momentum haben. Täglich werden konfigurierte Hashtags (#kitools, #claude, #kiagenten, #vibecoding, ...) über Apify gezogen, deutsche Posts nach Topic geclustert, und pro Topic Momentum (Posts und Plays im Vergleich zur Vorwoche) sowie ein Opportunity-Score (Momentum × wie wenige der getrackten Creators das Thema schon bedienen) berechnet.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Hashtag-Liste in der Konfiguration, Sweep als eigener Run-Typ mit Kostenlimit
- [ ] Sprachfilter Deutsch, Topic-Zuordnung regelbasiert über Schlüsselwörter
- [ ] Trend-Radar-Tab zeigt Topics mit Momentum, Coverage und Opportunity
- [ ] Test: Momentum- und Opportunity-Berechnung gegen Fixture

# 07 — Persönliches Wörterbuch

**What to build:** Beim Übernehmen einer Korrektur kann Chris sie mit `Ins Wörterbuch` merken. Beim nächsten `Korrekturen vorschlagen` an irgendeinem Reel werden Wörterbuch-Treffer zuerst deterministisch als Korrekturen mit Quelle `dictionary` und Status `accepted` angelegt, bevor der Bridge gefragt wird; der Bridge bekommt das Wörterbuch als Kontext. Wörterbuch-Korrekturen sind wie jede andere ablehnbar. Ein Eintrag lässt sich aus der Korrekturliste heraus wieder entfernen; einen eigenen Wörterbuch-Editor gibt es nicht.

**Blocked by:** 06 — Arbeitsfassung mit Korrekturvorschlägen

**Status:** ready-for-agent

- [ ] Tabelle `transcriptDictionary` (wrong, right, Zeitpunkt) in Convex; Datei-Store analog; Storage-Ports zum Auflisten, Anlegen, Entfernen
- [ ] `Ins Wörterbuch` an einer akzeptierten Korrektur; doppelte Einträge werden zusammengeführt
- [ ] Wörterbuch-Treffer werden vor dem Bridge-Lauf als akzeptierte Korrekturen mit Quelle `dictionary` angelegt; Ablehnen wirkt nur auf dieses Reel
- [ ] Bridge-Eingabe enthält das Wörterbuch; ein Bridge-Vorschlag, der einem Wörterbuch-Eintrag widerspricht, fällt weg
- [ ] Entfernen eines Eintrags aus der Korrekturliste
- [ ] Demo-Modus: Wörterbuch lebt nur im Tab
- [ ] Tests: Treffer-Anwendung, Zusammenführung, Widerspruch, Ablehnen ohne Wörterbuch-Änderung
- [ ] CONTEXT.md: Begriff "Wörterbuch"

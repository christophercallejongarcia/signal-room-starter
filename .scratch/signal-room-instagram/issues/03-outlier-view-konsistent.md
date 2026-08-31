# 03 — Outlier-View konsistent, Demo-Daten raus

**What to build:** Die Zahlen in Discover stimmen mit den Karten überein. Der Stat-Block "2x+ outliers" zählt genau die Reels, die der Outlier-View unter den aktiven Filtern (Netzwerk, Zeitfenster, Channel) zeigt. Die Schwelle ist in der Filter-Leiste einstellbar (1.5x, 2x, 3x, 5x) und wirkt auf Badge, Zähler und Filter. Sobald echte Creators vorhanden sind, verschwinden die synthetischen Demo-Creators und -Signale aus allen Tabs; Demo bleibt nur für einen leeren Store.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Zähler im Stat-Block == Anzahl Karten im Outlier-View, bei jeder Filterkombination
- [x] Schwellen-Auswahl in der Filter-Leiste, Standard 2x, wirkt auf Badge, Zähler und Filter
- [x] Mit mindestens einem echten Creator zeigt kein Tab mehr Demo-Daten; "5 channels" wird zu "9 channels"
- [x] Leerer Store zeigt weiterhin die Demo-Ansicht
- [ ] Seitenweise Blätterung in Discover: Anzahl je Seite wählbar, aktuelle Seite und Gesamtzahl sichtbar, Filterwechsel setzt auf Seite 1 zurück
- [x] Test: Zählfunktion und Filterfunktion teilen dieselbe Prädikat-Logik

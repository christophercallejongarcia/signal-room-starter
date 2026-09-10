# 06: Hashtag-Autoren und starke Reel-Funde als Kandidaten bewerten

**What to build:** Chris übernimmt neue Autoren aus vorhandenen Hashtag-Funden und ausgewählten starken Reels und kann eine begrenzte aktuelle Stichprobe für ihre Aufnahmeentscheidung laden.

**Blocked by:** [P4-05: Creator-Kandidaten aus manueller Auswahl und Dossiers prüfen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/05-creator-kandidaten-inbox.md>)

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Vorhandene ownerHandle und bewusst gewählte Reel-Funde erzeugen deduplizierte Kandidaten mit Quell-Reel und Entdeckungsweg. Der bestehende deutsche Hashtag-Korpus bleibt getrennt.
- [ ] Bewusste Anreicherung holt höchstens zwölf aktuelle Reels innerhalb 90 Tagen je Kandidat und höchstens zehn Kandidaten pro Run; Vorschau nennt Umfang und konfiguriertes Kostenbudget.
- [ ] Kandidatenbeispiele gelangen vor Aufnahme nicht in Watchlist, Daily Sweep, normale Signals oder das Strategie-Evidenzpaket.
- [ ] Karte zeigt Themenbegründung, mindestens die vorhandenen relevanten Beispiele, Median-Plays, besten Outlier, Anteil ab ausgewiesener Schwelle, Aktualität, Followerstand und Stichprobengröße.
- [ ] Unter drei brauchbaren aktuellen Reels heißt das Urteil zu wenig Daten. Alte gepinnte Reels sind separat; fehlende Metriken werden nicht erfunden oder mit aktuellen gleichgesetzt.
- [ ] Providerkosten und Teilfehler sind am Run sichtbar. Unbekannte Kosten sind keine Null; ausgeschöpfte Mengen oder unbekannte Nutzung verhindern automatische Folgeläufe.
- [ ] Tests mit Fake-Connector prüfen Eigentümer-Normalisierung, Deduplizierung, Datumsfilter, gepinnte Alt-Reels, fehlende Daten, Grenzen und Nichtaufnahme; Demo benötigt keinen Provider.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


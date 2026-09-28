# 03: Eigene Ergebnisse vergleichen und monatliche Learnings ableiten

**What to build:** Chris vergleicht die tatsächlichen eigenen Ergebnisse nach Hook, Framework, Pattern und CTA und erhält monatlich prüfbare Hypothesen mit konkreten Belegen.

**Blocked by:** [P6-02: Auch ältere eigene Reels gezielt messen und den Verlauf zeigen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/02-eigene-messhistorie.md>); [P4-04: Bestätigte Pattern im Skriptstudio verwenden](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/issues/04-pattern-im-skript.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Owned-Ansicht verknüpft jede Zahl mit Publication, Skriptfassung, Messzeit und optionaler PDF/Pattern-Fassung. Fremde Creator sind ausgeschlossen.
- [ ] Vergleich trennt Owned Creator und Beobachtungsfenster; er zeigt Gruppen, Anzahl, Median und konkrete Reels. Fehlende historische Messung wird nicht aus aktuellen Zählern geschätzt.
- [ ] Monatslauf unter zehn belegten Publications schreibt zu wenig Daten ohne Hypothesen. Einzelvergleich benötigt mindestens drei Reels je Gruppe im selben Messfenster.
- [ ] Convex berechnet begrenzte deterministische Vergleiche und merkt Synthese vor; ein lokaler Worker oder manueller Start formuliert sie über den bestehenden Bridge. Kein Cloud-Aufruf von localhost.
- [ ] Monat plus Daten-Hash ist idempotent. Hypothesen tragen Beleg-IDs, berechnete Werte, Datenstand und nächsten überprüfbaren Versuch; erfundene Referenzen/Zahlen werden abgelehnt.
- [ ] Chris kann Learnings behalten oder verwerfen. Die App ändert keine Rankinggewichte, Frameworks oder Pattern-Status automatisch. Falsche Publication-Zuordnung markiert abgeleitete Learnings ungültig.
- [ ] Das historische Retained-Learnings-Ticket wird fachlich durch diesen Ablauf erfüllt; es entsteht kein zweiter konkurrierender Monatsjob.
- [ ] Tests prüfen 9/10 Publications, unzureichende Untergruppen, verschiedene Altersfenster, fehlende Daten, Bridge-Ausfall, Wiederholung und unzulässige Evidenz. Demo zeigt einen kleinen und einen ausreichenden Datensatz.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


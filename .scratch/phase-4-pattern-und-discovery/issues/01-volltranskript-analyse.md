# 01: Volltranskript in der Reel-Ansicht analysieren

**What to build:** Chris sieht an einem Reel die belegte Inhaltsanalyse und kann ausstehende oder fehlgeschlagene Analysen nachholen. Neue fertige Transkripte werden vorgemerkt und durch einen begrenzten lokalen Worker verarbeitet.

**Blocked by:** Keine. Kann unabhängig starten.

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Analyse nennt Textfassung, Text-Hash und Analyseversion; PAS/BBB, Hook, Spannung, Schleifen, Beweise, Beispiele, Übergänge, Rhythmus und CTA sind mit echten Fundstellen sichtbar.
- [ ] Arbeitsfassung hat Vorrang; Original bleibt erhalten. Zitate und Zeichenpositionen werden gegen die übergebene Fassung geprüft. Zeitmarken erscheinen nur bei belegbarer Zuordnung.
- [ ] Lange Transkripte werden begrenzt verarbeitet; unvollständige Verarbeitung ist sichtbar und zählt nicht als vollständige Analyse.
- [ ] Vormerken funktioniert bei manuellen und automatischen fertigen Transkripten sowie beim begrenzten Nachholen. Cloud-Aufträge warten bei ausgeschaltetem lokalen Worker, ohne den Refresh zu blockieren.
- [ ] Queue, Claim mit Ablaufzeit, Ergebnis und Fehler werden persistiert. Identischer Text/Analyseversion erzeugt keinen doppelten Lauf; veraltete Ergebnisse ersetzen keine neuere Fassung.
- [ ] Die Reel-Ansicht zeigt ausstehend, laufend, fertig, fehlgeschlagen und veraltet mit passender Aktion. Synthetische Demo braucht keinen Bridge.
- [ ] Anwendungsfalltests prüfen Fundstellen, Korrektur, fehlende Zeitmarken, Wiederholung, abgelaufenen Claim, Bridge-Ausfall und spätes Ergebnis; die bestehende Transkriptfunktion bleibt unverändert.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


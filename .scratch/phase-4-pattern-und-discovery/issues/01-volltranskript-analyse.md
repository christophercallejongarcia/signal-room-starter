# 01: Volltranskript in der Reel-Ansicht analysieren

**What to build:** Chris sieht an einem Reel die belegte Inhaltsanalyse und kann ausstehende oder fehlgeschlagene Analysen nachholen. Neue fertige Transkripte werden vorgemerkt und durch einen begrenzten lokalen Worker verarbeitet.

**Blocked by:** Keine. Kann unabhängig starten.

Status: resolved

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [x] Analyse nennt Textfassung, Text-Hash und Analyseversion; PAS/BBB, Hook, Spannung, Schleifen, Beweise, Beispiele, Übergänge, Rhythmus und CTA sind mit echten Fundstellen sichtbar.
- [x] Arbeitsfassung hat Vorrang; Original bleibt erhalten. Zitate und Zeichenpositionen werden gegen die übergebene Fassung geprüft. Zeitmarken erscheinen nur bei belegbarer Zuordnung.
- [x] Lange Transkripte werden begrenzt verarbeitet; unvollständige Verarbeitung ist sichtbar und zählt nicht als vollständige Analyse.
- [x] Vormerken funktioniert bei manuellen und automatischen fertigen Transkripten sowie beim begrenzten Nachholen. Cloud-Aufträge warten bei ausgeschaltetem lokalen Worker, ohne den Refresh zu blockieren.
- [x] Queue, Claim mit Ablaufzeit, Ergebnis und Fehler werden persistiert. Identischer Text/Analyseversion erzeugt keinen doppelten Lauf; veraltete Ergebnisse ersetzen keine neuere Fassung.
- [x] Die Reel-Ansicht zeigt ausstehend, laufend, fertig, fehlgeschlagen und veraltet mit passender Aktion. Synthetische Demo braucht keinen Bridge.
- [x] Anwendungsfalltests prüfen Fundstellen, Korrektur, fehlende Zeitmarken, Wiederholung, abgelaufenen Claim, Bridge-Ausfall und spätes Ergebnis; die bestehende Transkriptfunktion bleibt unverändert.
- [x] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [x] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


## Abnahmebelege 2026-09-18

Vorhandene Umsetzung und fünf offene Korrekturdateien übernommen und geprüft. `npm run check`: 462 Node-Tests bestanden, ein vorhandener Test übersprungen; 7 Convex-Tests bestanden; Typecheck und Produktionsbuild bestanden. Neue Tests prüfen deterministische Begrenzung, alte Analyseversionen, negative Fundstellen und gekürzte Zitatpositionen. Synthetische Demo ohne Credentials bei 360 und 1440 CSS-Pixeln geprüft: Vergleich mit ausreichender und fehlender Basis, Öffnen des fehlenden Reels, synthetisches Transkript, vollständige Inhaltsanalyse samt Fundstellen; kein horizontaler Überlauf. Speicherabnahme lokal mit convex-test, kein Cloud-Deployment und kein bezahlter Providerlauf.

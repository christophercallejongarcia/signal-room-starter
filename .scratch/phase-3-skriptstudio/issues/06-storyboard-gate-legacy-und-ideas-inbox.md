# 06 — Storyboard-Gate, Legacy und Ideas-Inbox

**What to build:** Das Storyboard entsteht nur noch aus einem freigegebenen Skript. Der Storyboard-Hook ist wörtlich der Skript-Hook; Beats werden auf genau drei verdichtet, Caption, CTA und Takeaway abgeleitet. Caption-Zeilen, CTA und Beat-Details dürfen weder untereinander noch mit dem Hook übereinstimmen; ein Treffer lehnt den Lauf ab. Das Storyboard trägt `scriptId` und `scriptRevision`; ohne `scriptId` ist es `Legacy` mit Badge, bei abweichender Revision zeigt die Idea "Storyboard älter als das Skript". Ein Legacy-Storyboard lässt sich gezielt aus einem freigegebenen Skript neu erzeugen. Die Prognose steht wie bisher neben dem Storyboard. Der alte Direktweg (Storyboard aus Idea plus Paket) wird entfernt; `Develop again` öffnet das Skript. Der Ideas-Tab trägt nur noch Inbox-Arbeit: erfassen, entwickeln, verwerfen; Zählerleiste und manuelle Stufenzüge bleiben unverändert.

**Blocked by:** 03 — Draft-Lauf mit Anti-Kopie-Prüfung; 04 — Editor: Abschnitte und Leseansicht synchron

**Status:** done

- [x] `POST /api/scripts/<id>/storyboard`, nur für `approved`, sonst Konflikt mit Grund
- [x] Zweite Eingabeform des bestehenden Bridge-Endpunkts `/v1/storyboard`: das freigegebene Skript statt Idea plus Paket; Verdichtung auf genau drei Beats
- [x] Deterministisch vor dem Speichern: `hook` aus dem Skript gesetzt, nicht aus der Antwort; Dopplungsprüfung mit normalisiertem Vergleich lehnt Treffer ab
- [x] Storyboard-Felder `scriptId` und `scriptRevision`; `Legacy`-Badge ohne `scriptId`; Hinweis "Storyboard älter als das Skript" bei Revisionsabweichung; Neu-Erzeugen aus freigegebenem Skript
- [x] Getrennte Felder stehen im Schema: Skript-Hook, Storyboard-Beats, Caption, `commentCta`, `leadMagnetCta`; die beiden CTA-Felder bleiben in diesem Ausbau leer
- [x] Prognose wie bisher aus den vergleichbaren Reels des Pakets
- [x] Alter Direktweg entfernt; `Develop again` öffnet das Skript; Ideas-Tab als Inbox mit aufklappbarem Storyboard
- [x] Demo-Modus: Storyboard-Lauf antwortet mit festem Beispiel
- [x] Tests: Dopplungsprüfung, Lauf-Funktion mit Fakes (nur aus `approved`, Legacy-Kennzeichnung, veraltetes Storyboard bei neuer Revision), Bridge-Vertrag der zweiten Eingabeform
- [x] CONTEXT.md: "Legacy-Storyboard"; "Storyboard" und "Idea" auf den neuen Ablauf umgeschrieben; in `docs/SPEC.md` ersetzt ein Verweis auf die Spec den T5.2-Absatz

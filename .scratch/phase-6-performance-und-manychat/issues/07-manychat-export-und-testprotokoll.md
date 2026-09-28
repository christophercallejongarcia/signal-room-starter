# 07: Freigegebenes Paket exportieren und externen Test dokumentieren

**What to build:** Chris genehmigt die geprüfte Übergabe, exportiert dieselbe Version und dokumentiert anschließend die außerhalb von Signal Room erfolgte Einrichtung und Instagram-Abnahme.

**Blocked by:** [P6-06: Keyword, öffentliche PDF-Version und Kanalgrenzen prüfen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/06-manychat-validierung.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Freigabe verlangt vollständige Publication, freigegebene PDF, passenden aktuellen Prüfbericht und bestätigte manuelle Übergabepunkte. Erwartete Revision wird atomar geprüft.
- [ ] Freigabe bindet Script/PDF, Keywords, Texte, Linkprüfung und Regelversion. Jede relevante Änderung entwertet sie; ein späteres Exportieren verwendet exakt die genehmigte Paketfassung.
- [ ] Markdown und versioniertes JSON stehen als lokale Downloads bereit. JSON wird als Signal-Room-Übergabeformat bezeichnet, nicht als nativer ManyChat-Import.
- [ ] Export löst keine Veröffentlichung, ManyChat-Mutation, Hosting-Aktion oder Nachricht aus. E-Mail-/Kontaktlisten gehören nicht ins Paket.
- [ ] Extern eingerichtet, auf Instagram geprüft und extern aktiv sind getrennte menschliche Angaben mit Zeitpunkt. Keiner dieser Zustände folgt automatisch aus approved oder exported.
- [ ] Testprotokoll deckt neuen Testkontakt/ersten Kommentar, Kanal/Reel, Opening-Klick, Smartphone-Download, Tags, optionale Zweige und Follow-up ab. Builder-Vorschau allein erfüllt es nicht.
- [ ] Der Export darf vor dem echten Instagram-Test erfolgen; auf Instagram geprüft wird erst nach entsprechendem menschlichen Nachweis gesetzt. Ein fehlgeschlagener Test kann dokumentiert werden.
- [ ] Tests prüfen alle Freigabe-Gates, stale Revision, Exportgleichheit und getrennte externe Angaben; die synthetische Abnahme sendet keine Nachrichten.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


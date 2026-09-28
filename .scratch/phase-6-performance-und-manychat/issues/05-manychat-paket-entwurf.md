# 05: ManyChat-Übergabe mit konkreter Nachrichtenfolge vorbereiten

**What to build:** Chris erstellt vor oder nach Veröffentlichung ein bearbeitbares Übergabepaket und sieht seine Nachrichtenfolge mit allen noch fehlenden Voraussetzungen.

**Blocked by:** [P5-08: PDF-CTA und Kommentar-Keyword bewusst festlegen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/08-cta-und-keyword.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Paket übernimmt Lead-Magnet-ID, Script-Snapshot, primäres Keyword und Materialversprechen; Publication, öffentliche URL und finale PDF dürfen im Entwurf noch fehlen.
- [ ] Editor enthält Automationsname, Reel-Scope, Alias-/Ausschlusswörter, Spoken CTA, Caption-CTA, öffentliche Reply-Entscheidung, ein bis drei Reply-Varianten, Opening DM mit Interaktionsbutton, Delivery-Text/-Link/-Label und Tags.
- [ ] E-Mail, Follow-Prüfung und Follow-up sind standardmäßig aus. Aktivierung fordert die laut Spec nötigen Texte/Entscheidungen; E-Mail-Felder erfassen keine Kontakte.
- [ ] Die Ablaufansicht zeigt Kommentar, optionale öffentliche Antwort, Opening-Interaktion, optionale E-Mail/Follow-Schritte, Auslieferung und Follow-up nur ohne Klick im erlaubten Zeitfenster.
- [ ] Ein lokales Kampagnenregister kann bekannte aktive Trigger samt Scope und letzter menschlicher Bestätigung speichern. Es behauptet keine vollständige ManyChat-Synchronisierung.
- [ ] Keyword-/Textänderungen schreiben eine neue Paketrevision und verändern kein freigegebenes Script. Es gibt keine ManyChat-Schreibverbindung und keinen Nachrichtenversand.
- [ ] Tests prüfen Paketfelder, optionale Zweige, Entwurf ohne Veröffentlichung, fehlenden Link, getrennte CTA-Felder und ausbleibende externe Writes; Demo zeigt den vollständigen Entwurf.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


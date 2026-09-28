# 06: Keyword, öffentliche PDF-Version und Kanalgrenzen prüfen

**What to build:** Chris sieht eine konkrete Prüfliste, die das Übergabepaket mit dem veröffentlichten Reel, der freigegebenen PDF und den aktuellen Kanalregeln abgleicht.

**Blocked by:** [P6-01: Eigene Veröffentlichung mit der verwendeten Skriptfassung verbinden](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/01-publication-zuordnung.md>); [P6-05: ManyChat-Übergabe mit konkreter Nachrichtenfolge vorbereiten](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/05-manychat-paket-entwurf.md>); [P5-10: Geprüfte PDF-Version freigeben und lokal exportieren](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/10-pdf-freigabe-und-export.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Reel-ID/Shortcode/URL und Owned-Publication müssen zusammenpassen. Script-Snapshot, PDF-Version und Byte-Hash werden gegen den freigegebenen Stand geprüft.
- [ ] Primäres Keyword stimmt als normalisiertes ganzes Wort in gesprochenem CTA, Caption-CTA und Trigger überein. SYSTEM/JARVIS, fehlende Texte, Platzhalter und relevante lokale Triggerüberschneidungen werden angezeigt.
- [ ] Eine serverseitige begrenzte URL-Prüfung ohne Auth bestätigt öffentliches HTTPS, PDF-Signatur und identischen Artefakt-Hash; private Ziele, gefährliche Redirects, Login-/HTML-Seiten und falsche Version werden blockiert.
- [ ] Regelversion trägt Quellen und Prüfdatum. Zeichen und UTF-8-Bytes werden getrennt geprüft, ebenso Label unter 20 Zeichen, höchstens drei Buttons, einzelner Opening-Block und echter Interaktionsbutton.
- [ ] Follow-up-Prüfung verlangt fehlenden Linkklick, vorgesehene Interaktion und Wartezeit innerhalb 24 Stunden; die App behauptet keine Kenntnis realer Empfängerzeitpunkte.
- [ ] Offene manuelle Punkte bleiben sichtbar: Kanal/Berechtigungen/Routing, Tarif, Kampagnenregister, Smartphone-Download und bedingte Datenschutzangaben. Ein lokaler Prüferfolg ist keine externe Aktivierung.
- [ ] Tests decken Regelgrenzen, Umlaute/Emoji, dynamische Labels, Keyword-Konflikt, falschen Hash, privaten Redirect, fehlende manuelle Prüfung und Revision nach Prüfbericht ab.
- [ ] Die aktuellen offiziellen ManyChat-Quellen werden bei Umsetzung erneut abgeglichen; widersprüchliche Dokumentation wird nicht still durch erfundene Unterstützung ersetzt.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


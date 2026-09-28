# 04: Sprachprofil ausschließlich aus veröffentlichten Skripten aktualisieren

**What to build:** Chris aktualisiert ein nachvollziehbares Sprachprofil aus tatsächlich veröffentlichten Skriptfassungen und verwendet es für neue Hook- und Draft-Läufe.

**Blocked by:** [P6-01: Eigene Veröffentlichung mit der verwendeten Skriptfassung verbinden](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/issues/01-publication-zuordnung.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Die Quellenansicht zeigt nur unveränderliche Script-Snapshots mit belegter Owned-Reel-Verbindung. Approved ohne Veröffentlichung, aktuelle Drafts, fremde Transkripte und Demo-Fixtures sind ausgeschlossen.
- [ ] Chris startet die Aktualisierung bewusst. Ein versioniertes Profil speichert Quellen-IDs, Daten-Hash und Erstellzeit; ein leerer Bestand erzeugt keine erfundene Stimme.
- [ ] Der bestehende lokale Bridge verarbeitet ein begrenztes Paket; Stilhinweise und Zitate werden auf die zugelassenen Quellen zurückgeführt. Kein Training und kein neuer Provider.
- [ ] Neue Hook-/Draft-Läufe erhalten das aktivierte Profil neben den bestehenden Stil- und Anti-Kopie-Regeln. Bestehende Skripte werden nicht umgeschrieben.
- [ ] Abschalten oder fehlendes Profil verwendet den bisherigen Ablauf. Korrigierte Publication-Zuordnung und entfernte Owned-Markierung entwerten betroffene Profilquellen vor weiterer Nutzung.
- [ ] Es gibt eine Vorschau der Quellen und des aktiven Profilstands sowie Lade-, Fehler- und leeren Zustand.
- [ ] Tests prüfen zulässige Quellen, wieder geöffnetes Script, fehlende historische Fassung, ausgeschaltetes Profil, ungültige Zuordnung und begrenztes Paket; Demo aktualisiert nur ein synthetisches Profil.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


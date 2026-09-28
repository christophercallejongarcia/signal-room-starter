# 10: Geprüfte PDF-Version freigeben und lokal exportieren

**What to build:** Chris gibt genau die geprüfte PDF-Fassung frei, lädt sie herunter und legt sie auf Wunsch bewusst in der vereinbarten Vault-Ablage ab.

**Blocked by:** [P5-08: PDF-CTA und Kommentar-Keyword bewusst festlegen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/08-cta-und-keyword.md>); [P5-09: Individuelle PDF-Vorschau mit Layoutbericht erzeugen](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/09-pdf-vorschau-und-layoutpruefung.md>)

Status: ready-for-agent

Parent: [Phase-5-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/spec.md>)

## Acceptance criteria

- [ ] Freigabe verlangt aktuelles Research-Gate, vollständigen Inhalt, entschiedenen PDF-CTA, bestandene Pflichtprüfungen und menschliche Seitenprüfung. Platzhalter und fehlende Pflichtinhalte sind nicht übersteuerbar.
- [ ] Freigabe speichert Dokument-/Designrevision, Prüfbericht, Byte-Hash und Zeitpunkt; ein veralteter Prüfstand oder konkurrierende Änderung wird atomar abgelehnt.
- [ ] Download liefert genau die freigegebenen Bytes ohne Neurender. Spätere Inhalte, CTA, Visuals oder Designänderungen erzeugen eine neue ungeprüfte Version; alte Exporte bleiben nachvollziehbar.
- [ ] Im Vault ablegen zeigt den konkreten Zielnamen und schreibt erst nach der Aktion eine unveränderliche PDF-Version in den erlaubten Lead-Magnet-Bereich; bestehende andere Versionen werden nicht überschrieben.
- [ ] Wiederholte Ablage desselben Hashs ist idempotent; Konflikt und Schreibfehler behalten Download und Freigabe. Ablage ist unabhängig von der Community-Notizfunktion.
- [ ] Die UI kennzeichnet den Download als lokal. Export publiziert keine URL und richtet kein Hosting ein; Phase 6 erhält Artefakt-ID/Version/Hash zur späteren URL-Prüfung.
- [ ] Tests prüfen Freigabe-Gates, CTA none, falschen Hash, veraltete Revision, Byte-Identität, gezielte Vault-Ablage und ausbleibenden Upload; Demo liefert nur synthetische Artefakte.
- [ ] Operativer Zustand ist über additive Verträge in Convex persistiert und im Datei-Fallback nutzbar; atomare Gates sind nach den Convex-Testvorgaben geprüft.
- [ ] Lade-, Leer-, Fehler- und Erfolgszustände sowie mobile Demo sind abgenommen; Adaptergrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Ein synthetischer vollständiger Durchlauf zeigt das Ergebnis dieses Tickets. Freigaben werden als Produktfunktion implementiert; dieser Plan erteilt keine Freigabe für spätere echte Inhalte oder externe Aktionen.


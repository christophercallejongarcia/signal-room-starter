# 01: Eigene Veröffentlichung mit der verwendeten Skriptfassung verbinden

**What to build:** Chris erfasst eine Veröffentlichung, verbindet eindeutig passende Owned Reels und klärt unsichere Treffer in einer Auswahlansicht.

**Blocked by:** [P5-01: Lead Magnet aus einer archivierten Skriptfreigabe starten](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-5-lead-magnets/issues/01-projekt-aus-skriptfreigabe.md>)

Status: ready-for-agent

Parent: [Phase-6-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-6-performance-und-manychat/spec.md>)

## Acceptance criteria

- [ ] Publication speichert den unveränderlichen freigegebenen Script-Snapshot, Idea, Veröffentlichungsdatum/Titel, tatsächliche Caption und optionale Pattern-/Lead-Magnet-/PDF-Bezüge.
- [ ] Fremdes sourceSignalId und eigenes publishedSignalId bleiben getrennt. Ein Script ohne Lead Magnet kann veröffentlicht zugeordnet werden.
- [ ] Automatisches Matching gilt nur für einen eindeutigen Treffer desselben gewählten Owned Creators, am eingegebenen Berliner Kalendertag und mit exakt normalisiertem Titel/erster Caption-Zeile.
- [ ] Mehrdeutige, unvollständige und nur ähnliche Treffer bleiben Vorschläge. Chris kann einen gespeicherten Owned-Reel-Treffer bewusst auswählen; kanonische ID wird danach dauerhaft verwendet.
- [ ] Die Speichergrenze verhindert fremde Signals, falsches Format und doppelte Reel-Zuordnung. Retry/Doppelklick sind idempotent; geänderte Caption löst keine automatische Neuverknüpfung aus.
- [ ] Korrektur protokolliert vorherige/neue Verbindung und entwertet davon abhängige Ableitungen. Historisch unbekannte Skripttexte werden nicht rekonstruiert und nicht als Sprachquelle verwendet.
- [ ] Tests prüfen eindeutigen/mehrdeutigen Treffer, Zeitzonengrenze, Platzhaltertitel, falschen Owned Creator, konkurrierende Zuordnung und Korrektur; Demo simuliert ein veröffentlichtes Reel.
- [ ] Operativer Zustand ist über additive Verträge in Convex und im lokalen Fallback nutzbar; atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] Alle UI-Zustände und mobile Demo sind abgenommen; Vertrauensgrenze und Begriffe sind dokumentiert, `npm run check` besteht.

## Abnahme

Die Implementierung ist mit synthetischen Publications, Messwerten und Artefakten vollständig prüfbar. Tatsächliche Performance braucht echte veröffentlichte Reels. Externe Einrichtung, Nachrichten und Live-Tests erfordern später eine konkrete menschliche Aktion und sind nicht durch dieses Ticket vorab genehmigt.


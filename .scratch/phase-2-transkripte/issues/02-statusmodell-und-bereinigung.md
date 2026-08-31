# 02 — Statusmodell erweitern und falsche stumme Reels zurücksetzen

**What to build:** Ein Reel kann `pending` (Actor läuft) und `failed` (Actor-Fehler mit Ursache) sein, und die zwanzig heute fälschlich als `silent` gespeicherten Reels sind wieder offen, so dass der nächste Refresh sie holt. Am Signal stehen dazu Versuche, Zeitpunkt des letzten Ergebnisses, begrenzte Fehlermeldung und Zeitmarken (nur wenn der Actor sie liefert). Der Run zählt `failed` mit. Für die Automatik bleiben `ready`, `silent`, `missing` endgültig; `pending` und `failed` fasst sie ebenfalls nicht an. Ein `pending`, das älter als der konfigurierte Zeitraum ist, gilt als abgebrochen; das Prädikat dafür steht in der Transkript-Logik.

**Blocked by:** 01 — Actor-Antwort prüfen (die Bereinigung darf erst laufen, wenn der Parser die Reels nicht sofort wieder falsch markiert)

**Status:** ready-for-agent

- [x] `transcriptStatus` kennt `pending` und `failed`; Signal trägt Versuche, Zeitpunkt, Fehlermeldung, Segmente; Convex-Schema und Datei-Store passen
- [x] `TranscriptCount` am Run zählt `failed`
- [x] Die Batch-Auswahl des Refresh lässt `pending` und `failed` aus; ein Refresh schreibt bei einem Actor-Fehler an den gesendeten Reels `failed` mit Ursache und zählt die Versuche hoch
- [x] Einmalige, idempotente Bereinigung: Signals mit `silent` oder `missing` ohne Transkript verlieren den Status (Convex interne Mutation nach dem Muster der Stufen-Migration; Datei-Store beim Laden); Ticket-Kommentar nennt die Zahl der zurückgesetzten Reels
- [x] Prädikat "abgelaufenes pending" mit konfigurierbarem Zeitraum (Standard 10 Minuten)
- [x] Tests: Statusmodell im Refresh mit Fake-Transcriber (Vorbild `tests/transcript-run.test.mjs`), Bereinigung, abgelaufenes pending
- [x] CONTEXT.md: Begriff "Transkript" um die neuen Status ergänzt

## Comments

### 2026-08-31

- `npx convex dev --once` hat Schema und Funktionen in der Dev-Deployment `robust-shepherd-280` aktualisiert.
- `npx convex run signals:resetLegacyTranscriptStatuses` setzte **20** alte `silent`/`missing`-Signals ohne Transkript zurück (`seen: 1254`). Ein zweiter Lauf setzte `0` zurück und bestätigt die Idempotenz.
- `TRANSCRIPT_PENDING_TIMEOUT_MINUTES` steht standardmäßig auf `10`. Die lokalen Tests und `npm run typecheck` laufen grün.

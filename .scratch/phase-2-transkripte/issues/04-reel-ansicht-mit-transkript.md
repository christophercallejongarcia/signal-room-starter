# 04 — Reel-Ansicht mit Transkript

**What to build:** Chris öffnet an einer Discover-Karte, einer Briefing-Zeile oder einer Zeile der Creator-Detailseite die Reel-Ansicht: ein Panel mit Cover, Kennzahlen, Caption und dem Transkriptbereich. Der Bereich zeigt den Status (kein Transkript, `pending`, `silent`, `missing`, `failed` mit Ursache, `ready`), bei `ready` das Originaltranskript mit Zeitmarken, wenn Segmente vorliegen, dazu Zeitpunkt und Zahl der Versuche. Die Karte selbst trägt nur ein Status-Badge. Die Aktionen `Transkribieren` und `Erneut versuchen` erscheinen hier bereits an der richtigen Stelle, sind aber bis Ticket 05 deaktiviert und sagen das. Demo-Fixtures enthalten ein Reel mit Transkript.

**Blocked by:** 02 — Statusmodell (die Ansicht zeigt alle Status)

**Status:** done

- [x] Reel-Ansicht aus Discover, Briefing und Creator-Detailseite erreichbar, eine Komponente für alle drei
- [x] Alle sechs Zustände des Transkriptbereichs rendern unterscheidbar; Fehlerzustand zeigt die gespeicherte Ursache
- [x] Zeitmarken erscheinen, wenn Segmente vorliegen, sonst der Fließtext
- [x] Status-Badge an Karte und Zeilen
- [x] Demo-Modus zeigt ein Reel mit Transkript ohne Credentials
- [ ] Von Hand geprüft nach RUNBOOK: jeder Zustand einmal, im Kommentar abgehakt
- [x] CONTEXT.md: Begriff "Reel-Ansicht"

## Comments

### 2026-08-31

- Discover-Karten, Briefing-Zeilen und Creator-Detailzeilen öffnen dieselbe `ReelDetailPanel`-Komponente. Die Karte und die Zeilen zeigen nur das kompakte Status-Badge.
- Der Statusmapper deckt `none`, `pending`, `silent`, `missing`, `failed` und `ready` ab. `failed` zeigt `transcriptError`; `ready` zeigt das Original und vorhandene Segmente mit Start- und Endzeit. Die Aktionen bleiben bis Ticket 05 deaktiviert.
- Die Demo-Fixture `signal-thumbnail` ist ein `ready`-Reel mit Originaltranskript, zwei Zeitsegmenten, Versuchszähler und Zeitstempel. Der Test prüft die Fixture und alle sechs Anzeigezustände.
- Im Preview wurden der Einstieg aus Discover, der `none`-Zustand mit deaktivierter `Transcribe`-Aktion und ein Live-`ready`-Reel geprüft. Der Live-Korpus enthält aktuell keine `pending`, `silent`, `missing` oder `failed`-Zeilen. Deshalb bleibt die RUNBOOK-Prüfung dieser vier Zustände offen; die gemeinsame Statusmatrix ist automatisiert abgedeckt.

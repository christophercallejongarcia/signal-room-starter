# 04 — Reel-Ansicht mit Transkript

**What to build:** Chris öffnet an einer Discover-Karte, einer Briefing-Zeile oder einer Zeile der Creator-Detailseite die Reel-Ansicht: ein Panel mit Cover, Kennzahlen, Caption und dem Transkriptbereich. Der Bereich zeigt den Status (kein Transkript, `pending`, `silent`, `missing`, `failed` mit Ursache, `ready`), bei `ready` das Originaltranskript mit Zeitmarken, wenn Segmente vorliegen, dazu Zeitpunkt und Zahl der Versuche. Die Karte selbst trägt nur ein Status-Badge. Die Aktionen `Transkribieren` und `Erneut versuchen` erscheinen hier bereits an der richtigen Stelle, sind aber bis Ticket 05 deaktiviert und sagen das. Demo-Fixtures enthalten ein Reel mit Transkript.

**Blocked by:** 02 — Statusmodell (die Ansicht zeigt alle Status)

**Status:** ready-for-agent

- [ ] Reel-Ansicht aus Discover, Briefing und Creator-Detailseite erreichbar, eine Komponente für alle drei
- [ ] Alle sechs Zustände des Transkriptbereichs rendern unterscheidbar; Fehlerzustand zeigt die gespeicherte Ursache
- [ ] Zeitmarken erscheinen, wenn Segmente vorliegen, sonst der Fließtext
- [ ] Status-Badge an Karte und Zeilen
- [ ] Demo-Modus zeigt ein Reel mit Transkript ohne Credentials
- [ ] Von Hand geprüft nach RUNBOOK: jeder Zustand einmal, im Kommentar abgehakt
- [ ] CONTEXT.md: Begriff "Reel-Ansicht"

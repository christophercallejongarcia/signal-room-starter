# 22 — Ideen-Pipeline mit Produktionsstufen

**What to build:** Bei zehn offenen Ideas sieht Chris auf einen Blick, welche wartet und welche hängt. Der Idea-Status wird von vier auf sechs Produktionsstufen erweitert: erfasst, in Entwicklung, im Packaging, im Skript, in Produktion, veröffentlicht; `dropped` bleibt als Abbruch daneben. Über der Ideen-Liste steht eine Zählerleiste mit der Anzahl je Stufe, und eine Idea lässt sich von Hand weiterschieben. Bestehende Ideas werden ohne Datenverlust auf die neuen Stufen abgebildet.

**Blocked by:** 08 — Ideas: Capture und Develop

**Status:** ready-for-human

- [x] Sechs Produktionsstufen plus `dropped`, erlaubte Übergänge an einer Stelle definiert
- [x] Zählerleiste im Ideas-Tab zeigt je Stufe die Anzahl und filtert die Liste beim Klick
- [x] Eine Idea lässt sich von Hand auf die nächste Stufe schieben; ein verbotener Übergang wird abgelehnt, nicht still ignoriert
- [x] Bestehende Ideas behalten ihre Daten und landen auf der passenden neuen Stufe
- [x] Test: jeder erlaubte Übergang und mindestens ein verbotener

## Comments

**2026-08-29, Umsetzung (unbeaufsichtigter Batch)**

Stufen: `IdeaStage` in `lib/contracts.ts` (`captured`, `developing`, `packaging`, `scripting`, `producing`, `published`), `IdeaStatus` = Stufe oder `dropped`. Reihenfolge als `IDEA_STAGES` in `lib/ideas.ts`; `canTransition` ist die einzige Stelle für die Regeln: eine Stufe weiter, nie zurück, nie überspringen, jede Stufe vor `published` kann `dropped` werden, `developing -> developing` ist ein zweiter Develop-Lauf, `published` und `dropped` sind final. Der Develop-Lauf setzt jetzt `developing` (vorher `developed`); ab `packaging` ist "Develop again" gesperrt, weil das Storyboard dann in Packaging steckt.

Weiterschieben: `moveIdea`/`advanceIdea` (rein), Port `StorageAdapter.moveIdea`, Convex-Mutation `ideas.move`, Datei-Store analog, Route `PATCH /api/ideas` mit `parseIdeaMove` (400 bei kaputtem Body, 404 bei unbekannter Idea, 409 mit Grund bei verbotenem Übergang). UI: Pfeil-Knopf mit dem Namen der nächsten Stufe, Papierkorb für `dropped`; ein abgelehnter Übergang landet in der Fehlerbox der Liste.

Zählerleiste: `countByStage` liefert alle sieben Zähler, auch die leeren; `.stage-bar` über der Liste, Klick filtert, zweiter Klick hebt den Filter auf, leerer Filter sagt das.

Migration: `legacyStage` (`developed -> developing`, `produced -> producing`, sonst durchreichen). Convex: Schema temporär um die alten Literale verbreitert (`--typecheck=disable`), `npx convex run ideas:migrateStages` (7 gesehen, 4 verschoben, alle anderen Felder unangetastet), Schema gestrafft und mit Typecheck deployed. Die Mutation bleibt idempotent im Code, mit Anleitung im Kommentar. Datei-Store mappt beim Laden.

Tests: `tests/ideas.test.mjs` +10 (alle Vorwärts-Übergänge per Schleife, drop von jeder Stufe, Überspringen und Zurück verboten, Advance bis zum Ende, verbotener Zug wird mit Namen abgelehnt, Zählerleiste, Legacy-Mapping, Body-Parser); Suite 252 grün, Typecheck und Build sauber. Live gegen Convex geprüft: `captured -> scripting` abgelehnt, `captured -> developing` geschrieben, `developing -> captured` abgelehnt; die Test-Idea danach wieder auf `captured` gesetzt. Doku: CONTEXT.md (Begriff "Produktionsstufe"), docs/ARCHITECTURE.md.

Annahmen, ohne Rückfrage entschieden:
- `developed` landet auf `developing` (Storyboard da, Idea noch in Entwicklung), `produced` auf `producing` statt `published`, weil "produziert" nicht "veröffentlicht" heißt. Es gab keine `produced`-Zeile, die Frage war also nur für den Datei-Store relevant.
- Ein Drop-Knopf ist dazugekommen, obwohl das Ticket ihn nicht nennt: die Zählerleiste zeigt `dropped`, ohne Knopf wäre die Stufe unerreichbar (offen seit Ticket 08).
- Von Hand `captured -> developing` ohne Develop-Lauf ist erlaubt; die Stufe heißt "in Entwicklung", nicht "hat Storyboard".
- Nicht angefasst: die Demo-Spalten "Long form"/"Short form" (Ticket 17).

**2026-08-29, Review-Fixes**

Standards- und Spec-Review parallel gelaufen, Befunde abgearbeitet:

- Ein verbotener Zug warf in Convex ein plain `Error`; auf einem Prod-Deployment redigiert Convex das zu "Server Error", der Grund wäre nie in der UI angekommen. Jetzt `ForbiddenMoveError` in `lib/ideas.ts`, in der Mutation `ideas.move` als `ConvexError { kind: "forbidden-move" }` geworfen, im Convex-Adapter zurück in `ForbiddenMoveError` übersetzt. Die Route antwortet 409 nur dafür, ein kaputter Store ist 500 statt wie ein verbotener Zug auszusehen. Gegen das Dev-Deployment über den Adapter geprüft.
- `advanceIdea` hatte keinen Aufrufer. Entfernt; UI und Test gehen über `nextStage` plus `moveIdea`.
- Die By-Id-Suche samt `_id`/`_creationTime`-Abstreifen stand viermal in `convex/ideas.ts`. Jetzt ein `findIdea`-Helfer.
- Die Zählerleiste baute `[...IDEA_STAGES, "dropped"]` selbst nach. `IDEA_STATUSES` ist jetzt exportiert und die einzige Quelle.
- `countByStage` hätte bei einem unbekannten Status im Datei-Store `NaN` gezählt. Unbekannte Status werden nicht gezählt, Test dafür.
- Spec-Einleitung "welche wartet und welche hängt": die Meta-Zeile zeigt jetzt "packaging since 29 Aug 2026", also seit wann die Idea auf ihrer Stufe steht (bei captured nur das Erfassungsdatum).

Bewusst gelassen: der Drop-Knopf bleibt (Begründung oben). Der Datei-Store mappt alte Status beim Laden und schreibt sie erst beim nächsten Save zurück; das reicht für einen Fallback (ADR-0005). Route und Zählerleiste haben keine eigenen Tests, ihre Logik (`parseIdeaMove`, `countByStage`, `canTransition`) ist abgedeckt. Suite 252 grün, Typecheck und Build sauber.

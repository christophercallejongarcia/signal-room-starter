# 08 — Ideas: Capture und Develop

**What to build:** Ideen werden gespeichert und ausgearbeitet. "Capture idea" legt eine Idee (Arbeitstitel, Ziel, optional Quell-Reel) in Convex ab, die Liste zeigt alle Ideen mit Status. "Develop idea" schickt Idee plus Evidenz an den Codex-Bridge und bekommt ein Short-Form-Storyboard zurück: Hook (erste 3 Sekunden), drei Beats, CTA, Caption-Vorschlag, was der Zuschauer mitnimmt. Das Storyboard hängt an der Idee und ist jederzeit wieder aufrufbar.

**Blocked by:** 07 — Strategy-Provider über Codex SDK mit echter Evidenz

**Status:** done

- [x] Tabelle `ideas` in Convex mit Status (captured, developed, produced, dropped)
- [x] Capture aus dem Ideas-Formular und aus einer Discover-Karte ("Create idea" mit Quell-Reel)
- [x] Develop erzeugt Storyboard über den Bridge und speichert es an der Idee
- [x] Ideen-Liste zeigt Status, Datum, Quell-Reel, Storyboard aufklappbar
- [x] Mehrere Develop-Läufe hintereinander kollidieren nicht
- [x] Test: Storyboard-Schema-Validierung, Idee-Statusübergänge

## Comments

**2026-08-25, Umsetzung**

Tabelle `ideas` in `convex/schema.ts` auf `id`, `status`, `sourceSignalId`, `sourceCreator`, `storyboard` (typisiert statt `v.any()`), `developRunId`, `developedAt`, `evidenceCount`, `createdAt`, `updatedAt` erweitert, mit Index `by_external_id` und `by_createdAt`. `convex/ideas.ts` liefert `list`, `get`, `upsert`, `claimDevelop`, `settleDevelop`. Beide Storage-Adapter (Convex und Datei-Store) haben die neuen Port-Methoden, damit der Fallback nicht auseinanderläuft.

Die Statuslogik liegt als reine Funktionen in `lib/ideas.ts` (`newIdea`, `canTransition`, `withStatus`, `claimDevelop`, `applyStoryboard`, `releaseDevelop`, `parseStoryboard`) und wird von Convex und Datei-Store gemeinsam benutzt. Erlaubte Übergänge: captured -> developed/dropped, developed -> developed/produced/dropped, produced -> dropped, dropped ist final.

Kollisionsschutz: jeder Develop-Lauf bekommt eine Run-Id und setzt sie als `developRunId` auf die Idea. Ein zweiter Lauf überschreibt den Anspruch, das Ergebnis des ersten wird verworfen (`{ stale: true }`), statt das neuere Storyboard zu überschreiben. Live geprüft mit zwei gleichzeitigen Läufen auf derselben Idea: Lauf A stale, Lauf B geschrieben.

Bridge: neue Route `POST /v1/storyboard` mit `validateStoryboardRequest`, `storyboardOutputSchema` und `buildStoryboardPrompt`. Beide Routen teilen sich Preamble, Vokabular und Fehlerbehandlung. Der Develop-Lauf geht über `POST /api/ideas/develop` serverseitig, damit Anspruch und Bridge-Aufruf an einer Stelle liegen.

Capture aus dem Ideas-Formular und aus einer Karte in Discover und Briefing; die Karte hängt Quell-Signal und Creator-Handle an. Die Ideen-Liste zeigt Datum, Quell-Creator, Evidenz-Anzahl, Status und das Storyboard aufklappbar. Zeilenumbrüche in der Caption bleiben erhalten (`boundedText`), alle anderen Felder bleiben einzeilig.

Tests: `tests/ideas.test.mjs` (22) für Statusübergänge, Anspruch, veraltete Läufe und Storyboard-Validierung, `tests/bridge-storyboard.test.mjs` (9) für den Bridge-Vertrag. Vollständige Suite grün, Typecheck und Build sauber. End-to-End gegen den echten Korpus geprüft: 10 Outlier-Reels als Evidenz, deutsches Storyboard mit korrekten Umlauten.

Nicht angefasst: die Demo-Spalten "Long form" und "Short form" im Ideas-Tab bleiben stehen, die gehören zu Ticket 17 (Clean-Room-Grenze). Löschen von Ideen ist nicht Teil des Tickets, `dropped` ist im Modell da, hat aber noch keinen Knopf.

**2026-08-25, Review-Fixes**

Standards- und Spec-Review parallel gelaufen, beide Befunde abgearbeitet.

- Quell-Reel war nur als `sourceSignalId` gespeichert, aber nirgends sichtbar. Ideas tragen jetzt zusätzlich `sourceUrl`, die Karte hängt den Link an, die Liste zeigt "Source reel @handle" als Link. Nur `https` wird übernommen, `javascript:` und `http:` fallen raus (Test dafür in `tests/ideas.test.mjs`).
- `convex/ideas.ts` hatte die Claim- und Settle-Regeln ein zweites Mal ausgeschrieben. Die Mutationen rufen jetzt `claimDevelop`, `applyStoryboard` und `releaseDevelop` aus `lib/ideas.ts` auf und schreiben das Ergebnis mit `db.replace`. Die Mutationen heißen jetzt `claim` und `settle`.
- Bridge-URL lag doppelt im Code. Sie steht jetzt als `STRATEGY_BRIDGE_URL` in `lib/config.ts`, Browser und Server-Route lesen dieselbe Konstante.
- `validateStrategyRequest` war nur noch eine Weiterleitung auf `validateEvidencePacket`. Zusammengelegt.
- `getIdea` (Port und beide Adapter, Convex-`get`) und `withStatus` hatten keinen Aufrufer. Entfernt, die Statusübergänge werden über `canTransition` und `claimDevelop` getestet.
- `{title, goal, sourceSignalId, sourceCreator}` war dreimal deklariert. Jetzt gibt es nur `IdeaInput` aus `lib/ideas.ts`; die Capture-Route nimmt `Partial<IdeaInput>` und braucht keinen Cast mehr.
- `IdeasState.developing` benutzte `""` als "keiner", jetzt `string | null`. `formatStarted` heißt `formatStamp`, weil es auch Endzeiten formatiert.
- ADR-0004 nachgezogen: der Bridge-Vertrag hat jetzt zwei Routen, und der Storyboard-Lauf geht über die Server-Route.

Bekannte Grenzen, bewusst so gelassen:

- Der Datei-Store serialisiert Schreibzugriffe nur innerhalb eines Prozesses. Zwei Next.js-Worker auf derselben `data/store.json` können sich den Develop-Anspruch gegenseitig überschreiben. In Convex ist der Anspruch transaktional. Kommentar dazu steht in `lib/adapters/storage/file.ts`, die Einordnung in ADR-0005.
- Das Evidenzpaket kommt aus dem ganzen Korpus. Eine Idea, die aus einem bestimmten Reel gefangen wurde, kann gegen Evidenz entwickelt werden, in der genau dieses Reel nicht vorkommt. Das Ticket verlangt es nicht, wäre aber ein sinnvoller Folgeschritt.
- Die Capture- und Develop-Routen selbst haben keine eigenen Tests; die Logik dahinter (`newIdea`, `parseStoryboard`, Anspruch und veraltete Läufe) ist in `tests/ideas.test.mjs` abgedeckt.

Nebenbefund ohne Bezug zum Ticket: `npm run diagrams` läuft nicht mehr, weil `@mermaid-js/mermaid-cli@11.16.0` auf `puppeteer-core@25.9.0` zeigt und diese Version nicht mehr auflösbar ist.

# 11 — Tägliches Briefing

**What to build:** Nach jedem Refresh entsteht ein Briefing: die zehn stärksten Signale der letzten 24 Stunden (neue Reels, gewichtet nach Outlier und Velocity), je mit Creator, Cover, Kennzahlen und einem "Chris angle" (ein Satz vom Codex-Bridge, wie Chris das Thema für sein Publikum drehen würde). Der Briefing-Tab zeigt Datum, Anzahl Quellen und die Liste; "Create idea" übernimmt ein Signal direkt als Idee.

**Blocked by:** 05 — Delta-Refresh mit Run-Log; 07 — Strategy-Provider über Codex SDK mit echter Evidenz

**Status:** done

- [x] Tabelle `briefings` in Convex, ein Eintrag pro Tag, idempotent bei mehrfachem Refresh
- [x] Ranking-Funktion (Outlier × Frische) als reine Funktion mit Test
- [x] "Chris angle" pro Signal, Ausfall des Bridge lässt das Briefing ohne Angle entstehen
- [x] Briefing-Tab zeigt das aktuelle Briefing, ältere wählbar
- [x] "Create idea" aus dem Briefing legt eine Idee mit Quell-Reel an (nutzt 08, falls vorhanden, sonst Stub)

## Comments

**Umgesetzt (unbeaufsichtigter Batch, 2026-08-26)**

- `lib/briefing.ts` hält die reine Rechnung: `briefingFreshness`, `briefingScore` (Outlier × Frische), `selectBriefingSignals`, `buildBriefing`, `applyAngles`, `briefingId` und `composeBriefing`. 17 Tests in `tests/briefing.test.mjs`, vier weitere für den Bridge-Vertrag in `tests/bridge-briefing.test.mjs`.
- `lib/briefing-run.ts` ist der Lauf: Korpus lesen, Cover über `withCoverUrls` anhängen, Briefing bauen, Bridge auf `/v1/briefing` nach den Angles fragen, Dokument schreiben. Ein Bridge-Ausfall wird dort gefangen und kostet nur die Angles.
- Tabelle `briefings` in Convex (`convex/schema.ts`, `convex/briefings.ts`) mit `by_external_id` und `by_day`, dazu `listBriefings`/`saveBriefing` in beiden Storage-Adaptern.
- `POST /api/refresh` läuft den Pass nach jeder Sammlung, `GET`/`POST /api/briefings` sind Lesen und manueller Lauf. Der Briefing-Tab rendert das Dokument mit Cover, Kennzahlen und Angle, Day-Picker für ältere Tage, "Create idea" nimmt Quell-Reel und Angle mit.

**Entscheidungen, die im Batch ohne Rückfrage getroffen wurden**

- **Frische mit Boden statt roher Velocity.** Das Ticket nennt Velocity, die Checkbox nennt Outlier × Frische. `RankedSignal.velocity` ist Plays pro Stunde und skaliert mit der Reichweite des Creators, würde also große Accounts nach oben ziehen — genau das, wogegen der Outlier gebaut ist. Gewählt: Frische fällt linear von 1 auf `BRIEFING_FRESHNESS_FLOOR` (0.5) am Fensterrand. Der Boden ist die eigentliche Entscheidung: ein Reel am Rand braucht genau den doppelten Outlier, um gegen ein eben erschienenes zu gewinnen, die Frische löst also nur nahe Gleichstände auf. Die rohe Velocity steht trotzdem in jedem Item, sichtbar und später ausbaubar.
- **Angles positionsweise statt über Titel-Matching.** Das Antwort-Schema wird aus der Paketgröße gebaut (`briefingOutputSchema(count)`), die Antwort ist eine Liste von Sätzen in der Reihenfolge der Items. Der Hooks-Board matcht über Titel, weil dort eine Variante frei aus dem Paket zitiert; hier gehört genau ein Angle zu genau einem Reel, und die Position ist eindeutig auch bei doppelten Titeln.
- **Kurzform statt strikt `format: "reel"`.** Ausgeschlossen werden `post` und `long`; ein Signal ohne deklariertes Format bleibt drin. Der echte Instagram-Korpus trägt immer ein Format, das ist dort also exakt "Reels und Shorts" — aber die Demo-Fixtures tragen keines, und ohne diese Lesart wäre der Tab im Demo-Modus leer (AGENTS.md, nicht verhandelbare Grenze).
- **Zwei Demo-Fixture-Daten verschoben** (`signal-briefs`, `signal-agents`) auf den 22. August, damit sie im 24-Stunden-Fenster vor `DEMO_NOW` liegen. Ohne das rendert der Briefing-Tab ohne Store nur den Leerzustand. Ein Test hält das fest.
- **Cover zur Kompositionszeit angehängt.** `coverUrl` steht nicht im Korpus, sondern kommt beim Lesen von der Platte. Das Dokument friert also den Stand der Cache-Datei zum Zeitpunkt des Laufs ein; ein Cover, das später ankommt, erscheint erst im Briefing des nächsten Tages.
- **`POST /api/briefings` als manueller Lauf**, aus demselben Grund wie beim Format-Review: der Datei-Store hat keinen Zeitplan (ADR-0005).
- **Kein eigener Cron.** Das Ticket sagt "nach jedem Refresh"; der Zeitplan gehört zu Ticket 06. Ein Convex-Cron käme ohnehin nicht an den Bridge heran.

**Verifiziert**

- `npm run check` grün (198 Tests), `npx tsc --noEmit -p convex/tsconfig.json` grün.
- `npx convex dev --once` deployt Schema und Funktionen. Gegen den echten Korpus (9 Creators, 1093 Signale) durchgelaufen: Ranking, Angles und Speichern geprüft, dabei das Fenster vorübergehend auf 72 Stunden gestellt, weil der letzte Refresh vom 24. August stammt und im 24-Stunden-Fenster nichts liegt. Ergebnis: 10 Items, 8 Quellen, 12 Kandidaten, alle zehn Angles auf Deutsch und auf Chris' Positionierung. Danach zurück auf 24 Stunden und dasselbe Dokument überschrieben, es bleibt bei einer Zeile in `briefings`.
- Der Ausfallpfad wurde unfreiwillig live bewiesen: der erste Lauf lief gegen einen alten Bridge-Prozess ohne `/v1/briefing`, das Briefing entstand vollständig mit `angles: false`.
- Im Browser geprüft: gefüllte Liste mit Covern, Leerzustand, "Create idea" legt die Idee mit `sourceSignalId`, `sourceCreator`, `sourceUrl` und dem Angle als Ziel an.

**Code-Review (zwei parallele Agenten, Standards und Spec) und was daraus geändert wurde**

Spec-Achse:

- **Bug: die Angles konnten auf das falsche Reel rutschen.** `validateStrategyRequest` im Bridge siebt Evidenz-Einträge ohne Titel raus und schneidet bei `MAX_EVIDENCE` (12) ab, *bevor* das Antwort-Schema aus der Paketgröße gebaut wird. Fällt dabei ein Eintrag aus der Mitte, ist die Antwort kürzer als die Item-Liste, und jeder Angle danach hängt an einem Reel, für das er nicht geschrieben wurde — still, ohne Fehler. `applyAngles` verlangt jetzt genau einen Eintrag je Item und lehnt sonst die ganze Antwort ab: ein Briefing ohne Angles ist besser als eins mit den falschen. Zwei Tests dazu, dazu einer, der zeigt, dass ein einzelner leerer Angle in einer vollständigen Liste nur dieses eine Item nackt lässt.
- **Velocity gegen Frische** wurde als Abweichung gemeldet. Das ist die oben protokollierte Entscheidung; sie steht jetzt auch in `docs/SPEC.md` T6.2 mit der Begründung, statt nur als umgeschriebene Zeile.
- Als Scope-Creep markiert: `POST /api/briefings` samt Knopf, das Demo-Briefing, das Feld `candidates` und der Angle als Ziel der Idee. Bewusst behalten: der manuelle Lauf ist der einzige Weg im Datei-Store (ADR-0005, genau wie beim Format-Review), und das Demo-Briefing hält die nicht verhandelbare Demo-Grenze aus AGENTS.md.

Standards-Achse:

- **`docs/SECURITY.md` kannte den neuen Bridge-Kanal nicht.** Die Definition of Done in AGENTS.md verlangt, dass die Dokumentation die Vertrauensgrenze erklärt; `/v1/hooks` hat dort einen eigenen Absatz, `/v1/briefing` hatte keinen. Jetzt steht dort, dass das Paket keinen neuen Eingabekanal öffnet und wo der positionelle Vertrag auf dem Rückweg abgesichert ist.
- **Middle Man `composeBriefing`** entfernt: anders als sein Vorbild `reviewCorpus` hat es nur zwei Argumente umsortiert und hatte einen Aufrufer. `runBriefing` ruft `buildBriefing` direkt.
- **Toter Typ `BriefingRequest`** gelöscht (nirgends importiert, der Bridge ist `.mjs` und prüft strukturell). Der ungenutzte `now`-Parameter von `runBriefing` ist weg.
- `POST /api/briefings` antwortet 200 statt 201, wie das benachbarte `POST /api/format-reviews`: das Tagesdokument wird überschrieben, nicht je Aufruf angelegt. Dazu ein `{state.error && state.error}` entschärft.
- Nicht geändert: `validateBriefingRequest` bleibt als benannter Einstieg für `/v1/briefing`, auch wenn es an `validateStrategyRequest` durchreicht — die Route-Tabelle liest so, und der Test benennt den Vertrag. Ebenfalls nicht geändert: die gemeldete Score-Basis im Demo-Modus. Der Demo-Scorer rechnet `outlier` als `views / audience`, der echte als `plays ?? views / audience`, und Demo-Records tragen kein `plays` — die Zahl unter einem Demo-Briefing ist also dieselbe, die der echte Scorer liefern würde. Outlier, Plays und Alter stehen ohnehin in jeder Zeile.

Danach: 199 Tests grün, `npm run check` grün, Convex-Typecheck grün, gegen den echten Korpus erneut durchgelaufen (10 Items, 10 Angles), Fenster wieder auf 24 Stunden, eine Zeile in `briefings`.

**Offen gelassen**

Beim Prüfen von "Create idea" ist eine echte Idee aus einem echten Reel im Dev-Deployment gelandet (`Kommentiere „CODES“…`). Es gibt keinen Lösch-Pfad für Ideen — weder Route noch Mutation — und einen zu bauen wäre außerhalb dieses Tickets. Die Zeile steht also noch in `ideas`.

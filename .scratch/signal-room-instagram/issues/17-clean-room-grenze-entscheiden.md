# 17 — Clean-Room-Grenze: privat oder öffentlich entscheiden

**What to build:** README, AGENTS.md und SECURITY.md versprechen einen Clean-Room-Starter ohne echte Watchlist, echte Screenshots, Provider-IDs oder persönliche Strategie. Im Tree liegen inzwischen: Screenshots mit echten Gesichtern, Handles, Captions und Zahlen (`docs/assets/discover-live.png`, `discover-outliers.png`, `shot-*.png`), die Spec mit realen Referenz-Accounts und Frame-Pfaden, hart kodierte Actor-IDs im Connector, UI-Fixtures aus echter Titel-Historie. Entweder wird das Repo ausdrücklich ein privates Produkt (dann Doku-Versprechen streichen), oder das Material wird in ein ignoriertes Overlay verschoben und die Screenshots aus `lib/demo-data.ts` neu erzeugt. Eine Entscheidung braucht Chris.

Quelle: Codex-Review SR-006 (`reviews/review-20260824-165924-b94c73.md`).

**Blocked by:** None — Entscheidung durch Chris nötig, bevor ein Agent arbeitet.

**Status:** done

- [x] Entscheidung dokumentiert: **privat**. ADR-0006, Versprechen aus README, AGENTS.md und SECURITY.md entfernt.
- [~] Bei "öffentlich": entfällt.
- [x] Git-History trotzdem geprüft, weil die Antwort die Entscheidung tragen musste. Ergebnis unten.
- [x] Bei "privat": Release-Checkliste in `docs/SECURITY.md` als nicht zutreffend markiert, Wurzel-`SECURITY.md` verweist darauf.

## Comments

**2026-08-26, Entscheidung: privat**

Vor der Entscheidung geprüft, was tatsächlich draußen liegt, weil das Ticket von einem Leck ausging, das es nicht gibt.

Öffentlich ist `github.com/earlyaidopters/signal-room-starter` bei Commit `37deeb0`, drei Commits: Demo-Daten, Contracts, Bridge, Doku, Diagramme. Kein Convex, kein Connector, keine echten Handles. Der lokale `main` ist zwölf Commits voraus und enthält das Produkt.

Nichts ist ausgetreten. Die fünf Live-Screenshots stecken nur in zwei lokalen WIP-Checkpoints (`8b52c24`, `d02907b`), die auf keinem Remote-Branch erreichbar sind; im Arbeitsverzeichnis sind sie untracked. `.scratch/`, `data/store.json`, `data/covers`, `.env.local` und `reviews/` sind gitignored, Watchlist und Korpus waren nie in Git. Die Handles in `lib/demo-data.ts` sind erfunden. Kein Convex-Deployment-Name, kein Apify-Token in getrackten Dateien.

Das Ticket nennt zwei Dateien nicht, die der eigentliche Bruch gewesen wären: `docs/SPEC.md` mit echten Referenz-Accounts und dem Verweis auf ein fremdes privates System, und `CONTEXT.md`, das auf eine bestimmte Nische geschrieben ist. Beide sind getrackt und waren noch nicht öffentlich. Unter "privat" dürfen sie bleiben.

Entscheidung ist "privat": das Repo ist ein privates Produkt, das öffentliche bleibt bei `37deeb0` stehen und hält sein Versprechen weiter, weil nichts von hier dorthin geht.

Umgesetzt: ADR-0006 angelegt und indiziert. README neu eingeleitet (kein Clean-Room-Anspruch mehr, Hinweis auf ADR-0006, Abschnitt "The public-private boundary" auf das umgeschrieben, was jetzt tatsächlich draußen bleibt). AGENTS.md: erste Zeile korrigiert, die drei nicht mehr zutreffenden Boundaries durch die ersetzt, die weiter gelten (keine Secrets, `data/` bleibt ignoriert, Demo-Modus bleibt lauffähig). Wurzel-`SECURITY.md` und `docs/SECURITY.md`: Release-Checkliste als nicht zutreffend markiert, Text bleibt für einen späteren Cherry-Pick stehen.

Scharfe Kante entschärft: `origin` zeigt weiter auf das öffentliche Repo, ein `git push` hätte das ganze Produkt veröffentlicht. Die Push-URL von `origin` ist jetzt auf `DISABLED-private-repo-see-ADR-0006` gesetzt, ein Push schlägt laut fehl. Fetch geht weiter. Rückgängig mit `git remote set-url --push origin https://github.com/earlyaidopters/signal-room-starter.git`.

Offen für Chris: ein privates Remote anlegen und als `origin` eintragen. Solange das nicht passiert ist, liegt das Produkt nur lokal.

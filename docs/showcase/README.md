# Öffentliches Schaufenster

Dieses Repo bleibt privat und ist die Quelle der Wahrheit (ADR-0006). Öffentlich gezeigt wird nur ein Schaufenster: ein eigenes Repo mit einem einzigen Commit ohne Historie, gebaut aus dem Arbeitsstand von `main`. Die Historie hier wird dafür nie umgeschrieben.

## Export bauen

Ziel ist ein Ordner außerhalb des Repos, zum Beispiel `../signal-room-public-export/`.

1. `git archive main | tar -x -C <ziel>`. Damit kommen nur getrackte Dateien mit, nichts aus `.env.local`, `data/` oder dem Cover-Cache.
2. Im Ziel löschen: `.scratch/`, `reviews/`, `data/`.
3. Lokale Pfade (`/Users/...`) und den Namen des Convex-Deployments schwärzen. `grep -rn '/Users/' .` muss leer sein. Der Deployment-Name steht in `.env.local` unter `CONVEX_DEPLOYMENT` und darf im Export nicht vorkommen, weil die öffentlichen Convex-Queries und -Mutations ohne Login aufrufbar sind. Wer die Deployment-URL kennt, kann lesen und schreiben.
4. README für das Schaufenster schreiben (Deutsch, Hinweis "Portfolio-Stand, kein Starter"), Showcase-Bilder nach `docs/showcase/` im Export.
5. `gitleaks dir .` im Export, muss sauber sein. Danach `git init`, ein Commit, `gitleaks git .`.
6. Frisch klonen, `cp .env.example .env.local`, `npm ci`, `npm run check`.
7. Remote und Veröffentlichung erst nach Freigabe durch Chris.

## Screenshots

Screenshots mit echten Gesichtern, fremden Creatorn oder Covern liegen nicht im Repo, sondern unter `~/Documents/signal-room-private/screenshots/` mit gleicher Ordnerstruktur. `.gitignore` blockt Aufnahmen im Repo-Root, Bildschirmfotos, Videos und Rohmaterial.

Showcase-Bilder für das Schaufenster werden aus der laufenden App aufgenommen. Vor dem Screenshot bekommen alle `img`, `video`, `canvas` und Hintergrundbilder per injiziertem CSS `filter: blur(24px)`. Gesichter und Cover sind damit unkenntlich, Titel, Handles und Zahlen bleiben als Text scharf. Jedes Bild wird vor dem Export einzeln angesehen.

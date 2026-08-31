# 26 — Nur Reels im Korpus: Posts-Stream abschalten, Bestand bereinigen

**What to build:** Signal Room liest nur Reels. Bild- und Karussell-Posts haben keine Plays, verzerren jede Kennzahl und interessieren Chris nicht. Heute ruft `collectForCreator` je Creator zwei Actor-Läufe auf (`resultsType: "reels"` und `"posts"`) und speichert beides; der Posts-Stream existiert, weil er auch Bildbeiträge liefert, die niemand braucht. Künftig läuft nur noch der Reels-Stream (halbiert die Apify-Kosten pro Creator und pro Sweep), `format: "post"` wird nicht mehr gespeichert, und die 104 bereits gespeicherten Posts (65 bei `@aiagentgeorg`, 39 bei anderen) verschwinden aus allen Ansichten. Sichtbare Folge: Tracked Channels zeigt für Georg "27 videos · <echter Median>" statt "92 videos · 0 median", Discover zeigt keine "0 plays · 0.0x"-Karten mehr, Outliers findet ihn wieder.

Quelle: Nachgang zu Ticket 25, Chris am 2026-08-30: "Für mich sind nur die Reels wichtig."

**Befund:**

- `lib/adapters/sources/apify-instagram.ts`, `collectForCreator`: `streams = ["reels", "posts"]`, beide Ergebnisse werden per shortCode gemerged. `mapPost` setzt `format: isVideo ? "reel" : "post"`.
- Ein Video, das als Feed-Beitrag statt als Reel hochgeladen wurde, würde im Reels-Stream fehlen. Instagram führt seit 2023 jedes Video als Reel; das Risiko ist gering und wird im Test abgedeckt (Fixture mit `isVideo: true` aus dem Posts-Stream darf nicht mehr vorkommen, weil der Stream nicht mehr läuft).
- `components/signal-room.tsx`, Tracked Channels: Median über `plays ?? views` aller Signale des Creators, Posts liefern 0. `lib/briefing.ts` filtert Posts schon raus, `format-signals.ts` und `format-review.ts` auch. Discover, Tracked Channels und die Slate-Quelle nicht.
- Kosten: `runBackfill` bucht heute `unreported: 2` bei Fehlern und jeder Sweep zählt zwei Läufe pro Creator. Mit einem Stream wird das eins (Ticket 18, Kosten-Guard, rechnet mit dieser Zahl).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `collectForCreator` ruft nur `resultsType: "reels"` auf; Fehlertext, `usage` und die "beide Streams"-Kommentare/Docs (CONTEXT.md Zeile "je Actor-Lauf (Reels, Posts)") entsprechend angepasst
- [ ] `mapPost` verwirft Items mit `isVideo: false` statt sie als `format: "post"` zu speichern
- [ ] Bestandsbereinigung: einmaliger Convex-Lauf löscht alle Signale mit `format: "post"` (Zahl vorher/nachher im Run-Log), oder das Storage-Read filtert sie dauerhaft; Entscheidung im Ticket dokumentieren
- [ ] Tracked Channels: Korpus-Zähler und Median rechnen nur über Reels
- [ ] Discover, Outliers, Saved und Slate-Quelle zeigen keine Posts mehr
- [ ] Kosten-Guard (18) und Run-Usage rechnen mit einem Lauf pro Creator statt zwei
- [ ] Test: Posts-Stream wird nicht mehr aufgerufen (ActorRunner-Spy), ein `isVideo: false`-Item landet nicht im Ergebnis
- [ ] Test: Median in Tracked Channels ignoriert verbliebene Posts
- [ ] Docs: CONTEXT.md und SPEC.md sagen "Reels", nicht "Beiträge"

# 03 — Automatische Auswahl nach kombiniertem Score

**What to build:** Der Delta-Refresh wählt die Reels für den Transkript-Actor nach dem kombinierten Score des Outlier-Scorers (Outlier, Channel-Relative, Velocity) statt nach dem nackten Outlier-Faktor. Die Schwelle heißt `TRANSCRIPT_SCORE_THRESHOLD`, kommt aus der Umgebung und ist so vorbelegt, dass ein Reel mit Outlier 2 ohne weitere Boosts gerade darüber liegt. Stärkste zuerst, Limit wie bisher. Die Gewichtung des Scores selbst bleibt unverändert.

**Blocked by:** 02 — Statusmodell (die Auswahl muss `pending` und `failed` kennen)

**Status:** ready-for-agent

- [ ] Batch-Auswahl liest den Score des Outlier-Scorers; Reels ohne Creator oder ohne URL bleiben außen vor
- [ ] `TRANSCRIPT_SCORE_THRESHOLD` in der Konfiguration, per Umgebung überschreibbar, in `.env.example` dokumentiert; wirkt auch in der Convex-Umgebung
- [ ] Tests: Schwelle über den Score, Sortierung, Limit (Vorbild `tests/transcripts.test.mjs`)
- [ ] CONTEXT.md: "Transkript" beschreibt die Auswahl über den Score

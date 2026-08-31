# 20 — Reel-Transkripte im Korpus

**What to build:** Der Korpus hält nicht nur die Caption, sondern auch, was im Reel gesagt wird. Für jedes Reel über der Schwelle wird einmalig ein Transkript erzeugt und am Signal gespeichert. Der Lauf ist idempotent: Ein zweiter Durchgang holt nichts erneut, und Reels ohne verwertbare Tonspur werden als solche markiert statt in jedem Lauf neu versucht. Hooks-Board und Format Signals lesen den Transkript-Text, wenn er vorliegt, und fallen sonst auf die Caption zurück. Damit werden Hook-Belege aus dem gesprochenen Einstieg gezogen und nicht mehr nur aus der ersten Caption-Zeile, die bei Reels oft leer oder ein Emoji-Satz ist.

**Blocked by:** 18 — Kosten-Guard für Apify-Läufe (der Transkript-Lauf muss unter dasselbe Budget und in denselben Run)

**Status:** done

- [x] Reels über der Schwelle bekommen einmalig ein Transkript, gespeichert am Signal
- [x] Zweiter Lauf holt kein vorhandenes Transkript erneut; Reels ohne verwertbare Tonspur werden markiert und übersprungen
- [x] Der Transkript-Lauf zählt seine Kosten in den Run und respektiert das Limit aus 18
- [x] Hook-Erkennung nutzt das Transkript, wenn vorhanden, sonst die Caption; das Verhalten ist an einer Stelle entschieden, nicht pro Aufrufer
- [x] Test: Auswahl-Prädikat (welche Reels bekommen ein Transkript) und Rückfall auf die Caption

## Comments

**2026-08-29, umgesetzt (unbeaufsichtigter Batch, Branch `afk/batch-20260829-2106`)**

Annahmen, weil niemand fragen konnte:

- Transkript-Quelle ist der Apify-Actor `apple_yang/instagram-transcripts-scraper` (Store-Suche: meiste Nutzer im Monat, Bewertung 4,3, Pay-per-Event ab 0,001 $ je Ergebnis plus 0,0035 $ je Audio-Minute, `bulkUrls`-Eingabe). So läuft der Transkript-Lauf über denselben `runActor`, dieselbe Nutzungs-Auslesung aus dem Run-Objekt und denselben `APIFY_TOKEN` wie die Sammlung, lokal und im Convex-Cron. Der Actor dokumentiert kein Output-Schema; `readTranscriptItems` liest deshalb tolerant: Shortcode aus jedem URL-Feld oder `shortCode`/`shortcode`/`code`, Text aus `transcript`/`text`/`transcription` oder aus `segments[].text`. Nicht live getestet (kein Token im Batch); der nächste echte Refresh ist die Probe. Passt das Feld nicht, bleiben die Reels offen und werden im nächsten Lauf erneut angefragt, ein Fehl-Mapping markiert also nichts falsch als `silent`.
- "Schwelle" ist `OUTLIER_THRESHOLD` (2) über Plays durch Audience, wie überall sonst. Owned und nische-fremde Creators sind nicht ausgenommen, das Transkript ist Korpus-Wissen.
- Budget: Ticket 18 begrenzt Creators je Run; dieselbe Idee für Transkripte ist `TRANSCRIPT_LIMIT_PER_RUN` (20, Env), stärkste Outlier zuerst, der Rest im nächsten Lauf. Die Nutzung des Actor-Laufs geht in `usage` desselben Runs; fällt der Actor aus, zählt er als ein `unreported` Actor-Lauf, der Run bekommt einen Fehler unter `transcripts` und endet `partial`, die Sammlung selbst bleibt.
- `silent` nur, wenn der Actor das Reel beantwortet hat und kein Text kam. Nicht beantwortete Reels bleiben offen, damit ein vorübergehender Aussetzer nichts endgültig markiert. Backfill holt keine Transkripte; der erste Delta-Refresh danach tut es.
- Die eine Stelle für die Hook-Entscheidung ist `hookOf` in `lib/hook-source.ts`. Format Signals, Format-Review und Evidenzpaket (Hooks-Board, Prognose) lesen darüber; das Evidenzpaket nennt ein Reel ohne Transkript weiter unter seinem gespeicherten Titel, weil der schon die erste Caption-Zeile ist. `hookLine` ist dorthin gewandert, `format-signals.ts` re-exportiert es.
- Keine UI-Änderung: das Ticket verlangt keine; die Run-Zeile im Profile-Tab zeigt die Transkript-Zahlen noch nicht.

Neu: `lib/transcripts.ts`, `lib/hook-source.ts`, `lib/adapters/sources/apify-transcripts.ts`, `tests/transcripts.test.mjs`, `tests/transcript-run.test.mjs`, `tests/apify-transcripts.test.mjs`. Geändert: `lib/collect.ts`, Contracts, Convex-Schema (`signals.transcript`, `signals.transcriptStatus`, `runs.transcripts`), Config, `format-signals.ts`, `format-review.ts`, `strategy-evidence.ts`, `.env.example`, CONTEXT.md. 275 Tests grün, Typecheck grün.

# 05 — Manueller Transkript-Lauf mit Retry

**What to build:** In der Reel-Ansicht startet `Transkribieren` einen Actor-Lauf für genau dieses Reel, `Erneut versuchen` dasselbe für `silent`, `missing` und `failed`. Während des Laufs steht das Reel auf `pending`, ein zweiter Klick oder ein Reload startet keinen zweiten Lauf. Nach Erfolg zeigt die Ansicht das Transkript, nach einem Fehler die Ursache und erneut die Aktion. Der Lauf wird als eigener Run der Art `transcript` protokolliert, mit Nutzung und Kosten; der Profile-Tab zeigt ihn und ab jetzt auch die Transkript-Zahlen jeder Run-Zeile. Im Demo-Modus schreibt der Knopf ein festes Beispiel ohne Actor.

**Blocked by:** 04 — Reel-Ansicht (die Aktionen leben dort); 01 — Parser (der Lauf nutzt denselben Transcriber)

**Status:** ready-for-agent

- [ ] `POST /api/signals/transcribe` mit `{ id }`; reine Lauf-Funktion in der Transkript-Logik mit Storage, Transcriber, Uhr als Abhängigkeiten
- [ ] `pending` als Sperre: zweiter Start antwortet mit Konflikt; abgelaufenes `pending` darf neu gestartet werden
- [ ] Jeder Status außer `ready` und frischem `pending` darf manuell gestartet werden; Versuche zählen hoch
- [ ] Run-Art `transcript` in Schema und Contracts; Run trägt ein geprüftes Reel, Transkript-Zähler, Nutzung, Kosten; Monatssumme im Profile-Tab stimmt
- [ ] Profile-Tab: Run-Zeile zeigt Transkript-Zahlen (offen aus Ticket 20) und die Art `transcript`
- [ ] Storage-Port, der nur die Transkript-Felder eines Signals patcht (Convex-Mutation, Datei-Store analog)
- [ ] Demo-Modus: Knopf schreibt ein festes Beispiel
- [ ] Tests: Lauf-Funktion mit Fakes (Sperre, Konflikt, abgelaufenes pending, Erfolg, Fehler mit Ursache, eigener Run)
- [ ] CONTEXT.md: "Run" um die Art `transcript` ergänzt

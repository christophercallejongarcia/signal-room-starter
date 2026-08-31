# 19 — Gemerkte Reels im Saved-View

**What to build:** Chris merkt sich ein Reel beim Durchsehen und findet es später wieder, ohne den Tab offen zu lassen. Jede Karte in Discover bekommt eine Merken-Aktion, die den Zustand dauerhaft ablegt. Der dritte View-Toggle "Saved" zeigt genau die gemerkten Signale; die übrigen Filter (Netzwerk, Zeitfenster, Channel, Sortierung) wirken darin weiter. Aus einem gemerkten Signal entsteht mit "Create idea" direkt eine Idea mit Quell-Signal.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Ein Signal lässt sich merken und wieder freigeben; der Zustand überlebt einen Server-Neustart und gilt in beiden Storage-Backends
- [x] Der View-Toggle "Saved" zeigt genau die gemerkten Signale, die aktiven Filter greifen weiter
- [x] Der Stat-Block und der Zähler in der Filter-Leiste stimmen mit der Anzahl der Karten im Saved-View überein
- [x] "Create idea" auf einer gemerkten Karte erzeugt eine Idea mit `sourceSignalId` und `sourceCreator`
- [x] Test: Merk-Prädikat und Saved-Filter als reine Funktion

## Comments

**2026-08-29, umgesetzt (unbeaufsichtigter Batch, Branch `afk/batch-20260829-1704`)**

Annahmen, weil niemand fragen konnte:

- Die Markierung ist ein Feld am Signal (`savedAt?: string`), keine eigene Tabelle. Das passt zum `owned`-Mark am Creator und braucht keinen Join. Ein Delta-Refresh lässt das Feld stehen: Convex `bulkUpsert` patcht nur gelieferte Felder, der Datei-Store merged über `definedFields`.
- Neue Storage-Methode `markSignal(id, savedAt | null)` im `StorageAdapter`, in Convex als Mutation `signals.mark` (Schema um `savedAt` erweitert, mit `npx convex dev --once` deployt), im Datei-Store über die serialisierte Queue. `PATCH /api/signals` mit `{ id, saved }`, Body geparst von `parseSignalMark` (`lib/signal-mark.ts`), 404 bei unbekannter id.
- Die Outlier-Schwelle filtert den Saved-View nicht: Ein gemerktes 0,4x-Reel bleibt sichtbar. Netzwerk, Zeitfenster und Channel greifen weiter (`filterScope`), Sortierung ebenfalls.
- Vierter Stat-Block "saved" im Hero, aus `countSaved` mit denselben Filtern wie die Karten. Der Zähler in der Filter-Leiste ist `filtered.length` und damit per Konstruktion gleich.
- Im Demo-Modus (leerer Store) gibt es kein Signal im Backend; der Knopf schaltet dort nur den Tab-Zustand um, ohne PATCH.
- "Create idea" auf der Karte war schon vor dem Ticket mit `sourceSignalId`, `sourceCreator`, `sourceUrl` verdrahtet; im Saved-View ist es dieselbe Karte, also unverändert übernommen.

Live geprüft gegen Convex (Signal `ig-Dcbme9XswCK`): PATCH saved=true schreibt `savedAt`, GET listet es, saved=false löscht das Feld, unbekannte id 404, fehlendes `saved` 400.

Code-Review (Standards + Spec) hat drei Punkte gebracht, alle umgesetzt: `toggleSaved` arbeitet jetzt optimistisch mit Rollback und Meldung wie `markCreator` (vorher wurde ein fehlgeschlagener PATCH verschluckt); das Setzen/Löschen des Feldes steht einmal als `withSavedAt` in `lib/discover-filter.ts` und wird von Datei-Store und Tab benutzt; ein Test belegt, dass `mergeSignals` beim Delta-Refresh `savedAt` stehen lässt. Nicht übernommen: der vierte Stat-Block "saved" bleibt, weil das Ticket einen Stat-Block für den Saved-View verlangt und keiner der drei bestehenden ihn abbilden kann.

Neu: `lib/signal-mark.ts`, `tests/saved-signals.test.mjs`. Geändert: `lib/discover-filter.ts` (`isSaved`, `countSaved`, Saved-Zweig in `filterDiscover`), Contracts, beide Storage-Adapter, `convex/schema.ts`, `convex/signals.ts`, `app/api/signals/route.ts`, Discover-Tab in `components/signal-room.tsx`, `app/globals.css`, CONTEXT.md, SPEC.md. 230 Tests grün, Typecheck grün, Build grün.

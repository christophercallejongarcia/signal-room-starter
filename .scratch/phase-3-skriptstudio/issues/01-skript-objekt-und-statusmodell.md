# 01 — Skript-Objekt, Statusmodell und Scripts-Bereich

**What to build:** Das Skript existiert als eigenes Objekt mit eigenem Hauptbereich. Ein neuer Tab `Scripts` zwischen `Ideas` und `Cover Lab` zeigt Zähler je Status und eine Liste (Idea-Titel, Hook, Status, Revision, Quell-Reel, zuletzt geändert); ein Klick öffnet eine eigene Seite `/script/<id>` mit Kopfzeile (Idea-Titel, Quell-Reel mit Link, Status, Revision, Framework, Belege) und Zurück-Link. Statuszüge folgen einem festen Modell: `hook-selection -> draft` nur durch einen erfolgreichen Draft-Lauf, `draft -> review`, `review -> draft`, `review -> approved` von Hand, `approved -> draft` als Wiederöffnen mit Revisionssprung. Jeder verbotene Zug ist derselbe Fehlertyp wie bei den Ideas, damit der Grund auch auf Prod ankommt. Im Demo-Modus liegt je ein Beispielskript in `hook-selection`, `draft`, `review` und `approved`, sodass Liste und Seite ohne Credentials sichtbar sind.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Tabelle `scripts` mit Index nach `ideaId`; Felder gemäß Spec: `ideaId`, `sourceSignalId`, `evidenceSignalIds`, `status`, `framework` (`pas`, `bbb`, `none`) mit `frameworkReason`, `hookOptions`, `selectedHookId`, `sections`, `revision`, `approvedRevision`, `approvedAt`, `runId`, Zeitpunkte
- [x] Contracts: Hook-Option (id, `hook`, `angle`, `hypothesis`, `framework`, `evidence` mit Signal-id, `fit`, `edited`) und Abschnitt (`kind` `hook`/`beat`/`transition`/`cta`, `label`, `text`); genau ein `hook`, genau ein `cta`, zwei bis fünf Beats, Übergänge optional
- [x] Statusübergänge an einer Stelle nach dem Muster der Produktionsstufen; verbotener Zug mit demselben Fehlertyp wie bei den Ideas; Wiederöffnen erhöht die Revision; `approved` ist unveränderlich
- [x] Storage-Ports: Skripte auflisten, laden, speichern, Lauf claimen und settlen (nach dem Muster der Idea-Läufe), Status ziehen; Convex-Functions an der neuen Tabelle, Datei-Store analog
- [x] `Scripts`-Tab mit Zähler je Status und Liste; Skriptseite `/script/<id>` nach dem Muster der Creator-Detailseite mit Kopfzeile und Zurück-Link
- [x] Demo-Modus: Fixtures mit je einem Skript in allen vier Status; Skripttext liegt nur im Store, nicht im Vault oder in Git
- [x] Tests: reine Skript-Logik nach dem Vorbild der Ideas-Tests — jeder erlaubte und mindestens ein verbotener Zug, Revision beim Wiederöffnen, Body-Parser
- [x] CONTEXT.md: Begriffe "Skript", "Skriptstatus", "Hook-Option", "Abschnitt"

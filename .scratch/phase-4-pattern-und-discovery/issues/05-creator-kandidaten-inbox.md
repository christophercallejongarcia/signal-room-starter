# 05: Creator-Kandidaten aus manueller Auswahl und Dossiers prüfen

**What to build:** Chris pflegt eine persistente Kandidatenliste, nutzt die vorhandenen Research-Dossiers und entscheidet vor jeder Watchlist-Aufnahme.

**Blocked by:** Keine. Kann unabhängig starten.

Status: ready-for-agent

Parent: [Phase-4-Spec](</Users/cristobalcallejongarcia/dev/signal-room-starter/.scratch/phase-4-pattern-und-discovery/spec.md>)

## Acceptance criteria

- [ ] Manuelles Erfassen und Vorschau eines begrenzten strukturierten Dossier-Imports erzeugen Kandidaten, keine Creator in der Watchlist und keine Providerläufe.
- [ ] Kandidaten tragen normalisierten Netzwerk/Handle-Schlüssel, Markt, Nischen-Fit, Begründung, Quellen, Datenstand und vorgeschlagene/ausgewählte/verworfene Entscheidung.
- [ ] Die Übernahme aus vorhandenen Dossiers verwendet spätere Nischen-Audits vor alten Rankingempfehlungen und hält ungeprüfte Formatannahmen sowie historische Zahlen als solche sichtbar.
- [ ] Wiederholter Import führt denselben Kandidaten zusammen. Quellen gehen dabei nicht verloren; manuelle Ablehnung wird nicht durch einen älteren Dossierstand überschrieben.
- [ ] Bereits getrackte Creator werden anhand des tatsächlichen Stores markiert. Auch alan.buildz wird zuerst abgeglichen; kein Hardcoding als neuer Kandidat.
- [ ] DE/EN und foreign sind getrennte Eigenschaften. Die Liste ist filterbar und begrenzt/paginiert; leere Liste, ungültiger Import und synthetische Demo sind bedienbar.
- [ ] Tests prüfen Normalisierung, Dossier-Duplikat, Audit-Priorität, unzulässige Felder und ausbleibenden Backfill; das vorhandene Shell-Importskript wird nicht aufgerufen.
- [ ] Neue Speicherung ist über den Vertrag in Convex umgesetzt und im Datei-Fallback nutzbar; erforderliche atomare Vorgänge sind nach den Convex-Testvorgaben geprüft.
- [ ] UI-Zustände und mobile Darstellung sind abgenommen, Vertrauensgrenze und Begriffe dokumentiert; `npm run check` besteht.

## Abnahme

Ein synthetischer Durchlauf zeigt das beschriebene Verhalten vom Einstieg bis zum gespeicherten Ergebnis. Echte kostenpflichtige Providerläufe sind ein eigener Betriebscheck mit bewusst gewähltem Umfang; sie sind kein versteckter Teil der Tests.


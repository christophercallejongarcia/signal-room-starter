# Research: Fünf Vorlagen für die ersten Talking-Head-Reels

Stand: 6. September 2026

## Ergebnis

Diese fünf Reels liefern die stärkste Aufnahmebasis für Chris' Positionierung rund um das KI-Betriebssystem im Mittelstand. Die Auswahl verbindet Performance, Themenpassung und unterschiedliche Erzählformen.

| Rang | Quell-Reel | Creator | Plays | Outlier | Kanalrelativ | Dauer | Transkript |
| ---: | --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | [Drei Finanz-Agenten](https://www.instagram.com/p/DbeDeiOSnu-/) | `@alan.buildz` | 846.340 | **23,90x** | 40,34x | 56 s | bereit |
| 2 | [Die besten AI Tools 2026](https://www.instagram.com/p/DcgYou7jHu1/) | `@denizdeke` | 605.332 | **21,68x** | 180,51x | 69 s | ohne Sprache erkannt |
| 3 | [Eigener Jarvis an einem Wochenende](https://www.instagram.com/p/Dc4WnCDtbsm/) | `@alan.buildz` | 345.117 | **9,74x** | 16,45x | 76 s | bereit |
| 4 | [Claude als Social-Media-Manager](https://www.instagram.com/p/DblifbhBFhE/) | `@sebastiankauffmann` | 255.684 | **6,55x** | 10,23x | 41 s | bereit |
| 5 | [Claude und ChatGPT im Team](https://www.instagram.com/p/DcWsLMPgOoM/) | `@sebastiankauffmann` | 189.439 | **4,85x** | 7,58x | 38 s | bereit |

Die direkt aufnehmbaren neuen Skripte stehen im [Recording Pack](/Users/cristobalcallejongarcia/dev/signal-room-starter/docs/FIRST-FIVE-REELS-RECORDING-PACK.md).

## Datenbasis

Gelesen wurde das aktive Convex-Entwicklungs-Deployment `dev/robust-shepherd-280`. Der Snapshot enthält:

- 11 Creator;
- 1.459 Signale;
- 1.346 Reels;
- 140 Signale mit Transkript;
- Signale bis zum 6. September 2026.

`data/store.json` ist ein älterer Fallback-Snapshot mit 1.089 Signalen. Er wurde nicht für die endgültige Auswahl verwendet.

Der Outlier ist `Plays / Follower`. Kanalrelativ ist `Plays / Median der Plays desselben Creators`. Die Berechnung folgt `lib/adapters/scoring/outlier.ts` und ADR-0003. Alle fünf Reels liegen über der Standardschwelle von 2,0x.

## Auswahlverfahren

1. Betrachtet wurden externe Instagram-Reels aus dem 90-Tage-Korpus.
2. Consumer-Hacks ohne Bezug zu betrieblichen Abläufen wurden ausgeschlossen.
3. Themen-Dubletten wurden entfernt.
4. Bevorzugt wurden Reels mit fertigem Transkript oder einer eindeutig lesbaren visuellen Struktur.
5. Innerhalb der passenden Kandidaten entschied der Outlier, danach die absolute Reichweite.

Das stärkste Reel im gesamten Korpus erreicht 49,52x. Es behandelt die Löschung persönlicher Daten aus dem Internet. Seine Performance ist belegt, seine Botschaft passt nicht zur geplanten ersten Serie.

## Übertragbare Muster

### 1. Drei spezialisierte Rollen

Das Finanz-Agenten-Reel benennt drei Rollen und gibt jeder ein klares Ergebnis. Dieses Muster wird auf ein Geschäftsführer-Briefing übertragen. Ein Agent sammelt, einer vergleicht, einer prüft. Die menschliche Freigabe bleibt sichtbar.

### 2. Tier List

Das Tier-List-Reel liefert das zweitstärkste passende Einzelsignal. Das Format Signal „Die besten X“ lag im Review vom 1. September bei durchschnittlich 12,9x Outlier. Der Wert stieg um 7,4 Punkte gegenüber dem vorherigen Review. Im eigenen Skript werden KI-Projekte statt Marken bewertet.

### 3. Ein System aus Bestandteilen

Das Jarvis-Reel erklärt ein Agentensystem über Zuhause, Modell, Kontext, Gedächtnis, Skills und Werkzeuge. Das eigene Reel reduziert diese Struktur auf die Bestandteile eines KI-Betriebssystems für den Mittelstand.

### 4. Ein kompletter Arbeitsablauf

Das Instagram-Reel verbindet Datensammlung, Mustererkennung, Reaktion und Veröffentlichung. Der eigene Fokus liegt auf dem belegbaren Signal-Room-Ablauf. Veröffentlichung bleibt freigabepflichtig.

### 5. Erstellen und Prüfen trennen

Das Team-Reel gibt zwei Modellen unterschiedliche Rollen. Der eigene Ansatz überträgt das auf ein Angebot. Agenten erstellen und prüfen. Ein Vertriebsmitarbeiter entscheidet und versendet.

## Skriptgrenze

Vier Quell-Reels haben ein fertiges Transkript. Die Tier List wurde als `silent` gespeichert und wird über Titel, Cover und Format ausgewertet. Die vollständigen Originaltranskripte werden nicht veröffentlicht oder kopiert. Die neuen Skripte übernehmen Struktur, Tempo und Spannungsführung. Wortwahl, Beispiele und Haltung gehören Chris.

## HyperFrame-Zuordnung

[`talkinghead-broll/STYLE.md`](/Users/cristobalcallejongarcia/dev/hyperframes/videos/_style-packs/talkinghead-broll/STYLE.md) ist die gemeinsame Basis. Das Pack hält den Sprecher im Bild und setzt Media-Walls, Overlays und Full-Cutaways darüber oder dazwischen.

| Reel | Zusatzsprache | Einsatz |
| --- | --- | --- |
| Begriff KI-Betriebssystem | `talkinghead-broll` | Begriffe als Media-Wall, Angebotsprozess als Full-Cutaway |
| Tier-Ranking | `kinetic-listicle` | Tier-Board mit D-, B-, A- und S-Stufe |
| Geschäftsführer-Briefing | `paper-editorial` | Drei Rollenkarten und eine Council-Formation |
| Signal Room | `talkinghead-broll` | Echte UI-Ausschnitte und eine Glass-Checkliste |
| Angebotsprüfung | `paper-editorial` | Ersteller, Prüfer und Mensch am Council-Tisch |

Weitere lokale Grundlagen:

- [Talking-Head-Blueprint](/Users/cristobalcallejongarcia/dev/hyperframes/videos/_style-packs/talkinghead-broll/reference-blueprint.md)
- [Kinetic-Listicle-Stil](/Users/cristobalcallejongarcia/dev/hyperframes/videos/_style-packs/kinetic-listicle/STYLE.md)
- [Kinetic-Listicle-Blueprint](/Users/cristobalcallejongarcia/dev/hyperframes/videos/_style-packs/kinetic-listicle/reference-blueprint.md)
- [Paper-Editorial-Stil](/Users/cristobalcallejongarcia/dev/hyperframes/videos/_style-packs/paper-editorial/STYLE.md)
- [Paper-Editorial-Blueprint](/Users/cristobalcallejongarcia/dev/hyperframes/videos/_style-packs/paper-editorial/reference-blueprint.md)
- [Council-Blueprint](/Users/cristobalcallejongarcia/dev/hyperframes/videos/_style-packs/paper-editorial/reference-blueprint-council.md)

## Quellen

- Aktiver Convex-Datenbestand: öffentliche Read-Queries `creators:list`, `signals:list` und `formatReviews:list`
- [Rankingformel](/Users/cristobalcallejongarcia/dev/signal-room-starter/lib/adapters/scoring/outlier.ts)
- [Outlier-Entscheidung](/Users/cristobalcallejongarcia/dev/signal-room-starter/docs/adr/0003-outlier-definition.md)
- [Strategieziel](/Users/cristobalcallejongarcia/dev/signal-room-starter/.env.local), nur `NEXT_PUBLIC_STRATEGY_GOAL` und `NEXT_PUBLIC_STRATEGY_AUDIENCE`
- [Datenvertrag](/Users/cristobalcallejongarcia/dev/signal-room-starter/lib/contracts.ts)

Creator-Captions und Transkripte wurden als untrusted Content behandelt. Externe Funktionsbehauptungen aus den Reels wurden nicht als Fakten übernommen.

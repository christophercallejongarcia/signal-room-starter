# Quellenprüfung der fünf Reel-CTAs

Stand: 6. September 2026

## Zweck und Prüfgrenze

Diese Prüfung beantwortet für jedes der fünf ausgewählten Reels drei Fragen:

1. Verweist das Reel auf ein konkretes Repository, einen benannten Connector oder ein offizielles Plugin?
2. Welche Aussage lässt sich durch die Primärquelle belegen?
3. Was darf das CTA-Material versprechen, ohne mehr zu behaupten als die Quelle hergibt?

Als Reel-Beleg dienen die gespeicherten Captions und Transkripte im aktiven Signal-Room-Datenbestand. Produktbehauptungen wurden ausschließlich gegen Repositorys der jeweiligen Herausgeber oder offizielle Herstellerdokumentation geprüft. Nicht benannte Tools wurden nicht geraten.

## Ergebnis auf einen Blick

| Reel | Konkrete Quelle hinter dem CTA | Status | Zulässiges CTA-Versprechen |
| --- | --- | --- | --- |
| Drei Finanz-Agenten | [`anthropics/financial-services`](https://github.com/anthropics/financial-services) | Offizielles Anthropic-Repository. Die drei Namen und insgesamt zehn Agenten sind belegt. Der Funktionsumfang im Reel ist teilweise falsch übertragen. | Quellenbasierter Setup-Guide für die drei Anthropic-Referenzagenten mit Voraussetzungen, Installation, Beispielaufträgen und Prüfhinweisen. |
| Die besten AI Tools 2026 | Keine identifizierbare Quelle | Das gespeicherte Signal enthält nur den Titel und kein gesprochenes Transkript. Kein Repository oder Plugin ist genannt. | Eine eigene Tier-Liste samt eigenem Bewertungsschema. Keine Installationsanleitung für angebliche Original-Tools versprechen. |
| Eigener Jarvis an einem Wochenende | [`NousResearch/hermes-agent`](https://github.com/NousResearch/hermes-agent) | Konkretes Open-Source-Repository von Nous Research. Kein Anthropic-Repository und kein offizielles Claude-Plugin. | Aktueller Hermes-Agent-Setup-Guide mit Repo-Link, Modellwahl, Memory, Skills, Tools, Kanälen und Sicherheitscheckliste. |
| Claude als Social-Media-Manager | Kein Connector oder Repository benannt | Die Behauptung einer offiziellen Claude-Instagram-Verbindung lässt sich aus Caption und Transkript keiner konkreten Primärquelle zuordnen. | Den eigenen Signal-Room-Research-Workflow versprechen. Nicht die Einrichtung eines angeblich offiziellen Instagram-MCPs. |
| Claude und ChatGPT im Team | [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc) | Offizielles OpenAI-Plugin für Codex in Claude Code. Es bindet Codex ein, nicht pauschal alle ChatGPT-Modelle. | Installationsguide für das offizielle Codex-Plugin und einen konkreten Build-und-Review-Ablauf in Claude Code. |

## 1. Drei Finanz-Agenten

**Quell-Reel:** [Instagram-Reel von @alan.buildz](https://www.instagram.com/p/DbeDeiOSnu-/)

### Primärquelle und Anzahl

Das zugehörige Repository ist [`anthropics/financial-services`](https://github.com/anthropics/financial-services). Es gehört der GitHub-Organisation `anthropics` und beschreibt sich als Sammlung von Referenzagenten, Skills und Daten-Connectoren für Finanzdienstleistungs-Workflows.

Der Begriff **zehn Agenten** ist korrekt. Die offizielle Marketplace-Datei führt genau diese zehn benannten Agenten auf:

1. Pitch Agent
2. Market Researcher
3. Earnings Reviewer
4. Meeting Prep Agent
5. Model Builder
6. GL Reconciler
7. KYC Screener
8. Valuation Reviewer
9. Month-End Closer
10. Statement Auditor

Primärbelege: [Repository-README](https://github.com/anthropics/financial-services/blob/69cbc81467a5dced793eee03dec4658aa24ef856/README.md), [Marketplace-Datei](https://github.com/anthropics/financial-services/blob/69cbc81467a5dced793eee03dec4658aa24ef856/.claude-plugin/marketplace.json)

### Ist „Agenten“ der richtige Begriff?

Ja, mit einer wichtigen Präzisierung. Anthropic nennt sie `Agents`. Das Repository beschreibt sie als anpassbare Startpunkte für vollständige Workflows. Jeder Agent liegt als selbstständiges Cowork- beziehungsweise Claude-Code-Plugin und als Vorlage für die Managed Agents API vor. Es handelt sich nicht um zehn fest in jedem Claude-Account aktivierte Verbraucher-Apps.

Die Formulierung „Anthropic hat zehn Referenzagenten für Finanz-Workflows veröffentlicht“ ist belegt. „Claude hat zehn fertige Aktien-Agenten eingebaut“ ist nicht belegt.

### Exakter Funktionsumfang der drei genannten Agenten

#### Market Researcher

Der [offizielle Agenten-Prompt](https://github.com/anthropics/financial-services/blob/69cbc81467a5dced793eee03dec4658aa24ef856/plugins/agent-plugins/market-researcher/agents/market-researcher.md) nimmt einen Sektor oder ein Thema plus Blickwinkel entgegen. Er erstellt Branchenüberblick, Wettbewerbslandschaft, Peer-Comps, eine Ideen-Shortlist und einen Research-Entwurf. Dafür sieht die Vorlage CapIQ- oder FactSet-MCPs vor.

Korrektur zum Reel: Der Agent ist nicht als automatischer Watchlist-Monitor für Nachrichten, Analystenmeinungen und Unternehmensmeldungen beschrieben. Er ist für sektorale oder thematische Research-Aufträge gedacht. Einzelaktien-Updates verweist die Quelle ausdrücklich an den Earnings Reviewer.

#### Model Builder

Der [offizielle Agenten-Prompt](https://github.com/anthropics/financial-services/blob/69cbc81467a5dced793eee03dec4658aa24ef856/plugins/agent-plugins/model-builder/agents/model-builder.md) erwartet Ticker, Modelltyp und Annahmen. Er erstellt in Excel ein verknüpftes DCF-, LBO-, Drei-Abschluss- oder Trading-Comps-Modell, prüft es und baut passende Sensitivitäten. Historische Daten, Konsenswerte und Filings kommen laut Vorlage über CapIQ oder Daloopa.

Korrektur zum Reel: Ein DCF kann einen Wert unter Annahmen berechnen. Die Quelle verspricht keine verlässliche Kursprognose und keinen automatischen vollständigen Risikoentscheid für beliebige Privatanleger. Die Aussage, das Ergebnis ersetze ein Modell im Wert von mehreren Tausend Euro, ist in der Primärquelle nicht belegt.

#### Earnings Reviewer

Der [offizielle Agenten-Prompt](https://github.com/anthropics/financial-services/blob/69cbc81467a5dced793eee03dec4658aa24ef856/plugins/agent-plugins/earnings-reviewer/agents/earnings-reviewer.md) erwartet Ticker und Berichtsperiode. Er verarbeitet den vollständigen Earnings-Call, Filings und Konsensdaten, aktualisiert ein vorhandenes Coverage-Modell und erstellt einen Entwurf der Earnings Note sowie eine Abweichungstabelle. FactSet oder Daloopa sind als Datenquellen vorgesehen.

Korrektur zum Reel: Der Agent fasst nicht nur Aussagen des Managements zusammen. Er braucht den vollständigen Earnings-Call, Filings, Datenzugriff und für die Modellaktualisierung ein bestehendes Coverage-Workbook. Der Output bleibt ein Entwurf. Die Quelle verlangt die Freigabe durch einen Senior Analysten vor jeder Verteilung.

### Voraussetzungen

Das Repository bietet zwei Nutzungswege:

- In Cowork wird das Repository als Plugin-Quelle hinzugefügt und der gewünschte Agent ausgewählt.
- In Claude Code wird zuerst der Marketplace hinzugefügt. Danach werden das Core-Plugin `financial-analysis` und die gewünschten Agenten installiert.
- Alternativ lassen sich die Vorlagen über die Claude Managed Agents API hinter einer eigenen Workflow-Engine betreiben.
- CapIQ, FactSet und Daloopa sind externe Datenanbieter. Der Repository-Hinweis sagt ausdrücklich, dass MCP-Zugriff ein Abonnement oder einen API-Schlüssel verlangen kann.
- Alle Ergebnisse benötigen fachliche Prüfung. Das Repository schließt Anlage-, Rechts-, Steuer- und Buchhaltungsberatung aus und verbietet autonome Empfehlungen, Transaktionen und Veröffentlichung ohne menschliche Freigabe.

Primärbeleg: [Installation, Connectoren und Risikohinweis im offiziellen README](https://github.com/anthropics/financial-services/blob/69cbc81467a5dced793eee03dec4658aa24ef856/README.md)

### Zulässiger CTA

> Wenn du meinen quellenbasierten Setup-Guide für Market Researcher, Model Builder und Earnings Reviewer haben willst, kommentiere **FINANZ**. Du bekommst den offiziellen Repo-Link, die Voraussetzungen, die Installation, drei passende Beispielaufträge und die Prüfcheckliste.

Das Material darf keine Anlageempfehlung, Analysten-Ersetzung oder garantierte Bewertung versprechen.

## 2. Die besten AI Tools 2026

**Quell-Reel:** [Instagram-Reel von @denizdeke](https://www.instagram.com/p/DcgYou7jHu1/)

Das gespeicherte Signal trägt nur die Caption „Die besten AI Tools 2026 Tier List“ und wurde ohne gesprochenes Transkript erfasst. Weder ein Repository noch ein offizielles Plugin noch ein Download-CTA ist im gespeicherten Beleg genannt. Die im Video sichtbaren Tools können deshalb nicht verlässlich einer Installationsquelle zugeordnet werden.

### Zulässiger CTA

> Wenn du **meine** KI-Projekt-Tier-Liste mit dem Bewertungsschema haben willst, kommentiere **TIER** und ich schicke sie dir zu.

Die Kennzeichnung als eigene Liste ist wichtig. Ein Guide zu den angeblichen Original-Tools wäre ohne erneute Sichtprüfung des Videos nicht belegt.

## 3. Eigener Jarvis an einem Wochenende

**Quell-Reel:** [Instagram-Reel von @alan.buildz](https://www.instagram.com/p/Dc4WnCDtbsm/)

Caption und Transkript nennen Hermes Agent ausdrücklich. Die Primärquelle ist das Open-Source-Repository [`NousResearch/hermes-agent`](https://github.com/NousResearch/hermes-agent). Der aktuelle offizielle README belegt freie Modellwahl, persistentes Gedächtnis, Skills, Tools, MCP-Anbindung, Cron-Abläufe und Kommunikationskanäle über einen Gateway-Prozess.

Die Quelle gehört Nous Research. Hermes Agent ist kein Anthropic-Repository und kein offizielles Claude-Plugin. Claude kann als Modellanbieter genutzt werden. Das macht das Framework nicht zu einem Anthropic-Produkt.

Die [offizielle Messaging-Dokumentation](https://hermes-agent.nousresearch.com/docs/user-guide/messaging) belegt Telegram, Discord, Slack, WhatsApp, Signal, E-Mail und mehrere weitere Kanäle. iMessage wird über BlueBubbles oder Photon unterstützt. Die [offizielle Voice-Dokumentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/tts) führt ElevenLabs als optionalen, kostenpflichtigen TTS-Anbieter. Der kostenlose Standard ist Edge TTS. Die Formulierung „Hermes Voice wird von ElevenLabs gestützt“ wäre deshalb zu pauschal.

Die im Transkript als „Cloud Design“ erfasste Oberfläche ist sehr wahrscheinlich [Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design). Anthropic dokumentiert den Austausch zwischen Claude Design und Claude Code. Eine fertige Ein-Klick-Verbindung zwischen Claude Design und Hermes ist nicht dokumentiert. Dieser Teil wäre eine eigene Integration und muss im Guide so gekennzeichnet werden.

Die Installation bringt lokale Ausführungsmöglichkeiten mit weitreichenden Tool-Rechten. Das CTA-Material muss Modellzugang, Provider-Kosten, Secrets, Tool-Freigaben und die Sicherheitskonfiguration erklären. „Bis Sonntag fertig“ ist ein Formatversprechen des Reels, keine Garantie des Projekts.

Primärbeleg: [Offizieller Hermes-Agent-README, Stand Commit `0a195aa`](https://github.com/NousResearch/hermes-agent/blob/0a195aa4636494812a52ab7068a5ab822d050abf/README.md)

### Zulässiger CTA

> Wenn du den offiziellen Hermes-Repo-Link, meinen geprüften Neun-Schritte-Plan und die Samstag-Sonntag-Checkliste haben willst, kommentiere **SYSTEM** und ich schicke dir alles zu.

Falls das Reel stattdessen auf das eigene KI-Betriebssystem übertragen wird, darf der CTA `SYSTEM` einen eigenen Neun-Schritte-Plan versprechen. Der Plan darf dann nicht als Hermes-Installationsanleitung oder Anthropic-Vorlage bezeichnet werden.

## 4. Claude als Social-Media-Manager

**Quell-Reel:** [Instagram-Reel von @sebastiankauffmann](https://www.instagram.com/p/DblifbhBFhE/)

Das Reel behauptet eine offizielle Verbindung zwischen Claude und Instagram über ein MCP. Caption und Transkript nennen jedoch keinen Produktnamen, Anbieter, Repository-Link oder Connector-Eintrag. Damit lässt sich die konkrete Verbindung nicht aus einer Primärquelle identifizieren.

Anthropic erklärt, dass Claude-Connectoren auf MCP beruhen und dass der Connector-Katalog auch geprüfte Drittanbieter enthält. Ein Eintrag im Anthropic-Verzeichnis ist deshalb nicht automatisch ein von Anthropic entwickelter Instagram-Connector. Im aktuellen [offiziellen Connector-Verzeichnis](https://claude.com/connectors) ist kein Instagram-Eintrag auffindbar. Die [offizielle Connector-Dokumentation](https://claude.com/docs/connectors/overview) trennt zwischen Verzeichnis-Connectoren, Drittanbieter-Connectoren und eigenen MCP-Servern.

Meta dokumentiert für professionelle Instagram-Konten eine offizielle [Instagram Platform API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/), darunter Endpunkte für [Insights](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/insights), [Kommentarmoderation](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/comment-moderation) und [Content Publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing). Diese API belegt mögliche Instagram-Funktionen. Sie belegt keinen von Anthropic veröffentlichten Instagram-MCP.

Bis der konkrete Anbieter und seine Berechtigungen bekannt sind, dürfen die Aussagen zu vollständigen Analytics, automatischen Kommentarantworten und autonomem Reel-Posting nicht übernommen werden.

### Zulässiger CTA

> Wenn du meinen Signal-Room-Workflow für Reel-Sammlung, Kennzahlen, Transkripte, Muster und Skriptentwicklung haben willst, kommentiere **SIGNAL** und ich schicke dir den Schritt-für-Schritt-Plan.

Das ist ein CTA zum eigenen System. Er darf keine Anleitung für den im Original unbenannten MCP versprechen. Antworten und Veröffentlichungen bleiben menschlich freigabepflichtig.

## 5. Claude und ChatGPT im Team

**Quell-Reel:** [Instagram-Reel von @sebastiankauffmann](https://www.instagram.com/p/DcWsLMPgOoM/)

Die konkrete Primärquelle ist das offizielle OpenAI-Repository [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc). Das Plugin lässt Codex innerhalb von Claude Code Reviews durchführen oder Aufgaben übernehmen. Es bietet unter anderem `/codex:review`, `/codex:adversarial-review` und `/codex:rescue`.

Korrektur zum Reel: Das Plugin holt nicht pauschal „alle ChatGPT-Modelle“ in Claude. Es bindet den lokalen Codex-Client und den Codex App Server ein. Ein Modell baut und ein anderes prüft auch nicht automatisch jede Aufgabe. Der Mensch startet einen Review oder delegiert eine konkrete Aufgabe. Welche Codex-Modelle verfügbar sind, hängt von der jeweiligen Codex-Konfiguration und Zugangsberechtigung ab.

Voraussetzungen laut Repository:

- Claude Code
- Node.js 18.18 oder neuer
- ChatGPT-Abonnement, einschließlich Free, oder OpenAI-API-Schlüssel
- installierter und angemeldeter Codex-Client
- verfügbare Codex-Nutzungslimits

Primärbeleg: [Offizieller Plugin-README, Stand Commit `db52e28`](https://github.com/openai/codex-plugin-cc/blob/db52e28f4d9ded852ab3942cea316258ae4ef346/README.md)

### Zulässiger CTA

> Wenn du meine Schritt-für-Schritt-Anleitung für das offizielle Codex-Plugin in Claude Code und den Build-und-Review-Ablauf haben willst, kommentiere **TEAM** und ich schicke sie dir zu.

Das aktuelle Drei-Rollen-Framework für Angebote ist eine eigene Übertragung. Es darf als eigenes Framework angeboten werden, aber nicht als Funktionsbeschreibung dieses OpenAI-Plugins.

## Konsequenz für die Skripte

- `FINANZ` muss sich am tatsächlichen Anthropic-Repository orientieren. Market Researcher ist kein Watchlist-Agent. Model Builder ist kein Kursprognose-Bot. Earnings Reviewer arbeitet mit professionellen Datenquellen, einem Coverage-Modell und menschlicher Freigabe.
- `TIER` bleibt ein eigenes Bewertungspaket, solange das stille Quell-Reel nicht visuell geprüft wurde.
- `SYSTEM` kann einen echten Hermes-Agent-Guide mit eigenem Neun-Schritte-Plan versprechen. Claude Design und Hermes müssen dabei als eigene Integration gekennzeichnet werden.
- `SIGNAL` verweist auf den eigenen Signal Room. Der unbenannte Instagram-MCP aus dem Original bleibt außen vor.
- `TEAM` sollte bei einer quellennahen Fassung das offizielle Codex-Plugin und seinen Build-und-Review-Ablauf erklären. Das Angebotsbeispiel ist eine eigenständige Adaption ohne Repo-Bezug.

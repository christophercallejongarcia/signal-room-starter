# ManyChat-Anforderungen für Reel-Lead-Magnets

Stand: 31. August 2026

## Ziel und Recherchegrenze

Dieses Dokument beschreibt, welche Informationen Signal Room für einen Instagram-Reel-Lead-Magnet-Flow an ManyChat übergeben muss. Berücksichtigt wurden ausschließlich aktuelle offizielle ManyChat-Hilfeartikel und Rechtstexte. Die eigentliche Einrichtung oder Veröffentlichung in ManyChat bleibt eine externe Aktion mit menschlicher Freigabe.

## Empfohlener Flow

```text
Reel-Caption fordert Kommentar mit Keyword
  → Kommentar-Trigger für dieses Reel
  → optionale öffentliche Antwort
  → Opening DM mit Interaktionsbutton
  → Klick öffnet das 24-Stunden-Fenster
  → optional: E-Mail-Abfrage und/oder Follow-Prüfung
  → Auslieferungs-DM mit Lead-Magnet-Link
  → optionales Follow-up, wenn der Link nicht geklickt wurde
```

Für den geplanten Anwendungsfall sollte die Opening DM verwendet werden. Der Klick auf ihren normalen Button oder eine Quick Reply gilt als Opt-in, öffnet das 24-Stunden-Fenster und fügt die Person als abonnierten Kontakt hinzu. Eine Schaltfläche mit der Aktion `Open website` leistet das nicht. Ohne Opening DM kann der Link zwar als erste private Antwort gesendet werden. Dann stehen in der Quick Automation aber keine E-Mail-Abfrage, Follow-Prüfung oder Follow-up-DM zur Verfügung. [Quick Automation: Auto-DM links from comments](https://help.manychat.com/hc/en-us/articles/16654065283100-Quick-Automation-Auto-DM-links-from-comments), [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)

## Was ManyChat für den Aufbau benötigt

### 1. Zuordnung und Trigger

Für jeden Flow werden benötigt:

- Name und interne ID des Lead-Magnet-Projekts
- Instagram-Reel-Link sowie die kanonische Reel-ID oder der Shortcode
- Auswahl `Specific post or reel`
- ein oder mehrere Kommentar-Keywords
- optional ausgeschlossene Wörter
- optional die Entscheidung, statt Keywords jeden Kommentar auszulösen

ManyChat kann den Kommentar-Trigger auf ein bestimmtes Reel, alle Posts und Reels oder das nächste veröffentlichte Reel begrenzen. Für individuelle Lead Magnets ist `Specific post or reel` die passende Einstellung. In der Quick Automation müssen mehrere Wörter oder Reaktionen mit Kommas getrennt werden. Sonst behandelt ManyChat die Eingabe als ein zusammenhängendes Keyword. [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger), [Quick Automation: Grow followers from comments](https://help.manychat.com/hc/en-us/articles/20310878273692-Quick-Automation-Grow-followers-from-comments)

Das Keyword sollte kurz, leicht zu schreiben und für diesen Lead Magnet möglichst eindeutig sein. Signal Room sollte vor der Freigabe auf Überschneidungen mit anderen aktiven Kommentar-Automationen hinweisen. Bei mehreren Keyword-Triggern startet das jeweilige Keyword den zugehörigen Flow. Bei mehreren triggernden Automationen ohne Keyword gelten Prioritätsregeln. [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)

Wichtige Plattformgrenze: Der Trigger reagiert nur auf den ersten Kommentar einer Person unter einem Post oder Reel. Ein weiterer Kommentar derselben Person mit demselben Keyword startet ihn nicht erneut. [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)

### 2. Reel-CTA und Caption

Signal Room sollte für die Veröffentlichung liefern:

- gesprochenen CTA im Skript
- Caption-CTA
- gewähltes Kommentar-Keyword
- eine kurze Erklärung, was die Person erhält

Beispielstruktur:

```text
Möchtest du den vollständigen Schritt-für-Schritt-Guide mit Praxisbeispielen?
Kommentiere GUIDE und ich schicke ihn dir per DM.
```

ManyChat verlangt diesen Caption-Text technisch nicht als Konfigurationsfeld. Er muss aber dasselbe Keyword nennen, das im Kommentar-Trigger hinterlegt ist.

### 3. Öffentliche Antwort

Die öffentliche Antwort ist optional. Die Quick Automation unterstützt bis zu drei Varianten und rotiert sie automatisch. ManyChat empfiehlt wechselnde Formulierungen und rät von extrem kurzen Antworten oder reinen Emoji-Antworten ab, um Spam-Erkennung zu vermeiden. [Quick Automation: Auto-DM links from comments](https://help.manychat.com/hc/en-us/articles/16654065283100-Quick-Automation-Auto-DM-links-from-comments), [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)

Signal Room sollte deshalb liefern:

- ein bis drei öffentliche Reply-Varianten
- optional eine Personalisierungsvariable, sofern sie im Zielkanal verfügbar ist

Beispielvarianten:

```text
Ist unterwegs. Schau kurz in deine DMs 👌
Ich habe dir den Guide gerade geschickt.
Der Praxis-Guide wartet in deinen Nachrichten.
```

### 4. Opening DM und Opt-in

Die Opening DM ist die erste private Antwort. Für den empfohlenen Flow braucht sie:

- Opening-DM-Text
- Button- oder Quick-Reply-Label
- eine interne Aktion, die nach dem Klick zur Auslieferung weiterführt

Beispiel:

```text
Ich habe den Guide für dich vorbereitet. Soll ich ihn dir jetzt schicken?

[Ja, schick ihn mir]
```

Der Button darf für diesen Schritt kein reiner Website-Link sein. Der Klick auf einen normalen Button oder eine Quick Reply öffnet das 24-Stunden-Fenster. Die Opening DM darf im Flow Builder nur einen einzelnen Content-Block enthalten. Nicht erlaubt sind dort User Input, Instagram DM Lists, Typing Delays und Dynamic Blocks. Die erste Nachricht muss als `Send as a Private Reply` markiert sein. [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)

### 5. Optionale E-Mail-Abfrage und Follow-Prüfung

Die Quick Automation kann nach der Opening DM optional eine E-Mail-Adresse abfragen und prüfen, ob die Person dem Instagram-Konto folgt. Wenn alle Module aktiv sind, verwendet ManyChat diese Reihenfolge:

1. Opening DM
2. E-Mail-Abfrage
3. Follow-Prüfung oder Follow-Aufforderung
4. Hauptnachricht mit Link
5. Follow-up-Erinnerung

Diese Module setzen die Opening DM voraus. [Quick Automation: Auto-DM links from comments](https://help.manychat.com/hc/en-us/articles/16654065283100-Quick-Automation-Auto-DM-links-from-comments)

Signal Room sollte dafür optionale Entscheidungen und Texte vorsehen:

- `emailCollectionEnabled`
- Text und Nutzenbegründung der E-Mail-Abfrage
- Datenschutzhinweis oder Link zur Datenschutzerklärung, wenn E-Mail-Daten erhoben werden
- `followGateEnabled`
- Follow-Aufforderung
- Verhalten, wenn die Follow-Prüfung negativ ausfällt

Eine E-Mail-Abfrage sollte nur verwendet werden, wenn Zweck, Rechtsgrundlage, Datenschutzhinweis und anschließende Nutzung feststehen. ManyChat weist dem Kunden die Verantwortung zu, die erforderliche Erlaubnis oder Rechtsgrundlage einzuholen und Betroffene über die Verarbeitung zu informieren. [ManyChat Privacy Policy](https://manychat.com/legal/privacy), [Data Processing Addendum](https://manychat.com/legal/dpa-16092024)

### 6. Lead-Magnet-Auslieferung

Für die Quick Automation benötigt Signal Room:

- Auslieferungstext
- veröffentlichte HTTPS-URL des Lead Magnets
- Link-Label
- optional bis zu zwei weitere Links, insgesamt sind bis zu drei möglich

Beispiel:

```text
Hier ist dein Guide. Darin findest du den Quickstart, konkrete Praxisbeispiele und die Punkte, auf die du achten solltest.

[Guide öffnen]
```

Die URL muss vor der ManyChat-Freigabe öffentlich erreichbar sein und auf die freigegebene PDF-Version zeigen. Ein Link passt am besten zur Quick Automation, weil ManyChat Klicks, CTR und ein Follow-up für nicht geklickte Links auswertet. [Quick Automation: Auto-DM links from comments](https://help.manychat.com/hc/en-us/articles/16654065283100-Quick-Automation-Auto-DM-links-from-comments)

Alternativ unterstützt Instagram in ManyChat einen PDF-Content-Block. Die PDF wird dann mit Vorschau direkt im Chat angezeigt. Diese Variante gehört in den Flow Builder und sollte separat auf dem echten Instagram-Kanal getestet werden. Die offizielle Medienübersicht nennt für Instagram keinen belastbaren PDF-Größenwert. Signal Room sollte deshalb keine ungeprüfte Dateigröße als feste Grenze behaupten. [Content Block types](https://help.manychat.com/hc/en-us/articles/14281196200604-Content-Block-types), [Media guidelines for Facebook Messenger, WhatsApp, and Instagram automations](https://help.manychat.com/hc/en-us/articles/14281167455388-Media-guidelines-for-Facebook-Messenger-WhatsApp-and-Instagram-automations)

### 7. Follow-up

ManyChat kann eine Follow-up-DM an Personen senden, die den Link nicht geklickt haben. Sie ist optional und setzt in der Quick Automation die Opening DM voraus. Benötigt werden:

- Aktivierung oder Deaktivierung
- Wartezeit, soweit in ManyChat wählbar
- Follow-up-Text
- Link und Link-Label

Beispiel:

```text
Kurze Erinnerung: Dein Guide ist noch hier. Der Praxis-Teil ab Seite 4 dürfte für dich besonders nützlich sein.

[Guide öffnen]
```

Der Versand muss innerhalb des geöffneten 24-Stunden-Fensters liegen. ManyChat blockiert geplante automatisierte Nachrichten außerhalb dieses Fensters. Danach sind bei Instagram bis Tag 7 nur manuelle Nachrichten über die Inbox zulässig. [Understanding messaging windows](https://help.manychat.com/hc/en-us/articles/23358636027932-Understanding-messaging-windows), [Quick Automation: Auto-DM links from comments](https://help.manychat.com/hc/en-us/articles/16654065283100-Quick-Automation-Auto-DM-links-from-comments)

### 8. Bedingungen, Tags und interne Zuordnung

Im Flow Builder können vor der privaten Antwort Actions, Conditions, Smart Delays und Randomizer eingesetzt werden. ManyChat nennt als Beispiele das Taggen nach Kampagne und eine Bedingung, ob jemand dem Konto folgt. [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)

Für eine spätere Auswertung sollte Signal Room mindestens vorbereiten:

- eindeutiger Automationsname
- Kampagnen- oder Lead-Magnet-Tag
- Reel-ID
- Skript-ID und Skriptversion
- Lead-Magnet-ID und PDF-Version
- Keyword
- optionales Angebot oder Kampagnenziel
- optionaler CTA-Typ

Empfohlene Benennung:

```text
IG_REEL_<reel-shortcode>_<keyword>_<YYYY-MM-DD>
```

Ein zweiter Auslieferungs-Tag wie `LM_<lead-magnet-id>_DELIVERED` hilft später bei der Zuordnung. Das ist eine Produktempfehlung aus den von ManyChat unterstützten Tags und Bedingungen, keine Pflicht der Plattform.

## Berechtigungen und Kontovoraussetzungen

Vor der Einrichtung muss geprüft werden:

- Das Instagram-Konto ist ein professionelles Business- oder Creator-Konto. Persönliche Konten können nicht verbunden werden.
- ManyChat besitzt Zugriff auf Instagram-Nachrichten.
- Bei einer Verbindung über Meta Business Suite besitzt der einrichtende Nutzer volle Kontrolle über die verknüpfte Facebook-Seite.
- Bei mehreren verbundenen Messaging-Apps ist das Conversation Routing korrekt gesetzt. ManyChat sollte die Gespräche übernehmen und andere Apps dürfen nicht konkurrierend die Kontrolle übernehmen.
- Nach Passwort-, Seiten- oder Berechtigungsänderungen werden die Instagram-Berechtigungen in ManyChat aktualisiert.

ManyChat empfiehlt `Connect via Meta`, weil diese Verbindung die neuesten Funktionen unterstützt. Die direkte Instagram-Verbindung kann erweiterte Funktionen einschränken. [How to connect Instagram to ManyChat](https://help.manychat.com/hc/en-us/articles/14281290924444-How-to-connect-Instagram-to-Manychat), [Conversation Routing for Instagram](https://help.manychat.com/hc/en-us/articles/14281188830748-Conversation-Routing-for-Instagram), [Refresh permissions](https://help.manychat.com/hc/en-us/articles/14281464342684-Refresh-permissions)

## Technische und redaktionelle Grenzen

- Instagram-Textblöcke mit Buttons sind auf 640 Zeichen begrenzt. Textblöcke ohne Buttons sind auf 1.000 Zeichen begrenzt.
- Instagram-Nachrichten müssen UTF-8-konform sein. Einzelne Textnachrichten einschließlich Medienbezug dürfen 1.000 Bytes nicht überschreiten.
- Button-Namen müssen unter 20 Zeichen bleiben. Instagram-Textblöcke unterstützen bis zu drei Buttons.
- Nicht verbundene Schritte, leere Blöcke und fehlende Anhänge verhindern die Veröffentlichung.
- Kostenlose Konten können kostenpflichtige Features in einen Flow einfügen, den Flow damit aber nicht veröffentlichen. Der aktuelle Tarif muss vor der Übergabe geprüft werden.
- Kollaborations-Posts funktionieren nur verlässlich über das mit ManyChat verbundene Konto des ursprünglichen Veröffentlichers. Bei Remixes muss das Konto sowohl Original als auch Remix besitzen. Reine Ads-Manager-Posts ohne Eintrag im Profilraster erscheinen nicht im Post-Picker.

Quellen: [Instagram automation troubleshooting](https://help.manychat.com/hc/en-us/articles/14281308423452-Instagram-automation-troubleshooting), [Buttons](https://help.manychat.com/hc/en-us/articles/14281157003292-Buttons), [General automation troubleshooting](https://help.manychat.com/hc/en-us/articles/14281479971996-General-automation-troubleshooting), [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)

## Test- und Freigabecheckliste

ManyChat bietet eine Vorschau im Builder und eine Vorschau direkt in Instagram. Die Builder-Vorschau zeigt Inhalte und Reihenfolge, führt aber Actions und Smart Delays nicht aus. Eingabevalidierung wird dort ebenfalls nicht vollständig geprüft. Für die finale Abnahme muss deshalb auf Instagram getestet werden. [How to preview automations in ManyChat](https://help.manychat.com/hc/en-us/articles/14281198254620-How-to-preview-automations-in-Manychat)

Vor `Go Live` oder `Set Live`:

- Reel-Zuordnung und kanonische Reel-ID stimmen.
- Caption und gesprochener CTA nennen exakt das konfigurierte Keyword.
- Keyword und ausgeschlossene Wörter sind korrekt getrennt und überschneiden sich nicht mit aktiven Flows.
- Drei öffentliche Reply-Varianten lesen sich natürlich.
- Opening DM enthält einen normalen Button oder eine Quick Reply, keinen reinen Website-Button.
- Button-Label bleibt unter 20 Zeichen.
- Klick auf die Opening DM führt in die Auslieferung und öffnet das 24-Stunden-Fenster.
- Follow- und E-Mail-Abfragen erscheinen nur, wenn sie bewusst aktiviert wurden.
- Auslieferungslink verwendet HTTPS, ist öffentlich erreichbar und zeigt auf die freigegebene PDF-Version.
- PDF, mobile Darstellung, Link und Download werden auf einem echten Smartphone geprüft.
- Follow-up wird nur bei nicht geklicktem Link und innerhalb des 24-Stunden-Fensters versendet.
- Tags, Bedingungen und Kampagnenzuordnung werden im echten Instagram-Test ausgeführt.
- Öffentliche Antwort, Opening DM, Auslieferung und Follow-up enthalten keine Platzhalter.
- Der Test berücksichtigt, dass derselbe Account den Kommentar-Trigger unter demselben Reel nicht zweimal auslösen kann.
- Flow ist veröffentlicht. Trigger ist aktiv. Keine Blöcke oder Anhänge sind unvollständig.
- Nach der Aktivierung werden Runs, Sends, Klicks, CTR und bei Bedarf gesammelte E-Mails geprüft. Runs und Sends können abweichen, wenn Empfänger die Opening DM erhalten, ihren Button aber nicht anklicken.

## Datenschutz und Datenpflege

ManyChat verarbeitet Kundendaten im Auftrag des ManyChat-Kunden. Der Kunde bleibt dafür verantwortlich, eine passende Rechtsgrundlage oder Einwilligung zu besitzen und die Personen über die Verarbeitung zu informieren. Das betrifft besonders freiwillig erhobene E-Mail-Adressen und spätere Marketingkommunikation. [ManyChat Privacy Policy](https://manychat.com/legal/privacy), [Data Processing Addendum](https://manychat.com/legal/dpa-16092024)

Die operative Checkliste sollte deshalb zusätzlich enthalten:

- Zweck und Rechtsgrundlage für jede erhobene E-Mail-Adresse
- Link zur eigenen Datenschutzerklärung
- dokumentierter Umgang mit Auskunft, Export, Abmeldung und Löschung
- keine Erhebung sensibler Daten im Lead-Magnet-Flow
- definierte Aufbewahrungsfrist für Kontakt- und Kampagnendaten

ManyChat bietet im Kontaktbereich die Aktionen `Unsubscribe from bot`, `Unsubscribe from Email`, `Download Contact Data` und `Delete Contact Data`. Eine Löschung kann Profilinformationen, Custom Fields, Tags, E-Mail-Adressen, Telefonnummern und Chatverläufe umfassen. [Managing User Data / GDPR Compliance](https://help.manychat.com/hc/en-us/articles/14281070595100-Managing-User-Data-GDPR-Compliance)

## Übergabepaket aus Signal Room

Das bisher geplante ManyChat-Paket war fast vollständig. Folgende Felder sollten verbindlich in die Produktspezifikation aufgenommen werden:

```ts
type ManyChatHandoff = {
  leadMagnetId: string;
  leadMagnetVersion: string;
  automationName: string;
  reelId: string;
  reelUrl: string;
  spokenCta: string;
  captionCta: string;
  triggerKeyword: string;
  excludedKeywords?: string[];
  publicReplies: [string, string?, string?];
  openingDmEnabled: boolean;
  openingDmText?: string;
  openingDmButtonLabel?: string;
  emailCollectionEnabled: boolean;
  emailRequestText?: string;
  followGateEnabled: boolean;
  followRequestText?: string;
  deliveryText: string;
  deliveryUrl: string;
  deliveryLinkLabel: string;
  followUpEnabled: boolean;
  followUpDelay?: string;
  followUpText?: string;
  campaignTag: string;
  deliveryTag?: string;
  privacyNoticeUrl?: string;
  offerOrGoal?: string;
  approvedAt?: string;
};
```

Zusätzlich braucht die Übergabe eine menschlich prüfbare Ablaufansicht, die die genaue Nachrichtenreihenfolge zeigt. Signal Room darf ManyChat nicht selbst veröffentlichen, bevor eine Person Reel-Zuordnung, Texte, Links, Datenschutzangaben und Timing bestätigt hat.

## Quellenverzeichnis

- [Quick Automation: Auto-DM links from comments](https://help.manychat.com/hc/en-us/articles/16654065283100-Quick-Automation-Auto-DM-links-from-comments)
- [Instagram Post and Reel Comments trigger](https://help.manychat.com/hc/en-us/articles/14281316989724-Instagram-Post-and-Reel-Comments-trigger)
- [Understanding messaging windows](https://help.manychat.com/hc/en-us/articles/23358636027932-Understanding-messaging-windows)
- [Content Block types](https://help.manychat.com/hc/en-us/articles/14281196200604-Content-Block-types)
- [How to preview automations in ManyChat](https://help.manychat.com/hc/en-us/articles/14281198254620-How-to-preview-automations-in-Manychat)
- [How to connect Instagram to ManyChat](https://help.manychat.com/hc/en-us/articles/14281290924444-How-to-connect-Instagram-to-Manychat)
- [Conversation Routing for Instagram](https://help.manychat.com/hc/en-us/articles/14281188830748-Conversation-Routing-for-Instagram)
- [Refresh permissions](https://help.manychat.com/hc/en-us/articles/14281464342684-Refresh-permissions)
- [Instagram automation troubleshooting](https://help.manychat.com/hc/en-us/articles/14281308423452-Instagram-automation-troubleshooting)
- [Buttons](https://help.manychat.com/hc/en-us/articles/14281157003292-Buttons)
- [General automation troubleshooting](https://help.manychat.com/hc/en-us/articles/14281479971996-General-automation-troubleshooting)
- [Managing User Data / GDPR Compliance](https://help.manychat.com/hc/en-us/articles/14281070595100-Managing-User-Data-GDPR-Compliance)
- [ManyChat Privacy Policy](https://manychat.com/legal/privacy)
- [ManyChat Data Processing Addendum](https://manychat.com/legal/dpa-16092024)

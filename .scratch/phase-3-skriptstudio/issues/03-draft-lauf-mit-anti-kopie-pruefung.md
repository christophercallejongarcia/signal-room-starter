# 03 — Draft-Lauf mit Anti-Kopie-Prüfung

**What to build:** Aus der gewählten Hook-Option entsteht das vollständige Skript als Abschnittsliste (Hook, zwei bis fünf Beats, optionale Übergänge, CTA). Der Hook-Abschnitt ist wörtlich der gewählte Hook; eine Bridge-Antwort mit anderem Hook wird abgelehnt. Vor dem Speichern läuft eine deterministische Anti-Kopie-Prüfung: kein Satz ab acht Wörtern (Konfigurationskonstante) darf normalisiert wörtlich in einem mitgegebenen Transkript oder einer Caption stehen; ein Treffer lehnt den Lauf mit dem zitierten Satz ab und das Skript bleibt in `hook-selection`. Ein erfolgreicher Lauf zieht das Skript auf `draft`. Ein zweiter Draft-Lauf ersetzt die Abschnitte vollständig und erhöht die Revision; nie schreiben zwei Läufe zugleich. Demo-Modus antwortet mit einem festen Beispiel-Entwurf.

**Blocked by:** 02 — Develop Idea eröffnet Skriptprojekt mit Hook-Lauf

**Status:** done

- [x] `POST /api/scripts/<id>/draft` mit gewählter Option und Framework; nur aus `hook-selection` oder `draft`, sonst Konflikt mit Grund
- [x] Neuer Bridge-Endpunkt `/v1/script-draft` mit festem Schema: Eingabe wie beim Hook-Lauf plus gewählter Hook und Angle; Ausgabe die Abschnittsliste; Prompt-Regeln wie in Ticket 02
- [x] Anti-Kopie-Prüfung deterministisch vor dem Speichern (Acht-Wörter-Grenze als Konfigurationskonstante, Normalisierung auf Kleinschreibung und Leerraum); Ablehnung nennt den Satz
- [x] Hook-Abweichung wird abgelehnt; der Hook-Abschnitt wird aus der gewählten Option gesetzt
- [x] Zweiter Lauf ersetzt die Abschnitte vollständig und erhöht die Revision; `runId`-Claim verhindert parallele Läufe, Fehler gibt den Claim frei und zeigt die Ursache mit erneuter Aktion
- [x] Tests: Antwort-Validierung mit echtem Transkript-Fixture (Anti-Kopie-Treffer, Hook-Abweichung, gültige Abschnitte); Lauf-Funktion mit Fakes (Draft aus falscher Stufe ist Konflikt, Ersetzen mit Revisionssprung); Bridge-Vertrag des neuen Endpunkts

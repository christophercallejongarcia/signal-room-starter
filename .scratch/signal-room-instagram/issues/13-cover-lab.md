# 13 — Cover-Lab für Reel und YouTube

**What to build:** Aus einer entwickelten Idee entstehen Cover-Varianten in beiden Formaten, die Chris wirklich braucht: 4:5 für Instagram-Reels und 16:9 für YouTube. Chris wählt das Format und ob das Cover faceless oder "mit Gesicht" sein soll. Der Bridge erzeugt pro Lauf drei Cover-Pakete (Text-Overlay, Bildidee, Farbwelt) und rendert sie über Codex (GPT Image). Bilder werden lokal gespeichert und an der Idee angezeigt; ein Paket lässt sich einzeln neu rendern. Beide Formate koexistieren an derselben Idee: ein 16:9-Lauf verdrängt einen vorhandenen 4:5-Lauf nicht.

Das Overlay wird pro Format anders gedacht. Im 4:5-Reel-Cover steht der Text im oberen Drittel, weil die Instagram-Oberfläche unten überlagert. Im 16:9-YouTube-Cover steht er seitlich, damit die Laufzeit-Plakette unten rechts nichts verdeckt.

**Blocked by:** 08 — Ideas: Capture und Develop

**Status:** ready-for-agent

- [ ] Format ist Teil der Anfrage: `reel` (4:5) oder `youtube` (16:9), an einer Stelle definiert, nicht pro Aufrufer
- [ ] Prompt-Template pro Format, das Slop vermeidet (ein Fokus, max. vier Wörter Overlay, hoher Kontrast, sichere Zone je Format)
- [ ] Drei Pakete pro Lauf, jedes einzeln renderbar
- [ ] Beide Formate liegen nebeneinander an der Idee; ein Lauf im einen Format lässt den anderen unberührt
- [ ] Bilder lokal unter einem gitignored Verzeichnis, Pfad und Format an der Idee gespeichert
- [ ] Bridge meldet fehlendes Codex-Login verständlich
- [ ] Test: Paket-Schema-Validierung und die Format-abhängige Prompt-Ableitung

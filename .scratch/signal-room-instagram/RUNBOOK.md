# Runbook — Befehle in Reihenfolge

Einmalig vor dem Start (Terminal, nicht Claude):

    cd /Users/cristobalcallejongarcia/dev/signal-room-starter
    npm run dev:web          # Terminal 1, bleibt offen
    npx convex dev           # Terminal 2, bleibt offen
    codex login              # einmalig, für Ticket 07 und später

Pro Ticket in Claude Code: erst `/clear`, dann den Befehl. Nach jedem Ticket kurz prüfen (Punkt "Check"), dann weiter.

## Runde 1: Fundament

/clear
/implement .scratch/signal-room-instagram/issues/01-glossar-und-adrs.md
Check: CONTEXT.md und docs/adr/ existieren

/clear
/implement .scratch/signal-room-instagram/issues/03-outlier-view-konsistent.md
Check: localhost:3000, Outlier-Zähler == Karten, keine Demo-Creators mehr

/clear
/implement .scratch/signal-room-instagram/issues/02-cover-cache.md
Check: Refresh drücken, data/covers/ füllt sich

/clear
/implement .scratch/signal-room-instagram/issues/05-delta-refresh-mit-run-log.md
Check: Profile zeigt Runs

## Runde 2: Ideen-Produktion (der eigentliche Nutzen)

/clear
/implement .scratch/signal-room-instagram/issues/07-strategy-provider-codex-mit-echter-evidenz.md
Check: npm run bridge in Terminal 3, dann "Generate angle" in Ideas liefert deutsche Antwort aus echten Reels

/clear
/implement .scratch/signal-room-instagram/issues/08-ideas-capture-und-develop.md
Check: Idee anlegen, Develop, Storyboard erscheint und bleibt nach Reload

/clear
/implement .scratch/signal-room-instagram/issues/09-hooks-board.md
Check: Transkript einfügen, 10 Hooks gruppiert, History rechts

## Runde 3: Übersicht und Automatik

/clear
/implement .scratch/signal-room-instagram/issues/04-creator-detailseite.md

/clear
/implement .scratch/signal-room-instagram/issues/10-format-signals-aus-captions.md

/clear
/implement .scratch/signal-room-instagram/issues/06-daily-watch-cron.md
Check: Convex-Dashboard → Crons zeigt den Eintrag

/clear
/implement .scratch/signal-room-instagram/issues/11-taegliches-briefing.md

/clear
/implement .scratch/signal-room-instagram/issues/12-eigener-account-im-profile.md

## Runde 4: Nice-to-have

/clear
/implement .scratch/signal-room-instagram/issues/13-cover-lab.md

/clear
/implement .scratch/signal-room-instagram/issues/14-trend-radar-instagram-hashtags.md

/clear
/implement .scratch/signal-room-instagram/issues/15-monatlicher-format-review.md

## Zwischendurch

Nach Runde 1 und nach Runde 2 einmal:

/clear
/improve-codebase-architecture

Wenn ein Ticket hakt (Apify liefert anderes Format, Test flackert):

/diagnosing-bugs <was kaputt ist>

Wenn du ein Ticket vor dem Bauen nochmal schärfen willst:

/grill-with-docs .scratch/signal-room-instagram/issues/NN-....md
danach /implement wie oben

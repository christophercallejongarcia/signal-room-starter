#!/bin/zsh
# Pflegt die kuratierten Dossier-Creator (Audit-Klasse A+B) in Signal Room ein.
# Sequenziell, ein Backfill pro Creator, Log unter /tmp/creator-import.log.

LOG=/tmp/creator-import.log
: > "$LOG"

DE=(sebastianschinzel ully.lemisa floknowsai _robintamba_ welter.kevin florent_preusser moritz.maaker max.froehlich ki_agenten_werkstatt henrikundmaik ai.mentors feliciasimon._ sven_schnurr leon.marivo maikeneuheisel arbeitemitki)
EN=(willfrancis valeridoesai realrileybrown nateherkai liamjohnston.ai chase.h.ai zachdoesai_ davidondrej1 sarainwondertech robonuggets matthewberman_ai drcintas liamottley opusjake cindiezhu gregisenberg softgirlnocode justyn.ai)

add() {
  local handle=$1 market=$2
  local start=$(date +%s)
  local response
  response=$(curl -s -m 290 -X POST http://localhost:3000/api/creators \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"$handle\",\"network\":\"instagram\",\"market\":\"$market\"}")
  local secs=$(( $(date +%s) - start ))
  echo "[$(date +%H:%M:%S)] $market @$handle (${secs}s): $response" >> "$LOG"
}

for handle in "${DE[@]}"; do add "$handle" de; done
for handle in "${EN[@]}"; do add "$handle" en; done

echo "DONE $(date +%H:%M:%S)" >> "$LOG"

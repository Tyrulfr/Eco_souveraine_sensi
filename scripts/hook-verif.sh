#!/usr/bin/env bash
# Hook PostToolUse (Edit|Write|MultiEdit) : vérification déterministe après chaque édition.
# Lance lint + typecheck + validation du contenu sur le projet.
# Code 2 en cas d'échec : la sortie d'erreur est renvoyée à Claude, qui doit corriger.
set -uo pipefail

entree="$(cat)"
fichier="$(printf '%s' "$entree" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);process.stdout.write(j.tool_input?.file_path??"")}catch{}})')"

# Ne vérifier que les fichiers du projet qui comptent pour le build.
case "$fichier" in
  *.js|*.mjs|*.json|*.html|*.css) ;;
  *) exit 0 ;;
esac
case "$fichier" in
  */node_modules/*|*/dist/*|*/.claude/*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}" || exit 0
if [ ! -d node_modules ]; then
  echo "hook-verif : node_modules absent, lancer « npm ci »." >&2
  exit 2
fi

sortie="$(npm run -s verifier 2>&1)"
code=$?
if [ $code -ne 0 ]; then
  printf 'Vérification échouée après édition de %s :\n%s\n' "$fichier" "$sortie" >&2
  exit 2
fi
exit 0

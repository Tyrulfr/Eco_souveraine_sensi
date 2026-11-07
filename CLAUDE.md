# Le Gâteau de 100 €

Formation en ligne (fr-FR) : comprendre l'économie des nations par la dette,
pour voter en connaissance de cause. Lycéens et adultes, sans prérequis.
Amilitante, ancrée dans l'actualité. Deux parcours emboîtés : L'essentiel (4 h)
et Le citoyen éclairé (20 h : six modules de 2 h et quatre ateliers de
décryptage). Vision : `docs/vision.md`. `ETHICS.md` prime sur tout le reste.

## Architecture (version légère, sans framework)

- `index.html` : page unique ; routage par ancre `#/`, `#/module/<slug>`,
  `#/simulateur`, `#/sources`, `#/formateur`.
- `src/app.js` : pages et routage (`#/module/<slug>/<chapitre>`) ; `src/noyau.js` :
  état, `t()`, `h()`, `<Chiffre>` ; `src/jeux.js` : activités ; `src/graphiques.js`.
- `src/lib.js` : fonctions pures (formatage des chiffres, jetons, progression).
- `src/validation.js` : règles de contenu, partagées par scripts, tests et hook.
- `src/engine.js` (lot 3) : moteur du simulateur, pur, sans DOM.
- `data/formation.json` : tout le contenu ; `data/figures.json` : tous les
  chiffres ; `data/series.json` : séries historiques ; `data/ui.fr-FR.json` : textes.
- `assets/` : police Atkinson Hyperlegible (OFL) et illustrations SVG.

## Commandes

- `npm run verifier` : lint + typecheck + validation du contenu (lancé par le hook).
- `npm test` : tests `node --test` dans `tests/*.test.mjs`.
- `npm run build` : valide puis copie le site dans `dist/`.
- `npm run serve -- dist` : serveur local sur le port 8080.

## Conventions

- Code, identifiants, commits et contenus en français.
- Fichiers et identifiants de données en kebab-case (`dette-pib`, `gateau-100-euros`).
- Fonctions en camelCase ; composants d'interface en PascalCase (`DepthToggle`, `Chiffre`).
- Typage par JSDoc, vérifié par `tsc --checkJs --strict`. Aucun `any` implicite.
- Aucun texte d'interface dans `app.js` : passer par `t("clé")`.
- Aucun chiffre écrit en dur dans un contenu : `{{chiffre:id}}` uniquement.
- Statuts de chiffre : `verifie`, `a-verifier`, `a-completer`.
- Chaque concept : `{ id, titre, couche1, couche2, couche3, sources[], chiffres[] }`.
  Couche 1 : moins de 15 mots, langage courant sans jargon, image et texte alternatif.
  Couche 2 : mécanisme, ordre de grandeur, comparaison, au moins un chiffre.
  Couche 3 : enjeu et question ouverte, sans réponse.
- Un module `apercu` n'a pas de contenu ; un module `complet` a une lecture opposée.
- Structure cible d'un module : accroche (actualité datée), échelle, notions,
  tendances, regards (histoire, philosophie, psychologie, société), lecture
  opposée, quiz. Chaque question du quiz déclare sa `profondeur`.
- Un module = chapitres courts (`duree` en minutes, total ≤ 2 h) + bilan.
  Jeux disponibles : estimation, ligne, partage, echelle (vues), vrai-faux,
  classement, verif, courbe. Couleurs de données : `--serie-a`, `--serie-b`.
- Montants du simulateur en euros entiers (pas de flottants en comptabilité).
- Persistance : `localStorage`, clé `gateau100.progression.v1`. Rien d'autre.
- Messages de commit en français, au présent de l'infinitif (« Ajouter… »).

## Extensions Claude Code

- Skill `ajouter-module` : procédure d'ajout d'un module.
- Sous-agent `relecteur-pedago` : relecture en lecture seule, rapport par gravité.
- Hook PostToolUse : `scripts/hook-verif.sh` après chaque édition.

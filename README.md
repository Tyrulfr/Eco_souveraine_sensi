# Le Gâteau de 100 €

Formation en ligne gratuite pour **comprendre l'économie des nations par la
dette** et voter en connaissance de cause en 2027. Pour les lycéens et les
adultes, sans aucun prérequis ; ancrée dans l'actualité, amilitante.

Deux parcours emboîtés : **L'essentiel** (4 h) et **Le citoyen éclairé** (20 h :
six modules, un laboratoire des choix économiques, quatre ateliers de
décryptage de discours). Chaque notion existe à trois profondeurs, chaque
chiffre affiche sa source au clic, et la formation ne dit jamais pour qui
voter. Voir [docs/vision.md](docs/vision.md) et [ETHICS.md](ETHICS.md).

Site en ligne : https://tyrulfr.github.io/Eco_souveraine_sensi/
(GitHub Pages publie automatiquement la branche `main`, dossier racine).

## Démarrer

```bash
npm ci
npm run build              # valide le contenu puis construit dist/
npm run serve -- dist      # http://localhost:8080/
```

Le site est un ensemble de fichiers statiques sans dépendance d'exécution : il
se publie tel quel (dossier `dist/`) sur Netlify, GitHub Pages ou n'importe quel
serveur web. Il doit être servi en HTTP : ouvert directement depuis le disque
(`file://`), le navigateur bloque le chargement des fichiers JSON.

## Contribuer

- `main` est la branche publiée : on n'y pousse que du code vérifié.
- Chaque lot est développé sur une branche `lot-N`, puis fusionné dans `main`
  par une pull request une fois la CI au vert ; la branche est ensuite supprimée.

## Vérifier

```bash
npm run verifier   # lint + typecheck + validation du contenu
npm test           # tests unitaires et tests de contenu
```

## Organisation

| Chemin | Rôle |
|---|---|
| `index.html`, `src/app.js`, `src/styles.css` | interface (JavaScript natif) |
| `src/lib.js`, `src/validation.js` | fonctions pures et règles de contenu |
| `data/formation.json` | modules, concepts en trois couches, quiz, sources |
| `data/figures.json` | registre des chiffres sourcés et datés |
| `data/ui.fr-FR.json` | textes d'interface |
| `assets/` | police Atkinson Hyperlegible (licence OFL) et illustrations |
| `docs/` | cahier des charges, plan des lots, guide formateur, recette |
| `.claude/` | skill, sous-agent relecteur et hook pour Claude Code |

## Vie privée

Aucun cookie, aucune mesure d'audience, aucun appel à un service tiers. Seule la
progression pédagogique est gardée dans le navigateur (`localStorage`).

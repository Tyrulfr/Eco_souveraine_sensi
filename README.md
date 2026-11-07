# Le Gâteau de 100 €

Formation en ligne gratuite à la lecture du budget public et au choix
économique éclairé, pour tous de 10 à 90 ans. Six modules de deux heures,
utilisables en classe, en médiathèque ou en autonomie, sur mobile d'abord.

Chaque notion existe à trois profondeurs (l'essentiel, les chiffres, le débat),
chaque chiffre affiche sa source au clic, et la formation ne dit jamais pour
qui voter : voir [ETHICS.md](ETHICS.md).

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

---
name: ajouter-module
description: Procédure complète pour passer un module de la formation « Le Gâteau de 100 € » de l'état aperçu à l'état complet, ou en ajouter un nouveau. Couvre les concepts en trois couches, l'enregistrement des chiffres sourcés dans data/figures.json, la lecture opposée, l'activité, le quiz, les tests et la navigation. Utiliser dès qu'on écrit ou modifie le contenu d'un module.
---

# Ajouter ou compléter un module

Avant tout, relis `ETHICS.md`. Ses règles l'emportent sur cette procédure.

## 1. Cadrer

1. Repère le module dans `data/formation.json` (`modules[]`). S'il n'existe pas,
   ajoute-le à la bonne place avec `id` (`m7`…), `slug` en kebab-case unique,
   `numero`, `titre`, `duree: "2 h"`, `statut: "apercu"` et un `resume`.
2. Rédige 3 à 5 `objectifs` observables (verbes : distinguer, lire, expliquer,
   comparer, formuler).
3. Liste les concepts (4 à 6 par module de 2 h) et les chiffres dont chacun a
   besoin. Liste à part les chiffres que tu ne peux pas sourcer.

## 2. Enregistrer les chiffres d'abord

Pour chaque chiffre, ajoute une entrée dans `data/figures.json` :

```json
{ "id": "kebab-case", "libelle": "…", "valeur": 12.3, "unite": "% PIB",
  "date": "2025", "source": "Émetteur, titre du document", "url": "https://…",
  "dateVerification": "AAAA-MM-JJ", "statut": "a-verifier", "note": "…" }
```

- `unite` : `% PIB`, `%`, `Md€`, `€` ou `pb`. Fourchette : `"valeur": [min, max]`.
- N'invente **jamais** une valeur. Si elle manque : `"valeur": null`,
  `"statut": "a-completer"`, et signale-le à l'utilisateur en fin de tâche.
- Ne mets `verifie` que si l'utilisateur confirme avoir contrôlé la source primaire.
- Si une valeur est lue dans une source secondaire (presse, agrégateur), dis-le
  dans `note`.

## 3. Écrire chaque concept en trois couches

```json
{ "id": "…", "titre": "…",
  "couche1": { "texte": "…", "image": "assets/img/….svg", "alt": "…" },
  "couche2": { "mecanisme": "…", "ordreDeGrandeur": "… {{chiffre:id}} …", "comparaison": "…" },
  "couche3": { "enjeu": "…", "questionOuverte": "… ?" },
  "sources": ["id-bibliographie"], "chiffres": ["id", "…"] }
```

- **Couche 1** : moins de 15 mots, phrases courtes, vocabulaire d'un enfant de
  CE2 (pas de « PIB », « solde », « structurel »…). Crée l'illustration SVG
  dans `assets/img/` (viewBox 160×120, contours foncés) et un `alt` qui décrit
  l'image.
- **Couche 2** : le mécanisme, un ordre de grandeur et une comparaison. Au
  moins un `{{chiffre:id}}`. Aucun chiffre en dur : seules la métaphore
  « 100 € » et les années sont tolérées.
- **Couche 3** : un enjeu de légitimité présenté avec au moins deux points de
  vue, puis une question ouverte terminée par « ? ». Aucune réponse, aucun
  « il faut ».
- Déclare dans `chiffres` chaque id cité dans les textes.

## 4. Compléter le module

- `sequences` : étapes typées `situation`, `question`, `concepts`
  (`"concepts": ["id"]`), `grille`, `debat`. Chaque concept apparaît une fois.
- `activite` (classement) : 5 à 8 items, chacun avec un `commentaire` qui
  explique la réponse.
- `quiz` : 3 à 5 questions ; varie la position de la bonne réponse ; chaque
  `explication` dit pourquoi.
- `lectureOpposee` : `{ "titre": "La lecture opposée", "texte": "…", "source": "id" }`.
  La source est ajoutée dans `sources[]` avec `apport` et `vigilance`.
- `glossaire` : chaque terme technique employé en couche 2 ou 3.
- Passe `statut` à `"complet"`.

## 5. Interface et navigation

- La navigation (accueil, précédent / suivant) se construit depuis
  `modules[]` : rien à coder. Vérifie seulement l'ordre des `numero`.
- Tout nouveau libellé d'interface va dans `data/ui.fr-FR.json`, jamais dans
  `src/app.js`.

## 6. Tests

- Si le module introduit une règle nouvelle (nouveau type d'étape, d'activité…),
  ajoute sa validation dans `src/validation.js` et un test dans `tests/`.
- Mets à jour le test « six modules » de `tests/contenu.test.mjs` si le nombre
  de modules change.

## 7. Vérifier et rendre compte

1. `npm run verifier` puis `npm test` puis `npm run build` : copie les sorties
   réelles dans ton compte rendu.
2. Lance le sous-agent `relecteur-pedago` sur le module et corrige toutes les
   gravités « bloquant » et « majeur ».
3. Contrôle dans un navigateur (`npm run serve -- dist`) : les trois
   profondeurs, l'ouverture d'un chiffre, le quiz, l'activité, au clavier seul.
4. Termine par la liste des chiffres `a-verifier` et `a-completer` du module.
5. Commit atomique en français : « Ajouter le module N : titre ».

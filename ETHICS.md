# Règles déontologiques

Ce fichier est la référence de toute revue de code et de contenu. Une
contribution qui enfreint l'une de ces règles n'est pas fusionnée, quelle que
soit sa qualité technique.

## 1. Ne jamais dire comment voter

- Aucun écran, texte, quiz ou résultat ne recommande un candidat, un parti, une
  tendance ou un vote.
- Les questions de la couche 3 restent ouvertes : aucune réponse n'est donnée,
  suggérée ou « corrigée ».
- Les formulations prescriptives (« votez », « il faut voter », « le bon
  candidat »…) sont bloquées par `src/validation.js`. Le sous-agent
  `relecteur-pedago` traque les formes indirectes que le script ne voit pas.

## 2. Comparer des tendances, pas classer des personnes

- Le module 6 compare les priorités de la personne avec **cinq grandes
  tendances** : gauche radicale, gauche sociale-démocrate et écologiste,
  centre, droite libérale-conservatrice, droite nationale.
- La comparaison est **masquée par défaut** et ne s'affiche que si la personne
  active l'interrupteur « Comparer avec les grandes tendances ».
- L'affichage est un **tableau côte à côte**, sans score, sans pourcentage de
  proximité, sans classement. La personne conclut seule.
- L'ordre des tendances est tiré au hasard à chaque affichage.
- Chaque case cite sa source : programme publié (titre, page, date) ou vote
  public au Parlement (scrutin, date). Sans source : « position non
  documentée ». **Aucune position n'est résumée de mémoire.**
- Toutes les tendances reçoivent le même nombre de questions et le même format.

## 3. Montrer la lecture opposée

- Chaque module complet comporte un encadré « La lecture opposée », avec une
  source identifiable (auteur, titre, support, année).
- La lecture opposée est présentée avec le même soin que la lecture principale.

## 4. Ne jamais inventer un chiffre

- Tous les chiffres vivent dans `data/figures.json` avec valeur, unité,
  période, source, URL, date de vérification et statut.
- Aucun chiffre n'est écrit en dur dans un texte : on utilise
  `{{chiffre:id}}`. Exceptions tolérées : la métaphore « 100 € » et les années.
- Une donnée absente s'affiche « donnée à compléter », et elle est signalée.
- Le statut `verifie` n'est attribué que si la valeur a été relevée dans la
  source primaire officielle elle-même (document, date et lien cités).
  Une valeur lue dans la presse ou chez un agrégateur reste `a-verifier`.
- Les paramètres du simulateur sont des **hypothèses pédagogiques**, affichées
  comme telles, jamais comme des mesures.

## 5. Ne rien collecter

- Zéro cookie, zéro mesure d'audience, zéro appel à un service tiers (polices
  auto-hébergées).
- Aucune préférence politique ni donnée personnelle ne quitte l'appareil. Les
  réponses du module 6 sont calculées localement et ne sont **jamais
  enregistrées**, même dans `localStorage` (ce sont des opinions politiques,
  données sensibles au sens de l'article 9 du RGPD).
- Seule la progression pédagogique (profondeur, quiz, modules terminés) est
  gardée dans `localStorage`.
- Le vote du simulateur est fictif, anonyme et n'identifie personne.

## 6. Accessibilité

- WCAG 2.2 AA et RGAA 4.1 sont des critères de recette, pas des options.
- Aucune information portée par la seule couleur : un texte ou un symbole
  l'accompagne toujours.

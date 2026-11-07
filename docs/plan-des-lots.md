# Plan des lots

Dispositif retenu : site statique léger sur le modèle de Proj_GE (`index.html`
+ données JSON), sans framework ni backend. Décisions du commanditaire du
7 novembre 2026 :

- le module 6 aide chacun à choisir un programme pour 2027 en connaissance de
  cause, sans jamais lui dire pour qui voter ;
- la comparaison se fait avec **cinq grandes tendances** et non avec des
  candidats, car peu de programmes complets sont publiés ;
- elle prend la forme d'un **tableau côte à côte, sans score**, masqué derrière
  un interrupteur.

| Lot | Contenu | État |
|---|---|---|
| 1 | Socle, CLAUDE.md, ETHICS.md, modèle de données, sélecteur de profondeur, composant Chiffre, module 1 complet, extensions Claude Code | livré, en attente de validation |
| 2 | Modules 2 à 6 en trois couches ; module 6 : priorités, grille de lecture d'un programme, tableau des tendances (`data/tendances.json`) | à faire |
| 3 | Moteur du simulateur (`src/engine.js`) et tests, dont l'équilibre comptable ; interface au clavier ; graphique des votes fictifs | à faire |
| 4 | Accessibilité (audit axe et Lighthouse ≥ 95), tailles de texte, mode dys, indicateur de lisibilité | à faire |
| 5 | Guide formateur, page sources enrichie, plan de recette | à faire |

## Points ouverts

- Cahier des charges de cette formation : non fourni.
- Chiffres corrigés le 7 novembre 2026 d'après l'Insee (comptes 2025 publiés le
  29 mai 2026) : dépenses 57,3 %, recettes 52,2 %, déficit 5,1 %, dette 115,7 %
  du PIB. Le jeu initial mêlait des années (5,4 % était le déficit 2023).
- Restent « à vérifier » faute d'accès au document officiel : charge d'intérêts
  2026 et 2027 (rapport annexé au PLF 2027), taux à 10 ans, écart avec
  l'Allemagne, part des non-résidents (Agence France Trésor).

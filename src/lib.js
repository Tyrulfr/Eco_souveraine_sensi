// Fonctions pures partagées par l'interface (navigateur) et les scripts de contrôle (Node).
// Aucune dépendance au DOM ici : tout est testable avec `node --test`.

/**
 * @typedef {"% PIB" | "%" | "Md€" | "€" | "pb" | "M hab."} Unite
 * @typedef {"verifie" | "a-verifier" | "a-completer"} StatutFigure
 *
 * @typedef {Object} Figure
 * @property {string} id
 * @property {string} libelle
 * @property {number | [number, number] | null} valeur  null = donnée manquante
 * @property {Unite} unite
 * @property {boolean} [approx]       vrai si la valeur est un ordre de grandeur (« ≈ »)
 * @property {string | null} date     période couverte par la donnée (ex. "2026")
 * @property {string | null} source   émetteur et document
 * @property {string | null} url
 * @property {string} dateVerification  AAAA-MM-JJ
 * @property {StatutFigure} statut
 * @property {string} [note]
 *
 * @typedef {Object} Source
 * @property {string} id
 * @property {string} auteurs
 * @property {string} annee
 * @property {string} titre
 * @property {string} support
 * @property {string | null} url
 * @property {string} apport
 * @property {string} vigilance
 *
 * @typedef {Object} Concept
 * @property {string} id
 * @property {string} titre
 * @property {{ texte: string, image: string, alt: string }} couche1
 * @property {{ mecanisme: string, ordreDeGrandeur: string, comparaison: string }} couche2
 * @property {{ enjeu: string, questionOuverte: string }} couche3
 * @property {string[]} sources   identifiants de Formation.sources
 * @property {string[]} chiffres  identifiants de figures.json
 *
 * @typedef {Object} Etape
 * @property {"situation" | "question" | "concepts" | "grille" | "debat" | "schema" | "accroche" | "echelle" | "tendances" | "regard" | "estimation" | "ligne" | "partage" | "vrai-faux" | "classement" | "verif" | "courbe"} type
 * @property {"histoire" | "philosophie" | "ethique" | "psychologie" | "societe"} [discipline]  regard : discipline
 * @property {string} [source]         accroche, regard : identifiant de Formation.sources
 * @property {string} [texte]
 * @property {string[]} [concepts]
 * @property {string} [titre]          schéma : titre affiché
 * @property {string} [image]          schéma : chemin du SVG
 * @property {string} [alt]            schéma : texte alternatif court
 * @property {string[]} [description]  schéma : description détaillée, pas à pas
 * @property {string} [citation]       accroche : citation exacte d'un discours (chiffres permis), avec source
 * @property {string} [question]       estimation, verif : la question posée
 * @property {string} [chiffre]        estimation : identifiant de la figure à deviner
 * @property {number} [min]            estimation : borne basse du curseur (dans l'unité de la figure)
 * @property {number} [max]            estimation : borne haute du curseur
 * @property {number} [pas]            estimation : pas du curseur
 * @property {string} [explication]    estimation, ligne, verif : explication affichée après réponse
 * @property {string} [consigne]       ligne, partage, classement, vrai-faux : consigne
 * @property {string} [gauche]         ligne : libellé de l'extrémité gauche
 * @property {string} [droite]         ligne : libellé de l'extrémité droite
 * @property {string} [cible]          ligne : libellé du nombre à placer
 * @property {[number, number, number]} [valeurs]  ligne : gauche, droite, cible
 * @property {PartGateau[]} [parts]    partage : parts du gâteau, chacune liée à une figure (en %)
 * @property {VueEchelle[]} [vues]     echelle interactive : différentes façons de lire un même montant
 * @property {CarteVraiFaux[]} [cartes]  vrai-faux : affirmations à juger
 * @property {{ id: string, label: string }[]} [categories]  classement : catégories
 * @property {ItemClassement[]} [items]  classement : éléments à classer
 * @property {Choix[]} [choix]         verif : choix proposés
 * @property {string} [reponse]        verif : identifiant du bon choix
 * @property {string} [serie]          courbe : identifiant de data/series.json
 * @property {{ annee: number, libelle: string }[]} [evenements]  courbe : repères annotés
 *
 * @typedef {{ id: string, label: string, chiffre: string }} PartGateau
 * @typedef {{ op: "div", a: string, b: string, facteurA: number, facteurB: number, multiplicateur: number, arrondi: number, unite: string }} Calcul
 * @typedef {{ id: string, libelle: string, chiffre?: string, calcul?: Calcul, texte: string }} VueEchelle
 * @typedef {"exact" | "trompeur" | "faux" | "inverifiable"} Verdict
 * @typedef {{ id: string, affirmation: string, verdict: Verdict, explication: string }} CarteVraiFaux
 *
 * @typedef {Object} Serie
 * @property {string} id
 * @property {string} libelle
 * @property {"% PIB" | "Md€"} unite
 * @property {[number, number][]} points  couples [année, valeur]
 * @property {string} source
 * @property {string | null} url
 * @property {string} dateVerification
 * @property {"verifie" | "a-verifier"} statut
 * @property {string} [note]
 *
 * @typedef {{ id: string, titre: string, duree: number, etapes: Etape[] }} Sequence  duree en minutes
 * @typedef {{ id: string, texte: string }} Choix
 * @typedef {{ id: string, question: string, choix: Choix[], reponse: string, explication: string, profondeur: Profondeur }} Question  profondeur : à partir de laquelle la réponse a été enseignée
 * @typedef {{ id: string, texte: string, reponse: string, commentaire: string }} ItemClassement
 * @typedef {{ type: "classement", titre: string, consigne: string, categories: { id: string, label: string }[], items: ItemClassement[] }} Activite
 * @typedef {{ titre: string, texte: string, source: string }} LectureOpposee
 *
 * @typedef {Object} Module
 * @property {string} id
 * @property {string} slug
 * @property {number} numero
 * @property {"module" | "seance" | "atelier"} type
 * @property {string} titre
 * @property {string} duree
 * @property {"complet" | "apercu"} statut
 * @property {string} [badge]  nom du badge gagné en terminant le module
 * @property {string} resume
 * @property {string[]} objectifs
 * @property {Sequence[]} sequences
 * @property {Concept[]} concepts
 * @property {Activite | null} activite
 * @property {Question[]} quiz
 * @property {LectureOpposee | null} lectureOpposee
 * @property {{ terme: string, definition: string }[]} glossaire
 *
 * @typedef {Object} Formation
 * @property {Record<string, string>} meta
 * @property {string[]} gardeFous
 * @property {Module[]} modules
 * @property {Parcours[]} parcours
 * @property {Source[]} sources
 *
 * @typedef {{ id: string, titre: string, duree: string, resume: string, modules: string[] }} Parcours
 *
 * @typedef {{ type: "texte", valeur: string } | { type: "chiffre", id: string }} Segment
 * @typedef {1 | 2 | 3} Profondeur
 * @typedef {{ quiz?: number, quizTotal?: number, activite?: boolean, termine?: boolean, chapitresVus?: number[] }} ProgressionModule
 * @typedef {{ version: 1, profondeur: Profondeur, modules: Record<string, ProgressionModule> }} Progression
 */

export const LIBELLE_A_COMPLETER = "donnée à compléter";
export const MOTS_MAX_COUCHE1 = 15;

const JETON = /\{\{chiffre:([a-z0-9-]+)\}\}/g;

/** @type {Record<Unite, string>} */
const SUFFIXES = { "% PIB": " % du PIB", "%": " %", "Md€": " Md€", "€": " €", pb: " points de base", "M hab.": " millions d'habitants" };

const nombreFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/**
 * Valeur lisible d'une figure, ou « donnée à compléter ».
 * @param {Figure} figure
 * @returns {string}
 */
export function formaterValeur(figure) {
  const v = figure.valeur;
  if (v === null) return LIBELLE_A_COMPLETER;
  const suffixe = SUFFIXES[figure.unite];
  const prefixe = figure.approx ? "≈ " : "";
  if (Array.isArray(v)) {
    return `${prefixe}${nombreFr.format(v[0])} à ${nombreFr.format(v[1])}${suffixe}`;
  }
  return `${prefixe}${nombreFr.format(v)}${suffixe}`;
}

/**
 * Découpe un texte contenant des jetons {{chiffre:id}}.
 * @param {string} texte
 * @returns {Segment[]}
 */
export function decouperTexte(texte) {
  /** @type {Segment[]} */
  const segments = [];
  let curseur = 0;
  for (const m of texte.matchAll(JETON)) {
    const debut = m.index ?? 0;
    if (debut > curseur) segments.push({ type: "texte", valeur: texte.slice(curseur, debut) });
    segments.push({ type: "chiffre", id: m[1] ?? "" });
    curseur = debut + m[0].length;
  }
  if (curseur < texte.length) segments.push({ type: "texte", valeur: texte.slice(curseur) });
  return segments;
}

/**
 * Identifiants de chiffres cités dans un texte.
 * @param {string} texte
 * @returns {string[]}
 */
export function chiffresCites(texte) {
  return [...texte.matchAll(JETON)].map((m) => m[1] ?? "");
}

/**
 * Nombre de mots (les apostrophes séparent : « l'argent » = 2 mots).
 * @param {string} texte
 * @returns {number}
 */
export function compterMots(texte) {
  return texte
    .replace(JETON, " X ")
    .split(/[\s'’]+/)
    .filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
}

/**
 * Nombre au format français, avec un nombre de décimales maximal.
 * @param {number} n
 * @param {number} [decimales]
 */
export function formaterNombre(n, decimales = 1) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: decimales }).format(n);
}

/**
 * Calcul de remise à l'échelle à partir de deux figures sourcées :
 * (a × facteurA) / (b × facteurB) × multiplicateur, arrondi au multiple voulu.
 * Renvoie null si une figure manque ou n'a pas de valeur simple.
 * @param {Calcul} c
 * @param {Map<string, Figure>} figures
 * @returns {number | null}
 */
export function calculer(c, figures) {
  const a = figures.get(c.a)?.valeur;
  const b = figures.get(c.b)?.valeur;
  if (typeof a !== "number" || typeof b !== "number" || b === 0) return null;
  const brut = ((a * c.facteurA) / (b * c.facteurB)) * c.multiplicateur;
  return Math.round(brut / c.arrondi) * c.arrondi;
}

/**
 * Position relative (0 à 1) d'une valeur sur une ligne linéaire allant de gauche à droite.
 * @param {number} gauche
 * @param {number} droite
 * @param {number} valeur
 */
export function positionSurLigne(gauche, droite, valeur) {
  return (valeur - gauche) / (droite - gauche);
}

/**
 * Écart entre une répartition proposée et la répartition réelle, part par part.
 * @param {Record<string, number>} propose
 * @param {Record<string, number>} reel
 * @returns {{ id: string, ecart: number }[]} trié du plus grand écart absolu au plus petit
 */
export function ecartsRepartition(propose, reel) {
  return Object.keys(reel)
    .map((id) => ({ id, ecart: (propose[id] ?? 0) - (reel[id] ?? 0) }))
    .sort((x, y) => Math.abs(y.ecart) - Math.abs(x.ecart));
}

/**
 * Questions du quiz visibles à une profondeur donnée.
 * @param {Question[]} quiz
 * @param {Profondeur} p
 * @returns {Question[]}
 */
export function questionsVisibles(quiz, p) {
  return quiz.filter((q) => q.profondeur <= p);
}

/**
 * Textes d'une couche donnée d'un concept, concaténés.
 * @param {Concept} c
 * @param {Profondeur} p
 * @returns {string[]}
 */
export function textesCouche(c, p) {
  if (p === 1) return [c.couche1.texte];
  if (p === 2) return [c.couche2.mecanisme, c.couche2.ordreDeGrandeur, c.couche2.comparaison];
  return [c.couche3.enjeu, c.couche3.questionOuverte];
}

/** @returns {Progression} */
export function progressionParDefaut() {
  return { version: 1, profondeur: 1, modules: {} };
}

export const CLE_STOCKAGE = "gateau100.progression.v1";

/**
 * Lit la progression ; tolère un stockage absent, bloqué ou corrompu.
 * @param {Pick<Storage, "getItem"> | null | undefined} stockage
 * @returns {Progression}
 */
export function lireProgression(stockage) {
  try {
    const brut = stockage?.getItem(CLE_STOCKAGE);
    if (!brut) return progressionParDefaut();
    const p = JSON.parse(brut);
    if (p?.version !== 1 || ![1, 2, 3].includes(p.profondeur) || typeof p.modules !== "object") {
      return progressionParDefaut();
    }
    return /** @type {Progression} */ (p);
  } catch {
    return progressionParDefaut();
  }
}

/**
 * @param {Pick<Storage, "setItem"> | null | undefined} stockage
 * @param {Progression} p
 * @returns {boolean} vrai si l'écriture a réussi
 */
export function ecrireProgression(stockage, p) {
  try {
    stockage?.setItem(CLE_STOCKAGE, JSON.stringify(p));
    return Boolean(stockage);
  } catch {
    return false;
  }
}

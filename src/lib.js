// Fonctions pures partagées par l'interface (navigateur) et les scripts de contrôle (Node).
// Aucune dépendance au DOM ici : tout est testable avec `node --test`.

/**
 * @typedef {"% PIB" | "%" | "Md€" | "€" | "pb"} Unite
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
 * @property {"situation" | "question" | "concepts" | "grille" | "debat" | "schema"} type
 * @property {string} [texte]
 * @property {string[]} [concepts]
 * @property {string} [titre]          schéma : titre affiché
 * @property {string} [image]          schéma : chemin du SVG
 * @property {string} [alt]            schéma : texte alternatif court
 * @property {string[]} [description]  schéma : description détaillée, pas à pas
 *
 * @typedef {{ id: string, titre: string, etapes: Etape[] }} Sequence
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
 * @property {string} titre
 * @property {string} duree
 * @property {"complet" | "apercu"} statut
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
 * @property {Source[]} sources
 *
 * @typedef {{ type: "texte", valeur: string } | { type: "chiffre", id: string }} Segment
 * @typedef {1 | 2 | 3} Profondeur
 * @typedef {{ quiz?: number, quizTotal?: number, activite?: boolean, termine?: boolean }} ProgressionModule
 * @typedef {{ version: 1, profondeur: Profondeur, modules: Record<string, ProgressionModule> }} Progression
 */

export const LIBELLE_A_COMPLETER = "donnée à compléter";
export const MOTS_MAX_COUCHE1 = 15;

const JETON = /\{\{chiffre:([a-z0-9-]+)\}\}/g;

/** @type {Record<Unite, string>} */
const SUFFIXES = { "% PIB": " % du PIB", "%": " %", "Md€": " Md€", "€": " €", pb: " points de base" };

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

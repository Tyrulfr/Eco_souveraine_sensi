// Règles de contenu vérifiées automatiquement (voir ETHICS.md).
// Utilisé par scripts/valider.mjs, par le hook post-édition et par les tests.

import { chiffresCites, compterMots, MOTS_MAX_COUCHE1 } from "./lib.js";

/**
 * @typedef {import("./lib.js").Figure} Figure
 * @typedef {import("./lib.js").Formation} Formation
 * @typedef {import("./lib.js").Module} Module
 * @typedef {{ gravite: "erreur" | "avertissement", chemin: string, message: string }} Constat
 */

const UNITES = ["% PIB", "%", "Md€", "€", "pb"];
const STATUTS = ["verifie", "a-verifier", "a-completer"];
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

// Un chiffre ne s'écrit jamais en dur : il passe par {{chiffre:id}}.
// Exceptions : la métaphore « 100 € » (nom de la formation) et les années.
const EXCEPTIONS_CHIFFRES = [/\b100 €/g, /\b(19|20)\d{2}\b/g];

// Formulations prescriptives interdites (ETHICS.md, règle 1).
const PRESCRIPTIONS = [
  /\bvotez\b/i,
  /\bil faut voter\b/i,
  /\bne votez pas\b/i,
  /\bvous devez voter\b/i,
  /\b(le|la) bon(ne)? candidat/i,
  /\bvotre candidat (idéal|est)\b/i,
  /\bla bonne réponse politique\b/i,
];

/**
 * @param {string} texte
 * @returns {boolean}
 */
function contientChiffreEnDur(texte) {
  let t = texte.replace(/\{\{chiffre:[a-z0-9-]+\}\}/g, "");
  for (const re of EXCEPTIONS_CHIFFRES) t = t.replace(re, "");
  return /\d/.test(t);
}

/**
 * @param {unknown} v
 * @returns {v is string}
 */
const nonVide = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * @param {unknown} figures
 * @returns {Constat[]}
 */
export function validerFigures(figures) {
  /** @type {Constat[]} */
  const constats = [];
  if (!Array.isArray(figures)) {
    return [{ gravite: "erreur", chemin: "figures", message: "doit être un tableau" }];
  }
  const vus = new Set();
  figures.forEach((f, i) => {
    const ch = `figures[${i}]${f?.id ? ` (${f.id})` : ""}`;
    /** @param {string} m */
    const err = (m) => constats.push({ gravite: "erreur", chemin: ch, message: m });
    /** @param {string} m */
    const avert = (m) => constats.push({ gravite: "avertissement", chemin: ch, message: m });
    if (!nonVide(f?.id) || !/^[a-z0-9-]+$/.test(f.id)) err("id manquant ou invalide (kebab-case)");
    if (vus.has(f?.id)) err("id en double");
    vus.add(f?.id);
    if (!nonVide(f?.libelle)) err("libelle manquant");
    if (!UNITES.includes(f?.unite)) err(`unite invalide : ${f?.unite}`);
    if (!STATUTS.includes(f?.statut)) err(`statut invalide : ${f?.statut}`);
    if (!nonVide(f?.dateVerification) || !DATE_ISO.test(f.dateVerification)) err("dateVerification manquante (AAAA-MM-JJ)");
    for (const champ of ["date", "source", "url"]) {
      if (!(champ in (f ?? {}))) err(`champ ${champ} absent (mettre null si inconnu)`);
    }
    const v = f?.valeur;
    const valeurOk =
      v === null ||
      (typeof v === "number" && Number.isFinite(v)) ||
      (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number" && Number.isFinite(x)) && v[0] <= v[1]);
    if (!valeurOk) err("valeur invalide (nombre, [min, max] ou null)");
    if (v === null && f?.statut !== "a-completer") err("valeur null : le statut doit être « a-completer »");
    if (f?.statut === "verifie" && (!nonVide(f?.source) || !nonVide(f?.url) || !nonVide(f?.date))) {
      err("statut « verifie » exige source, url et date");
    }
    if (f?.statut === "a-verifier") avert("chiffre à vérifier contre sa source primaire");
    if (f?.statut === "a-completer") avert("donnée à compléter");
  });
  return constats;
}

/**
 * @param {Formation} formation
 * @param {Figure[]} figures
 * @returns {Constat[]}
 */
export function validerFormation(formation, figures) {
  /** @type {Constat[]} */
  const constats = [];
  const idsFigures = new Set(figures.map((f) => f.id));
  const idsSources = new Set(formation.sources.map((s) => s.id));
  const idsConcepts = new Set();
  const slugs = new Set();

  /**
   * @param {string} chemin
   * @param {string} texte
   * @param {Set<string> | null} chiffresDeclares
   */
  const verifierTexte = (chemin, texte, chiffresDeclares) => {
    if (!nonVide(texte)) {
      constats.push({ gravite: "erreur", chemin, message: "texte vide" });
      return;
    }
    if (contientChiffreEnDur(texte)) {
      constats.push({ gravite: "erreur", chemin, message: "chiffre écrit en dur : utiliser {{chiffre:id}}" });
    }
    for (const re of PRESCRIPTIONS) {
      if (re.test(texte)) constats.push({ gravite: "erreur", chemin, message: `formulation prescriptive interdite (${re.source})` });
    }
    for (const id of chiffresCites(texte)) {
      if (!idsFigures.has(id)) constats.push({ gravite: "erreur", chemin, message: `chiffre inconnu : ${id}` });
      else if (chiffresDeclares && !chiffresDeclares.has(id)) {
        constats.push({ gravite: "erreur", chemin, message: `chiffre ${id} cité mais absent de concept.chiffres` });
      }
    }
  };

  formation.sources.forEach((s, i) => {
    const ch = `sources[${i}] (${s.id})`;
    for (const champ of /** @type {const} */ (["id", "auteurs", "annee", "titre", "support", "apport", "vigilance"])) {
      if (!nonVide(s[champ])) constats.push({ gravite: "erreur", chemin: ch, message: `${champ} manquant` });
    }
    if (!nonVide(s.url)) constats.push({ gravite: "avertissement", chemin: ch, message: "url à compléter" });
  });

  /** @param {string} duree */
  const heures = (duree) => Number(/^(\d+) h$/.exec(duree)?.[1] ?? NaN);
  formation.parcours.forEach((pc, pi) => {
    const chP = `parcours[${pi}] (${pc.id})`;
    let total = 0;
    for (const slug of pc.modules) {
      const m = formation.modules.find((x) => x.slug === slug);
      if (!m) constats.push({ gravite: "erreur", chemin: chP, message: `module inconnu : ${slug}` });
      else total += heures(m.duree);
    }
    if (total !== heures(pc.duree)) {
      constats.push({ gravite: "erreur", chemin: chP, message: `durée annoncée ${pc.duree}, somme des modules ${total} h` });
    }
  });
  for (const m of formation.modules) {
    if (!formation.parcours.some((pc) => pc.modules.includes(m.slug))) {
      constats.push({ gravite: "avertissement", chemin: `modules (${m.slug})`, message: "module rattaché à aucun parcours" });
    }
  }

  formation.modules.forEach((m, mi) => {
    const chM = `modules[${mi}] (${m.slug})`;
    if (slugs.has(m.slug)) constats.push({ gravite: "erreur", chemin: chM, message: "slug en double" });
    slugs.add(m.slug);
    verifierTexte(`${chM}.resume`, m.resume, null);

    if (m.statut === "apercu") {
      constats.push({ gravite: "avertissement", chemin: chM, message: "module en aperçu (contenu à produire)" });
      return;
    }

    if (m.concepts.length === 0 && m.type !== "atelier") constats.push({ gravite: "erreur", chemin: chM, message: "module complet sans concept" });
    if (m.type === "module") {
      const types = new Set(m.sequences.flatMap((s) => s.etapes.map((e) => e.type)));
      for (const [type, libelle] of [["accroche", "accroche d'actualité"], ["echelle", "remise à l'échelle"], ["regard", "regard (histoire, philosophie, psychologie…)"]]) {
        if (!types.has(/** @type {any} */ (type))) {
          constats.push({ gravite: "avertissement", chemin: chM, message: `structure cible : ${libelle} manquante (docs/vision.md)` });
        }
      }
    }
    if (!m.lectureOpposee) {
      constats.push({ gravite: "erreur", chemin: chM, message: "encadré « La lecture opposée » obligatoire" });
    } else {
      verifierTexte(`${chM}.lectureOpposee.texte`, m.lectureOpposee.texte, null);
      if (!idsSources.has(m.lectureOpposee.source)) {
        constats.push({ gravite: "erreur", chemin: `${chM}.lectureOpposee`, message: `source inconnue : ${m.lectureOpposee.source}` });
      }
    }

    m.concepts.forEach((c, ci) => {
      const chC = `${chM}.concepts[${ci}] (${c.id})`;
      if (idsConcepts.has(c.id)) constats.push({ gravite: "erreur", chemin: chC, message: "id de concept en double" });
      idsConcepts.add(c.id);
      if (!nonVide(c.titre)) constats.push({ gravite: "erreur", chemin: chC, message: "titre manquant" });
      if (!c.couche1 || !c.couche2 || !c.couche3) {
        constats.push({ gravite: "erreur", chemin: chC, message: "les trois couches sont obligatoires" });
        return;
      }
      const declares = new Set(c.chiffres);
      for (const id of c.chiffres) {
        if (!idsFigures.has(id)) constats.push({ gravite: "erreur", chemin: chC, message: `chiffre déclaré inconnu : ${id}` });
      }
      for (const id of c.sources) {
        if (!idsSources.has(id)) constats.push({ gravite: "erreur", chemin: chC, message: `source inconnue : ${id}` });
      }
      if (c.sources.length === 0) constats.push({ gravite: "avertissement", chemin: chC, message: "aucune source bibliographique" });

      verifierTexte(`${chC}.couche1.texte`, c.couche1.texte, declares);
      const mots = compterMots(c.couche1.texte);
      if (mots >= MOTS_MAX_COUCHE1) {
        constats.push({ gravite: "erreur", chemin: `${chC}.couche1.texte`, message: `${mots} mots (moins de ${MOTS_MAX_COUCHE1} exigés)` });
      }
      if (!nonVide(c.couche1.image) || !nonVide(c.couche1.alt)) {
        constats.push({ gravite: "erreur", chemin: `${chC}.couche1`, message: "image et texte alternatif obligatoires" });
      }
      for (const champ of /** @type {const} */ (["mecanisme", "ordreDeGrandeur", "comparaison"])) {
        verifierTexte(`${chC}.couche2.${champ}`, c.couche2[champ], declares);
      }
      if (chiffresCites(Object.values(c.couche2).join(" ")).length === 0) {
        constats.push({ gravite: "erreur", chemin: `${chC}.couche2`, message: "la couche 2 doit citer au moins un chiffre" });
      }
      verifierTexte(`${chC}.couche3.enjeu`, c.couche3.enjeu, declares);
      verifierTexte(`${chC}.couche3.questionOuverte`, c.couche3.questionOuverte, declares);
      if (!c.couche3.questionOuverte.trim().endsWith("?")) {
        constats.push({ gravite: "erreur", chemin: `${chC}.couche3.questionOuverte`, message: "doit être une question" });
      }
    });

    m.sequences.forEach((s, si) => {
      s.etapes.forEach((e, ei) => {
        const chE = `${chM}.sequences[${si}].etapes[${ei}]`;
        if (e.texte !== undefined) verifierTexte(chE, e.texte, null);
        if (e.source !== undefined && !idsSources.has(e.source)) {
          constats.push({ gravite: "erreur", chemin: chE, message: `source inconnue : ${e.source}` });
        }
        if (e.type === "accroche" && !e.source) {
          constats.push({ gravite: "erreur", chemin: chE, message: "accroche : source obligatoire (actualité datée et sourcée)" });
        }
        if (e.type === "regard" && !["histoire", "philosophie", "ethique", "psychologie", "societe"].includes(e.discipline ?? "")) {
          constats.push({ gravite: "erreur", chemin: chE, message: "regard : discipline obligatoire" });
        }
        if (e.type === "schema") {
          if (!nonVide(e.titre) || !nonVide(e.image) || !nonVide(e.alt)) {
            constats.push({ gravite: "erreur", chemin: chE, message: "schéma : titre, image et texte alternatif obligatoires" });
          }
          if (!Array.isArray(e.description) || e.description.length === 0) {
            constats.push({ gravite: "erreur", chemin: chE, message: "schéma : description détaillée obligatoire (accessibilité)" });
          }
          (e.description ?? []).forEach((d, di) => verifierTexte(`${chE}.description[${di}]`, d, null));
        }
        for (const id of e.concepts ?? []) {
          if (!m.concepts.some((c) => c.id === id)) constats.push({ gravite: "erreur", chemin: chE, message: `concept inconnu : ${id}` });
        }
      });
    });

    if (m.quiz.length > 0 && !m.quiz.some((q) => q.profondeur === 1)) {
      constats.push({ gravite: "erreur", chemin: `${chM}.quiz`, message: "au moins une question doit être accessible en profondeur 1" });
    }
    m.quiz.forEach((q, qi) => {
      const chQ = `${chM}.quiz[${qi}]`;
      verifierTexte(`${chQ}.question`, q.question, null);
      verifierTexte(`${chQ}.explication`, q.explication, null);
      q.choix.forEach((c) => verifierTexte(`${chQ}.choix.${c.id}`, c.texte, null));
      if (!q.choix.some((c) => c.id === q.reponse)) constats.push({ gravite: "erreur", chemin: chQ, message: "réponse absente des choix" });
      if (![1, 2, 3].includes(q.profondeur)) {
        constats.push({ gravite: "erreur", chemin: chQ, message: "profondeur (1, 2 ou 3) obligatoire : niveau à partir duquel la réponse est enseignée" });
      }
    });

    if (m.activite) {
      const cats = new Set(m.activite.categories.map((c) => c.id));
      m.activite.items.forEach((it, ii) => {
        const chI = `${chM}.activite.items[${ii}]`;
        verifierTexte(chI, it.texte, null);
        verifierTexte(`${chI}.commentaire`, it.commentaire, null);
        if (!cats.has(it.reponse)) constats.push({ gravite: "erreur", chemin: chI, message: `catégorie inconnue : ${it.reponse}` });
      });
    }
  });

  return constats;
}

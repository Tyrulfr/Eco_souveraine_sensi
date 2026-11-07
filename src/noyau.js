// Noyau partagé de l'interface : état, textes, création d'éléments, composant Chiffre.
// Aucun texte d'interface ni chiffre écrit ici : tout vient des fichiers de données.

import { decouperTexte, ecrireProgression, formaterValeur, lireProgression } from "./lib.js";

/**
 * @typedef {import("./lib.js").Formation} Formation
 * @typedef {import("./lib.js").Figure} Figure
 * @typedef {import("./lib.js").Module} Module
 * @typedef {import("./lib.js").Concept} Concept
 * @typedef {import("./lib.js").Profondeur} Profondeur
 * @typedef {import("./lib.js").Progression} Progression
 * @typedef {Node | string | null | undefined | false} Enfant
 * @typedef {Enfant | unknown[]} Enfants  tableaux imbriqués autorisés, aplatis par h()
 */

/** @type {{ formation: Formation, figures: Map<string, Figure>, series: Map<string, import("./lib.js").Serie>, ui: Record<string, string>, progression: Progression, stockage: Storage | null, moduleCourant: Module | null }} */
export const etat = {
  moduleCourant: null,
  series: new Map(),
  formation: { meta: {}, gardeFous: [], modules: [], parcours: [], sources: [] },
  figures: new Map(),
  ui: {},
  progression: lireProgression(null),
  stockage: null,
};

let compteurIds = 0;
/** @param {string} prefixe */
export const nouvelId = (prefixe) => `${prefixe}-${++compteurIds}`;

// ---------- utilitaires ----------

/**
 * Texte d'interface, avec remplacement de {parametres}.
 * @param {string} cle
 * @param {Record<string, string | number>} [params]
 */
export function t(cle, params = {}) {
  const brut = etat.ui[cle] ?? cle;
  return brut.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

/**
 * Crée un élément DOM.
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} balise
 * @param {Record<string, string | boolean | number | ((e: Event) => void)>} [attributs]
 * @param {...Enfants} enfants
 * @returns {HTMLElementTagNameMap[K]}
 */
export function h(balise, attributs = {}, ...enfants) {
  const el = document.createElement(balise);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (typeof valeur === "function") el.addEventListener(nom.replace(/^on/, ""), valeur);
    else if (valeur === true) el.setAttribute(nom, "");
    else if (valeur !== false) el.setAttribute(nom, String(valeur));
  }
  for (const enfant of /** @type {Enfant[]} */ (enfants.flat(Infinity))) {
    if (enfant === null || enfant === undefined || enfant === false) continue;
    el.append(enfant);
  }
  return el;
}

export function sauver() {
  ecrireProgression(etat.stockage, etat.progression);
}

/** @param {string} id */
export function progressionModule(id) {
  etat.progression.modules[id] ??= {};
  return etat.progression.modules[id];
}

// ---------- composant Chiffre ----------

/**
 * Affiche une valeur et, au clic, sa source.
 * @param {string} id
 * @returns {HTMLElement}
 */
export function Chiffre(id) {
  const f = etat.figures.get(id);
  if (!f) return h("span", { class: "chiffre chiffre-inconnu" }, `[${t("chiffre.inconnu")} : ${id}]`);
  const idPanneau = nouvelId("source");
  const manquant = f.valeur === null;
  const valeur = manquant ? t("chiffre.a-completer") : formaterValeur(f);
  const panneau = h(
    "span",
    { class: "chiffre-panneau", id: idPanneau, hidden: true },
    h("strong", {}, f.libelle),
    ligne(t("chiffre.source"), f.source ?? t("chiffre.non-renseigne")),
    ligne(t("chiffre.periode"), f.date ?? t("chiffre.non-renseigne")),
    ligne(t("chiffre.verifie-le"), dateFr(f.dateVerification)),
    ligne(t("chiffre.statut"), t(`statut.${f.statut}`)),
    f.note ? ligne(t("chiffre.note"), f.note) : null,
    f.url ? h("span", { class: "ligne" }, h("a", { href: f.url, target: "_blank", rel: "noopener noreferrer" }, t("chiffre.lien"))) : null,
  );
  const bouton = h(
    "button",
    {
      type: "button",
      class: `chiffre-valeur${manquant ? " chiffre-manquant" : ""}`,
      "aria-expanded": "false",
      "aria-controls": idPanneau,
      title: t("chiffre.voir"),
    },
    valeur,
    f.statut !== "verifie" && !manquant ? h("span", { class: `badge badge-${f.statut}` }, t(`statut.${f.statut}`)) : null,
  );
  bouton.addEventListener("click", () => {
    const ouvert = bouton.getAttribute("aria-expanded") === "true";
    bouton.setAttribute("aria-expanded", String(!ouvert));
    panneau.hidden = ouvert;
  });
  bouton.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panneau.hidden) {
      panneau.hidden = true;
      bouton.setAttribute("aria-expanded", "false");
    }
  });
  return h("span", { class: "chiffre" }, bouton, panneau);
}

/**
 * @param {string} etiquette
 * @param {string} valeur
 */
function ligne(etiquette, valeur) {
  return h("span", { class: "ligne" }, h("span", { class: "etiquette" }, `${etiquette} : `), valeur);
}

/** @param {string} iso */
export function dateFr(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Paragraphe avec chiffres sourcés.
 * @param {string} texte
 * @param {string} [classe]
 */
export function texteRiche(texte, classe) {
  return h(
    "p",
    classe ? { class: classe } : {},
    decouperTexte(texte).map((s) => (s.type === "texte" ? s.valeur : Chiffre(s.id))),
  );
}

// ---------- SourceBadge ----------

/** @param {import("./lib.js").Source} s */
export function SourceBadge(s) {
  const libelle = `${s.auteurs} (${s.annee}), « ${s.titre} », ${s.support}`;
  return h("span", { class: "source-badge" }, s.url ? h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, libelle) : libelle);
}

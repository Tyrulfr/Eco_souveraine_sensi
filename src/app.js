// Interface de la formation : routage par ancre (#/…), rendu DOM sans framework.
// Les textes viennent de data/ui.fr-FR.json, le contenu de data/formation.json,
// les chiffres de data/figures.json. Aucun chiffre ni texte d'interface n'est écrit ici.

import {
  decouperTexte,
  ecrireProgression,
  questionsVisibles,
  formaterValeur,
  lireProgression,
} from "./lib.js";

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

/** @type {{ formation: Formation, figures: Map<string, Figure>, ui: Record<string, string>, progression: Progression, stockage: Storage | null, moduleCourant: Module | null }} */
const etat = {
  moduleCourant: null,
  formation: { meta: {}, gardeFous: [], modules: [], sources: [] },
  figures: new Map(),
  ui: {},
  progression: lireProgression(null),
  stockage: null,
};

let compteurIds = 0;
/** @param {string} prefixe */
const nouvelId = (prefixe) => `${prefixe}-${++compteurIds}`;

// ---------- utilitaires ----------

/**
 * Texte d'interface, avec remplacement de {parametres}.
 * @param {string} cle
 * @param {Record<string, string | number>} [params]
 */
function t(cle, params = {}) {
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
function h(balise, attributs = {}, ...enfants) {
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

function sauver() {
  ecrireProgression(etat.stockage, etat.progression);
}

/** @param {string} id */
function progressionModule(id) {
  etat.progression.modules[id] ??= {};
  return etat.progression.modules[id];
}

// ---------- composant Chiffre ----------

/**
 * Affiche une valeur et, au clic, sa source.
 * @param {string} id
 * @returns {HTMLElement}
 */
function Chiffre(id) {
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
function dateFr(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Paragraphe avec chiffres sourcés.
 * @param {string} texte
 * @param {string} [classe]
 */
function texteRiche(texte, classe) {
  return h(
    "p",
    classe ? { class: classe } : {},
    decouperTexte(texte).map((s) => (s.type === "texte" ? s.valeur : Chiffre(s.id))),
  );
}

// ---------- DepthToggle ----------

function DepthToggle() {
  const nom = nouvelId("profondeur");
  const idAide = nouvelId("aide");
  /** @type {Profondeur[]} */
  const niveaux = [1, 2, 3];
  return h(
    "fieldset",
    { class: "profondeur", "aria-describedby": idAide },
    h("legend", {}, t("profondeur.legende")),
    h(
      "div",
      { class: "profondeur-options" },
      niveaux.map((n) => {
        const idInput = `${nom}-${n}`;
        const input = h("input", { type: "radio", name: nom, id: idInput, value: String(n) });
        input.checked = etat.progression.profondeur === n;
        input.addEventListener("change", () => changerProfondeur(n));
        return h("span", { class: "profondeur-option" }, input, h("label", { for: idInput }, h("span", { class: "profondeur-num" }, String(n)), t(`profondeur.${n}`)));
      }),
    ),
    h("p", { class: "aide", id: idAide }, t("profondeur.aide")),
  );
}

/** @param {Profondeur} n */
function changerProfondeur(n) {
  etat.progression.profondeur = n;
  sauver();
  document.querySelectorAll(`.profondeur input[value="${n}"]`).forEach((el) => {
    if (el instanceof HTMLInputElement) el.checked = true;
  });
  document.querySelectorAll("[data-concept]").forEach((carte) => {
    const id = carte.getAttribute("data-concept");
    const c = etat.formation.modules.flatMap((m) => m.concepts).find((x) => x.id === id);
    const corps = carte.querySelector(".concept-corps");
    if (c && corps) corps.replaceWith(corpsConcept(c, n));
  });
  const quiz = document.querySelector("section.quiz");
  if (quiz && etat.moduleCourant) quiz.replaceWith(Quiz(etat.moduleCourant));
}

// ---------- ConceptCard ----------

/** @param {Concept} c */
function ConceptCard(c) {
  return h(
    "article",
    { class: "concept", "data-concept": c.id, "aria-labelledby": `titre-${c.id}` },
    h("h3", { id: `titre-${c.id}` }, c.titre),
    corpsConcept(c, etat.progression.profondeur),
  );
}

/**
 * @param {Concept} c
 * @param {Profondeur} p
 */
function corpsConcept(c, p) {
  if (p === 1) {
    return h(
      "div",
      { class: "concept-corps couche-1" },
      h("img", { src: c.couche1.image, alt: c.couche1.alt, width: 160, height: 120, loading: "lazy" }),
      h("p", { class: "phrase-cle" }, c.couche1.texte),
    );
  }
  if (p === 2) {
    return h(
      "div",
      { class: "concept-corps couche-2" },
      h("h4", {}, t("concept.mecanisme")),
      texteRiche(c.couche2.mecanisme),
      h("h4", {}, t("concept.ordre")),
      texteRiche(c.couche2.ordreDeGrandeur),
      h("h4", {}, t("concept.comparaison")),
      texteRiche(c.couche2.comparaison),
    );
  }
  const sources = c.sources.map((id) => etat.formation.sources.find((s) => s.id === id)).filter((s) => s !== undefined);
  return h(
    "div",
    { class: "concept-corps couche-3" },
    h("h4", {}, t("concept.enjeu")),
    texteRiche(c.couche3.enjeu),
    h("div", { class: "question-ouverte" }, h("h4", {}, t("concept.question")), texteRiche(c.couche3.questionOuverte, "question"), h("p", { class: "aide" }, t("concept.question.aide"))),
    sources.length > 0
      ? h("div", { class: "concept-sources" }, h("h4", {}, t("concept.sources")), h("ul", {}, sources.map((s) => h("li", {}, SourceBadge(s)))))
      : null,
  );
}

// ---------- SourceBadge ----------

/** @param {import("./lib.js").Source} s */
function SourceBadge(s) {
  const libelle = `${s.auteurs} (${s.annee}), « ${s.titre} », ${s.support}`;
  return h("span", { class: "source-badge" }, s.url ? h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, libelle) : libelle);
}

// ---------- pages ----------

function pageAccueil() {
  const { meta, modules, gardeFous } = etat.formation;
  return [
    h("h1", { tabindex: -1 }, meta.titre ?? ""),
    h("p", { class: "chapeau" }, meta.sousTitre ?? ""),
    h("p", {}, meta.intention ?? ""),
    h("p", { class: "aide" }, `${meta.public ?? ""} ${meta.duree ?? ""}.`),
    h("h2", {}, t("accueil.modules")),
    h(
      "ol",
      { class: "liste-modules" },
      modules.map((m) => {
        const p = etat.progression.modules[m.id];
        return h(
          "li",
          { class: `carte-module statut-${m.statut}` },
          h("span", { class: "numero" }, t("accueil.module.numero", { n: m.numero })),
          h("h3", {}, h("a", { href: `#/module/${m.slug}` }, m.titre)),
          h("p", {}, m.resume),
          h(
            "p",
            { class: "etats" },
            h("span", { class: "badge" }, m.statut === "complet" ? t("accueil.module.disponible") : t("accueil.module.apercu")),
            p?.termine ? h("span", { class: "badge badge-termine" }, `✓ ${t("accueil.module.termine")}`) : null,
            p?.quiz !== undefined && p.quizTotal ? h("span", { class: "badge" }, t("accueil.module.quiz", { score: p.quiz, total: p.quizTotal })) : null,
          ),
        );
      }),
    ),
    h("h2", {}, t("accueil.garde-fous")),
    h("ul", { class: "garde-fous" }, gardeFous.map((g) => h("li", {}, g))),
  ];
}

/** @param {string} slug */
function pageModule(slug) {
  const modules = etat.formation.modules;
  const index = modules.findIndex((m) => m.slug === slug);
  const m = modules[index];
  if (!m) return pageIntrouvable();
  etat.moduleCourant = m;
  document.title = `${m.titre} — ${t("site.titre")}`;
  const precedent = modules[index - 1];
  const suivant = modules[index + 1];
  const navModules = h(
    "nav",
    { class: "nav-modules", "aria-label": `${t("module.precedent")} / ${t("module.suivant")}` },
    precedent ? h("a", { href: `#/module/${precedent.slug}`, rel: "prev" }, `← ${t("module.precedent")} : ${precedent.titre}`) : h("span"),
    suivant ? h("a", { href: `#/module/${suivant.slug}`, rel: "next" }, `${t("module.suivant")} : ${suivant.titre} →`) : h("span"),
  );
  const entete = [
    h("p", { class: "numero" }, `${t("accueil.module.numero", { n: m.numero })} · ${m.duree}`),
    h("h1", { tabindex: -1 }, m.titre),
    h("p", { class: "chapeau" }, m.resume),
  ];
  if (m.statut === "apercu") return [...entete, h("p", { class: "encadre" }, t("module.apercu")), navModules];

  return [
    ...entete,
    m.objectifs.length > 0 ? h("section", { "aria-labelledby": "objectifs" }, h("h2", { id: "objectifs" }, t("module.objectifs")), h("ul", {}, m.objectifs.map((o) => h("li", {}, o)))) : null,
    h("div", { class: "barre-profondeur" }, DepthToggle()),
    m.sequences.map((s) =>
      h(
        "section",
        { class: "sequence", "aria-labelledby": `seq-${s.id}` },
        h("h2", { id: `seq-${s.id}` }, s.titre),
        s.etapes.map((e) => {
          if (e.type === "concepts") {
            return (e.concepts ?? []).map((id) => {
              const c = m.concepts.find((x) => x.id === id);
              return c ? ConceptCard(c) : null;
            });
          }
          if (e.type === "schema") return Schema(e);
          return h("div", { class: `etape etape-${e.type}` }, h("p", { class: "etape-type" }, t(`module.etape.${e.type}`)), texteRiche(e.texte ?? ""));
        }),
      ),
    ),
    m.activite ? Activite(m) : null,
    m.quiz.length > 0 ? Quiz(m) : null,
    m.lectureOpposee ? LectureOpposee(m.lectureOpposee) : null,
    m.glossaire.length > 0
      ? h("section", { "aria-labelledby": "glossaire" }, h("h2", { id: "glossaire" }, t("module.glossaire")), h("dl", { class: "glossaire" }, m.glossaire.map((g) => [h("dt", {}, g.terme), h("dd", {}, g.definition)])))
      : null,
    Terminer(m),
    navModules,
  ];
}

/** @param {Module} m */
function Activite(m) {
  const a = /** @type {import("./lib.js").Activite} */ (m.activite);
  const zone = h("div", { class: "resultat", role: "status" });
  /** @type {HTMLSelectElement[]} */
  const selects = [];
  const items = a.items.map((it) => {
    const idSel = nouvelId("classement");
    const select = h("select", { id: idSel }, h("option", { value: "" }, t("module.activite.choisir")), a.categories.map((c) => h("option", { value: c.id }, c.label)));
    selects.push(select);
    return h("li", { class: "item-classement", "data-item": it.id }, h("label", { for: idSel }, it.texte), select, h("p", { class: "retour", hidden: true }));
  });
  const verifier = () => {
    let justes = 0;
    a.items.forEach((it, i) => {
      const li = items[i];
      const retour = li?.querySelector(".retour");
      const juste = selects[i]?.value === it.reponse;
      if (juste) justes++;
      if (retour instanceof HTMLElement) {
        retour.hidden = false;
        retour.className = `retour ${juste ? "juste" : "faux"}`;
        retour.textContent = `${juste ? "✓ " + t("module.correct") : "✗ " + t("module.a-revoir")} ${it.commentaire}`;
      }
    });
    zone.textContent = t("module.quiz.score", { score: justes, total: a.items.length });
    progressionModule(m.id).activite = true;
    sauver();
  };
  return h(
    "section",
    { class: "activite", "aria-labelledby": "activite" },
    h("h2", { id: "activite" }, `${t("module.activite")} : ${a.titre}`),
    h("p", {}, a.consigne),
    h("ol", { class: "liste-classement" }, items),
    h("button", { type: "button", class: "bouton", onclick: verifier }, t("module.activite.verifier")),
    zone,
  );
}

/**
 * Schéma illustré, avec sa description détaillée pour les lecteurs d'écran
 * et pour qui préfère lire le circuit pas à pas.
 * @param {import("./lib.js").Etape} e
 */
function Schema(e) {
  const idTitre = nouvelId("schema");
  return h(
    "figure",
    { class: "etape etape-schema", "aria-labelledby": idTitre },
    h("p", { class: "etape-type" }, t("module.etape.schema")),
    h("h3", { id: idTitre }, e.titre ?? ""),
    h("img", { src: e.image ?? "", alt: e.alt ?? "", width: 360, height: 470, loading: "lazy" }),
    h("details", {}, h("summary", {}, t("schema.description")), h("ol", {}, (e.description ?? []).map((d) => h("li", {}, texteRiche(d))))),
  );
}

/** @param {Module} m */
function Quiz(m) {
  const zone = h("div", { class: "resultat", role: "status" });
  const visibles = questionsVisibles(m.quiz, etat.progression.profondeur);
  const questions = visibles.map((q) => {
    const nom = nouvelId(q.id);
    return h(
      "fieldset",
      { class: "question-quiz", "data-question": q.id },
      h("legend", {}, q.question),
      q.choix.map((c) => {
        const idC = `${nom}-${c.id}`;
        return h("div", { class: "choix" }, h("input", { type: "radio", name: nom, id: idC, value: c.id }), h("label", { for: idC }, c.texte));
      }),
      h("p", { class: "retour", hidden: true }),
    );
  });
  const verifier = () => {
    let score = 0;
    visibles.forEach((q, i) => {
      const fs = questions[i];
      const coche = fs?.querySelector("input:checked");
      const valeur = coche instanceof HTMLInputElement ? coche.value : null;
      const juste = valeur === q.reponse;
      if (juste) score++;
      const retour = fs?.querySelector(".retour");
      if (retour instanceof HTMLElement) {
        retour.hidden = false;
        retour.className = `retour ${juste ? "juste" : "faux"}`;
        const verdict = valeur === null ? t("module.quiz.sans-reponse") : juste ? `✓ ${t("module.correct")}` : `✗ ${t("module.a-revoir")}`;
        retour.textContent = `${verdict} ${q.explication}`;
      }
    });
    zone.textContent = t("module.quiz.score", { score, total: visibles.length });
    const p = progressionModule(m.id);
    p.quiz = score;
    p.quizTotal = visibles.length;
    sauver();
  };
  return h(
    "section",
    { class: "quiz", "aria-labelledby": "quiz" },
    h("h2", { id: "quiz" }, t("module.quiz")),
    visibles.length < m.quiz.length ? h("p", { class: "aide" }, t("module.quiz.filtre", { n: visibles.length, total: m.quiz.length })) : null,
    questions,
    h("button", { type: "button", class: "bouton", onclick: verifier }, t("module.quiz.verifier")),
    zone,
  );
}

/** @param {import("./lib.js").LectureOpposee} lo */
function LectureOpposee(lo) {
  const source = etat.formation.sources.find((s) => s.id === lo.source);
  return h(
    "aside",
    { class: "lecture-opposee", "aria-labelledby": "lecture-opposee" },
    h("h2", { id: "lecture-opposee" }, lo.titre),
    texteRiche(lo.texte),
    source ? h("p", { class: "aide" }, `${t("chiffre.source")} : `, SourceBadge(source)) : null,
  );
}

/** @param {Module} m */
function Terminer(m) {
  const message = h("p", { role: "status", class: "resultat" }, progressionModule(m.id).termine ? t("module.termine") : "");
  const bouton = h("button", { type: "button", class: "bouton bouton-secondaire" }, t("module.terminer"));
  bouton.addEventListener("click", () => {
    progressionModule(m.id).termine = true;
    sauver();
    message.textContent = t("module.termine");
  });
  return h("div", { class: "terminer" }, bouton, message);
}

function pageSources() {
  const figures = [...etat.figures.values()];
  /** @param {string} s */
  const compte = (s) => figures.filter((f) => f.statut === s).length;
  return [
    h("h1", { tabindex: -1 }, t("sources.titre")),
    h("p", {}, t("sources.intro")),
    h("p", { class: "encadre" }, t("sources.bilan", { total: figures.length, verifie: compte("verifie"), aVerifier: compte("a-verifier"), aCompleter: compte("a-completer") })),
    h("h2", {}, t("sources.chiffres")),
    h(
      "div",
      { class: "tableau-defilant", tabindex: 0, role: "region", "aria-label": t("sources.chiffres") },
      h(
        "table",
        {},
        h("thead", {}, h("tr", {}, ["libelle", "valeur", "periode", "source", "verification", "statut"].map((c) => h("th", { scope: "col" }, t(`sources.col.${c}`))))),
        h(
          "tbody",
          {},
          figures.map((f) =>
            h(
              "tr",
              { id: `figure-${f.id}` },
              h("th", { scope: "row" }, f.libelle),
              h("td", {}, f.valeur === null ? t("chiffre.a-completer") : formaterValeur(f)),
              h("td", {}, f.date ?? t("chiffre.non-renseigne")),
              h("td", {}, f.url ? h("a", { href: f.url, target: "_blank", rel: "noopener noreferrer" }, f.source ?? f.url) : f.source ?? t("chiffre.non-renseigne"), f.note ? h("p", { class: "aide" }, f.note) : null),
              h("td", {}, dateFr(f.dateVerification)),
              h("td", {}, h("span", { class: `badge badge-${f.statut}` }, t(`statut.${f.statut}`))),
            ),
          ),
        ),
      ),
    ),
    h("h2", {}, t("sources.bibliographie")),
    h(
      "ul",
      { class: "bibliographie" },
      etat.formation.sources.map((s) =>
        h("li", { id: `source-${s.id}` }, SourceBadge(s), h("p", {}, h("strong", {}, `${t("sources.apport")} : `), s.apport), h("p", {}, h("strong", {}, `${t("sources.vigilance")} : `), s.vigilance)),
      ),
    ),
  ];
}

/**
 * @param {string} cleTitre
 * @param {string} cleTexte
 */
function pageAVenir(cleTitre, cleTexte) {
  return [h("h1", { tabindex: -1 }, t(cleTitre)), h("p", { class: "encadre" }, t(cleTexte))];
}

function pageIntrouvable() {
  return [h("h1", { tabindex: -1 }, t("erreur.introuvable")), h("p", {}, h("a", { href: "#/" }, t("retour.accueil")))];
}

// ---------- routage ----------

function rendre() {
  const route = location.hash.replace(/^#\/?/, "").split("/");
  document.title = t("site.titre");
  /** @type {Enfants[]} */
  let contenu;
  if (route[0] === "" || route[0] === undefined) contenu = pageAccueil();
  else if (route[0] === "module" && route[1]) contenu = pageModule(route[1]);
  else if (route[0] === "sources") contenu = pageSources();
  else if (route[0] === "simulateur") contenu = pageAVenir("simulateur.titre", "simulateur.bientot");
  else if (route[0] === "formateur") contenu = pageAVenir("formateur.titre", "formateur.bientot");
  else contenu = pageIntrouvable();

  const main = /** @type {HTMLElement} */ (document.getElementById("contenu"));
  main.replaceChildren(...(/** @type {Enfant[]} */ (contenu.flat(Infinity))).filter((x) => x !== null && x !== undefined && x !== false));
  const titre = main.querySelector("h1");
  if (route[0] !== "" && titre instanceof HTMLElement) {
    if (!document.title.includes(titre.textContent ?? "")) document.title = `${titre.textContent} — ${t("site.titre")}`;
    titre.focus();
  }
  document.querySelectorAll("#nav a").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    const actif = href === `#/${route[0] ?? ""}` || (href === "#/" && route[0] === "");
    if (actif) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function rendreChrome() {
  const nav = /** @type {HTMLElement} */ (document.getElementById("nav"));
  nav.setAttribute("aria-label", t("nav.libelle"));
  nav.replaceChildren(
    h(
      "ul",
      {},
      [
        ["#/", "nav.accueil"],
        ["#/simulateur", "nav.simulateur"],
        ["#/sources", "nav.sources"],
        ["#/formateur", "nav.formateur"],
      ].map(([href, cle]) => h("li", {}, h("a", { href: href ?? "#/" }, t(cle ?? "")))),
    ),
  );
  const evitement = document.querySelector(".evitement");
  evitement?.addEventListener("click", (e) => {
    // Le lien d'évitement ne doit pas modifier l'ancre de routage.
    e.preventDefault();
    document.getElementById("contenu")?.focus();
  });
  document.querySelectorAll("[data-ui]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-ui") ?? "");
  });
  const pied = /** @type {HTMLElement} */ (document.getElementById("pied"));
  pied.replaceChildren(
    h("p", {}, t("pied.donnees")),
    h("p", {}, t("pied.verification", { date: dateFr(etat.formation.meta.dateVerification ?? "") })),
  );
}

// ---------- démarrage ----------

/** @param {string} url */
async function chargerJson(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${url} : ${r.status}`);
  return r.json();
}

async function demarrer() {
  try {
    etat.stockage = window.localStorage;
  } catch {
    etat.stockage = null;
  }
  etat.progression = lireProgression(etat.stockage);
  try {
    const [formation, figures, ui] = await Promise.all([
      chargerJson("data/formation.json"),
      chargerJson("data/figures.json"),
      chargerJson("data/ui.fr-FR.json"),
    ]);
    etat.formation = formation;
    etat.figures = new Map(/** @type {Figure[]} */ (figures).map((f) => [f.id, f]));
    etat.ui = ui;
  } catch {
    const main = document.getElementById("contenu");
    main?.replaceChildren(h("p", { class: "encadre", role: "alert" }, etat.ui["erreur.chargement"] ?? "Le contenu n'a pas pu être chargé."));
    return;
  }
  rendreChrome();
  rendre();
  window.addEventListener("hashchange", rendre);
}

demarrer();

// Interface de la formation : routage par ancre (#/…), rendu DOM sans framework.
// Les textes viennent de data/ui.fr-FR.json, le contenu de data/formation.json,
// les chiffres de data/figures.json. Aucun chiffre ni texte d'interface n'est écrit ici.


import { formaterValeur, lireProgression, questionsVisibles } from "./lib.js";
import { etat, t, h, nouvelId, sauver, progressionModule, dateFr, texteRiche, SourceBadge } from "./noyau.js";
import { Classement, EchelleInteractive, Estimation, LigneNombres, Partage, Verif, VraiFaux } from "./jeux.js";
import { Courbe } from "./graphiques.js";

/**
 * @typedef {import("./lib.js").Figure} Figure
 * @typedef {import("./lib.js").Module} Module
 * @typedef {import("./lib.js").Concept} Concept
 * @typedef {import("./lib.js").Profondeur} Profondeur
 * @typedef {import("./noyau.js").Enfant} Enfant
 * @typedef {import("./noyau.js").Enfants} Enfants
 */

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


// ---------- pages ----------

/** @param {Module} m */
const libelleModule = (m) => t(`accueil.type.${m.type}`, { n: m.numero });

function pageAccueil() {
  const { meta, modules, gardeFous, parcours } = etat.formation;
  return [
    h("h1", { tabindex: -1 }, meta.titre ?? ""),
    h("p", { class: "chapeau" }, meta.sousTitre ?? ""),
    h("p", {}, meta.intention ?? ""),
    h("p", { class: "aide" }, `${meta.public ?? ""} ${meta.duree ?? ""}.`),
    h("h2", {}, t("accueil.parcours")),
    parcours.map((pc) => [
      h("h3", { class: "titre-parcours" }, `${pc.titre} · ${pc.duree}`),
      h("p", {}, pc.resume),
      h(
        "ol",
        { class: "liste-modules" },
        pc.modules.map((slug) => modules.find((x) => x.slug === slug)).filter((m) => m !== undefined).map((m) => {
        const p = etat.progression.modules[m.id];
        return h(
          "li",
          { class: `carte-module statut-${m.statut} type-${m.type}` },
          h("span", { class: "numero" }, `${libelleModule(m)} · ${m.duree}`),
          h("h4", {}, h("a", { href: `#/module/${m.slug}` }, m.titre)),
          h("p", {}, m.resume),
          h(
            "p",
            { class: "etats" },
            h("span", { class: "badge" }, m.statut === "complet" ? t("accueil.module.disponible") : t("accueil.module.apercu")),
            p?.termine ? h("span", { class: "badge badge-termine" }, `★ ${t("accueil.module.termine")}`) : null,
            !p?.termine && (p?.chapitresVus?.length ?? 0) > 0 ? h("span", { class: "badge" }, t("accueil.module.en-cours")) : null,
            p?.quiz !== undefined && p.quizTotal ? h("span", { class: "badge" }, t("accueil.module.quiz", { score: p.quiz, total: p.quizTotal })) : null,
          ),
        );
      }),
      ),
    ]),
    h("h2", {}, t("accueil.garde-fous")),
    h("ul", { class: "garde-fous" }, gardeFous.map((g) => h("li", {}, g))),
  ];
}

/**
 * Rend une étape de séquence selon son type.
 * @param {import("./lib.js").Etape} e
 * @param {Module} m
 */
function rendreEtape(e, m) {
  switch (e.type) {
    case "concepts":
      return (e.concepts ?? []).map((id) => {
        const c = m.concepts.find((x) => x.id === id);
        return c ? ConceptCard(c) : null;
      });
    case "schema":
      return Schema(e);
    case "estimation":
      return Estimation(e);
    case "ligne":
      return LigneNombres(e);
    case "partage":
      return Partage(e);
    case "vrai-faux":
      return VraiFaux(e);
    case "classement":
      return Classement(e);
    case "verif":
      return Verif(e);
    case "echelle":
      if (e.vues) return EchelleInteractive(e);
      break;
    case "courbe": {
      const serie = etat.series.get(e.serie ?? "");
      return h(
        "figure",
        { class: "etape etape-courbe" },
        h("p", { class: "etape-type" }, t("module.etape.courbe")),
        h("h3", {}, e.titre ?? ""),
        serie ? Courbe(serie, e.evenements ?? []) : h("p", {}, t("chiffre.a-completer")),
        serie ? h("figcaption", { class: "aide" }, `${t("chiffre.source")} : `, serie.url ? h("a", { href: serie.url, target: "_blank", rel: "noopener noreferrer" }, serie.source) : serie.source) : null,
        e.texte ? texteRiche(e.texte) : null,
      );
    }
    default:
      break;
  }
  const libelle = e.type === "regard" && e.discipline ? t(`regard.${e.discipline}`) : t(`module.etape.${e.type}`);
  const source = e.source ? etat.formation.sources.find((x) => x.id === e.source) : undefined;
  return h(
    "div",
    { class: `etape etape-${e.type}` },
    h("p", { class: "etape-type" }, libelle),
    e.titre ? h("h3", {}, e.titre) : null,
    e.citation ? h("blockquote", { class: "citation" }, h("p", {}, `« ${e.citation} »`)) : null,
    e.texte ? texteRiche(e.texte) : null,
    source ? h("p", { class: "aide" }, `${t("chiffre.source")} : `, SourceBadge(source)) : null,
  );
}

/**
 * Page d'un module, découpée en chapitres courts (un écran = une idée),
 * avec plan, barre de progression et bilan final.
 * @param {string} slug
 * @param {number} numeroChapitre  à partir de 1 ; le dernier chapitre est le bilan
 */
function pageModule(slug, numeroChapitre) {
  const modules = etat.formation.modules;
  const index = modules.findIndex((m) => m.slug === slug);
  const m = modules[index];
  if (!m) return pageIntrouvable();
  etat.moduleCourant = m;
  document.title = `${m.titre} — ${t("site.titre")}`;
  const suivantModule = modules[index + 1];
  const entete = [
    h("p", { class: "numero" }, `${libelleModule(m)} · ${m.duree}`),
    h("h1", { tabindex: -1 }, m.titre),
    h("p", { class: "chapeau" }, m.resume),
  ];
  if (m.statut === "apercu") {
    return [
      ...entete,
      h("p", { class: "encadre" }, t("module.apercu")),
      suivantModule ? h("p", {}, h("a", { href: `#/module/${suivantModule.slug}` }, `${t("module.suivant")} : ${suivantModule.titre} →`)) : null,
    ];
  }

  const titres = [...m.sequences.map((s) => s.titre), t("module.bilan")];
  const durees = [...m.sequences.map((s) => s.duree), null];
  const total = titres.length;
  const n = Math.min(Math.max(1, numeroChapitre), total);
  const prog = progressionModule(m.id);
  prog.chapitresVus = [...new Set([...(prog.chapitresVus ?? []), n])].sort((a, b) => a - b);
  sauver();
  /** @param {number} i */
  const lien = (i) => `#/module/${m.slug}/${i}`;

  const plan = h(
    "details",
    { class: "plan-module", open: n === 1 },
    h("summary", {}, t("module.plan")),
    m.objectifs.length > 0 ? [h("h2", { class: "h-petit" }, t("module.objectifs")), h("ul", {}, m.objectifs.map((o) => h("li", {}, o)))] : null,
    h(
      "ol",
      { class: "plan-liste" },
      titres.map((titre, i) => {
        const vu = prog.chapitresVus?.includes(i + 1);
        const courant = i + 1 === n;
        const d = durees[i];
        return h(
          "li",
          { class: `${vu ? "vu" : ""} ${courant ? "courant" : ""}` },
          h("a", { href: lien(i + 1), ...(courant ? { "aria-current": "step" } : {}) }, titre),
          d ? h("span", { class: "aide" }, ` · ${t("module.minutes", { n: d })}`) : null,
          vu && !courant ? h("span", { class: "visuellement-cache" }, ` (${t("module.chapitre-vu")})`) : null,
        );
      }),
    ),
  );

  const idTitre = nouvelId("chapitre");
  const sequence = m.sequences[n - 1];
  const contenu = sequence
    ? sequence.etapes.map((e) => rendreEtape(e, m))
    : [
        h("p", {}, t("module.bilan.intro")),
        m.activite ? Activite(m) : null,
        m.quiz.length > 0 ? Quiz(m) : null,
        m.lectureOpposee ? LectureOpposee(m.lectureOpposee) : null,
        m.glossaire.length > 0
          ? h("section", { "aria-labelledby": "glossaire" }, h("h3", { id: "glossaire" }, t("module.glossaire")), h("dl", { class: "glossaire" }, m.glossaire.map((g) => [h("dt", {}, g.terme), h("dd", {}, g.definition)])))
          : null,
        Terminer(m),
      ];

  const navigation = h(
    "nav",
    { class: "nav-chapitres", "aria-label": t("module.nav-chapitres") },
    n > 1 ? h("a", { class: "bouton bouton-secondaire", href: lien(n - 1), rel: "prev" }, `← ${t("module.chapitre-precedent")}`) : h("span"),
    n < total
      ? h("a", { class: "bouton", href: lien(n + 1), rel: "next" }, `${t("module.chapitre-suivant")} : ${titres[n] ?? ""} →`)
      : suivantModule
        ? h("a", { class: "bouton", href: `#/module/${suivantModule.slug}` }, `${t("module.suivant")} : ${suivantModule.titre} →`)
        : h("a", { class: "bouton", href: "#/" }, t("retour.accueil")),
  );

  return [
    ...entete,
    plan,
    h(
      "div",
      { class: "barre-profondeur" },
      DepthToggle(),
      h(
        "div",
        { class: "progression-chapitres" },
        h("label", { for: `${idTitre}-progression` }, t("module.progression", { i: n, n: total })),
        h("progress", { id: `${idTitre}-progression`, max: total, value: n }),
      ),
    ),
    h(
      "section",
      { class: "chapitre", "aria-labelledby": idTitre },
      h("h2", { id: idTitre, tabindex: -1, "data-focus": true }, titres[n - 1] ?? ""),
      durees[n - 1] ? h("p", { class: "aide duree-chapitre" }, t("module.minutes", { n: durees[n - 1] ?? 0 })) : null,
      contenu,
    ),
    navigation,
  ];
}

/** @param {Module} m */
function Activite(m) {
  return Classement(/** @type {import("./lib.js").Activite} */ (m.activite), () => {
    progressionModule(m.id).activite = true;
    sauver();
  });
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
    h("h3", { id: "quiz" }, t("module.quiz")),
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
    h("h3", { id: "lecture-opposee" }, lo.titre),
    texteRiche(lo.texte),
    source ? h("p", { class: "aide" }, `${t("chiffre.source")} : `, SourceBadge(source)) : null,
  );
}

/** @param {Module} m */
function Terminer(m) {
  const badge = () => h("p", { class: "badge-gagne" }, h("span", { "aria-hidden": "true" }, "★ "), t("module.badge", { badge: m.badge ?? m.titre }));
  const zone = h("div", { role: "status" }, progressionModule(m.id).termine ? badge() : null);
  const bouton = h("button", { type: "button", class: "bouton" }, t("module.terminer"));
  bouton.addEventListener("click", () => {
    progressionModule(m.id).termine = true;
    sauver();
    zone.replaceChildren(badge());
  });
  return h("div", { class: "terminer" }, bouton, zone);
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
  else if (route[0] === "module" && route[1]) contenu = pageModule(route[1], Number(route[2]) || 1);
  else if (route[0] === "sources") contenu = pageSources();
  else if (route[0] === "simulateur") contenu = pageAVenir("simulateur.titre", "simulateur.bientot");
  else if (route[0] === "formateur") contenu = pageAVenir("formateur.titre", "formateur.bientot");
  else contenu = pageIntrouvable();

  const main = /** @type {HTMLElement} */ (document.getElementById("contenu"));
  main.replaceChildren(...(/** @type {Enfant[]} */ (contenu.flat(Infinity))).filter((x) => x !== null && x !== undefined && x !== false));
  const titre = route[2] ? main.querySelector("[data-focus]") : main.querySelector("h1");
  window.scrollTo(0, 0);
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
    const [formation, figures, ui, series] = await Promise.all([
      chargerJson("data/formation.json"),
      chargerJson("data/figures.json"),
      chargerJson("data/ui.fr-FR.json"),
      chargerJson("data/series.json"),
    ]);
    etat.series = new Map(/** @type {import("./lib.js").Serie[]} */ (series).map((x) => [x.id, x]));
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

// Activités interactives : apprendre en jouant, avec retour immédiat et expliqué.
// Principes : une consigne courte, une action, un retour qui explique (jamais
// « faux » sans raison), aucune pénalité, tout jouable au clavier.

import { calculer, ecartsRepartition, formaterNombre, formaterValeur, positionSurLigne } from "./lib.js";
import { etat, t, h, nouvelId, Chiffre, texteRiche } from "./noyau.js";
import { BarresComparees } from "./graphiques.js";

/** @typedef {import("./lib.js").Etape} Etape */

/**
 * Cadre commun d'un jeu : libellé, titre, consigne.
 * @param {Etape} e
 * @param {string} titre
 * @param {...import("./noyau.js").Enfants} contenu
 */
function Cadre(e, titre, ...contenu) {
  const idTitre = nouvelId("jeu");
  return h(
    "section",
    { class: `jeu jeu-${e.type}`, "aria-labelledby": idTitre },
    h("p", { class: "etape-type" }, t(`module.etape.${e.type}`)),
    h("h3", { id: idTitre }, titre),
    e.consigne ? texteRiche(e.consigne, "consigne") : null,
    contenu,
  );
}

/**
 * Remplace le contenu d'un élément en ignorant les enfants absents.
 * @param {Element} el
 * @param {...(Node | string | null | false | undefined)} enfants
 */
function remplir(el, ...enfants) {
  el.replaceChildren(.../** @type {(Node | string)[]} */ (enfants.filter((x) => x !== null && x !== false && x !== undefined)));
}

/** @param {boolean} juste @param {string} texte */
function retour(juste, texte) {
  return h("div", { class: `retour ${juste ? "juste" : "faux"}`, role: "status" }, texte);
}

// ---------- Estimer un montant avant de le découvrir ----------

/** @param {Etape} e */
export function Estimation(e) {
  const f = etat.figures.get(e.chiffre ?? "");
  const reel = typeof f?.valeur === "number" ? f.valeur : null;
  if (!f || reel === null) return Cadre(e, e.question ?? "", h("p", {}, t("chiffre.a-completer")));
  const min = e.min ?? 0;
  const max = e.max ?? reel * 2;
  const idCurseur = nouvelId("estimation");
  const curseur = h("input", { type: "range", id: idCurseur, min, max, step: e.pas ?? 1, value: min });
  // Le curseur part de la borne basse : pas de valeur « suggérée » (effet d'ancrage).
  /** @param {number} v */
  const lire = (v) => formaterValeur({ ...f, valeur: v, approx: false });
  const sortie = h("output", { for: idCurseur, class: "valeur-curseur" }, lire(Number(curseur.value)));
  curseur.setAttribute("aria-valuetext", lire(Number(curseur.value)));
  curseur.addEventListener("input", () => {
    sortie.textContent = lire(Number(curseur.value));
    curseur.setAttribute("aria-valuetext", lire(Number(curseur.value)));
  });
  const zone = h("div", { class: "resultat-jeu" });
  const bouton = h("button", { type: "button", class: "bouton" }, t("jeu.valider"));
  bouton.addEventListener("click", () => {
    const v = Number(curseur.value);
    const ecartRelatif = Math.abs(v - reel) / reel;
    curseur.disabled = true;
    bouton.disabled = true;
    remplir(zone,
      h("p", {}, `${t("jeu.estimation.votre")} `, h("strong", {}, lire(v))),
      h("p", { class: "revelation" }, `${t("jeu.estimation.reel")} `, Chiffre(f.id)),
      retour(ecartRelatif <= 0.15, ecartRelatif <= 0.15 ? t("jeu.estimation.proche") : t("jeu.estimation.loin")),
      e.explication ? texteRiche(e.explication) : null,
    );
  });
  return Cadre(
    e,
    e.question ?? "",
    h("div", { class: "curseur-bloc" }, h("label", { for: idCurseur }, t("jeu.estimation.label")), curseur, sortie),
    bouton,
    zone,
  );
}

// ---------- Placer un nombre sur une ligne (mille → milliard) ----------

/** @param {Etape} e */
export function LigneNombres(e) {
  const [g, d, c] = e.valeurs ?? [0, 1, 0];
  const idCurseur = nouvelId("ligne");
  const curseur = h("input", { type: "range", id: idCurseur, min: 0, max: 1000, step: 1, value: 500, class: "curseur-ligne" });
  /** @param {number} v */
  const pourcent = (v) => `${formaterNombre(v / 10)} %`;
  curseur.setAttribute("aria-valuetext", t("jeu.ligne.position", { p: pourcent(500) }));
  curseur.addEventListener("input", () => curseur.setAttribute("aria-valuetext", t("jeu.ligne.position", { p: pourcent(Number(curseur.value)) })));
  const zone = h("div", { class: "resultat-jeu" });
  const bouton = h("button", { type: "button", class: "bouton" }, t("jeu.valider"));
  bouton.addEventListener("click", () => {
    const vous = Number(curseur.value) / 1000;
    const vrai = positionSurLigne(g, d, c);
    curseur.disabled = true;
    bouton.disabled = true;
    remplir(zone,
      h(
        "div",
        { class: "ligne-revelee", "aria-hidden": "true" },
        h("span", { class: "ligne-trait" }),
        h("span", { class: "repere-ligne repere-vous", style: `left: ${vous * 100}%` }, t("jeu.ligne.vous")),
        h("span", { class: "repere-ligne repere-vrai", style: `left: ${vrai * 100}%` }, t("jeu.ligne.vrai")),
      ),
      h("p", {}, t("jeu.ligne.resultat", { cible: e.cible ?? "", p: pourcent(vous * 1000), r: pourcent(vrai * 1000) })),
      e.explication ? texteRiche(e.explication) : null,
    );
  });
  return Cadre(
    e,
    e.question ?? "",
    h(
      "div",
      { class: "curseur-bloc" },
      h("label", { for: idCurseur }, t("jeu.ligne.label", { cible: e.cible ?? "" })),
      h("div", { class: "bornes", "aria-hidden": "true" }, h("span", {}, e.gauche ?? ""), h("span", {}, e.droite ?? "")),
      curseur,
    ),
    bouton,
    zone,
  );
}

// ---------- Partager le gâteau de 100 € ----------

const TOTAL_GATEAU = 100;

/** @param {Etape} e */
export function Partage(e) {
  const parts = e.parts ?? [];
  /** @type {Record<string, number>} */
  const propose = Object.fromEntries(parts.map((p) => [p.id, 0]));
  const somme = () => Object.values(propose).reduce((a, b) => a + b, 0);
  const etatReste = h("p", { class: "reste", "aria-live": "polite" });
  const majReste = () => {
    const r = TOTAL_GATEAU - somme();
    etatReste.textContent = r === 0 ? t("jeu.partage.complet") : r > 0 ? t("jeu.partage.reste", { n: r }) : t("jeu.partage.depasse", { n: -r });
    etatReste.className = `reste ${r === 0 ? "reste-ok" : ""}`;
  };
  const lignes = parts.map((p) => {
    const idChamp = nouvelId("part");
    const champ = h("input", { type: "number", id: idChamp, min: 0, max: TOTAL_GATEAU, step: 1, value: 0, inputmode: "numeric" });
    /** @param {number} v */
    const fixer = (v) => {
      propose[p.id] = Math.max(0, Math.min(TOTAL_GATEAU, Math.round(v) || 0));
      champ.value = String(propose[p.id]);
      majReste();
    };
    champ.addEventListener("change", () => fixer(Number(champ.value)));
    return h(
      "li",
      { class: "part" },
      h("label", { for: idChamp }, p.label),
      h(
        "span",
        { class: "part-commandes" },
        h("button", { type: "button", class: "bouton-rond", "aria-label": t("jeu.partage.moins", { label: p.label }), onclick: () => fixer((propose[p.id] ?? 0) - 1) }, "−"),
        champ,
        h("span", { class: "euro", "aria-hidden": "true" }, "€"),
        h("button", { type: "button", class: "bouton-rond", "aria-label": t("jeu.partage.plus", { label: p.label }), onclick: () => fixer((propose[p.id] ?? 0) + 1) }, "+"),
      ),
    );
  });
  majReste();
  const zone = h("div", { class: "resultat-jeu" });
  const bouton = h("button", { type: "button", class: "bouton" }, t("jeu.partage.comparer"));
  bouton.addEventListener("click", () => {
    if (somme() !== TOTAL_GATEAU) {
      remplir(zone, retour(false, t("jeu.partage.incomplet")));
      return;
    }
    /** @type {Record<string, number>} */
    const reel = {};
    for (const p of parts) {
      const v = etat.figures.get(p.chiffre)?.valeur;
      reel[p.id] = typeof v === "number" ? v : 0;
    }
    const [plusGrand] = ecartsRepartition(propose, reel);
    const libelle = parts.find((p) => p.id === plusGrand?.id)?.label ?? "";
    remplir(zone,
      BarresComparees({
        lignes: parts.map((p) => ({ label: p.label, a: propose[p.id] ?? 0, b: reel[p.id] ?? 0 })),
        legendeA: t("jeu.partage.vous"),
        legendeB: t("jeu.partage.reel"),
        unite: " €",
      }),
      plusGrand ? h("p", {}, t("jeu.partage.ecart", { label: libelle, e: formaterNombre(Math.abs(plusGrand.ecart)) })) : null,
      h("p", { class: "aide" }, t("jeu.partage.sources"), " ", parts.map((p, i) => [i > 0 ? " · " : "", p.label, " ", Chiffre(p.chiffre)])),
      e.explication ? texteRiche(e.explication) : null,
    );
  });
  return Cadre(e, e.question ?? "", h("ul", { class: "parts" }, lignes), etatReste, bouton, zone);
}

// ---------- Changer de lunettes : un même montant, plusieurs échelles ----------

/** @param {Etape} e */
export function EchelleInteractive(e) {
  const vues = e.vues ?? [];
  const nom = nouvelId("vue");
  const panneau = h("div", { class: "echelle-panneau", "aria-live": "polite" });
  /** @param {import("./lib.js").VueEchelle} v */
  const afficher = (v) => {
    if (v.calcul) {
      const n = calculer(v.calcul, etat.figures);
      remplir(panneau,
        h("p", { class: "nombre-heros" }, n === null ? t("chiffre.a-completer") : `≈ ${formaterNombre(n, 1)}${v.calcul.unite}`),
        texteRiche(v.texte),
        h("p", { class: "aide" }, t("jeu.echelle.calcule"), " ", Chiffre(v.calcul.a), " ÷ ", Chiffre(v.calcul.b)),
      );
    } else {
      panneau.replaceChildren(h("p", { class: "nombre-heros" }, Chiffre(v.chiffre ?? "")), texteRiche(v.texte));
    }
  };
  const options = vues.map((v, i) => {
    const idV = `${nom}-${v.id}`;
    const input = h("input", { type: "radio", name: nom, id: idV, value: v.id });
    input.checked = i === 0;
    input.addEventListener("change", () => afficher(v));
    return h("span", { class: "vue-option" }, input, h("label", { for: idV }, v.libelle));
  });
  if (vues[0]) afficher(vues[0]);
  return h(
    "section",
    { class: "jeu jeu-echelle etape-echelle" },
    h("p", { class: "etape-type" }, t("module.etape.echelle")),
    h("h3", {}, e.titre ?? ""),
    e.texte ? texteRiche(e.texte) : null,
    h("fieldset", { class: "vues" }, h("legend", {}, t("jeu.echelle.legende")), h("div", { class: "vues-options" }, options)),
    panneau,
  );
}

// ---------- Vrai, faux ou trompeur ? ----------

/** @type {import("./lib.js").Verdict[]} */
const VERDICTS = ["exact", "trompeur", "faux", "inverifiable"];

/** @param {Etape} e */
export function VraiFaux(e) {
  const cartes = e.cartes ?? [];
  let repondues = 0;
  let accords = 0;
  const bilan = h("p", { class: "resultat", role: "status" });
  const articles = cartes.map((c) => {
    const nom = nouvelId(c.id);
    const zone = h("div", {});
    const radios = VERDICTS.map((v) => {
      const idR = `${nom}-${v}`;
      const input = h("input", { type: "radio", name: nom, id: idR, value: v });
      return { input, el: h("span", { class: "verdict-option" }, input, h("label", { for: idR }, t(`verdict.${v}`))) };
    });
    for (const { input } of radios) {
      input.addEventListener("change", () => {
        for (const r of radios) r.input.disabled = true;
        const juste = input.value === c.verdict;
        repondues++;
        if (juste) accords++;
        remplir(zone,
          retour(juste, juste ? t("jeu.vrai-faux.accord", { v: t(`verdict.${c.verdict}`) }) : t("jeu.vrai-faux.desaccord", { v: t(`verdict.${c.verdict}`) })),
          texteRiche(c.explication),
        );
        if (repondues === cartes.length) bilan.textContent = t("jeu.vrai-faux.bilan", { n: accords, total: cartes.length });
      });
    }
    return h(
      "article",
      { class: "carte-affirmation" },
      h("blockquote", {}, texteRiche(c.affirmation)),
      h("fieldset", { class: "verdicts" }, h("legend", {}, t("jeu.vrai-faux.question")), h("div", { class: "verdicts-options" }, radios.map((r) => r.el))),
      zone,
    );
  });
  return Cadre(e, e.titre ?? t("jeu.vrai-faux.titre"), articles, bilan);
}

// ---------- Classer ----------

/**
 * @param {{ titre?: string, consigne?: string, categories?: { id: string, label: string }[], items?: import("./lib.js").ItemClassement[], type?: string }} a
 * @param {() => void} [quandFini]
 */
export function Classement(a, quandFini) {
  const categories = a.categories ?? [];
  const items = a.items ?? [];
  const zone = h("p", { class: "resultat", role: "status" });
  /** @type {HTMLSelectElement[]} */
  const selects = [];
  const lis = items.map((it) => {
    const idSel = nouvelId("classement");
    const select = h("select", { id: idSel }, h("option", { value: "" }, t("module.activite.choisir")), categories.map((c) => h("option", { value: c.id }, c.label)));
    selects.push(select);
    return h("li", { class: "item-classement" }, h("label", { for: idSel }, it.texte), select, h("div", { class: "retour-zone" }));
  });
  const verifier = () => {
    let justes = 0;
    items.forEach((it, i) => {
      const juste = selects[i]?.value === it.reponse;
      if (juste) justes++;
      const label = categories.find((c) => c.id === it.reponse)?.label ?? "";
      const z = lis[i]?.querySelector(".retour-zone");
      if (z) remplir(z,
        retour(juste, `${juste ? `✓ ${t("module.correct")}` : `✗ ${t("module.a-revoir")} ${t("jeu.classement.attendu", { c: label })}`} ${it.commentaire}`),
      );
    });
    zone.textContent = t("module.quiz.score", { score: justes, total: items.length });
    quandFini?.();
  };
  return h(
    "section",
    { class: "jeu jeu-classement" },
    h("p", { class: "etape-type" }, t("module.etape.classement")),
    h("h3", {}, a.titre ?? ""),
    a.consigne ? texteRiche(a.consigne, "consigne") : null,
    h("ol", { class: "liste-classement" }, lis),
    h("button", { type: "button", class: "bouton", onclick: verifier }, t("module.activite.verifier")),
    zone,
  );
}

// ---------- Petite vérification (récupération en mémoire, retour immédiat) ----------

/** @param {Etape} e */
export function Verif(e) {
  const nom = nouvelId("verif");
  const zone = h("div", {});
  const radios = (e.choix ?? []).map((c) => {
    const idC = `${nom}-${c.id}`;
    const input = h("input", { type: "radio", name: nom, id: idC, value: c.id });
    return { input, el: h("div", { class: "choix" }, input, h("label", { for: idC }, c.texte)) };
  });
  for (const { input } of radios) {
    input.addEventListener("change", () => {
      for (const r of radios) r.input.disabled = true;
      const juste = input.value === e.reponse;
      const bonne = e.choix?.find((c) => c.id === e.reponse)?.texte ?? "";
      remplir(zone,
        retour(juste, juste ? `✓ ${t("module.correct")}` : `✗ ${t("jeu.verif.reponse", { r: bonne })}`),
        e.explication ? texteRiche(e.explication) : null,
      );
    });
  }
  return h(
    "section",
    { class: "jeu jeu-verif" },
    h("fieldset", {}, h("legend", {}, h("span", { class: "etape-type" }, t("module.etape.verif")), " ", e.question ?? ""), radios.map((r) => r.el)),
    zone,
  );
}

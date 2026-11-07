// Graphiques accessibles : barres comparées (HTML) et courbe historique (SVG).
// Règles : traits fins, une seule échelle, étiquettes en couleur de texte,
// légende dès deux séries, tableau équivalent toujours disponible.

import { formaterNombre } from "./lib.js";
import { h, t, nouvelId } from "./noyau.js";

const SVG = "http://www.w3.org/2000/svg";

/**
 * Crée un élément SVG.
 * @param {string} balise
 * @param {Record<string, string | number>} [attributs]
 * @param {...(Node | string)} enfants
 * @returns {SVGElement}
 */
function s(balise, attributs = {}, ...enfants) {
  const el = /** @type {SVGElement} */ (document.createElementNS(SVG, balise));
  for (const [nom, valeur] of Object.entries(attributs)) el.setAttribute(nom, String(valeur));
  el.append(...enfants);
  return el;
}

/**
 * Tableau de données équivalent à un graphique, replié par défaut.
 * @param {string[]} entetes
 * @param {(string)[][]} lignes
 */
export function TableauDonnees(entetes, lignes) {
  return h(
    "details",
    { class: "tableau-donnees" },
    h("summary", {}, t("graphique.tableau")),
    h(
      "div",
      { class: "tableau-defilant" },
      h(
        "table",
        {},
        h("thead", {}, h("tr", {}, entetes.map((e) => h("th", { scope: "col" }, e)))),
        h("tbody", {}, lignes.map((l) => h("tr", {}, l.map((c, i) => (i === 0 ? h("th", { scope: "row" }, c) : h("td", {}, c)))))),
      ),
    ),
  );
}

/**
 * Barres horizontales comparant deux séries (par exemple : votre partage et la réalité).
 * @param {{ lignes: { label: string, a: number, b: number }[], legendeA: string, legendeB: string, unite: string }} p
 */
export function BarresComparees(p) {
  const max = Math.max(...p.lignes.flatMap((l) => [l.a, l.b]), 1);
  /** @param {number} v @param {string} serie @param {string} legende */
  const barre = (v, serie, legende) =>
    h(
      "div",
      { class: "barre-ligne" },
      h("span", { class: `barre barre-${serie}`, style: `width: ${(v / max) * 100}%`, title: `${legende} : ${formaterNombre(v)}${p.unite}` }),
      h("span", { class: "barre-valeur" }, `${formaterNombre(v)}${p.unite}`),
    );
  return h(
    "div",
    { class: "barres-comparees" },
    h(
      "ul",
      { class: "legende", "aria-hidden": "true" },
      h("li", {}, h("span", { class: "pastille barre-a" }), p.legendeA),
      h("li", {}, h("span", { class: "pastille barre-b" }), p.legendeB),
    ),
    h(
      "div",
      { class: "barres", "aria-hidden": "true" },
      p.lignes.map((l) => h("div", { class: "barres-groupe" }, h("p", { class: "barres-label" }, l.label), barre(l.a, "a", p.legendeA), barre(l.b, "b", p.legendeB))),
    ),
    TableauDonnees(
      ["", p.legendeA, p.legendeB],
      p.lignes.map((l) => [l.label, `${formaterNombre(l.a)}${p.unite}`, `${formaterNombre(l.b)}${p.unite}`]),
    ),
  );
}

/**
 * Courbe d'une série annuelle, avec repères numérotés, curseur au survol et au clavier.
 * @param {import("./lib.js").Serie} serie
 * @param {{ annee: number, libelle: string }[]} evenements
 */
export function Courbe(serie, evenements) {
  const L = 360;
  const H = 230;
  const m = { g: 38, d: 52, h: 22, b: 28 };
  const pts = serie.points;
  const premier = pts[0];
  const dernier = pts[pts.length - 1];
  if (!premier || !dernier) return h("p", {}, t("chiffre.a-completer"));
  const x0 = premier[0];
  const x1 = dernier[0];
  const yMax = Math.ceil(Math.max(...pts.map((p) => p[1])) / 20) * 20;
  const unite = serie.unite === "% PIB" ? " %" : " Md€";
  /** @param {number} a */
  const X = (a) => m.g + ((a - x0) / (x1 - x0)) * (L - m.g - m.d);
  /** @param {number} v */
  const Y = (v) => H - m.b - (v / yMax) * (H - m.h - m.b);

  const svg = s("svg", { viewBox: `0 0 ${L} ${H}`, class: "courbe-svg", "aria-hidden": "true", focusable: "false" });
  for (let v = 0; v <= yMax; v += 20) {
    svg.append(s("line", { x1: m.g, x2: L - m.d, y1: Y(v), y2: Y(v), class: "grille" }));
    svg.append(s("text", { x: m.g - 6, y: Y(v) + 4, "text-anchor": "end", class: "axe" }, `${v}${v === yMax ? " %" : ""}`));
  }
  for (let a = Math.ceil(x0 / 10) * 10; a <= x1; a += 10) {
    svg.append(s("text", { x: X(a), y: H - 8, "text-anchor": "middle", class: "axe" }, String(a)));
  }
  const chemin = pts.map((p, i) => `${i === 0 ? "M" : "L"}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(" ");
  svg.append(s("path", { d: `${chemin} L${X(x1)} ${Y(0)} L${X(x0)} ${Y(0)} Z`, class: "aire" }));
  svg.append(s("path", { d: chemin, class: "trait" }));
  evenements.forEach((e, i) => {
    const p = pts.find((q) => q[0] === e.annee);
    if (!p) return;
    svg.append(s("circle", { cx: X(p[0]), cy: Y(p[1]), r: 4, class: "repere" }));
    svg.append(s("text", { x: X(p[0]), y: Y(p[1]) - 10, "text-anchor": "middle", class: "repere-num" }, String(i + 1)));
  });
  svg.append(s("circle", { cx: X(dernier[0]), cy: Y(dernier[1]), r: 4.5, class: "point-final" }));
  svg.append(s("text", { x: X(dernier[0]) + 8, y: Y(dernier[1]) + 4, class: "etiquette-fin" }, `${formaterNombre(dernier[1])}${unite}`));
  const curseur = s("line", { x1: 0, x2: 0, y1: m.h, y2: H - m.b, class: "curseur", visibility: "hidden" });
  const point = s("circle", { cx: 0, cy: 0, r: 4.5, class: "point-final", visibility: "hidden" });
  svg.append(curseur, point);

  const bulle = h("div", { class: "bulle", hidden: true });
  const annonce = h("p", { class: "visuellement-cache", "aria-live": "polite" });
  let index = pts.length - 1;
  /** @param {number} i */
  const montrer = (i) => {
    index = Math.max(0, Math.min(pts.length - 1, i));
    const p = pts[index];
    if (!p) return;
    curseur.setAttribute("x1", String(X(p[0])));
    curseur.setAttribute("x2", String(X(p[0])));
    curseur.setAttribute("visibility", "visible");
    point.setAttribute("cx", String(X(p[0])));
    point.setAttribute("cy", String(Y(p[1])));
    point.setAttribute("visibility", "visible");
    const texte = `${p[0]} : ${formaterNombre(p[1])}${unite}`;
    bulle.textContent = texte;
    bulle.hidden = false;
    bulle.style.left = `${(X(p[0]) / L) * 100}%`;
    annonce.textContent = texte;
  };
  const cacher = () => {
    curseur.setAttribute("visibility", "hidden");
    point.setAttribute("visibility", "hidden");
    bulle.hidden = true;
  };
  const zone = h("div", {
    class: "courbe-zone",
    tabindex: 0,
    role: "img",
    "aria-label": `${serie.libelle}, de ${x0} à ${x1}. ${t("graphique.clavier")}`,
  });
  zone.append(svg, bulle);
  zone.addEventListener("pointermove", (e) => {
    const r = zone.getBoundingClientRect();
    const annee = x0 + (((e.clientX - r.left) / r.width) * L - m.g) / (L - m.g - m.d) * (x1 - x0);
    montrer(pts.findIndex((p) => p[0] === Math.round(Math.max(x0, Math.min(x1, annee)))));
  });
  zone.addEventListener("pointerleave", cacher);
  zone.addEventListener("blur", cacher);
  zone.addEventListener("keydown", (e) => {
    const pas = { ArrowLeft: -1, ArrowRight: 1, Home: -pts.length, End: pts.length }[e.key];
    if (pas === undefined) return;
    e.preventDefault();
    montrer(index + pas);
  });

  const idLegende = nouvelId("reperes");
  return h(
    "div",
    { class: "courbe" },
    zone,
    annonce,
    evenements.length > 0
      ? h("ol", { class: "reperes", id: idLegende }, evenements.map((e) => h("li", {}, h("strong", {}, `${e.annee} : `), e.libelle)))
      : null,
    TableauDonnees(
      [t("graphique.annee"), serie.libelle],
      pts.map((p) => [String(p[0]), `${formaterNombre(p[1])}${unite}`]),
    ),
  );
}

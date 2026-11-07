// Chargement des données JSON depuis Node (scripts et tests).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("..", import.meta.url));

/**
 * @param {string} chemin relatif à la racine du dépôt
 * @returns {unknown}
 */
export function lireJson(chemin) {
  return JSON.parse(readFileSync(new URL(chemin, `file://${racine}`), "utf8"));
}

export function chargerDonnees() {
  const formation = /** @type {import("../src/lib.js").Formation} */ (lireJson("data/formation.json"));
  const figures = /** @type {import("../src/lib.js").Figure[]} */ (lireJson("data/figures.json"));
  return { formation, figures, racine };
}

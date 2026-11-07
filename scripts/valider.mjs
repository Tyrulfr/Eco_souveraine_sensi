// Valide data/figures.json et data/formation.json.
// Sortie 1 s'il existe au moins une erreur ; les avertissements sont résumés.
// Option --details : liste aussi chaque avertissement.
import { chargerDonnees } from "./donnees.mjs";
import { validerFigures, validerFormation, validerSeries } from "../src/validation.js";

const { formation, figures, series } = chargerDonnees();
const constats = [...validerFigures(figures), ...validerSeries(series), ...validerFormation(formation, figures, series)];
const erreurs = constats.filter((c) => c.gravite === "erreur");
const avertissements = constats.filter((c) => c.gravite === "avertissement");

for (const c of erreurs) console.error(`ERREUR  ${c.chemin} : ${c.message}`);
if (process.argv.includes("--details")) {
  for (const c of avertissements) console.log(`AVERT.  ${c.chemin} : ${c.message}`);
}
console.log(`Validation du contenu : ${erreurs.length} erreur(s), ${avertissements.length} avertissement(s).`);
process.exit(erreurs.length > 0 ? 1 : 0);

// Construit le site statique dans dist/ après validation du contenu.
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { chargerDonnees } from "./donnees.mjs";

const { racine } = chargerDonnees();
execFileSync(process.execPath, [join(racine, "scripts/valider.mjs")], { stdio: "inherit" });

const dist = join(racine, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const element of ["index.html", "src", "data", "assets"]) {
  cpSync(join(racine, element), join(dist, element), { recursive: true });
}
console.log("Site statique construit dans dist/.");

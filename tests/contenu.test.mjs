import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chargerDonnees, lireJson } from "../scripts/donnees.mjs";
import { validerFigures, validerFormation } from "../src/validation.js";
import { compterMots, MOTS_MAX_COUCHE1 } from "../src/lib.js";

const { formation, figures } = chargerDonnees();

test("figures.json : aucune erreur de schéma", () => {
  const erreurs = validerFigures(figures).filter((c) => c.gravite === "erreur");
  assert.deepEqual(erreurs, []);
});

test("formation.json : aucune erreur de contenu", () => {
  const erreurs = validerFormation(formation, figures).filter((c) => c.gravite === "erreur");
  assert.deepEqual(erreurs, []);
});

test("six modules, slugs uniques, le module 1 est complet", () => {
  assert.equal(formation.modules.length, 6);
  assert.equal(new Set(formation.modules.map((m) => m.slug)).size, 6);
  assert.equal(formation.modules[0]?.statut, "complet");
});

test("chaque concept existe dans les trois couches", () => {
  for (const c of formation.modules.flatMap((m) => m.concepts)) {
    assert.ok(c.couche1.texte && c.couche1.image && c.couche1.alt, `${c.id} : couche 1`);
    assert.ok(c.couche2.mecanisme && c.couche2.ordreDeGrandeur && c.couche2.comparaison, `${c.id} : couche 2`);
    assert.ok(c.couche3.enjeu && c.couche3.questionOuverte, `${c.id} : couche 3`);
    assert.ok(compterMots(c.couche1.texte) < MOTS_MAX_COUCHE1, `${c.id} : couche 1 trop longue`);
  }
});

test("chaque module complet a une lecture opposée sourcée", () => {
  const ids = new Set(formation.sources.map((s) => s.id));
  for (const m of formation.modules.filter((x) => x.statut === "complet")) {
    assert.ok(m.lectureOpposee, `${m.slug} : lecture opposée manquante`);
    assert.ok(ids.has(m.lectureOpposee.source), `${m.slug} : source inconnue`);
  }
});

test("la validation détecte un chiffre en dur, une consigne de vote et une couche manquante", () => {
  const copie = structuredClone(formation);
  const m = copie.modules[0];
  assert.ok(m);
  const c = m.concepts[0];
  assert.ok(c);
  c.couche2.comparaison = "Cela fait 57 % du total.";
  c.couche3.enjeu = "Votez pour celui qui baisse les impôts.";
  // @ts-expect-error : test volontaire d'une couche absente
  delete m.concepts[1].couche3;
  const messages = validerFormation(copie, figures).filter((x) => x.gravite === "erreur").map((x) => x.message);
  assert.ok(messages.some((x) => x.includes("chiffre écrit en dur")));
  assert.ok(messages.some((x) => x.includes("prescriptive")));
  assert.ok(messages.some((x) => x.includes("trois couches")));
});

test("les images de la couche 1 existent", () => {
  for (const c of formation.modules.flatMap((m) => m.concepts)) {
    assert.doesNotThrow(() => readFileSync(new URL(`../${c.couche1.image}`, import.meta.url)), c.couche1.image);
  }
});

test("toutes les clés d'interface utilisées dans app.js existent", () => {
  const ui = /** @type {Record<string, string>} */ (lireJson("data/ui.fr-FR.json"));
  const code = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const cles = new Set([
    ...[...code.matchAll(/\bt\(\s*"([a-z0-9.-]+)"/g)].map((m) => m[1]),
    ...[...code.matchAll(/\["#\/[a-z]*", "([a-z0-9.-]+)"\]/g)].map((m) => m[1]),
    ...[...html.matchAll(/data-ui="([a-z0-9.-]+)"/g)].map((m) => m[1]),
    "statut.verifie", "statut.a-verifier", "statut.a-completer",
    "profondeur.1", "profondeur.2", "profondeur.3",
    "module.etape.situation", "module.etape.question", "module.etape.grille", "module.etape.debat",
  ]);
  const manquantes = [...cles].filter((k) => k && !(k in ui));
  assert.deepEqual(manquantes, []);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chiffresCites,
  compterMots,
  decouperTexte,
  ecrireProgression,
  formaterValeur,
  lireProgression,
  progressionParDefaut,
  CLE_STOCKAGE,
} from "../src/lib.js";

/** @returns {import("../src/lib.js").Figure} */
const figure = (/** @type {Partial<import("../src/lib.js").Figure>} */ champs) => ({
  id: "x",
  libelle: "x",
  valeur: 1,
  unite: "%",
  date: null,
  source: null,
  url: null,
  dateVerification: "2026-11-06",
  statut: "a-verifier",
  ...champs,
});

// Espace insécable fine (U+202F) ou espace insécable (U+00A0) selon l'ICU : on normalise.
const norm = (/** @type {string} */ s) => s.replace(/[\u00a0\u202f]/g, " ");

test("formaterValeur : pourcentage du PIB avec virgule française", () => {
  assert.equal(norm(formaterValeur(figure({ valeur: 57.2, unite: "% PIB" }))), "57,2 % du PIB");
});

test("formaterValeur : milliards, fourchette, approximation", () => {
  assert.equal(norm(formaterValeur(figure({ valeur: 79.2, unite: "Md€" }))), "79,2 Md€");
  assert.equal(norm(formaterValeur(figure({ valeur: [150, 175], unite: "pb" }))), "150 à 175 points de base");
  assert.equal(norm(formaterValeur(figure({ valeur: 5, unite: "%", approx: true }))), "≈ 5 %");
});

test("formaterValeur : donnée manquante affichée comme telle", () => {
  assert.equal(formaterValeur(figure({ valeur: null, statut: "a-completer" })), "donnée à compléter");
});

test("decouperTexte : alterne texte et jetons", () => {
  assert.deepEqual(decouperTexte("A {{chiffre:dette-pib}} B"), [
    { type: "texte", valeur: "A " },
    { type: "chiffre", id: "dette-pib" },
    { type: "texte", valeur: " B" },
  ]);
  assert.deepEqual(decouperTexte("{{chiffre:a}}"), [{ type: "chiffre", id: "a" }]);
  assert.deepEqual(chiffresCites("x {{chiffre:a}} y {{chiffre:b-c}}"), ["a", "b-c"]);
});

test("compterMots : apostrophes et ponctuation", () => {
  assert.equal(compterMots("L'argent public paie les écoles."), 6);
  assert.equal(compterMots("Celui qui prête demande un loyer : ce sont les intérêts."), 10);
});

test("progression : stockage absent, corrompu, puis aller-retour", () => {
  assert.deepEqual(lireProgression(null), progressionParDefaut());
  /** @type {Map<string, string>} */
  const m = new Map();
  const stockage = { getItem: (/** @type {string} */ k) => m.get(k) ?? null, setItem: (/** @type {string} */ k, /** @type {string} */ v) => void m.set(k, v) };
  m.set(CLE_STOCKAGE, "{pas du json");
  assert.deepEqual(lireProgression(stockage), progressionParDefaut());
  const p = progressionParDefaut();
  p.profondeur = 3;
  p.modules.m1 = { quiz: 3, quizTotal: 4, termine: true };
  assert.equal(ecrireProgression(stockage, p), true);
  assert.deepEqual(lireProgression(stockage), p);
});

test("progression : un stockage qui lève une exception ne casse rien", () => {
  const hostile = {
    getItem: () => {
      throw new Error("bloqué");
    },
    setItem: () => {
      throw new Error("plein");
    },
  };
  assert.deepEqual(lireProgression(hostile), progressionParDefaut());
  assert.equal(ecrireProgression(hostile, progressionParDefaut()), false);
});

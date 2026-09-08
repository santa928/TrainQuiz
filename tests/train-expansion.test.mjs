import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildQuestion } from "../js/quiz-engine.js";

const trains = JSON.parse(
  readFileSync(new URL("../data/trains.json", import.meta.url), "utf8"),
);
const newIds = [
  "odakyu-mse", "odakyu-vse", "odakyu-exe", "odakyu-exe-alpha",
  "odakyu-lse", "odakyu-hise", "odakyu-rse", "odakyu-nse",
  "seibu-laview", "seibu-new-red-arrow", "seibu-smile-train", "seibu-2000",
  "tokyu-2020", "tokyu-6020", "tokyu-5050", "sotetsu-12000", "sotetsu-20000",
  "keikyu-2100", "keikyu-1000", "keikyu-blue-sky",
  "e8-tsubasa", "n700s-kamome", "0-shinkansen", "tobu-spacia-100",
  "tobu-revaty", "sonic-883", "sunrise-285", "saphir-odoriko",
  "enoden-300", "hakone-allegra",
];

test("all 30 new trains can be answered in distinct four-choice questions", () => {
  const quizTrains = trains.filter((train) => train.category !== "steam");
  const newNames = new Set();
  const newPhotos = new Set();

  for (const id of newIds) {
    const question = buildQuestion(quizTrains, id, () => 0.5);
    assert.equal(question.answer.id, id);
    assert.equal(question.choices.filter((choice) => choice.id === id).length, 1);
    assert.equal(new Set(question.choices.map((choice) => choice.displayName)).size, 4);
    newNames.add(question.answer.displayName);
    newPhotos.add(question.answer.imageSourceUrl);
  }

  assert.equal(newNames.size, 30);
  assert.equal(newPhotos.size, 30);
});

test("similar train variants retain their individually verified photographs", () => {
  const expectedFiles = {
    "odakyu-exe": "Odakyu-EXE-30000.jpg",
    "odakyu-exe-alpha": "Odakyu-Type30000-EXEa-Hakone.jpg",
    "tokyu-2020": "Tokyu-Series2020-2141F.jpg",
    "tokyu-6020": "Tokyu Series6020-6122.jpg",
    "tokyu-5050": "Tokyu 5050 series.jpg",
    "keikyu-2100": "Keikyu-Type2100-73.jpg",
    "keikyu-blue-sky": "Keikyu Type 2100-2133F Limited Express.jpg",
    "n700s-kamome": "N700S-Y4 Kamome-29.jpg",
  };

  for (const [id, filename] of Object.entries(expectedFiles)) {
    const train = trains.find((entry) => entry.id === id);
    assert.ok(train, id);
    const source = decodeURIComponent(train.imageSourceUrl).replaceAll("_", " ");
    assert.equal(source, `https://commons.wikimedia.org/wiki/File:${filename}`);
  }
});

test("retired additions describe their former service in the past tense", () => {
  for (const id of ["odakyu-vse", "odakyu-lse", "odakyu-hise", "odakyu-rse", "odakyu-nse", "0-shinkansen"]) {
    const train = trains.find((entry) => entry.id === id);
    assert.ok(train, id);
    assert.match(train.encyclopedia.routeSummary, /はしった/);
    assert.match(train.encyclopedia.routeEndpointsSummary, /はしった/);
  }
});

test("Keikyu 2100 livery choices distinguish red trains from Blue Sky", () => {
  const pool = trains.filter((train) => [
    "keikyu-2100", "keikyu-1000", "keikyu-blue-sky", "enoden-300",
  ].includes(train.id));
  const question = buildQuestion(pool, "keikyu-blue-sky", () => 0.5);
  const redChoice = question.choices.find((choice) => choice.id === "keikyu-2100");

  assert.ok(redChoice);
  assert.match(redChoice.displayName, /赤|あか/);
  assert.match(question.answer.displayName, /ブルースカイ/);
  assert.ok(!question.choices.some((choice) => choice.displayName === "京急2100形"));
});

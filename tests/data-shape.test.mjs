import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const trains = JSON.parse(
  readFileSync(new URL("../data/trains.json", import.meta.url), "utf8"),
);
const seeds = JSON.parse(
  readFileSync(new URL("../data/train-seeds.json", import.meta.url), "utf8"),
);

test("train data contains the minimum required fields", () => {
  assert.ok(Array.isArray(trains));
  assert.ok(trains.length >= 12);

  for (const train of trains) {
    assert.ok(train.id);
    assert.ok(train.displayName);
    assert.ok(train.canonicalName);
    assert.ok(train.productName);
    assert.ok(train.productEvidenceUrl);
    assert.ok(train.category);
    assert.ok(train.operator);
    assert.ok(train.wikipediaTitle);
    assert.ok(train.wikipediaUrl);
    assert.ok(train.imageUrl);
    assert.ok(train.imageSourceUrl);
    assert.ok(train.imageLicense);
    assert.ok(train.imageAuthor);
    assert.ok(typeof train.descriptionShort === "string");
  }
});

test("descriptionShort is populated for every published train", () => {
  for (const train of trains) {
    assert.notEqual(train.descriptionShort.trim(), "");
  }
});

test("id is unique across the published data", () => {
  const seenIds = new Set();

  for (const train of trains) {
    assert.equal(seenIds.has(train.id), false);
    seenIds.add(train.id);
  }
});

test("E231 near-suburban train uses a near-suburban image source", () => {
  const e231Near = trains.find((train) => train.id === "e231-near");

  assert.ok(e231Near);
  assert.equal(
    e231Near.imageSourceUrl,
    "https://commons.wikimedia.org/wiki/File:E231%E7%B3%BB%E8%BF%91%E9%83%8A%E5%BD%A2%E3%83%BBK-38%E7%B7%A8%E6%88%90%EF%BC%88%E5%89%8D%E7%85%A7%E7%81%AF%E6%9B%B4%E6%96%B0%E5%BE%8C%EF%BC%89.jpg",
  );
});

test("published data includes line-color and livery variants as separate questions", () => {
  const ids = new Set(trains.map((train) => train.id));

  assert.equal(ids.has("n700-mizuho-sakura"), true);
  assert.equal(ids.has("e235-yokosuka"), true);
  assert.equal(ids.has("panda-kuroshio"), true);
  assert.equal(ids.has("urbanliner-next"), true);
});

test("descriptionShort stays in sync between train seeds and published data", () => {
  const seedDescriptions = new Map(
    seeds.map((seed) => [seed.id, seed.descriptionShort ?? ""]),
  );

  for (const train of trains) {
    assert.equal(train.descriptionShort, seedDescriptions.get(train.id));
  }
});

test("selected trains expose encyclopedia fields for parent-child learning", () => {
  const sampleIds = new Set([
    "e5-hayabusa",
    "h5-hayabusa",
    "e235-yamanote",
    "e235-yokosuka",
    "meitetsu-mu-sky",
    "blue-mu-sky-130th",
    "eh500-kintaro",
    "ef210-momotaro",
    "ef510-red-thunder",
    "d51-200",
    "c61-20",
    "c57-yamaguchi",
  ]);

  for (const train of trains.filter((entry) => sampleIds.has(entry.id))) {
    assert.ok(train.encyclopedia);
    assert.notEqual(train.encyclopedia.routeSummary.trim(), "");
    assert.notEqual(train.encyclopedia.featureSummary.trim(), "");
    assert.notEqual(train.encyclopedia.speedLabel.trim(), "");
    assert.ok(typeof train.encyclopedia.topSpeedKmh === "number");
  }
});

test("encyclopedia fields stay in sync between train seeds and published data", () => {
  const seedEncyclopedia = new Map(
    seeds.map((seed) => [seed.id, JSON.stringify(seed.encyclopedia ?? null)]),
  );

  for (const train of trains) {
    assert.equal(
      JSON.stringify(train.encyclopedia ?? null),
      seedEncyclopedia.get(train.id),
    );
  }
});

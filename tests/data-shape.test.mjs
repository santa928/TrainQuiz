import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const trains = JSON.parse(
  readFileSync(new URL("../data/trains.json", import.meta.url), "utf8"),
);
const seeds = JSON.parse(
  readFileSync(new URL("../data/train-seeds.json", import.meta.url), "utf8"),
);
const normalizeCommonsSource = (url) =>
  decodeURIComponent(url).replaceAll("_", " ");

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

test("every published train exposes encyclopedia fields for parent-child learning", () => {
  const publishedIds = new Set(trains.map((train) => train.id));

  for (const train of trains) {
    assert.ok(train.encyclopedia);
    assert.notEqual(train.encyclopedia.routeSummary.trim(), "");
    assert.notEqual(train.encyclopedia.featureSummary.trim(), "");
    assert.notEqual(train.encyclopedia.speedLabel.trim(), "");
    assert.ok(typeof train.encyclopedia.topSpeedKmh === "number");

    if (train.encyclopedia.comparison) {
      assert.ok(publishedIds.has(train.encyclopedia.comparison.otherTrainId));
      assert.notEqual(train.encyclopedia.comparison.summary.trim(), "");
    }
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

test("issue 6 image overrides keep the intended train variants", () => {
  const byId = new Map(trains.map((train) => [train.id, train]));
  const h5Hayabusa = byId.get("h5-hayabusa");
  const e5Hayabusa = byId.get("e5-hayabusa");
  const e3Tsubasa = byId.get("e3-tsubasa");
  const e3Tsubasa2000 = byId.get("e3-tsubasa-2000");
  const helloKitty = byId.get("hello-kitty-shinkansen");

  assert.ok(h5Hayabusa);
  assert.ok(e5Hayabusa);
  assert.ok(e3Tsubasa);
  assert.ok(e3Tsubasa2000);
  assert.ok(helloKitty);

  assert.notEqual(h5Hayabusa.imageSourceUrl, e5Hayabusa.imageSourceUrl);
  assert.match(
    normalizeCommonsSource(h5Hayabusa.imageSourceUrl),
    /File:JRH Series-H5 H1\.jpg$/,
  );
  assert.match(
    normalizeCommonsSource(e3Tsubasa.imageSourceUrl),
    /File:Shinkansen-e3-tsubasa colour\.jpg$/,
  );
  assert.match(
    normalizeCommonsSource(e3Tsubasa2000.imageSourceUrl),
    /File:E3-2000 L67 Akayu Tsubasa 128 20150905\.jpg$/,
  );
  assert.match(
    normalizeCommonsSource(helloKitty.imageSourceUrl),
    /File:Hello Kitty Shinkansen in Shin-Shimonoseki\.jpg$/,
  );
});

test("issue 6 naming cleanup is reflected in published data", () => {
  const byId = new Map(trains.map((train) => [train.id, train]));
  const e657Hitachi = byId.get("e657-hitachi-yellow");
  const e233Chuo = byId.get("e233-chuo-green");

  assert.ok(e657Hitachi);
  assert.ok(e233Chuo);
  assert.equal(e657Hitachi.displayName, "E657系特急ひたち");
  assert.equal(e657Hitachi.canonicalName, "E657系ひたち");
  assert.match(
    normalizeCommonsSource(e657Hitachi.imageSourceUrl),
    /File:Series-E657-K19 Hitachi-20\.jpg$/,
  );
  assert.equal(e233Chuo.displayName, "E233系中央線");
  assert.equal(e233Chuo.canonicalName, "E233系中央線");
  assert.equal(byId.has("e3-tsubasa-2000-renewal"), false);
});

test("issue 6 removes wrap-train questions when no wrap image is available", () => {
  const byId = new Map(trains.map((train) => [train.id, train]));

  assert.equal(byId.has("keihan-thomas"), false);
  assert.equal(byId.has("pikmin-train"), false);
});

test("tsubasa variants describe 1000 and 2000 series consistently", () => {
  const byId = new Map(trains.map((train) => [train.id, train]));
  const tsubasa1000 = byId.get("e3-tsubasa");
  const tsubasa2000 = byId.get("e3-tsubasa-2000");

  assert.ok(tsubasa1000);
  assert.ok(tsubasa2000);
  assert.equal(tsubasa1000.displayName, "E3系新幹線つばさ1000番台");
  assert.equal(tsubasa1000.canonicalName, "E3系1000番代");
  assert.match(tsubasa1000.descriptionShort, /1000ばんだい/);
  assert.match(
    normalizeCommonsSource(tsubasa1000.imageSourceUrl),
    /File:Shinkansen-e3-tsubasa colour\.jpg$/,
  );
  assert.match(tsubasa1000.descriptionShort, /ぎん|シルバー/);
  assert.match(tsubasa1000.encyclopedia.featureSummary, /ぎん|シルバー/);
  assert.match(tsubasa2000.descriptionShort, /2000ばんだい/);
  assert.match(
    normalizeCommonsSource(tsubasa2000.imageSourceUrl),
    /File:E3-2000 L67 Akayu Tsubasa 128 20150905\.jpg$/,
  );
  assert.match(tsubasa2000.descriptionShort, /むらさき/);
  assert.match(tsubasa2000.encyclopedia.featureSummary, /むらさき/);
  assert.doesNotMatch(tsubasa2000.encyclopedia.featureSummary, /E5/);
  assert.match(tsubasa2000.encyclopedia.featureSummary, /かお|ライト/);
  assert.match(tsubasa2000.encyclopedia.comparison.summary, /1000ばんだい/);
  assert.doesNotMatch(tsubasa1000.encyclopedia.comparison.summary, /E5/);
  assert.match(tsubasa1000.encyclopedia.comparison.summary, /むらさき/);
  assert.match(tsubasa1000.encyclopedia.comparison.summary, /かお|ライト/);
});

test("issue 9 adds the requested Keio train questions", () => {
  const ids = new Set(trains.map((train) => train.id));

  assert.equal(ids.has("keio-7000"), true);
  assert.equal(ids.has("keio-8000"), true);
  assert.equal(ids.has("keio-9000"), true);
  assert.equal(ids.has("keio-2000"), true);
  assert.equal(ids.has("keio-9000-takao"), true);
});

test("issue 9 treats keio-2000 as the 2026 model, not the retired first generation", () => {
  const byId = new Map(trains.map((train) => [train.id, train]));
  const keio2000 = byId.get("keio-2000");

  assert.ok(keio2000);
  assert.equal(keio2000.wikipediaTitle, "Keio 2000 series");
  assert.match(
    normalizeCommonsSource(keio2000.imageSourceUrl),
    /File:Keio2000 2751 for Keio-Hachioji 20260201\.jpg$/,
  );
  assert.match(keio2000.descriptionShort, /ひだまり|あたらしい/);
  assert.doesNotMatch(keio2000.descriptionShort, /むかし|ライトグリーン/);
});

test("issue 9 adds representative Toei subway train questions", () => {
  const ids = new Set(trains.map((train) => train.id));

  assert.equal(ids.has("toei-shinjuku-10-300"), true);
  assert.equal(ids.has("toei-mita-6500"), true);
  assert.equal(ids.has("toei-oedo-12-600"), true);
  assert.equal(ids.has("toei-asakusa-5500"), true);
});

test("issue 9 adds representative Tokyo Metro train questions", () => {
  const ids = new Set(trains.map((train) => train.id));

  assert.equal(ids.has("metro-ginza-1000"), true);
  assert.equal(ids.has("metro-marunouchi-2000"), true);
  assert.equal(ids.has("metro-hibiya-13000"), true);
  assert.equal(ids.has("metro-tozai-15000"), true);
  assert.equal(ids.has("metro-chiyoda-16000"), true);
  assert.equal(ids.has("metro-yurakucho-17000"), true);
  assert.equal(ids.has("metro-fukutoshin-17000"), true);
  assert.equal(ids.has("metro-hanzomon-18000"), true);
  assert.equal(ids.has("metro-namboku-9000"), true);
});

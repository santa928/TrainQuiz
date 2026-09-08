import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildQuestion } from "../js/quiz-engine.js";

const trains = JSON.parse(readFileSync(new URL("../data/trains.json", import.meta.url)));
const byId = new Map(trains.map((train) => [train.id, train]));
const sourceFile = (train) => decodeURIComponent(train.imageSourceUrl).split("File:")[1].replaceAll("_", " ");

test("explicit Commons seeds use the same article title as the locked published record", () => {
  const seeds = JSON.parse(readFileSync(new URL("../data/train-seeds.json", import.meta.url)));
  for (const seed of seeds.filter(seed => seed.commonsFileTitle)) {
    assert.equal(seed.wikipediaTitle, byId.get(seed.id).wikipediaTitle, seed.id);
  }
});

for (const [id, file] of [
  ["d51-200", "D51 200 steam locomotive 2018-05-05.jpg"],
  ["c61-20", "C61 20 SL rapid train.jpg"],
  ["l0-maglev", "L0-950.jpg"],
  ["e231-sobu", "JRE E231 500 Chuo Sobu.jpg"],
  ["meitetsu-6500", "Meitetsu Mikawa Line 6500 series 6.jpg"],
  ["e233-keiyo", "Series-E233-5000-502F.jpg"],
  ["keio-8000", "Keio8000 8725F 20090924.jpg"],
  ["n700a", "N700A-G1.jpg"],
  ["e233-shonan", "Series-E233-3000-Ino-STA.jpg"],
  ["hello-kitty-shinkansen", "JRW-500 V2 521-7002 HelloKitty Shinkansen in Himeji.jpg"],
  ["rapid-acty-211", "JNR 211.JPG"],
  ["103-saikyo", "103-3501 Nishi-Kawagoe - Matoba 20040605.JPG"],
  ["n700s-kamome", "N700S 722-8102 Front-side.jpg"],
]) {
  test(`${id} keeps the photograph verified for its number or variant`, () => {
    assert.equal(sourceFile(byId.get(id)), file);
  });
}

test("yellow Hitachi uses the yellow K2 revival livery in photo and learning text", () => {
  const train = byId.get("e657-hitachi-yellow");
  assert.equal(sourceFile(train), "JRE Series-E657-K2 Hitachi-6.jpg");
  assert.match(train.displayName, /黄色/);
  assert.match(train.productName, /黄色/);
  assert.match(train.descriptionShort, /きいろ/);
  assert.match(train.encyclopedia.featureSummary, /きいろ/);
  assert.doesNotMatch(train.descriptionShort + train.encyclopedia.featureSummary, /あかい ライン/);
});

test("ordinary 500 series and Hello Kitty names do not overlap in the same four choices", () => {
  const ids = ["500-nozomi", "doctor-yellow", "800-tsubame", "hello-kitty-shinkansen"];
  const pool = trains.filter(train => ids.includes(train.id));
  for (const answerId of ["500-nozomi", "hello-kitty-shinkansen"]) {
    const question = buildQuestion(pool, answerId, () => 0.5);
    assert.equal(question.choices.length, 4);
    assert.equal(question.answer.id, answerId);
    assert.equal(question.choices.find(train => train.id === "500-nozomi").displayName, "500系新幹線（通常色）");
    assert.equal(question.choices.find(train => train.id === "hello-kitty-shinkansen").displayName, "ハローキティ新幹線");
  }
});

test("ordinary and special Keio 8000 liveries do not overlap in four choices", () => {
  const pool = trains.filter(train => ["keio-8000", "keio-9000-takao", "keio-7000", "keio-9000"].includes(train.id));
  const question = buildQuestion(pool, "keio-9000-takao", () => 0.5);
  assert.equal(question.choices.length, 4);
  assert.match(question.choices.find(train => train.id === "keio-8000").displayName, /通常色/);
  assert.match(question.answer.displayName, /高尾山/);
});

test("improved L0 describes its shape and specified commercial maximum speed", () => {
  const train = byId.get("l0-maglev");
  assert.match(train.encyclopedia.featureSummary, /かいりょう/);
  assert.equal(train.encyclopedia.topSpeedKmh, 500);
});

test("Kawagoe 103-3500 retains its ID but no longer teaches the wrong line", () => {
  const train = byId.get("103-saikyo");
  assert.match(train.displayName, /川越線/);
  assert.match(train.canonicalName, /3500/);
  assert.match(train.descriptionShort, /うぐいすいろ の からだ/);
  assert.doesNotMatch(JSON.stringify(train), /埼京線|さいきょうせん/);
  assert.match(byId.get("103-joban").encyclopedia.comparison.summary, /かわごえせん/);
});

test("ordinary and reversed Mu Sky liveries do not overlap in four choices", () => {
  const pool = trains.filter(train => ["meitetsu-mu-sky", "blue-mu-sky-130th", "nankai-rapit", "odakyu-gse"].includes(train.id));
  const question = buildQuestion(pool, "blue-mu-sky-130th", () => 0.5);
  assert.equal(question.choices.length, 4);
  assert.match(question.choices.find(train => train.id === "meitetsu-mu-sky").displayName, /通常色/);
  assert.match(question.answer.displayName, /反転塗装/);
});

test("silver Red Thunder consistently identifies the single Kyushu EF510-300 subject", () => {
  const train = byId.get("ef510-red-thunder");
  assert.equal(sourceFile(train), "JRF EF510-301 Nippo-main-Line.jpg");
  assert.match(train.displayName, /シルバー/);
  assert.match(train.canonicalName, /300/);
  assert.match(train.productName, /シルバー/);
  assert.match(train.descriptionShort, /ぎんいろ/);
  assert.match(train.encyclopedia.featureSummary, /ぎんいろ/);
  assert.match(train.encyclopedia.routeSummary, /きゅうしゅう/);
  assert.equal(train.operator, "JR貨物");
  assert.doesNotMatch(train.descriptionShort + train.encyclopedia.featureSummary, /あかい (からだ|いろ)/);
});

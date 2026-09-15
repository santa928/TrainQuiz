import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TRAIN_READINGS, getTrainReading } from "../js/train-readings.js";

const trains = JSON.parse(readFileSync(new URL("../data/trains.json", import.meta.url)));

test("全車両の表示名に読みがあり、古い名前や未変換文字を残さない", () => {
  const names = [...new Set(trains.map((train) => train.displayName))].sort();
  assert.deepEqual(Object.keys(TRAIN_READINGS).sort(), names);
  for (const train of trains) {
    const reading = getTrainReading(train.displayName);
    assert.match(reading, /^[ぁ-ゖー・ （）]+$/u, train.id);
    assert.ok(reading.trim(), train.id);
    // Prevent dropping a type suffix or changing a 型/形 into 系 while fixing pronunciation.
    assert.equal((reading.match(/がた(?= |（|$|しけんしゃ)/g) ?? []).length, (train.displayName.match(/[型形]/g) ?? []).length, train.id);
    assert.equal((reading.match(/けい(?= |（|$)/g) ?? []).length, (train.displayName.match(/系/g) ?? []).length, train.id);
  }
});

test("形式の助数表現・特殊番号・英字愛称・難読名を省略せずに読む", () => {
  const cases = [
    ["東武8000型", "とうぶ はっせんがた"],
    ["京王8000系（通常色）", "けいおう はっせんけい（つうじょうしょく）"],
    ["923形ドクターイエロー", "きゅうひゃくにじゅうさんがた どくたーいえろー"],
    ["都営新宿線10-300形", "とえいしんじゅくせん いちまんさんびゃくがた"],
    ["都営大江戸線12-600形", "とえいおおえどせん いちまんにせんろっぴゃくがた"],
    ["京成スカイライナーAE形", "けいせい すかいらいなー えーいーがた"],
    ["京急新1000形", "けいきゅう しんせんがた"],
    ["西武001系ラビュー", "せいぶ ぜろぜろいちけい らびゅー"],
    ["883系ソニック", "はっぴゃくはちじゅうさんけい そにっく"],
    ["E3系新幹線つばさ1000番台", "いーさんけい しんかんせん つばさ せんばんだい"],
    ["E3系新幹線つばさ2000番台", "いーさんけい しんかんせん つばさ にせんばんだい"],
    ["922形ドクターイエローT3編成", "きゅうひゃくにじゅうにがた どくたーいえろー てぃーさんへんせい"],
    ["D51 200号機", "でぃーごじゅういち にひゃくごうき"],
    ["C57 1号機SLやまぐち号", "しーごじゅうなな いちごうき えすえるやまぐちごう"],
    ["超電導リニアL0系 改良型試験車", "ちょうでんどうりにあ えるぜろけい かいりょうがたしけんしゃ"],
    ["小田急ロマンスカーEXE", "おだきゅう ろまんすかー えくせ"],
    ["小田急ロマンスカーEXEα", "おだきゅう ろまんすかー えくせあるふぁ"],
    ["小田急ロマンスカーHiSE", "おだきゅう ろまんすかー はいえすいー"],
    ["小田急ロマンスカーGSE", "おだきゅう ろまんすかー じーえすいー"],
    ["阪急2300系PRiVACE", "はんきゅう にせんさんびゃくけい ぷらいべーす"],
    ["E4系新幹線Maxとき・Maxたにがわ", "いーよんけい しんかんせん まっくすとき・まっくすたにがわ"],
    ["近鉄アーバンライナーnext", "きんてつ あーばんらいなーねくすと"],
    ["E235系山手線", "いーにひゃくさんじゅうごけい やまのてせん"],
    ["E531系常磐線", "いーごひゃくさんじゅういちけい じょうばんせん"],
    ["E233系京葉線", "いーにひゃくさんじゅうさんけい けいようせん"],
    ["E231系総武線", "いーにひゃくさんじゅういちけい そうぶせん"],
    ["E233系京浜東北線", "いーにひゃくさんじゅうさんけい けいひんとうほくせん"],
    ["E235系横須賀線", "いーにひゃくさんじゅうごけい よこすかせん"],
    ["伊予灘ものがたり", "いよなだものがたり"],
    ["103系川越線（うぐいす色）", "ひゃくさんけい かわごえせん（うぐいすいろ）"],
    ["京急2100形（あか）", "けいきゅう にせんひゃくがた（あか）"],
    ["京急2100形ブルースカイトレイン", "けいきゅう にせんひゃくがた ぶるーすかいとれいん"],
  ];
  for (const [name, reading] of cases) assert.equal(getTrainReading(name), reading, name);
});

test("別の表示名を同じ読みへ潰さず、同名のE5の2件だけを共有する", () => {
  const readings = Object.values(TRAIN_READINGS);
  assert.equal(new Set(readings).size, readings.length);
  const e5 = trains.filter((train) => train.displayName === "E5系新幹線はやぶさ");
  assert.equal(e5.length, 2);
  assert.equal(getTrainReading(e5[0].displayName), getTrainReading(e5[1].displayName));
});

test("未登録名では表示情報を勝手に省略・推測変換しない", () => {
  assert.equal(getTrainReading("新しい車両"), "新しい車両");
  assert.equal(getTrainReading("constructor"), "constructor");
});

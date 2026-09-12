import test from "node:test";
import assert from "node:assert/strict";
import { createSpeechPlayer } from "../js/speech.js";

import { createSpeechWindow } from "./helpers/speech-window.mjs";

test("順番に日本語で読み、実際の発話開始に合わせて対象を知らせる", () => {
  const view = createSpeechWindow();
  const states = [];
  const player = createSpeechPlayer(view, (state) => states.push(state));
  player.play([{ id: "a", text: "みずいろ。はやぶさ" }, { id: "b", text: "ぴんく。こまち" }]);
  assert.deepEqual(view.utterances.map((u) => u.text), ["みずいろ。はやぶさ", "ぴんく。こまち"]);
  assert.equal(view.utterances[0].lang, "ja-JP");
  assert.equal(view.utterances[0].voice.localService, true);
  assert.ok(view.utterances[0].rate < 1);
  view.utterances[0].onstart();
  assert.equal(states.at(-1).activeId, "a");
  view.utterances[1].onstart();
  assert.equal(states.at(-1).activeId, "b");
  view.utterances[1].onend();
  assert.equal(states.at(-1).activeId, null);
  assert.equal(states.at(-1).status, "idle");
});

test("聞き直し・停止後に古い音声イベントが来ても再生状態を変えない", () => {
  const view = createSpeechWindow();
  const states = [];
  const player = createSpeechPlayer(view, (state) => states.push(state));
  player.play([{ id: "a", text: "はやぶさ" }]);
  const old = view.utterances[0];
  player.play([{ id: "b", text: "こまち" }]);
  view.utterances[1].onstart();
  old.onstart();
  old.onerror({ error: "interrupted" });
  old.onend();
  assert.equal(states.at(-1).activeId, "b");
  player.stop();
  view.utterances[1].onstart();
  assert.equal(states.at(-1).activeId, null);
  assert.ok(view.speechSynthesis.cancelCount >= 2);
});

test("端末内の日本語音声が遅れて使えるようになったら再試行できる", () => {
  const view = createSpeechWindow();
  const states = [];
  view.speechSynthesis.voices = [{ lang: "en-US", localService: true }, { lang: "ja-JP", localService: false }];
  const player = createSpeechPlayer(view, (state) => states.push(state));
  player.play([{ id: "a", text: "はやぶさ" }]);
  assert.equal(view.utterances.length, 0);
  assert.equal(states.at(-1).status, "unavailable");
  view.speechSynthesis.voices.push({ lang: "ja_JP", localService: true });
  player.play([{ id: "a", text: "はやぶさ" }]);
  assert.equal(view.utterances.length, 1);
});

test("非対応・再生エラーを報告し、失敗したキューを停止する", () => {
  const states = [];
  const unsupported = createSpeechPlayer({}, (state) => states.push(state));
  assert.equal(unsupported.supported, false);
  unsupported.play([{ id: "a", text: "はやぶさ" }]);
  assert.equal(states.at(-1).status, "unsupported");
  const view = createSpeechWindow();
  const player = createSpeechPlayer(view, (state) => states.push(state));
  player.play([{ id: "a", text: "はやぶさ" }]);
  view.utterances[0].onerror({ error: "not-allowed" });
  assert.equal(states.at(-1).status, "error");
  assert.equal(states.at(-1).activeId, null);
  assert.ok(view.speechSynthesis.cancelCount > 0);
});

test("発話イベントが来ない場合は停止して再試行でき、停止時にタイマーも消す", () => {
  const view = createSpeechWindow();
  const timers = new Map();
  let timerId = 0;
  view.setTimeout = (callback) => {
    timers.set(++timerId, callback);
    return timerId;
  };
  view.clearTimeout = (id) => timers.delete(id);
  const states = [];
  const player = createSpeechPlayer(view, (state) => states.push(state));
  player.play([{ id: "a", text: "はやぶさ" }]);
  [...timers.values()][0]();
  assert.equal(states.at(-1).status, "error");
  assert.equal(timers.size, 0);
  player.play([{ id: "b", text: "こまち" }]);
  view.utterances.at(-1).onstart();
  assert.equal(states.at(-1).activeId, "b");
  player.stop();
  assert.equal(timers.size, 0);
});

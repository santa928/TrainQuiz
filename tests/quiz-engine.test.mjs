import test from "node:test";
import assert from "node:assert/strict";

import { buildQuestion, sanitizeChoicePool } from "../js/quiz-engine.js";

const sampleTrains = [
  {
    id: "e5-hayabusa",
    displayName: "E5系新幹線はやぶさ",
    canonicalName: "E5系",
    category: "shinkansen",
    imageUrl: "https://example.com/e5.jpg",
  },
  {
    id: "n700s",
    displayName: "N700S新幹線",
    canonicalName: "N700S",
    category: "shinkansen",
    imageUrl: "https://example.com/n700s.jpg",
  },
  {
    id: "doctor-yellow",
    displayName: "923形ドクターイエロー",
    canonicalName: "923形",
    category: "shinkansen",
    imageUrl: "https://example.com/doctor-yellow.jpg",
  },
  {
    id: "e6-komachi",
    displayName: "E6系新幹線こまち",
    canonicalName: "E6系",
    category: "shinkansen",
    imageUrl: "https://example.com/e6.jpg",
  },
  {
    id: "e235-yamanote",
    displayName: "E235系山手線",
    canonicalName: "E235系",
    category: "commuter",
    imageUrl: "https://example.com/e235.jpg",
  },
];

test("sanitizeChoicePool keeps distinct products even when canonicalName matches", () => {
  const sanitized = sanitizeChoicePool([
    sampleTrains[0],
    {
      ...sampleTrains[0],
      id: "e5-hayabusa-speed-change",
      displayName: "E5系新幹線はやぶさ スピードチェンジ",
    },
    sampleTrains[1],
  ]);

  assert.equal(sanitized.length, 3);
  assert.deepEqual(
    sanitized.map((train) => train.id),
    ["e5-hayabusa", "e5-hayabusa-speed-change", "n700s"],
  );
});

test("buildQuestion prefers same-category distractors", () => {
  const question = buildQuestion(sampleTrains, "e5-hayabusa", () => 0.2);

  assert.equal(question.correctId, "e5-hayabusa");
  assert.equal(question.choices.length, 4);
  assert.equal(
    question.choices.filter((choice) => choice.category === "shinkansen").length,
    4,
  );
  assert.equal(
    question.choices.filter((choice) => choice.id === "e5-hayabusa").length,
    1,
  );
});

test("buildQuestion falls back to other categories when needed", () => {
  const sparsePool = [
    sampleTrains[0],
    sampleTrains[4],
    {
      id: "yu",
      displayName: "ゆふいんの森",
      canonicalName: "キハ71系",
      category: "limited_express",
      imageUrl: "https://example.com/yu.jpg",
    },
    {
      id: "dd51",
      displayName: "DD51形ディーゼル機関車",
      canonicalName: "DD51形",
      category: "diesel",
      imageUrl: "https://example.com/dd51.jpg",
    },
  ];

  const question = buildQuestion(sparsePool, "e5-hayabusa", () => 0.8);

  assert.equal(question.choices.length, 4);
  assert.ok(question.choices.some((choice) => choice.category !== "shinkansen"));
});

test("buildQuestion does not include duplicate display names in the choices", () => {
  const pool = [
    sampleTrains[0],
    {
      ...sampleTrains[0],
      id: "e5-hayabusa-speed-change",
      productName: "S-16 レールで速度チェンジ!! E5系新幹線はやぶさ",
    },
    sampleTrains[1],
    sampleTrains[2],
    sampleTrains[4],
  ];

  const question = buildQuestion(pool, "e5-hayabusa", () => 0.2);

  assert.deepEqual(
    question.choices.map((choice) => choice.displayName).sort(),
    [
      "E5系新幹線はやぶさ",
      "E235系山手線",
      "N700S新幹線",
      "923形ドクターイエロー",
    ].sort(),
  );
});

test("buildQuestion can exclude steam trains from both answers and distractors", () => {
  const pool = [
    ...sampleTrains,
    {
      id: "d51",
      displayName: "D51 200号機",
      canonicalName: "D51形",
      category: "steam",
      imageUrl: "https://example.com/d51.jpg",
    },
  ].filter((train) => train.category !== "steam");

  const question = buildQuestion(pool, "e5-hayabusa", () => 0.2);

  assert.equal(question.choices.some((choice) => choice.category === "steam"), false);
  assert.equal(question.answer.category, "shinkansen");
});

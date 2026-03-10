import test from "node:test";
import assert from "node:assert/strict";

import { QUESTIONS_PER_ROUND, buildRoundOrder } from "../js/round.js";

test("buildRoundOrder returns exactly five ids when enough questions exist", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  const order = buildRoundOrder(ids, () => 0.4);

  assert.equal(order.length, QUESTIONS_PER_ROUND);
  assert.equal(new Set(order).size, QUESTIONS_PER_ROUND);
  assert.ok(order.every((id) => ids.includes(id)));
});

test("buildRoundOrder returns all ids when fewer than five exist", () => {
  const ids = ["a", "b", "c"];
  const order = buildRoundOrder(ids, () => 0.4);

  assert.deepEqual(order.sort(), ids.sort());
});

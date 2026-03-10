# 完了後タイトル復帰 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 5問完了後の CTA でタイトル画面へ戻れるようにし、再挑戦導線を消す

**Architecture:** 既存の完了画面を維持しつつ、`js/app.js` の完了状態だけを変更する。`showCompletion()` で完了文言と CTA 文言を差し替え、`handleNext()` の `state.completedRound` 分岐で新ラウンド生成ではなく `setView("title")` を呼ぶ。テストはフェイク DOM ベースの既存 `tests/app.test.mjs` に追加し、RED -> GREEN で固定する。

**Tech Stack:** HTML, CSS, Vanilla JavaScript (ES Modules), Node.js built-in test runner, Docker / `node:22-alpine`

---

### Task 1: 完了後タイトル復帰の failing test を追加する

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

**Step 1: Write the failing test**

`tests/app.test.mjs` に次を追加する。

```js
test("完了画面のボタンを押すとタイトル画面へ戻る", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.state.completedRound = true;
  elements.next.hidden = false;
  elements.next.textContent = "🏠 タイトルへ もどる";
  elements.titleScreen.hidden = true;
  elements.quizScreen.hidden = false;

  app.handleNext();

  assert.equal(elements.titleScreen.hidden, false);
  assert.equal(elements.quizScreen.hidden, true);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL because completion handling still regenerates a round instead of returning to title.

**Step 3: Write minimal implementation**

`js/app.js` の完了時分岐を、ラウンド再生成ではなく `setView("title")` に変更する。

**Step 4: Run test to verify it passes**

同じコマンドを実行し、追加テストが PASS することを確認する。

**Step 5: Commit**

```bash
git add tests/app.test.mjs js/app.js
git commit -m "完了後にタイトルへ戻るようにする"
```

### Task 2: 完了文言を調整して回帰確認する

**Files:**
- Modify: `js/app.js`
- Modify: `README.md`

**Step 1: Write the failing test**

完了文言を固定する最小テストを `tests/app.test.mjs` に追加する。

```js
assert.equal(elements.next.textContent, "🏠 タイトルへ もどる");
assert.equal(elements.answer.textContent, "たいへん よくできました 💮");
```

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL because completion text still points to replay.

**Step 3: Write minimal implementation**

`showCompletion()` の `answer` と `next` 文言を更新し、README の説明が必要なら微修正する。

**Step 4: Run test to verify it passes**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs
```

Expected: PASS

**Step 5: Commit**

```bash
git add js/app.js tests/app.test.mjs README.md
git commit -m "完了導線をタイトル復帰向けに調整する"
```

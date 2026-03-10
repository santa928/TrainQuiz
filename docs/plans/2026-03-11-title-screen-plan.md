# タイトル画面 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 初回表示をタイトル画面に変更し、`クイズをはじめる` 導線と将来の `ずかん` 導線枠を追加する

**Architecture:** `index.html` は単一ページのまま維持し、`js/app.js` に `title` と `quiz` の view 切り替えを追加する。クイズデータの読み込みは従来どおり起動時に行うが、描画開始はタイトル画面のボタン押下まで遅延させる。DOM テストで初回表示と画面遷移を先に固定し、CSS は既存カードを流用してスマホ縦とタブレット縦で破綻しない範囲の調整にとどめる。

**Tech Stack:** HTML, CSS, Vanilla JavaScript (ES Modules), Node.js built-in test runner, Docker Compose / `node:22-alpine`

---

### Task 1: タイトル画面の DOM テストを追加する

**Files:**
- Modify: `tests/app.test.mjs`

**Step 1: Write the failing test**

`tests/app.test.mjs` に次を追加する。

```js
test("bootstrap 後はタイトル画面が表示され、クイズ画面は隠れる", async () => {
  const app = await loadApp();

  await app.bootstrap();

  assert.equal(app.elements.titleScreen.hidden, false);
  assert.equal(app.elements.quizScreen.hidden, true);
  assert.equal(app.elements.startButton.disabled, false);
  assert.equal(app.elements.encyclopediaButton.disabled, true);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL with missing title screen elements or missing hidden state management.

**Step 3: Write minimal implementation**

`index.html` と `js/app.js` にタイトル画面要素と `elements.titleScreen` 参照を追加する。

**Step 4: Run test to verify it passes**

同じコマンドを実行し、対象テストが PASS することを確認する。

**Step 5: Commit**

```bash
git add tests/app.test.mjs index.html js/app.js
git commit -m "タイトル画面の初回表示を追加する"
```

### Task 2: 開始ボタンの画面遷移を実装する

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `js/app.js`

**Step 1: Write the failing test**

`tests/app.test.mjs` に次を追加する。

```js
test("クイズをはじめるを押すとクイズ画面に切り替わる", async () => {
  const app = await loadApp();

  await app.bootstrap();
  app.elements.startButton.click();

  assert.equal(app.elements.titleScreen.hidden, true);
  assert.equal(app.elements.quizScreen.hidden, false);
  assert.match(app.elements.status.textContent, /^1 \\/ 5 もん$/);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL because the start button does not trigger view changes yet.

**Step 3: Write minimal implementation**

`js/app.js` に `setView` と `startQuiz` を追加し、開始ボタン押下で初回問題を描画する。

**Step 4: Run test to verify it passes**

同じコマンドを実行し、追加したテストが PASS することを確認する。

**Step 5: Commit**

```bash
git add tests/app.test.mjs js/app.js
git commit -m "タイトル画面からクイズ開始できるようにする"
```

### Task 3: タイトル画面のスタイルと文言を整える

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `README.md`

**Step 1: Write the failing test**

見た目中心のため自動テストは増やさず、既存テストを安全網として使う。

**Step 2: Run test to verify current baseline**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs
```

Expected: PASS after Task 1-2 implementation.

**Step 3: Write minimal implementation**

タイトル画面の説明文、主導線、`ずかん` の無効ボタン、補足文を `index.html` と `styles.css` に追加し、README にタイトル画面の説明を追記する。

**Step 4: Run test to verify it passes**

同じコマンドを実行し、既存テストが引き続き PASS することを確認する。

**Step 5: Commit**

```bash
git add index.html styles.css README.md
git commit -m "タイトル画面の見た目を整える"
```

### Task 4: Docker で最終検証する

**Files:**
- Modify: なし

**Step 1: Run automated tests**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs
```

Expected: PASS

**Step 2: Run app for manual UI verification**

Run:

```bash
docker compose up --build -d
```

Expected: `http://localhost:8080` で起動し、初回表示がタイトル画面になる。

**Step 3: Verify representative viewports**

スマホ縦とタブレット縦でタイトル画面と開始後画面を確認し、重なりやはみ出しがないことを確認する。

**Step 4: Stop containers if needed**

Run:

```bash
docker compose down
```

**Step 5: Commit**

```bash
git add docs/plans/2026-03-11-title-screen-design.md docs/plans/2026-03-11-title-screen-plan.md
git commit -m "タイトル画面の設計と実装計画を追加する"
```

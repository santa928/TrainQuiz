# Encyclopedia Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 単一ページ構成のまま図鑑一覧と図鑑詳細を追加し、短い説明文付きで車両を見られるようにする。

**Architecture:** `index.html` に図鑑一覧/詳細の view を追加し、`js/app.js` で view 状態と選択中車両を管理する。既存の `hidden` 切り替えを拡張し、データ品質は `tests/data-shape.test.mjs` で固定する。

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in test runner, Docker Compose / `node:22-alpine`

---

### Task 1: 図鑑導線の失敗テストを追加する

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

**Step 1: Write the failing test**

- タイトル画面で `encyclopediaButton` が有効になること
- ボタン押下で図鑑一覧 view が表示されること
- 一覧カードから詳細へ進めること
- 詳細から一覧へ戻れること

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`
Expected: FAIL because encyclopedia view and handlers do not exist yet

**Step 3: Write minimal implementation**

- `index.html` に一覧/詳細セクションを追加する
- `js/app.js` に view 切り替えと描画関数を追加する
- `styles.css` に最小限の図鑑レイアウトを追加する

**Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`
Expected: PASS

### Task 2: 説明文データの失敗テストを追加する

**Files:**
- Modify: `tests/data-shape.test.mjs`
- Modify: `data/trains.json`
- Test: `tests/data-shape.test.mjs`

**Step 1: Write the failing test**

- `descriptionShort` が空文字ではないことを全件で確認する

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/data-shape.test.mjs`
Expected: FAIL because many trains still have an empty `descriptionShort`

**Step 3: Write minimal implementation**

- `data/trains.json` の空欄を、既存フィールドだけで説明できる短文に補完する

**Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/data-shape.test.mjs`
Expected: PASS

### Task 3: 図鑑 UI を整えて関連文書を更新する

**Files:**
- Modify: `styles.css`
- Modify: `README.md`

**Step 1: Write the failing test**

- 既存の app test で図鑑 view の文言と戻り導線が検証できる状態にする

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`
Expected: FAIL if labels or structure are still inconsistent

**Step 3: Write minimal implementation**

- 既存テーマに合わせて図鑑カードと詳細本文を整える
- README の機能説明を更新する

**Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`
Expected: PASS

### Task 4: 回帰確認と完了検証

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `js/app.js`
- Modify: `tests/app.test.mjs`
- Modify: `tests/data-shape.test.mjs`
- Modify: `data/trains.json`
- Modify: `README.md`

**Step 1: Run focused verification**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs tests/data-shape.test.mjs tests/quiz-engine.test.mjs tests/round.test.mjs`
Expected: PASS

**Step 2: Run full verification**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs`
Expected: PASS

**Step 3: Manual smoke in Docker**

Run: `docker compose up --build -d`
Expected: app available on `http://localhost:8080`

**Step 4: Capture viewport evidence**

- スマホ縦とタブレット縦で、タイトル -> 図鑑一覧 -> 詳細 -> タイトル -> クイズ の導線を確認する

**Step 5: Summarize results**

- 受け入れ条件、非対象、残リスクを確認して報告する

# 選択肢背景色 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 4択ボタンに位置固定の背景色を付け、正解・不正解・無効状態でも見分けやすさを維持する。

**Architecture:** `js/app.js` でボタン生成時に位置スロットを示す `data-slot` を付け、`styles.css` でスロットごとのベース色と状態レイヤを定義する。見た目の回帰は Node テストから CSS 文字列を検査して固定する。

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, Node test runner

---

### Task 1: ボタンの位置スロット付与をテストで固定する

**Files:**
- Create: `tests/app.test.mjs`
- Modify: `js/app.js`

**Step 1: Write the failing test**

- `createChoiceButton` 相当の生成処理が位置インデックスから `data-slot` を付けるテストを書く
- 4択以外でも `0` 始まりで順に割り当てることを確認する

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`

**Step 3: Write minimal implementation**

- `createChoiceButton` に `slotIndex` 引数を追加する
- `renderQuestion` 側で `choices.map((choice, index) => createChoiceButton(choice, index))` に変える
- 生成したボタンへ `data-slot` を付与する

**Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`

### Task 2: 色付きボタンの CSS をテストで固定する

**Files:**
- Modify: `styles.css`
- Modify: `tests/app.test.mjs`

**Step 1: Write the failing test**

- `styles.css` に `data-slot="0"` から `data-slot="3"` までのルールがあることを確認する
- `correct` と `wrong` の状態ルールが残り、`correct` が背景色全面上書きではなく枠線中心の表現であることを確認する

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`

**Step 3: Write minimal implementation**

- 4 色のベース背景色を追加する
- hover / focus / active のシャドウをベース色と衝突しない形に調整する
- `correct / wrong / disabled` の状態レイヤを追加する
- スマホ縦 / タブレット縦の `gap` と `min-height` を少し調整する

**Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`

### Task 3: ドキュメント更新と全体確認

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

- README の `できること` に色付き選択肢を追記する

**Step 2: Run relevant tests**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs`

**Step 3: Run UI smoke verification**

Run: `docker compose up -d`

Run: `playwright` または既存手段でスマホ縦とタブレット縦のスクリーンショットを取得する

# 図鑑一覧スクロール復元 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 図鑑詳細から一覧へ戻ったとき、直前に見ていた一覧スクロール位置へ戻れるようにする。

**Architecture:** `js/app.js` の図鑑 state に復元用の値を追加し、詳細へ入る前に保存、一覧へ戻る時だけ復元する。TDD として `tests/app.test.mjs` の Fake DOM へ最小限の scroll/focus 挙動を追加し、失敗テストから実装する。

**Tech Stack:** Static HTML, vanilla JavaScript, Node.js built-in test runner, Docker `node:22-alpine`

---

### Task 1: スクロール復元の失敗テストを追加する

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

**Step 1: Write the failing test**

- 一覧を開いたあと `scrollTop` を進めてカードを押す
- 詳細から一覧へ戻ると元の `scrollTop` が復元されることを確認する
- タイトルから図鑑を開いた時は `scrollTop` が 0 のまま始まることも確認する

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`
Expected: FAIL because app does not yet preserve encyclopedia list scroll state

### Task 2: 図鑑一覧の scroll state を実装する

**Files:**
- Modify: `js/app.js`
- Test: `tests/app.test.mjs`

**Step 1: Write minimal implementation**

- `state` に `encyclopediaListScrollTop` と `encyclopediaPageScrollY` を追加する
- 詳細表示前に現在の一覧 `scrollTop` と `window.scrollY` を保存する
- `showEncyclopediaList()` を通常表示と復元表示で分け、詳細から戻るときだけ保存値を適用する
- 実ブラウザで遅れて scroll が変わるケースに備え、数フレーム後にも page scroll を再適用する

**Step 2: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs`
Expected: PASS

### Task 3: 回帰確認を行う

**Files:**
- Modify: `js/app.js`
- Modify: `tests/app.test.mjs`

**Step 1: Run focused verification**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs tests/quiz-engine.test.mjs tests/round.test.mjs`
Expected: PASS

**Step 2: Run full verification**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs`
Expected: PASS

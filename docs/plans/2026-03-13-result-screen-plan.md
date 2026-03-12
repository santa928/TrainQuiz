# 結果画面 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 5問終了後に `せいかい数` と `もういちど` / `タイトルへ` を表示する結果画面を追加する

**Architecture:** 既存の `quiz-screen` に結果パネルを追加し、`data-mode="question" | "result"` の切り替えで見た目を変える。`js/app.js` では `correctCount` を集計し、結果画面では `next` を使わずに 2 本の CTA へ切り替える。テストは既存のフェイク DOM へ結果要素を足し、RED -> GREEN で受け入れ条件を固定する。

**Tech Stack:** HTML, CSS, Vanilla JavaScript (ES Modules), Node.js built-in test runner, Docker / `node:22-alpine`, nginx (UI 確認用)

---

### Task 1: 結果画面の受け入れ条件を failing test で固定する

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

**Step 1: Write the failing test**

5問終了後に結果パネルが出て、`せいかい数` と `もういちど` / `タイトルへ` の 2 本の導線が見えるテストを追加する。

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL because current app has no result panel or retry button.

**Step 3: Write minimal implementation**

`index.html`, `styles.css`, `js/app.js` に結果画面の最小構成を追加する。

**Step 4: Run test to verify it passes**

同じコマンドで追加テストが PASS することを確認する。

### Task 2: 結果画面の導線を固定して回帰を防ぐ

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `js/app.js`
- Modify: `README.md`
- Test: `tests/app.test.mjs`

**Step 1: Write the failing test**

`もういちど` で新しいラウンドが始まり、`タイトルへ` でタイトル画面へ戻ることを確認するテストを追加する。

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL because current completion flow only has one CTA.

**Step 3: Write minimal implementation**

結果画面専用ハンドラを追加し、README の機能説明を更新する。

**Step 4: Run test to verify it passes**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs
```

Expected: PASS

### Task 3: UI の表示崩れを 2 viewport で確認する

**Files:**
- Verify: `index.html`
- Verify: `styles.css`

**Step 1: Run local UI for verification**

Run:

```bash
docker compose up -d
```

Expected: nginx が `http://localhost:8080` を配信する。

**Step 2: Verify mobile and tablet layouts**

Playwright などでスマホ縦とタブレット縦の 2 viewport を確認し、結果画面で重なりやはみ出しがないことを確認する。

**Step 3: Stop verification environment if needed**

Run:

```bash
docker compose down
```

Expected: 検証用コンテナが停止する。

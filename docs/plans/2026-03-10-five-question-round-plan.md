# 5問固定ラウンド Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 1プレイを全問題からランダムな5問に制限し、既存の完了表示を維持する。

**Architecture:** 出題順の ID 配列生成だけを独立モジュールへ切り出し、`js/app.js` はその配列を使う。進捗表示と完了判定は既存の `state.order.length` ベースをそのまま活かす。

**Tech Stack:** Static HTML, vanilla JavaScript, Node test runner

---

### Task 1: 5問ラウンド生成ロジックをテストで固定する

**Files:**
- Create: `tests/round.test.mjs`
- Create: `js/round.js`

**Step 1: Write the failing test**

- `buildRoundOrder` が 6 件以上あるときに 5 件だけ返すテストを書く
- `buildRoundOrder` が 5 件未満のときは全件返すテストを書く

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/round.test.mjs`

**Step 3: Write minimal implementation**

- `QUESTIONS_PER_ROUND = 5` を持つモジュールを追加する
- シャッフルして先頭5件を返す関数を実装する

**Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/round.test.mjs`

### Task 2: アプリ本体で 5 問ラウンドを使う

**Files:**
- Modify: `js/app.js`

**Step 1: Write the failing integration-oriented test if needed**

- 今回は Task 1 のロジックテストを先に保証として使う

**Step 2: Write minimal implementation**

- 初回起動時の `state.order` を 5 問ラウンドに変更する
- 再プレイ時も 5 問ラウンドを作り直す

**Step 3: Run tests**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs`

### Task 3: ドキュメント更新とスモーク確認

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

- README に 1 プレイ 5 問を追記する

**Step 2: Verify**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs`


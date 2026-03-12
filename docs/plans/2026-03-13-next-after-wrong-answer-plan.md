# 不正解後つぎへ表示 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 不正解直後に `つぎへ` を表示し、正解を押し直さなくても次の問題へ進められるようにする

**Architecture:** 既存の回答状態管理を大きく変えず、`js/app.js` の不正解分岐でその問題を完了扱いに寄せる。`answered` を更新しつつ `wrong` と `correct` を同時に表示し、`answer` と `next` を出す。テストはフェイク DOM ベースの `tests/app.test.mjs` に追加して RED -> GREEN で固定する。

**Tech Stack:** HTML, CSS, Vanilla JavaScript (ES Modules), Node.js built-in test runner, Docker / `node:22-alpine`

---

### Task 1: 不正解後の進行条件を failing test で固定する

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

**Step 1: Write the failing test**

`tests/app.test.mjs` に、不正解時に `wrong` / `correct` が付き、`つぎへ` と正解名が見えることを確認するテストを追加する。

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL because wrong answer flow still keeps `next` hidden.

**Step 3: Write minimal implementation**

`js/app.js` の不正解分岐で `answered` を更新し、`answer` と `next` を表示する。

**Step 4: Run test to verify it passes**

同じコマンドを実行し、追加テストが PASS することを確認する。

### Task 2: 次の問題へ進めることと既存正解フロー維持を確認する

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `js/app.js`
- Test: `tests/app.test.mjs`

**Step 1: Write the failing test**

不正解後に `handleNext()` で次の問題へ進み、正解時フローは従来どおり動くことを確認する追加テストを入れる。

**Step 2: Run test to verify it fails**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs
```

Expected: FAIL because current app requires pressing the correct answer before advancing.

**Step 3: Write minimal implementation**

必要最小限の条件整理だけ行い、既存の正解時フローを崩さないようにする。

**Step 4: Run test to verify it passes**

Run:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs
```

Expected: PASS

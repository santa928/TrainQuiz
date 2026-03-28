# Encyclopedia Route Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 図鑑詳細で各車両の「どこからどこまで」を読めるようにする

**Architecture:** `data/train-seeds.json` の `encyclopedia.routeEndpointsSummary` を正本として追加し、生成データへ反映する。UI は図鑑詳細の spec list に 1 項目だけ増やし、値があるときだけ表示する。

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Python dataset builder, Node.js built-in test runner, Docker

---

### Task 1: route endpoints の失敗テストを追加する

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `tests/data-shape.test.mjs`

- [ ] **Step 1: Write the failing test**

`tests/app.test.mjs` に route endpoints 表示確認を追加し、`tests/data-shape.test.mjs` に `routeEndpointsSummary` の non-empty check を追加する。

- [ ] **Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs tests/data-shape.test.mjs`
Expected: FAIL because the UI and seed data do not expose `routeEndpointsSummary` yet

- [ ] **Step 3: Write minimal implementation**

`index.html` / `js/app.js` / `data/train-seeds.json` を最小差分で更新する。

- [ ] **Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs tests/data-shape.test.mjs`
Expected: PASS

### Task 2: 生成データと文書を同期する

**Files:**
- Modify: `data/train-seeds.json`
- Modify: `data/trains.json`
- Modify: `README.md`

- [ ] **Step 1: Rebuild generated data**

Run: `docker run --rm -v "$PWD":/app -w /app python:3.12-alpine python scripts/build_dataset.py`
Expected: `data/trains.json` regenerated with `routeEndpointsSummary`

- [ ] **Step 2: Update docs**

README の図鑑説明に `どこからどこまで` を追記する。

- [ ] **Step 3: Run focused verification**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/app.test.mjs tests/data-shape.test.mjs`
Expected: PASS

### Task 3: 全体確認を行う

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `tests/app.test.mjs`
- Modify: `tests/data-shape.test.mjs`
- Modify: `README.md`

- [ ] **Step 1: Run full JS tests**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs`
Expected: PASS

- [ ] **Step 2: Manual smoke in Docker**

Run: `docker compose up --build -d`
Expected: app available on `http://localhost:8080`

- [ ] **Step 3: Viewport evidence**

スマホ縦とタブレット縦で、タイトル → 図鑑一覧 → 詳細の route endpoints 表示を確認する。

- [ ] **Step 4: Summarize**

受け入れ条件、非対象、残リスクを確認して報告する。

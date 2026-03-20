# Keio Trains Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 京王 5 件を `TrainQuiz` の公開データへ追加し、Issue #9 の具体列挙分をクイズ対象にする。

**Architecture:** `data/train-seeds.json` を正本として 5 件を追加し、必要な候補だけ seed ごとの `productEvidenceUrl` / `productEvidenceText` を持たせる。`scripts/build_dataset.py` で `data/trains.json` を再生成し、存在確認の回帰は `tests/data-shape.test.mjs` に固定する。

**Tech Stack:** JSON seed data, Python 3 dataset builder, Node.js built-in test runner, Docker `python:3.12-alpine` / `node:22-alpine`

---

### Task 1: 京王 5 件の失敗テストを先に追加する

**Files:**
- Modify: `tests/data-shape.test.mjs`
- Modify: `tests/build_dataset_test.py`
- Modify: `scripts/build_dataset.py`
- Test: `tests/data-shape.test.mjs`

**Step 1: Write the failing test**

- `keio-7000`
- `keio-8000`
- `keio-9000`
- `keio-2000`
- `keio-9000-takao`（表示は高尾山トレイン）

の 5 件が公開データに存在することを検証する。
- `keio-2000` は旧型初代ではなく、2026年運行開始の最新 2000 系になっていることも固定する。
- あわせて `scripts/build_dataset.py` が seed ごとの `productEvidenceUrl` / `productEvidenceText` を使える失敗テストを追加する。

**Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/data-shape.test.mjs`
Expected: FAIL because the five IDs do not exist yet

**Step 3: Write minimal implementation**

- まだ production code は書かず、失敗理由が ID 未追加であることだけ確認する
- まだ production code は書かず、失敗理由が「個別根拠 URL 未対応」と「ID 未追加」であることを確認する

**Step 4: Run test to verify it fails correctly**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/data-shape.test.mjs`
Expected: FAIL with missing Keio IDs

### Task 2: 5 件の seed を追加して公開データを再生成する

**Files:**
- Modify: `scripts/build_dataset.py`
- Modify: `data/train-seeds.json`
- Modify: `data/trains.json`
- Test: `tests/data-shape.test.mjs`

**Step 1: Gather verified source data**

- Wikipedia 記事名と Wikimedia の画像ファイル名を確認する
- 公式商品ページがない候補は、根拠に使う URL と照合文字列を決める
- `descriptionShort` と `encyclopedia` を 5 件ぶん手入力する

**Step 2: Write minimal implementation**

- `scripts/build_dataset.py` を seed ごとの根拠 URL / 照合文字列へ対応させる
- `data/train-seeds.json` に 5 件を追加する
- `python3 scripts/build_dataset.py` で `data/trains.json` を再生成する

**Step 3: Run test to verify it passes**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/data-shape.test.mjs`
Expected: PASS for the new Keio IDs and existing data-shape assertions

### Task 3: 回帰確認を完了する

**Files:**
- Modify: `tests/data-shape.test.mjs`
- Modify: `data/train-seeds.json`
- Modify: `data/trains.json`

**Step 1: Run focused verification**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/data-shape.test.mjs`
Expected: PASS

**Step 2: Run full verification**

Run: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node --test tests/*.test.mjs`
Expected: PASS

**Step 3: Summarize residual scope**

- 都営/東京メトロ未着手を non-goal として報告する
- Docker 不可時はローカル代替の結果と pending を明記する

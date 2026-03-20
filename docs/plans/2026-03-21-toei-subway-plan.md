# 都営地下鉄4路線追加 Plan

**Goal:** Issue `#9` の残りから、都営地下鉄4路線の代表形式を4件追加して公開データへ反映する。

## Task 1: 失敗テストを先に追加する

- `tests/data-shape.test.mjs` に `toei-shinjuku-10-300 / toei-mita-6500 / toei-oedo-12-600 / toei-asakusa-5500` の存在チェックを追加する
- `node --test tests/data-shape.test.mjs` を Docker で実行し、未追加のため失敗することを確認する

## Task 2: seed 正本へ4件を追加する

- `data/train-seeds.json` に都営4件を追加する
- 東京都交通局 `車両形式図` 一覧を `productEvidenceUrl` に使い、各形式名を `productEvidenceText` に明示する
- `wikipediaTitle` と `commonsFileTitle` は実在タイトルを確認したうえで固定する

## Task 3: 公開データ再生成と検証

- `python3 scripts/build_dataset.py` を Docker で実行して `data/trains.json` を再生成する
- `python3 -m unittest tests.build_dataset_test` を Docker で実行する
- `node --test tests/data-shape.test.mjs` と `node --test tests/*.test.mjs` を Docker で実行する

## Exit Criteria

- 都営4件が `data/trains.json` に出力される
- 追加テストを含む focused/full suite が green
- 追加した車両の `descriptionShort` / `encyclopedia` / 画像メタデータが欠落していない

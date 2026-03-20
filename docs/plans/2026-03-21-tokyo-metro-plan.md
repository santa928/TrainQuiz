# 東京メトロ代表車両追加 Plan

**Goal:** Issue `#9` の残りとして、東京メトロ各路線の代表形式を9件追加する。

## Task 1: 失敗テストを先に追加する

- `tests/data-shape.test.mjs` に東京メトロ9件の存在チェックを追加する
- `node --test tests/data-shape.test.mjs` を Docker で実行し、未追加のため失敗することを確認する

## Task 2: seed 正本へ9件を追加する

- `data/train-seeds.json` に東京メトロ9件を追加する
- `1000 / 2000 / 13000 / 15000 / 16000 / 17000 / 18000 / 9000` の記事タイトルと Commons 画像を確認して seed に固定する
- `17000系` は有楽町線と副都心線で別 ID に分ける

## Task 3: 公開データ再生成と検証

- `python3 scripts/build_dataset.py` を Docker で実行して `data/trains.json` を再生成する
- `python3 -m unittest tests.build_dataset_test` を Docker で実行する
- `node --test tests/data-shape.test.mjs` と `node --test tests/*.test.mjs` を Docker で実行する

## Exit Criteria

- 東京メトロ9件が `data/trains.json` に出力される
- 追加テストを含む focused/full suite が green
- 画像メタデータと `descriptionShort` / `encyclopedia` が欠落しない

# 東京メトロ代表車両追加 Design

## Goal

Issue `#9 京王線などの車両追加` の残りとして、東京メトロの代表形式を `TrainQuiz` の公開データへ追加する。

## Decision

- 追加粒度は「各路線の代表1形式ずつ」に固定する
- 対象は `銀座線1000系 / 丸ノ内線2000系 / 日比谷線13000系 / 東西線15000系 / 千代田線16000系 / 副都心線17000系 / 半蔵門線18000系 / 南北線9000系` の8件
- `category` は `commuter`、`operator` は正式名称の `東京地下鉄` を使う
- 東京メトロ公式は curl 取得が不安定なため、再生成の安定性を優先して各形式の Wikipedia 記事を `productEvidenceUrl` に使う
- `17000系` は副都心線だけ残し、有楽町線ぶんは見た目重複を避けるため追加しない

## Why

- Issue 本文は `東京メトロとか` とだけあり、まずは広く各路線を揃えるのが最小で分かりやすい
- 路線網を広く押さえつつ、同じ車両画像が並ぶ違和感は避けたい
- seed 正本 + 再生成の既存ワークフローを崩さずに追加できる

## Scope

- `tests/data-shape.test.mjs` に東京メトロ8件の存在チェックを追加する
- `data/train-seeds.json` に8件の seed を追加する
- `scripts/build_dataset.py` で `data/trains.json` を再生成する
- Docker で focused/full suite を実行する

## Non-Goals

- 東京メトロ各路線で旧形式まで広げること
- UI 変更やカテゴリ追加
- 他社直通先の車両を別問題として追加すること

## Data Notes

- `displayName` は路線名込みで読み分けやすくする
- `topSpeedKmh` は記事内で確認できる営業最高速度の最大値を使う
- 画像は Wikimedia の実在ファイル名を `commonsFileTitle` で固定する

## Risks and Mitigations

- 東京メトロ公式ページが bot 取得で不安定: 再生成が確実な Wikipedia 記事で evidence を固定する
- `17000系` の候補が1件減る: 見た目重複を避ける判断を優先し、必要なら将来 `10000系` など別形式で有楽町線を補う

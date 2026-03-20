# 都営地下鉄4路線追加 Design

## Goal

Issue `#9 京王線などの車両追加` の残りから、都営新宿線 / 都営三田線 / 都営大江戸線 / 都営浅草線を各1形式ずつ `TrainQuiz` の公開データへ追加する。

## Decision

- 追加粒度は「各路線の代表1形式ずつ」に固定する
- 対象形式は `新宿線=10-300形 / 三田線=6500形 / 大江戸線=12-600形 / 浅草線=5500形` とする
- `category` は既存どおり `commuter`、`operator` は `東京都交通局` に統一する
- 根拠ページは東京都交通局の `車両形式図` 一覧を共通で使い、seed ごとに `productEvidenceText` で形式名を照合する
- 画像は Wikimedia の実在ファイル名を確認した `commonsFileTitle` を明示し、公開データは `scripts/build_dataset.py` 再生成で同期する

## Why

- Issue 本文は路線名だけで形式指定が無いため、まずは現在の代表形式を1件ずつ入れるのが最小差分
- 4路線とも東京都交通局の公式 `車両形式図` 一覧に形式名が並んでおり、同一運用で根拠確認できる
- 既存の `commuter` 問題群に地下鉄車両を混ぜても UI・クイズロジックの追加変更が不要

## Scope

- `tests/data-shape.test.mjs` に都営4件の存在チェックを追加する
- `data/train-seeds.json` に都営4件を追加する
- `scripts/build_dataset.py` で `data/trains.json` を再生成する
- focused/full test を Docker で実行する

## Non-Goals

- 東京メトロ車両の追加
- 都営各路線で複数形式を一気に追加すること
- UI 変更やカテゴリ追加

## Data Notes

- `displayName` は路線名込みで子どもが読み分けやすい名前にする
- `routeSummary` は路線と直通先、`featureSummary` は色や編成・見た目の特徴を優先する
- `topSpeedKmh` は公開情報で確認できた営業最高速度を優先し、営業値が弱い形式だけ設計最高速度を使わないよう注意する

## Risks and Mitigations

- 路線名だけの依頼なので他形式を期待していた可能性がある: 代表1形式ずつでまず固定し、必要なら次ターンで各路線を追加拡張する
- 地下鉄車両は line color や直通先の説明が混ざりやすい: 公式ページと Wikipedia の導入文で二重確認して seed 文面を短く保つ

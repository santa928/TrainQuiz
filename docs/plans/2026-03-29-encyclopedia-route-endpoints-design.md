# 図鑑 route endpoints Design

## Goal

図鑑詳細で、各電車・新幹線が「どこからどこまで」をつなぐかを、既存の見た目を崩さず親子で読みやすく伝える。

## REQ Ledger

- `REQ-001 維持`: 既存の `📍 はしっている場所` は残す
- `REQ-002 追加`: `📍 はしっている場所` の直下に `🔗 どこからどこまで` を追加する
- `REQ-003 追加`: 表示値は `A 〜 B` を基本にし、環状線や検測車などは自然文で補う
- `REQ-004 追加`: 値がない車両は空欄表示せず、項目自体を隠す
- `REQ-005 維持`: 既存の詳細レイアウト、文言トーン、モバイル/タブレット縦の縦積みを崩さない

## Decision

- `data/train-seeds.json` の `encyclopedia` に `routeEndpointsSummary` を追加する
- `scripts/build_dataset.py` の既存転写を使い、`data/trains.json` に同じ値を反映する
- `index.html` の図鑑詳細 spec list に 1 項目だけ増やし、`js/app.js` で値の有無に応じて表示を切り替える
- 既存の `routeSummary` は「どのエリア・路線を走るか」の面情報として残し、新項目は「始点・終点・つながり」の線情報に分離する

## Why

- 既存の `routeSummary` は「東京から東北方面」のように広い説明で、路線の結び方を知りたい要求とは粒度が違う
- 新しい情報を `featureSummary` へ混ぜるより、spec item を 1 行足すほうが読みやすく保守もしやすい
- `routeSummary` と `routeEndpointsSummary` を分けると、ループ線や検測車・貨物機関車のような「単純な A 〜 B ではない車両」も自然文で扱える

## Scope

- `index.html` に `🔗 どこからどこまで` の表示枠を追加する
- `js/app.js` に route endpoints の表示/非表示ロジックを追加する
- `tests/app.test.mjs` に詳細画面で route endpoints が表示される失敗テストを追加する
- `tests/data-shape.test.mjs` に `routeEndpointsSummary` の存在確認を追加する
- `data/train-seeds.json` を正本として `routeEndpointsSummary` を全件追加し、`data/trains.json` を再生成する
- `README.md` の図鑑説明を更新する

## Non-Goals

- 図鑑一覧カードの変更
- クイズ出題ロジックの変更
- 路線図や地図の表示
- URL / history / storage を使った状態管理変更

## Data Notes

- まず既存 `routeSummary` から読み取れる範囲で `routeEndpointsSummary` を整備する
- `A から B ほうめん`、`A と B を むすぶ` は `A 〜 B` 系の短文へ正規化する
- 環状線、検測車、貨物機関車、試験車、観光 SL などは「ぐるっと 1しゅう」「A 〜 B を けんそく」「○○ せんく で かつやく」の自然文を許容する

## Risks and Mitigations

- 文言の機械変換が不自然になる: 代表パターンはまとめて揃え、特殊車両だけ個別確認する
- 詳細画面が縦に伸びる: 既存 spec item と同じ余白・文字サイズを使い、1 行追加に留める
- seed と generated data の不整合: `data/train-seeds.json` を正本にして `scripts/build_dataset.py` を実行し、shape test で同期を固定する

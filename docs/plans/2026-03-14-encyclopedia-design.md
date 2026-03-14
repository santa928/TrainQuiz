# 図鑑画面 Design

## Goal

Issue `#4 図鑑機能を作る` を、既存の単一ページ構成を保ったまま最小差分で実現する。

## Decision

- `title / quiz / encyclopedia-list / encyclopedia-detail` の 4 view を同一 HTML 内で切り替える
- タイトル画面の `ずかん` ボタンを有効化し、図鑑一覧への入口にする
- 図鑑一覧は写真中心のカードグリッド、図鑑詳細は大きい写真と説明文の縦積みで構成する
- 戻る導線は `詳細 -> 一覧 -> タイトル` の単純なツリーに固定する
- `descriptionShort` が空欄の車両は今回補完し、Issue 単体で完結させる
- 詳細画面は将来の属性追加を想定し、説明文の下へ情報ブロックを足しやすい構造にする

## Why

- GitHub Pages 向けの静的構成を崩さず、既存の `hidden` ベース view 切り替えをそのまま拡張できる
- 一覧画面を独立させることで、3歳児向けに「写真から選ぶ」操作を分かりやすくできる
- 詳細画面を縦積みにしておくと、今は短文と出典だけでも、今後のデータ項目を無理なく追加できる
- 一覧 view を隠すだけなら、詳細から戻ったときのスクロール位置を維持しやすい

## Scope

- `index.html` に図鑑一覧 view と図鑑詳細 view を追加する
- `styles.css` に図鑑一覧カード、詳細レイアウト、戻る導線のスタイルを追加する
- `js/app.js` に図鑑 view の状態管理、一覧/詳細描画、導線イベントを追加する
- `tests/app.test.mjs` にタイトルから図鑑へ進めること、一覧から詳細へ遷移できること、詳細から戻れることを追加する
- `tests/data-shape.test.mjs` に `descriptionShort` が空でないことを追加する
- `data/trains.json` の `descriptionShort` を補完する
- `README.md` に図鑑機能を追記する

## Non-Goals

- ルーティング導入や複数 HTML 化
- 解放/未解放の進捗管理
- クイズロジックやラウンド数の変更
- 図鑑詳細からクイズへ直接ジャンプする新導線

## Layout

### 図鑑一覧

- スマホ縦は 2 列グリッド、タブレット縦は `repeat(auto-fill, minmax(...))` ベースの可変列
- 各カードは写真、車両名、カテゴリ補助文を持つ
- ヘッダーに `もどる` ボタンと総件数表示を置く

### 図鑑詳細

- 上部に `ずかんへ もどる` ボタン
- 中央に大きい写真、その下に `displayName`、`descriptionShort`、出典情報を縦積み
- 情報ブロックを追加しやすいよう、本文領域はセクション分割しておく

## Data Notes

- `descriptionShort` は既存データの `displayName` `canonicalName` `category` `operator` だけで説明できる範囲に寄せ、未確認の詳細スペックは入れない
- 一覧/詳細描画は `state.selectedTrainId` を軸にし、将来項目が増えても描画関数だけの変更で済む構造にする

## Risks and Mitigations

- 画像数増加による読み込み負荷: 図鑑一覧の `img` に `loading=\"lazy\"` を付ける
- `descriptionShort` の空欄残り: テストで全件 non-empty を固定する
- DOM 複雑化: view 切り替えと描画関数を分け、クイズ既存ロジックへの影響を限定する

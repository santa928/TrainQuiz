# Train Quiz

3歳児向けの静的な電車クイズです。GitHub Pages でそのまま公開できる構成で、プラレールの車両を出発点に、鉄道会社の公式情報で確認した実在の日本車両も収録しています。引退した車両も写真と説明で楽しめます。

## できること

- 1問1画像の4択クイズ
- 1プレイ5問の短いラウンド制
- 5問終了後に `せいかい数` が分かる結果画面
- 初回表示のタイトル画面と `クイズをはじめる` 導線
- 車両の写真と短い説明を見られる図鑑一覧 / 詳細画面
- 全車両で `場所 / どこからどこまで / 特徴 / はやさ` を見られ、車両によっては `ちがい` まで分かる親子向け図鑑補足
- 正解するまで選び直せる子ども向け導線
- 色で案内しやすい4色の選択肢ボタン
- Wikipedia / Wikimedia Commons を使った画像と出典表示
- 将来の図鑑拡張にも流用しやすい静的 JSON データ

## 収録車両

登録データは110件、図鑑の表示は109種類、クイズ対象は107件です（蒸気機関車3件は図鑑のみ。同名のE5系2件は図鑑では1種類にまとめます）。
ロマンスカーはGSE・MSE・VSE・EXE・EXEα・LSE・HiSE・RSE・NSEの9種類を収録。
西武・東急・相鉄・京急の12種類に加え、E8系つばさ・かもめ・0系・スペーシア・リバティ・ソニック・サンライズ・サフィール踊り子・江ノ電・箱根登山電車の10種類も追加しています。[追加車両とデータの扱い](docs/train-expansion-2026-09.md)を参照してください。

## 操作方法

- タイトルの「クイズをはじめる」で5問の4択クイズを開始します。写真の電車を選び、正解したら次の問題へ進みます。
- 「ずかん を みる」で写真を選ぶと、車両の説明・走る場所・区間・特徴・速さを見られます。
- 図鑑の「ちがい」では、ロマンスカーの形式や同じ系列の色違いなどを見比べるヒントが分かります。

## 構成

- `index.html`: 画面本体
- `styles.css`: UI スタイル
- `js/quiz-engine.js`: 4択問題生成ロジック
- `js/app.js`: ブラウザ表示ロジック
- `data/train-seeds.json`: 調査 seed
- `data/trains.json`: 公開用の確定データ
- `scripts/build_dataset.py`: Wikipedia / Wikimedia から公開データを生成

## 起動

Docker で配信します。

```bash
docker compose up
```

ブラウザで `http://localhost:8080` を開いてください。

## データ再生成

ネットワーク経由で公式ラインナップと Wikipedia / Wikimedia API を参照し、公開用 JSON を作り直します。
鉄道会社の公式車両紹介を根拠にする場合は、seed の `productEvidenceUrl` と `productEvidenceText` を指定します。この場合の `productName` は車両の表示名で、玩具の商品化を意味しません。
日本語 Wikipedia だけで安定取得できない車両は、`data/train-seeds.json` に `wikipediaTitle` と `commonsFileTitle` を持たせて、Commons 側の画像を固定できます。
同じ系列でも別商品として出題するため、`canonicalName` は重複していても構いません。4択の選択肢では `displayName` が重複しないように調整しています。

```bash
docker run --rm \
  -v "$PWD":/app \
  -w /app \
  python:3.12-alpine \
  python scripts/build_dataset.py
```

## テスト

```bash
docker run --rm \
  -v "$PWD":/app \
  -w /app \
  node:22-alpine \
  node --test tests/*.test.mjs
```

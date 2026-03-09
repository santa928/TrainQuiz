# Train Quiz

3歳児向けの静的な電車クイズです。GitHub Pages でそのまま公開できる構成で、対象は「プラレールに単品商品として存在する実在の日本車両」です。

## できること

- 1問1画像の4択クイズ
- 正解するまで選び直せる子ども向け導線
- Wikipedia / Wikimedia Commons を使った画像と出典表示
- 将来の図鑑機能へ流用できる静的 JSON データ

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

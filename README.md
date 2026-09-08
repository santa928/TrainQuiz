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
- `data/train-sources.lock.json`: 出典の指定と確認済み写真メタデータを対応付ける固定記録
- `data/trains.json`: 公開用の確定データ
- `scripts/build_dataset.py`: 固定記録から公開データを再生成し、必要時に出典をオンライン確認

## 起動

Docker で配信します。

```bash
docker compose up
```

ブラウザで `http://localhost:8080` を開いてください。

## データ再生成

通常のCLIは `data/train-sources.lock.json` の確認済み情報を使い、ネットワークなしで全件を再生成します。seedが本文・表示名を持ち、固定記録が出典と写真メタデータを持ちます。画像ファイル自体は保存せず、アプリでは引き続き外部URLから読み込みます。
出典URL・照合文字列・Wikipedia記事・写真指定の変更や、固定記録の欠落はエラーになります。エラー時に該当車両をスキップしたり、既存出力を書き換えたりしません。
鉄道会社の公式車両紹介を根拠にする場合は、seed の `productEvidenceUrl` と `productEvidenceText` を指定します。この場合の `productName` は車両の表示名で、玩具の商品化を意味しません。
日本語 Wikipedia だけで安定取得できない車両は、`data/train-seeds.json` に `wikipediaTitle` と `commonsFileTitle` を持たせて、Commons 側の画像を固定できます。
同じ系列でも別商品として出題するため、`canonicalName` は重複していても構いません。4択の選択肢では `displayName` が重複しないように調整しています。

```bash
docker run --rm \
  --network none \
  -v "$PWD":/app \
  -w /app \
  python:3.12-alpine \
  python scripts/build_dataset.py
```

固定記録には確認の根拠を `verificationBasis` として残します。初期80件は既存公開コミットからの継承であり、今回のライブ再確認ではありません。追加30件は2026年9月8日の公式出典・写真確認に基づきます。名称・説明のみの編集では再確認を求めず、出典や写真の指定を変えたときは該当記録を再確認・更新してください。

オンラインで出典を再確認する場合は `--live` を指定します。全件成功後に固定記録も保存する例です（外部通信が発生します）。出典確認に失敗した場合は古い記録へ自動フォールバックしません。

`--live` でもseedに写真・記事メタデータがすべて明示されている場合は、その指定を保持します。確認履歴には「出典はライブ確認、メタデータはseedから継承」と記録し、写真メタデータまでオンラインで再取得した扱いにはしません。

```bash
docker run --rm \
  -v "$PWD":/app \
  -w /app \
  python:3.12-alpine \
  python scripts/build_dataset.py --live \
    --output /tmp/trains-refreshed.json \
    --write-source-lock /tmp/train-sources-refreshed.lock.json
```

上の出力はコンテナ終了時に破棄される確認用です。採用する場合はレビュー用の保存先へ出力して差分を確認してください。HTTP 403・429や非UTF-8ページなどによってライブ確認できないサイトは、ブラウザで根拠を確認したうえで、その車両の固定記録だけを検証履歴付きで更新します。ハッシュだけの更新による確認省略はしません。

## テスト

```bash
docker run --rm \
  -v "$PWD":/app \
  -w /app \
  node:22-alpine \
  node --test tests/*.test.mjs
```

データ生成CLIの回帰テストも通信なしで実行できます。

```bash
docker run --rm --network none \
  -v "$PWD":/app:ro -w /app python:3.12-alpine \
  python -m unittest discover -s tests -p 'build_dataset*test.py'
```

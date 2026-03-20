# 京王車両追加 Design

## Goal

Issue `#9 京王線などの車両追加` のうち、具体名がある京王 5 件を既存データ構造へ追加し、クイズと図鑑の公開データに反映する。

## Decision

- `data/train-seeds.json` を正本にして、京王の `7000 / 8000 / 9000 / 2000 / 高尾山トレイン` を 5 件の独立エントリとして追加する
- `2000` は旧型初代ではなく、2026年1月31日運行開始の最新 `京王2000系` を指す前提で扱う
- `category` は既存の私鉄通勤車と同じ `commuter` を使い、`operator` は `京王電鉄` に統一する
- 画像・Wikipedia・出典 URL は公開情報で事実確認し、`scripts/build_dataset.py` で `data/trains.json` を再生成する
- 現行ラインナップに無い手動追加データは、seed ごとの `productEvidenceUrl` と必要なら `productEvidenceText` を使って根拠ページを切り替える
- 回帰確認は `tests/data-shape.test.mjs` に Issue #9 用の存在チェックを追加して固定する

## Why

- Issue 本文は 5 件を列挙しており、今回の最小完了単位として 5 問を独立追加するのが最も解釈が少ない
- 既存データは `commuter` の中に私鉄・地下鉄を含んでおり、カテゴリ新設より既存構造を再利用する方が差分が小さい
- Issue コメントで補足された緑の「高尾山トレイン」を採り、`keio-9000-takao` の中身は 8000 系ラッピング車として扱う

## Scope

- `tests/data-shape.test.mjs` に京王 5 件の存在を固定する失敗テストを追加する
- `data/train-seeds.json` に 5 件の seed を追加する
- `scripts/build_dataset.py` を seed ごとの `productEvidenceUrl` / `productEvidenceText` に対応させる
- `scripts/build_dataset.py` を使って `data/trains.json` を再生成する
- 追加した 5 件が最低限の必須項目と図鑑項目を満たすことを確認する

## Non-Goals

- 都営新宿線・都営三田線・都営大江戸線・都営浅草線・東京メトロ車両の追加
- UI 変更や新しいカテゴリ追加
- 既存車両の説明文・画像の全面見直し

## Data Notes

- `displayName` は子どもが読み分けやすい具体名にし、`canonicalName` は系式ベースで管理する
- `descriptionShort` と `encyclopedia` は既存方針どおり、特徴 + 走る場所/役割が分かる手入力文にする
- `commonsFileTitle` は推測せず、Wikimedia の実ファイル名を確認して設定する
- `高尾山トレイン` は Wikimedia 上の 8000 系ラッピング実写を使い、系式名と画像が食い違わないようにする

## Risks and Mitigations

- Issue 本文だけでは各車両の正式な採用粒度が曖昧: 今回は 5 件に限定し、都営/メトロは別タスク化しやすい形で残す
- 画像や行先表示の確認が難しい: Wikimedia / Wikipedia で確認し、適切画像が見つからない場合は無理に追加しない候補として切り分ける
- Docker が使えない環境差分: Docker を優先し、不可ならローカル代替検証と pending を明示する

# 車両写真の一致・視認性監査（Issue #13）

2026年9月8日。[Issue #13](https://github.com/santa928/TrainQuiz/issues/13) の対象5件を修正し、クイズ対象107件を390×844の実画面で全件確認した。写真15件を差し替えた。登録110件・出題107件・図鑑109種類（同名E5系の統合）は維持する。

## 要件台帳・受け入れ条件

| ID | 状態 | 要件と確認方法 |
| --- | --- | --- |
| REQ-001 | 維持 | D51 200、C61 20、銀色EF510、黄色E657、改良型L0の写真と名称・説明を一致させる。出典と実画像を照合し固定テストを追加 |
| REQ-002 | 維持 | 全107問で系列・号機指定・塗装・ラッピングが一致する。実画像とCommonsメタデータを確認 |
| REQ-003 | 維持 | 全107問を390×844で表示し、小さすぎる対象・正答対象が曖昧な複数編成・識別点の切断を解消する |
| REQ-004 | 維持 | 写真変更時は著者・ライセンス・出典とsource lockの検証履歴を更新する |
| REQ-005 | 維持 | Node/Python既存テストと写真・名称の回帰テストを通す |
| REQ-006 | 維持 | READMEの標準CLIから110件を一時出力へ生成し、ID・順序・内容の完全一致を確認する |
| REQ-007 | 追加 | 全件監査で見つかった名鉄6000/6500、103系の線区・塗装説明も訂正し、京王8000・ミュースカイの通常色を選択肢名で区別する |

要件差分はREQ-001〜006を維持、REQ-007を追加。保留・削除はない。通常色・特別塗装を同時に含む4択を検証用に生成し、選択肢名の意味が重ならないことを確認した。毎回同形式ペアを出題する仕様への変更は行わない。

## 写真変更

| ID | 修正 | 確認した写真 |
| --- | --- | --- |
| `d51-200` | D51 498から200号機へ | [Commons](https://commons.wikimedia.org/wiki/File:D51_200_steam_locomotive_2018-05-05.jpg) |
| `c61-20` | C61 2から20号機へ | [Commons](https://commons.wikimedia.org/wiki/File:C61_20_SL_rapid_train.jpg) |
| `ef510-red-thunder` | 混在写真から銀色のEF510-301単独へ | [Commons](https://commons.wikimedia.org/wiki/File:JRF_EF510-301_Nippo-main-Line.jpg) |
| `e657-hitachi-yellow` | 通常色から黄色K2編成へ | [Commons](https://commons.wikimedia.org/wiki/File:JRE_Series-E657-K2_Hitachi-6.jpg) |
| `l0-maglev` | 2013年の従来車からL0-950改良型へ | [Commons](https://commons.wikimedia.org/wiki/File:L0-950.jpg) |
| `e231-sobu` | 離合写真から黄色帯の単独編成へ | [Commons](https://commons.wikimedia.org/wiki/File:JRE_E231_500_Chuo_Sobu.jpg) |
| `meitetsu-6500` | 6004F（6000系）から6500系へ | [Commons](https://commons.wikimedia.org/wiki/File:Meitetsu_Mikawa_Line_6500_series_6.jpg) |
| `e233-keiyo` | 209系との離合からE233系単独へ | [Commons](https://commons.wikimedia.org/wiki/File:Series-E233-5000-502F.jpg) |
| `keio-8000` | 離合写真から通常色の単独編成へ | [Commons](https://commons.wikimedia.org/wiki/File:Keio8000_8725F_20090924.jpg) |
| `n700a` | 側面ロゴのみから先頭形状の分かる写真へ | [Commons](https://commons.wikimedia.org/wiki/File:N700A-G1.jpg) |
| `e233-shonan` | 遠景から湘南色と先頭の分かる近景へ | [Commons](https://commons.wikimedia.org/wiki/File:Series-E233-3000-Ino-STA.jpg) |
| `hello-kitty-shinkansen` | 遠景からピンク・リボンの分かる近景へ | [Commons](https://commons.wikimedia.org/wiki/File:JRW-500_V2_521-7002_HelloKitty_Shinkansen_in_Himeji.jpg) |
| `rapid-acty-211` | 他形式と柵が目立つ写真から東海道線仕様の単独編成へ | [Commons](https://commons.wikimedia.org/wiki/File:JNR_211.JPG) |
| `103-saikyo` | 小さい遠景から3500番台の近景へ。川越線へ名称も訂正 | [Commons](https://commons.wikimedia.org/wiki/File:103-3501_Nishi-Kawagoe_-_Matoba_20040605.JPG) |
| `n700s-kamome` | 先頭2両が並ぶ写真から単独の先頭部へ | [Commons](https://commons.wikimedia.org/wiki/File:N700S_722-8102_Front-side.jpg) |

EF510は[タカラトミー公式のS-46](https://www.takaratomy.co.jp/products/plarail/lineup/sharyou/)が対象とする九州向け300番台に統一した。Issue内の例にある501号機は採用しない。E657も同ページのS-19に合わせ黄色の説明へ更新した。L0は[JR東海の改良型諸元](https://linear-chuo-shinkansen.jr-central.co.jp/about/design/)に合わせ、従来車の試験記録603km/hではなく営業最高速度の目標500km/hとして案内する。

103系の写真は川越線用3500番台であり、[103系の3500番台・川越線／八高線の解説](https://ja.wikipedia.org/wiki/国鉄103系電車)とCommons説明を照合した。表示名・運用区間・比較文を同期した。互換性のため `103-saikyo` のIDは保持する。211系写真は東海道線仕様の車両を示し、撮影時の行先表示「普通」を快速運用の撮影証拠とは扱わない。

名鉄6500系の記事は[名鉄6000系電車](https://ja.wikipedia.org/wiki/名鉄6000系電車)内にまとめられていることを現ページで確認した。seedの記事名を固定記録と同期し、Commons写真を指定した場合のオンライン生成と通常生成で記事名が分かれないことを回帰テストに追加した。

## 表示・検証記録

世界観・操作は既存の幼児向け電車写真クイズを維持する。写真自体を識別対象とし、図鑑一覧もクイズ・詳細と同じ `object-fit: contain` にそろえる。先頭部を切る `cover` を図鑑一覧から除去した。画像の縦横比を保った余白を許容する。

- [全107件の監査台帳](photo-audit-2026-09.json)：ID・表示名・採用写真の出典・390×844での画像寸法・枠内収まりを記録。全件を実画面で撮影し、写真枠を334×220の原寸で一覧化して目視した。最終差し替え6件は再撮影して個別画面も確認した。
- 全107件で `contain`、画像枠の上下左右の収まり、ページ横幅390pxを実測した。クイズ対象から既存仕様で除外されるSL3件も図鑑詳細の実画像・クレジットを目視確認した。
- 図鑑109カードの画像枠に切断・枠外はみ出しがないことを実測した。通常操作の5問回答から結果画面まで完走し、ページエラー0件・横幅390pxを確認した。
- Nodeテスト65件、Pythonテスト10件が成功。写真差し替えの回帰テストは変更前の不一致で失敗することも確認した。
- `python scripts/build_dataset.py --output /work/regenerated.json` をDocker内で実行し、110件生成後に `cmp data/trains.json /work/regenerated.json` が成功。実装関数だけでなく標準CLIを使用した。

写真監査は当日Commonsから取得した実画像（原寸または公式960pxサムネイル）を、URL一致を検証したうえでブラウザ要求へ応答して実施した。これは写真内容・レイアウトの証拠であり、外部画像サーバーの常時可用性を保証するものではない。写真メタデータは再取得し、変更した15件のsource lockへ確認履歴を追記した。既存の商品出典・記事メタデータの継承は、新たなライブ確認と区別している。

## 非対象・リスクと対策・性能目標

- 非対象：出題数・ゲームルール・カテゴリの変更、画像の自前配信、デプロイ、実児による理解度評価。
- リスクと対策：Commonsの外部画像配信には403/429等があり得る。クレジットと出典URLを保持し、写真の内容確認と配信可用性を分けて記録する。通常色・特別塗装の同時4択は名前の意味が重ならないことをテストで守る。
- 性能目標：既存の静的配信と遅延読み込みを維持し、クライアント依存・スクリプト処理を増やさない。定量的な通信速度・Lighthouse測定は今回は行っていない。
- 重い検査：公開前ではなくデータと画像収め方の変更であるため全ブラウザ行列・Lighthouse・公開URL一括smokeは未実施。公開時または配信方式・ブラウザ依存処理を変更する場合に実施する。

最終確認：受け入れ条件、非対象、リスクと対策、性能目標を本書に保持した。

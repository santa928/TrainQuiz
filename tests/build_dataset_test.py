import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from scripts.build_dataset import build_dataset, build_seed_record


class BuildSeedRecordTest(unittest.TestCase):
    def test_uses_explicit_wikipedia_and_commons_metadata_when_present(self):
        seed = {
            "id": "yakumo-273",
            "displayName": "273系特急やくも",
            "canonicalName": "273系",
            "productName": "S-08 273系特急やくも",
            "category": "limited_express",
            "operator": "JR西日本",
            "wikipediaTitle": "273 series",
            "wikipediaUrl": "https://en.wikipedia.org/wiki/273_series",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/1/14/JRW_Series273-Y1.jpg",
            "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:JRW_Series273-Y1.jpg",
            "imageLicense": "CC0",
            "imageAuthor": "MaedaAkihiko",
            "descriptionShort": "やくもで はしる あたらしい でんしゃ",
        }

        record = build_seed_record(seed, "https://example.com/evidence")

        self.assertEqual(record["wikipediaTitle"], "273 series")
        self.assertEqual(record["wikipediaUrl"], "https://en.wikipedia.org/wiki/273_series")
        self.assertEqual(
            record["imageSourceUrl"],
            "https://commons.wikimedia.org/wiki/File:JRW_Series273-Y1.jpg",
        )
        self.assertEqual(record["imageLicense"], "CC0")
        self.assertEqual(record["imageAuthor"], "MaedaAkihiko")
        self.assertEqual(
            record["descriptionShort"],
            "やくもで はしる あたらしい でんしゃ",
        )

    def test_build_dataset_allows_duplicate_canonical_names_for_distinct_products(self):
        seeds = [
            {
                "id": "n700a",
                "displayName": "N700A新幹線",
                "canonicalName": "N700系",
                "productName": "S-01 ライト付Ｎ７００Ａ新幹線",
                "category": "shinkansen",
                "operator": "JR東海 / JR西日本",
            },
            {
                "id": "n700-mizuho-sakura",
                "displayName": "N700系みずほ・さくら",
                "canonicalName": "N700系",
                "productName": "S-04 ライト付N700系新幹線みずほ・さくら",
                "category": "shinkansen",
                "operator": "JR西日本 / JR九州",
            },
        ]

        def fake_build_seed_record(seed, evidence_url):
            return {
                "id": seed["id"],
                "displayName": seed["displayName"],
                "canonicalName": seed["canonicalName"],
                "productName": seed["productName"],
                "productEvidenceUrl": evidence_url,
                "category": seed["category"],
                "operator": seed["operator"],
                "wikipediaTitle": seed["displayName"],
                "wikipediaUrl": f"https://example.com/{seed['id']}",
                "imageUrl": f"https://example.com/{seed['id']}.jpg",
                "imageSourceUrl": f"https://commons.wikimedia.org/wiki/File:{seed['id']}.jpg",
                "imageLicense": "CC BY 4.0",
                "imageAuthor": "Example",
                "descriptionShort": "",
            }

        with TemporaryDirectory() as temp_dir:
            seed_path = Path(temp_dir) / "seed.json"
            output_path = Path(temp_dir) / "trains.json"
            seed_path.write_text(__import__("json").dumps(seeds, ensure_ascii=False), encoding="utf-8")

            evidence_html = "".join(seed["productName"] for seed in seeds)

            with (
                patch("scripts.build_dataset.fetch_text", return_value=evidence_html),
                patch("scripts.build_dataset.build_seed_record", side_effect=fake_build_seed_record),
            ):
                dataset = build_dataset(seed_path, output_path)

        self.assertEqual(len(dataset), 2)
        self.assertEqual(dataset[0]["canonicalName"], "N700系")
        self.assertEqual(dataset[1]["canonicalName"], "N700系")

    def test_uses_commons_file_title_to_fill_image_metadata(self):
        seed = {
            "id": "e235-yokosuka",
            "displayName": "E235系横須賀線",
            "canonicalName": "E235系横須賀線",
            "productName": "S-27 E235系横須賀線",
            "category": "commuter",
            "operator": "JR東日本",
            "wikipediaTitle": "JR東日本E235系電車",
            "wikipediaUrl": "https://ja.wikipedia.org/wiki/JR%E6%9D%B1%E6%97%A5%E6%9C%ACE235%E7%B3%BB%E9%9B%BB%E8%BB%8A",
            "commonsFileTitle": "File:E235_YokosukaLine.jpg",
            "descriptionShort": "",
        }

        with patch(
            "scripts.build_dataset.fetch_file_details",
            return_value={
                "image_url": "https://upload.wikimedia.org/example.jpg",
                "source_url": "https://commons.wikimedia.org/wiki/File:E235_YokosukaLine.jpg",
                "license": "CC BY-SA 4.0",
                "author": "Sakurayama 7",
            },
        ):
            record = build_seed_record(seed, "https://example.com/evidence")

        self.assertEqual(record["wikipediaTitle"], "JR東日本E235系電車")
        self.assertEqual(
            record["imageSourceUrl"],
            "https://commons.wikimedia.org/wiki/File:E235_YokosukaLine.jpg",
        )
        self.assertEqual(record["imageLicense"], "CC BY-SA 4.0")
        self.assertEqual(record["imageAuthor"], "Sakurayama 7")

    def test_uses_commons_file_title_when_explicit_image_fields_are_not_present(self):
        seed = {
            "id": "e231-near",
            "displayName": "E231系近郊電車",
            "canonicalName": "E231系",
            "productName": "S-43 サウンドE231系近郊電車",
            "category": "commuter",
            "operator": "JR東日本",
            "wikipediaTitle": "JR東日本E231系電車",
            "wikipediaUrl": "https://ja.wikipedia.org/wiki/JR%E6%9D%B1%E6%97%A5%E6%9C%ACE231%E7%B3%BB%E9%9B%BB%E8%BB%8A",
            "commonsFileTitle": "File:E231%E7%B3%BB%E8%BF%91%E9%83%8A%E5%BD%A2%E3%83%BBK-38%E7%B7%A8%E6%88%90%EF%BC%88%E5%89%8D%E7%85%A7%E7%81%AF%E6%9B%B4%E6%96%B0%E5%BE%8C%EF%BC%89.jpg",
            "descriptionShort": "しょうなんしんじゅくライン を はしる きんこうがた",
        }

        with (
            patch("scripts.build_dataset.fetch_page_details", side_effect=AssertionError("page lookup should not run")),
            patch("scripts.build_dataset.fetch_file_details") as fetch_file_details,
        ):
            fetch_file_details.return_value = {
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/4/45/E231%E7%B3%BB%E8%BF%91%E9%83%8A%E5%BD%A2.jpg",
                "source_url": "https://commons.wikimedia.org/wiki/File:E231%E7%B3%BB%E8%BF%91%E9%83%8A%E5%BD%A2.jpg",
                "license": "CC BY-SA 4.0",
                "author": "PQ Usui",
            }

            record = build_seed_record(seed, "https://example.com/evidence")

        self.assertEqual(
            record["imageSourceUrl"],
            "https://commons.wikimedia.org/wiki/File:E231%E7%B3%BB%E8%BF%91%E9%83%8A%E5%BD%A2.jpg",
        )
        self.assertEqual(record["imageLicense"], "CC BY-SA 4.0")
        self.assertEqual(record["imageAuthor"], "PQ Usui")

    def test_build_dataset_uses_seed_product_evidence_overrides(self):
        seeds = [
            {
                "id": "keio-9000-takao",
                "displayName": "京王9000系高尾山口行き",
                "canonicalName": "京王9000系高尾山口行き",
                "productName": "京王9000系高尾山口行き",
                "productEvidenceUrl": "https://example.com/issue-9",
                "productEvidenceText": "高尾山口行き",
                "category": "commuter",
                "operator": "京王電鉄",
            }
        ]

        def fake_build_seed_record(seed, evidence_url):
            return {
                "id": seed["id"],
                "displayName": seed["displayName"],
                "canonicalName": seed["canonicalName"],
                "productName": seed["productName"],
                "productEvidenceUrl": evidence_url,
                "category": seed["category"],
                "operator": seed["operator"],
                "wikipediaTitle": seed["displayName"],
                "wikipediaUrl": f"https://example.com/{seed['id']}",
                "imageUrl": f"https://example.com/{seed['id']}.jpg",
                "imageSourceUrl": f"https://commons.wikimedia.org/wiki/File:{seed['id']}.jpg",
                "imageLicense": "CC BY 4.0",
                "imageAuthor": "Example",
                "descriptionShort": "",
            }

        with TemporaryDirectory() as temp_dir:
            seed_path = Path(temp_dir) / "seed.json"
            output_path = Path(temp_dir) / "trains.json"
            seed_path.write_text(__import__("json").dumps(seeds, ensure_ascii=False), encoding="utf-8")

            with (
                patch("scripts.build_dataset.fetch_text") as fetch_text,
                patch("scripts.build_dataset.build_seed_record", side_effect=fake_build_seed_record),
            ):
                fetch_text.return_value = seeds[0]["productEvidenceText"]
                dataset = build_dataset(seed_path, output_path)

        fetch_text.assert_called_once_with("https://example.com/issue-9")
        self.assertEqual(dataset[0]["productEvidenceUrl"], "https://example.com/issue-9")
        self.assertEqual(dataset[0]["productName"], "京王9000系高尾山口行き")


if __name__ == "__main__":
    unittest.main()

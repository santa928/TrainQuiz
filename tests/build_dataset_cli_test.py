"""CLI全体の再生成と、古い出典情報を流用しない契約を検証する。"""

import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]


class BuildDatasetCliTest(unittest.TestCase):
    """公開レコードを期待値にし、実際のCLIを別プロセスで実行する。"""

    def run_cli(self, *args: str) -> subprocess.CompletedProcess[str]:
        """ネットワークを使わないCLIケースを実行し、終了状態を返す。"""
        return subprocess.run(
            [sys.executable, "scripts/build_dataset.py", *args],
            cwd=ROOT, capture_output=True, text=True, timeout=20, check=False,
        )

    def test_documented_cli_regenerates_the_entire_published_dataset(self) -> None:
        """出典巡回が先に走る退行を、ネットワークなしの全件生成で検出する。"""
        with TemporaryDirectory() as directory:
            output = Path(directory) / "trains.json"
            result = self.run_cli("--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                json.loads(output.read_text()),
                json.loads((ROOT / "data/trains.json").read_text()),
            )

    def test_changed_source_is_rejected_without_overwriting_output(self) -> None:
        """出典URLが変わったseedに、過去の確認結果を適用させない。"""
        seeds = json.loads((ROOT / "data/train-seeds.json").read_text())
        seed = next(row for row in seeds if row["id"] == "e8-tsubasa")
        seed["productEvidenceUrl"] = "https://example.invalid/unverified-e8"
        with TemporaryDirectory() as directory:
            seed_path = Path(directory) / "seed.json"
            seed_path.write_text(json.dumps([seed]))
            output = Path(directory) / "trains.json"
            output.write_text("keep-existing-output")
            result = self.run_cli("--seed", str(seed_path), "--output", str(output))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("e8-tsubasa", result.stderr)
            self.assertEqual(output.read_text(), "keep-existing-output")

    def test_missing_or_incomplete_sources_are_not_silently_skipped(self) -> None:
        """不足する出典・帰属を検出し、少ない件数のJSONを成功扱いしない。"""
        for missing_field in ("record", "imageAuthor"):
            with self.subTest(missing_field=missing_field), TemporaryDirectory() as directory:
                lock = json.loads((ROOT / "data/train-sources.lock.json").read_text())
                if missing_field == "record":
                    lock["records"] = [row for row in lock["records"] if row["id"] != "e8-tsubasa"]
                else:
                    row = next(row for row in lock["records"] if row["id"] == "e8-tsubasa")
                    row["metadata"].pop(missing_field)
                lock_path = Path(directory) / "sources.json"
                lock_path.write_text(json.dumps(lock))
                output = Path(directory) / "trains.json"
                result = self.run_cli("--source-lock", str(lock_path), "--output", str(output))
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("e8-tsubasa", result.stderr)
                self.assertFalse(output.exists())

    def test_live_mode_checks_evidence_instead_of_falling_back_to_the_lock(self) -> None:
        """ライブ確認の不一致をキャッシュ成功へ置き換えない。"""
        seeds = json.loads((ROOT / "data/train-seeds.json").read_text())
        seed = next(row for row in seeds if row["id"] == "e8-tsubasa")
        seed["productEvidenceUrl"] = "data:text/html,unrelated%20train"
        with TemporaryDirectory() as directory:
            seed_path = Path(directory) / "seed.json"
            seed_path.write_text(json.dumps([seed]))
            output = Path(directory) / "trains.json"
            result = self.run_cli("--live", "--seed", str(seed_path), "--output", str(output))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Product evidence not found", result.stderr)
            self.assertFalse(output.exists())

    def test_live_success_writes_a_lock_that_can_regenerate_the_same_records(self) -> None:
        """固定メタデータの継承をライブ取得と区別して記録し、再利用できる。"""
        seeds = json.loads((ROOT / "data/train-seeds.json").read_text())
        seed = next(row for row in seeds if row["id"] == "e8-tsubasa")
        seed["productEvidenceUrl"] = "data:text/html,E8"
        seed["imageAuthor"] = "explicit-seed-author"
        with TemporaryDirectory() as directory:
            seed_path = Path(directory) / "seed.json"
            seed_path.write_text(json.dumps([seed]))
            output = Path(directory) / "trains.json"
            lock = Path(directory) / "sources.json"
            live = self.run_cli(
                "--live", "--seed", str(seed_path), "--output", str(output),
                "--write-source-lock", str(lock),
            )
            self.assertEqual(live.returncode, 0, live.stderr)
            live_records = json.loads(output.read_text())
            self.assertEqual(live_records[0]["imageAuthor"], "explicit-seed-author")
            basis = json.loads(lock.read_text())["records"][0]["verificationBasis"]
            self.assertIn("Live evidence check", basis)
            self.assertIn("metadata reused from explicit seed values (not fetched online)", basis)
            offline = self.run_cli(
                "--seed", str(seed_path), "--output", str(output), "--source-lock", str(lock),
            )
            self.assertEqual(offline.returncode, 0, offline.stderr)
            self.assertEqual(json.loads(output.read_text()), live_records)
            self.assertEqual(live_records[0]["id"], "e8-tsubasa")


if __name__ == "__main__":
    unittest.main()

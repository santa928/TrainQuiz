#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TypedDict, cast
from urllib.parse import urlencode
from urllib.request import Request, urlopen

EVIDENCE_URL = "https://www.takaratomy.co.jp/products/plarail/lineup/sharyou/"
WIKIPEDIA_API = "https://ja.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "TrainQuizBuilder/1.0 (https://github.com/)"
METADATA_FIELDS = (
    "wikipediaTitle", "wikipediaUrl", "imageUrl", "imageSourceUrl",
    "imageLicense", "imageAuthor",
)


class SourceMetadata(TypedDict):
    """確認済み写真・記事の帰属情報。通常生成ではネットワークへ問い合わせない。"""

    wikipediaTitle: str
    wikipediaUrl: str
    imageUrl: str
    imageSourceUrl: str
    imageLicense: str
    imageAuthor: str


class LockedSource(TypedDict):
    """出典に関わるseedと、確認済みメタデータを対応付けた記録。"""

    id: str
    sourceFingerprint: str
    evidenceUrl: str
    evidenceText: str
    verificationBasis: str
    metadata: SourceMetadata


def source_fingerprint(seed: dict[str, Any]) -> str:
    """出典・写真の指定だけを固定し、説明文や表示名の編集は許容する。"""
    source = {
        field: seed.get(field)
        for field in ("id", "wikipediaQuery", "commonsFileTitle", *METADATA_FIELDS)
    }
    source["evidenceUrl"] = seed.get("productEvidenceUrl") or EVIDENCE_URL
    source["evidenceText"] = seed.get("productEvidenceText") or seed["productName"]
    encoded = json.dumps(source, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_source_lock(path: Path) -> dict[str, LockedSource]:
    """固定記録を検証して読み込む。不足・重複・壊れた帰属情報は拒否する。"""
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or payload.get("version") != 1:
        raise ValueError("Unsupported source lock version")
    if not isinstance(payload.get("records"), list):
        raise TypeError("Source lock must contain records")
    records: dict[str, LockedSource] = {}
    for entry in payload["records"]:
        if not isinstance(entry, dict):
            raise TypeError("Invalid source lock record")
        train_id = entry.get("id")
        if not isinstance(train_id, str) or not train_id.strip():
            raise ValueError("Invalid source lock ID")
        for field in ("sourceFingerprint", "evidenceUrl", "evidenceText", "verificationBasis"):
            if not isinstance(entry.get(field), str) or not entry[field].strip():
                raise ValueError(f"Invalid source lock {field}: {train_id}")
        metadata = entry.get("metadata")
        if not isinstance(metadata, dict) or any(
            not isinstance(metadata.get(field), str) or not metadata[field].strip()
            for field in METADATA_FIELDS
        ):
            raise ValueError(f"Incomplete source metadata: {train_id}")
        if train_id in records:
            raise ValueError(f"Duplicate source lock ID: {train_id}")
        records[train_id] = cast(LockedSource, entry)
    return records


def write_source_lock(
    seeds: list[dict[str, Any]], dataset: list[dict[str, Any]], path: Path,
    verification_basis: str,
) -> None:
    """確認を完了したデータから出典を固定する。CLIではライブ成功時だけ呼ぶ。"""
    records: list[LockedSource] = []
    for seed, record in zip(seeds, dataset, strict=True):
        if seed["id"] != record["id"]:
            raise ValueError(f"Source record ID mismatch: {seed['id']}")
        metadata_basis = (
            "metadata reused from explicit seed values (not fetched online)"
            if all(seed.get(field) for field in METADATA_FIELDS)
            else "metadata resolved via Wikipedia/Commons"
        )
        records.append(LockedSource(
            id=seed["id"], sourceFingerprint=source_fingerprint(seed),
            evidenceUrl=record["productEvidenceUrl"],
            evidenceText=seed.get("productEvidenceText") or seed["productName"],
            verificationBasis=f"{verification_basis}; {metadata_basis}",
            metadata=cast(SourceMetadata, {field: record[field] for field in METADATA_FIELDS}),
        ))
    path.write_text(
        json.dumps({"version": 1, "records": records}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def fetch_json(base_url: str, params: dict[str, Any]) -> dict[str, Any]:
    query = urlencode(params)
    request = Request(
        f"{base_url}?{query}",
        headers={"User-Agent": USER_AGENT},
    )
    with urlopen(request) as response:  # noqa: S310
        return json.load(response)


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request) as response:  # noqa: S310
        return response.read().decode("utf-8")


def normalize_text(value: str) -> str:
    return re.sub(r"[\s\u3000]+", "", value)


def strip_markup(value: str | None) -> str:
    if not value:
        return ""

    no_tags = re.sub(r"<[^>]+>", "", value)
    return html.unescape(no_tags).replace("\xa0", " ").strip()


def search_wikipedia(query: str) -> str:
    payload = fetch_json(
        WIKIPEDIA_API,
        {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srlimit": 1,
            "utf8": 1,
        },
    )
    search_results = payload.get("query", {}).get("search", [])
    if not search_results:
        raise RuntimeError(f"Wikipedia article not found for query: {query}")

    return search_results[0]["title"]


def is_supported_image(file_title: str) -> bool:
    lowered = file_title.lower()
    if not lowered.endswith((".jpg", ".jpeg", ".png", ".webp")):
        return False

    blocked_keywords = ("logo", "icon", "map", "route", "symbol")
    return not any(keyword in lowered for keyword in blocked_keywords)


def fetch_file_details(file_title: str) -> dict[str, str]:
    for api_url in (COMMONS_API, WIKIPEDIA_API):
        payload = fetch_json(
            api_url,
            {
                "action": "query",
                "format": "json",
                "prop": "imageinfo",
                "titles": file_title,
                "iiprop": "url|extmetadata",
                "utf8": 1,
            },
        )
        page = next(iter(payload["query"]["pages"].values()))
        imageinfo = page.get("imageinfo", [])
        if not imageinfo:
            continue

        info = imageinfo[0]
        metadata = info.get("extmetadata", {})
        return {
            "image_url": info.get("url", ""),
            "source_url": info.get("descriptionurl") or info.get("url") or "",
            "license": strip_markup(metadata.get("LicenseShortName", {}).get("value")),
            "author": strip_markup(metadata.get("Artist", {}).get("value")),
        }

    raise RuntimeError(f"Image metadata missing for file: {file_title}")


def fetch_page_details(title: str) -> dict[str, Any]:
    payload = fetch_json(
        WIKIPEDIA_API,
        {
            "action": "query",
            "format": "json",
            "prop": "info|pageimages|images",
            "titles": title,
            "inprop": "url",
            "imlimit": 20,
            "piprop": "name|original",
            "redirects": 1,
            "utf8": 1,
        },
    )

    page = next(iter(payload["query"]["pages"].values()))
    if "missing" in page:
        raise RuntimeError(f"Wikipedia page missing: {title}")

    image_name = page.get("pageimage")
    if image_name:
        file_title = f"File:{image_name}"
        file_details = fetch_file_details(file_title)
        if file_details["image_url"]:
            return {
                "title": page["title"],
                "url": page["fullurl"],
                "image_name": image_name,
                "image_url": file_details["image_url"],
                "image_source_url": file_details["source_url"],
                "image_license": file_details["license"],
                "image_author": file_details["author"],
            }

    for file_candidate in page.get("images", []):
        file_title = file_candidate.get("title", "")
        if not is_supported_image(file_title):
            continue

        file_details = fetch_file_details(file_title)
        if not file_details["image_url"]:
            continue

        return {
            "title": page["title"],
            "url": page["fullurl"],
            "image_name": file_title.removeprefix("File:"),
            "image_url": file_details["image_url"],
            "image_source_url": file_details["source_url"],
            "image_license": file_details["license"],
            "image_author": file_details["author"],
        }

    raise RuntimeError(f"Page image missing for article: {title}")


def build_seed_record(seed: dict[str, Any], evidence_url: str) -> dict[str, Any]:
    if all(
        seed.get(field)
        for field in (
            "wikipediaTitle",
            "wikipediaUrl",
            "imageUrl",
            "imageSourceUrl",
            "imageLicense",
            "imageAuthor",
        )
    ):
        return {
            "id": seed["id"],
            "displayName": seed["displayName"],
            "canonicalName": seed["canonicalName"],
            "productName": seed["productName"],
            "productEvidenceUrl": evidence_url,
            "category": seed["category"],
            "operator": seed["operator"],
            "wikipediaTitle": seed["wikipediaTitle"],
            "wikipediaUrl": seed["wikipediaUrl"],
            "imageUrl": seed["imageUrl"],
            "imageSourceUrl": seed["imageSourceUrl"],
            "imageLicense": seed["imageLicense"],
            "imageAuthor": seed["imageAuthor"],
            "descriptionShort": seed.get("descriptionShort", ""),
            "encyclopedia": seed.get("encyclopedia"),
        }

    if seed.get("commonsFileTitle") and seed.get("wikipediaTitle"):
        file_details = fetch_file_details(seed["commonsFileTitle"])
        if not file_details["license"] or not file_details["author"]:
            raise RuntimeError(
                f"Image attribution is incomplete for file: {seed['commonsFileTitle']}"
            )

        wikipedia_url = seed.get("wikipediaUrl")
        if not wikipedia_url:
            wikipedia_url = fetch_page_details(seed["wikipediaTitle"])["url"]

        return {
            "id": seed["id"],
            "displayName": seed["displayName"],
            "canonicalName": seed["canonicalName"],
            "productName": seed["productName"],
            "productEvidenceUrl": evidence_url,
            "category": seed["category"],
            "operator": seed["operator"],
            "wikipediaTitle": seed["wikipediaTitle"],
            "wikipediaUrl": wikipedia_url,
            "imageUrl": file_details["image_url"],
            "imageSourceUrl": file_details["source_url"],
            "imageLicense": file_details["license"],
            "imageAuthor": file_details["author"],
            "descriptionShort": seed.get("descriptionShort", ""),
            "encyclopedia": seed.get("encyclopedia"),
        }

    wikipedia_title = seed.get("wikipediaTitle") or search_wikipedia(seed["wikipediaQuery"])
    page_details = fetch_page_details(wikipedia_title)
    if not page_details["image_license"] or not page_details["image_author"]:
        raise RuntimeError(
            f"Image attribution is incomplete for article: {wikipedia_title}"
        )

    return {
        "id": seed["id"],
        "displayName": seed["displayName"],
        "canonicalName": seed["canonicalName"],
        "productName": seed["productName"],
        "productEvidenceUrl": evidence_url,
        "category": seed["category"],
        "operator": seed["operator"],
        "wikipediaTitle": page_details["title"],
        "wikipediaUrl": page_details["url"],
        "imageUrl": page_details["image_url"],
        "imageSourceUrl": page_details["image_source_url"],
        "imageLicense": page_details["image_license"],
        "imageAuthor": page_details["image_author"],
        "descriptionShort": seed.get("descriptionShort", ""),
        "encyclopedia": seed.get("encyclopedia"),
    }


def build_dataset(
    seed_path: Path, output_path: Path, source_lock_path: Path | None = None,
) -> list[dict[str, Any]]:
    """全seedを生成してから保存する。固定出典指定時は通信せず、不一致で停止する。"""
    seeds = json.loads(seed_path.read_text(encoding="utf-8"))
    dataset = []
    evidence_cache: dict[str, str] = {}
    locked_sources = load_source_lock(source_lock_path) if source_lock_path is not None else None

    for seed in seeds:
        evidence_url = seed.get("productEvidenceUrl") or EVIDENCE_URL
        evidence_text = seed.get("productEvidenceText") or seed["productName"]
        if locked_sources is not None:
            locked = locked_sources.get(seed["id"])
            if locked is None:
                raise ValueError(f"Missing verified source: {seed['id']}")
            if (
                locked["sourceFingerprint"] != source_fingerprint(seed)
                or locked["evidenceUrl"] != evidence_url
                or locked["evidenceText"] != evidence_text
            ):
                raise ValueError(f"Source changed; verify and refresh source lock: {seed['id']}")
            metadata = {field: locked["metadata"].get(field) for field in METADATA_FIELDS}
            dataset.append(build_seed_record({**seed, **metadata}, evidence_url))
            continue
        evidence_html = evidence_cache.get(evidence_url)
        if evidence_html is None:
            evidence_html = normalize_text(fetch_text(evidence_url))
            evidence_cache[evidence_url] = evidence_html

        normalized_product = normalize_text(evidence_text)
        if normalized_product not in evidence_html:
            raise RuntimeError(
                f"Product evidence not found on source page: {evidence_text}"
            )

        dataset.append(build_seed_record(seed, evidence_url))

    output_path.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    return dataset


def main() -> int:
    """通常は固定出典から再生成し、明示されたライブ確認の失敗はそのまま返す。"""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--seed",
        default="data/train-seeds.json",
        help="Path to the input seed file",
    )
    parser.add_argument(
        "--source-lock",
        default="data/train-sources.lock.json",
        help="Verified source metadata used for network-free regeneration",
    )
    parser.add_argument(
        "--live", action="store_true",
        help="Verify evidence online; reuse explicit seed metadata and resolve missing metadata",
    )
    parser.add_argument(
        "--write-source-lock",
        help="Write a new source lock after a successful --live build",
    )
    parser.add_argument(
        "--output",
        default="data/trains.json",
        help="Path to the generated JSON file",
    )
    args = parser.parse_args()
    if args.write_source_lock and not args.live:
        parser.error("--write-source-lock requires --live")

    try:
        dataset = build_dataset(
            Path(args.seed), Path(args.output), None if args.live else Path(args.source_lock),
        )
        if args.write_source_lock:
            seeds = json.loads(Path(args.seed).read_text(encoding="utf-8"))
            write_source_lock(
                seeds, dataset, Path(args.write_source_lock),
                f"Live evidence check on {datetime.now(UTC).date().isoformat()} (UTC)",
            )
    except (OSError, TypeError, ValueError, RuntimeError) as error:
        print(f"Dataset generation failed: {error}", file=sys.stderr)
        return 1
    print(f"Generated {len(dataset)} train records into {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

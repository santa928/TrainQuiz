#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

EVIDENCE_URL = "https://www.takaratomy.co.jp/products/plarail/lineup/sharyou/"
WIKIPEDIA_API = "https://ja.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "TrainQuizBuilder/1.0 (https://github.com/)"


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


def build_dataset(seed_path: Path, output_path: Path) -> list[dict[str, Any]]:
    seeds = json.loads(seed_path.read_text(encoding="utf-8"))
    dataset = []
    evidence_cache: dict[str, str] = {}

    for seed in seeds:
        evidence_url = seed.get("productEvidenceUrl") or EVIDENCE_URL
        evidence_text = seed.get("productEvidenceText") or seed["productName"]
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
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--seed",
        default="data/train-seeds.json",
        help="Path to the input seed file",
    )
    parser.add_argument(
        "--output",
        default="data/trains.json",
        help="Path to the generated JSON file",
    )
    args = parser.parse_args()

    dataset = build_dataset(Path(args.seed), Path(args.output))
    print(f"Generated {len(dataset)} train records into {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

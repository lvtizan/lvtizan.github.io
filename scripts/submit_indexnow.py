#!/usr/bin/env python3
"""Notify IndexNow about indexable pages changed by a deployment."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://yoyant.com"
KEY = "e9b7d4c2f1a84e6b9c3d5f7081a2b4c6"
ENDPOINT = "https://api.indexnow.org/indexnow"


def sitemap_urls() -> set[str]:
    tree = ET.parse(ROOT / "sitemap.xml")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return {node.text for node in tree.findall("s:url/s:loc", ns) if node.text}


def changed_urls(base_ref: str | None) -> list[str]:
    allowed = sitemap_urls()
    if not base_ref:
        return sorted(allowed)
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base_ref}...HEAD"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    urls: set[str] = set()
    discovery_changed = False
    for raw in result.stdout.splitlines():
        rel = raw.strip()
        if rel in {"robots.txt", "llms.txt", "llms-full.txt", "sitemap.xml"}:
            discovery_changed = True
        if not rel.endswith("index.html"):
            continue
        parent = Path(rel).parent.as_posix()
        url = f"{BASE}/" if parent == "." else f"{BASE}/{parent}/"
        if url in allowed:
            urls.add(url)
    if discovery_changed:
        urls.update({f"{BASE}/", f"{BASE}/en/"})
    return sorted(urls)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--changed-since", help="Git ref used to select updated pages")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    urls = changed_urls(args.changed_since)
    payload = {
        "host": "yoyant.com",
        "key": KEY,
        "keyLocation": f"{BASE}/{KEY}.txt",
        "urlList": urls,
    }
    if args.dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0
    if not urls:
        print("IndexNow: no changed indexable URLs")
        return 0
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status = response.status
    except urllib.error.HTTPError as exc:
        print(f"IndexNow submission failed: HTTP {exc.code}", file=sys.stderr)
        return 1
    if status not in {200, 202}:
        print(f"IndexNow submission failed: HTTP {status}", file=sys.stderr)
        return 1
    print(f"IndexNow accepted {len(urls)} changed URLs (HTTP {status})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

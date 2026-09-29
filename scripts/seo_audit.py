#!/usr/bin/env python3
"""Fail-fast technical SEO audit for the static bilingual site."""

from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://yoyant.com"
SKIP = {"work/demo-ecommerce/index.html", "go/index.html"}
REQUIRED_OG = {"og:title", "og:description", "og:url", "og:image", "og:site_name", "og:locale"}
REQUIRED_TWITTER = {"twitter:card", "twitter:title", "twitter:description", "twitter:image"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.html_lang = ""
        self.title = ""
        self._in_title = False
        self.meta: dict[str, str] = {}
        self.og: dict[str, str] = {}
        self.canonicals: list[str] = []
        self.hreflang: dict[str, str] = {}
        self.hrefs: list[str] = []
        self.jsonld: list[str] = []
        self._json_buffer: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {k.lower(): v or "" for k, v in attrs}
        if tag == "html":
            self.html_lang = values.get("lang", "")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            if values.get("name"):
                self.meta[values["name"].lower()] = values.get("content", "").strip()
            if values.get("property"):
                self.og[values["property"].lower()] = values.get("content", "").strip()
        elif tag == "link":
            rel = set(values.get("rel", "").lower().split())
            if "canonical" in rel:
                self.canonicals.append(values.get("href", ""))
            if "alternate" in rel and values.get("hreflang"):
                self.hreflang[values["hreflang"]] = values.get("href", "")
        elif tag == "a" and values.get("href"):
            self.hrefs.append(values["href"])
        elif tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._json_buffer = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._json_buffer is not None:
            self.jsonld.append("".join(self._json_buffer))
            self._json_buffer = None

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._json_buffer is not None:
            self._json_buffer.append(data)


def parse(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
    parser.title = " ".join(parser.title.split())
    return parser


def page_url(path: Path) -> str:
    parent = path.relative_to(ROOT).parent.as_posix()
    return f"{BASE}/" if parent == "." else f"{BASE}/{parent}/"


def local_target(source: Path, href: str) -> Path | None:
    href = href.split("#", 1)[0].split("?", 1)[0]
    if not href or href.startswith(("mailto:", "tel:", "javascript:", "data:")):
        return None
    parsed = urlparse(href)
    if parsed.scheme:
        if parsed.netloc not in {"yoyant.com", "www.yoyant.com"}:
            return None
        href = unquote(parsed.path)
    target = ROOT / href.lstrip("/") if href.startswith("/") else source.parent / href
    target = target.resolve()
    try:
        target.relative_to(ROOT)
    except ValueError:
        return None
    if href.endswith("/") or target.is_dir():
        target /= "index.html"
    return target


def main() -> int:
    parsed: dict[Path, PageParser] = {}
    indexable: dict[Path, PageParser] = {}
    failures: list[str] = []
    warnings: list[str] = []
    for path in sorted(ROOT.rglob("index.html")):
        rel = path.relative_to(ROOT).as_posix()
        if ".git" in path.parts or rel in SKIP:
            continue
        page = parse(path)
        parsed[path] = page
        if "noindex" not in page.meta.get("robots", "").lower():
            indexable[path] = page

    title_counts = Counter(page.title for page in indexable.values())
    desc_counts = Counter(page.meta.get("description", "") for page in indexable.values())
    canonical_counts = Counter(page.canonicals[0] for page in indexable.values() if len(page.canonicals) == 1)
    inbound: Counter[Path] = Counter()

    for path, page in indexable.items():
        rel = path.relative_to(ROOT).as_posix()
        desc = page.meta.get("description", "")
        if not page.title:
            failures.append(f"{rel}: missing title")
        if not desc:
            failures.append(f"{rel}: missing meta description")
        if len(page.canonicals) != 1:
            failures.append(f"{rel}: expected one canonical, found {len(page.canonicals)}")
        elif page.canonicals[0] != page_url(path):
            failures.append(f"{rel}: canonical mismatch ({page.canonicals[0]})")
        if rel.startswith("en/"):
            if not 30 <= len(page.title) <= 70:
                failures.append(f"{rel}: English title length {len(page.title)}")
            if not 100 <= len(desc) <= 180:
                failures.append(f"{rel}: English description length {len(desc)}")
            if page.html_lang != "en":
                failures.append(f"{rel}: html lang must be en")
        missing_og = REQUIRED_OG - set(page.og)
        missing_tw = REQUIRED_TWITTER - set(page.meta)
        if missing_og:
            failures.append(f"{rel}: missing Open Graph {sorted(missing_og)}")
        if missing_tw:
            failures.append(f"{rel}: missing Twitter metadata {sorted(missing_tw)}")
        for block in page.jsonld:
            try:
                json.loads(block)
            except json.JSONDecodeError as exc:
                failures.append(f"{rel}: invalid JSON-LD ({exc})")
        if page.hreflang and set(page.hreflang) != {"zh-CN", "en", "x-default"}:
            failures.append(f"{rel}: incomplete hreflang set {sorted(page.hreflang)}")
        for lang, href in page.hreflang.items():
            if lang == "x-default":
                continue
            target = local_target(path, href)
            if target not in indexable:
                failures.append(f"{rel}: hreflang {lang} targets a missing/noindex page")
            elif page_url(path) not in indexable[target].hreflang.values():
                failures.append(f"{rel}: hreflang {lang} is not reciprocal")
        for href in page.hrefs:
            target = local_target(path, href)
            if target is None:
                continue
            if target.exists() and target.name == "index.html":
                inbound[target] += 1
            elif not target.exists():
                failures.append(f"{rel}: broken internal link {href}")

    for value, count in title_counts.items():
        if value and count > 1:
            failures.append(f"duplicate title ({count} pages): {value}")
    for value, count in desc_counts.items():
        if value and count > 1:
            failures.append(f"duplicate description ({count} pages): {value[:90]}")
    for value, count in canonical_counts.items():
        if value and count > 1:
            failures.append(f"duplicate canonical ({count} pages): {value}")

    roots = {ROOT / "index.html", ROOT / "en/index.html"}
    for path in indexable:
        if path not in roots and inbound[path] == 0:
            warnings.append(f"{path.relative_to(ROOT)}: no internal links")

    sitemap = ET.parse(ROOT / "sitemap.xml")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = {node.text for node in sitemap.findall("s:url/s:loc", ns) if node.text}
    expected_urls = {page_url(path) for path in indexable}
    if sitemap_urls != expected_urls:
        failures.append(f"sitemap mismatch: missing={sorted(expected_urls-sitemap_urls)}, extra={sorted(sitemap_urls-expected_urls)}")

    print(f"SEO audit: {len(indexable)} indexable pages, {len(failures)} failures, {len(warnings)} warnings")
    for warning in warnings:
        print(f"WARN {warning}")
    for failure in failures:
        print(f"FAIL {failure}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

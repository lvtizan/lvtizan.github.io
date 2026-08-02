#!/usr/bin/env python3
"""
sitemap.xml 生成器 —— 以页面自身的 noindex 标记为唯一真相来源。

规则：扫描全站 index.html，凡 <meta name="robots"> 里含 noindex 的一律跳过，
其余全部收录。这样不用维护"该进 sitemap 的页面"和"不该被索引的页面"两份名单，
也就不可能再出现「新页面忘了加 sitemap」或「noindex 了但 sitemap 里还留着」。

已有条目的 priority / changefreq 原样保留（尊重手工调过的值），只刷新 lastmod；
新页面按下面的 RULES 给默认值。lastmod 取该文件的 git 最后提交日期——页面没改，
日期就不动，符合 lastmod 的语义。

用法：
    python3 scripts/gen_sitemap.py            # 生成并写入 sitemap.xml
    python3 scripts/gen_sitemap.py --check    # 只报告，不写文件（退出码 1 = 页面增删）

--check 只在「页面增删」时返回 1（pre-push 会据此拦截）；lastmod 漂移只提示不拦，
理由见 main() 内注释。
"""

import re
import subprocess
import sys
from datetime import date
from pathlib import Path

BASE = "https://yoyant.com"
ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "sitemap.xml"
SKIP_DIRS = {".git", "node_modules", "assets", "uploads"}

# 新页面的默认 (changefreq, priority)，按 URL 路径从上往下匹配，第一条命中的生效。
# 已在 sitemap 里的条目不走这里——它们的值原样保留。
RULES = [
    (re.compile(r"^/$"),                    ("weekly",  "1.0")),
    (re.compile(r"^/about/$"),              ("monthly", "0.9")),
    (re.compile(r"^/services/[^/]+/$"),     ("monthly", "0.9")),
    (re.compile(r"^/resources/$"),          ("weekly",  "0.8")),
    (re.compile(r"^/resources/[^/]+/$"),    ("monthly", "0.7")),
    (re.compile(r"^/work/[^/]+/$"),         ("monthly", "0.8")),
    (re.compile(r"^/work/[^/]+/[^/]+/$"),   ("monthly", "0.6")),
]
DEFAULT_META = ("monthly", "0.5")

NOINDEX_RE = re.compile(
    r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*noindex', re.I
)


def is_noindex(html_path):
    """只看 <head> 部分，避免正文里出现 noindex 字样造成误判。"""
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    head = text.split("</head>", 1)[0]
    return bool(NOINDEX_RE.search(head))


def url_path(html_path):
    """work/reson/index.html -> /work/reson/"""
    rel = html_path.relative_to(ROOT).parent.as_posix()
    return "/" if rel == "." else f"/{rel}/"


def git_lastmod(html_path):
    """取该文件最后一次提交的日期；未入库（新文件）时回落到今天。"""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%ad", "--date=short", "--", str(html_path)],
            cwd=ROOT, capture_output=True, text=True, timeout=10,
        ).stdout.strip()
        return out or date.today().isoformat()
    except (OSError, subprocess.SubprocessError):
        return date.today().isoformat()


def meta_for(path):
    for pattern, meta in RULES:
        if pattern.match(path):
            return meta
    return DEFAULT_META


def read_existing():
    """解析现有 sitemap，返回 {path: (changefreq, priority)} 与原始顺序。"""
    if not SITEMAP.exists():
        return {}, []
    text = SITEMAP.read_text(encoding="utf-8")
    kept, order = {}, []
    for block in re.findall(r"<url>.*?</url>", text, re.S):
        loc = re.search(r"<loc>\s*([^<]+?)\s*</loc>", block)
        if not loc:
            continue
        path = loc.group(1).replace(BASE, "") or "/"
        cf = re.search(r"<changefreq>\s*([^<]+?)\s*</changefreq>", block)
        pr = re.search(r"<priority>\s*([^<]+?)\s*</priority>", block)
        kept[path] = (cf.group(1) if cf else None, pr.group(1) if pr else None)
        order.append(path)
    return kept, order


def collect_pages():
    """扫描全站 index.html，返回应收录的 URL 路径集合。"""
    pages = set()
    for html in ROOT.rglob("index.html"):
        if any(part in SKIP_DIRS for part in html.relative_to(ROOT).parts):
            continue
        if is_noindex(html):
            continue
        pages.add(url_path(html))
    return pages


def build(pages, existing, order):
    """已有条目保持原顺序与原 priority/changefreq，新页面按规则追加在后。"""
    ordered = [p for p in order if p in pages]
    ordered += sorted(pages - set(ordered))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path in ordered:
        cf, pr = existing.get(path, (None, None))
        if not cf or not pr:
            default_cf, default_pr = meta_for(path)
            cf, pr = cf or default_cf, pr or default_pr
        lastmod = git_lastmod(ROOT / path.strip("/") / "index.html")
        lines.append(
            f"  <url><loc>{BASE}{path}</loc><lastmod>{lastmod}</lastmod>"
            f"<changefreq>{cf}</changefreq><priority>{pr}</priority></url>"
        )
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main():
    check_only = "--check" in sys.argv
    existing, order = read_existing()
    pages = collect_pages()

    added = sorted(pages - set(order))
    removed = sorted(set(order) - pages)
    for p in added:
        print(f"  + 新增 {p}")
    for p in removed:
        print(f"  - 移除 {p}   （页面已删除或已标 noindex）")

    new_xml = build(pages, existing, order)
    changed = not SITEMAP.exists() or SITEMAP.read_text(encoding="utf-8") != new_xml

    if check_only:
        # 只有「页面增删」才拦——那是真会造成损失的失败模式（新页面进不了 sitemap，
        # 搜索引擎永远发现不了）。lastmod 漂移不拦：lastmod 取 git 提交日期，一旦
        # 提交了 HTML 它必然变，若也拦就等于每次改文案都要「提交→重跑→amend」两轮，
        # 而代价只是抓取优先级的提示略滞后。下次有人增删页面时会一并刷新。
        if added or removed:
            print("❌ sitemap 与实际页面不一致（见上），必须更新")
            return 1
        if changed:
            print(f"ℹ️  页面齐全（{len(pages)} 条），仅 lastmod 有漂移，不拦截")
            return 0
        print(f"✅ sitemap 已是最新（{len(pages)} 条）")
        return 0

    SITEMAP.write_text(new_xml, encoding="utf-8")
    print(f"已写入 {SITEMAP.relative_to(ROOT)}：{len(pages)} 条 URL"
          if changed else f"sitemap 无变化（{len(pages)} 条）")
    return 0


if __name__ == "__main__":
    sys.exit(main())

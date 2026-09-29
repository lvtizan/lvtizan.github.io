#!/usr/bin/env python3
"""Refresh search metadata without rewriting page markup or layout.

The site is hand-authored static HTML. This script keeps English search copy,
social metadata and JSON-LD aligned while removing thin duplicate demo routes
from the indexable set. It is intentionally idempotent.
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://yoyant.com"
DEFAULT_IMAGE = f"{BASE}/uploads/webp/avatar-showcase.webp"

# Search-result copy is written independently from on-page display copy. Titles
# stay concise and descriptions state audience, deliverable and differentiator.
EN_META = {
    "en/index.html": (
        "Custom Software Development & Product Engineering | YOYANT",
        "Senior product design and full-stack engineering for mobile apps, industrial software, enterprise platforms and global B2B websites. Full source-code delivery.",
    ),
    "en/about/index.html": (
        "About YOYANT | Senior Software Engineers & Product Designers",
        "Meet the independent senior team behind YOYANT. We design and build custom apps, industrial software, enterprise platforms and global websites from Guangzhou for clients worldwide.",
    ),
    "en/services/software/index.html": (
        "Custom Software Development Company in China | YOYANT",
        "Custom mobile apps, industrial software and operations platforms built by senior engineers in Guangzhou, China—from product design to full source-code handover.",
    ),
    "en/services/web/index.html": (
        "B2B Website Design & Development for Global Markets | YOYANT",
        "High-performance multilingual B2B websites for manufacturers, software companies and international brands. Strategy, UX, development, technical SEO and private deployment.",
    ),
    "en/resources/index.html": (
        "Software Engineering & International SEO Insights | YOYANT",
        "Practical guides to custom software, product architecture, B2B website design, international SEO and production-grade digital delivery from the YOYANT engineering team.",
    ),
    "en/resources/software-customization-guide/index.html": (
        "Custom Software Development: Avoid Low-Cost Buyout Traps",
        "A practical guide to evaluating custom software vendors, avoiding template shells and encrypted code, choosing an architecture, and securing complete source-code ownership.",
    ),
    "en/resources/professional-software-ui/index.html": (
        "Industrial Software UI Design vs Consumer App UX | YOYANT",
        "Learn how industrial and professional software interfaces differ from consumer apps in information density, field conditions, expert workflows, safety and error prevention.",
    ),
    "en/resources/digital-product-process/index.html": (
        "Digital Product Development Process: From Idea to Launch",
        "A practical end-to-end product development process covering discovery, requirements, UX design, prototyping, engineering, testing, deployment and handover.",
    ),
    "en/resources/structured-data-json-ld/index.html": (
        "JSON-LD Structured Data for B2B Websites | YOYANT",
        "Understand how JSON-LD helps search engines interpret B2B websites, services, articles and organizations, with practical structured-data implementation guidance.",
    ),
    "en/resources/lighthouse-core-web-vitals/index.html": (
        "Lighthouse & Core Web Vitals: LCP, INP and CLS Guide",
        "A practical guide to Lighthouse and Core Web Vitals, including LCP, INP and CLS, what they measure, and how performance affects users and search visibility.",
    ),
    "en/resources/web-image-optimization/index.html": (
        "Website Image Optimization: WebP, Srcset, Lazy Loading & LCP",
        "Make website images sharp and fast with correct dimensions, WebP, responsive srcset, compression, lazy loading and LCP-aware loading priorities.",
    ),
    "en/resources/new-site-google-indexing/index.html": (
        "New Website Not Indexed by Google? 5 Technical Checks",
        "Help Google discover a new website by checking sitemaps, internal links, canonical URLs, structured data and Search Console before spending money on backlinks.",
    ),
    "en/resources/google-traffic-overview/index.html": (
        "Why Your B2B Website Gets No Enquiries: A Traffic Diagnosis",
        "A practical framework for diagnosing a B2B website with no enquiries: separate traffic, search visibility, buyer intent, landing-page quality and conversion problems.",
    ),
    "en/resources/keyword-research-b2b/index.html": (
        "B2B Keyword Research for International Websites | YOYANT",
        "Find the terms overseas buyers actually search for. Learn a practical B2B keyword-research process using buyer intent, long-tail queries and accessible research tools.",
    ),
    "en/resources/product-page-seo/index.html": (
        "B2B Product Page SEO: Rank and Generate Enquiries",
        "Build B2B product pages around search intent, clear titles, specifications, trust signals, structured data, internal links and enquiry paths that support qualified leads.",
    ),
    "en/resources/backlinks-b2b-foreign-trade/index.html": (
        "B2B Backlink Strategy: Build Authority Without Spam",
        "A clean backlink strategy for international B2B websites: relevant industry sources, partner links, directories, digital PR, useful resources and safe anchor-text patterns.",
    ),
    "en/resources/google-ads-foreign-trade/index.html": (
        "Should a B2B Export Company Run Google Ads? | YOYANT",
        "When Google Ads makes sense for an export business, what to fix before launch, how to evaluate cost per enquiry, and which common campaign mistakes waste budget.",
    ),
    "en/resources/waimao-site-vs-alibaba/index.html": (
        "Independent B2B Website vs Alibaba.com: Which Is Better?",
        "Compare an independent B2B website with Alibaba.com across traffic ownership, lead quality, competition, long-term cost, brand control and customer data.",
    ),
    "en/resources/waimao-site-cost/index.html": (
        "How Much Does a B2B Export Website Cost? | YOYANT",
        "Understand B2B website cost ranges, what drives the budget, where professional information architecture and SEO add value, and where cheap templates create risk.",
    ),
    "en/resources/static-vs-wordpress/index.html": (
        "Static Website vs WordPress for International B2B SEO",
        "Compare static websites and WordPress for international B2B projects across speed, security, maintenance, content workflows, search visibility and total ownership cost.",
    ),
    "en/resources/b2b-website-7-modules/index.html": (
        "7 Essential Modules for a B2B Website That Generates Leads",
        "Structure an international B2B website around the buyer journey with seven essential modules for credibility, product discovery, proof, qualification and enquiries.",
    ),
    "en/work/veinscope/index.html": (
        "VeinScope Industrial Inspection & 3D Measurement Software",
        "Industrial borescope inspection software with real-time 2D/3D views, 0.01 mm spatial measurement, depth analysis and point-cloud export for demanding field conditions.",
    ),
    "en/work/epaifa/index.html": (
        "Epaifa Cross-Border Supply Chain Commerce App | Case Study",
        "A 46-screen B2B commerce platform connecting purchasing, multi-warehouse inventory, ordering, fulfilment, COD tracking and reconciliation across international operations.",
    ),
    "en/work/avatar/index.html": (
        "AVATAR AI Companion Mobile App | Product Design Case Study",
        "An immersive AI companion app with expressive real-time chat, character discovery, relationship progression, subscription flows and low-latency streaming responses.",
    ),
    "en/work/nanhai/index.html": (
        "Nanhai Immersive Cultural Installation | Interactive UX Case",
        "An interactive cultural installation in Foshan connecting a touch-screen console and large display through three stable, story-led experiences inspired by Lingnan heritage.",
    ),
    "en/work/tarmeer/index.html": (
        "Tarmeer Multi-Country Building Materials Platform | Case Study",
        "A multi-country B2B platform connecting property owners, design firms and suppliers through discovery, company showrooms, product catalogues, enquiries and supplier operations.",
    ),
    "en/work/kst-oilfield/index.html": (
        "KST Oilfield Equipment B2B Website | Global Website Case",
        "A bilingual global product website for oilfield and power equipment, combining technical specifications, international certifications and high-value engineering enquiries.",
    ),
    "en/work/ots/index.html": (
        "OTS International Engineering B2B Website | Case Study",
        "A global B2B website that turns complex elevator delivery for airports, metro systems and infrastructure into clear capabilities, project evidence and qualified enquiry paths.",
    ),
    "en/work/sunvolt/index.html": (
        "SUNVOLT Solar & Energy Storage Export Website | Case Study",
        "A global clean-energy website for solar modules, residential and commercial storage and hybrid inverters, designed for distributors, installers and EPC buyers.",
    ),
    "en/work/reson/index.html": (
        "RESON Premium Audio DTC Website | Ecommerce Design Case",
        "A premium consumer-audio storefront with product storytelling, a multi-SKU catalogue, detailed product pages, fast cart flow and international checkout.",
    ),
    "en/work/aveline/index.html": (
        "AVELINE Fashion Ecommerce Website | Independent Brand Case",
        "A refined womenswear ecommerce experience with collection discovery, product detail, cart, editorial journal and brand storytelling across a complete multi-page website.",
    ),
    "en/work/yunshang/index.html": (
        "YUNSHANG Modern Qipao Ecommerce Website | Brand Case Study",
        "A contemporary Chinese fashion website combining silk qipao collections, product detail, cart, editorial content and heritage-led brand storytelling.",
    ),
    "en/work/goldenfields/index.html": (
        "GOLDEN FIELDS Food Export B2B Website | Case Study",
        "An international food-export website presenting product categories, quality certifications, OEM capability and wholesale enquiry paths for global buyers.",
    ),
    "en/work/cadence/index.html": (
        "Cadence B2B SaaS Product Website | Web Design Case Study",
        "A conversion-focused B2B SaaS website with clear product value, feature hierarchy, pricing, social proof and a structured path to free trial.",
    ),
    "en/work/vitalink/index.html": (
        "VITALINK Medical Device Export Website | Global B2B Case",
        "A rigorous international website for precision medical devices, with product systems, compliance credentials, research resources and distributor enquiry paths.",
    ),
    "en/work/preciform/index.html": (
        "PRECIFORM Precision Hardware B2B Website | Case Study",
        "A complete B2B export website for a precision hardware manufacturer, with specification filters, industry solutions, factory proof, certifications and drawing-based RFQs.",
    ),
    "en/work/preciform/products/index.html": (
        "B2B Product Catalogue with Specification Filters | PRECIFORM",
        "A precision-hardware product catalogue with multi-dimensional filters, readable specification tables, per-item RFQs and automatic model prefill for qualified enquiries.",
    ),
    "en/work/preciform/solutions/index.html": (
        "Industry Solutions Page for a Precision Manufacturer | PRECIFORM",
        "An industry-led solutions page organizing standards, materials and proven component types for automotive, electronics, medical and industrial automation buyers.",
    ),
    "en/work/preciform/factory/index.html": (
        "Manufacturing Capability & Quality Control Page | PRECIFORM",
        "A factory capability page presenting production lines, equipment, capacity, quality-control procedures and laboratory evidence for international B2B buyers.",
    ),
    "en/work/preciform/certifications/index.html": (
        "Certification & Test Report Download Centre | PRECIFORM",
        "A searchable certification centre for company qualifications, management systems, product certificates, test reports and patents with direct document downloads.",
    ),
    "en/work/preciform/contact/index.html": (
        "B2B RFQ Form with Drawing Upload & Model Prefill | PRECIFORM",
        "A low-friction RFQ flow with five essential fields, optional project details, automatic model prefill and STEP or DWG drawing uploads for faster engineering review.",
    ),
    "en/work/preciform/about/index.html": (
        "About Page for a Precision Manufacturing Exporter | PRECIFORM",
        "A credible B2B company profile combining business history, team capability, export-market coverage and clear cooperation models for international buyers.",
    ),
}

ENGLISH_ONLY_SOURCE = {
    "work/aveline/index.html",
    "work/cadence/index.html",
    "work/goldenfields/index.html",
    "work/reson/index.html",
    "work/sunvolt/index.html",
    "work/vitalink/index.html",
    "work/yunshang/index.html",
}
ENGLISH_ONLY_EN = {f"en/{path}" for path in ENGLISH_ONLY_SOURCE}

THIN_DEMOS = {
    f"{prefix}work/{brand}/{page}/index.html"
    for prefix in ("", "en/")
    for brand in ("aveline", "reson", "yunshang")
    for page in ("about", "journal", "shop")
}

EN_ORG_OFFERS = [
    ("Custom Mobile App Development", "Native iOS and Android or Flutter applications, from product definition and UX to engineering, testing and store-ready delivery."),
    ("WeChat Mini Program Commerce", "Mini Program storefronts with product variants, payments, inventory, fulfilment and merchant operations."),
    ("Enterprise Operations Platforms", "Role-based administration, multi-warehouse inventory, order workflows, reporting and integration-ready APIs."),
    ("Industrial Software Engineering", "C++ and Qt interfaces for inspection, measurement, hardware interaction and real-time professional workflows."),
    ("International B2B Websites", "Multilingual B2B websites with product architecture, enquiry paths, technical SEO, structured data and private deployment."),
]

EN_SERVICE_OFFERS = {
    f"{BASE}/en/services/software/": (
        "Custom Software Design and Development",
        [
            ("Product Discovery and UX/UI Design", "Requirements, user flows, prototypes, high-fidelity interfaces and production-ready design systems."),
            ("Mobile App Development", "Native iOS and Android or Flutter applications with backend services and deployment support."),
            ("Enterprise Platforms", "SaaS administration, operations workflows, dashboards, permissions and business-system integrations."),
            ("Industrial Software", "Professional C++ and Qt interfaces for inspection, measurement and hardware-connected workflows."),
            ("Source-Code Handover", "Complete agreed source code, database assets, design files and deployment documentation."),
        ],
    ),
    f"{BASE}/en/services/web/": (
        "International Website Design and Development",
        [
            ("Multilingual B2B Websites", "Localized content architecture, product catalogues, enquiry journeys and hreflang implementation."),
            ("Corporate and Product Websites", "Responsive brand and product websites with clear positioning, proof and conversion paths."),
            ("B2B Platforms and Catalogues", "Supplier directories, company profiles, product discovery, RFQ and operations workflows."),
            ("Technical SEO", "Crawl architecture, metadata, canonical signals, structured data, sitemaps and performance optimization."),
            ("Private Deployment", "Portable source code and deployment assets without proprietary website-builder lock-in."),
        ],
    ),
}


def offer_catalog(name: str, items: list[tuple[str, str]]) -> dict:
    return {
        "@type": "OfferCatalog",
        "name": name,
        "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": item_name, "description": description}}
            for item_name, description in items
        ],
    }


def replace_attr(tag: str, attr: str, value: str) -> str:
    escaped = html.escape(value, quote=True)
    pattern = re.compile(rf"\b{re.escape(attr)}=(['\"])(.*?)\1", re.I | re.S)
    if pattern.search(tag):
        return pattern.sub(lambda m: f'{attr}="{escaped}"', tag, count=1)
    return tag[:-1] + f' {attr}="{escaped}">'


def set_meta(text: str, key: str, value: str, *, prop: bool = False) -> str:
    attr = "property" if prop else "name"
    pattern = re.compile(
        rf"<meta\b(?=[^>]*\b{attr}=(['\"]){re.escape(key)}\1)[^>]*>", re.I | re.S
    )
    match = pattern.search(text)
    if match:
        tag = replace_attr(match.group(0), "content", value)
        return text[: match.start()] + tag + text[match.end() :]
    tag = f'<meta {attr}="{key}" content="{html.escape(value, quote=True)}">\n'
    return text.replace("</head>", tag + "</head>", 1)


def set_link(text: str, rel: str, href: str) -> str:
    pattern = re.compile(rf"<link\b(?=[^>]*\brel=(['\"]){re.escape(rel)}\1)[^>]*>", re.I | re.S)
    match = pattern.search(text)
    if match:
        tag = replace_attr(match.group(0), "href", href)
        return text[: match.start()] + tag + text[match.end() :]
    return text.replace("</head>", f'<link rel="{rel}" href="{href}">\n</head>', 1)


def set_title(text: str, title: str) -> str:
    value = html.escape(title, quote=False)
    return re.sub(r"<title>.*?</title>", f"<title>{value}</title>", text, count=1, flags=re.I | re.S)


def set_article_h1(text: str, title: str) -> str:
    """Keep an English article's visible topic aligned with its search title."""
    heading = html.escape(title.split(" | ")[0], quote=False)
    return re.sub(
        r"(<h1\b[^>]*>).*?(</h1>)",
        lambda match: match.group(1) + heading + match.group(2),
        text,
        count=1,
        flags=re.I | re.S,
    )


def polish_english_terms(text: str) -> str:
    """Remove recurring literal translations from shared English UI copy."""
    replacements = {
        "Software Custom Development . App Applet . Business backstage":
            "Custom Software · Mobile Apps · Business Platforms",
        "Independent Foreign Trade Station": "International B2B Website",
        "independent foreign trade station": "international B2B website",
        "Foreign Trade Independent Station": "International B2B Website",
        "foreign trade independent station": "international B2B website",
        "Foreign Trade Station": "International B2B Website",
        "foreign trade station": "international B2B website",
        "Foreign Trade Stations": "International B2B Websites",
        "foreign trade stations": "international B2B websites",
        "Google Acquisition Series": "International B2B SEO Series",
        "outer chains": "backlinks",
        "outer chain": "backlink",
        "external chains": "backlinks",
        "outlink": "backlink",
        "South China Sea Winds • Experience and Interactive Design Case 2026":
            "YOYANT Software Atelier · Product Design & Engineering",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def polish_resource_links(text: str) -> str:
    """Use the canonical article title in resource cards and text links."""
    titles = {
        Path(rel).parent.name: title.split(" | ")[0]
        for rel, (title, _description) in EN_META.items()
        if rel.startswith("en/resources/") and rel != "en/resources/index.html"
    }
    descriptions = {
        Path(rel).parent.name: description
        for rel, (_title, description) in EN_META.items()
        if rel.startswith("en/resources/") and rel != "en/resources/index.html"
    }

    pattern = re.compile(
        r'(<a\b[^>]*href=["\'][^"\']*resources/)([^/]+)(/index\.html["\'][^>]*>)(.*?)(</a>)',
        re.I | re.S,
    )

    def update_five(match: re.Match[str]) -> str:
        prefix, slug, suffix, body, closing = match.groups()
        synthetic = update_anchor_match(prefix + slug + suffix, slug, body, closing, titles, descriptions)
        return synthetic

    return pattern.sub(update_five, text)


def update_anchor_match(opening: str, slug: str, body: str, closing: str,
                        titles: dict[str, str], descriptions: dict[str, str]) -> str:
    if slug not in titles:
        return opening + body + closing
    title = html.escape(titles[slug], quote=False)
    if 'class="post-card"' in opening or "class='post-card'" in opening:
        body = re.sub(r"(<h3\b[^>]*>).*?(</h3>)", rf"\g<1>{title}\g<2>", body, count=1, flags=re.I | re.S)
        description = html.escape(descriptions[slug], quote=False)
        body = re.sub(r"(<p\b[^>]*>).*?(</p>)", rf"\g<1>{description}\g<2>", body, count=1, flags=re.I | re.S)
    elif re.search(r'<span\b[^>]*class=["\'][^"\']*rl-t', body, re.I):
        body = re.sub(r'(<span\b[^>]*class=["\'][^"\']*rl-t[^>]*>).*?(</span>)', rf"\g<1>{title}\g<2>", body, count=1, flags=re.I | re.S)
    elif "<" not in body:
        body = title
    return opening + body + closing


def remove_hreflang(text: str) -> str:
    return re.sub(r'<link\b(?=[^>]*\bhreflang=["\'][^"\']+["\'])[^>]*>\s*', "", text, flags=re.I)


def canonical_for(path: Path) -> str:
    rel = path.relative_to(ROOT).parent.as_posix()
    return f"{BASE}/" if rel == "." else f"{BASE}/{rel}/"


def first_image(text: str, canonical: str) -> str:
    match = re.search(r'<meta\b(?=[^>]*property=["\']og:image["\'])[^>]*content=["\']([^"\']+)', text, re.I)
    if match:
        return urljoin(canonical, html.unescape(match.group(1)))
    for match in re.finditer(r'<img\b[^>]*src=["\']([^"\']+)', text, re.I):
        src = html.unescape(match.group(1))
        if not src.startswith("data:"):
            return urljoin(canonical, src)
    return DEFAULT_IMAGE


def update_jsonld(text: str, canonical: str, title: str, description: str, is_en: bool, image_url: str) -> str:
    pattern = re.compile(
        r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',
        re.I | re.S,
    )

    def update(match: re.Match[str]) -> str:
        try:
            data = json.loads(match.group(2))
        except (TypeError, json.JSONDecodeError):
            return match.group(0)
        if is_en:
            # Both languages describe the same business entity. Reusing one
            # stable @id avoids splitting brand/entity signals by locale.
            data = json.loads(
                json.dumps(data, ensure_ascii=False).replace(
                    f"{BASE}/en/#organization", f"{BASE}/#organization"
                )
            )
        graph = data.get("@graph") if isinstance(data, dict) else None
        nodes = graph if isinstance(graph, list) else [data]
        if is_en and isinstance(graph, list):
            # FAQ rich results are not shown for ordinary commercial sites; the
            # machine-translated FAQ graph adds noise without search benefit.
            graph[:] = [n for n in graph if not (isinstance(n, dict) and n.get("@type") == "FAQPage")]
            nodes = graph
        for node in nodes:
            if not isinstance(node, dict):
                continue
            node_type = node.get("@type")
            node_url = str(node.get("url", ""))
            node_id = str(node.get("@id", ""))
            primary = node_url.rstrip("/") == canonical.rstrip("/") or node_id.startswith(canonical)
            node_types = node_type if isinstance(node_type, list) else [node_type]
            primary_types = {
                "AboutPage", "CollectionPage", "Article", "TechArticle",
                "CreativeWork", "SoftwareApplication", "Service", "WebPage",
            }
            if primary and any(kind in primary_types for kind in node_types):
                node["name"] = title.split(" | ")[0]
                if "headline" in node or any(kind in {"Article", "TechArticle", "CreativeWork"} for kind in node_types):
                    node["headline"] = title.split(" | ")[0]
                node["description"] = description
                node["url"] = canonical
                node["inLanguage"] = "en" if is_en else "zh-CN"
                if any(kind in {"Article", "TechArticle"} for kind in node_types):
                    node["mainEntityOfPage"] = {"@type": "WebPage", "@id": canonical}
                    if is_en:
                        node["author"] = {"@type": "Organization", "@id": f"{BASE}/#organization", "name": "YOYANT Software Atelier", "url": f"{BASE}/en/about/"}
                        node["publisher"] = {"@type": "Organization", "@id": f"{BASE}/#organization", "name": "YOYANT Software Atelier", "url": f"{BASE}/", "logo": {"@type": "ImageObject", "url": f"{BASE}/favicon.svg"}}
                    else:
                        node["author"] = {"@type": "Organization", "@id": f"{BASE}/#organization", "name": "YOYANT 远洋软件", "url": f"{BASE}/about/"}
                        node["publisher"] = {"@type": "Organization", "@id": f"{BASE}/#organization", "name": "YOYANT 远洋软件", "url": f"{BASE}/", "logo": {"@type": "ImageObject", "url": f"{BASE}/favicon.svg"}}
                    node["image"] = image_url
                    if is_en and isinstance(node.get("isPartOf"), dict):
                        node["isPartOf"]["name"] = "International B2B Website Growth Series"
            if is_en and "Service" in node_types and canonical in EN_SERVICE_OFFERS:
                catalog_name, catalog_items = EN_SERVICE_OFFERS[canonical]
                node["provider"] = {"@id": f"{BASE}/#organization"}
                node["areaServed"] = "Worldwide"
                node["availableLanguage"] = ["English", "Chinese"]
                node["hasOfferCatalog"] = offer_catalog(catalog_name, catalog_items)
                if canonical.endswith("/software/"):
                    node["serviceType"] = [
                        "Custom software development", "Mobile app development",
                        "Enterprise platform development", "Industrial software development",
                        "Product design", "UI/UX design",
                    ]
                elif canonical.endswith("/web/"):
                    node["serviceType"] = [
                        "B2B website design", "Multilingual website development",
                        "International website development", "Technical SEO",
                        "Website performance optimization",
                    ]
            if is_en and "Organization" in node_types:
                node.update({
                    "@id": f"{BASE}/#organization",
                    "name": "YOYANT Software Atelier",
                    "alternateName": ["YOYANT", "YOYANT Atelier"],
                    "url": f"{BASE}/",
                    "description": "An independent senior product design and software engineering atelier in Guangzhou, China, serving clients worldwide.",
                    "telephone": "+86-137-6068-0715",
                    "email": "bbtizan@gmail.com",
                    "areaServed": "Worldwide",
                    "knowsAbout": [
                        "Custom software development", "Mobile app development",
                        "WeChat Mini Program development", "Enterprise operations platforms",
                        "Industrial C++ and Qt software", "Product design", "UI/UX design",
                        "Multilingual B2B websites", "Technical SEO",
                    ],
                    "hasOfferCatalog": offer_catalog("Product Design and Software Engineering Services", EN_ORG_OFFERS),
                    "sameAs": ["https://github.com/lvtizan", f"{BASE}/"],
                    "contactPoint": {"@type": "ContactPoint", "telephone": "+86-137-6068-0715", "email": "bbtizan@gmail.com", "contactType": "sales", "availableLanguage": ["English", "Chinese"]},
                })
                if isinstance(node.get("founder"), dict):
                    node["founder"].update({
                        "name": "YOYANT Founder",
                        "jobTitle": "Senior Full-Stack Architect and Product Designer",
                        "description": "A senior engineer and product designer with more than ten years of experience delivering commercial software and digital products.",
                    })
        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + match.group(3)

    return pattern.sub(update, text)


def refresh_page(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    text = path.read_text(encoding="utf-8", errors="ignore")
    original = text
    canonical = canonical_for(path)

    if rel in ENGLISH_ONLY_SOURCE:
        text = set_meta(text, "robots", "noindex, follow")
        canonical = f"{BASE}/en/{path.relative_to(ROOT).parent.as_posix()}/"
        text = set_link(text, "canonical", canonical)
    if rel in ENGLISH_ONLY_SOURCE or rel in ENGLISH_ONLY_EN or rel in THIN_DEMOS:
        text = remove_hreflang(text)
    if rel in THIN_DEMOS:
        text = set_meta(text, "robots", "noindex, follow")

    mapping = EN_META.get(rel)
    if mapping:
        title, description = mapping
        text = set_title(text, title)
        text = set_meta(text, "description", description)
        if rel.startswith("en/resources/") and rel != "en/resources/index.html":
            text = set_article_h1(text, title)
    else:
        title_match = re.search(r"<title>(.*?)</title>", text, re.I | re.S)
        desc_match = re.search(r'<meta\b(?=[^>]*name=["\']description["\'])[^>]*content=["\']([^"\']*)', text, re.I)
        title = html.unescape(re.sub(r"<[^>]+>", "", title_match.group(1))).strip() if title_match else ""
        description = html.unescape(desc_match.group(1)).strip() if desc_match else ""

    if title and description:
        is_en = rel.startswith("en/") or re.search(r'<html\b[^>]*lang=["\']en', text, re.I) is not None
        if rel.startswith("en/"):
            text = polish_english_terms(text)
            text = polish_resource_links(text)
        image_url = first_image(text, canonical)
        text = set_meta(text, "og:title", title, prop=True)
        text = set_meta(text, "og:description", description, prop=True)
        text = set_meta(text, "og:url", canonical, prop=True)
        text = set_meta(text, "og:type", "article" if "/resources/" in f"/{rel}" and not rel.endswith("resources/index.html") else "website", prop=True)
        text = set_meta(text, "og:site_name", "YOYANT Software Atelier" if is_en else "YOYANT 远洋软件", prop=True)
        text = set_meta(text, "og:locale", "en_US" if is_en else "zh_CN", prop=True)
        text = set_meta(text, "og:image", image_url, prop=True)
        text = set_meta(text, "twitter:card", "summary_large_image")
        text = set_meta(text, "twitter:title", title)
        text = set_meta(text, "twitter:description", description)
        text = set_meta(text, "twitter:image", image_url)
        text = update_jsonld(text, canonical, title, description, is_en, image_url)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = []
    for path in sorted(ROOT.rglob("index.html")):
        if ".git" in path.parts or path.relative_to(ROOT).as_posix() == "work/demo-ecommerce/index.html":
            continue
        if refresh_page(path):
            changed.append(path.relative_to(ROOT).as_posix())
    print(f"SEO metadata refreshed: {len(changed)} pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

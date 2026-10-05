# YOYANT Shared Site Chrome and Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicated YOYANT headers and footers with synchronized static components, establish durable frontend rules, and eliminate abnormal navigation wrapping, collisions, and horizontal overflow across every HTML page and supported viewport.

**Architecture:** Keep the repository build-free at deploy time. Canonical bilingual header/footer templates and an explicit page manifest feed a Python synchronizer that writes complete static markup into each YOYANT page. Shared CSS and JavaScript own the visual shell and menu behavior, while a Selenium/Chrome audit scans all HTML pages at nine viewport widths; independent demo sites keep their own branding and receive targeted responsive fixes only where the audit reports failures.

**Tech Stack:** Static HTML/CSS/JavaScript, Python 3 standard library, Python `unittest`, Selenium 4 with local Google Chrome, existing GitHub Pages/Cloudflare Pages deployment.

---

## File map

### Create

- `scripts/site_chrome_pages.json` — explicit source of truth for YOYANT pages, locale, and active navigation section.
- `scripts/templates/site-header-zh.html` — canonical Chinese header markup.
- `scripts/templates/site-header-en.html` — canonical English header markup.
- `scripts/templates/site-footer-zh.html` — canonical Chinese footer markup.
- `scripts/templates/site-footer-en.html` — canonical English footer markup.
- `scripts/sync_site_chrome.py` — deterministic template renderer and `--check` validator.
- `scripts/tests/test_sync_site_chrome.py` — synchronizer regression tests.
- `assets/site-chrome.css` — isolated YOYANT header/footer styles and responsive behavior.
- `scripts/audit_layout.py` — local HTTP server, Selenium/Chrome layout scanner, and report formatter.
- `scripts/tests/test_audit_layout.py` — audit classification tests.
- `docs/frontend-rules.md` — binding rules for new and modified pages.

### Modify

- `.githooks/pre-push` — run component-sync and layout checks before Sitemap validation.
- `assets/nav-menu.js` — retain only accessible interaction behavior and support the new public component classes.
- `index.html`, `about/index.html`, `services/*/index.html`, `resources/**/index.html`, and the YOYANT case pages listed in the manifest — add shared assets and synchronized header/footer blocks.
- English equivalents under `en/` — same migration with English templates.
- Independent demo HTML/CSS files reported by the audit — targeted nowrap, breakpoint, grid, and footer fixes without changing brand identity.

## Task 1: Build the static component synchronizer with tests

**Files:**
- Create: `scripts/tests/test_sync_site_chrome.py`
- Create: `scripts/sync_site_chrome.py`
- Create: `scripts/site_chrome_pages.json`
- Create: `scripts/templates/site-header-zh.html`
- Create: `scripts/templates/site-header-en.html`
- Create: `scripts/templates/site-footer-zh.html`
- Create: `scripts/templates/site-footer-en.html`

- [ ] **Step 1: Write failing synchronizer tests**

Cover these real behaviors with temporary fixture pages:

```python
class SyncSiteChromeTests(unittest.TestCase):
    def test_renders_chinese_header_and_active_section(self): ...
    def test_renders_english_footer(self): ...
    def test_preserves_content_outside_markers(self): ...
    def test_second_sync_is_idempotent(self): ...
    def test_check_fails_when_generated_markup_drifted(self): ...
    def test_rejects_missing_or_duplicate_markers(self): ...
```

The fixture manifest must include one Chinese resource page and one English work page so locale and active-section behavior are exercised independently.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
python3 -m unittest scripts.tests.test_sync_site_chrome -v
```

Expected: import or assertion failures because `sync_site_chrome.py` and templates do not exist yet.

- [ ] **Step 3: Implement the manifest and synchronizer**

Use an explicit JSON manifest with this schema:

```json
{
  "pages": [
    {"path": "index.html", "locale": "zh", "section": "home"},
    {"path": "en/index.html", "locale": "en", "section": "home"}
  ]
}
```

The final manifest must include the bilingual home, About, Services, all Resources pages, and only these YOYANT case-study roots:

```text
avatar, epaifa, kst-oilfield, nanhai, ots, tarmeer, veinscope
```

The synchronizer must export focused functions that tests can call:

```python
def render_template(template: str, *, locale: str, section: str) -> str: ...
def replace_region(source: str, region: str, rendered: str) -> str: ...
def sync_page(root: Path, entry: dict[str, str], *, check: bool) -> bool: ...
def main(argv: list[str] | None = None) -> int: ...
```

Template placeholders are limited to `{{ACTIVE_SERVICES}}`, `{{ACTIVE_WORK}}`, `{{ACTIVE_STUDIO}}`, and `{{ACTIVE_INSIGHTS}}`; inactive placeholders render empty and the active placeholder renders ` class="is-active" aria-current="page"`.

- [ ] **Step 4: Add canonical bilingual templates**

Both headers use this semantic structure and differ only in labels and language URL:

```html
<header class="yc-header" data-site-chrome="header">
  <div class="yc-header__inner">
    <a class="yc-brand" href="/" aria-label="YOYANT home">
      <span class="yc-brand__name">YOYANT<span>.</span></span>
      <span class="yc-brand__descriptor">DIGITAL PRODUCT STUDIO</span>
    </a>
    <nav class="yc-nav" aria-label="Primary navigation">...</nav>
    <div class="yc-tools">...</div>
  </div>
</header>
```

Chinese uses `设计与软件工作室`; English uses `DIGITAL PRODUCT STUDIO`. Footer templates reuse `.yc-brand` and expose services, work, studio, insights, email, language, copyright, and the existing KST friendly link.

- [ ] **Step 5: Run synchronizer tests and verify GREEN**

Run:

```bash
python3 -m unittest scripts.tests.test_sync_site_chrome -v
```

Expected: all tests pass.

## Task 2: Implement the shared visual shell and accessible menu

**Files:**
- Create: `assets/site-chrome.css`
- Modify: `assets/nav-menu.js`
- Test: `scripts/tests/test_sync_site_chrome.py`

- [ ] **Step 1: Add failing static-contract tests**

Add tests that assert generated headers contain:

- one brand label and one descriptor;
- four concise primary navigation links;
- `aria-current="page"` on exactly one non-home section when applicable;
- a menu button with `aria-expanded="false"`;
- a language control and `Start a project ↗` / `开始合作 ↗` CTA;
- references to `/assets/site-chrome.css` and `/assets/nav-menu.js` exactly once per synchronized page.

- [ ] **Step 2: Run and verify the new tests fail**

Run the synchronizer test command and confirm the missing assets/markup are the cause.

- [ ] **Step 3: Implement `assets/site-chrome.css`**

Scope every selector under `.yc-header` or `.yc-footer`. Define independent `--yc-*` variables so page-local theme variables cannot break the shell. Required behavior:

```css
.yc-brand__name,
.yc-brand__descriptor,
.yc-nav__link,
.yc-action,
.yc-tool { white-space: nowrap; }

@media (max-width: 1080px) {
  .yc-nav { display: none; }
  .yc-menu-button { display: inline-flex; }
}

@media (max-width: 640px) {
  .yc-brand__descriptor { display: none; }
  .yc-action { display: none; }
}
```

Desktop height is 72px, mobile height is 60px. The wordmark is visually dominant, the descriptor sits tightly below it, and the blue period is the only brand accent. Footer columns collapse to two columns and then one without reducing readable font size.

- [ ] **Step 4: Refactor `assets/nav-menu.js`**

Support `.yc-menu-button`, `.yc-nav`, `.yc-drawer`, and `.yc-scrim`. Preserve:

- `aria-expanded` updates;
- Escape-to-close;
- click-outside close;
- focus moved into the drawer when opened and restored to the button when closed;
- body scroll lock only while open;
- no injected visual CSS.

Keep the legacy `.nav-links` adapter until all non-demo YOYANT pages are migrated, so partial migration never leaves a page without a menu.

- [ ] **Step 5: Run the tests and verify GREEN**

Run the synchronizer suite and `git diff --check`.

## Task 3: Migrate all YOYANT pages to canonical header/footer output

**Files:**
- Modify: all manifest-listed HTML pages
- Modify: `scripts/site_chrome_pages.json`

- [ ] **Step 1: Add migration markers and shared asset links**

For each manifest page:

- wrap the existing header in `SITE-HEADER` markers;
- wrap the existing footer in `SITE-FOOTER` markers;
- add `/assets/site-chrome.css` once in `<head>`;
- keep `/assets/nav-menu.js` once before `</body>`;
- remove page-local CSS rules that target the replaced legacy header/footer only;
- leave content CSS untouched.

Use a mechanical migration script or formatter for repeated transformations; inspect the diff before retaining generated edits.

- [ ] **Step 2: Run the synchronizer in write mode**

Run:

```bash
python3 scripts/sync_site_chrome.py
python3 scripts/sync_site_chrome.py --check
```

Expected: the first command updates the manifest pages; the second reports zero drift.

- [ ] **Step 3: Verify completeness and uniqueness**

Run contract searches to confirm every manifest page has exactly one header start/end marker, one footer start/end marker, one stylesheet reference, and one menu script reference. Confirm independent demo pages do not contain `data-site-chrome="header"`.

- [ ] **Step 4: Run regression tests**

Run:

```bash
python3 -m unittest scripts.tests.test_sync_site_chrome -v
python3 scripts/gen_sitemap.py --check
git diff --check
```

Expected: all commands exit zero.

## Task 4: Add binding frontend rules and pre-push guards

**Files:**
- Create: `docs/frontend-rules.md`
- Modify: `.githooks/pre-push`

- [ ] **Step 1: Write the frontend rules**

Document the approved architecture and make these commands mandatory before deployment:

```bash
python3 scripts/sync_site_chrome.py --check
python3 scripts/audit_layout.py
python3 scripts/gen_sitemap.py --check
```

The rules must state that public YOYANT pages use the shared templates, independent demos keep their own shell, navigation controls never wrap, breakpoints precede collision, Chinese widths use `em`, images use `scripts/imgctl.py`, and new directories under the deploy root require `_redirects` review.

- [ ] **Step 2: Extend the pre-push hook**

Run the component check before Sitemap. Run the layout audit when Chrome and Selenium are available; otherwise fail with an actionable installation message rather than silently skipping a deployment guard.

- [ ] **Step 3: Verify the hook succeeds on synchronized pages**

Run `.githooks/pre-push` directly and confirm it exits zero before continuing.

## Task 5: Build the full-site browser layout audit test-first

**Files:**
- Create: `scripts/tests/test_audit_layout.py`
- Create: `scripts/audit_layout.py`

- [ ] **Step 1: Write failing issue-classification tests**

Test pure-Python formatting and classification independently of Chrome:

```python
def test_fails_horizontal_document_overflow(): ...
def test_fails_wrapped_control(): ...
def test_fails_overlapping_navigation_rectangles(): ...
def test_ignores_hidden_elements(): ...
def test_reports_heading_orphan_as_warning_only(): ...
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
python3 -m unittest scripts.tests.test_audit_layout -v
```

Expected: failures because audit functions are absent.

- [ ] **Step 3: Implement the Selenium scanner**

`audit_layout.py` must:

- start `python3 -m http.server` on an available localhost port;
- locate Google Chrome on macOS or accept `CHROME_BINARY`;
- create one headless Selenium session;
- enumerate every tracked `*.html`, excluding `.git` and `docs`;
- test widths `1440, 1280, 1100, 1024, 900, 768, 430, 390, 360` at a 900px height;
- wait for `document.fonts.ready` and two animation frames;
- inspect visible nav links, buttons, short controls, brands, and footer utility rows;
- detect document overflow, multi-line controls, sibling rectangle overlap, and viewport escape;
- collect browser console errors;
- print deterministic `ERROR`, `WARN`, and summary lines;
- exit nonzero for errors and zero when only warnings remain.

Add `--paths` and `--widths` options for fast focused reruns.

- [ ] **Step 4: Run tests and verify GREEN**

Run the audit unit tests, then run a focused browser scan of `en/resources/index.html` at 1024px. Before responsive fixes, it must reproduce the original wrapped-navigation failure.

## Task 6: Fix every independent demo family reported by the audit

**Files:**
- Modify: only demo files reported by `scripts/audit_layout.py`

- [ ] **Step 1: Capture the full failing baseline**

Run:

```bash
python3 scripts/audit_layout.py > /tmp/yoyant-layout-before.txt
```

Group errors by these existing navigation families:

1. Aveline / Reson / Yunshang multi-page commerce shells.
2. Preciform multi-page industrial shell.
3. Cadence, Goldenfields, Sunvolt, and Vitalink standalone product shells.
4. OTS standalone delivery site.
5. Legacy and preview roots (`404.html`, `index-classic.html`, `preview*.html`).

- [ ] **Step 2: Fix commerce-shell errors**

For each bilingual commerce family, keep the brand and link labels, add `white-space: nowrap` to control-like items, switch the link row to its existing mobile menu before collision, and stack footer groups at the smallest failing width. Apply identical structural fixes to both locales.

- [ ] **Step 3: Fix industrial-shell errors**

For Preciform and the standalone product shells, adjust only the failing family selectors: set safe flex shrink rules, move to the existing compact/mobile navigation before collision, and change footer grids at the first failing breakpoint. Do not copy YOYANT styling into these sites.

- [ ] **Step 4: Fix legacy/preview errors**

Resolve only structural overflow and control wrapping. Preserve their intentional preview appearance and indexing behavior.

- [ ] **Step 5: Rerun after each family**

Use `--paths` and the failing widths from the baseline until that family has no errors. Then run the full audit and retain any heading-orphan warnings for manual review.

## Task 7: Final visual QA, verification, commit, push, and deployment check

**Files:**
- Modify: any page with a verified remaining error
- Modify: `sitemap.xml` only if the generator reports a real page-list change

- [ ] **Step 1: Render representative screenshots**

Capture desktop, tablet, and mobile screenshots for:

- `index.html` and `en/index.html`;
- `resources/index.html` and `en/resources/index.html`;
- one service page;
- one YOYANT case page;
- one page from every independent demo family.

Inspect brand hierarchy, navigation alignment, active state, CTA, drawer, footer grid, and absence of accidental wraps.

- [ ] **Step 2: Run the complete fresh verification suite**

Run:

```bash
python3 -m unittest discover -s scripts/tests -v
python3 scripts/sync_site_chrome.py --check
python3 scripts/audit_layout.py
python3 scripts/gen_sitemap.py --check
git diff --check
git status --short
```

Expected: all tests and checks exit zero; only intended files are modified.

- [ ] **Step 3: Commit the implementation**

Stage only reviewed files and commit with:

```bash
git commit -m "feat: standardize site chrome and responsive layouts"
```

- [ ] **Step 4: Push the verified main branch**

Run:

```bash
git push origin main
```

The pre-push hook must execute successfully. Do not bypass it.

- [ ] **Step 5: Verify deployment**

Confirm the remote branch contains the commit, then inspect these live URLs at desktop and mobile widths:

```text
https://yoyant.com/
https://yoyant.com/en/
https://yoyant.com/resources/
https://yoyant.com/en/resources/
https://yoyant.com/services/software/
https://yoyant.com/en/services/software/
```

Verify the public header/footer markup, menu behavior, and original 1024px English resource-page reproduction. If Cloudflare still serves stale markup, report the cache/deployment state instead of claiming completion.

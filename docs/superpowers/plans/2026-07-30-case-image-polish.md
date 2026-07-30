# Case Image Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage case-study thumbnails feel like cohesive editorial covers using B-style composition and C-style project color grading.

**Architecture:** Keep the existing image assets and card markup. Add a shared thumbnail treatment in `index.html` with category-specific overlays, restrained labels, image positioning, and hover behavior so the visual system scales across all case cards.

**Tech Stack:** Static HTML, CSS, existing WebP assets, browser verification.

---

### Task 1: Polish the homepage case thumbnails

**Files:**
- Modify: `/Users/kp/Code/lvtizan.github.io/index.html:291-305`

- [x] **Step 1: Replace the generic thumbnail treatment**

  Update `.case .thumb`, `.case .thumb img`, and `.case .flag` so images have a slightly taller editorial crop, consistent saturation/contrast, a restrained bottom gradient, and a compact corner label instead of a dominant pill.

- [x] **Step 2: Add category-specific color treatments**

  Add selectors for `.case[data-cat="电商"]`, `.case[data-cat="企业官网"]`, and `.case[data-cat="UI"]` so fashion/e-commerce reads warm, export/manufacturing reads blue-gold, and software/UI reads cool violet-blue.

- [x] **Step 3: Add asset-specific focal points**

  Use existing `src` selectors for `sv-hero`, `med-hero`, `yun-hero`, and `aveline-hero` to keep people/products in the visual center instead of relying on one `object-position: top` rule.

- [x] **Step 4: Verify the homepage visually**

  Open the homepage at desktop and mobile widths, confirm all images load, labels remain readable, cards still link correctly, and category filters still work.

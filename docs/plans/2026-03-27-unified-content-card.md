# Unified `<content-card>` Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a single `<content-card>` web component with container-query-driven responsive layouts, replacing the need for 25 separate card elements while preserving schema.org support and the existing data format.

**Architecture:** A new `demo/` folder inside `ui/content-card/` containing a unified web component that parses layout tokens from `card`, `card-md`, and `card-xl` attributes. The card uses `container-type: inline-size` with an inner `cc-inner` grid wrapper. CSS is modularized into base, layouts, overlays, media, and content files. No existing code is modified.

**Tech Stack:** Vanilla JS (ES modules, custom elements), CSS (container queries, custom properties, grid), HTML. No build step, no dependencies.

---

## Reference: Agreed Design Decisions

### API Surface

```html
<content-card type="recipe" content="recipe-1"
  card="vertical ar(16/9) eyebrow(above)"
  card-md="horizontal ar(4/3) split(1/1)"
  card-xl="overlay(bl) ar(21/9)">
```

### Layout Tokens

| Token | Meaning |
|---|---|
| `vertical` | Media top, content bottom (default if no `card` attribute) |
| `vertical-r` | Content top, media bottom |
| `horizontal` | Media left, content right |
| `horizontal-r` | Content left, media right |
| `overlay(pos)` | Content over media. Positions: `tl` `tc` `tr` `cl` `cc` `cr` `bl` `bc` `br` |
| `media-only` | Media area only, no content |
| `content-only` | Content area only, no media |

### Modifier Tokens

| Token | Example | Meaning |
|---|---|---|
| `ar(ratio)` | `ar(16/9)` | Aspect ratio for media area (overlay: entire card) |
| `split(ratio)` | `split(1/1)` | Column ratio for horizontal layouts |
| `eyebrow(placement)` | `eyebrow(above)` | `above` = above media inside card, `outside` = before card |
| `subgrid` | -- | Enable subgrid alignment across sibling cards |

### Container Query Breakpoints

| Attribute | Query | Threshold |
|---|---|---|
| `card` | None (base) | Always applies |
| `card-md` | `@container card (min-width: 400px)` | Card is 400px+ wide |
| `card-xl` | `@container card (min-width: 700px)` | Card is 700px+ wide |

### Inner DOM Structure

```html
<content-card class="cc" itemscope itemtype="https://schema.org/...">
  <!-- eyebrow(outside) renders here -->
  <div class="cc-inner">
    <!-- eyebrow(above) renders here -->
    <figure class="cc-media">...</figure>
    <div class="cc-content">
      <!-- default eyebrow renders here -->
      ...
    </div>
  </div>
</content-card>
```

### CSS Custom Properties (Minimal Set)

```css
--card-bg, --card-radius, --card-shadow, --card-shadow-hover, --card-gap
--card-pi, --card-pb
--card-media-bg, --card-media-min-h
--card-accent, --card-ink, --card-ink-muted
--card-tag-bg, --card-border
--card-headline-size, --card-summary-size
```

### Data Format

Uses existing CMS-compatible format from `public/static/data/cards.json`. The `data.type` field maps to the `type` attribute. Demo starts with generic card fields only (headline, summary, media, tags, links, actions).

---

## File Structure

```
ui/content-card/demo/
├── index.html                 Main demo page (all 15 sections)
├── content-card.js            Unified web component
├── css/
│   ├── base.css               Container setup, custom props, cc-inner grid
│   ├── layouts.css            7 layouts x 3 breakpoints, split(), ar()
│   ├── overlays.css           9-position overlay x 3 breakpoints
│   ├── media.css              Media area, gallery, captions, ribbon, sticker
│   └── content.css            Typography, tags, actions, links, eyebrow
├── data/
│   └── cards.json             ~15 demo cards
└── tokens.md                  Detailed design token proposal
```

---

## Task 1: Folder Structure & CSS Custom Properties

**Files:**
- Create: `ui/content-card/demo/css/base.css`

**Step 1: Create directory structure**

```bash
mkdir -p ui/content-card/demo/css
mkdir -p ui/content-card/demo/data
```

**Step 2: Write `base.css`**

This file establishes the card as a container query context, defines all custom properties with defaults, and sets up the `cc-inner` grid wrapper.

```css
/* === Custom Properties === */
content-card {
  --card-bg: #fff;
  --card-radius: 6px;
  --card-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
  --card-shadow-hover: 0 2px 8px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06);
  --card-gap: 0;
  --card-pi: 1.25rem;
  --card-pb: 1.5rem;
  --card-media-bg: #e8e0d8;
  --card-media-min-h: 180px;
  --card-accent: #e84e1b;
  --card-ink: #1a1a1a;
  --card-ink-muted: #6b6560;
  --card-tag-bg: #f0ece8;
  --card-border: #e0dbd5;
  --card-headline-size: 1.15rem;
  --card-summary-size: 0.82rem;
}

/* === Container Setup === */
content-card {
  display: block;
  container-type: inline-size;
  container-name: card;
}

/* === Inner Grid Wrapper === */
.cc-inner {
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition: box-shadow .25s ease;
  color: var(--card-ink);
}

.cc-inner:hover {
  box-shadow: var(--card-shadow-hover);
}
```

**Step 3: Verify** -- Open browser dev tools, confirm `content-card` element has `container-type: inline-size`.

**Step 4: Commit**

```bash
git add ui/content-card/demo/css/base.css
git commit -m "feat(content-card): add demo folder with base.css -- container setup and custom properties"
```

---

## Task 2: Content Area Styles

**Files:**
- Create: `ui/content-card/demo/css/content.css`

**Step 1: Write `content.css`**

Styles for the content area interior: eyebrow (3 placements), headline, subheadline, summary, tags, actions (buttons + link CTAs), and link lists.

Key elements:
- `.cc-content` -- flex column container with gap
- `.cc-eyebrow` -- default (inside content), `.cc-eyebrow--above` (before media), `.cc-eyebrow--outside` (before card)
- `.cc-headline`, `.cc-subheadline`, `.cc-summary` -- typography
- `.cc-tags` + `.cc-tag` -- pill-style tags
- `.cc-cta` -- link-style CTA with arrow
- `.cc-actions` + `.cc-btn` + `.cc-btn--primary` + `.cc-btn--secondary` -- button CTAs
- `.cc-links` -- vertical link list with arrows

Refer to the card visualizer (`card-visualizer.html` lines 148-290) for exact values. Use `var(--card-*)` custom properties throughout.

**Step 2: Commit**

```bash
git add ui/content-card/demo/css/content.css
git commit -m "feat(content-card): add content.css -- typography, tags, actions, links, eyebrow"
```

---

## Task 3: Media Area Styles

**Files:**
- Create: `ui/content-card/demo/css/media.css`

**Step 1: Write `media.css`**

Styles for the media area: image container, caption (4 corner positions), ribbon, sticker/splash, gallery (slides, dots, arrows, counter).

Key elements:
- `.cc-media` -- grid container, `place-items: center`, uses `--card-ar` for aspect-ratio
- `.cc-media img` -- `object-fit: cover`, full width/height
- `.cc-caption` + position variants (`--tl`, `--tr`, `--bl`, `--br`)
- `.cc-ribbon` -- clip-path angled badge
- `.cc-sticker` -- circular badge
- `.cc-gallery` -- horizontal scroll-snap container
- `.cc-gallery-slide`, `.cc-gallery-dots`, `.cc-gallery-arrow`, `.cc-gallery-counter`

When `--card-ar` is set, remove `min-height`. Refer to card visualizer lines 99-380 for exact values.

**Step 2: Commit**

```bash
git add ui/content-card/demo/css/media.css
git commit -m "feat(content-card): add media.css -- media area, captions, ribbon, sticker, gallery"
```

---

## Task 4: Layout Styles

**Files:**
- Create: `ui/content-card/demo/css/layouts.css`

**Depends on:** Task 1 (base.css container setup)

**Step 1: Write `layouts.css`**

All 7 layout types across 3 container-query breakpoints. Uses attribute substring selectors (`*=`) to match tokens.

**Structure:**
1. Base rules (no container query) -- `content-card[card*="..."]`
2. `@container card (min-width: 400px)` -- `content-card[card-md*="..."]`
3. `@container card (min-width: 700px)` -- `content-card[card-xl*="..."]`

**Per layout type:**
- `vertical` / `vertical-r` -- `grid-template-rows`
- `horizontal` / `horizontal-r` -- `grid-template-columns: var(--card-split, 2fr 3fr)`
- `media-only` -- hide `.cc-content`
- `content-only` -- hide `.cc-media`
- `eyebrow(above)` -- 3-row grid

**Dynamic values (set by JS as inline custom properties):**
- `ar()` -> `--card-ar`, `--card-ar-md`, `--card-ar-xl` consumed by `.cc-media { aspect-ratio: var(--card-ar, auto); }`
- `split()` -> `--card-split`, `--card-split-md`, `--card-split-xl` consumed by horizontal grid-template-columns

**Selector pattern for horizontal (avoid matching horizontal-r):**
```css
content-card[card*="horizontal"]:not([card*="horizontal-r"])
```

**Step 2: Commit**

```bash
git add ui/content-card/demo/css/layouts.css
git commit -m "feat(content-card): add layouts.css -- 7 layout types x 3 container breakpoints"
```

---

## Task 5: Overlay Styles

**Files:**
- Create: `ui/content-card/demo/css/overlays.css`

**Depends on:** Task 1 (base.css container setup)

**Step 1: Write `overlays.css`**

Overlay layout with 9-position content alignment. Repeated for each container query breakpoint.

**Overlay base:**
- `grid-template: 1fr / 1fr` -- media and content share same grid area
- Content gets `z-index: 1`, white text, gradient background

**9 positions** (for each breakpoint):
- `overlay(bl)` through `overlay(tr)` -- set `justify-content`, `align-items`, `text-align`

**Gradient direction per vertical alignment:**
- Top row: gradient top-to-bottom
- Center row: radial gradient
- Bottom row: gradient bottom-to-top (default)

**Overlay text colors:** white text, semi-transparent eyebrow/summary, glass-effect tags.

Repeat the full set for `card-md` and `card-xl` using `@container card (min-width: ...)`.

**Step 2: Commit**

```bash
git add ui/content-card/demo/css/overlays.css
git commit -m "feat(content-card): add overlays.css -- 9-position overlay x 3 container breakpoints"
```

---

## Task 6: Demo Data

**Files:**
- Create: `ui/content-card/demo/data/cards.json`

**Step 1: Write `cards.json`**

~15 cards using the existing CMS-compatible format. Generic content only (no type-specific fields). Use `https://picsum.photos/seed/{id}/{width}/{height}` for placeholder images.

**Coverage needed:**
- Cards with all fields (media, headline, subheadline, summary, tags, actions, links, caption, sticker, ribbon)
- Minimal cards (headline + subheadline only -- for caption-only use case)
- Content-only cards (no media)
- Gallery cards (multiple `media.sources`)
- Various categories for eyebrow demos

**Data shape per card:**
```json
{
  "id": "demo-N",
  "headline": "...",
  "subheadline": "...",
  "summary": "...",
  "category": "...",
  "media": { "sources": [...], "caption": "..." },
  "tags": [{ "name": "..." }],
  "data": { "type": "article", "content": {...}, "sticker": {...}, "ribbon": {...} },
  "actions": [{ "text": "...", "style": "primary|secondary", "url": "#" }],
  "links": [{ "url": "#", "text": "..." }]
}
```

**Step 2: Commit**

```bash
git add ui/content-card/demo/data/cards.json
git commit -m "feat(content-card): add demo card data -- 15 generic cards covering all field combos"
```

---

## Task 7: Web Component -- Token Parser & Renderer

**Files:**
- Create: `ui/content-card/demo/content-card.js`

**Step 1: Write `content-card.js`**

Single ES module exporting the `ContentCard` class. Three responsibilities:

### 7a: Token Parser

```js
function parseTokens(attrValue) {
  // Input:  "horizontal ar(4/3) split(1/1) eyebrow(above)"
  // Output: { layout: "horizontal", ar: "4/3", split: "1/1", eyebrow: "above", subgrid: false }
}
```

- Layout: match first bare keyword (vertical, vertical-r, horizontal, horizontal-r, overlay(...), media-only, content-only)
- Modifiers: regex for `ar(...)`, `split(...)`, `eyebrow(...)`
- Subgrid: boolean check for "subgrid" in string

### 7b: CSS Variable Injection

```js
_applyTokens() {
  // For each breakpoint (card, card-md, card-xl):
  //   Parse attribute -> set --card-ar[-suffix], --card-split[-suffix]
  //   Remove property if token not present (reset)
}
```

Utility: `toFr("1/1")` returns `"1fr 1fr"`, `toFr("40/60")` returns `"40fr 60fr"`.

### 7c: Renderer

Single `_render()` method:
1. Apply schema.org attributes from `SCHEMA_MAP[type]`
2. Build media HTML (images, gallery, caption, ribbon, sticker)
3. Build content HTML (eyebrow, headline, subheadline, summary, tags, actions, links)
4. Handle eyebrow placement (above/outside/default)
5. Wrap in `cc-inner`, set element content

**Note:** This uses the same light-DOM rendering pattern (`element.innerHTML = html`) as the existing BaseCard system. The existing codebase renders all 25 card types this way.

### Schema Map

```js
const SCHEMA_MAP = {
  article: 'Article', news: 'NewsArticle', product: 'Product',
  event: 'Event', recipe: 'Recipe', review: 'Review',
  job: 'JobPosting', course: 'Course', booking: 'Reservation',
  poll: 'Question', profile: 'Person', faq: 'FAQPage',
  quote: 'Quotation', timeline: 'EventSeries', gallery: 'ImageGallery',
  statistic: 'Observation', achievement: 'EducationalOccupationalCredential',
  announcement: 'SpecialAnnouncement', business: 'LocalBusiness',
  comparison: 'ItemList', contact: 'ContactPage', location: 'Place',
  membership: 'Offer', social: 'SocialMediaPosting', software: 'SoftwareApplication'
};
```

### Public API

```js
// Data binding (same pattern as existing runtime.js)
cardElement.data = { id: "demo-1", headline: "...", ... };
```

Register: `customElements.define('content-card', ContentCard);`

**Step 2: Verify in browser console:**

```js
const card = document.createElement('content-card');
card.setAttribute('card', 'vertical ar(16/9)');
card.data = { headline: 'Test', summary: 'Works' };
document.body.appendChild(card);
// Confirm: cc-inner rendered, --card-ar: 16/9 on element
```

**Step 3: Commit**

```bash
git add ui/content-card/demo/content-card.js
git commit -m "feat(content-card): add unified web component -- token parser, CSS var injection, generic renderer"
```

---

## Task 8: Demo Page

**Files:**
- Create: `ui/content-card/demo/index.html`

**Depends on:** Tasks 1-7

**Step 1: Write `index.html`**

Imports all 5 CSS modules and the component JS. Contains 15 sections mirroring the card visualizer:

1. **Classic Vertical** (3-up grid)
2. **Reversed Vertical** (3-up grid)
3. **Horizontal** (stacked)
4. **Horizontal Reversed** (stacked)
5. **Overlay -- 9 Positions** (3x3 grid)
6. **Button CTAs** (3-up grid)
7. **Multiple Links** (3-up grid)
8. **Image + Caption** (4-up grid, data-driven minimal cards with `ar(1/1)`)
9. **Eyebrow Placement** (3-up: default, above, outside)
10. **Aspect Ratios + Hero Banner** (hero at 21:9, comparison row at 1:1, 4:3, 16:9, 3:4)
11. **Content Only** (3-up grid)
12. **Media Only** (4-up grid)
13. **Gallery** (2-up: vertical + horizontal)
14. **Split Ratios** (stacked: 1/1, 1/2, 2/1)
15. **Responsive -- Container Query Demo** (resizable containers showing card-md/card-xl transitions)

**Page-level styles** (in `<style>` tag): DM Sans font, page header, section layout, demo grids, dividers, label pills, resize container.

**Init script** (bottom of page):
```html
<script type="module">
  const response = await fetch('data/cards.json');
  const cards = await response.json();

  document.querySelectorAll('content-card[content]').forEach(el => {
    const id = el.getAttribute('content');
    const cardData = cards.find(c => c.id === id);
    if (cardData) {
      el.setAttribute('type', cardData.data?.type || 'article');
      el.data = cardData;
    }
  });
</script>
```

**Step 2: Verify** -- Serve and open:

```bash
cd ui/content-card/demo && npx serve .
```

Check all 15 sections render. Test resize handles in section 15.

**Step 3: Commit**

```bash
git add ui/content-card/demo/index.html
git commit -m "feat(content-card): add demo page -- 15 sections showcasing all layouts and responsive behavior"
```

---

## Task 9: Design Token Proposal Document

**Files:**
- Create: `ui/content-card/demo/tokens.md`

**Step 1: Write `tokens.md`**

A proposal document (not implemented in demo CSS) covering the full design token system for when the card moves from demo to package.

**Sections to cover:**

### Surface Tokens
`--card-bg`, `--card-bg-alt`, `--card-radius`, `--card-shadow`, `--card-shadow-hover`, `--card-border`, `--card-border-width`

### Typography Tokens
Per element: `--card-{element}-font`, `--card-{element}-size`, `--card-{element}-weight`, `--card-{element}-lh`, `--card-{element}-ls`

Elements: headline, subheadline, summary, eyebrow, tag, cta, btn

### Spacing Tokens
`--card-pi` (padding-inline), `--card-pbs` (padding-block-start), `--card-pbe` (padding-block-end), `--card-gap`, `--card-content-gap`

### Color Tokens
`--card-ink`, `--card-ink-muted`, `--card-accent`, `--card-accent-hover`, `--card-tag-bg`, `--card-tag-color`

### Media Tokens
`--card-media-bg`, `--card-media-min-h`, `--card-media-radius`

### Interactive Tokens
`--card-transition`, `--card-focus-ring`, `--card-hover-lift`

### Overlay Tokens
`--card-overlay-gradient-start`, `--card-overlay-gradient-end`, `--card-overlay-blur`

### Tailwind Integration

```css
/* Direct mapping */
content-card { --card-accent: theme('colors.brand.500'); }

/* Utility override */
<content-card class="[--card-accent:theme('colors.blue.600')]">

/* Tailwind plugin (future) */
@plugin "content-card" { accent: 'brand.500', radius: 'lg' }
```

### Per-Instance Override Pattern

```html
<content-card style="--card-radius: 0; --card-shadow: none;">
```

### Theming Extension Points (future)

```css
content-card[theme="dark"] {
  --card-bg: var(--card-ink);
  --card-ink: #fff;
  --card-ink-muted: rgba(255,255,255,.7);
  --card-tag-bg: rgba(255,255,255,.12);
}
```

**Step 2: Commit**

```bash
git add ui/content-card/demo/tokens.md
git commit -m "docs(content-card): add design token proposal -- full property taxonomy and Tailwind mapping"
```

---

## Task Dependency Map

| # | Task | Files | Depends on | Parallelizable |
|---|------|-------|------------|----------------|
| 1 | Folder structure & base.css | `demo/css/base.css` | -- | Yes |
| 2 | Content area styles | `demo/css/content.css` | -- | Yes |
| 3 | Media area styles | `demo/css/media.css` | -- | Yes |
| 4 | Layout styles | `demo/css/layouts.css` | 1 | After 1 |
| 5 | Overlay styles | `demo/css/overlays.css` | 1 | After 1 |
| 6 | Demo data | `demo/data/cards.json` | -- | Yes |
| 7 | Web component JS | `demo/content-card.js` | -- | Yes |
| 8 | Demo page | `demo/index.html` | 1-7 | After all |
| 9 | Token proposal doc | `demo/tokens.md` | -- | Yes |

**Parallel batch 1:** Tasks 1, 2, 3, 6, 7, 9
**Parallel batch 2:** Tasks 4, 5 (after task 1)
**Sequential:** Task 8 (after all others)

---
name: build-demo
description: Use when recreating an existing website, page section, or design — from a URL, screenshot, or brand description — as a demo page built on lay-out, lay-out-group and ui-card. Covers news fronts, agency sites, brand-skinned page reconstructions and "make it look like X" requests.
argument-hint: <url-or-screenshot> [output-name]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, WebFetch
---

# Rebuilding a page with the design system

The goal is a page whose *structure* is the system's vocabulary and whose *look* is a thin
token skin. If you find yourself writing grid CSS, you have taken a wrong turn.

**Read the two worked examples first** — they are the spec for this skill:
`layout/demo-assets/bbc.html` + `bbc.css` (news front: section bands, ranked list, serif
headlines) and `layout/demo-assets/wpp.html` + `wpp.css` (agency site: themed bleed bands,
subgrid cards, hero video).

**REQUIRED SUB-SKILLS:** `add-layout` for every band, `add-card` for every card. Their
config-coverage check and token-lookup discipline apply here in full.

## 1. Capture the source

From a URL: fetch it, and use the Playwright MCP tools to screenshot at three widths
(~390 / ~768 / ~1280) plus an accessibility snapshot for the heading structure. From a
screenshot: work from the image.

Inventory before writing anything:
- **Bands** — how many full-width sections, which have headers, which are tinted/bled.
- **Grid geometry per band** — column counts at each width; map each to a real layout token.
- **Card anatomies** — image ratio, overlay vs stacked, which parts appear (eyebrow,
  headline, summary, meta, tags, actions), any furniture (live chip, save, play).
- **Palette** — ink, background, accent, muted, rules/borders.
- **Type** — heading family (serif/sans), weight, tracking, the size ratio between headline
  and body.

## 2. Structure — bands and grids

```html
<body data-layout-root data-page-gap="3">
  <lay-out-group theme="accent border(bs)" xs="pbs(3) pbe(3)">
    <ui-content>
      <small data-part="eyebrow">Section</small>
      <h2 data-part="headline">Section title</h2>
      <a data-part="link" href="/more">View all →</a>
    </ui-content>
    <lay-out md="columns(2)" lg="columns(4)"> …cards… </lay-out>
  </lay-out-group>
</body>
```

**Run the `add-layout` coverage check for every token in every band before writing it.** New
pages reaching for tokens the shipped config never generated is the number one failure mode
of this skill — the page renders as a single column and looks like a CSS bug.

Vertical rhythm comes from `data-page-gap` on the root plus `pb`/`mbs` spacing tokens on the
groups. `bleed` and `--layout-bg` go on the `<lay-out-group>`, never on its inner `<lay-out>`.

## 3. Cards

Compose with `variant=` / `media=` / `content=` per the `add-card` skill. Reach for the
existing vocabulary before inventing anything: `variant="col"` / `"row"` / `spl(1/1)`,
`ovr(bs)` for overlay heroes, `vis(content)` for text-only tiles, `media="asr(16/9) hov(zoom)"`,
`content="hl(lg) scl(sm)"`.

If a genuinely new arrangement is needed, use the `create-layout` skill — do not hand-roll a
grid in the page's CSS.

## 4. The skin — re-alias tokens, never override internals

Stylesheet order matters; the skin is **last**:

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/layout/dist/layout.css">
<link rel="stylesheet" href="/ui/card/ui-card.css">
<link rel="stylesheet" href="/ui/chip/ui-chip.css">   <!-- one per furniture package used -->
<link rel="stylesheet" href="brand.css">
<script type="module" src="/layout/polyfills/attr-fallback.js"></script>
```

The skin has exactly three layers:

```css
/* 1. a private brand palette on :root */
:root {
  --brand-red: #eb0000;
  --brand-ink: #202224;
  --brand-serif: Georgia, "Times New Roman", serif;
}

/* 2. re-alias the SHARED tokens the components read — on body, not :root */
body {
  --color-text: var(--brand-ink);
  --color-accent: var(--brand-red);
  --color-text-muted: #5a5a6a;
  /* --ui-theme-*-bg resolve --color-* at :root and freeze there, so theme="accent"
     keeps the default unless the bundle is re-declared here too */
  --ui-theme-accent-bg: var(--brand-red);
  --ui-theme-accent-c: #fff;
  background: #fff;
  color: var(--brand-ink);
}

/* 3. component knobs per element — still tokens, not properties */
ui-card  { --ui-card-radius: 0; --ui-card-shadow: none; --ui-card-bg: transparent; }
ui-media { --ui-media-radius: 0; }
lay-out ui-content { --ui-content-p: 0; }
```

Setting `--color-accent` on `:root` instead of `body` is the classic mistake — the theme
bundles have already resolved by then and `theme="accent"` keeps the default hue.

## 5. Hygiene

- **State the approximation.** A visible note plus a comment header in the CSS: an
  approximation, unaffiliated, original placeholder copy, repo images, system-font fallback
  for proprietary faces. Both exemplars do this — copy the phrasing.
- Write **original** placeholder copy; never lift the source site's text or images.
- Give proprietary fonts a real fallback stack rather than fetching them.

## 6. Verify

Serve on a fresh port; check the three captured widths and both sides of every breakpoint
you used; console clean. Watch for a stray horizontal scrollbar with `bleed` in Safari
(check `documentElement.clientWidth`, never `window.innerWidth`). If the page will live in
the repo, run `perf-pass` on it before calling it done.

## Sharp edges

- **The config decides what exists.** Every band's tokens must be generated at that
  breakpoint — `add-layout` step 2, no exceptions.
- **Skin by re-aliasing tokens.** Overriding component internals (padding, grid-template,
  colors as literal properties) breaks theming and dark mode and drifts from both exemplars.
- **Both polyfill scripts** are needed on a page using `<lay-out>` *and* cards — they cover
  disjoint attributes.
- A page outside `ui/card/demo/` links per-package stylesheets, not the demo bundle. Only
  demo-bundle pages need the `demo-css` loop.

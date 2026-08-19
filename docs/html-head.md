# The demo-page `<head>`

An audit of the 53 demo pages against the 2026 HTML boilerplate advice, and the reasoning
for each item we adopted, rejected or deferred.

Audited 2026-08-19 against [Manuel Matuzovic's HTML boilerplate](https://matuzo.at/blog/2026/html-boilerplate).

> **Short version.** The heads were already sound — `lang`, `dir`, `charset`, `viewport`
> and `color-scheme` are uniform across every page. We added `text-scale` and, on the card
> demos, a markdown alternate. We rejected `theme-color`: Safari 26 ignores it, and this
> repo already does the thing that replaced it.

---

## 1. What the demo heads carry today

Two families, 53 pages, plus five head-emitting build templates.

| Element | `ui/card/demo` (29) | `layout/dist` (23) | `layout/src/pages` (10) |
|---|---|---|---|
| `<html lang="en-US" dir="ltr">` | all | all | all |
| `<meta charset="UTF-8">` | all | all | all |
| `<meta name="viewport" …viewport-fit=cover>` | all | all | all |
| `<meta name="color-scheme" content="light dark">` | all but generated pages | all | all |
| `<meta name="description">` | all | all | all |
| unique `<title>` | yes | one collision | yes |
| `<meta name="referrer" content="no-referrer">` | card demos only | — | — |
| `<link rel="preconnect">` | card demos only | — | — |
| `canonical` · `icon` · `manifest` · `theme-color` · `og:` | **none** | **none** | **none** |

The `viewport` string and the `<html>` tag are byte-identical on every page, which is what
makes a scripted head sweep safe here.

**Where heads come from.** Hand-written for the 20 top-level card demos, the 10
`layout/src/pages` and `layout/index.html`; generated for the rest by four templates in
`layout/src/demo.js` and four SSR shells under `ui/card/demo/*/build.js` that share
`HEAD_COMMON` in `ui/card/demo/build.shared.js`. A head change is therefore a sweep **and**
a template edit, or the next build reverts it.

---

## 2. Adopted

### 2.1 `<meta name="text-scale" content="scale">`

Opts the page into scaling the root font-size with the OS/browser text-size setting.
Chrome 146+ and Edge 146+; not in Safari, where it is inert. Inside this repo's
Chrome 150 / Safari 26.5 baseline, so it needs no fallback.

Adopted because a design system that ships `clamp()`-scaled type and rem-based container
queries should honour the user's text-size preference rather than route around it — mobile
browsers otherwise ignore the OS setting entirely.

**The obligation.** The tag is a promise that the page survives the platform maximum,
typically 200–300%. That promise was tested, not assumed — see § 4.

### 2.2 `<link rel="alternate" type="text/markdown">`

On the card demo pages with a real documentation counterpart, pointing at the `.md` file
Cloudflare Pages already serves as `text/markdown`. Reasoning, evidence and the honest
statement of how weak that evidence is: `docs/llms-txt.md`.

---

## 3. Rejected

### 3.1 `<meta name="theme-color">` — Safari 26 ignores it

The clearest finding of the audit, and the reason it is documented rather than silently
skipped.

Safari 26 still **parses** the tag and **ignores the value**. Toolbar colour is now derived
from the page itself:

1. the `background-color` of fixed/sticky elements near the viewport edges,
2. falling back to the `background-color` of `<body>` — `<html>` is not consulted,
3. then the system default.

Sampling happens at initial render; later JavaScript changes do not re-trigger it. There is
no override.

For this repo that leaves `theme-color` honoured only by Chromium on Android and in
installed PWAs — near-zero overlap with how these demos are viewed. Meanwhile
`ui/base/core.css` already sets:

```css
:where(body) {
  background-color: var(--color-surface);
  color-scheme: light dark;
}
```

which is exactly what Safari 26 samples. **The correct implementation is already in place;
adding the meta would be cargo.** Keep `body` carrying an explicit token background — that
is the load-bearing part, not the tag.

The one existing use, `ui/gui/app/index.html`, is a PWA-style app shell and is left alone.

### 3.2 Other boilerplate items

| Item | Why not |
|---|---|
| `<html class="no-js">` | No demo styles on a no-JS branch; JS is progressive enhancement throughout. |
| Print stylesheet | Demo pages demonstrate screen layout. |
| `<meta name="format-detection">` | Already present on the two pages with phone numbers. Not general. |
| `rel="site.standard.publication"` | Not publishing to the atmosphere. |
| `preload` | `docs/performance.md` owns loading policy; nothing here is a measured LCP win. |

---

## 4. What `text-scale` does to this codebase — measured

`text-scale` scales the root font-size, and card breakpoints are **container** queries in
`rem` (`md:` 25rem, `lg:` 44rem). So text scaling moves them. Verified in Chromium by
setting the root font-size to 2× and 3× the 16px default, which is precisely the mechanism
the meta triggers.

**Breakpoints flip, and that is correct.** On `cards.html` a card measuring 63rem at 1×
measures 21rem at 3× — crossing below both `lg:` and `md:`, so it adopts the narrow layout.
Larger text getting more generous layout is the desired behaviour, not a regression.

**Horizontal overflow at 300%: 23 of 24 pages clean.**

| Page | 1× | 2× | 3× |
|---|---|---|---|
| 23 card + layout demos | 0 | 0 | 0 |
| `ui/card/demo/media.furniture.html` | 0 | 0 | **+104px** |

### 4.1 The one failure is a pre-existing layout bug

Not caused by `text-scale`; only exposed by it. On `media.furniture.html`, at a 48px root:

```
<lay-out md="columns(2)" lg="columns(3)">
grid-template-columns: 368.297px 368.297px 368.312px   → 1201px
body width                                              → 1009px
```

The tracks are `1fr`, so they should divide the container. They do not, because grid items
default to `min-width: auto`: at 48px type the cards' min-content width exceeds the track
and pushes the grid wider than its parent.

This is the same failure the repo already documents for masonry lanes, and which
`layout/core/base.css:186-194` already fixes there:

```css
/* Lane items are grid items, so min-inline-size defaults to `auto` = the … */
& > *:not(lay-out) { min-inline-size: 0; }
```

`columns()` has no equivalent guard. Reproducible without `text-scale` at a narrow viewport
with large type. Logged in `docs/plans/open-items.md`; not fixed here, because it is a
layout-system change and this was a head audit.

Until it is fixed, `media.furniture.html` overflows at the top of the scaling range while
carrying a tag that says it will not.

---

## 5. Deferred — not rejected

Absent from all 53 pages, each defensible to add later:

| Item | The case for it |
|---|---|
| `rel="canonical"` | Real duplication here: `v4.browser.style` and `browser.style` overlap, and Pages 308-redirects `/foo.html` → `/foo`, so most pages have two or three live URLs. |
| `rel="icon"` / `apple-touch-icon` / `rel="manifest"` | `favicon.ico`, `favicon.svg` and `site.webmanifest` exist at the repo root and are referenced by **no page at all**. See § 6. |
| `og:` / `fediverse:creator` / `rel="me"` | Only worth it if demo links get shared; needs a default `og:image`. |

---

## 6. Bug found while auditing: `site.webmanifest` is dead

`/site.webmanifest` is served (`application/manifest+json`) but:

- **no page links it** — zero `rel="manifest"` in the repo, so it is never loaded;
- **its icons do not exist.** It points at `assets/favicon/android-chrome-{192,512}.png`,
  but `assets/favicon/` is not in the repo. Pages answers those URLs with the site's
  fallback **HTML at status 200**, so the failure is silent — an installing browser gets
  markup where it expects a PNG.

It also still describes the site as "Cross-Browser Default Styles", the pre-v4 tagline.

Either generate the icons and link the manifest, or delete the file. Leaving a
linked-by-nobody manifest with 200-but-wrong icons is the worst of the three.

---

## Sources

- [Manuel Matuzovic — HTML boilerplate 2026](https://matuzo.at/blog/2026/html-boilerplate)
- [MDN — `<meta name="text-scale">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/text-scale) · [CSS Fonts 5](https://drafts.csswg.org/css-fonts-5/#text-scale-meta)
- [Why iOS 26 Safari toolbar colors work differently](https://nasedk.in/blog/ios26-safari-toolbar-colors/)
- [MDN — `<meta name="theme-color">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color)

# @browser.style/scroll-spy

CSS-first **scroll-spy navigation** — "on this page" links whose active state follows the section in view, driven by scroll timelines. No JavaScript, no observers, no Shadow DOM. A sticky bar by default, a side rail with `variant="rail"`, and a per-section progress fill that measures how far through *that* section the reader is.

Used by `@browser.style/card` demo pages with a lot of content (the real-estate listing).

## Features

- Pure CSS: each target publishes a `view-timeline`, each link reads it through `timeline-scope` — the active state, the crossfade and the progress fill are all scroll-linked
- One attribute binds both sides: `data-spy="n"` on the target and on the link that tracks it
- Two looks from one markup: the sticky **bar** (an inline scroller with the shared scroll-edge fade) and the side **rail** (track, dots, and a segment that fills as its section is read)
- Correct for sections taller than the viewport — bound to `exit-crossing`, not `exit` (see *How it works*)
- Tokens ride the design system (`--color-accent`, `--color-text-muted`, `--color-border`), logical properties only, zero-specificity `:where()` throughout
- Works in both baseline engines (Chrome 150+, Safari 26.5+) with nothing to polyfill

---

## Install

```bash
npm install @browser.style/scroll-spy
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, borders, etc.) and the `--_dir-s`/`--_dir-e` direction resolver the progress fill uses.

---

## Usage

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/scroll-spy/index.css">

<nav data-scroll-spy aria-label="On this page">
	<ol>
		<li data-spy="1"><a href="#intro">Introduction</a></li>
		<li data-spy="2"><a href="#method">Method</a></li>
		<li data-spy="3"><a href="#results">Results</a></li>
	</ol>
</nav>

<section id="intro"   data-spy="1">…</section>
<section id="method"  data-spy="2">…</section>
<section id="results" data-spy="3">…</section>
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/scroll-spy/style';
```

### The binding contract

- **Number the targets in reading order** with `data-spy="1"` … `data-spy="12"`. A target is any element at any depth — a `<section>`, a `<lay-out>` band, a `<ui-card>`. It needs an `id` for the link and `data-spy` for the timeline.
- **Put the same `data-spy="n"` on the nav item** (the `<li>`) that tracks target *n*. Order in the list does not matter; the number does.
- **Up to 12 targets.** Timeline names are idents and `sibling-index()` is a number — no shipped engine turns one into the other (the spec's `ident()` is not in Chrome 152 or Safari 26.5), so the binding is twelve one-line arms in the sheet. Need more? Add a `[data-spy="13"]` arm and the name to the `timeline-scope` list.
- **One spy per page.** Every page declares one scope; two navs may *read* the same targets (the demo shows a bar and a rail side by side), but two sets of targets would declare duplicate names.
- **Separate targets with padding, not margin.** The state hands over when one target's end edge crosses the line and the next one's start edge does; a margin between them is a gap where nothing is current.

### The two spellings

`<nav data-scroll-spy>` keeps the navigation landmark and is the recommended form. `<ui-scroll-spy>` takes the same tokens and `variant=` without the `data-` prefix — wrap a `<nav>` in it when the landmark matters:

```html
<ui-scroll-spy variant="rail">
	<nav aria-label="On this page"><ol>…</ol></nav>
</ui-scroll-spy>
```

> Safari drops list semantics from an `<ol>` with `list-style: none` unless it sits inside a `<nav>` — one more reason to use the native spelling.

---

## Variants

### Bar (default)

A sticky strip; the list is an inline scroller with the base scroll-edge fade, and each item's accent underline fills as its section is read. Two page-level knobs make the bar work with anchor jumps — set them on `:root` (they are read on the *targets*, not on the nav):

```css
:root {
	--ui-scroll-spy-offset: 4rem;  /* the bar's height → scroll-margin-block-start on every target */
	--ui-scroll-spy-line: 30%;     /* the reference line, as a viewport inset from the top; keep it ≥ the offset */
}
```

### Rail — `variant="rail"` / `data-variant="rail"`

A vertical side list: a track at inline-start, a dot per entry that fills with its state, and a segment per entry that fills down the track as its section is read. Sticky at `--ui-scroll-spy-sticky` (default `--spacing-lg`) — place it in a grid cell that is **start-aligned**, so the sticky element has room to travel:

```html
<lay-out lg="ratio(75:25) items(start)">
	<article>…targets…</article>
	<nav data-scroll-spy data-variant="rail" aria-label="On this page">…</nav>
</lay-out>
```

The page decides where and when the rail shows (a `<lay-out>` cell, a media query); the component never sets a breakpoint.

---

## Customization

| Token | Default | Description |
|---|---|---|
| `--ui-scroll-spy-accent` | `var(--color-accent)` | Progress fill and the active dot |
| `--ui-scroll-spy-bg` | `var(--color-surface)` (rail: `transparent`) | Bar background |
| `--ui-scroll-spy-c` | `var(--color-text-muted)` | Link ink at rest |
| `--ui-scroll-spy-c-active` | `var(--color-text)` | Link ink while current |
| `--ui-scroll-spy-dot-size` | `0.5rem` | Rail dot diameter |
| `--ui-scroll-spy-fs` | `var(--font-size-sm)` | Font size |
| `--ui-scroll-spy-gap` | `var(--spacing-sm)` (rail: `--spacing-xs`) | Gap between items / link padding |
| `--ui-scroll-spy-line` | `30%` | Reference line — read on the **targets** (`view-timeline-inset`), so set it on `:root` |
| `--ui-scroll-spy-offset` | `0px` | Sticky-bar height — read on the **targets** (`scroll-margin-block-start`), so set it on `:root` |
| `--ui-scroll-spy-ramp` | `3rem` (`0px` under reduced motion) | Scroll distance over which the active state crossfades |
| `--ui-scroll-spy-sticky` | `0px` (rail: `var(--spacing-lg)`) | `inset-block-start` of the sticky nav |
| `--ui-scroll-spy-track` | `var(--color-border)` | Track colour (bar underline / rail line) |
| `--ui-scroll-spy-track-size` | `var(--border-width-thick)` | Track thickness |

```html
<nav data-scroll-spy data-variant="rail" style="--ui-scroll-spy-accent: var(--color-success); --ui-scroll-spy-ramp: 1rem">
```

---

## How it works

Every target declares `view-timeline: --spy-n block` with `view-timeline-inset: <line> 0`, and `timeline-scope` on `:root` hoists the twelve names so the nav — anywhere in the document — can read them. A nav item runs two tiny animations on target *n*'s timeline: `in` (0→1) over the first `--ui-scroll-spy-ramp` of the target's **`exit-crossing`** range, `out` (1→0) over the same distance past its end. The item is current while `in × out` is 1; the colour is a `color-mix()` of that product, and the fill is one composited `scale` over the full `exit-crossing` range.

**Why `exit-crossing` and not `exit`.** For a subject taller than the (inset-reduced) scrollport the spec defines `exit 0%` as `contain 100%` — the moment its *bottom* edge reaches the viewport bottom — so a tall section would light up late and the previous one would hold on far too long. `exit-crossing` is 0% when the start edge crosses the scrollport start and 100% when the end edge does, whatever the height.

**Why ramps, not `transition`.** A change caused by an animated custom property does not start a CSS transition, so the crossfade is scroll-linked instead: a fixed length of scroll (`--ui-scroll-spy-ramp`) on both edges. Under `prefers-reduced-motion: reduce` the ramp is `0px` and the state switches instantly; the timeline bindings themselves are state, not motion, and stay on.

**Why arms.** A timeline name is a `<dashed-ident>`; `sibling-index()` is a number and plain `attr()` a string, and no shipped engine turns either into an ident. The spec's answer is `ident()` — `view-timeline-name: ident("--spy-" attr(data-spy))` on the targets, `animation-timeline: ident("--spy-" sibling-index())` on the nav items — but `CSS.supports('view-timeline-name', 'ident("--spy-" 1)')` is `false` in Chrome 152 and Safari 26.5 (checked 2026-08-28). Until both ship it, `[data-spy="n"] { --_spy: --spy-n }` is written twelve times and everything else reads `var(--_spy)`; the sheet marks the arms so they can be deleted the day `ident()` lands.

---

## Accessibility

- Use the native `<nav aria-label="On this page">` spelling — a landmark with a label that does not repeat the role name.
- The links are real anchors: keyboard and screen-reader navigation work with no CSS at all, and the page's `scroll-margin-block-start` (via `--ui-scroll-spy-offset`) keeps a jumped-to heading clear of the sticky bar.
- CSS cannot write `aria-current`; the current item is conveyed visually only. Add it from script if your page needs it announced.
- Colours default to the AA-tuned base tokens; the accent fill is a UI boundary (≥ 3:1). Check contrast if you retint.

## Browser support

Scroll-driven animations (`view-timeline`, `timeline-scope`, `animation-range` with `exit-crossing`), `@property`, `color-mix()` and CSS nesting — Chrome 115+ / Safari 26+. Both baseline engines (Chrome 150+, Safari 26.5+) support everything here, so the sheet ships no `@supports` guard; in an engine without scroll-driven animations the links are plain links with the fills at rest.

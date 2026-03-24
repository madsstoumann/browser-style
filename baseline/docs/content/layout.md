---
sidebar_label: Layout
---

# 🟢 Layout

A `layout` is a content section on a page — a hero banner, a card grid, a feature list, a testimonial carousel, etc. Pages reference an ordered array of layouts, each containing a configuration preset and polymorphic content references.

Schema: [`models/layout.schema.json`](../../models/layout.schema.json)

---

## Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `title` | string | yes | Layout name, e.g. "Hero Section", "Feature Grid" |
| `config_id` | ref > layout-config | | Reference to a layout configuration preset |
| `content` | ref[] | | Polymorphic references to any content model (typically content-card) |
| `includeInMarkdown` | boolean | | Whether this layout's content appears in `.md` endpoints and `llms.txt` (default: `true`) |

---

## How It Works

```
Page
├── Layout: "Hero Banner"
│   ├── config_id ──► layout-config ("Full Width Hero")
│   └── content[] ──► content-card[] (one hero card)
│
├── Layout: "Feature Grid"
│   ├── config_id ──► layout-config ("3-Column Card Grid")
│   └── content[] ──► content-card[] (three feature cards)
│
└── Layout: "CTA Section"
    ├── config_id ──► layout-config ("Centered Narrow")
    └── content[] ──► content-card[] (one CTA card)
```

Each layout separates **what** (content) from **how** (config). The same content cards can appear in different layouts with different visual configurations.

---

## The `includeInMarkdown` Flag

When set to `false`, the layout's content is excluded from:
- **`.md` endpoints** — markdown representation of the page
- **`llms.txt` / `llms-full.txt`** — LLM index files

This is useful for decorative or interactive sections (hero animations, image carousels, embedded widgets) that add noise for AI consumers. Default is `true`.

---

## Layout Configuration

Each layout references a `layout-config` preset that controls the visual presentation: responsive grid, spacing, overflow behavior, animations, and more. See [Layout Config](./layout-config.md) for the full field reference.

---

## Content References

The `content` field is a polymorphic reference array — it can reference any content model, though in practice it typically references `content-card` entries. This enables a single layout to contain articles, products, events, FAQs, profiles, or any other card type.

See the page documentation for how layouts are [rendered on a page](./page.md#layouts).

---

## Animation System

The layout system includes a comprehensive scroll-driven and scroll-triggered animation system. Animations are configured on the `<lay-out>` element via HTML attributes and are powered entirely by CSS — no JavaScript required for core functionality.

### Two Modes

**Scroll-driven (`animate-self`)** — animates the layout container itself as it enters/exits the viewport. The animation progress is tied directly to the scroll position.

```html
<lay-out animate-self="fade-up()">
```

**Scroll-driven with stagger (`animate`)** — animates each child item with automatic stagger. Earlier items animate first as the layout scrolls into view.

```html
<lay-out animate="fade-up()">
  <div>Animates first</div>
  <div>Animates second</div>
  <div>Animates third</div>
</lay-out>
```

Both modes use `animation-timeline: view()` to tie animation progress to the element's visibility in the viewport.

### Scroll-Triggered Mode (Chrome 145+)

A newer API enables **time-based animations triggered by scroll position** rather than directly driven by it. This gives animations a natural duration and easing instead of being locked to scroll speed.

| Keyword | Behavior |
|---------|----------|
| `trigger` | Play forward when entering the viewport |
| `trigger-exit` | Play backward when exiting |
| `trigger-both` | Play forward on entry, reverse on exit |

```html
<lay-out animate="fade-up() trigger">
<lay-out animate="zoom-in() trigger-both">
```

The system progressively enhances: browsers without `timeline-trigger-name` support fall back to standard scroll-driven animations.

### Available Animations

| Category | Animations |
|----------|-----------|
| **Bounce** | `bounce()`, `bounce-in-up()`, `bounce-in-down()`, `bounce-in-left()`, `bounce-in-right()` |
| **Fade** | `fade-in()`, `fade-out()`, `fade-up()`, `fade-down()`, `fade-left()`, `fade-right()`, `fade-up-left()`, `fade-up-right()`, `fade-down-left()`, `fade-down-right()` |
| **Flip** | `flip-up()`, `flip-down()`, `flip-left()`, `flip-right()`, `flip-diagonal()` |
| **Morph** | `morph(circle)`, `morph(inset)`, `morph(polygon)` |
| **Other** | `opacity()` |
| **Reveal** | `reveal(circle)`, `reveal(inset)`, `reveal(polygon)`, `reveal(superellipse)` |
| **Slide** | `slide-up()`, `slide-down()`, `slide-in()`, `slide-out()` |
| **Zoom** | `zoom-in()`, `zoom-in-rotate()`, `zoom-out()`, `zoom-out-rotate()` |

### Intensity Multiplier

Each animation accepts an optional multiplier (1–3) that scales the spatial properties — translation distance, rotation angle, zoom amount:

```html
<lay-out animate-self="fade-up()">    <!-- default intensity -->
<lay-out animate-self="fade-up(2)">   <!-- 2x: 220px translation instead of 110px -->
<lay-out animate-self="fade-up(3)">   <!-- 3x: 330px translation -->
```

### Pace Tokens

The `pace` attribute controls animation speed via entry/exit range tokens:

| Token | Effect |
|-------|--------|
| `very-slow` | Widest entry range — very gradual |
| `slow` | Full entry phase |
| *(default)* | Normal speed (no token needed) |
| `fast` | Narrow range — snappy |
| `very-fast` | Narrowest range — instant feel |
| `exit` | Enable exit animation (default speed) |
| `exit-fast` | Fast exit |
| `exit-slow` | Slow exit |

Tokens are space-separated and combinable:

```html
<lay-out animate-self="fade-up()" pace="slow exit-fast">
```

### Deep Stagger

The `deep` keyword extends stagger to grandchildren — useful when each card contains multiple elements (headline, image, text) that should animate in sequence:

```html
<lay-out animate="fade-up() deep">
  <article>              <!-- item 1 -->
    <img>                <!-- animates first within item 1 -->
    <h2>Title</h2>       <!-- second -->
    <p>Summary</p>       <!-- third -->
  </article>
  <article>              <!-- item 2 (later than item 1) -->
    <img>                <!-- first within item 2 -->
    <h2>Title</h2>       <!-- second -->
    <p>Summary</p>       <!-- third -->
  </article>
</lay-out>
```

Stagger offsets combine item position and child position for smooth cascading animations.

### Easing

The `easing` attribute selects from 100+ predefined easing curves:

```html
<lay-out animate="fade-up()" easing="ease-spring-3">
<lay-out animate-self="zoom-in()" easing="ease-bounce-2">
```

| Category | Variants |
|----------|----------|
| **Bounce** | `ease-bounce-1` through `ease-bounce-5` |
| **Ease** | `ease-1` through `ease-5` |
| **Ease in/out/in-out** | `ease-in-1`–`5`, `ease-out-1`–`5`, `ease-in-out-1`–`5` |
| **Elastic** | `ease-elastic-1`–`5`, plus `in`, `out`, `in-out` variants |
| **Named curves** | `ease-circ-*`, `ease-cubic-*`, `ease-expo-*`, `ease-quad-*`, `ease-quart-*`, `ease-quint-*`, `ease-sine-*` (each with `in`, `out`, `in-out`) |
| **Spring** | `ease-spring-1` through `ease-spring-5` |
| **Squish** | `ease-squish-1` through `ease-squish-5` |
| **Step** | `ease-step-1` through `ease-step-5` |

### Morph Overlays

Morph animations place a solid-color `::after` overlay on the layout that morphs away via `clip-path`, revealing the content underneath. Useful for section-to-section transitions:

```html
<lay-out animate-self="morph(circle)">    <!-- circle shrinks to reveal -->
<lay-out animate-self="morph(inset)">     <!-- rectangle contracts from edges -->
<lay-out animate-self="morph(polygon)">   <!-- diamond morphs to rectangle -->
```

Set `--layout-morph-bg` to the previous section's background color for a seamless transition effect.

### Progressive Enhancement

The animation system uses three layers of progressive enhancement:

| Layer | Requirement | Feature |
|-------|-------------|---------|
| Base | Scroll-driven animations support | `animation-timeline: view()` |
| Enhanced | `sibling-index()` support | Stagger scales to unlimited children (no nth-child ceiling) |
| Advanced | `timeline-trigger-name` support (Chrome 145+) | Time-based scroll-triggered animations with natural duration |

All layers are gated behind `@supports` — browsers that don't support a layer simply skip those enhancements. Content is always visible and functional without animations.

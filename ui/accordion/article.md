# Building an Accordion with Pure CSS

Accordions are one of those components every developer has built at least once. And yet, most implementations reach for JavaScript *immediately* — toggling classes, managing state, calculating heights for animations. But what if the browser already gave us everything we need?

The `<details>` and `<summary>` elements are native, accessible, keyboard-navigable, and require zero JavaScript to work. Add the `name` attribute, and the browser handles exclusive open behavior too. Combine that with `::details-content` for smooth animations, and you've got a production-ready accordion — no JS required.

In this article, we'll build a full-featured accordion system with composable variants, animated transitions, and even horizontal and split-view layouts. Let's get started!

---

## The Markup

An accordion is just a list of `<details>` elements. Each one contains a `<summary>` (the clickable heading) and a `<div>` (the collapsible content):

```html
<ui-accordion>
  <details name="faq">
    <summary>How do I reset my password?</summary>
    <div>
      Go to the login page and click on the "Forgot Password" link.
      Follow the instructions sent to your email.
    </div>
  </details>
  <details name="faq">
    <summary>How long does shipping take?</summary>
    <div>
      We aim to process and ship orders within 1-2 business days.
    </div>
  </details>
</ui-accordion>
```

`<ui-accordion>` is a custom element — but just a structural wrapper. No Shadow DOM, no JavaScript. The `name` attribute groups the items — only one can be open at a time, handled natively by the browser.

> **NOTE**: [Image: A basic accordion with two items, one open, one closed. Simple, unstyled, showing the native browser behavior.]

Not much to see yet. Let's add some styles.

---

## Base Styles

First, the wrapper. We set `container-type: inline-size` so we can use container queries for responsive layouts later, and `interpolate-size: allow-keywords` so transitioning from `block-size: 0` to `block-size: auto` actually works:

```css
:where(ui-accordion) {
  container-type: inline-size;
  display: grid;
  interpolate-size: allow-keywords;
}
```

Now the `<details>` element. The magic is in `::details-content` — a pseudo-element that wraps the content *inside* the `<details>`, excluding the `<summary>`. We can transition it:

```css
details::details-content {
  block-size: 0;
  content-visibility: hidden;
  overflow: hidden;
  transition:
    block-size 0.3s,
    content-visibility 0.3s,
    padding-block 0.3s;
  transition-behavior: allow-discrete;
}

details[open]::details-content {
  block-size: auto;
  content-visibility: visible;
  padding-block: 1.5ch;
}
```

So what's going on? When the `<details>` is closed, the content has `block-size: 0` and `content-visibility: hidden`. When opened, it transitions to `block-size: auto`. The `transition-behavior: allow-discrete` is the key — it lets `content-visibility` transition discretely (it's normally not animatable). Without it, the content would pop in and out instantly.

The `<summary>` gets some flex layout for alignment and a hover effect:

```css
details summary {
  align-items: center;
  cursor: pointer;
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding-block: 1.5ch;
}

details:not([open]) summary:hover {
  background: linear-gradient(90deg, #0000, hsl(0, 0%, 97.5%) 10% 90%, #0000);
}
```

The hover gradient fades in from the edges — a subtle touch that avoids the harsh look of a solid hover background.

When an item is open, the summary gets an underline that fades in on hover:

```css
details[open] summary {
  text-decoration: underline #0000 2px;
  text-underline-offset: 0.3ch;
  transition: text-decoration-color 0.2s;
}
details[open] summary:hover {
  text-decoration-color: currentColor;
}
```

The trick: `text-decoration: underline #0000` sets an *invisible* underline. On hover, `text-decoration-color: currentColor` fades it in. This creates a smooth underline reveal without layout shift.

> **NOTE**: [Image: The accordion with smooth open/close transitions, hover gradient on closed items, and the underline fade-in on the open summary.]

Getting there!

---

## Icon Indicator

An accordion needs a visual indicator — something that tells the user "this is expandable." We'll use `<ui-icon>`, a separate component that provides animated CSS icons:

```html
<summary>
  How do I reset my password?
  <ui-icon type="plus-minus"></ui-icon>
</summary>
```

The icon type determines the animation:
- `plus-minus` — plus rotates to minus on open
- `chevron down` — chevron rotates 180 degrees
- `chevron right` — chevron rotates 90 degrees
- `arrow right` / `arrow down` — arrow rotates
- `plus-cross` — plus morphs into an X

These are all CSS-only animations, driven by the parent `details[open]` state. No JavaScript needed.

> **NOTE**: [Image: A row of accordion items, each with a different icon type, showing the open/closed states side by side.]

---

## Composable Variants

Here's where the design system thinking comes in. Instead of a single monolithic `variant="card"` or `variant="flush"`, we use *composable* variants — small, focused modifiers that you combine:

```html
<ui-accordion variant="bordered divided rounded">
```

Each variant does one thing:

### `divided` — Divider Lines

Adds a border between items:

```css
ui-accordion[variant~="divided"] details:not(:last-of-type) {
  border-block-end: 1px solid var(--color-border);
}
```

Simple. The `:not(:last-of-type)` avoids a double border at the bottom.

> **NOTE**: [Image: Accordion with divider lines between items.]

### `bordered` — Frame Border

Wraps the entire group in a border and adds inline padding:

```css
ui-accordion[variant~="bordered"] {
  border: 1px solid var(--color-border);
  details {
    padding-inline: 1.5ch;
  }
}
```

> **NOTE**: [Image: Accordion with a full border frame around the group.]

### `rounded` — Corner Radius

Rounds the container and the first/last items:

```css
ui-accordion[variant~="rounded"] {
  border-radius: 1ch;
  details:first-of-type {
    border-start-start-radius: 1ch;
    border-start-end-radius: 1ch;
  }
  details:last-of-type {
    border-end-start-radius: 1ch;
    border-end-end-radius: 1ch;
  }
}
```

We use the long-form `border-start-start-radius` etc. instead of the shorthand because we only want to round specific corners — first item gets top corners, last item gets bottom corners.

> **NOTE**: [Image: Accordion with rounded corners, showing the bordered + divided + rounded combination.]

### `separate` — Card-Style Items

Adds a gap between items and wraps each in its own border:

```css
ui-accordion:is([variant~="separate"], [variant~="shadow"]) {
  gap: 2rem;
  details {
    border: 1px solid var(--color-border);
    padding-inline: 2.25ch;
  }
}
```

Combined with `rounded`, each item becomes its own card.

> **NOTE**: [Image: Accordion with separated, rounded card-style items with gaps between them.]

### `shadow` — Elevated Items

Replaces borders with box shadows for a floating card look:

```css
ui-accordion[variant~="shadow"] {
  details {
    border: 0;
    border-radius: 1em;
    box-shadow: 0 1em 4em color-mix(in srgb, CanvasText 10%, transparent);
  }
}
```

The `color-mix(in srgb, CanvasText 10%, transparent)` creates a shadow that adapts to light and dark mode — it uses the text color at 10% opacity rather than hardcoded black.

> **NOTE**: [Image: Accordion with floating shadow cards, shown in both light and dark mode.]

Nice!

### Combining Variants

The power is in composition. Here are some useful combinations:

```html
<!-- Framed group with rounded corners -->
<ui-accordion variant="bordered divided rounded">

<!-- Separated cards -->
<ui-accordion variant="separate divided rounded">

<!-- Floating shadow cards -->
<ui-accordion variant="shadow divided rounded">
```

> **NOTE**: [Image: Three accordion groups side by side, each showing a different combination of variants.]

---

## Breakout

The `breakout` variant is the most visually dramatic. When an item opens, it *separates* from the group — the items above and below shift apart to make room:

```css
ui-accordion[variant~="breakout"] {
  details {
    translate: 0 calc(var(--_y, 0) * 1rem);
    transition: translate 0.3s ease;
  }
  details[open]:not(:first-of-type),
  details[open]:first-of-type ~ details {
    --_y: 1;
  }
  details[open] ~ details {
    --_y: 2;
  }
}
```

What happened here? Each item has a `translate` driven by a `--_y` custom property. By default, `--_y` is 0 (no shift). When an item opens:

- The open item itself gets `--_y: 1` (shifts down by 1 unit) — unless it's the first item
- Everything *after* the open item gets `--_y: 2` (shifts down by 2 units)
- Everything *before* stays at `--_y: 0`

The result: the open item visually "breaks out" of the stack. Combined with `rounded`, the open item gets its own border radius while the remaining closed items maintain their group shape.

```html
<ui-accordion variant="breakout divided rounded">
```

> **NOTE**: [Image: Breakout accordion with an item open in the middle — the open item has its own border and radius, items above stay grouped, items below shift down.]

Cool!

---

## Tinted

The `tinted` variant uses `sibling-index()` and `sibling-count()` to create a graduated color ramp across items. Each item gets a slightly different shade based on its position:

```css
ui-accordion[variant~="tinted"] {
  details {
    --_bg: color-mix(
      in oklab,
      var(--_tint),
      #FFF calc(
        (sibling-index() - 1) / max(sibling-count() - 1, 1) * 80%
      )
    );
    background: var(--_bg);
    color: contrast-color(var(--_bg));
  }
}
```

The base tint color is read from a `tint` attribute:

```html
<ui-accordion variant="tinted" tint="oklch(0.35 0.18 210)">
```

Each item mixes the tint with white, using its `sibling-index()` as a percentage. The first item is the full tint color, and each subsequent item gets progressively lighter. `contrast-color()` ensures text stays readable against each shade.

> **NOTE**: [Image: A horizontal accordion with a deep blue tint that graduates to near-white across 6 items. Each item has white or dark text depending on its background.]

---

## No-Collapse

Sometimes you want to ensure one item is *always* open — the user can switch between items but can't close them all. The `no-collapse` attribute handles this:

```css
ui-accordion[no-collapse] details[open] summary {
  pointer-events: none;
}
```

That's it — one line. When an item is open, its summary becomes non-interactive. The user can open a different item (which closes this one via the `name` attribute), but they can't click the open summary to close it.

```html
<ui-accordion no-collapse name="always-one">
```

---

## Horizontal Layout

At wider viewports, the accordion can transform into a blinds-style horizontal layout. Closed items appear as vertical tabs, and the open item expands to fill the remaining space.

This requires a container query (the accordion itself is the container) and a `<cq-box>` wrapper — because a container can't query its own size:

```html
<ui-accordion type="horizontal" variant="bordered rounded">
  <cq-box>
    <details name="horizontal" open>
      <summary>Section One</summary>
      <div>Content here...</div>
    </details>
    <!-- more items -->
  </cq-box>
</ui-accordion>
```

The CSS flips the grid to columns and rotates closed summaries:

```css
@container (inline-size > 650px) {
  ui-accordion[type="horizontal"] cq-box {
    display: grid;
    grid-auto-flow: column;

    details:not([open]) {
      writing-mode: vertical-lr;
    }
  }
}
```

The `writing-mode: vertical-lr` rotates the closed summary text. No transforms, no absolute positioning — just a writing mode change. Below 650px, it falls back to the standard vertical accordion.

> **NOTE**: [Image: A horizontal accordion with one panel open showing content, and three collapsed panels shown as vertical tabs on the sides.]

---

## Split-View Layout

The `split` type shows the accordion items in a left column with associated media in a right panel. It's perfect for feature showcases — clicking an item reveals its image or video alongside:

```html
<ui-accordion type="split" variant="divided" no-collapse>
  <cq-box>
    <details name="showcase" open>
      <summary>Our Workspace</summary>
      <div>
        Description text here.
        <img src="workspace.jpg" alt="Workspace" data-split>
      </div>
    </details>
  </cq-box>
</ui-accordion>
```

The `data-split` attribute marks which element should appear in the right panel. The CSS uses `display: contents` on the open `::details-content` to break the content out of the flow, then absolutely positions the `[data-split]` element:

```css
ui-accordion[type="split"] cq-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative;
}

cq-box > details {
  grid-column: 1;
}

details[open]::details-content {
  display: contents;
}

details[open] [data-split] {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  inline-size: calc(50% - 2rem);
}

[data-split]:is(img, video, picture) {
  animation: media-in 0.6s ease;
  object-fit: cover;
}
```

The media fades in with a subtle scale animation:

```css
@keyframes media-in {
  from { opacity: 0; scale: 1.02; }
}
```

> **NOTE**: [Image: Split-view accordion with three items on the left, and a large photo displayed on the right panel corresponding to the open item.]

Much better!

---

## Dark Mode

Everything adapts to dark mode automatically. The key is using `color-mix()` with `CanvasText` for shadows:

```css
box-shadow: 0 1em 4em color-mix(in srgb, CanvasText 10%, transparent);
```

Instead of hardcoded `rgba(0,0,0,.1)`, this uses the system text color at 10% opacity. In light mode, `CanvasText` is black; in dark mode, it's white — so shadows always look natural.

The hover gradient uses `var(--color-field)` which adapts via the design token system. Borders use `var(--color-border)`. No dark mode overrides, no `prefers-color-scheme` media queries.

> **NOTE**: [Image: Side-by-side comparison of the bordered/rounded accordion in light mode and dark mode, showing how shadows, borders, and hover effects adapt.]

---

## Accessibility

Because we built on native `<details>` and `<summary>`:

- Screen readers announce expand/collapse state automatically
- `Enter` and `Space` toggle items
- `Tab` navigates between summaries
- Focus ring uses design tokens (`--ring-width`, `--ring-color`, `--ring-offset`)
- No ARIA attributes needed — the browser handles semantics
- Works with JavaScript disabled (CSS-only mode)

This is the biggest advantage of the CSS-first approach. We didn't rebuild an accordion from `<div>` soup and then bolt on ARIA attributes. We used the elements the browser already provides.

---

## Web Component

For framework use, `<ui-accordion-item>` provides a declarative API. It renders the exact same `<details>` + `<summary>` HTML — then *replaces itself* in the DOM. After render, it's pure native HTML. All CSS selectors work unchanged.

```html
<ui-accordion name="faq" variant="bordered divided rounded">
  <ui-accordion-item label="How do I reset my password?" icon="chevron down" open>
    Go to the login page and click "Forgot Password."
  </ui-accordion-item>
  <ui-accordion-item label="How long does shipping take?" icon="chevron down">
    We aim to ship within 1-2 business days.
  </ui-accordion-item>
</ui-accordion>
```

In React:

```jsx
import '@browser.style/accordion';

function FAQ({ items }) {
  return (
    <ui-accordion name="faq" variant="divided">
      {items.map(item => (
        <ui-accordion-item key={item.id} label={item.question}>
          {item.answer}
        </ui-accordion-item>
      ))}
    </ui-accordion>
  );
}
```

---

## Browser Support

| Feature | Status |
|---------|--------|
| `<details>` / `<summary>` | All modern browsers |
| `name` attribute (exclusive open) | Chrome 120+, Safari 17.2+, Firefox 130+ |
| `::details-content` transitions | Chrome 131+, Safari 18.2+ |
| `sibling-count()` / `sibling-index()` | Chrome 133+, Safari 18.4+ |
| `contrast-color()` | Chrome 138+ |
| Container queries | Chrome 105+, Firefox 110+, Safari 16+ |

Graceful degradation: without `::details-content` support, items open and close instantly (no animation). Without `sibling-count()`, the tinted variant falls back to a uniform color. The core functionality — open, close, exclusive grouping — works everywhere.

---

## Conclusion

We built a complete accordion system — smooth animations, composable variants, horizontal and split-view layouts, tinted color ramps — and the JavaScript is *optional*. The `<details>` element does the heavy lifting. CSS handles the variants, transitions, and responsive layouts. The web component is just a convenience for initial rendering.

The composable variant pattern is worth highlighting: instead of monolithic presets, small focused modifiers like `bordered`, `divided`, `rounded`, `breakout`, and `shadow` combine to create dozens of visual styles from a handful of building blocks.

---

Thanks for reading!

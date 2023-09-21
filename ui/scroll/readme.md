# Scroll
Scroll is a bundle of two CSS-files: `ui-scroll.css` and `ui-scroll-nav.css` — and a JavaScript-file: `uiScroll.js`.

`ui-scroll.css` can be used *without* JavaScript, adding `scroll-snap` and more to a container of scrollable items, using `class="ui-scroll"`.

`ui-scroll-nav.css` styles navigation-arrows (previous- and next), active item and dots, rendered by the JavaScript, and appended to a `<nav>`-tag, added directly **after** the node containing `class="ui-scroll"`.

## JavaScript

The method `uiScroll()` has two parameters:

- `scroll` — The DOM-node containing `class="ui-scroll"`
- `settings` — An object or `dataset` with configuration

### Settings

| Option | Description |
| ------- |-------- |
| scrollActive    | Class to apply to active item |
| scrollAutoPlay  | Time in ms for autoplay |
| scrollBehavior  | `smooth` or `auto` |
| scrollNav       | Class to apply to navigation-wrapper* |
| scrollNext      | Class to apply to next-button |
| scrollNextInner | Inner content of next-button |
| scrollPrev      | Class to apply to prev-button |
| scrollNextPrev  | Inner content of prev-button |
| scrollResizeThreshold | See description†  |
| scrollTabs      | See description†† |

\* Classes added to the `<nav>`-element, specififying **type** of navigation. 
If `ui-scroll-nav.css` is used, this **must** contain `ui-scroll-nav`, as well as a type:

- `--nav-inside` — Navigation added inline
- `--nav-outside` — Navigation added *outside* of scrollable content
- `--nav-tabs` — Navigation is rendered, but hidden
- `--no-dots` — Dots are hidden

† When a resize occurs, this is the minimum change in pixels the width of the outer container will change, before data are re-calculated.

†† String with `closest()` common parent-selector for the element that contains (multiple) `role="tab"`, if tabs are used.

When a `dataset` is used, use kebab-style:

```html
<div class="ui-scroll"
  data-scroll-active="active"
  data-scroll-auto-play="3000"
  data-scroll-behavior="auto">
```

### CSS Mofifiers

- `--hidden`
- `--inside`
- `--no-buttons`
- `--no-dots`
- `--outside`

---

- `--hover`
- `--preview`
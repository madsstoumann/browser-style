# @browser.style/map

`<ui-map>` — an interactive map on keyless OpenStreetMap-family raster tiles, with
Supercluster clustering, configured by the `map=` token DSL.

It **reads its points from the microdata already on the page**. There is no second copy of
the data, no JSON payload and no coordinate attributes per pin — so the drawn marker and the
machine-readable value cannot drift. That is the collection-scale version of the contract
the single-point map already has with `details.geo` (see
[ui/card/docs/media.md § Map](../card/docs/media.md)).

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/ui/map/index.css">

<ui-map map="tiles(auto) tint(gray) cluster fit" for="offices">
  <!-- no-JS fallback; the element removes it once the engine is up -->
  <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=…" title="Map of our offices" loading="lazy"></iframe>
</ui-map>

<ol id="offices">
  <li itemscope itemtype="https://schema.org/LocalBusiness">
    <a itemprop="url" href="/offices/copenhagen"><span itemprop="name">Copenhagen</span></a>
    <div itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates" hidden>
      <meta itemprop="latitude" content="55.6761">
      <meta itemprop="longitude" content="12.5683">
    </div>
  </li>
</ol>

<script type="module" src="/ui/map/ui-map.min.js"></script>
```

## Tokens

<!-- tokens:summary attr=map -->
| token | axis | args | aliases | bare | writes | md:/lg: | deprecated |
|---|---|---|---|---|---|---|---|
| `tiles()` | tiles | **provider** auto positron dark voyager osm topo sat | — | — | — | — | — |
| `tint()` | tint | **look** gray mono sepia invert warm cool soft | — | — | --ui-map-filter | — | — |
| `pin()` | pin | **look** dot pin label price | — | — | --ui-map-pin-size --ui-map-pin-bg --ui-map-pin-c --ui-map-cluster-size | — | — |
| `cluster()` | cluster | **radius** sm md lg &lt;n&gt; | — | yes | — | — | — |
| `zoom()` | zoom | **level** &lt;n&gt; | — | — | — | — | — |
| `ctl()` | ctl | **control** zoom non | — | — | — | — | — |
| `fit` | view | — | — | yes | — | — | — |
| `scroll` | view | — | — | yes | — | — | — |
<!-- /tokens -->

<!-- tokens:args attr=map stems=tiles,tint,pin -->
| token | arg class | values | aliases |
|---|---|---|---|
| `tiles()` | **provider** | auto positron dark voyager osm topo sat | — |
| `tint()` | **look** | gray mono sepia invert warm cool soft | — |
| `pin()` | **look** | dot pin label price | — |
<!-- /tokens -->

## Where points come from

The element resolves its source in this order:

1. `for="<id>"` — the element that holds the items
2. the nearest `ui-card` / `ui-reveal` host
3. the document

Inside it, every `[itemprop="geo"]` scope becomes one point. `latitude` / `longitude` are
read from the `<meta content>` pair and **validated as numbers** (finite, ±90 / ±180) before
anything reaches the map — the same discipline `render.js` `mapCoords()` applies before
coordinates reach a URL. `name`, `url` and `price` come from the enclosing item scope.

`<ui-media>` renders before `<ui-content>`, so on a streaming parse the list may not exist
when the element first looks. It retries once at `DOMContentLoaded` — no `MutationObserver`,
no polling.

## Tiles

Every provider here is **keyless**. Each record in `engine.js` carries its own attribution
string next to its URL, so a provider cannot ship without one, and `ctl()` has no word for
the attribution control — it must not be spellable in the DSL.

| token | provider | maxZoom |
|---|---|---|
| `tiles(positron)` | CARTO Positron — the default | 20 |
| `tiles(dark)` | CARTO Dark Matter | 20 |
| `tiles(voyager)` | CARTO Voyager | 20 |
| `tiles(topo)` | OpenTopoMap | 17 |
| `tiles(sat)` | Esri World Imagery | 19 |
| `tiles(osm)` | OpenStreetMap Mapnik — **dev / self-host only**, see below | 19 |
| `tiles(auto)` | positron or dark, following the colour scheme | — |

`positron`, `dark` and `voyager` are the **raster twins** of the Positron, Dark Matter and
Voyager styles on [openmaptiles.org](https://openmaptiles.org/styles/) — those are MapLibre
*vector* styles and need an API key; these do not.

> **`tiles(osm)` is not a production default.** The
> [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) forbids a
> library from defaulting to `tile.openstreetmap.org`, requires an identifying User-Agent,
> and names referer-stripping as grounds for blocking without notice — and browser.style's
> own demo pages send `<meta name="referrer" content="no-referrer">`. All six endpoints are
> demo-grade: for production, point at your own tile server.

**`tiles(auto)` does not use `prefers-color-scheme`.** `theme=` and the `.cs-*` utilities set
`color-scheme`, which that media query cannot see, so a `theme="dark"` card would get the
light basemap. Instead the element reads a registered `<color>` property whose value is
`light-dark(#000, #fff)` — one `getComputedStyle` read that resolves against the *computed*
colour scheme, and therefore answers correctly for the OS preference **and** every local
override. On a change it calls Leaflet's `setUrl()` on the existing layer; stacking two tile
layers and hiding one in CSS would double every tile request.

## Tint

`tint()` is **pure CSS** — one `filter` on `.leaflet-tile-pane` — so it composes with any
`tiles()` value at no extra request.

It must never go on `.leaflet-tile-container`: `leaflet.css` gives `.leaflet-tile`
`filter: inherit`, so a filter there is applied **twice**, and `invert(1)` twice is the
identity. The pane holds only tiles, so markers, controls and the attribution keep their
true colours.

## Markers

Both single points and clusters are `L.divIcon` `<span>`s, so Leaflet's `marker-icon`,
`marker-shadow` and `layers` PNGs are **never fetched**. Colour comes from the shared `theme=`
axis, not from a hue argument — one hue palette.

The element positioned by Leaflet is `.ui-map-marker`; the visual inside it is
`.ui-map-pin`, which centres itself with `translate` (not `transform`) so it composes with
Leaflet's positioning rather than replacing it.

## Popups

Clicking a marker opens a Leaflet popup with the place's name, price, address, phone and
opening hours; hovering still shows the name as a tooltip.

The content is **plain text harvested from the list row, never cloned markup** — cloning
would duplicate the row's `itemprop`s and the enclosing `ItemList` would count every place
twice.

If the place lives in a carousel slide with an `id`, the popup title links to `#that-id`
instead of the listing's own URL: a scroll-snap child is reachable by plain in-page anchor,
so clicking a pin scrolls the carousel to that card with **no JavaScript**. Without slides it
falls back to the external URL.

## Accessibility

**The visible list is the map's text alternative**, and the tiles and markers are
decoration: every place is already a real link.

So `aria-hidden` goes on the **five decorative panes** — `tilePane`, `overlayPane`,
`shadowPane`, `markerPane`, `tooltipPane` — and on nothing else. Not the canvas, and not
their shared parent `mapPane`: all six panes are children of it, `popupPane` included, and
a popup's close button is `<a href="#close">`. Hiding the parent would bury a focusable
control, which is the axe `aria-hidden-focus` rule, and would also hide the attribution
links that the tile licences require be reachable.

Nothing focusable is left inside the hidden subtree: Leaflet is created with
`keyboard: false`, which drops the container's `tabindex` and every marker's, and the
element creates tooltips (inert) rather than popups (which ship a close button).

`prefers-reduced-motion` is honoured on **two** arms. The JS arm turns off Leaflet's zoom,
fade, marker-zoom and inertia tweens at construction. The CSS arm matters independently:
Leaflet computes `_zoomAnimated` once at init, so the options alone miss a mid-session
preference change, and the transitions themselves live in Leaflet's stylesheet.

## Cascade

`engine.js` adopts `leaflet.css` into `@layer bs-component.leaflet`. Adopted stylesheets are
ordered **after** author sheets, so `ui-map.css` opens with

```css
@layer bs-component.leaflet, bs-component.map;
```

That statement is load-bearing: it is what lets our rules beat Leaflet's at **zero
specificity**, with no `!important` anywhere. Remove it and the attribution restyle, the
reduced-motion arm and the marker styling all silently lose.

## Sizing

A map initialised inside `content-visibility: auto`, a closed `<details>`, or any
zero-sized box lays out wrong. The element ships a `ResizeObserver` that calls
`invalidateSize()` on the first non-zero box — the single most common Leaflet integration
bug, guarded from day one.

## Loading

Nothing loads until an `IntersectionObserver` (200px margin) fires, which then dynamically
imports the engine.

| file | gzip | contains |
|---|---|---|
| `ui-map.min.js` | ~1.3 kB | the element only — **zero** third-party bytes |
| `engine.min.js` | ~50 kB | Leaflet 1.9.4 + Supercluster 9 + `leaflet.css` |

Override the engine URL with `globalThis.uiMapEngineUrl` for a CDN or pnpm layout. A failed
engine load is caught and leaves the fallback frame in place — the map is an enhancement.

## Events

| event | detail | when |
|---|---|---|
| `ui-map:ready` | `{ points }` | the engine is up and markers are drawn |
| `ui-map:select` | `{ point }` | a single-point marker was clicked |

Both bubble and are composed.

## Build

```bash
node build.js     # -> engine.min.js + ui-map.min.js
```

Leaflet and Supercluster are **devDependencies**: their bytes are inlined into
`engine.min.js`, so consumers of this package get no transitive dependencies.

## Third-party licences

Bundled into `engine.min.js`, notices preserved at end of file:

- **Leaflet** 1.9.4 — BSD-2-Clause, © 2010–2023 Vladimir Agafonkin, © 2010–2011 CloudMade
- **Supercluster** 9.0.0 — ISC, © Mapbox
- **kdbush** 4.x — ISC, © Vladimir Agafonkin

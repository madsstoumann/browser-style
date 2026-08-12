/**
 * attr-fallback.js — typed attr() polyfill for the @browser.style components.
 *
 *   <script type="module" src="/ui/base/polyfills/attr-fallback.js"></script>
 *
 * WHY THIS EXISTS
 * Components read author values straight from attributes with typed attr():
 *
 *   :where(ui-chip) { &[fill] { --ui-chip-accent: attr(fill type(<color>), …); } }
 *
 * Where typed attr() is unsupported (Safari, Firefox) this does NOT degrade to
 * the attr() fallback value. A custom property parses ANY token stream, so the
 * declaration is valid and the property literally holds the text
 * `attr(fill type(<color>), …)`. It is therefore NOT guaranteed-invalid, which
 * means `var(--ui-chip-accent, <fallback>)` never reaches its fallback either —
 * the property that consumes it becomes invalid at computed-value time instead
 * and resets to its initial value. In practice: no background, no ring, an empty
 * rating, a collapsed menubar.
 *
 * TWO LAYERS, BOTH NEEDED
 *   1. CSS — each component ships an `@supports not (background-color: attr(x
 *      type(<color>), red))` block re-declaring the attr() defaults, so it always
 *      renders something sane with NO JavaScript. That is the real fallback.
 *   2. This file — restores each element's OWN attribute value on top, so
 *      fill="#c9b8ff" is that colour rather than the component default.
 *
 * It is a no-op in browsers with typed attr() (feature-detected once, below), so
 * it is safe to load unconditionally.
 *
 * SCOPE: this is an app-level convenience that knows about many packages. The
 * components themselves stay self-sufficient via their own @supports blocks —
 * nothing here is required for a component to render correctly.
 *
 * `<lay-out>` has its own equivalent (layout/polyfills/attr-fallback.js) because
 * it also ships a companion stylesheet; it is not duplicated here.
 *
 * @version 1.0.0
 */

/**
 * selector → { CSS property : [attribute, default, presets?] }
 *
 * `default`  used when the attribute is present but empty.
 * `presets`  values the component resolves ITSELF with its own rules (e.g.
 *            high-light[fill="green"] means the highlighter green #82ffad, NOT
 *            the CSS keyword `green`). Those must be left to the stylesheet —
 *            writing the raw attribute value would override the preset with a
 *            completely different colour, or with an invalid one (ring="success").
 *
 * A property is only written when the element actually carries the attribute, so
 * the CSS @supports defaults keep owning every other case.
 * KEEP IN SYNC with the `attr(… type(…))` declarations in each component's CSS.
 */
export const ATTR_MAP = {
	'ui-avatar[ring]': { '--_ring': ['ring', 'var(--color-accent)', ['error', 'info', 'success', 'warning']] },
	'ui-avatar-group[max]': { '--_max': ['max', '0'] },
	'ui-beacon[fill]': { '--ui-beacon-accent': ['fill', 'var(--color-text)'] },
	'ui-beacon[ink]': { '--ui-beacon-c': ['ink', 'hsl(0, 0%, 100%)'] },
	'ui-chip[fill]': { '--ui-chip-accent': ['fill', 'var(--color-button)'] },
	'ui-chip[ink]': { '--ui-chip-c': ['ink', 'hsl(0, 0%, 100%)'] },
	'ui-gradient-text': {
		'--_dir': ['dir', '90deg'],
		'--_dur': ['duration', '5s'],
		'--_gradient': ['gradient', '#0077ff, #00e7df, #0077ff'],
		'--_size': ['size', '150%'],
	},
	'high-light[fill]': { '--_fill': ['fill', '#82ffad', ['green', 'yellow', 'orange', 'pink']] },
	'high-light[ink]': { '--_ink': ['ink', 'currentColor'] },
	'ui-marquee[fill]': { '--ui-marquee-bg': ['fill', 'var(--color-surface)'] },
	'ui-marquee[ink]': { '--ui-marquee-c': ['ink', 'hsl(0, 0%, 100%)'] },
	'mega-menu': {
		'--mega-menu-margin-inline': ['margin-inline', '0'],
		'--mega-menu-max-width': ['max-width', 'none'],
		'--mega-menu-menubar-height': ['menubar-height', '3rem'],
		'--mega-menu-view-width': ['mobile-view-width', '60vw'],
		'--mega-menu-z-index': ['z-index', '1000'],
	},
	'ui-play[fill]': { '--ui-play-bg': ['fill', 'rgb(0 0 0 / 0.55)'] },
	'ui-play[ink]': { '--ui-play-c': ['ink', 'hsl(0 0% 100%)'] },
	'.ui-rating': { '--min': ['min', '1'], '--max': ['max', '5'], '--value': ['value', '3'] },
	'ui-save[fill]': { '--ui-save-circle-bg': ['fill', 'Canvas'] },
	'ui-save[ink]': { '--ui-save-c': ['ink', 'var(--color-text)'] },
	// data-fill, not fill: the target is an <li>, where a bare attribute is invalid HTML
	// (same reason the named palette is data-theme= there, but that needs no polyfill)
	':is(ui-timeline, .ui-timeline, [data-part="timeline"]) > li[data-fill]': { '--ui-timeline-dot': ['data-fill', 'inherit'] },
	// stagger per-child overrides — KEEP IN SYNC with ui/base/stagger.css
	'[stagger-index]':      { '--_stg-i':    ['stagger-index', '1'] },
	'[data-stagger-index]': { '--_stg-i':    ['data-stagger-index', '1'] },
	'[stagger-step]':       { '--_stg-step': ['stagger-step', 'var(--stagger-step, 0.07s)'] },
	'[data-stagger-step]':  { '--_stg-step': ['data-stagger-step', 'var(--stagger-step, 0.07s)'] },
	'ui-sticker': {
		'--ui-sticker-bg': ['fill', 'var(--color-accent)'],
		'--ui-sticker-c': ['ink', 'hsl(0, 0%, 100%)'],
		'--_angle': ['angle', '0deg'],
	},
	// real property, not a custom one — the declaration itself is dropped in Safari
	'[data-view]': { 'view-transition-name': ['data-view', 'none'] },
};

/**
 * Detect on a REAL property: `CSS.supports('--x: attr(…)')` is true even in
 * Safari (a custom property accepts any token stream), but a real property
 * only parses typed attr() where it's implemented — the same expression the
 * components' own `@supports not (…)` fallback blocks gate on, so both layers
 * flip together. Parser-level, no DOM: the old substitution probe
 * (append div + getComputedStyle) forced a full-document style pass — 618 ms
 * on the schema demo (throttled mobile).
 */
function isTypedAttrSupported() {
	return CSS.supports('background-color', 'attr(x type(<color>), red)');
}

function applyTo(element, attrs) {
	for (const [prop, [attr, fallback, presets]] of Object.entries(attrs)) {
		const value = element.getAttribute(attr);
		if (value === null) continue;
		// a preset is the component's own to resolve — clear anything we wrote
		// earlier (the attribute may have changed from a raw colour to a preset)
		if (presets?.includes(value)) element.style.removeProperty(prop);
		else element.style.setProperty(prop, value || fallback);
	}
}

function apply(root = document) {
	for (const [selector, attrs] of Object.entries(ATTR_MAP)) {
		if (root.matches?.(selector)) applyTo(root, attrs);
		for (const el of root.querySelectorAll?.(selector) ?? []) applyTo(el, attrs);
	}
}

/** Attribute → the selectors that read it, for the observer's attributeFilter. */
function watchedAttributes() {
	const names = new Set();
	for (const attrs of Object.values(ATTR_MAP)) {
		for (const [attr] of Object.values(attrs)) names.add(attr);
	}
	return [...names];
}

function observe() {
	const observer = new MutationObserver(mutations => {
		for (const m of mutations) {
			if (m.type === 'childList') {
				for (const node of m.addedNodes) if (node.nodeType === 1) apply(node);
			} else if (m.type === 'attributes' && m.target.nodeType === 1) {
				// re-run the whole map for this element: one attribute can feed
				// several properties, and removing it must drop the inline value
				for (const [selector, attrs] of Object.entries(ATTR_MAP)) {
					if (!m.target.matches(selector)) {
						for (const [prop, [attr]] of Object.entries(attrs)) {
							if (attr === m.attributeName) m.target.style.removeProperty(prop);
						}
						continue;
					}
					applyTo(m.target, attrs);
				}
			}
		}
	});
	/* documentElement, not body: a render-blocking <head> load has no body yet, and
	   the nodes must be named as the parser adds them — before first paint */
	observer.observe(document.documentElement, {
		attributeFilter: watchedAttributes(),
		attributes: true,
		childList: true,
		subtree: true,
	});
	return observer;
}

function init() {
	if (isTypedAttrSupported()) return;
	apply();
	observe();
}

/* Run NOW, never on DOMContentLoaded: a cross-document view transition snapshots
   the incoming page at FIRST PAINT, which is earlier — waiting means the morph
   targets are unnamed and the transition degrades to a cross-fade (forward only;
   Back looked fine because that page came back already patched). Pages that need
   this before paint load the script in <head> with blocking="render". */
init();

export { apply, isTypedAttrSupported };

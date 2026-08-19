/**
 * <ui-map> — light-DOM map frame. Reads its points from the microdata ALREADY on the
 * page, then hands them to engine.js (Leaflet + Supercluster), which is imported only
 * when the frame scrolls into view. Nothing here touches a third-party library.
 * Docs: readme.md
 * @version 1.0.0 · @author Mads Stoumann
 */

const ENGINE = './engine.min.js';
const CLUSTER_RADIUS = { sm: 30, md: 40, lg: 60 };

/* map= is whole-token throughout, so a plain split is the entire parser */
const tokensOf = (el) => (el.getAttribute('map') || '').trim().split(/\s+/).filter(Boolean);
const argOf = (list, stem) => {
	const hit = list.find((token) => token.startsWith(`${stem}(`) && token.endsWith(')'));
	return hit ? hit.slice(stem.length + 1, -1) : null;
};

/* Number(null) and Number('') are both 0, and 0 is finite — so an ABSENT value would
   sail through as a real zero: cluster radius 0 (nothing ever clusters), lat/lon 0
   (a point in the Atlantic) and zoom 0. Reject the empties before coercing. */
const num = (value) => {
	if (value === null || value === undefined || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
};

/* Coordinates are validated as NUMBERS before they reach the map — the same discipline
   render.js mapCoords() applies before they reach a URL. */
const coord = (value, limit) => {
	const n = num(value);
	return n === null || Math.abs(n) > limit ? null : n;
};

/* One point per [itemprop="geo"] scope — the very <meta>s geoPart() emits, so the drawn
   pin and the machine-readable value cannot drift. Docs: readme.md § Where points come from */
const pointsFrom = (root) => {
	const out = [];
	for (const geo of root.querySelectorAll('[itemprop="geo"]')) {
		const lat = coord(geo.querySelector('[itemprop="latitude"]')?.getAttribute('content'), 90);
		const lon = coord(geo.querySelector('[itemprop="longitude"]')?.getAttribute('content'), 180);
		if (lat === null || lon === null) continue;
		/* the enclosing item scope — start from the PARENT, or closest() returns the geo
		   div itself, which carries itemscope of its own */
		const item = geo.parentElement?.closest('[itemscope]') || geo.parentElement;
		out.push({
			lat,
			lon,
			name: item?.querySelector('[itemprop="name"]')?.textContent.trim() || '',
			price: item?.querySelector('[itemprop="price"]')?.getAttribute('content') || '',
			url: item?.querySelector('[itemprop="url"]')?.getAttribute('href') || '',
			row: item?.closest('li') || null
		});
	}
	return out;
};

export default class UiMap extends HTMLElement {
	#engine = null;
	#observer = null;
	#resizer = null;

	connectedCallback() {
		if (this.dataset.uiMap) return;
		this.dataset.uiMap = 'pending';
		this.#observer = new IntersectionObserver((entries, obs) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			obs.disconnect();
			this.#observer = null;
			this.#upgrade();
		}, { rootMargin: '200px' });
		this.#observer.observe(this);
	}

	disconnectedCallback() {
		this.#observer?.disconnect();
		this.#resizer?.disconnect();
		this.#engine?.destroy();
		this.#engine = null;
	}

	/* the resolved point source: an explicit for=, else the card host, else the document */
	get source() {
		const id = this.getAttribute('for');
		return (id && this.ownerDocument.getElementById(id)) || this.closest('ui-card, ui-reveal') || this.ownerDocument;
	}

	get config() {
		const list = tokensOf(this);
		const cluster = argOf(list, 'cluster');
		return {
			tiles: argOf(list, 'tiles') || 'positron',
			pin: argOf(list, 'pin') || 'dot',
			controls: argOf(list, 'ctl') || 'zoom',
			cluster: list.includes('cluster') || cluster !== null,
			clusterRadius: CLUSTER_RADIUS[cluster] ?? num(cluster) ?? 40,
			fit: list.includes('fit'),
			scroll: list.includes('scroll'),
			zoom: num(argOf(list, 'zoom')),
			lat: coord(this.getAttribute('lat'), 90),
			lon: coord(this.getAttribute('lon'), 180),
			reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
		};
	}

	async #upgrade() {
		const points = pointsFrom(this.source);
		/* <ui-media> renders BEFORE <ui-content>, so on a streaming parse the list may not
		   exist yet. One retry at DOMContentLoaded — no MutationObserver, no polling. */
		if (!points.length && this.ownerDocument.readyState === 'loading') {
			this.ownerDocument.addEventListener('DOMContentLoaded', () => this.#upgrade(), { once: true });
			return;
		}
		const config = this.config;
		/* nothing to draw: keep the no-JS iframe rather than replacing it with an empty box */
		if (!points.length && config.lat === null) return;

		let engine;
		try {
			const url = globalThis.uiMapEngineUrl || new URL(ENGINE, import.meta.url).href;
			const canvas = this.ownerDocument.createElement('div');
			canvas.className = 'ui-map-canvas';
			this.append(canvas);
			engine = (await import(url)).createMap(canvas, config, points);
		} catch {
			/* the engine is an enhancement — a failed load leaves the fallback frame up */
			this.querySelector(':scope > .ui-map-canvas')?.remove();
			this.dataset.uiMap = 'failed';
			return;
		}

		this.#engine = engine;
		for (const frame of this.querySelectorAll(':scope > iframe')) frame.remove();

		/* the frame can be zero-sized at init inside content-visibility:auto or a closed
		   <details> — re-measure on the first non-zero box. Docs: readme.md § Sizing */
		this.#resizer = new ResizeObserver(() => { if (this.clientWidth) engine.resize(); });
		this.#resizer.observe(this);

		this.dataset.uiMap = 'ready';
		this.dispatchEvent(new CustomEvent('ui-map:ready', { bubbles: true, composed: true, detail: { points: points.length } }));
	}

	/* pan to the nth point — the seam a list row uses to drive the map */
	focus(index) { this.#engine?.focus(index); }
	/* re-resolve tiles(auto) after a programmatic theme= change */
	refresh() { this.#engine?.refresh(); }
}

if (!customElements.get('ui-map')) customElements.define('ui-map', UiMap);

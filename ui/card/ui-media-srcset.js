import { buildSrcset } from './srcset.js';
import { mediaStr } from './shared.js';

/**
 * <ui-media> responsive-image upgrade — optional progressive enhancement.
 *
 * Upgrades direct <img> children with a Cloudflare `srcset` + `sizes`, but only
 * on the deployed browser.style host (Cloudflare Image Resizing 404s elsewhere).
 * Locally the plain <img src> is left untouched. With no JS at all, the element
 * still works exactly as the CSS-only version — this is pure enhancement.
 *
 * Asset paths must be root-relative (e.g. /assets/images/foo.png) so they
 * resolve from disk in dev and from the deployed file (with CF transforms) in
 * production — no hardcoded domain in markup.
 *
 * This module is transitional: once the srcset is server-side rendered, stop
 * loading it. The cursor-tracked hover effects live separately in hover.js.
 */

const HOST_SUFFIX = 'browser.style';

const DEFAULTS = {
	breakpoints: [240, 320, 480, 720, 1200],
	format: 'avif',
	quality: 80,
	fit: 'cover',
	sizes: 'auto',
};

/** Decide whether to inject CDN srcset: attribute -> global -> host default. */
function cdnEnabled(el) {
	const attr = el.getAttribute('cdn');
	if (attr === 'off') return false;
	if (attr === 'on') return true;
	const g = globalThis.uiMedia;
	if (g && typeof g.cdn === 'boolean') return g.cdn;
	const h = location.hostname;
	return h === HOST_SUFFIX || h.endsWith('.' + HOST_SUFFIX);
}

export default class UiMedia extends HTMLElement {
	connectedCallback() {
		// Defer one microtask so a parser-streamed <img> child is present.
		queueMicrotask(() => this.#upgrade());
	}

	#upgrade() {
		// All direct media children get loading/preload; <img> additionally get srcset.
		const kids = [...this.children].filter(c => c.tagName === 'IMG' || c.tagName === 'VIDEO');
		if (!kids.length) return;

		const enabled = cdnEnabled(this);
		const ratio = this.#resolveRatio();
		const cfg = this.#config();

		// Loading strategy: the `load(eager|lazy)` media token — on this element or
		// its ui-card/ui-reveal host (media= inheritance stops at the card). Default
		// = lazy for every slide (safe without viewport detection); opt the hero
		// carousel in with `load(eager)`.
		// - load(eager): every slide eager (videos preload=auto), FIRST slide fetchpriority=high
		// - load(lazy):  every slide lazy  (videos preload=none)
		const loadTok = mediaStr(this).match(/load\((eager|lazy)\)/)?.[1];
		const hero = loadTok === 'eager';

		kids.forEach((el, i) => {
			const eager = loadTok === 'eager' || (hero && i === 0 && loadTok !== 'lazy');

			if (el.tagName === 'VIDEO') {
				if (!el.hasAttribute('preload')) el.setAttribute('preload', eager ? 'auto' : 'none');
				return; // no srcset/loading for <video>
			}

			// <img> — cheap, host-independent progressive-enhancement defaults.
			if (!el.hasAttribute('decoding')) el.setAttribute('decoding', 'async');
			if (!el.hasAttribute('loading')) el.setAttribute('loading', eager ? 'eager' : 'lazy');
			if (eager && i === 0 && !el.hasAttribute('fetchpriority')) el.setAttribute('fetchpriority', 'high');

			// CDN srcset only when enabled and the image is eligible.
			if (!enabled) return;
			if (el.hasAttribute('srcset')) return; // author override — respect it
			const src = el.getAttribute('src');
			if (!this.#eligible(src)) return;

			const srcset = buildSrcset(src, { ...cfg, ratio });
			if (!srcset) return;
			el.setAttribute('srcset', srcset);
			if (!el.hasAttribute('sizes')) el.setAttribute('sizes', cfg.sizes);
		});
	}

	/** Parse asr(w/h) from this element or its ui-card/ui-reveal host. */
	#resolveRatio() {
		const holder = this.matches('[media*="asr("]')
			? this
			: this.closest('ui-card[media*="asr("], ui-reveal[media*="asr("]');
		const m = holder?.getAttribute('media')?.match(/asr\((\d+)\/(\d+)\)/);
		if (!m) return null;
		const w = +m[1], h = +m[2];
		return h ? w / h : null;
	}

	#eligible(src) {
		if (!src) return false;
		if (src.startsWith('data:') || src.startsWith('blob:')) return false;
		if (/^https?:\/\//i.test(src)) return false; // external/absolute — leave alone
		return true;
	}

	/** Merge config: attribute -> globalThis.uiMedia -> built-in default. */
	#config() {
		const g = globalThis.uiMedia || {};
		const bpAttr = this.getAttribute('breakpoints');
		return {
			breakpoints: bpAttr
				? bpAttr.split(',').map(Number).filter(Boolean)
				: (g.breakpoints || DEFAULTS.breakpoints),
			format: this.getAttribute('format') || g.format || DEFAULTS.format,
			quality: +(this.getAttribute('quality') || g.quality || DEFAULTS.quality),
			fit: this.getAttribute('fit') || g.fit || DEFAULTS.fit,
			sizes: this.getAttribute('sizes') || g.sizes || DEFAULTS.sizes,
		};
	}
}

if (!customElements.get('ui-media')) {
	customElements.define('ui-media', UiMedia);
}

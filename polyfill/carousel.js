/**
 * /polyfill/carousel.js — Safari fallback for the CSS-only <ui-media> carousel.
 *
 * The native carousel (ui/card/media.carousel.css) uses ::scroll-marker dots and
 * ::scroll-button() arrows behind `@supports (scroll-marker-group: after)`.
 * Where that's unsupported, this module injects ONE <ui-carousel-controls>
 * element per top-level carousel — real <button> dots and prev/next arrows —
 * styled by /polyfill/carousel.css via the SAME --ui-media-* tokens the native
 * path uses (their setters live outside the @supports gate).
 *
 * Load it conditionally:
 *   if (!CSS.supports('scroll-marker-group: after')) import('/polyfill/carousel.js');
 *
 * Layout contract (see carousel.css): the controls element is a zero-size
 * position:sticky first child of the scroller (the core's <ui-play> pin trick),
 * and its [data-layer] is sized to the scrollport via --_w/--_h set here by a
 * shared ResizeObserver. Everything else is token-driven CSS.
 *
 * Plays with the core's JS behaviors (ui/card/index.js): loop clones carry
 * [data-clone] and never get a dot; the lead-clone offset is read live, so it
 * works whether the clones exist before or after this scan.
 */

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

// same entry points as the core NAV_SEL (top-level filtering happens in scan).
// Whole-token needles, mirroring carousel.js: a bare [media*="nav"] substring would
// also fire on any future token that merely CONTAINS "nav".
const NAV = ':is([media~="nav"], [media*="nav("])';
// scrollers: a <ui-media> (own token or via its card host) AND a <lay-out overflow>,
// which is its own scroller and carries the same media= vocabulary (see
// layout/AGENTS.md § "Carousel controls"). The native sheet has always matched
// `:where(ui-media, lay-out[overflow])`; this is the polyfill catching up.
const SEL = `ui-media${NAV}, :is(ui-card${NAV}, ui-reveal${NAV}) ui-media, lay-out[overflow]${NAV}`;
// mirrors the core slide filter (NOT_SLIDE in ui/card/shared.js) + our own injected
// element. Kept LOCAL on purpose: this polyfill imports nothing, so it can be loaded
// standalone behind a @supports gate. The copy is safe because drift is a build
// error — ui/card/tokens.lint.js parses this literal and requires it to equal
// shared.js's exactly (and the :not() list in media.carousel.css to be a subset).
const NOT_SLIDE = /^(UI-BEACON|UI-CHIP|UI-MARQUEE|UI-PLAY|UI-SAVE|UI-STICKER|UI-CAROUSEL-CONTROLS|LAY-OUT)$/;

// the effective media string — own attr, else the ui-card/ui-reveal host
// (media= inheritance stops at the card)
const mediaStr = (el) => {
	const h = el.closest('[media]');
	return h && (h === el || h.matches('ui-card, ui-reveal')) ? (h.getAttribute('media') || '') : '';
};

// which controls do the tokens ask for? → { dots, arrows }
function wanted(scroller) {
	const words = mediaStr(scroller).split(/\s+/);
	let dots = false, arrows = false;
	for (const w of words) {
		if (w === 'nav' || w === 'nav(blw)' || w === 'nav(abv)') dots = arrows = true;
		else if (w === 'nav(mrk)') dots = true;
		else if (w === 'nav(arw)') arrows = true;
		// nav(non) / nav(bar) ask for nothing
	}
	if (words.includes('mrk(non)')) dots = false;
	return { dots, arrows };
}

// whole-token test — `loop` must never match marquee(loop) (mirrors hasToken in
// ui/card/shared.js; kept local so this polyfill stays dependency-free)
const hasToken = (str, name) => new RegExp(`(^|\\s)${name}(\\(|\\s|$)`).test(str);

// real slides: direct children minus furniture, loop clones and our controls
const slidesOf = (el) => [...el.children].filter(c => !NOT_SLIDE.test(c.tagName) && !c.hasAttribute('data-clone'));

// one shared observer keeps every controls box sized to its scrollport:
// --_h = clientHeight (the [data-layer] spans the nav(blw)/nav(abv) band
// padding), --_ch = content-box height (the axis(y) sticky box + its negative
// margin — % margins resolve against inline size, so vertical needs a px var)
function measure(scroller) {
	const controls = scroller.querySelector(':scope > ui-carousel-controls');
	if (!controls) return;
	const cs = getComputedStyle(scroller);
	const ch = scroller.clientHeight - parseFloat(cs.paddingBlockStart) - parseFloat(cs.paddingBlockEnd);
	controls.style.setProperty('--_h', scroller.clientHeight + 'px');
	controls.style.setProperty('--_ch', ch + 'px');
}
const ro = new ResizeObserver((entries) => entries.forEach(({ target }) => measure(target)));

function button(kind, label) {
	const b = document.createElement('button');
	b.type = 'button';
	b.setAttribute(kind === 'dot' ? 'data-dot' : 'data-nav', kind === 'dot' ? '' : kind);
	b.setAttribute('aria-label', label);
	return b;
}

function init(scroller) {
	const { dots, arrows } = wanted(scroller);
	if (!dots && !arrows) return;

	const m = mediaStr(scroller);
	const axisY = m.includes('axis(y)');
	const loop = hasToken(m, 'loop');
	const rtl = !axisY && getComputedStyle(scroller).direction === 'rtl';
	const slides = slidesOf(scroller);
	const count = slides.length;
	if (count < 2) return;
	scroller.dataset.uiCarouselPolyfill = '1';

	const controls = document.createElement('ui-carousel-controls');
	const layer = document.createElement('div');
	layer.setAttribute('data-layer', '');
	controls.append(layer);

	let prev, next, dotEls = [];
	if (arrows) {
		prev = button('prev', 'Previous');
		next = button('next', 'Next');
		layer.append(prev, next);
	}
	if (dots) {
		const group = document.createElement('div');
		group.setAttribute('data-dots', '');
		group.setAttribute('role', 'group');
		group.setAttribute('aria-label', 'Slides');
		dotEls = slides.map((slide, i) => {
			const dot = button('dot', `Go to slide ${i + 1}`);
			// mrk(tmb): each slide carries its thumbnail vars inline — copy to its dot
			for (const prop of ['--ui-carousel-thumb-url', '--ui-carousel-thumb-ratio']) {
				const v = slide.style.getPropertyValue(prop);
				if (v) dot.style.setProperty(prop, v);
			}
			dot.addEventListener('click', () => scrollToPos(i + lead()));
			return dot;
		});
		group.append(...dotEls);
		layer.append(group);
	}

	// live lead offset: the loop behavior in ui/card/index.js prepends a
	// [data-clone] — whether that ran before or after this init
	const lead = () => scroller.querySelector(':scope > [data-clone]') ? 1 : 0;
	const size = () => axisY ? scroller.clientHeight : scroller.clientWidth;
	const rawPos = () => axisY ? scroller.scrollTop : Math.abs(scroller.scrollLeft);
	const pos = () => { const s = size(); return s ? Math.round(rawPos() / s) : 0; };
	const scrollToPos = (p) => {
		const target = p * size() * (rtl ? -1 : 1);
		scroller.scrollTo({ [axisY ? 'top' : 'left']: target, behavior: reduce.matches ? 'instant' : 'smooth' });
	};

	prev?.addEventListener('click', () => scrollToPos(pos() - 1));
	next?.addEventListener('click', () => scrollToPos(pos() + 1));

	const maxScroll = () => (axisY ? scroller.scrollHeight - scroller.clientHeight : scroller.scrollWidth - scroller.clientWidth);
	function sync() {
		let i = pos() - lead();
		if (loop) i = (i + count) % count;                    // clone positions → real twins
		i = Math.max(0, Math.min(count - 1, i));
		dotEls.forEach((d, n) => n === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
		if (arrows && !loop) {
			prev.disabled = rawPos() <= 1;
			next.disabled = rawPos() >= maxScroll() - 1;
		}
	}

	let raf = 0;
	scroller.addEventListener('scroll', () => {
		if (raf) return;
		raf = requestAnimationFrame(() => { raf = 0; sync(); });
	}, { passive: true });

	scroller.prepend(controls);
	measure(scroller);   // synchronous first sizing — no unsized first paint
	ro.observe(scroller);
	sync();
}

let retries = 0;
const idle = globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1));

export function scan() {
	const deferred = [];
	for (const scroller of document.querySelectorAll(SEL)) {
		if (scroller.dataset.uiCarouselPolyfill) continue;               // idempotent
		if (scroller.parentElement?.closest('ui-media')) continue;      // nested frame — native disables controls there too
		// loop carousels get [data-clone] slides from the core's idle scan; wait
		// for them (bounded) so the controls end up as FIRST child (sticky pins
		// cleanly at the scroll start) and clones are excluded from the dot count
		const needsClones = hasToken(mediaStr(scroller), 'loop') && !scroller.querySelector(':scope > [data-clone]');
		if (needsClones && retries < 5) { deferred.push(scroller); continue; }
		init(scroller);
	}
	if (deferred.length && retries++ < 5) idle(scan);
}

// If the native features ARE supported (force-loaded via ?polyfill, or a future
// browser ships them while this stays wired), neutralize the native pseudos so
// the page never shows two sets of controls.
if (CSS.supports('scroll-marker-group: after')) {
	const kill = document.createElement('style');
	kill.textContent = 'ui-media { scroll-marker-group: none !important; } ui-media::scroll-button(*) { display: none !important; }';
	document.head.append(kill);
}

// self-contained: bring the companion stylesheet along (single conditional gate)
const cssHref = new URL('./carousel.css', import.meta.url).href;
if (!document.querySelector(`link[href="${cssHref}"]`)) {
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = cssHref;
	document.head.append(link);
}

idle(scan);
globalThis.uiMediaPolyfill = Object.assign(globalThis.uiMediaPolyfill || {}, { scan });

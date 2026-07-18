/* Carousel enhancements — seamless loop (clones), autoplay, pause-on-slide-leave, and
 * per-slide <ui-play> video controls. The base carousel (scroll-snap, dots, arrows) is
 * pure CSS; with JS off everything still scrolls and snaps. */

import { reduce, onIdle, mediaStr, navWords, slidesOf, isDecoration, reflectPlay, initVideoPlay, videoPlayNodes } from './shared.js';

const axisYOf = (scroller) =>
	mediaStr(scroller).includes('axis(y)') || navWords(scroller).includes('y');

// Shared scroll geometry, snap-alignment agnostic: each slide's target scroll comes from
// its own box + computed scroll-snap-align, so full-width start-snapped frames and
// center-snapped <lay-out overflow> carousels both work. pos() = index of the slide
// (clones included) nearest its snap position.
function geom(scroller, axisY) {
	const size = () => axisY ? scroller.clientHeight : scroller.clientWidth;
	const edge = () => axisY ? scroller.scrollTop : scroller.scrollLeft;
	const list = () => slidesOf(scroller);
	const sample = list().find(el => !el.hasAttribute('data-clone')) || list()[0];
	const align = sample ? getComputedStyle(sample).scrollSnapAlign.split(' ').pop() : 'start';
	const offsetFor = (el) => {
		const s = scroller.getBoundingClientRect(), e = el.getBoundingClientRect();
		const start = edge() + (axisY ? e.top - s.top : e.left - s.left);
		const dim = axisY ? e.height : e.width;
		if (align === 'center') return start + dim / 2 - size() / 2;
		if (align === 'end') return start + dim - size();
		return start;
	};
	const pos = () => {
		const items = list(), cur = edge();
		let best = 0, bestD = Infinity;
		items.forEach((el, i) => { const d = Math.abs(offsetFor(el) - cur); if (d < bestD) { bestD = d; best = i; } });
		return best;
	};
	const scrollToPos = (p, behavior = 'smooth') => {
		const items = list();
		const el = items[Math.max(0, Math.min(items.length - 1, p))];
		if (el) scroller.scrollTo({ [axisY ? 'top' : 'left']: offsetFor(el), behavior: reduce.matches ? 'instant' : behavior });
	};
	return { size, pos, scrollToPos };
}

// Seamless loop: prepend/append N clones, hop to the real twin on scrollend once a clone
// snaps. N is sized so a boundary clone's peek is always filled (center-snapped carousels
// peek into neighbours → N > 1). Run before initAuto so clones exist when autoplay ticks.
export function initLoop(scroller) {
	const slides = slidesOf(scroller);
	const count = slides.length;
	if (count < 2) return;

	const axisY = axisYOf(scroller);
	const { pos, scrollToPos } = geom(scroller, axisY);

	const rect = (el) => el.getBoundingClientRect();
	const view = axisY ? scroller.clientHeight : scroller.clientWidth;
	const dim = axisY ? rect(slides[0]).height : rect(slides[0]).width;
	const step = count > 1
		? Math.abs(axisY ? rect(slides[1]).top - rect(slides[0]).top : rect(slides[1]).left - rect(slides[0]).left)
		: dim;
	const peek = Math.max(0, (view - dim) / 2);
	const N = Math.min(count, 1 + Math.ceil(peek / (step || dim)));

	const clone = (s) => { const c = s.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); c.inert = true; return c; };
	const lead = slides.slice(count - N).map(clone);
	const trail = slides.slice(0, N).map(clone);
	const firstChild = scroller.firstChild;
	for (const c of lead) scroller.insertBefore(c, firstChild);
	for (const c of trail) scroller.append(c);

	// index map: leading clones 0…N-1 · reals N…N+count-1 · trailing clones after that
	scroller.addEventListener('scrollend', () => {
		const p = pos();
		if (p < N) scrollToPos(p + count, 'instant');
		else if (p >= N + count) scrollToPos(p - count, 'instant');
	}, { passive: true });

	scrollToPos(N, 'instant');
}

// Autoplay: advance one position every N ms. Duration from media="auto(4s|800ms|3)",
// a bare auto/auto="…" attribute (lay-out overflow), or nav="auto" (5s default).
// A <ui-play> control, when present, is the sole pause mechanism.
export function initAuto(scroller) {
	const slides = slidesOf(scroller);
	if (slides.length < 2) return;

	const m = mediaStr(scroller), nav = navWords(scroller);
	const { pos, scrollToPos } = geom(scroller, axisYOf(scroller));

	const toMs = (num, unit) => unit === 'ms' ? +num : +num * 1000;
	const am = m.match(/auto(?:\((\d+(?:\.\d+)?)(m?s)?\))?/);
	const autoAttr = scroller.getAttribute('auto');
	let autoMs = 0;
	if (am) autoMs = am[1] ? toMs(am[1], am[2]) : 5000;
	else if (autoAttr !== null) { const a = autoAttr.match(/^\s*(\d+(?:\.\d+)?)\s*(m?s)?\s*$/); autoMs = a ? toMs(a[1], a[2]) : 5000; }
	else if (nav.includes('auto')) autoMs = 5000;
	if (!autoMs || reduce.matches) return;

	let timer = 0, paused = false;
	const tick = () => { if (!paused) scrollToPos(pos() + 1, 'smooth'); };
	const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
	const start = () => { stop(); timer = setInterval(tick, autoMs); };

	const play = scroller.querySelector(':scope > ui-play');
	if (play) {
		// end-corner controls (play(*e)) must be the last child so sticky-inline-end pins
		if (/play\([a-z]e\)/.test(m)) scroller.appendChild(play);
		const setPlaying = (running) => {
			paused = !running;
			scroller.style.setProperty('--ui-carousel-play-state', running ? 'running' : 'paused');
			reflectPlay(play, running);
			running ? start() : stop();
		};
		play.querySelector('button')?.addEventListener('click', () => setPlaying(paused));
		setPlaying(true);
	} else {
		scroller.addEventListener('pointerenter', () => { paused = true; }, { passive: true });
		scroller.addEventListener('pointerleave', () => { paused = false; }, { passive: true });
		scroller.addEventListener('pointerdown', () => { paused = true; }, { passive: true });
		scroller.addEventListener('focusin', () => { paused = true; });
		scroller.addEventListener('focusout', () => { paused = false; });
	}
	document.addEventListener('visibilitychange', () => document.hidden ? stop() : (!paused && start()));

	scroller.style.setProperty('--ui-carousel-autoplay', (autoMs / 1000) + 's');
	scroller.style.setProperty('--ui-carousel-thumb-timer-name', 'ui-carousel-thumb-timer');
	start();
}

// Dispatch: loop first (adds clones), then auto (ticks into them). Idempotent.
export function initCarousels(nodes) {
	for (const el of nodes) {
		if (el.dataset.uiCarousel) continue;
		el.dataset.uiCarousel = '1';
		const m = mediaStr(el), nav = navWords(el);
		if (m.includes('loop') || nav.includes('loop') || el.hasAttribute('loop')) initLoop(el);
		if (m.includes('auto') || nav.includes('auto') || el.hasAttribute('auto')) initAuto(el);
	}
}

// Pause a slide's (non-decoration) video once it drops below half-visible in the scroller.
export function initCarouselVideoPause(scrollers) {
	for (const scroller of scrollers) {
		if (scroller.dataset.uiVpause) continue;
		if (scroller.parentElement?.closest('ui-media')) continue;
		if (!scroller.querySelector('video')) continue;
		scroller.dataset.uiVpause = '1';

		const io = new IntersectionObserver((entries) => {
			for (const e of entries) {
				if (e.intersectionRatio >= 0.5) continue;
				const vids = e.target.tagName === 'VIDEO' ? [e.target] : e.target.querySelectorAll('video');
				for (const v of vids) if (!isDecoration(v)) v.pause();
			}
		}, { root: scroller, threshold: [0, 0.5, 1] });

		for (const slide of slidesOf(scroller)) io.observe(slide);
	}
}

// JS-feature carousels via the inheritable media= token OR the self-only nav= attribute
export const CAROUSEL_SEL = [
	'ui-media[media*="auto"]', '[media*="auto"] ui-media',
	'ui-media[media*="loop"]', '[media*="loop"] ui-media',
	'ui-media[nav~="auto"]', 'ui-media[nav~="loop"]',
	'lay-out[overflow][loop]', 'lay-out[overflow][auto]',
].join(', ');
// every scroll carousel — video-pause filters to those containing a <video>
const NAV_SEL = [
	'ui-media[media*="nav"]', '[media*="nav"] ui-media',
	'ui-media[nav]', CAROUSEL_SEL,
].join(', ');

export function scanCarousels() {
	initCarousels(document.querySelectorAll(CAROUSEL_SEL));
	initCarouselVideoPause(document.querySelectorAll(NAV_SEL));
	initVideoPlay(videoPlayNodes());
}

onIdle(scanCarousels);

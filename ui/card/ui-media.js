/**
 * <ui-media> cursor-tracked hover — hov(track) / hov(drift).
 *
 * The only two of the nine hov() effects that need JS: they set
 * --ui-media-mx / --ui-media-my (-1..1) on the frame, which the CSS reads to
 * translate the image toward (track) or away from (drift) the cursor.
 *
 * Implemented as ONE idle set of delegated listeners — it never iterates or
 * mounts <ui-media>. Nothing runs until a pointer actually enters a
 * hov(track)/hov(drift) frame, and tracking applies ONLY while the pointer is
 * over the <ui-media> itself (not the surrounding <ui-content> in a card).
 * Pure progressive enhancement: with no JS the CSS-only frame still renders.
 *
 * The hov() token may sit on the <ui-media> (standalone) or on a host
 * <ui-card>/<ui-reveal> (it inherits). Either way the props are set on the
 * <ui-media> frame, so they inherit to its <img>.
 */

const SEL = '[media*="hov(track)"], [media*="hov(drift)"]';
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

let media = null;  // the active <ui-media> frame (only while the pointer is over it)
let rect = null;   // cached frame rect for the active hover session
let raf = 0;

function clear() {
	if (!media) return;
	media.style.removeProperty('--ui-media-mx');
	media.style.removeProperty('--ui-media-my');
	media = rect = null;
}

// Activate only when the pointer is over a <ui-media> whose own or host token
// is track/drift. Entering anything else (e.g. <ui-content>) deactivates.
addEventListener('pointerover', (e) => {
	const m = e.target.closest?.('ui-media');
	if (m === media) return;                 // unchanged (still inside the same frame)
	if (m && m.closest(SEL)) { media = m; rect = null; }
	else clear();
}, { passive: true });

addEventListener('pointermove', (e) => {
	if (!media || raf || reduce.matches) return; // instant exit when idle / reduced-motion
	raf = requestAnimationFrame(() => {
		raf = 0;
		rect ??= media.getBoundingClientRect();
		const mx = Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width * 2 - 1));
		const my = Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height * 2 - 1));
		media.style.setProperty('--ui-media-mx', mx.toFixed(3));
		media.style.setProperty('--ui-media-my', my.toFixed(3));
	});
}, { passive: true });

// Backstop: clear when the pointer leaves the document entirely.
addEventListener('pointerout', (e) => {
	if (media && !e.relatedTarget) clear();
}, { passive: true });


/* ============================================================
 * Carousel behaviors — autoplay · loop (seamless).
 *
 * Token-gated: ONE querySelectorAll at idle picks ONLY the carousels that opted
 * into a JS feature (`auto`, `loop`). Plain <ui-media> and CSS-only carousels never
 * match → never touched. No IntersectionObserver / MutationObserver — the selector
 * itself is the early exit. (A page of hundreds of <ui-media> costs one
 * querySelectorAll.) Re-run after dynamic insertion via window.uiMedia.scan().
 *
 * The base carousel (scroll-snap, dots, arrows) stays 100% CSS — this only adds
 * the things CSS can't do. The `nav` token is still required to make the scroller;
 * these tokens layer behavior on top.
 * ============================================================ */

const CAROUSEL_TOKENS = ['auto', 'loop'];
const CAROUSEL_SEL = CAROUSEL_TOKENS
	.flatMap(t => [`ui-media[media*="${t}"]`, `[media*="${t}"] ui-media`])
	.join(', ');

// the effective media string (own attr, else nearest ancestor that has one)
const mediaStr = (el) => el.closest('[media]')?.getAttribute('media') || '';
// snap children = the slides (single img/video, or a multi-item <ui-slide> group)
const slidesOf = (el) => [...el.children].filter(c => /^(IMG|VIDEO|UI-SLIDE)$/.test(c.tagName));

function initCarousel(scroller) {
	const m = mediaStr(scroller);
	const slides = slidesOf(scroller);
	const count = slides.length;
	if (count < 2) return;

	const axisY = m.includes('axis(y)');
	const loop = m.includes('loop');
	// auto · auto(4s) · auto(800ms) · auto(3) (bare number = seconds)
	const am = m.match(/auto(?:\((\d+(?:\.\d+)?)(m?s)?\))?/);
	const autoMs = am ? (am[1] ? (am[2] === 'ms' ? +am[1] : +am[1] * 1000) : 5000) : 0;
	const reduce = matchMedia('(prefers-reduced-motion: reduce)');

	let timer = 0, paused = false;

	// loop — SEAMLESS via clones. Prepend a clone of the LAST slide and append a clone
	// of the FIRST, so the scroll range extends one slide past each end. Native arrows /
	// snap then smooth-scroll INTO a clone; on scrollend we instantly hop to the real
	// twin (identical image, adjacent position → invisible). No click interception, no
	// disabled arrows. Clones carry [data-clone] so CSS suppresses their dots.
	const lead = loop ? 1 : 0;
	if (loop) {
		const head = slides[0].cloneNode(true);
		const tail = slides[count - 1].cloneNode(true);
		head.setAttribute('data-clone', '');
		tail.setAttribute('data-clone', '');
		scroller.prepend(tail);   // leading clone shows the LAST slide
		scroller.append(head);    // trailing clone shows the FIRST slide
	}

	const size = () => axisY ? scroller.clientHeight : scroller.clientWidth;
	const pos = () => { const s = size(); return s ? Math.round((axisY ? scroller.scrollTop : scroller.scrollLeft) / s) : 0; };
	const scrollToPos = (p, behavior = 'smooth') => scroller.scrollTo({ [axisY ? 'top' : 'left']: p * size(), behavior: reduce.matches ? 'instant' : behavior });

	// after a scroll settles on a clone, hop to the real twin (instant, invisible)
	if (loop) {
		scroller.addEventListener('scrollend', () => {
			const p = pos();
			if (p <= 0) scrollToPos(count, 'instant');             // leading clone (=last)  → real last
			else if (p >= count + 1) scrollToPos(1, 'instant');    // trailing clone (=first) → real first
		}, { passive: true });
		scrollToPos(lead, 'instant');   // start on the first real slide (past the leading clone)
	}

	if (autoMs && !reduce.matches) {
		// advance one position; with clones this rolls into the trailing clone at the end,
		// and sync() seamlessly hops back to the real first.
		const tick = () => { if (!paused) scrollToPos(pos() + 1, 'smooth'); };
		const start = () => { stop(); timer = setInterval(tick, autoMs); };
		const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
		scroller.addEventListener('pointerenter', () => { paused = true; }, { passive: true });
		scroller.addEventListener('pointerleave', () => { paused = false; }, { passive: true });
		scroller.addEventListener('pointerdown', () => { paused = true; }, { passive: true });
		scroller.addEventListener('focusin', () => { paused = true; });
		scroller.addEventListener('focusout', () => { paused = false; });
		document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
		scroller.style.setProperty('--ui-media-autoplay', (autoMs / 1000) + 's'); // sync the dot(pill) CSS timer
		start();
	}
}

export function scanCarousels() {
	for (const el of document.querySelectorAll(CAROUSEL_SEL)) {
		if (el.dataset.uiCarousel) continue;   // idempotent
		el.dataset.uiCarousel = '1';
		initCarousel(el);
	}
}

(globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1)))(scanCarousels);
globalThis.uiMedia = Object.assign(globalThis.uiMedia || {}, { scan: scanCarousels });

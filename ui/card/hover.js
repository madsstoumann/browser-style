/* Cursor-tracked hover — hov(track) / hov(drift) / hov(tilt). Sets --ui-media-mx / --ui-media-my
 * (-1..1) on the <ui-media> frame; the CSS does the rest. Standalone, no imports. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

export function initHover(nodes) {
	if (!nodes || !nodes.length) return;

	// Listen on the element that CARRIES the token (the frame itself, or the host
	// ui-card/ui-reveal), not on the <ui-media> alone: in an ovr() card the overlay
	// <ui-content> is painted on top of the frame but is NOT inside it, so pointer
	// events over the overlay never reach the frame and the effect stays dead.
	// Coordinates are still normalised against the FRAME's box — that's the geometry
	// the CSS animates against.
	// Write the vars onto the FRAME'S MEDIA CHILDREN, not the frame: they are the only
	// consumers, and an inherited custom property on the frame invalidates every piece of
	// overlaid furniture (chip/sticker/beacon/play, the scrim pseudo) on every rAF too.
	const SUBJ = ':scope > :is(iframe, img, picture, video)';
	const hosts = new Map();
	for (const el of nodes) {
		const frames = el.matches('ui-media') ? [el] : [...el.querySelectorAll('ui-media')];
		if (frames.length) hosts.set(el, frames);
	}

	let raf = 0;
	for (const [host, frames] of hosts) {
		if (host.dataset.uiHover) continue;
		host.dataset.uiHover = '1';
		let rects = null;
		const subjects = frames.map((f) => [...f.querySelectorAll(SUBJ)]);
		const measure = () => frames.map((f) => f.getBoundingClientRect());

		host.addEventListener('pointerenter', () => { rects = measure(); }, { passive: true });

		host.addEventListener('pointermove', (e) => {
			if (raf || reduce.matches) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				rects ??= measure();
				frames.forEach((frame, i) => {
					const rect = rects[i];
					if (!rect?.width || !rect.height) return;
					const mx = Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width * 2 - 1));
					const my = Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height * 2 - 1));
					for (const subject of subjects[i]) {
						subject.style.setProperty('--ui-media-mx', mx.toFixed(3));
						subject.style.setProperty('--ui-media-my', my.toFixed(3));
					}
				});
			});
		}, { passive: true });

		host.addEventListener('pointerleave', () => {
			for (const list of subjects) for (const subject of list) {
				subject.style.removeProperty('--ui-media-mx');
				subject.style.removeProperty('--ui-media-my');
			}
			rects = null;
		}, { passive: true });
	}
}

const HOVER_SEL = '[media*="hov(track)"], [media*="hov(drift)"], [media*="hov(tilt)"]';

export function scanHover() {
	initHover(document.querySelectorAll(HOVER_SEL));
}

// index.js owns idle scanning when it's loaded; this only covers a solo import
(globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1)))(() => {
	if (!globalThis.uiMedia?.scan) scanHover();
});

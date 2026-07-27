/* Cursor-tracked hover — hov(track) / hov(drift) / hov(tilt). Sets --ui-media-mx / --ui-media-my
 * (-1..1) on the <ui-media> frame; the CSS does the rest. Standalone, no imports. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

export function initHover(nodes) {
	if (!nodes || !nodes.length) return;

	// resolve matched nodes (frame or host card) to their <ui-media> frames, deduped
	const frames = new Set();
	for (const el of nodes) {
		if (el.matches('ui-media')) frames.add(el);
		else for (const m of el.querySelectorAll('ui-media')) frames.add(m);
	}

	let raf = 0;
	for (const media of frames) {
		if (media.dataset.uiHover) continue;
		media.dataset.uiHover = '1';
		let rect = null;

		media.addEventListener('pointerenter', () => { rect = media.getBoundingClientRect(); }, { passive: true });

		media.addEventListener('pointermove', (e) => {
			if (raf || reduce.matches) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				rect ??= media.getBoundingClientRect();
				const mx = Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width * 2 - 1));
				const my = Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height * 2 - 1));
				media.style.setProperty('--ui-media-mx', mx.toFixed(3));
				media.style.setProperty('--ui-media-my', my.toFixed(3));
			});
		}, { passive: true });

		media.addEventListener('pointerleave', () => {
			media.style.removeProperty('--ui-media-mx');
			media.style.removeProperty('--ui-media-my');
			rect = null;
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

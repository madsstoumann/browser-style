/**
 * <ui-media> cursor-tracked hover — hov(track) / hov(drift).
 *
 * The only two of the nine hov() effects that need JS: they set
 * --ui-media-mx / --ui-media-my (-1..1) on the frame, which the CSS reads to
 * translate the image toward (track) or away from (drift) the cursor.
 *
 * Implemented as ONE idle set of delegated listeners — it never iterates or
 * mounts <ui-media>. Nothing runs until a pointer actually enters a
 * hov(track)/hov(drift) frame. Pure progressive enhancement: with no JS the
 * CSS-only frame still renders (just without the cursor follow).
 *
 * hov() can sit on a <ui-card>/<ui-reveal> (inherits to the nested <ui-media>)
 * or on a standalone <ui-media> — the props are set on whichever element
 * carries the token, so they inherit down to the <img> in every case.
 */

const SEL = '[media*="hov(track)"], [media*="hov(drift)"]';
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

let host = null;   // element carrying hov(track|drift) (card/reveal/standalone)
let media = null;  // the <ui-media> frame we measure against
let rect = null;   // cached frame rect for the active hover session
let raf = 0;

const frame = (h) => (h.matches('ui-media') ? h : h.querySelector('ui-media') || h);

// closest() runs only on pointerover (rare), not on every move.
addEventListener('pointerover', (e) => {
	const h = e.target.closest?.(SEL);
	if (!h || h === host) return;
	host = h;
	media = frame(h);
	rect = null;
}, { passive: true });

addEventListener('pointermove', (e) => {
	if (!host || raf || reduce.matches) return; // instant exit when idle / reduced-motion
	raf = requestAnimationFrame(() => {
		raf = 0;
		rect ??= media.getBoundingClientRect();
		const mx = Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width * 2 - 1));
		const my = Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height * 2 - 1));
		host.style.setProperty('--ui-media-mx', mx.toFixed(3));
		host.style.setProperty('--ui-media-my', my.toFixed(3));
	});
}, { passive: true });

addEventListener('pointerout', (e) => {
	// reset only when the pointer truly leaves the host (not moving between its children)
	if (host && !host.contains(e.relatedTarget)) {
		host.style.removeProperty('--ui-media-mx');
		host.style.removeProperty('--ui-media-my');
		host = media = rect = null;
	}
}, { passive: true });

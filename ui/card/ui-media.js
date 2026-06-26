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

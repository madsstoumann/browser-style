/**
 * ui-lightbox command controller (OPT-IN — the baseline open/close needs no JS)
 *
 * A `<ui-media popover>` frame opens into the top layer from a plain invoker
 * <button command="toggle-popover" commandfor="<frame id>"> — that path is pure
 * platform. This module adds the three runtime niceties on top:
 *
 *   1. `--lightbox-layout` — custom command that flips the OPEN frame's
 *      presentation between fullscreen carousel and grid by toggling
 *      `data-lightbox="grid|nav"` on the frame (CSS in ui/card/media.lightbox.css
 *      keys off it; the attribute is cleared on close so the frame always
 *      reopens on its `open:` tokens).
 *   2. [open] reflection — mirrors the frame's ToggleEvent onto child
 *      <ui-lightbox> hosts (drives ui-icon's own [open] grid→× morph and gives
 *      authors a styling hook) and keeps aria-expanded on the invoker buttons.
 *   3. Invoker fallback — browsers with Popover but without `command=` support
 *      get a delegated click handler calling togglePopover().
 *   4. DOM carousel controls — the native ::scroll-marker/::scroll-button
 *      pseudos do NOT follow a popover frame into the top layer (Chromium keeps
 *      them in the document layer, behind ::backdrop), so every ui-media[popover]
 *      carousel gets real-element controls via /polyfill/carousel-controls.js —
 *      in EVERY browser, both states, for continuity. media.lightbox.css
 *      suppresses the native pseudos on those [data-ui-carousel-polyfill]
 *      frames only.
 *
 * ToggleEvent and CommandEvent don't bubble → both listeners are CAPTURE phase.
 * Import for the side effect (auto-inits once), or call initLightboxCommands().
 * @version 1.1.0
 */

import { createCommandRouter } from '../common/command.js';

const COMMANDS = new Set(['--lightbox-layout']);

/* media= scoping mirror (shared.js#mediaStr): the frame reads media= from
   itself or its nearest ui-card/ui-reveal host only */
function mediaStr(el) {
	const h = el.closest('[media]');
	return h && (h === el || h.matches('ui-card, ui-reveal')) ? (h.getAttribute('media') || '') : '';
}

function toggleLayout(frame) {
	const current = frame.dataset.lightbox
		|| (/(^|\s)open:grid\(/.test(mediaStr(frame)) ? 'grid' : 'nav');
	frame.dataset.lightbox = current === 'grid' ? 'nav' : 'grid';
}

const bind = createCommandRouter(COMMANDS, ({ target }) => {
	if (target?.matches?.('ui-media[popover]')) toggleLayout(target);
});

function onToggle(event) {
	const frame = event.target;
	if (!(frame instanceof Element) || !frame.matches('ui-media[popover]')) return;
	const open = event.newState === 'open';
	for (const box of frame.querySelectorAll(':scope ui-lightbox')) box.toggleAttribute('open', open);
	if (!open) delete frame.dataset.lightbox;
	if (frame.id) {
		for (const btn of document.querySelectorAll(`button[commandfor="${CSS.escape(frame.id)}"], button[popovertarget="${CSS.escape(frame.id)}"]`)) {
			btn.setAttribute('aria-expanded', String(open));
		}
	}
}

/* Click delegate, two duties on `command="toggle-popover"` invokers that target
   a ui-media[popover] frame (other popovers are never hijacked):
   1. View Transition morph — where supported (and motion is ok) the open/close
      is wrapped in document.startViewTransition() with a viewTransitionName on
      the frame, so the card morphs into the fullscreen lightbox and back. The
      native invocation is cancelled (preventDefault stops button activation)
      because the toggle must happen INSIDE the VT callback. The CSS entry
      keyframe is suppressed via [data-lightbox-vt] (media.lightbox.css) so the
      two never double-animate. Esc/light-dismiss closes skip the morph and get
      the CSS backdrop fade instead.
   2. Fallback — browsers without native `command=` invokers get togglePopover(). */
const vtOK = () => typeof document.startViewTransition === 'function'
	&& !matchMedia('(prefers-reduced-motion: reduce)').matches;

function onClick(event) {
	const btn = event.target?.closest?.('button[command="toggle-popover"][commandfor]');
	if (!btn) return;
	const frame = document.getElementById(btn.getAttribute('commandfor'));
	if (!frame?.matches?.('ui-media[popover]')) return;
	if (vtOK()) {
		event.preventDefault();
		frame.dataset.lightboxVt = '1';
		frame.style.viewTransitionName = 'ui-lightbox';
		const vt = document.startViewTransition(() => frame.togglePopover());
		vt.finished.finally(() => { frame.style.viewTransitionName = ''; });
	} else if (!('command' in HTMLButtonElement.prototype)) {
		frame.togglePopover?.();
	}
}

/* DOM carousel controls for popover frames (nicety 4). Lazy-imported so pages
   without a lightbox never fetch the core; idempotent via the core's
   [data-ui-carousel-polyfill] guard, so co-loading /polyfill/carousel.js (the
   Safari entry) never doubles controls. Mirrors the entry's bounded clone-wait:
   a `loop` frame gets [data-clone] slides prepended by ui/card/carousel.js, and
   the controls must be injected AFTER them to end up first child (the sticky
   pin sits at the scroll start). */
const idle = globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1));
function enhanceControls(root = document) {
	const frames = [...root.querySelectorAll('ui-media[popover]')]
		.filter((frame) => !frame.dataset.uiCarouselPolyfill);
	if (!frames.length) return;
	import('../../polyfill/carousel-controls.js').then(({ initControls, mediaStr, hasToken }) => {
		let retries = 0;
		const run = () => {
			const deferred = [];
			for (const frame of frames) {
				if (frame.dataset.uiCarouselPolyfill) continue;
				const needsClones = hasToken(mediaStr(frame), 'loop') && !frame.querySelector(':scope > [data-clone]');
				if (needsClones && retries < 5) { deferred.push(frame); continue; }
				initControls(frame);
			}
			if (deferred.length && retries++ < 5) idle(run);
		};
		run();
	}).catch(() => {});   // controls are an enhancement — a missing polyfill path never breaks open/close
}

let inited = false;

export function initLightboxCommands(root = document) {
	if (root === document) {
		if (inited) return;
		inited = true;
	}
	const unbindCommand = bind(root);
	root.addEventListener('toggle', onToggle, true);   // capture: ToggleEvent doesn't bubble
	root.addEventListener('click', onClick);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => enhanceControls(root), { once: true });
	} else {
		enhanceControls(root);
	}
	return () => {
		unbindCommand();
		root.removeEventListener('toggle', onToggle, true);
		root.removeEventListener('click', onClick);
	};
}

// Auto-init for the common case (importing the module wires the page).
initLightboxCommands();

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
 *   5. media-open= — swap the carousel into ANY existing nav style while open
 *      (e.g. dots closed → the axis(y) mrk(tmb) mrk(rail) thumbnail rail
 *      fullscreen); control words of the resolved media string are replaced on
 *      open and restored on close, with slide continuity across the swap.
 *   6. Modality — inert the rest of the page while open (Tab/AT stay inside).
 *   7. Back-button close — one history entry per open; Back closes, other
 *      closes consume the entry.
 *   8. Grid tile → slide jump, and media pause on close.
 *
 * ToggleEvent and CommandEvent don't bubble → both listeners are CAPTURE phase.
 * Import for the side effect (auto-inits once), or call initLightboxCommands().
 * @version 1.2.0
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

/* ── media-open= — swap into ANY existing nav style while open ──
   The control stems (nav/mrk/arw/tmb/axis) are substring-matched, so their
   spellings can never ride inside media= behind an open: prefix (they would arm
   the CLOSED carousel). Instead the open-state control vocabulary lives in a
   companion attribute — media-open="axis(y) nav(mrk) mrk(tmb) mrk(rail)" — on
   the same element media= sits on, and this module swaps ONLY the control
   words of the resolved media string on toggle (everything else — asr(),
   furniture, open: tokens, loop/auto bindings — is untouched), restoring on
   close. Every existing CSS rule (band reservation, rail padding, axis flip,
   the polyfill control styles keyed off the re-stamped data-media) applies
   unchanged. Without this module the open lightbox simply keeps the closed
   nav style — fully functional. */
const CONTROL_WORD = /^(nav|mrk|arw|tmb|axis)(\(|$)/;
const swapStore = new WeakMap();      // frame → { holder, media, dataMedia }
const pendingIndex = new WeakMap();   // frame → slide index captured pre-toggle

function mediaHolder(frame) {
	const h = frame.closest('[media]');
	return h && (h === frame || h.matches('ui-card, ui-reveal')) ? h : null;
}
function mediaOpenStr(frame) {
	const h = frame.closest('[media-open]');
	return h && (h === frame || h.matches('ui-card, ui-reveal')) ? (h.getAttribute('media-open') || '') : '';
}
export function swapControlWords(base, openTokens) {
	return String(base || '').split(/\s+/).filter((w) => w && !CONTROL_WORD.test(w))
		.concat(String(openTokens || '').split(/\s+/).filter(Boolean)).join(' ');
}
/* a <ui-media> slide is always one scrollport, so the pitch is the client size */
function slideIndexOf(frame) {
	const axisY = /(^|\s)axis\(y\)/.test(mediaStr(frame));
	const size = axisY ? frame.clientHeight : frame.clientWidth;
	const pos = axisY ? frame.scrollTop : Math.abs(frame.scrollLeft);
	return size ? Math.round(pos / size) : 0;
}
function scrollToIndex(frame, index) {
	if (frame.dataset.lightbox === 'grid') return;   // grid has no slide pitch
	const axisY = /(^|\s)axis\(y\)/.test(mediaStr(frame));
	const size = axisY ? frame.clientHeight : frame.clientWidth;
	frame.scrollTo({ [axisY ? 'top' : 'left']: index * size, behavior: 'instant' });
}
function applyMediaOpen(frame, open) {
	const controls = frame.querySelector(':scope > ui-carousel-controls');
	if (open) {
		const openTokens = mediaOpenStr(frame);
		const holder = mediaHolder(frame);
		if (!openTokens || !holder) return;
		const original = holder.getAttribute('media') || '';
		swapStore.set(frame, { holder, media: original, dataMedia: controls?.getAttribute('data-media') ?? null });
		holder.setAttribute('media', swapControlWords(original, openTokens));
		controls?.setAttribute('data-media', swapControlWords(controls.getAttribute('data-media'), openTokens));
	} else {
		const saved = swapStore.get(frame);
		if (!saved) return;
		swapStore.delete(frame);
		saved.holder.setAttribute('media', saved.media);
		if (saved.dataMedia !== null) controls?.setAttribute('data-media', saved.dataMedia);
	}
}

const bind = createCommandRouter(COMMANDS, ({ target }) => {
	if (target?.matches?.('ui-media[popover]')) toggleLayout(target);
});

/* ── modality — a popover is NOT modal: without help, Tab (and AT) can walk out
   of the open lightbox into the page behind the backdrop. Stamp `inert` on
   every element sibling along the frame→body ancestor chain while open; remove
   exactly the stamped ones on close (never touching pre-existing inert). ── */
const inerted = new WeakMap();   // frame → elements this open() inerted
function setModal(frame, open) {
	if (open) {
		const stamped = [];
		for (let el = frame; el && el !== document.body && el.parentElement; el = el.parentElement) {
			for (const sib of el.parentElement.children) {
				if (sib === el || sib.inert) continue;
				sib.inert = true;
				stamped.push(sib);
			}
		}
		inerted.set(frame, stamped);
	} else {
		for (const el of inerted.get(frame) || []) el.inert = false;
		inerted.delete(frame);
	}
}

/* ── back-button close — mobile users expect "back" to close a fullscreen
   gallery. One history entry per open; Back closes the lightbox; closes from
   any other path (Esc, light-dismiss, button) consume the entry with a guarded
   history.back() so the stack never grows. popover=auto means at most one
   lightbox is open at a time. ── */
let poppingOurEntry = false;
function syncHistory(frame, open) {
	if (open) {
		history.pushState({ uiLightbox: frame.id || true }, '');
	} else if (history.state?.uiLightbox && !poppingOurEntry) {
		poppingOurEntry = true;
		history.back();
	}
}
function onPopstate() {
	if (poppingOurEntry) { poppingOurEntry = false; return; }   // our own back()
	document.querySelector('ui-media[popover]:popover-open')?.hidePopover?.();
}

/* beforetoggle fires BEFORE the state change, while the pre-change layout and
   media string are still live — the one moment the current slide index can be
   read reliably (after the change the frame has resized, so raw scroll offsets
   no longer map to the old pitch) */
function onBeforeToggle(event) {
	const frame = event.target;
	if (!(frame instanceof Element) || !frame.matches('ui-media[popover]')) return;
	if (frame.dataset.lightbox !== 'grid') pendingIndex.set(frame, slideIndexOf(frame));
}

function onToggle(event) {
	const frame = event.target;
	if (!(frame instanceof Element) || !frame.matches('ui-media[popover]')) return;
	const open = event.newState === 'open';
	for (const box of frame.querySelectorAll(':scope ui-lightbox')) box.toggleAttribute('open', open);
	if (!open) delete frame.dataset.lightbox;
	applyMediaOpen(frame, open);
	setModal(frame, open);
	syncHistory(frame, open);
	/* slide continuity: land on the slide the user was on, in the new layout
	   (and, when media-open flipped the axis, on the new axis) */
	const index = pendingIndex.get(frame);
	if (index !== undefined) {
		pendingIndex.delete(frame);
		scrollToIndex(frame, index);
		/* on CLOSE the frame's `overlay` transition (media.lightbox.css — it lets
		   the ::backdrop fade out) retains it in the top layer with viewport-sized
		   geometry for the transition's duration, so the restore above used the
		   wrong pitch — re-assert once the frame re-enters flow. (Reduced-motion
		   users have no overlay transition; for them the first restore is final
		   and the timeout re-assert is an idempotent no-op.) */
		if (!open) {
			let done = false;
			const again = () => { if (done) return; done = true; frame.removeEventListener('transitionend', onEnd); scrollToIndex(frame, index); };
			const onEnd = (e) => { if (e.propertyName === 'overlay') again(); };
			frame.addEventListener('transitionend', onEnd);
			setTimeout(again, 450);
		}
	}
	/* a fullscreen gallery pauses its media on close */
	if (!open) for (const video of frame.querySelectorAll(':scope > video')) if (!video.paused) video.pause();
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

/* ── grid tile → slide jump — tapping a photo in the open "view all" grid
   flips to the carousel presentation AT that slide. Uses the controls core's
   slidesOf (stashed by enhanceControls); pure enhancement — without it the
   grid is still browsable. ── */
function onGridClick(event) {
	if (!core) return;
	const frame = event.target?.closest?.('ui-media[popover]:popover-open');
	if (!frame || frame.dataset.lightbox === 'nav') return;
	const inGrid = frame.dataset.lightbox === 'grid' || /(^|\s)open:grid\(/.test(mediaStr(frame));
	if (!inGrid) return;
	const tile = [...frame.children].find((child) => child === event.target || child.contains(event.target));
	if (!tile) return;
	const index = core.slidesOf(frame).indexOf(tile);
	if (index < 0) return;   // furniture, controls, clones — not a slide
	frame.dataset.lightbox = 'nav';
	const lead = frame.querySelector(':scope > [data-clone]') ? 1 : 0;
	scrollToIndex(frame, index + lead);
}

function onClick(event) {
	onGridClick(event);
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
let core = null;   // the resolved controls-core module (slidesOf for the tile jump)
function enhanceControls(root = document) {
	const frames = [...root.querySelectorAll('ui-media[popover]')]
		.filter((frame) => !frame.dataset.uiCarouselPolyfill);
	if (!frames.length) return;
	import('../../polyfill/carousel-controls.js').then((mod) => {
		core = mod;
		const { initControls, mediaStr, hasToken, wantedFromString } = mod;
		/* with media-open, build the UNION of both states' control sets so the
		   open vocabulary's dots/arrows exist even when the closed one skips them
		   (per-state visibility is CSS, keyed off the swapped data-media) */
		const optionsFor = (frame) => {
			const openTokens = mediaOpenStr(frame);
			if (!openTokens) return {};
			const closed = wantedFromString(mediaStr(frame));
			const opened = wantedFromString(swapControlWords(mediaStr(frame), openTokens));
			return { wanted: { dots: closed.dots || opened.dots, arrows: closed.arrows || opened.arrows } };
		};
		let retries = 0;
		const run = () => {
			const deferred = [];
			for (const frame of frames) {
				if (frame.dataset.uiCarouselPolyfill) continue;
				const needsClones = hasToken(mediaStr(frame), 'loop') && !frame.querySelector(':scope > [data-clone]');
				if (needsClones && retries < 5) { deferred.push(frame); continue; }
				initControls(frame, optionsFor(frame));
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
	root.addEventListener('beforetoggle', onBeforeToggle, true);   // capture: doesn't bubble
	root.addEventListener('toggle', onToggle, true);   // capture: ToggleEvent doesn't bubble
	root.addEventListener('click', onClick);
	globalThis.addEventListener('popstate', onPopstate);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => enhanceControls(root), { once: true });
	} else {
		enhanceControls(root);
	}
	return () => {
		unbindCommand();
		root.removeEventListener('beforetoggle', onBeforeToggle, true);
		root.removeEventListener('toggle', onToggle, true);
		root.removeEventListener('click', onClick);
		globalThis.removeEventListener('popstate', onPopstate);
	};
}

// Auto-init for the common case (importing the module wires the page).
initLightboxCommands();

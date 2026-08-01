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
 *
 * ToggleEvent and CommandEvent don't bubble → both listeners are CAPTURE phase.
 * Import for the side effect (auto-inits once), or call initLightboxCommands().
 * @version 1.0.0
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

/* toggle-popover click fallback for browsers without native `command=` invokers */
function onClick(event) {
	if ('command' in HTMLButtonElement.prototype) return;
	const btn = event.target?.closest?.('button[command="toggle-popover"][commandfor]');
	if (!btn) return;
	document.getElementById(btn.getAttribute('commandfor'))?.togglePopover?.();
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
	return () => {
		unbindCommand();
		root.removeEventListener('toggle', onToggle, true);
		root.removeEventListener('click', onClick);
	};
}

// Auto-init for the common case (importing the module wires the page).
initLightboxCommands();

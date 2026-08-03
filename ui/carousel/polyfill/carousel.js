/**
 * ui/carousel/polyfill/carousel.js — Safari fallback ENTRY for the CSS-only <ui-media> carousel.
 *
 * The native carousel (ui/card/media.carousel.css) uses ::scroll-marker dots and
 * ::scroll-button() arrows behind `@supports (scroll-marker-group: after)`.
 * Where that's unsupported, this entry auto-scans the page and injects DOM
 * controls per carousel. The injection machinery lives in ./carousel-controls.js
 * (shared with ui/card/lightbox.js, which needs DOM controls in EVERY
 * browser — native scroll-control pseudos don't join the top layer with a
 * popover frame).
 *
 * Load it conditionally:
 *   if (!CSS.supports('scroll-marker-group: after')) import('/ui/carousel/polyfill/carousel.js');
 */

import { scan, idle } from './carousel-controls.js';

// If the native features ARE supported (force-loaded via ?polyfill, or a future
// browser ships them while this stays wired), neutralize the native pseudos so
// the page never shows two sets of controls.
if (CSS.supports('scroll-marker-group: after')) {
	const kill = document.createElement('style');
	kill.textContent = 'ui-media { scroll-marker-group: none !important; } ui-media::scroll-button(*) { display: none !important; }';
	document.head.append(kill);
}

idle(scan);
globalThis.uiMediaPolyfill = Object.assign(globalThis.uiMediaPolyfill || {}, { scan });

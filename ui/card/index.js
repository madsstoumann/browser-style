/* <ui-media> progressive enhancement — all-in-one entry point. Sole owner of the idle
 * scan and globalThis.uiMedia.scan; a chunk imported on its own falls back to its own.
 * Feature chunks (each importable standalone):
 *   hover.js     cursor-tracked hov(track|drift|tilt)
 *   carousel.js  loop (seamless clones) · autoplay · pause-on-slide-leave
 *   video.js     embed facades · media commands · vid() tools · <ui-play> · solo play · tracking
 * No srcset here (ui-media-srcset.js). With JS off everything still renders and scrolls. */

import { initHover, scanHover } from './hover.js';
import { initLoop, initAuto, initCarousels, initCarouselVideoPause, scanCarousels } from './carousel.js';
import { initMediaCommands, initEmbeds, initVideoTools, initSolo, initVideoTracking, scanVideo } from './video.js';
import { onIdle, initVideoPlay } from './shared.js';

export {
	initHover, scanHover,
	initLoop, initAuto, initCarousels, initCarouselVideoPause, scanCarousels,
	initMediaCommands, initEmbeds, initVideoTools, initSolo, initVideoTracking, scanVideo,
	initVideoPlay,
};

export function scan() {
	scanHover();
	scanCarousels();
	scanVideo();
}

globalThis.uiMedia = Object.assign(globalThis.uiMedia || {}, { scan });
onIdle(scan);

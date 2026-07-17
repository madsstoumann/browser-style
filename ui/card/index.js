/* <ui-media> progressive enhancement — all-in-one entry point.
 * Feature chunks (each self-initializes on idle and is importable on its own):
 *   hover.js     cursor-tracked hov(track|drift|tilt)
 *   carousel.js  loop (seamless clones) · autoplay · pause-on-slide-leave · slide <ui-play>
 *   video.js     embed facades · media commands · vid() tools · solo play · tracking
 * No srcset here (ui-media-srcset.js). With JS off everything still renders and scrolls. */

import { initHover, scanHover } from './hover.js';
import { initLoop, initAuto, initCarousels, initCarouselVideoPause, scanCarousels } from './carousel.js';
import { initMediaCommands, initEmbeds, initVideoTools, initSolo, initVideoTracking, scanVideo } from './video.js';
import { initVideoPlay } from './shared.js';

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

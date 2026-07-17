/* Shared primitives for the <ui-media> enhancement chunks (carousel.js / video.js). */

export const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const onIdle = globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1));

// effective media= string (own attr, else nearest ancestor) / self-only nav= words
export const mediaStr = (el) => el.closest('[media]')?.getAttribute('media') || '';
export const navWords = (el) => (el.getAttribute('nav') || '').split(/\s+/);

// slides = direct children minus overlay furniture and nested <lay-out> wrappers
const NOT_SLIDE = /^(UI-CHIP|UI-PLAY|UI-SAVE|UI-STICKER|UI-CAROUSEL-CONTROLS|LAY-OUT)$/;
export const slidesOf = (el) => [...el.children].filter(c => !NOT_SLIDE.test(c.tagName));

// muted + autoplay = silent background loop; never coordinated/paused
export const isDecoration = (v) => v.muted && v.hasAttribute('autoplay');

// Mirror <ui-play>'s visual state without loading the component
export function reflectPlay(uiPlay, playing) {
	const btn = uiPlay.querySelector('button');
	if (!btn) return;
	btn.setAttribute('aria-pressed', String(playing));
	uiPlay.toggleAttribute('open', playing);
	const icon = btn.querySelector('ui-icon');
	const type = icon?.getAttribute('type');
	if (type === 'play' || type === 'pause') icon.setAttribute('type', playing ? 'pause' : 'play');
}

// Wire a <ui-play> to a <video>: mirror real state, toggle on click, load deferred data-src
export function bindVideo(uiPlay, video) {
	const sync = () => reflectPlay(uiPlay, !video.paused);
	video.addEventListener('play', sync);
	video.addEventListener('pause', sync);
	video.addEventListener('ended', sync);
	uiPlay.querySelector('button')?.addEventListener('click', () => {
		if (!video.paused) return video.pause();
		if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
		video.play()?.catch(() => {});
	});
	sync();
}

// <ui-play> over a native <video> (standalone frame or per-slide inside a carousel)
export function initVideoPlay(uiPlays) {
	for (const play of uiPlays) {
		if (play.dataset.uiVideo) continue;
		const video = play.closest('ui-media')?.querySelector(':scope > video');
		if (!video) continue;
		play.dataset.uiVideo = '1';
		bindVideo(play, video);
	}
}

// Candidates for initVideoPlay: not an embed facade, not a carousel's own autoplay control
export function videoPlayNodes() {
	return [...document.querySelectorAll('ui-media:not([provider]) > ui-play')]
		.filter(play => {
			const media = play.parentElement;
			if (!media.querySelector(':scope > video')) return false;
			const nested = !!media.parentElement?.closest('ui-media');
			return nested || !/\bnav\b|auto|loop/.test(mediaStr(media) + ' ' + (media.getAttribute('nav') || ''));
		});
}

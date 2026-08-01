/* Shared primitives for the <ui-media> enhancement chunks (carousel.js / video.js). */

export const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const onIdle = globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1));

// effective media= string — own attr, else the nearest ui-card/ui-reveal host.
// Inheritance stops at the card: media= on a lay-out (its own scroller config)
// or any other ancestor never leaks into a descendant ui-media.
export const mediaStr = (el) => {
	const h = el.closest('[media]');
	return h && (h === el || h.matches('ui-card, ui-reveal')) ? (h.getAttribute('media') || '') : '';
};

// whole-token test for bare media= flags — `loop` must never match marquee(loop),
// and `auto`/`nav` also have parameterized forms (auto(4s), nav(mrk)).
export const hasToken = (str, name) => new RegExp(`(^|\\s)${name}(\\(|\\s|$)`).test(str);

// slides = direct children minus overlay furniture, bands and nested <lay-out> wrappers
// (keep in sync with the :not() list in media.carousel.css)
export const NOT_SLIDE = /^(UI-BEACON|UI-CHIP|UI-LIGHTBOX|UI-MARQUEE|UI-PLAY|UI-SAVE|UI-STICKER|UI-CAROUSEL-CONTROLS|LAY-OUT)$/;
export const slidesOf = (el) => [...el.children].filter(c => !NOT_SLIDE.test(c.tagName));

// muted + autoplay = silent background loop; never coordinated/paused
export const isDecoration = (v) => v.muted && v.hasAttribute('autoplay');

// Mirror <ui-play>'s visual state without loading the component:
// [open] morphs the <ui-icon type="play-pause"> glyph via CSS
export function reflectPlay(uiPlay, playing) {
	const btn = uiPlay.querySelector('button');
	if (!btn) return;
	btn.setAttribute('aria-pressed', String(playing));
	uiPlay.toggleAttribute('open', playing);
}

// Wire a <ui-play> to a <video>: mirror real state, toggle on click, load deferred data-src.
// A button carrying the invoker contract (command/commandfor) is toggled by video.js's
// command handler instead — we only mirror state, or the two would cancel out.
export function bindVideo(uiPlay, video) {
	const sync = () => reflectPlay(uiPlay, !video.paused);
	video.addEventListener('play', sync);
	video.addEventListener('pause', sync);
	video.addEventListener('ended', sync);
	const btn = uiPlay.querySelector('button');
	if (btn && !btn.hasAttribute('commandfor')) btn.addEventListener('click', () => {
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
			const m = mediaStr(media);
			return nested || !(hasToken(m, 'nav') || hasToken(m, 'auto') || hasToken(m, 'loop'));
		});
}

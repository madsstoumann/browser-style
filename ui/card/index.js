/**
 * <ui-media> demo progressive enhancement — single entry point.
 *
 * Bundles the handful of things CSS can't do, each as a small, reusable function
 * that takes an array/NodeList of nodes and does NOT query the DOM itself — the
 * selectors live at the very end (see scan()), so any of these can later move to
 * its own module unchanged:
 *   - initHover(nodes)        cursor-tracked hov(track) / hov(drift)
 *   - initCarousels(nodes)    loop (seamless clones) + autoplay + play/pause control
 *   - initVideoPlay(uiPlays)  <ui-play> over a native <video> (carousel/standalone)
 *   - initMediaCommands(root) <button command="play-pause" commandfor> polyfill for <video>
 *   - initEmbeds(frames)      provider="youtube|vimeo" facade: reveal the SSR'd real player
 *   - initVideoTools(frames)  vid(pip) / vid(fls) token → injects PiP/fullscreen buttons
 *
 * No srcset here (that lives in ui-media-srcset.js). The <ui-play> component itself
 * is NOT loaded — this script drives the button state directly (reflectPlay). Pure
 * progressive enhancement: with JS off the CSS-only frames/carousels still render,
 * scroll, snap and show dots/arrows; posters stay put.
 */

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

// the effective media string (own attr, else nearest ancestor that has one)
const mediaStr = (el) => el.closest('[media]')?.getAttribute('media') || '';
// the self nav= attribute words (dedicated grouped attribute, not inherited)
const navWords = (el) => (el.getAttribute('nav') || '').split(/\s+/);

// Mirror <ui-play>'s visual state WITHOUT loading the component: aria-pressed on the
// inner button, `open` on the host (morphs a <ui-icon type="play-pause"> via CSS), and
// a legacy static <ui-icon type="play|pause"> swaap for older markup.
function reflectPlay(uiPlay, playing) {
	const btn = uiPlay.querySelector('button');
	if (!btn) return;
	btn.setAttribute('aria-pressed', String(playing));
	uiPlay.toggleAttribute('open', playing);
	const icon = btn.querySelector('ui-icon');
	const type = icon?.getAttribute('type');
	if (type === 'play' || type === 'pause') icon.setAttribute('type', playing ? 'pause' : 'play');
}

// Wire a <ui-play> to a <video>: mirror the video's REAL state onto the button (native
// controls too) and toggle play/pause on the button click, loading a deferred data-src on
// first play. The one primitive shared by initVideoPlay and the initEmbeds vimeo-native path.
function bindVideo(uiPlay, video) {
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

/* ============================================================
 * Cursor-tracked hover — hov(track) / hov(drift).
 *
 * The only two hover effects that need JS: they set --ui-media-mx / --ui-media-my
 * (-1..1) on the frame, which the CSS reads to translate the image toward (track)
 * or away from (drift) the cursor. Call once with the array of matched nodes; each
 * node may BE a <ui-media> or a host <ui-card>/<ui-reveal> carrying the token, so
 * we resolve to the <ui-media> frame(s) and set the props there.
 * ============================================================ */
export function initHover(nodes) {
	if (!nodes || !nodes.length) return;

	// Resolve matched nodes to their <ui-media> frames (dedup shared frames).
	const frames = new Set();
	for (const el of nodes) {
		if (el.matches('ui-media')) frames.add(el);
		else for (const m of el.querySelectorAll('ui-media')) frames.add(m);
	}

	let raf = 0;
	for (const media of frames) {
		if (media.dataset.uiHover) continue;   // idempotent
		media.dataset.uiHover = '1';
		let rect = null;

		media.addEventListener('pointerenter', () => { rect = media.getBoundingClientRect(); }, { passive: true });

		media.addEventListener('pointermove', (e) => {
			if (raf || reduce.matches) return;   // instant exit when idle / reduced-motion
			raf = requestAnimationFrame(() => {
				raf = 0;
				rect ??= media.getBoundingClientRect();
				const mx = Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width * 2 - 1));
				const my = Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height * 2 - 1));
				media.style.setProperty('--ui-media-mx', mx.toFixed(3));
				media.style.setProperty('--ui-media-my', my.toFixed(3));
			});
		}, { passive: true });

		media.addEventListener('pointerleave', () => {
			media.style.removeProperty('--ui-media-mx');
			media.style.removeProperty('--ui-media-my');
			rect = null;
		}, { passive: true });
	}
}

/* ============================================================
 * Carousel behaviors — loop (seamless) · autoplay.
 *
 * The base carousel (scroll-snap, dots, arrows) stays 100% CSS — these only add
 * what CSS can't do. Both read axis / duration from the same media=/nav= tokens.
 * ============================================================ */

// snap children = the slides: every direct child EXCEPT the overlay furniture.
const NOT_SLIDE = /^(UI-CHIP|UI-PLAY|UI-SAVE|UI-STICKER|UI-CAROUSEL-CONTROLS)$/;
const slidesOf = (el) => [...el.children].filter(c => !NOT_SLIDE.test(c.tagName));

const axisYOf = (scroller) => {
	const m = mediaStr(scroller), nav = navWords(scroller);
	return m.includes('axis(y)') || nav.includes('y');
};

// shared scroll geometry for a scroller on a given axis
function geom(scroller, axisY) {
	const size = () => axisY ? scroller.clientHeight : scroller.clientWidth;
	const pos = () => { const s = size(); return s ? Math.round((axisY ? scroller.scrollTop : scroller.scrollLeft) / s) : 0; };
	const scrollToPos = (p, behavior = 'smooth') =>
		scroller.scrollTo({ [axisY ? 'top' : 'left']: p * size(), behavior: reduce.matches ? 'instant' : behavior });
	return { size, pos, scrollToPos };
}

/**
 * Seamless loop via clones. Prepend a clone of the LAST slide and append a clone
 * of the FIRST, so the scroll range extends one slide past each end. Native arrows /
 * snap smooth-scroll INTO a clone; on scrollend we instantly hop to the real twin
 * (identical image, adjacent position → invisible). Clones carry [data-clone] so CSS
 * suppresses their dots. Run this BEFORE initAuto so the clones exist when auto ticks.
 */
export function initLoop(scroller) {
	const slides = slidesOf(scroller);
	const count = slides.length;
	if (count < 2) return;

	const axisY = axisYOf(scroller);
	const { pos, scrollToPos } = geom(scroller, axisY);

	const head = slides[0].cloneNode(true);
	const tail = slides[count - 1].cloneNode(true);
	head.setAttribute('data-clone', '');
	tail.setAttribute('data-clone', '');
	scroller.prepend(tail);   // leading clone shows the LAST slide
	scroller.append(head);    // trailing clone shows the FIRST slide

	scroller.addEventListener('scrollend', () => {
		const p = pos();
		if (p <= 0) scrollToPos(count, 'instant');           // leading clone (=last)  → real last
		else if (p >= count + 1) scrollToPos(1, 'instant');  // trailing clone (=first) → real first
	}, { passive: true });

	scrollToPos(1, 'instant');   // start on the first real slide (past the leading clone)
}

/**
 * Autoplay. Advances one position every N ms; with loop clones present it rolls into
 * the trailing clone and the loop scrollend seamlessly hops back to the real first.
 * Duration: auto · auto(4s) · auto(800ms) · auto(3) (bare number = seconds) via media=;
 * nav="auto" uses the 5s default. When a <ui-play> control is present it is the SOLE
 * pause mechanism (glyph always matches reality); otherwise autoplay pauses on
 * hover / press / focus. Either way it stops when the tab is hidden.
 */
export function initAuto(scroller) {
	const slides = slidesOf(scroller);
	if (slides.length < 2) return;

	const m = mediaStr(scroller), nav = navWords(scroller);
	const axisY = axisYOf(scroller);
	const { pos, scrollToPos } = geom(scroller, axisY);

	const am = m.match(/auto(?:\((\d+(?:\.\d+)?)(m?s)?\))?/);
	const autoMs = am ? (am[1] ? (am[2] === 'ms' ? +am[1] : +am[1] * 1000) : 5000) : (nav.includes('auto') ? 5000 : 0);
	if (!autoMs || reduce.matches) return;

	let timer = 0, paused = false;
	const tick = () => { if (!paused) scrollToPos(pos() + 1, 'smooth'); };
	const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
	const start = () => { stop(); timer = setInterval(tick, autoMs); };

	// Explicit play/pause control (<ui-play> furniture). When present it OWNS the paused
	// state — no implicit hover/focus auto-pause, so the glyph never lies. It also freezes
	// the CSS pill/thumb fill timer via --ui-media-play-state.
	const play = scroller.querySelector(':scope > ui-play');
	if (play) {
		// end-corner controls (play(*e)) must be the LAST child so sticky-inline-end pins
		if (/play\([a-z]e\)/.test(m)) scroller.appendChild(play);
		const setPlaying = (running) => {
			paused = !running;
			scroller.style.setProperty('--ui-media-play-state', running ? 'running' : 'paused');
			reflectPlay(play, running);
			running ? start() : stop();
		};
		play.querySelector('button')?.addEventListener('click', () => setPlaying(paused));
		setPlaying(true);
	} else {
		scroller.addEventListener('pointerenter', () => { paused = true; }, { passive: true });
		scroller.addEventListener('pointerleave', () => { paused = false; }, { passive: true });
		scroller.addEventListener('pointerdown', () => { paused = true; }, { passive: true });
		scroller.addEventListener('focusin', () => { paused = true; });
		scroller.addEventListener('focusout', () => { paused = false; });
	}
	document.addEventListener('visibilitychange', () => document.hidden ? stop() : (!paused && start()));

	scroller.style.setProperty('--ui-media-autoplay', (autoMs / 1000) + 's'); // sync the dot(pll) CSS timer
	scroller.style.setProperty('--ui-media-thumb-timer-name', 'ui-media-thumb-timer'); // enable dot(tmb) fill timer
	start();
}

/* ============================================================
 * Carousel dispatch — loop first (adds clones), then auto (ticks into them).
 * Takes a NodeList of scrollers; guards each so scan() is idempotent.
 * ============================================================ */
export function initCarousels(nodes) {
	for (const el of nodes) {
		if (el.dataset.uiCarousel) continue;   // idempotent
		el.dataset.uiCarousel = '1';
		const m = mediaStr(el), nav = navWords(el);
		if (m.includes('loop') || nav.includes('loop')) initLoop(el);
		if (m.includes('auto') || nav.includes('auto')) initAuto(el);
	}
}

/* ============================================================
 * Native <video> play/pause — a <ui-play> overlaid on a plain <video>.
 *
 * Takes the <ui-play> elements; each drives the <video> in its own frame and mirrors
 * the element's REAL state (native controls too) back onto the button. Supports a
 * deferred <video data-src> (loaded on first play) so posters cost nothing up front.
 * ============================================================ */
export function initVideoPlay(uiPlays) {
	for (const play of uiPlays) {
		if (play.dataset.uiVideo) continue;   // idempotent
		const video = play.closest('ui-media')?.querySelector(':scope > video');
		if (!video) continue;
		play.dataset.uiVideo = '1';
		bindVideo(play, video);
	}
}

/* ============================================================
 * Light-embed facades — provider="youtube|vimeo".
 *
 * The facade is AUTHORED for progressive enhancement — a plain (non-nav) <ui-media>
 * whose poster shows WITH JS OFF. Mark it `data-preview` (provider-agnostic; z-index:1
 * lifts it over the real player, so source order doesn't matter):
 *   - <video data-preview poster="still.jpg" autoplay muted loop> — an animated,
 *     gif-like loop (with its own poster= still image), or
 *   - <img data-preview> — a static poster (e.g. a YouTube thumbnail).
 * The real player is best SSR'd behind the preview:
 *   - native  <video preload="none" id> — driven declaratively by the <ui-play> button's
 *     command="play-pause" commandfor="<id>" (initMediaCommands / future native). This fn
 *     only mirrors state onto the button and drops the preview once it plays.
 *   - embed   <iframe loading="lazy"> — on <ui-play> click, drop the preview,
 *     add autoplay, hand off to the platform player.
 * When nothing real is authored (pure API flow) JS injects the poster + player on click.
 * ============================================================ */
const YT_ORIGIN = 'https://www.youtube-nocookie.com';
const posterUrl = (provider, id) => provider === 'vimeo'
	? `https://vumbnail.com/${id}.jpg`
	: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/* ============================================================
 * Media Invoker Commands polyfill — <button command commandfor> over <video>/<audio>.
 *
 * Implements the PROPOSED media commands (play-pause · play · pause · toggle-muted;
 * https://open-ui.org/components/future-invokers.explainer/) so markup is written to the
 * future standard today. ONE delegated click listener resolves commandfor→media element
 * and acts. It AUTO-DISABLES once browsers ship native support: `button.command` reflects
 * the value only for a recognized command (empty today), so the whole thing no-ops when
 * native lands — delete it whenever, markup never changes. (Non-media targets fall through
 * to the native Invoker Commands API / other handlers.)
 * ============================================================ */
const MEDIA_COMMANDS = new Set(['play-pause', 'play', 'pause', 'toggle-muted']);
const nativeMediaCommands = (() => {
	const b = document.createElement('button');
	b.setAttribute('command', 'play-pause');
	return b.command === 'play-pause';
})();
let mediaCmdBound = false;
export function initMediaCommands(root = document) {
	if (root === document) { if (mediaCmdBound) return; mediaCmdBound = true; }
	root.addEventListener('click', (e) => {
		const btn = e.target.closest?.('button[command][commandfor]');
		if (!btn) return;
		const cmd = btn.getAttribute('command');
		const el = document.getElementById(btn.getAttribute('commandfor'));
		if (!(el instanceof HTMLMediaElement)) return;
		// Subtitle/caption track switching — CUSTOM command (no native invoker exists or is
		// proposed for text tracks), so always handled here, even after native play-pause ships.
		// Language is encoded in the command suffix (`command` can't carry a param): --track-da,
		// --track-en, --track-off. Reflects aria-pressed across the sibling group.
		if (cmd.startsWith('--track-')) { setTextTrack(el, btn); return; }
		// Proposed media commands — skip when the browser handles them natively (auto-disable).
		if (nativeMediaCommands || !MEDIA_COMMANDS.has(cmd)) return;
		if (cmd === 'toggle-muted') { el.muted = !el.muted; return; }
		if (cmd === 'pause' || (cmd === 'play-pause' && !el.paused)) el.pause();
		else { const p = el.play(); if (p && p.catch) p.catch(() => {}); }
	});
}

/* Switch the showing text track of `video` to the language in the button's command suffix
 * (`--track-<lang>`; `off` disables all), then mirror aria-pressed across every --track button
 * pointing at the same commandfor. Track match is by `.language` (the <track srclang>). */
function setTextTrack(video, btn) {
	const id = btn.getAttribute('commandfor');
	const lang = btn.getAttribute('command').slice('--track-'.length);   // da | en | off
	for (const track of video.textTracks) {
		track.mode = (lang !== 'off' && track.language === lang) ? 'showing' : 'disabled';
	}
	const scope = btn.closest('[data-track-group]') || document;
	for (const b of scope.querySelectorAll(`button[command^="--track-"][commandfor="${id}"]`)) {
		b.setAttribute('aria-pressed', String(b === btn));
	}
}

export function initEmbeds(frames) {
	for (const media of frames) {
		if (media.dataset.uiEmbed) continue;   // idempotent
		media.dataset.uiEmbed = '1';

		const provider = media.getAttribute('provider');
		const id = media.getAttribute('video');
		const src = media.getAttribute('src');   // direct file URL → native path

		// No authored facade (pure API flow) → inject a platform thumbnail so something shows.
		if (id && !media.querySelector(':scope > img, :scope > video, :scope > iframe')) {
			const img = document.createElement('img');
			img.loading = 'lazy';
			img.alt = '';
			img.src = posterUrl(provider, id);
			media.prepend(img);
		}

		const play = media.querySelector(':scope > ui-play');
		const btn = play?.querySelector('button');
		if (!btn) continue;

		// The still image behind the facade — carried onto the real <video> as its poster.
		const facadeStill = () =>
			media.querySelector(':scope > [data-preview]')?.getAttribute('poster')
			|| media.querySelector(':scope > img')?.getAttribute('src')
			|| null;

		// Drop the authored facade (animated preview + static poster) once the real player is in.
		const dropPreview = () => {
			media.querySelector(':scope > img')?.remove();
			media.querySelector(':scope > [data-preview]')?.remove();
		};
		const dropFacade = dropPreview;

		// SSR'd real player already in the markup (progressive enhancement): a lazy <iframe>
		// (embed) or a <video preload="none"> sits BEHIND the animated preview.
		const realVideo = media.querySelector(':scope > video:not([data-preview])');
		const realIframe = media.querySelector(':scope > iframe');

		// Native <video>: the <ui-play> button drives it declaratively via
		// command="play-pause" commandfor="<id>" (initMediaCommands / future native). We only
		// mirror state onto the button and drop the preview once it actually plays.
		if (realVideo) {
			realVideo.addEventListener('play', () => { dropPreview(); reflectPlay(play, true); });
			realVideo.addEventListener('pause', () => reflectPlay(play, false));
			realVideo.addEventListener('ended', () => reflectPlay(play, false));
			continue;
		}
		if (realIframe) {
			btn.addEventListener('click', () => {
				dropPreview();
				if (!/[?&]autoplay=1/.test(realIframe.src)) {
					realIframe.src += (realIframe.src.includes('?') ? '&' : '?') + 'autoplay=1';
				}
				reflectPlay(play, true);
				play.hidden = true;
			}, { once: true });
			continue;
		}

		btn.addEventListener('click', () => {
			// The <video data-preview> uses <source> (no src attr) — the real player has src / is an iframe.
			if (media.querySelector(':scope > iframe, :scope > video[src]:not([data-preview])')) return;

			// Vimeo native — a direct file URL becomes a real <video> we keep controlling.
			if (provider === 'vimeo' && src) {
				const video = document.createElement('video');
				video.src = src;
				video.autoplay = true;
				video.playsInline = true;
				const still = facadeStill();
				if (still) video.poster = still;
				if (media.hasAttribute('loop')) video.loop = true;
				if (media.hasAttribute('muted')) video.muted = true;
				media.appendChild(video);
				dropFacade();
				bindVideo(play, video);   // same play/pause + state-sync primitive as initVideoPlay
				return;
			}

			// YouTube / Vimeo embed — hand off to the platform iframe player.
			if (!id) return;
			const iframe = document.createElement('iframe');
			iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
			iframe.setAttribute('allowfullscreen', '');
			iframe.title = media.getAttribute('data-title') || (provider === 'vimeo' ? 'Vimeo video player' : 'YouTube video player');
			iframe.src = provider === 'vimeo'
				? `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1`
				: `${YT_ORIGIN}/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`;
			media.appendChild(iframe);

			// Drop the facade: poster/preview gone, control handed off to the player.
			dropFacade();
			reflectPlay(play, true);
			play.hidden = true;
		});
	}
}

/* ============================================================
 * Player tools — fullscreen + picture-in-picture, via the vid() media token.
 *
 * Native <video controls> can't be trimmed to "only fullscreen + PiP" (controlsList is
 * subtractive), so for a chrome-less video we drive these ourselves. Enabled like any
 * other media= token — vid(pip) / vid(fls), on the frame or an ancestor (or the dedicated
 * `vid="pip fls"` attribute). Unlike dot()/arw() (pure-CSS scroll pseudo-elements), these
 * need real buttons + a user gesture, so JS INJECTS a <menu class="ui-media-tools"> with
 * the requested buttons (fullscreen appended last → rightmost) and wires them: fullscreen
 * targets the FRAME (overlays stay visible), PiP targets its <video>, state via aria-pressed.
 * PiP is feature-detected (no Firefox) → that button is simply not injected. media.css owns
 * the glyphs (url() SVG, same convention as the carousel arrows) and the cluster styling.
 * ============================================================ */
function makeToolButton(command, label) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.setAttribute('command', command);
	btn.setAttribute('aria-label', label);
	return btn;
}

function wireTool(btn, frame) {
	const command = btn.getAttribute('command');
	const getVideo = () => frame.querySelector(':scope > video') || frame.querySelector('video');

	if (command === '--pip') {
		const v = getVideo();
		if (v) {
			v.addEventListener('enterpictureinpicture', () => btn.setAttribute('aria-pressed', 'true'));
			v.addEventListener('leavepictureinpicture', () => btn.setAttribute('aria-pressed', 'false'));
		}
		btn.addEventListener('click', async () => {
			const video = getVideo();
			if (!video) return;
			try {
				if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
				else await video.requestPictureInPicture();
			} catch { /* not ready / gesture required */ }
		});
	} else if (command === '--fullscreen') {
		document.addEventListener('fullscreenchange', () => btn.setAttribute('aria-pressed', String(document.fullscreenElement === frame)));
		btn.addEventListener('click', () => {
			if (document.fullscreenElement) { document.exitFullscreen?.(); return; }
			if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
			else getVideo()?.webkitEnterFullscreen?.();   // iOS Safari: video-only fullscreen
		});
	}
}

/* CC language switcher — an authored customizable <select class="ui-media-cc"> whose <option>
 * values are track languages (srclang) plus `off`. textTrack.mode is JS-only (no declarative
 * switch exists), so this one change handler is the irreducible JS; the menu/positioning/
 * selected-state are all native to <select>. Targets the frame's real (non-preview) <video>. */
function wireCcSelect(select, frame) {
	const getVideo = () => frame.querySelector(':scope > video:not([data-preview])') || frame.querySelector('video');
	const apply = () => {
		const v = getVideo();
		if (!v) return;
		const val = select.value;
		for (const track of v.textTracks) {
			track.mode = (val !== 'off' && track.language === val) ? 'showing' : 'disabled';
		}
	};
	select.addEventListener('change', apply);
	apply();   // sync initial state to the selected <option> (mirrors <track default>)
}

export function initVideoTools(frames) {
	for (const frame of frames) {
		if (frame.dataset.uiTools) continue;
		frame.dataset.uiTools = '1';

		// vid(pip) / vid(fls) from the media= token (own or ancestor), or vid="…".
		// Play/pause is NOT here — that's <ui-play> furniture (initVideoPlay); don't duplicate it.
		const m = mediaStr(frame);
		const vid = frame.getAttribute('vid') || '';
		const wantPip = /vid\(pip\)/.test(m) || /\bpip\b/.test(vid);
		const wantFls = /vid\(fls\)/.test(m) || /\bfls\b/.test(vid);
		const wantCc = /vid\(cc\)/.test(m) || /\bcc\b/.test(vid);
		if (!wantPip && !wantFls && !wantCc) continue;
		// Need a <video> — now, or later once a provider="" facade swaps one in on play.
		// (wireTool resolves the video lazily at click time, so injecting early is fine.)
		if (!frame.querySelector('video') && !frame.hasAttribute('provider')) continue;

		// Reuse an authored cluster if present, else build one.
		let menu = frame.querySelector(':scope > .ui-media-tools');
		if (!menu) {
			menu = document.createElement('menu');
			menu.className = 'ui-media-tools';
			frame.appendChild(menu);
		}
		// CC first (leftmost) → PiP → fullscreen (rightmost). PiP feature-detected.
		// CC switcher is an AUTHORED (SSR) customizable <select class="ui-media-cc"> — wire its
		// change→textTrack.mode. If none is authored, inject a placeholder disc button (unwired).
		if (wantCc) {
			const ccSelect = menu.querySelector('select.ui-media-cc');
			if (ccSelect) {
				if (!ccSelect.dataset.uiTool) { ccSelect.dataset.uiTool = '1'; wireCcSelect(ccSelect, frame); }
			} else if (!menu.querySelector('[command="--cc"]')) {
				menu.appendChild(makeToolButton('--cc', 'Subtitles'));
			}
		}
		if (wantPip && document.pictureInPictureEnabled && !menu.querySelector('[command="--pip"]')) {
			menu.appendChild(makeToolButton('--pip', 'Picture-in-picture'));
		}
		if (wantFls && !menu.querySelector('[command="--fullscreen"]')) {
			menu.appendChild(makeToolButton('--fullscreen', 'Fullscreen'));
		}
		for (const btn of menu.querySelectorAll('button[command]')) {
			if (btn.dataset.uiTool) continue;
			btn.dataset.uiTool = '1';
			wireTool(btn, frame);
		}
	}
}

/* ============================================================
 * Media coordination — solo play + pause-on-slide-leave.
 *
 * A "decoration" video (muted + autoplay, i.e. a silent background loop) is never
 * paused by either feature and never triggers the solo — only real, audible content
 * videos coordinate.
 * ============================================================ */
const isDecoration = (v) => v.muted && v.hasAttribute('autoplay');

// Pause every media element in `videos` except `keep` (skips decoration + already-paused).
function pauseAllExcept(videos, keep) {
	for (const v of videos) {
		if (v !== keep && !v.paused && !isDecoration(v)) v.pause();
	}
}

/**
 * Solo play — starting one video/audio pauses any other that's playing. ONE delegated
 * listener in the CAPTURE phase (the media `play` event doesn't bubble). Global by
 * default; pass a root to scope it. Idempotent.
 */
let soloBound = false;
export function initSolo(root = document) {
	if (root === document) {
		if (soloBound) return;
		soloBound = true;
	}
	root.addEventListener('play', (e) => {
		const el = e.target;
		if (el.tagName !== 'VIDEO' && el.tagName !== 'AUDIO') return;
		if (isDecoration(el)) return;   // a background loop starting doesn't stop content
		pauseAllExcept(root.querySelectorAll('video, audio'), el);
	}, true);
}

/**
 * Pause a slide's video when it scrolls out of the carousel. Attached ONLY to scrollers
 * that actually contain a <video> (per the caller's filter). An IntersectionObserver
 * rooted at the scroller pauses any video inside a slide once it drops below half-visible
 * — works on both axes, for manual, autoplay and loop carousels alike. The <ui-play>
 * glyph resets itself because initVideoPlay already binds the video's `pause` event.
 */
export function initCarouselVideoPause(scrollers) {
	for (const scroller of scrollers) {
		if (scroller.dataset.uiVpause) continue;
		if (scroller.parentElement?.closest('ui-media')) continue;   // nested frame, not a real scroller
		if (!scroller.querySelector('video')) continue;              // only wire carousels WITH a video
		scroller.dataset.uiVpause = '1';

		const io = new IntersectionObserver((entries) => {
			for (const e of entries) {
				if (e.intersectionRatio >= 0.5) continue;
				const vids = e.target.tagName === 'VIDEO' ? [e.target] : e.target.querySelectorAll('video');
				for (const v of vids) if (!isDecoration(v)) v.pause();
			}
		}, { root: scroller, threshold: [0, 0.5, 1] });

		for (const slide of slidesOf(scroller)) io.observe(slide);
	}
}

/* ============================================================
 * Idle scan — the separable querySelectorAll blocks that feed the methods above.
 * Each block queries once, then calls a pure node-taking function.
 * ============================================================ */

const HOVER_SEL = '[media*="hov(track)"], [media*="hov(drift)"], [media*="hov(tilt)"]';
// JS-feature carousels, via EITHER entry point: the inheritable media= token
// (on the element or an ancestor) OR the self-only nav= attribute value.
const CAROUSEL_SEL = [
	'ui-media[media*="auto"]', '[media*="auto"] ui-media',
	'ui-media[media*="loop"]', '[media*="loop"] ui-media',
	'ui-media[nav~="auto"]', 'ui-media[nav~="loop"]',
].join(', ');
const EMBED_SEL = 'ui-media[provider]';
// vid() player-tools: frames whose own or ancestor media= carries a vid( token, or the vid= attr.
const VIDTOOLS_SEL = ['ui-media[media*="vid("]', '[media*="vid("] ui-media', 'ui-media[vid]'].join(', ');
// every scroll carousel (nav/auto/loop) — video-pause is filtered to those with a video.
const NAV_SEL = [
	'ui-media[media*="nav"]', '[media*="nav"] ui-media',
	'ui-media[nav]', CAROUSEL_SEL,
].join(', ');

// <ui-play> over a native <video>: not an embed facade, not a carousel's OWN control.
// A per-slide control lives in a nested <ui-media> (has a ui-media ancestor); the
// carousel's autoplay control is a direct child of a top-level scroller — skip only that.
function videoPlayNodes() {
	return [...document.querySelectorAll('ui-media:not([provider]) > ui-play')]
		.filter(play => {
			const media = play.parentElement;
			if (!media.querySelector(':scope > video')) return false;
			const nested = !!media.parentElement?.closest('ui-media');   // per-slide control
			return nested || !/\bnav\b|auto|loop/.test(mediaStr(media) + ' ' + (media.getAttribute('nav') || ''));
		});
}

/* ============================================================
 * Minimal opt-in video tracking. Mark a native <video data-track="label">; this logs
 * play · pause · complete · 25/50/75% quartiles to the console. Only marked videos are
 * tracked (explicit opt-in). Native <video> only — iframe embeds are cross-origin, no
 * events. Swap the console.log for a real analytics sink (or dispatch a CustomEvent).
 * ============================================================ */
export function initVideoTracking(videos) {
	for (const v of videos) {
		if (v.dataset.uiTrack) continue;   // idempotent
		v.dataset.uiTrack = '1';
		const id = v.getAttribute('data-track') || v.id || 'video';
		const log = (event, extra) => console.log(`[video-track] ${event}`, { id, t: Math.round(v.currentTime), ...extra });
		v.addEventListener('play',  () => log('play'));
		v.addEventListener('pause', () => { if (!v.ended) log('pause'); });
		v.addEventListener('ended', () => log('complete'));
		const seen = new Set();
		v.addEventListener('timeupdate', () => {
			if (!v.duration) return;
			for (const q of [0.25, 0.5, 0.75]) {
				if (v.currentTime / v.duration >= q && !seen.has(q)) { seen.add(q); log('progress', { pct: q * 100 }); }
			}
		});
	}
}

export function scan() {
	initSolo();
	initMediaCommands();   // <button command="play-pause" commandfor> polyfill (native <video>)
	initHover(document.querySelectorAll(HOVER_SEL));
	initCarousels(document.querySelectorAll(CAROUSEL_SEL));
	initCarouselVideoPause(document.querySelectorAll(NAV_SEL));
	initEmbeds(document.querySelectorAll(EMBED_SEL));
	initVideoPlay(videoPlayNodes());
	initVideoTools(document.querySelectorAll(VIDTOOLS_SEL));
	initVideoTracking(document.querySelectorAll('video[data-track]'));
}

(globalThis.requestIdleCallback || ((fn) => setTimeout(fn, 1)))(scan);
globalThis.uiMedia = Object.assign(globalThis.uiMedia || {}, { scan });

/* Video enhancements — embed facades (provider="youtube|vimeo"), media-command polyfill,
 * vid(pip|fls|cc) player tools, solo play and opt-in tracking. Pure progressive
 * enhancement: SSR'd posters and players render with JS off. */

import { onIdle, mediaStr, isDecoration, reflectPlay, bindVideo, initVideoPlay, videoPlayNodes } from './shared.js';

const YT_ORIGIN = 'https://www.youtube-nocookie.com';
const posterUrl = (provider, id) => provider === 'vimeo'
	? `https://vumbnail.com/${id}.jpg`
	: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// show the text track matching lang ('off' disables all); match by <track srclang>
const showTrack = (mediaEl, lang) => {
	for (const track of mediaEl.textTracks) {
		track.mode = (lang !== 'off' && track.language === lang) ? 'showing' : 'disabled';
	}
};

/* Media Invoker Commands polyfill — <button command commandfor> over <video>/<audio>
 * (proposed play-pause · play · pause · toggle-muted). Auto-disables once browsers ship
 * native support. --track-<lang> is a custom command, always handled here. */
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
		if (cmd.startsWith('--track-')) { setTextTrack(el, btn); return; }
		if (nativeMediaCommands || !MEDIA_COMMANDS.has(cmd)) return;
		if (cmd === 'toggle-muted') { el.muted = !el.muted; return; }
		if (cmd === 'pause' || (cmd === 'play-pause' && !el.paused)) el.pause();
		else el.play()?.catch?.(() => {});
	});
}

function setTextTrack(video, btn) {
	const id = btn.getAttribute('commandfor');
	showTrack(video, btn.getAttribute('command').slice('--track-'.length));
	const scope = btn.closest('[data-track-group]') || document;
	for (const b of scope.querySelectorAll(`button[command^="--track-"][commandfor="${id}"]`)) {
		b.setAttribute('aria-pressed', String(b === btn));
	}
}

/* Light-embed facades. An authored [data-preview] poster/loop shows with JS off; the real
 * player is an SSR'd lazy <iframe> or <video preload="none"> behind it, or (pure API flow)
 * gets injected on click. */
export function initEmbeds(frames) {
	for (const media of frames) {
		if (media.dataset.uiEmbed) continue;
		media.dataset.uiEmbed = '1';

		const provider = media.getAttribute('provider');
		const id = media.getAttribute('video');
		const src = media.getAttribute('src');   // direct file URL → native path

		// no authored facade → inject a platform thumbnail
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

		const facadeStill = () =>
			media.querySelector(':scope > [data-preview]')?.getAttribute('poster')
			|| media.querySelector(':scope > img')?.getAttribute('src')
			|| null;
		const dropPreview = () => {
			media.querySelector(':scope > img')?.remove();
			media.querySelector(':scope > [data-preview]')?.remove();
		};

		// SSR'd real player already in the markup
		const realVideo = media.querySelector(':scope > video:not([data-preview])');
		const realIframe = media.querySelector(':scope > iframe');

		// native <video>: driven declaratively via command="play-pause" — only mirror state
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
			// the <video data-preview> uses <source> (no src attr) — a real player has src / is an iframe
			if (media.querySelector(':scope > iframe, :scope > video[src]:not([data-preview])')) return;

			// vimeo native — a direct file URL becomes a real <video> we keep controlling
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
				dropPreview();
				bindVideo(play, video);
				return;
			}

			// youtube / vimeo — hand off to the platform iframe player
			if (!id) return;
			const iframe = document.createElement('iframe');
			iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
			iframe.setAttribute('allowfullscreen', '');
			iframe.title = media.getAttribute('data-title') || (provider === 'vimeo' ? 'Vimeo video player' : 'YouTube video player');
			iframe.src = provider === 'vimeo'
				? `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1`
				: `${YT_ORIGIN}/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`;
			media.appendChild(iframe);
			dropPreview();
			reflectPlay(play, true);
			play.hidden = true;
		});
	}
}

/* Player tools — vid(pip) / vid(fls) / vid(cc) inject a <menu class="ui-media-tools">
 * with real buttons (fullscreen targets the frame so overlays stay visible; PiP is
 * feature-detected). media.css owns glyphs + styling. */
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

// CC switcher: authored <select class="ui-media-cc"> → textTrack.mode (JS-only, no declarative switch)
function wireCcSelect(select, frame) {
	const getVideo = () => frame.querySelector(':scope > video:not([data-preview])') || frame.querySelector('video');
	const apply = () => {
		const v = getVideo();
		if (v) showTrack(v, select.value);
	};
	select.addEventListener('change', apply);
	apply();
}

export function initVideoTools(frames) {
	for (const frame of frames) {
		if (frame.dataset.uiTools) continue;
		frame.dataset.uiTools = '1';

		const m = mediaStr(frame);
		const vid = frame.getAttribute('vid') || '';
		const wantPip = /vid\(pip\)/.test(m) || /\bpip\b/.test(vid);
		const wantFls = /vid\(fls\)/.test(m) || /\bfls\b/.test(vid);
		const wantCc = /vid\(cc\)/.test(m) || /\bcc\b/.test(vid);
		if (!wantPip && !wantFls && !wantCc) continue;
		// need a <video> — now, or later once a provider facade swaps one in on play
		if (!frame.querySelector('video') && !frame.hasAttribute('provider')) continue;

		let menu = frame.querySelector(':scope > .ui-media-tools');
		if (!menu) {
			menu = document.createElement('menu');
			menu.className = 'ui-media-tools';
			frame.appendChild(menu);
		}
		// CC (leftmost) → PiP → fullscreen (rightmost)
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

// Solo play — starting one audible video/audio pauses the others (capture: play doesn't bubble)
let soloBound = false;
export function initSolo(root = document) {
	if (root === document) {
		if (soloBound) return;
		soloBound = true;
	}
	root.addEventListener('play', (e) => {
		const el = e.target;
		if (el.tagName !== 'VIDEO' && el.tagName !== 'AUDIO') return;
		if (isDecoration(el)) return;
		for (const v of root.querySelectorAll('video, audio')) {
			if (v !== el && !v.paused && !isDecoration(v)) v.pause();
		}
	}, true);
}

// Opt-in tracking for <video data-track="label">: play · pause · complete · quartiles
export function initVideoTracking(videos) {
	for (const v of videos) {
		if (v.dataset.uiTrack) continue;
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

const EMBED_SEL = 'ui-media[provider]';
const VIDTOOLS_SEL = ['ui-media[media*="vid("]', '[media*="vid("] ui-media', 'ui-media[vid]'].join(', ');

export function scanVideo() {
	initSolo();
	initMediaCommands();
	initEmbeds(document.querySelectorAll(EMBED_SEL));
	initVideoPlay(videoPlayNodes());
	initVideoTools(document.querySelectorAll(VIDTOOLS_SEL));
	initVideoTracking(document.querySelectorAll('video[data-track]'));
}

onIdle(scanVideo);

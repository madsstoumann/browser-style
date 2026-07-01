/**
 * YouTube lite-embed controller
 *
 * The frame is a <ui-media> — it owns aspect-ratio, radius, the absolute media fill
 * (img/video/iframe) and the 3×3 furniture grid that positions the <ui-play> control.
 * This module adds ONLY the behaviour a facade needs: on the first play command it
 * swaps the poster for the real YouTube iframe (deferred until interaction), then hands
 * off to YouTube's own player controls.
 *
 *   <ui-media id="promo" provider="youtube" video="VIDEO_ID" media="asr(16/9) play(cc) rds(md)">
 *     <ui-play variant="youtube" size="xl">
 *       <button type="button" command="--toggle-play" commandfor="promo" aria-label="Play video">
 *         <ui-icon type="play-pause"></ui-icon>
 *       </button>
 *     </ui-play>
 *   </ui-media>
 *
 * `provider="youtube"` + `video="ID"` are the only embed attributes; a poster <img> is
 * auto-added from the video id if you don't supply one. Driven by the native Invoker
 * Commands API: the <ui-play> button targets the <ui-media> via `commandfor`. The
 * CommandEvent does not bubble, so we listen in the capture phase. Import for the side
 * effect (auto-inits once), or call initVideoEmbeds() yourself.
 * @version 2.1.0
 */

const YT_ORIGIN = 'https://www.youtube-nocookie.com';
const poster = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Give each youtube frame a poster if the author didn't (we know the id).
function hydrate(root) {
	for (const media of root.querySelectorAll('[provider="youtube"][video]')) {
		if (media.querySelector(':scope > img, :scope > iframe')) continue;
		const img = document.createElement('img');
		img.loading = 'lazy';
		img.src = poster(media.getAttribute('video'));
		img.alt = '';
		media.prepend(img);
	}
}

function onCommand(event) {
	const command = event.command ?? event.detail?.command;
	if (command !== '--toggle-play' && command !== '--play') return;

	const media = event.target.closest?.('[provider="youtube"]');
	if (!media || media.querySelector(':scope > iframe')) return;   // no target / already loaded

	const id = media.getAttribute('video');
	if (!id) return;

	const iframe = document.createElement('iframe');
	iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
	iframe.setAttribute('allowfullscreen', '');
	iframe.title = media.getAttribute('data-title') || 'YouTube video player';
	iframe.src = `${YT_ORIGIN}/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`;
	media.appendChild(iframe);

	// Drop the facade: poster gone, control handed off to the player.
	media.querySelector(':scope > img')?.remove();
	const play = media.querySelector(':scope > ui-play');
	if (play) { play.playing = true; play.hidden = true; }
}

let inited = false;

export function initVideoEmbeds(root = document) {
	hydrate(root);
	if (root === document) {
		if (inited) return;
		inited = true;
	}
	root.addEventListener('command', onCommand, true);   // capture: CommandEvent doesn't bubble
	return () => root.removeEventListener('command', onCommand, true);
}

// Auto-init for the common case.
initVideoEmbeds();

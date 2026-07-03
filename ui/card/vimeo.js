/**
 * Vimeo helpers for <ui-media> — normalize the Vimeo API video object into the
 * poster + source(s) a `provider="vimeo"` frame needs, fetch it, and loop a short
 * "gif-like" preview segment. See vimeo.md for the API details and field list.
 *
 * SECURITY: fetchVimeo() needs a Vimeo access token — a SERVER-SIDE secret. Never
 * ship it to the browser. Progressive/HLS links are SIGNED and EXPIRE (~24h), so
 * resolve them at render time on the server and inject fresh URLs into the markup.
 * normalizeVimeo() and loopSegment() are pure/client-safe (no token).
 */

// Only the fields <ui-media> needs — keeps the response small.
export const VIMEO_FIELDS =
	'uri,name,duration,width,height,pictures.sizes,play.progressive,play.hls,files';

/**
 * Turn a raw Vimeo video object into a flat, render-ready shape.
 * Accepts the object from GET /videos/{id} (or an item of /me/videos data[]).
 *
 * @returns {{
 *   id:string|null, name:string, duration:number, width:number, height:number,
 *   poster:string|null, posters:{width:number,height:number,link:string}[],
 *   src:string|null, renditions:{width:number,height:number,link:string}[],
 *   hls:string|null, hlsExpires:string|null
 * }}
 */
export function normalizeVimeo(video = {}) {
	const id = (video.uri || '').split('/').pop() || null;

	// Posters — pictures.sizes, ascending; largest last.
	const posters = ((video.pictures && video.pictures.sizes) || [])
		.filter(s => s && s.link)
		.map(s => ({ width: s.width, height: s.height, link: s.link }))
		.sort((a, b) => a.width - b.width);

	// Renditions — prefer play.progressive; fall back to the legacy files[] (mp4 only).
	const prog = (video.play && video.play.progressive) || [];
	const fromPlay = prog
		.filter(p => p && p.link)
		.map(p => ({ width: p.width, height: p.height, link: p.link }));
	const fromFiles = (video.files || [])
		.filter(f => f && f.link && f.type === 'video/mp4' && f.height)
		.map(f => ({ width: f.width, height: f.height, link: f.link }));
	const renditions = (fromPlay.length ? fromPlay : fromFiles)
		.sort((a, b) => a.height - b.height);

	return {
		id,
		name: video.name || '',
		duration: video.duration || 0,
		width: video.width || 0,
		height: video.height || 0,
		poster: posters.length ? posters[posters.length - 1].link : null,
		posters,
		src: renditions.length ? renditions[renditions.length - 1].link : null, // highest by default
		renditions,
		hls: (video.play && video.play.hls && video.play.hls.link) || null,
		hlsExpires: (video.play && video.play.hls && video.play.hls.link_expiration_time) || null,
	};
}

/** Pick the smallest rendition at or above a target height (for lightweight previews). */
export function pickRendition(norm, maxHeight = Infinity) {
	const under = norm.renditions.filter(r => r.height <= maxHeight);
	return (under.length ? under[under.length - 1] : norm.renditions[0]) || null;
}

/**
 * Fetch + normalize a video, SERVER-SIDE (token required). Pass a fetch implementation
 * (global fetch on Node 18+/workers). Never call this from the browser with a real token.
 */
export async function fetchVimeo(id, token, fetchImpl = globalThis.fetch) {
	if (!token) throw new Error('fetchVimeo: a server-side Vimeo access token is required');
	const res = await fetchImpl(`https://api.vimeo.com/videos/${encodeURIComponent(id)}?fields=${VIMEO_FIELDS}`, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.vimeo.*+json;version=3.4' },
	});
	if (!res.ok) throw new Error(`Vimeo API ${res.status} for video ${id}`);
	return normalizeVimeo(await res.json());
}

/** Build the attributes for a native <ui-media provider="vimeo"> frame from a normalized object. */
export function toUiMediaAttrs(norm, { maxHeight = 1080 } = {}) {
	const r = pickRendition(norm, maxHeight);
	return { provider: 'vimeo', src: r ? r.link : norm.src, poster: norm.poster };
}

/**
 * Loop a short sub-range of a <video> — the "gif-like" preview effect without a GIF.
 * Clamps playback to [start, end] and restarts, so a 22s clip previews as a 2s loop.
 * Returns a cleanup function. Client-side.
 */
export function loopSegment(video, start = 0, end = 2) {
	if (!video) return () => {};
	const restart = () => {
		try { video.currentTime = start; } catch { /* not seekable yet */ }
		const p = video.play?.();
		if (p && typeof p.catch === 'function') p.catch(() => {});
	};
	// Clamp during playback…
	const onTime = () => { if (video.currentTime >= end || video.currentTime < start) restart(); };
	// …and re-loop if the media-fragment end makes the browser stop instead of loop.
	const onMeta = () => restart();
	video.addEventListener('timeupdate', onTime);
	video.addEventListener('loadedmetadata', onMeta);
	video.addEventListener('ended', restart);
	video.addEventListener('pause', onTime);   // some engines pause at the fragment end
	restart();
	return () => {
		video.removeEventListener('timeupdate', onTime);
		video.removeEventListener('loadedmetadata', onMeta);
		video.removeEventListener('ended', restart);
		video.removeEventListener('pause', onTime);
	};
}

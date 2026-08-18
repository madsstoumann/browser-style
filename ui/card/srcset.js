/**
 * Lean, dependency-free Cloudflare Image Resizing srcset builder.
 *
 * Produces root-relative `/cdn-cgi/image/...` URLs that work on the deployed
 * Cloudflare zone (browser.style) and degrade to the plain `src` everywhere
 * else. No hardcoded domain, no `new URL()` (which throws on root-relative
 * paths and would emit a double slash).
 */

/**
 * Build one Cloudflare transform URL for a root-relative (or relative) src.
 * @param {string} src - e.g. "/assets/images/foo.png"
 * @param {{format?:string, quality?:number, fit?:string, width?:number, height?:number}} t
 * @param {string} [base] - optional absolute origin (e.g. "https://v4.browser.style") for hosts off the zone
 * @returns {string} e.g. "/cdn-cgi/image/format=avif,quality=80,fit=cover,width=480,height=270/assets/images/foo.png"
 */
export function buildCfUrl(src, t, base = '') {
	const params = ['format', 'quality', 'fit', 'width', 'height']
		.filter(k => t[k] != null)
		.map(k => `${k}=${t[k]}`)
		.join(',');
	if (!params) return src;
	const path = src.startsWith('/') ? src : `/${src}`; // single leading slash, no domain
	return `${base}/cdn-cgi/image/${params}${path}`;
}

/**
 * Largest ladder rung an original can fill without being upscaled.
 * Cloudflare's fit=cover does NOT decline an oversized request — it manufactures the
 * pixels, so a 509px original asked for width=1200 returns 1200x900 at ~4x the bytes.
 * With a ratio BOTH axes bind: a 1440x960 original cropped to 4/3 tops out at 1280.
 * @param {[number,number]|null|undefined} intrinsic - [width, height] of the source
 * @param {number|null} [ratio] - width/height of the frame, when asr() fixes one
 * @returns {number} the cap in CSS px, or Infinity when the source size is unknown
 */
export function maxUsableWidth(intrinsic, ratio) {
	const [w, h] = intrinsic || [];
	if (!w || !h) return Infinity;
	return ratio ? Math.min(w, Math.floor(h * ratio)) : w;
}

/**
 * Build a full responsive srcset string.
 * @param {string} src
 * @param {{breakpoints:number[], format?:string, quality?:number, fit?:string, ratio?:number|null, base?:string, intrinsic?:[number,number]}} opts
 *        ratio = width/height from an asr() token (e.g. 16/9). null => preserve natural ratio.
 *        intrinsic = [width, height] of the ORIGINAL; rungs above it are dropped.
 * @returns {string|null} "url 240w, url 320w, ..." or null when inputs are invalid, or
 *          when the original cannot fill even the narrowest rung (plain src is smaller).
 */
export function buildSrcset(src, { breakpoints, format, quality, fit, ratio, base, intrinsic }) {
	if (!src || !breakpoints?.length) return null;
	const max = maxUsableWidth(intrinsic, ratio);
	const rungs = breakpoints.filter(w => w <= max);
	if (!rungs.length) return null;
	return rungs
		.map(w => {
			const t = { format, quality, fit, width: w };
			if (ratio) t.height = Math.round(w / ratio);
			else delete t.fit; // no asr() => let Cloudflare keep the natural ratio
			return `${buildCfUrl(src, t, base)} ${w}w`;
		})
		.join(', ');
}

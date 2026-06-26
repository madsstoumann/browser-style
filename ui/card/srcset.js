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
 * @returns {string} e.g. "/cdn-cgi/image/format=avif,quality=80,fit=cover,width=480,height=270/assets/images/foo.png"
 */
export function buildCfUrl(src, t) {
	const params = ['format', 'quality', 'fit', 'width', 'height']
		.filter(k => t[k] != null)
		.map(k => `${k}=${t[k]}`)
		.join(',');
	if (!params) return src;
	const path = src.startsWith('/') ? src : `/${src}`; // single leading slash, no domain
	return `/cdn-cgi/image/${params}${path}`;
}

/**
 * Build a full responsive srcset string.
 * @param {string} src
 * @param {{breakpoints:number[], format?:string, quality?:number, fit?:string, ratio?:number|null}} opts
 *        ratio = width/height from an asr() token (e.g. 16/9). null => preserve natural ratio.
 * @returns {string|null} "url 240w, url 320w, ..." or null when inputs are invalid.
 */
export function buildSrcset(src, { breakpoints, format, quality, fit, ratio }) {
	if (!src || !breakpoints?.length) return null;
	return breakpoints
		.map(w => {
			const t = { format, quality, fit, width: w };
			if (ratio) t.height = Math.round(w / ratio);
			else delete t.fit; // no asr() => let Cloudflare keep the natural ratio
			return `${buildCfUrl(src, t)} ${w}w`;
		})
		.join(', ');
}

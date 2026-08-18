/* Serve the precompressed q11 sibling for /dist/* assets.
 *
 * WHY: Cloudflare Pages compresses dynamically at roughly brotli q4. Measured on the
 * deployed demo bundle: 64,028 B on the wire, where the same bytes at q11 are 50,082 B.
 * That is a flat ~22% off the render-blocking stylesheet for no CSS change at all.
 * scripts/hash-asset.js writes `<hashed>.br` next to every asset it hashes.
 * Docs: docs/performance-review.md § 1
 *
 * FAILS SAFE, in this order — every branch falls through to the normal static asset:
 *   - not a .css/.js request            -> next()
 *   - client did not offer `br`         -> next()   (never serve br to a client without it)
 *   - no .br sibling on disk            -> next()   (an un-hashed or new asset)
 *
 * TWO THINGS ONLY THE FUNCTION CAN DO. /_headers does NOT apply to Function responses,
 * so the immutable cache-control has to be restated here or these become uncacheable —
 * which would trade 14 kB for a Worker invocation on every load, a worse deal than doing
 * nothing. And `vary: accept-encoding` is mandatory: without it a cached br body can be
 * handed to a client that never asked for it, which renders as an unstyled page.
 *
 * The .br sibling is fetched through env.ASSETS, so it is served from the same static
 * store as everything else rather than being bundled into the Worker.
 */
export async function onRequestGet({ request, env, next }) {
	const url = new URL(request.url);
	if (!/\.(css|js)$/.test(url.pathname)) return next();
	if (!(request.headers.get('accept-encoding') || '').toLowerCase().includes('br')) return next();

	const pre = await env.ASSETS.fetch(new URL(`${url.pathname}.br`, url.origin));
	if (!pre.ok) return next();

	const headers = new Headers();
	headers.set('content-encoding', 'br');
	headers.set('content-type', url.pathname.endsWith('.css')
		? 'text/css; charset=utf-8'
		: 'text/javascript; charset=utf-8');
	/* the name is content-hashed, so a byte change is a new URL — see hash-asset.js */
	headers.set('cache-control', 'public, max-age=31536000, immutable');
	headers.set('vary', 'accept-encoding');
	return new Response(pre.body, { status: 200, headers });
}

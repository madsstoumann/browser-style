/**
 * Page-shell pieces shared by the SSR demo-page builders (articles/, products/).
 *
 * Extracted verbatim from articles/build.js when products/build.js needed the same
 * head, the same contrast overrides and the same descope rule — two copies of a page
 * convention drift, and the convention is the point.
 */

/* shared head fragment: bundle CSS + hotlink-safe referrer + srcset-origin preconnect.
   The ?v= token on the bundle is a cache key, not decoration — /dist/* is served with
   max-age=86400 + stale-while-revalidate=604800 (see /_headers) and the filename never
   changes, so without a new query a CSS change can stay invisible for up to 8 days at
   the browser AND the Cloudflare edge. BUMP IT when the bundle changes, here and in the
   26 hand-authored demo pages. */
export const HEAD_COMMON = `<link rel="stylesheet" href="/dist/demo.min.css?v=20260817">
	<!-- srcset uses absolute v4.browser.style CDN URLs; the zone's Hotlink Protection
	     403s any cross-origin Referer (pages.dev, localhost) — no-referrer passes -->
	<meta name="referrer" content="no-referrer">
	<link rel="preconnect" href="https://v4.browser.style">`;

/* page-scoped WCAG AA contrast overrides — same block as demo/schema.html */
export const CONTRAST_STYLE = `<style>
		:root {
			--color-link: light-dark(hsl(221, 100%, 44%), hsl(221, 70%, 70%));
			--color-accent: light-dark(hsl(211, 100%, 38%), hsl(211, 70%, 72%));
			--color-success: light-dark(hsl(136, 45%, 30%), hsl(136, 25%, 60%));
			--color-error: light-dark(hsl(360, 65%, 41%), hsl(360, 45%, 62%));
			--color-text-muted: light-dark(hsl(0, 0%, 42%), hsl(0, 0%, 65%));
		}
		ui-content { --ui-content-muted: color-mix(in oklab, currentColor 85%, transparent); }
		ui-chip[data-type] { --ui-chip-bg: hsl(0, 0%, 95%); --ui-chip-c: hsl(0, 0%, 13%); }
	</style>`;

/* names the render-blocking morph-target polyfill + the reduced-motion-safe transition */
export const VT_HEAD = `<!-- Names the morph targets where typed attr() is unsupported (Safari). MUST be
	     render-blocking in <head>: the incoming page is snapshotted at first paint,
	     so a deferred script names the targets too late and the forward morph
	     degrades to a cross-fade. Docs: ui/base/polyfills/readme.md -->
	<script type="module" src="/ui/base/polyfills/attr-fallback.js" blocking="render"></script>`;

export const CDN_BASE = 'https://v4.browser.style';

export const withPreset = (ucf, presetId) => ({
	...ucf,
	fields: { ...ucf.fields, preset: { $ref: `card-preset/${presetId}` } }
});

export const esc = (value) => String(value)
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ONE microdata scope on the page root — the bare-primitive renders each carry their
   own itemscope, which would split the page into partial items */
export const descope = (html) => html.replace(/ itemscope itemtype="https:\/\/schema\.org\/\w+"/, '');

/* Breadcrumb — `@browser.style/breadcrumbs` markup + BreadcrumbList microdata, the
   hand-authored (CSS-only) form so these pages need no extra script. `trail` is
   [{ name, url? }]; the LAST crumb is the current page and takes no url/`item`.
   Docs: ui/breadcrumbs/readme.md § Structured data */
export const breadcrumb = (trail) => `<nav aria-label="Breadcrumb">
		<ol data-breadcrumbs itemscope itemtype="https://schema.org/BreadcrumbList">
			${trail.map(({ name, url }, index) => `<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				${url ? `<a itemprop="item" href="${esc(url)}"><span itemprop="name">${esc(name)}</span></a>` : `<span itemprop="name">${esc(name)}</span>`}
				<meta itemprop="position" content="${index + 1}">
			</li>`).join('\n\t\t\t')}
		</ol>
	</nav>`;

/**
 * Page-shell pieces shared by the SSR demo-page builders (articles/, products/).
 *
 * Extracted verbatim from articles/build.js when products/build.js needed the same
 * head, the same contrast overrides and the same descope rule — two copies of a page
 * convention drift, and the convention is the point.
 */

/* shared head fragment: bundle CSS + hotlink-safe referrer + srcset-origin preconnect.
   The hash in the bundle filename is GENERATED — `npm run build:demo-css` rewrites this
   line along with the 26 hand-authored demo pages (scripts/hash-asset.js). Do not edit
   it by hand and do not replace it with a fixed name: /dist/* is immutable for a year,
   so a stable filename would let a shipped CSS change stay invisible behind a cached
   copy. This template is rewritten too because the articles/ and products/ builders
   emit it — miss it and the next build silently reverts five generated pages. */
export const HEAD_COMMON = `<link rel="stylesheet" href="/dist/demo.dc0283eb.min.css">
	<!-- no-referrer: the zone hotlink-protects CDN srcset. Docs: docs/performance.md -->
	<meta name="referrer" content="no-referrer">
	<link rel="preconnect" href="https://v4.browser.style">`;

/* AA muted ink + demo type-chip look. The --color-* overrides that used to live here
   were ported into ui/base/tokens.css on 2026-08-19 (light arms; dark arms deliberately
   not — docs/plans/open-items.md § 29.1a). Docs: ui/card/docs/schema.md */
export const CONTRAST_STYLE = `<style>
		ui-content { --ui-content-muted: color-mix(in oklab, currentColor 85%, transparent); }
		ui-chip[data-type] { --ui-chip-bg: hsl(0, 0%, 95%); --ui-chip-c: hsl(0, 0%, 13%); }
	</style>`;

/* names the render-blocking morph-target polyfill + the reduced-motion-safe transition */
export const VT_HEAD = `<!-- Names the morph targets where typed attr() is unsupported (Safari). MUST be
	     render-blocking in <head>: the incoming page is snapshotted at first paint,
	     so a deferred script names the targets too late and the forward morph
	     degrades to a cross-fade. Docs: ui/base/polyfills/readme.md -->
	<script type="module" src="/ui/base/polyfills/attr-fallback.min.js" blocking="render"></script>`;

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

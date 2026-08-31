/**
 * SSR build for the office detail page.
 *
 *   node ui/card/demo/offices/build.js
 *
 * Sibling of realestate/build.js and rentals/build.js, and deliberately the SIMPLEST of
 * them. Those pages are banded because their subject spans two scopes — a
 * RealEstateListing wrapping an Accommodation, a VacationRental that is Organization AND
 * Place — so each property has to be placed under the right element. An office is one
 * LocalBusiness: address, geo, hours and telephone are all its own, so ONE card states
 * every one of them exactly once and there is nothing to split.
 *
 * The frame is the single-point OpenStreetMap iframe, not <ui-map>: one office is one
 * pin, and docs/media.md § Map is explicit that a static point needs no element and no
 * JavaScript. <ui-map> earns its keep on the collection card, where clustering does.
 *
 * The page is the link target for every office row on demo/schema.html. All six rows
 * point here, which is a demo convenience — see the note in docs/schema.md § Places.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard } from '../../render.js';
import { CONTRAST_STYLE, HEAD_COMMON, VT_HEAD, breadcrumb, descope, esc, phoneShell, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));
const local = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

const ucf = local('copenhagen.json');
const VIEW = 'office-copenhagen';
const TITLE = `${ucf.fields.headline} studio`;

/* the card carries the whole LocalBusiness: map frame, address, hours, telephone and the
   "Open in Maps" CTA. descope() strips its itemscope so the <article> below owns it —
   one scope per subject, exactly as the sibling pages do. */
const officeCard = renderCard(withPreset(ucf, 'office-page'), presets, undefined, {});

/* Page-only prose. schemaType `content` and no itemprop: the card's summary already
   carries itemprop="description", so this copy stays unmarked and the property is
   stated once. Same split as the real-estate page's "About the home". */
const proseCard = descope(renderCard(
	withPreset({ ...ucf, fields: {
		schemaType: 'content',
		/* PLAIN TEXT, split into paragraphs on blank lines. bodyHtml() escapes everything
		   but <b>/<ui-gradient-text>/<high-light> — this engine never emits raw markup. */
		body: 'The studio sits at the end of the quay, five minutes from Nordhavn station. Reception is on the ground floor; ring the bell marked <b>Studio</b> and someone will come down.\n\nVisitors are welcome during opening hours. If you are coming for a workshop, bring a laptop — we supply everything else, including more coffee than is strictly advisable.'
	} }, 'prose'),
	presets, undefined, {}
)).replace(/^(<ui-content[^>]*>)/, '$1<h2 data-part="headline">Visiting</h2>');

const page = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(TITLE)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="text-scale" content="scale">
	<meta name="description" content="${esc(ucf.fields.summary)}">
	${HEAD_COMMON}
	${VT_HEAD}
	<style>
		body { margin-inline: auto; max-inline-size: 64rem; }
		.office-view { margin-block-end: var(--spacing-2xl); }
		.office-view > lay-out { margin-block-start: var(--spacing-xl); }${phoneShell('.office-view > ui-card')}
	</style>
	${CONTRAST_STYLE}
</head>
<body>
	${breadcrumb([
		{ name: 'Card', url: '/ui/card/' },
		{ name: 'Schema.org', url: '/ui/card/demo/schema.html' },
		{ name: TITLE }
	])}
	<main>
		<article class="office-view" data-view="card-${VIEW}" itemscope itemtype="https://schema.org/LocalBusiness">
			<link itemprop="mainEntityOfPage" href="copenhagen.html">
			${descope(officeCard)}
			<lay-out lg="ratio(60:40) items(start)">
				${proseCard}
			</lay-out>
		</article>
	</main>
</body>
</html>
`;

mkdirSync(here, { recursive: true });
const out = join(here, 'copenhagen.html');
writeFileSync(out, page);
console.log(`offices/copenhagen.html ← demo/offices/copenhagen.json (${ucf.id})`);

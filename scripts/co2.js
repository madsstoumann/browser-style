/* Transfer weight, requests and a CO2e estimate from a Lighthouse JSON.
 *
 *   node scripts/co2.js <lh.json> [<lh.json> …] [--grey]
 *   node scripts/co2.js --bytes <n> [--grey]
 *
 * WHY: the W3C Web Sustainability Guidelines (3.1, 5.24) ask for a performance and
 * environmental BUDGET but give no number. This script turns the Lighthouse JSON that the
 * perf-pass skill already produces into the numbers the budget is written in — transfer KB,
 * request count, third-party KB — plus the Sustainable Web Design (SWD) model v4 estimate and
 * its Digital Carbon Rating letter, so a page can be compared with the tiers in
 * docs/sustainability.md § 2. KB is the gate; grams are an estimate and report-only.
 *
 * Model — SWD v4, constants pinned from https://sustainablewebdesign.org/estimating-digital-emissions/
 * (kWh per GB, operational + embodied, per segment; global grid 494 gCO2e/kWh) and the rating
 * thresholds from https://sustainablewebdesign.org/digital-carbon-ratings/ (HTTP Archive
 * 2023-06 percentiles). Cross-checked against CO2.js 0.19.0 (`@tgwf/co2`,
 * src/sustainable-web-design-v4.js): perVisit defaults are 100% first visits, 0% returning,
 * so per-visit = first-visit emissions; `green` sets the hosting factor to 1 and zeroes the
 * data-centre OPERATIONAL term only. Grey, all segments: 0.300 kWh/GB × 494 = 148.2 g per GB,
 * which reproduces the published table (531.15 KB → 0.079 g). GB is decimal (1000³), as in
 * CO2.js. Not a dependency on purpose — ~20 lines of arithmetic; model drift is a
 * docs/sustainability.md § 5 re-check trigger, verified 2026-09-04.
 *
 * Green defaults ON: v4.browser.style is on Cloudflare, a Green Web Foundation listed provider
 * (api.thegreenwebfoundation.org/greencheck/v4.browser.style, checked 2026-09-04). `--grey`
 * prints the comparable grey figure — the ratings table itself is grey.
 *
 * Reads: audits['total-byte-weight'] (transfer bytes, compressed), audits['network-requests']
 * (count), audits['resource-summary'] (bytes by type incl. the third-party bucket). All three
 * are performance-category audits, so `--only-categories=performance` output is enough.
 * Weight must come from a run against v4.browser.style — the image transforms 404 on pages.dev.
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SWD_V4 = {
	opDataCenter: 0.055, emDataCenter: 0.012,
	opNetwork: 0.059, emNetwork: 0.013,
	opDevice: 0.080, emDevice: 0.081,
	gridIntensity: 494,
};

/* Digital Carbon Ratings, SWD v4 — grams per page view and the percentile transfer size behind it */
const RATINGS = [
	{ letter: 'A+', g: 0.040, kb: 272.51 },
	{ letter: 'A', g: 0.079, kb: 531.15 },
	{ letter: 'B', g: 0.145, kb: 975.85 },
	{ letter: 'C', g: 0.209, kb: 1410.39 },
	{ letter: 'D', g: 0.278, kb: 1875.01 },
	{ letter: 'E', g: 0.359, kb: 2419.56 },
];

const GB = 1000 ** 3;

export function gramsPerVisit(bytes, green = true) {
	const gb = bytes / GB;
	const factor = green ? 1 : 0;
	const kwh = gb * (SWD_V4.opDataCenter * (1 - factor) + SWD_V4.emDataCenter
		+ SWD_V4.opNetwork + SWD_V4.emNetwork
		+ SWD_V4.opDevice + SWD_V4.emDevice);
	return kwh * SWD_V4.gridIntensity;
}

export const ratingFor = g => (RATINGS.find(r => g <= r.g) ?? { letter: 'F' }).letter;
export const tierFor = kb => (RATINGS.find(r => kb <= r.kb) ?? { letter: 'F' }).letter;

function fromLighthouse(path) {
	const lh = JSON.parse(readFileSync(path, 'utf8'));
	const a = lh.audits ?? {};
	const bytes = a['total-byte-weight']?.numericValue ?? 0;
	const requests = a['network-requests']?.details?.items?.length ?? 0;
	const summary = a['resource-summary']?.details?.items ?? [];
	const byType = Object.fromEntries(summary.map(i => [i.resourceType, i.transferSize]));
	return {
		name: basename(path, '.json'),
		url: lh.finalDisplayedUrl ?? lh.finalUrl ?? '',
		formFactor: lh.configSettings?.formFactor ?? '',
		fetched: (lh.fetchTime ?? '').slice(0, 10),
		bytes, requests,
		thirdParty: byType['third-party'] ?? 0,
		byType,
	};
}

const kb = b => (b / 1000).toFixed(1);
const g = v => v.toFixed(3);

function report(page, grey) {
	const green = gramsPerVisit(page.bytes, true);
	const greyG = gramsPerVisit(page.bytes, false);
	const tier = tierFor(page.bytes / 1000);
	const budget = RATINGS[1]; // A — the component-demo gate, docs/sustainability.md § 2
	const over = page.bytes / 1000 - budget.kb;
	const lines = [
		`${page.name}${page.url ? '  ' + page.url : ''}${page.formFactor ? '  (' + page.formFactor + (page.fetched ? ', ' + page.fetched : '') + ')' : ''}`,
		`  transfer      ${kb(page.bytes).padStart(9)} KB   (${page.bytes} B)`,
		`  requests      ${String(page.requests).padStart(9)}`,
		`  third-party   ${kb(page.thirdParty).padStart(9)} KB`,
	];
	const types = Object.entries(page.byType).filter(([t]) => t !== 'total' && t !== 'third-party' && page.byType[t] > 0)
		.sort((x, y) => y[1] - x[1]).map(([t, b]) => `${t} ${kb(b)}`).join(', ');
	if (types) lines.push(`  by type       ${types} KB`);
	lines.push(`  gCO2e/view    ${g(green).padStart(9)}   green host (SWD v4)${grey ? `   grey ${g(greyG)}` : ''}`);
	lines.push(`  rating        ${ratingFor(grey ? greyG : green).padStart(9)}   ${grey ? 'grey' : 'green'} figure; KB tier ${tier}`);
	lines.push(`  budget A      ${(over <= 0 ? 'PASS' : 'OVER').padStart(9)}   ${over <= 0 ? `${kb(-over * 1000)} KB under` : `${kb(over * 1000)} KB over`} the ${budget.kb} KB line`);
	return lines.join('\n');
}

function tableRow(page) {
	const green = gramsPerVisit(page.bytes, true);
	return `| \`${page.name}\` | ${kb(page.bytes)} | ${page.requests} | ${kb(page.thirdParty)} | ${g(green)} | ${ratingFor(green)} | ${tierFor(page.bytes / 1000)} | ${page.fetched} |`;
}

const args = process.argv.slice(2);
const grey = args.includes('--grey');
const bytesFlag = args.indexOf('--bytes');

if (bytesFlag !== -1) {
	const bytes = Number(args[bytesFlag + 1]);
	if (!Number.isFinite(bytes)) { console.error('--bytes needs a number'); process.exit(1); }
	console.log(report({ name: `${bytes} bytes`, bytes, requests: 0, thirdParty: 0, byType: {} }, grey));
} else {
	const files = args.filter(x => !x.startsWith('--'));
	if (!files.length) { console.error('usage: node scripts/co2.js <lh.json> [<lh.json> …] [--grey] | --bytes <n> [--grey]'); process.exit(1); }
	const pages = files.map(fromLighthouse);
	if (pages.length === 1) {
		console.log(report(pages[0], grey));
	} else {
		console.log('| Page | Transfer KB | Requests | Third-party KB | gCO2e (green) | Rating | KB tier | Measured |');
		console.log('|---|---|---|---|---|---|---|---|');
		for (const p of pages) console.log(tableRow(p));
	}
}

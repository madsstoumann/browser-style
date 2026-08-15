/* Transcription gate — diffs render.js output against the hand-authored reference
 * markup in demo/schema.html, card by card.
 *
 * demo/schema.html is the SPECIFICATION for the markup-first types (docs/schema.md
 * § Types authored markup-first): the markup was written and validated against the
 * schema.org vocabulary first, and render.js was written to reproduce it. This script
 * is what makes "reproduces it" a checkable claim rather than an eyeballed one — an
 * earlier transcription in this workstream shipped a wrong price that only a
 * comparator caught, and a currency NBSP that only a byte-exact one caught.
 *
 *   node ui/card/schema.compare.js            # every mapped pair
 *   node ui/card/schema.compare.js TVSeries   # one type
 *   node ui/card/schema.compare.js --raw      # without the H2 normalisation below
 *
 * THREE declared canonicalisations, applied to BOTH sides. Each is a PAGE convention
 * that pre-dates these types and holds for every card, and each was demonstrated on
 * already-transcribed cards (movie and how-to reduce to an exact match under them)
 * before being trusted:
 *
 *   H1  media= hoist       the page writes media= on <ui-card>; the renderer emits it
 *                          on the <ui-media> it configures. Moved back down.
 *   H2  machine-meta hoist the page places the <meta>/hidden-scope block ABOVE the
 *                          eyebrow; the renderer emits it after the summary, because
 *                          DETAILS runs after the envelope and has no reorder hook.
 *                          Partitioned to the front of <ui-content>, then SORTED:
 *                          microdata gives sibling order no meaning, so two orderings
 *                          of the same machine block extract identically and a diff
 *                          between them is a false positive. Visible nodes keep their
 *                          order, where sequence is the reading order and does matter.
 *   H3  root identity      id= / data-view= on the <ui-card> root are page-authoring
 *                          hooks — anchor targets, view-transition names, and the
 *                          selector this script uses to tell two cards of one type
 *                          apart. The renderer never emits either on the root, so
 *                          both are dropped. Nothing inside the card is touched.
 *
 * Everything else — itemtypes, itemprops, nesting, order, attribute values, and the
 * difference between U+0020 and U+00A0 — is a real difference and is reported.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv.find((a) => a.startsWith('--root='))?.slice(7) || '.';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--root='));
const raw = args.includes('--raw');
const only = args.find((a) => !a.startsWith('--'));

const { renderCard } = await import(join(process.cwd(), root, 'ui/card/render.js'));
const load = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const presets = { ...load('ui/card/data/card.presets.json').presets, ...load('ui/card/data/card.presets.demo.json').presets };
const page = readFileSync(join(root, 'ui/card/demo/schema.html'), 'utf8');

/* the same render options demo/render.html uses — srcset on, type chip on */
const images = { cdnBase: 'https://v4.browser.style', sizes: '(min-width: 540px) min(50vw, 512px), 100vw' };

/* itemtype → the data instance that must reproduce it */
const PAIRS = [
	['MemberProgram', 'ui/card/data/loyalty.json'],
	['Quiz', 'ui/card/data/quiz.json'],
	/* the graded sibling — two Quiz cards on the page, so this one matches by id */
	['Quiz#schema-quiz-mc', 'ui/card/data/quiz-mc.json'],
	/* the third Quiz shape: one flashcard as a <ui-reveal> flip card, question front,
	   answer back — the page's only reveal, so the host name is the disambiguator */
	['ui-reveal:Quiz', 'ui/card/data/quiz-flashcard.json'],
	['Service', 'ui/card/data/service.json'],
	['RealEstateListing', 'ui/card/data/realestate.json'],
	['Menu', 'ui/card/data/menu.json'],
	['TVSeries', 'ui/card/data/tvseries.json'],
	['TVEpisode', 'ui/card/data/tvepisode.json'],
	['MedicalWebPage', 'ui/card/data/medical.json'],
	['MusicAlbum', 'ui/card/data/music.json'],
	['DefinedTermSet', 'ui/card/data/glossary.json'],
	['PodcastSeries', 'ui/card/data/podcastseries.json'],
	/* only one ComicSeries on the page, but it still matches by id: the bare form requires
	   a card with NO id=, and this one's id is the artist card's link target */
	['ComicSeries#schema-comicseries', 'ui/card/data/comicseries.json'],
	/* the second Person card — `profile` is the first and is matched bare below, so the
	   artist has to be matched by id, same as the map's second Place */
	['Person#schema-artist', 'ui/card/data/artist.json'],
	/* two Observation cards on the page; this is the first (no id) */
	['Observation', 'ui/card/data/statistic.json'],
	/* the four cards that had drifted from renderer output — pairing them is what
	   keeps "the page is the markup render.js reproduces" true for them too */
	['ContactPoint', 'ui/card/data/contact.json'],
	['Course', 'ui/card/data/course.json'],
	['Place', 'ui/card/data/location.json'],
	/* the second Place card — the map frame; matched by id, so the pair above still
	   resolves to the id-less Hammershus card */
	['Place#schema-map', 'ui/card/data/map.json'],
	['SocialMediaPosting', 'ui/card/data/social.json'],
	/* the job card carries EmployerAggregateRating as a second top-level item; the
	   three residual diffs on this pair are older data/renderer divergences (a full
	   ISO datePosted, industry on the eyebrow, the published dateline row) */
	['JobPosting', 'ui/card/data/job.json']
];

/* ── minimal HTML tree parser ── */
const VOID = new Set(['meta', 'img', 'input', 'br', 'hr', 'source', 'link', 'area', 'col', 'embed', 'param', 'track', 'wbr']);
const TAG = /<(\/?)([a-zA-Z][-a-zA-Z0-9]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?)>/g;
const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
/* NOT \s: U+00A0 is significant — Intl puts one between a currency code and its amount */
const WS = /[ \t\n\r\f\v]+/g;

const parseAttrs = (rawAttrs) => {
	const out = [];
	ATTR.lastIndex = 0;
	let m;
	while ((m = ATTR.exec(rawAttrs || ''))) {
		if (!m[1]) break;
		out.push([m[1], m[2] ?? m[3] ?? m[4] ?? null]);
	}
	return out;
};

function parse(html) {
	const root_ = { tag: '#root', attrs: [], children: [] };
	const stack = [root_];
	let pos = 0, m;
	TAG.lastIndex = 0;
	const text = (s) => {
		const t = s.replace(WS, ' ').replace(/^ | $/g, '');
		if (t) stack.at(-1).children.push({ text: t });
	};
	while ((m = TAG.exec(html))) {
		text(html.slice(pos, m.index));
		pos = m.index + m[0].length;
		const [, close, tag, attrRaw, selfClose] = m;
		const name = tag.toLowerCase();
		if (close) {
			for (let i = stack.length - 1; i > 0; i--)
				if (stack[i].tag === name) { stack.length = i; break; }
		} else {
			const node = { tag: name, attrs: parseAttrs(attrRaw), children: [] };
			stack.at(-1).children.push(node);
			if (!VOID.has(name) && !selfClose) stack.push(node);
		}
	}
	text(html.slice(pos));
	return root_;
}

const hasAttr = (node, name) => !!node.attrs?.some(([k]) => k === name);
const walk = (node, fn) => { fn(node); for (const c of node.children || []) if (c.children) walk(c, fn); };

/* H1 */
function hoistMedia(tree) {
	walk(tree, (n) => {
		if (n.tag !== 'ui-card' && n.tag !== 'ui-reveal') return;
		const i = n.attrs.findIndex(([k]) => k === 'media');
		if (i < 0) return;
		const [, value] = n.attrs.splice(i, 1)[0];
		let target = null;
		walk(n, (c) => { if (!target && c.tag === 'ui-media') target = c; });
		if (target && !hasAttr(target, 'media')) target.attrs.unshift(['media', value]);
	});
	return tree;
}

/* H3 — page-authoring identity on the card root, never renderer output */
const ROOT_IDENTITY = new Set(['id', 'data-view']);
function dropRootIdentity(tree) {
	walk(tree, (n) => {
		if (n.tag === 'ui-card' || n.tag === 'ui-reveal') n.attrs = n.attrs.filter(([k]) => !ROOT_IDENTITY.has(k));
	});
	return tree;
}

/* H2 */
const isMachine = (n) => n.tag && (n.tag === 'meta' || hasAttr(n, 'hidden'));
const getAttr = (node, name) => node.attrs?.find(([k]) => k === name)?.[1] ?? '';
/* a machine node's identity is what it asserts, never where it sits among its siblings */
const machineKey = (n) => JSON.stringify([n.tag, getAttr(n, 'itemprop'), getAttr(n, 'content')]);
function hoistMachineMetas(tree) {
	walk(tree, (n) => {
		if (n.tag !== 'ui-content') return;
		const machine = n.children.filter(isMachine).sort((a, b) => (machineKey(a) < machineKey(b) ? -1 : machineKey(a) > machineKey(b) ? 1 : 0));
		n.children = [...machine, ...n.children.filter((c) => !isMachine(c))];
	});
	return tree;
}

/* canonical lines — attributes sorted, so declaration order is not the test */
function serialise(node, out = [], depth = 0) {
	for (const c of node.children || []) {
		if (c.text !== undefined) { out.push(`${'  '.repeat(depth)}"${c.text}"`); continue; }
		const attrs = [...c.attrs].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
			.map(([k, v]) => v === null ? k : `${k}="${v}"`).join(' ');
		out.push(`${'  '.repeat(depth)}<${c.tag}${attrs ? ' ' + attrs : ''}>`);
		if (c.children?.length) serialise(c, out, depth + 1);
	}
	return out;
}

const canon = (html) => {
	/* the page carries explanatory comments the renderer has no reason to emit */
	let tree = dropRootIdentity(hoistMedia(parse(html.replace(/<!--[\s\S]*?-->/g, ''))));
	if (!raw) tree = hoistMachineMetas(tree);
	return serialise(tree);
};

/* pull one <ui-card …itemtype="…/{type}"> … </ui-card> block off the page.
   `Type#id` disambiguates when the page carries more than one card of a type;
   `host:Type` names a non-default host (`ui-reveal:Quiz` — the flip flashcard, which
   shares its itemtype with two <ui-card> decks). */
function referenceCard(spec) {
	const [head, id] = spec.split('#');
	const [host, itemtype] = head.includes(':') ? head.split(':') : ['ui-card', head];
	const open = id
		? `<${host}[^>]*id="${id}"[^>]*itemtype="https://schema\\.org/${itemtype}"[^>]*>`
		: `<${host}(?![^>]*\\bid=)[^>]*itemtype="https://schema\\.org/${itemtype}"[^>]*>`;
	const m = new RegExp(open).exec(page);
	if (!m) throw new Error(`no reference card for ${spec}`);
	const tag = new RegExp(`</?${host}\\b[^>]*>`, 'g');
	tag.lastIndex = m.index;
	let depth = 0, t;
	while ((t = tag.exec(page)))
		if (t[0].startsWith('</')) { if (--depth === 0) return page.slice(m.index, t.index + t[0].length); }
		else depth++;
	throw new Error(`unclosed reference card for ${spec}`);
}

/* line-level LCS diff */
function diff(a, b) {
	const n = a.length, m = b.length;
	const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
	for (let i = n - 1; i >= 0; i--)
		for (let j = m - 1; j >= 0; j--)
			dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
	const out = [];
	let i = 0, j = 0;
	while (i < n && j < m) {
		if (a[i] === b[j]) { i++; j++; }
		else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['-', a[i++]]);
		else out.push(['+', b[j++]]);
	}
	while (i < n) out.push(['-', a[i++]]);
	while (j < m) out.push(['+', b[j++]]);
	return out;
}

let mismatched = 0;
for (const [itemtype, file] of PAIRS) {
	if (only && only !== itemtype) continue;
	let d;
	try {
		d = diff(canon(referenceCard(itemtype)), canon(renderCard(load(file), presets, {}, { images, typeChip: true })));
	} catch (error) {
		console.log(`ERROR  ${itemtype.padEnd(22)} ${error.message}`);
		mismatched++;
		continue;
	}
	if (!d.length) { console.log(`MATCH  ${itemtype.padEnd(22)} ${file}`); continue; }
	mismatched++;
	console.log(`DIFF   ${itemtype.padEnd(22)} ${file}  (${d.length} lines; "-" reference, "+" renderer)`);
	for (const [sign, line] of d) console.log(`   ${sign} ${line}`);
}
console.log(`\n${PAIRS.filter(([t]) => !only || only === t).length - mismatched}/${PAIRS.filter(([t]) => !only || only === t).length} cards transcribe exactly`);

/**
 * Microdata -> JSON-LD.
 *
 * Reads the microdata the renderer already emits and returns it as JSON-LD nodes, so
 * `schema: 'jsonld'` cannot drift from `schema: 'micro'` — there is one source of
 * structured data, not two. Node-safe: string parsing only, no DOM, no dependencies.
 *
 * Docs: docs/card.md § Schema mode
 */

const TAG = /<(\/?)([a-z][a-z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/gi;
const ATTR = /([a-z-]+)(?:="([^"]*)")?/gi;
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
	'meta', 'param', 'source', 'track', 'wbr']);
/* HTML microdata: the attribute a property takes its value from, by element */
const VALUE_ATTR = {
	meta: 'content', audio: 'src', embed: 'src', iframe: 'src', img: 'src', source: 'src',
	track: 'src', video: 'src', a: 'href', area: 'href', link: 'href', object: 'data',
	data: 'value', meter: 'value', time: 'datetime'
};

const attrsOf = (raw) => {
	const out = {};
	for (const m of raw.matchAll(ATTR)) out[m[1].toLowerCase()] = m[2] ?? '';
	return out;
};

const unescape = (s) => s
	.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
	.replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
	.replace(/&amp;/g, '&');

/* one property may legitimately repeat — collapse to a scalar, grow to an array */
const addProp = (item, name, value) => {
	if (!(name in item)) { item[name] = value; return; }
	if (Array.isArray(item[name])) item[name].push(value);
	else item[name] = [item[name], value];
};

/* comments can contain markup, and <script>/<style> bodies are raw text full of < and " —
   both would tokenize as tags. Blanked (not deleted) so nothing else needs re-indexing. */
const COMMENT = /<!--[\s\S]*?-->/g;
const RAW_TEXT = /(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi;
const blank = (s) => s.replace(COMMENT, (m) => ' '.repeat(m.length))
	.replace(RAW_TEXT, (m, open, tag, body, close) => open + ' '.repeat(body.length) + close);

export const microdataToJsonLd = (html) => {
	const src = blank(String(html));
	const roots = [];
	const stack = [];   /* open elements: { tag, item?, prop?, textFrom? } */
	const items = [];   /* open itemscopes */
	let last = 0;

	const closeFrame = (frame, textEnd) => {
		if (frame.prop && frame.textFrom != null) {
			const owner = frame.owner;
			if (owner) addProp(owner, frame.prop, unescape(src.slice(frame.textFrom, textEnd)
				.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim());
		}
		if (frame.item) items.pop();
	};

	for (const m of src.matchAll(TAG)) {
		const [, close, rawTag, rawAttrs, selfClose] = m;
		const tag = rawTag.toLowerCase();
		last = m.index + m[0].length;

		if (close) {
			for (let i = stack.length - 1; i >= 0; i--) {
				if (stack[i].tag !== tag) continue;
				for (let j = stack.length - 1; j >= i; j--) closeFrame(stack[j], m.index);
				stack.length = i;
				break;
			}
			continue;
		}

		const a = attrsOf(rawAttrs);
		const owner = items[items.length - 1] || null;
		const frame = { tag, owner };

		if ('itemscope' in a) {
			const item = {};
			if (a.itemtype) item['@type'] = a.itemtype.split('/').pop();
			if (a.itemprop && owner) addProp(owner, a.itemprop, item);
			else roots.push(item);
			items.push(item);
			frame.item = item;
		} else if (a.itemprop && owner) {
			const attr = VALUE_ATTR[tag];
			if (attr) addProp(owner, a.itemprop, a[attr] ?? '');
			else { frame.prop = a.itemprop; frame.textFrom = last; }
		}

		if (!VOID.has(tag) && !selfClose) stack.push(frame);
		else if (frame.item) items.pop();
	}
	return roots;
};

/* The page-level block: one @graph holding every top-level item on the page. */
export const jsonLdGraph = (html) => {
	const graph = microdataToJsonLd(html);
	return graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null;
};

/* A <script type="application/ld+json"> is a DATA block — never executed, so it is not
   render-blocking and must not be marked so. `<` is escaped because a text property
   containing </script> would otherwise close the tag early. Docs: docs/card.md § Schema mode */
export const jsonLdScript = (html, space = 0) => {
	const graph = jsonLdGraph(html);
	if (!graph) return '';
	const json = JSON.stringify(graph, null, space).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
};

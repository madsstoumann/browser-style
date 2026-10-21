#!/usr/bin/env node
/* Palette migration — rewrites the nine-name colour vocabulary to <hue>-<step>. Run once.
 *
 *   node scripts/migrate-palette.js            rewrite the repo in place
 *   node scripts/migrate-palette.js --dry      count and report, write nothing
 *   node scripts/migrate-palette.js --list     also print every rewrite (file:line  old -> new)
 *   node scripts/migrate-palette.js --root DIR run against another checkout
 *   node scripts/migrate-palette.js FILE...    only these files
 *
 * Idempotent: a second run finds nothing to change. Plan and table: docs/PALETTE.md §1 and
 * §0 #9 (the CMS repo); the same table is TABLE below. One caveat, by design of the vocabulary:
 * `black` is both an old name (-> gray-800) and the new unstepped colour (#000), so this is a
 * one-time cut-over — run it before anyone authors a new-style `black`, never after.
 *
 * WHAT IT TOUCHES — colour words only, and only in these positions:
 *   theme="…" / data-theme="…"        HTML attributes, also inside JS/JSON strings (\" escaped too)
 *   theme: '…' / "labelTheme": "…"    object keys ending in theme, with an optional `x || '…'` fallback
 *   "hue": "green"                    the goal card's ring hue (a bare colour word)
 *   setAttribute('theme', a ? 'x' : 'y')
 *   media="…" / "media": "…"          the furniture tokens chip(…) sticker(…) beacon(…) marquee(…)
 *                                      ai(…) save(…) play(…) lightbox(…) tnt(…); also media-open
 *   "chip": { "style": "te red" }     a furniture item's style words (the element is the parent key)
 *   chip(red) in HTML text/<code>     DSL tokens written out in demo headlines and code samples
 *   --ui-theme-<name>-bg / -c         the nine removed custom properties -> --color-<step>[-text]
 * It never touches prose, CSS files, class names, variable names, font~="black", fill=, tint=
 * literals, hov(gray) / hl(accent) (other DSLs), words like whiteWine, or data-variant="accent".
 *
 * REWRITE RULES (docs/PALETTE.md §1, §0 #9)
 *   solid  red -> red-700 ... slate -> gray-700, black -> gray-800, white stays white
 *   pale X / X pale -> X's pale column;  muted X -> X's muted column;  the words pale/muted go
 *   a theme with a border token (bare border or border(…)) and neither pale nor glass:
 *     add `outline`, drop a bare `border`, keep border(…) params   (X border -> X-step outline)
 *   with pale or glass the border words stay as they are
 *   furniture: chip(red) -> chip(red-700); chip(red) chip(pale) -> chip(red-200)
 *
 * SKIPPED AS AMBIGUOUS (reported, left untouched): placeholders and dynamic values (…, ${…}),
 * two colour words in one value, pale/muted with no colour word, chip(pale) with no chip(colour),
 * white + pale/muted + border (the result could not be told from an already-migrated value). */

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ── the table ───────────────────────────────────────────────────────────────────────── */

const TABLE = {
	red: { solid: 'red-700', pale: 'red-200', muted: 'red-300' },
	orange: { solid: 'orange-400', pale: 'orange-100', muted: 'orange-200' },
	green: { solid: 'green-800', pale: 'green-100', muted: 'green-300' },
	blue: { solid: 'blue-900', pale: 'blue-100', muted: 'blue-300' },
	accent: { solid: 'accent-700', pale: 'accent-200', muted: 'accent-300' },
	white: { solid: 'white', pale: 'white', muted: 'white' },
	gray: { solid: 'gray-200', pale: 'gray-50', muted: 'gray-100' },
	slate: { solid: 'gray-700', pale: 'gray-300', muted: 'gray-400' },
	black: { solid: 'gray-800', pale: 'gray-300', muted: 'gray-400' }
};
const OLD = new Set(Object.keys(TABLE));

/* pale + muted together (pale at half strength) is not in the table: decided here, one place */
const DECISIONS = { 'red pale muted': 'red-100' };

const FURNITURE = ['chip', 'sticker', 'beacon', 'marquee', 'ai', 'save', 'play', 'lightbox', 'tnt'];
const FURNITURE_RE = FURNITURE.join('|');
const TOKEN = new RegExp(`^((?:[a-z]{2}:)?)(${FURNITURE_RE})\\(([^()]*)\\)$`);
const STEP_WORD = /^[a-z]+-(?:50|100|200|300|400|500|600|700|800|900|950)$/;

/* ── value rewriters (pure; each returns { value, skip? }) ───────────────────────────── */

const words = (value) => value.split(/\s+/).filter(Boolean);
const placeholder = (value) => /[…$<>{}\\`]|\.\.\./.test(value);
const isBorder = (word) => word === 'border' || /^border\(.*\)$/.test(word);

/* `theme` / `data-theme` value */
export const rewriteTheme = (value) => {
	const list = words(value);
	const colours = list.filter((word) => OLD.has(word));
	const pale = list.includes('pale'), muted = list.includes('muted');
	if (!colours.length && !pale && !muted) return { value };
	if (list.some((word) => STEP_WORD.test(word))) return { value }; /* already migrated */
	if (placeholder(value)) return { value, skip: 'placeholder or dynamic value' };
	const key = list.join(' ');
	if (DECISIONS[key]) return { value: DECISIONS[key] };
	if (new Set(colours).size > 1) return { value, skip: 'more than one colour word' };
	if (!colours.length) return { value, skip: `${pale ? 'pale' : 'muted'} without a colour word` };
	if (pale && muted) {
		/* a decided combination is in DECISIONS; any other is a judgement call */
		return { value, skip: 'pale and muted together' };
	}
	const colour = colours[0];
	const column = pale ? 'pale' : muted ? 'muted' : 'solid';
	const glass = list.includes('glass');
	const border = list.some(isBorder);
	/* white is its own pale/muted column: a migrated `pale white border` (-> `white border`)
	   could not be told from an unmigrated `white border` on a second run */
	if (colour === 'white' && (pale || muted) && border && !glass) return { value, skip: 'white + pale/muted + border is ambiguous after the rewrite' };
	const toOutline = border && !pale && !glass && !list.includes('outline');
	const out = [];
	let placed = false;
	for (const word of list) {
		if (word === 'pale' || word === 'muted') continue;
		if (OLD.has(word)) { out.push(TABLE[word][column]); continue; }
		if (toOutline && isBorder(word)) {
			if (!placed) { out.push('outline'); placed = true; }
			if (word !== 'border') out.push(word);
			continue;
		}
		out.push(word);
	}
	return { value: out.join(' ') };
};

/* a furniture token run: `chip(bs) chip(red) chip(pale)`; tokens of other stems pass through */
export const rewriteMedia = (value) => {
	const lead = value.match(/^\s*/)[0];
	const tokens = value.match(/\S+/g);
	if (!tokens) return { value };
	const seps = value.split(/\S+/); /* seps[i] precedes tokens[i]; seps[0] is the lead */
	const parsed = tokens.map((token) => { const m = TOKEN.exec(token); return m ? { prefix: m[1], stem: m[2], arg: m[3] } : null; });
	const drop = new Set();
	const skips = [];
	let changed = false;
	for (const stem of FURNITURE) {
		const mine = parsed.map((p, i) => (p && p.stem === stem ? i : -1)).filter((i) => i >= 0);
		const colour = mine.filter((i) => OLD.has(parsed[i].arg));
		const modes = mine.filter((i) => parsed[i].arg === 'pale' || parsed[i].arg === 'muted');
		if (!colour.length && !modes.length) continue;
		if (!colour.length) { skips.push(`${stem}(${parsed[modes[0]].arg}) without a ${stem}(colour)`); continue; }
		const kinds = new Set(modes.map((i) => parsed[i].arg));
		if (kinds.size > 1) { skips.push(`${stem}(pale) and ${stem}(muted) together`); continue; }
		const column = kinds.size ? [...kinds][0] : 'solid';
		for (const i of colour) { parsed[i].arg = TABLE[parsed[i].arg][column]; changed = true; }
		for (const i of modes) { drop.add(i); changed = true; }
	}
	if (!changed) return { value, skip: skips.length ? skips.join('; ') : undefined };
	let out = '';
	let first = true;
	tokens.forEach((token, i) => {
		if (drop.has(i)) return;
		const text = parsed[i] ? `${parsed[i].prefix}${parsed[i].stem}(${parsed[i].arg})` : token;
		out += (first ? lead : seps[i]) + text;
		first = false;
	});
	out += value.match(/\s*$/)[0];
	return { value: out, skip: skips.length ? skips.join('; ') : undefined };
};

/* a furniture item's `style` words: the stem comes from the parent key */
export const rewriteStyle = (stem, value) => {
	const lead = value.match(/^\s*/)[0], trail = value.match(/\s*$/)[0];
	const list = words(value);
	if (!list.some((word) => OLD.has(word) || word === 'pale' || word === 'muted')) return { value };
	const wrapped = rewriteMedia(list.map((word) => `${stem}(${word})`).join(' '));
	if (wrapped.value === list.map((word) => `${stem}(${word})`).join(' ')) return { value, skip: wrapped.skip };
	const unwrapped = words(wrapped.value).map((token) => token.slice(stem.length + 1, -1));
	return { value: lead + unwrapped.join(' ') + trail, skip: wrapped.skip };
};

/* ── the walker ──────────────────────────────────────────────────────────────────────── */

/* a stateful, line-aware accumulator for one file */
const run = (text, ext) => {
	const edits = [];   /* { line, kind, from, to } */
	const skips = [];   /* { line, text, reason } */
	/* no pass adds or removes a newline, so the count in whatever string is being scanned is the original line */
	const lineAt = (string, offset) => { let n = 1, i = -1; while ((i = string.indexOf('\n', i + 1)) !== -1 && i < offset) n++; return n; };
	const html = ext === '.html' || ext === '.htm';
	let out = text;

	/* apply `fn` to every regex match, collecting edits; `get` extracts [valueStart, value] from a match */
	const sweep = (regex, kind, pick, rewrite) => {
		out = out.replace(regex, (...args) => {
			const match = args[0];
			const groups = args.slice(1, -2);
			const offset = args[args.length - 2];
			const string = args[args.length - 1];
			const { prefix, value, suffix, ctx } = pick(match, groups);
			if (value == null) return match;
			const result = rewrite(value, ctx);
			if (result.skip) skips.push({ line: lineAt(string, offset), text: match.trim().slice(0, 100), reason: result.skip });
			if (result.value === value) return match;
			edits.push({ line: lineAt(string, offset), kind, from: value, to: result.value });
			return prefix + result.value + suffix;
		});
	};

	/* A. attributes: theme="…" data-theme="…" media="…" (plain, \"-escaped, or ') */
	sweep(/(?<![\w-])((?:data-)?theme|media(?:-open)?)(\s*=\s*)(\\?)(["'])([^"'\\\n]*)\3\4/g, 'attr',
		(match, [name, eq, slash, quote, value]) => ({
			prefix: `${name}${eq}${slash}${quote}`, value, suffix: `${slash}${quote}`, ctx: name
		}),
		(value, name) => (name.includes('theme') ? rewriteTheme(value) : rewriteMedia(value)));

	/* B. keys: theme: '…' · "labelTheme": "…" · media: '…' · "media-open": "…", with `a.b || '…'` */
	sweep(/(["']?)(\b[A-Za-z]*[Tt]heme|\bmedia(?:-open)?)\1(\s*:\s*)((?:[\w.$?]+\s*(?:\|\||\?\?)\s*)?)(["'`])([^"'`\\\n]*)\5/g, 'key',
		(match, [q, name, colon, fallback, quote, value]) => ({
			prefix: `${q}${name}${q}${colon}${fallback}${quote}`, value, suffix: quote, ctx: name
		}),
		(value, name) => (/theme$/i.test(name) ? rewriteTheme(value) : rewriteMedia(value)));

	/* B2. hue: 'green' — the goal card's ring hue (a bare colour word, nothing else) */
	sweep(/(["']?)(?<![\w-])hue\1(\s*:\s*)(["'])(red|orange|green|blue|accent|white|gray|slate|black)\3/g, 'key',
		(match, [q, colon, quote, value]) => ({ prefix: `${q}hue${q}${colon}${quote}`, value, suffix: quote }),
		(value) => rewriteTheme(value));

	/* E. setAttribute('theme', cond ? 'a' : 'b') — every string literal in the argument */
	out = out.replace(/(\.setAttribute\(\s*(["'])(?:data-)?theme\2\s*,)([^)\n]*)\)/g, (match, head, q, args, offset, string) => {
		const next = args.replace(/(["'`])([^"'`\\\n]*)\1/g, (lit, quote, value) => {
			const result = rewriteTheme(value);
			if (result.skip) skips.push({ line: lineAt(string, offset), text: match.slice(0, 100), reason: result.skip });
			if (result.value === value) return lit;
			edits.push({ line: lineAt(string, offset), kind: 'setAttribute', from: value, to: result.value });
			return quote + result.value + quote;
		});
		return head + next + ')';
	});

	/* C. furniture items: "chip": { … "style": "te red" … } — brace/bracket balanced */
	if (!html) {
		const open = new RegExp(`(["']?)\\b(${FURNITURE_RE})\\1\\s*:\\s*[{\\[]`, 'g');
		let m;
		let result = '';
		let cursor = 0;
		while ((m = open.exec(out))) {
			const start = m.index + m[0].length - 1;
			const end = balanced(out, start);
			if (end < 0) continue;
			const stem = m[2];
			const block = out.slice(start, end + 1);
			const next = block.replace(/(["']?)\bstyle\1(\s*:\s*)(["'`])([^"'`\\\n]*)\3/g, (whole, q, colon, quote, value, off) => {
				const r = rewriteStyle(stem, value);
				if (r.skip) skips.push({ line: lineAt(out, start + off), text: whole.slice(0, 100), reason: r.skip });
				if (r.value === value) return whole;
				edits.push({ line: lineAt(out, start + off), kind: 'style', from: value, to: r.value });
				return `${q}style${q}${colon}${quote}${r.value}${quote}`;
			});
			result += out.slice(cursor, start) + next;
			cursor = end + 1;
			open.lastIndex = end + 1;
		}
		if (cursor) out = result + out.slice(cursor);
	}

	/* D. DSL tokens written out as text (HTML only): headlines, <code>, comments */
	if (html) {
		const run1 = /\b[a-z][a-z0-9-]*\([^()\s<>"']*\)(?:[ \t]+[a-z][a-z0-9-]*\([^()\s<>"']*\))*/g;
		out = out.replace(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]*>)|([^<]+)/gi, (whole, tag, body, offset, string) => {
			if (tag || !body || !new RegExp(`\\b(?:${FURNITURE_RE})\\(`).test(body)) return whole;
			return body.replace(run1, (tokens) => {
				const r = rewriteMedia(tokens);
				if (r.skip) skips.push({ line: lineAt(string, offset), text: tokens.slice(0, 100), reason: r.skip });
				if (r.value === tokens) return tokens;
				edits.push({ line: lineAt(string, offset), kind: 'text', from: tokens, to: r.value });
				return r.value;
			});
		});
	}

	/* F. the removed --ui-theme-<name>-bg / -c custom properties */
	out = out.replace(/--ui-theme-(red|orange|green|blue|accent|white|gray|slate|black)-(bg|c)\b/g, (whole, name, kind, offset, string) => {
		const step = TABLE[name].solid;
		const to = kind === 'bg' ? `--color-${step}` : `--color-${step}-text`;
		edits.push({ line: lineAt(string, offset), kind: 'var', from: whole, to });
		return to;
	});

	return { out, edits, skips };
};

/* index of the bracket that closes the one at `start`, skipping strings; -1 if unbalanced */
const balanced = (text, start) => {
	const open = text[start], close = open === '{' ? '}' : ']';
	let depth = 0, quote = null;
	for (let i = start; i < text.length; i++) {
		const ch = text[i];
		if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = null; continue; }
		if (ch === '"' || ch === "'" || ch === '`') quote = ch;
		else if (ch === open) depth++;
		else if (ch === close && --depth === 0) return i;
	}
	return -1;
};

/* ── file discovery ──────────────────────────────────────────────────────────────────── */

const EXT = new Set(['.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.ndjson']);
/* never rewritten: build output, vendored/third-party code, the migration itself and the palette
   source and generator (scripts/build-palette.js, ui/base/palette*.json — they spell the new names).
   cms/baseline/docs is the Docusaurus site built from the .md pages (npm run build:docs).
   content/, ui/card_v1, ui/card-expand, ui/card-flip and ui/product-card are the legacy,
   pre-v4 lines (AGENTS.md § Legacy) with their own CSS and vocabulary. */
const SKIP_DIR = /(^|\/)(node_modules|dist|\.git|_v1|_v2|_tmp)(\/|$)|^cms\/baseline\/docs\/|^content\/|^ui\/(card_v1|card-expand|card-flip|product-card)\//;
const SKIP_FILE = /\.min\.|(^|\/)package(-lock)?\.json$|^scripts\/(migrate|build)-palette\.js$|^ui\/base\/palette(\.rules)?\.json$/;

const discover = (root) => {
	let files;
	try {
		files = execFileSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] })
			.toString().split('\0').filter(Boolean);
	} catch {
		files = [];
		const walk = (dir) => {
			for (const name of readdirSync(dir)) {
				const full = join(dir, name);
				const rel = relative(root, full).split(sep).join('/');
				if (SKIP_DIR.test(rel + '/')) continue;
				if (statSync(full).isDirectory()) walk(full); else files.push(rel);
			}
		};
		walk(root);
	}
	return files.filter((file) => EXT.has(file.slice(file.lastIndexOf('.'))) && !SKIP_DIR.test(file) && !SKIP_FILE.test(file));
};

/* ── main ────────────────────────────────────────────────────────────────────────────── */

const main = () => {
	const args = process.argv.slice(2);
	const flag = (name) => args.includes(name);
	const rootIndex = args.indexOf('--root');
	const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'));
	const explicit = args.filter((arg, i) => !arg.startsWith('--') && !(rootIndex >= 0 && i === rootIndex + 1));
	const files = explicit.length ? explicit.map((file) => relative(root, resolve(file)).split(sep).join('/')) : discover(root);
	const dry = flag('--dry'), list = flag('--list');

	const report = [], skipped = [];
	let total = 0;
	for (const file of files) {
		const path = join(root, file);
		let text;
		try { text = readFileSync(path, 'utf8'); } catch { continue; }
		const ext = file.slice(file.lastIndexOf('.'));
		if (!/theme|media|--ui-theme-|\b(?:chip|sticker|beacon|marquee|ai|save|play|lightbox|tnt)\(/i.test(text)) continue;
		const { out, edits, skips } = run(text, ext);
		const seen = new Set();
		for (const skip of skips) {
			const key = `${file}:${skip.line}:${skip.reason}:${skip.text}`;
			if (seen.has(key)) continue;
			seen.add(key);
			skipped.push(`${file}:${skip.line}  ${skip.reason}  ${skip.text}`);
		}
		if (!edits.length) continue;
		total += edits.length;
		const kinds = {};
		for (const edit of edits) kinds[edit.kind] = (kinds[edit.kind] || 0) + 1;
		report.push({ file, count: edits.length, kinds });
		if (list) for (const edit of edits) console.log(`${file}:${edit.line}  ${JSON.stringify(edit.from)} -> ${JSON.stringify(edit.to)}`);
		if (!dry && out !== text) writeFileSync(path, out);
	}

	console.log(`\n${dry ? 'would rewrite' : 'rewrote'} ${total} value${total === 1 ? '' : 's'} in ${report.length} file${report.length === 1 ? '' : 's'}`);
	for (const { file, count, kinds } of report.sort((a, b) => a.file.localeCompare(b.file)))
		console.log(`${String(count).padStart(5)}  ${file}  (${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')})`);
	if (skipped.length) {
		console.log(`\nskipped as ambiguous (${skipped.length}):`);
		for (const line of skipped) console.log('  ' + line);
	}
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

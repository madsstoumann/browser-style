/* Content-hash a SITE asset and rewrite every reference to it.
 *
 * WHY: /dist/demo.min.css is served with `public, max-age=86400,
 * stale-while-revalidate=604800` (see /_headers). At a fixed filename that means a
 * shipped CSS change can stay invisible for up to EIGHT DAYS — at the browser and at
 * the Cloudflare edge, so neither a hard reload nor a private tab shakes it loose.
 * The HTML has no such rule and revalidates every load, so you get fresh markup over
 * a stale stylesheet: only the newest components look unstyled, which reads as a CSS
 * bug and is not one. This happened, twice, and cost a long afternoon.
 *
 * A content hash in the FILENAME makes the URL change whenever the bytes change, so
 * the stale copy is never asked for again. It replaces the hand-bumped ?v= token,
 * which worked but had to be remembered — and the failure mode of forgetting is the
 * silent one above.
 *
 * NOT applied to the package bundles (ui/base, ui/carousel, ui/card, ui/reveal).
 * Those ship to npm at a stable `dist/<name>.min.css` that consumers link and
 * package.json `exports` names; hashing them would break every consumer. This script
 * is deliberately separate from scripts/css-bundle.js for exactly that reason —
 * five callers share that bundler, only one of them is a website.
 *
 * ALSO emits a precompressed `<hashed>.br` sibling. Cloudflare Pages compresses on the
 * fly at roughly q4; the same bytes at q11 are ~22% smaller, which is the single largest
 * win available on the render-blocking stylesheet and costs no CSS change at all.
 * functions/dist/[[path]].js serves the sibling to clients that accept `br`.
 * Docs: docs/performance-review.md § 1
 *
 * Usage:  node scripts/hash-asset.js <file>          e.g. dist/demo.min.css
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

/* Files that may reference the asset. Hand-authored demo pages plus the ONE build
   template — ui/card/demo/build.shared.js holds HEAD_COMMON, which the articles/ and
   products/ builders emit, so a rewrite that skipped it would be reverted by the next
   build run and silently un-fix five generated pages. */
const REF_ROOTS = ['ui', 'apps', 'layout', 'cms'];
const REF_EXT = /\.(html|js)$/;

const walk = (dir, out = []) => {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
		const p = join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else if (REF_EXT.test(e.name)) out.push(p);
	}
	return out;
};

export function hashAsset(file) {
	const dir = dirname(file);
	const name = basename(file);
	/* demo.min.css -> stem "demo", suffix ".min.css" so the hash lands in the middle */
	const [, stem, suffix] = /^([^.]+)(\..+)$/.exec(name);
	const bytes = readFileSync(file);
	const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
	const hashed = `${stem}.${hash}${suffix}`;

	/* drop every previous build of this asset, hashed or not — leaving the unhashed
	   name behind would let a missed reference keep serving stale bytes silently,
	   which is the bug. A 404 is the loud failure we want instead. */
	const stale = new RegExp(`^${stem}(\\.[0-9a-f]{8})?${suffix.replace(/\./g, '\\.')}(\\.br)?$`);
	for (const f of readdirSync(dir)) {
		if (f !== hashed && f !== `${hashed}.br` && stale.test(f)) rmSync(join(dir, f), { force: true });
	}
	writeFileSync(join(dir, hashed), bytes);
	/* the q11 sibling — see the header. Written next to the hashed name so it inherits the
	   same immutable URL lifetime: bytes change -> both names change together. */
	const br = brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
	writeFileSync(join(dir, `${hashed}.br`), br);

	/* rewrite refs: match the unhashed name, any previous hash, and any ?v= token */
	const ref = new RegExp(`/${dir}/${stem}(?:\\.[0-9a-f]{8})?${suffix.replace(/\./g, '\\.')}(\\?[^"']*)?`, 'g');
	const want = `/${dir}/${hashed}`;
	let changed = 0;
	for (const root of REF_ROOTS) {
		for (const f of walk(root)) {
			const src = readFileSync(f, 'utf8');
			if (!ref.test(src)) { ref.lastIndex = 0; continue; }
			ref.lastIndex = 0;
			const next = src.replace(ref, want);
			if (next !== src) { writeFileSync(f, next); changed++; }
		}
	}
	return { hashed: want, changed, raw: bytes.length, br: br.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const file = process.argv[2];
	if (!file) { console.error('usage: node scripts/hash-asset.js <file>'); process.exit(1); }
	const { hashed, changed, raw, br } = hashAsset(file);
	console.log(`\nhashed  ${hashed}  (${changed} file${changed === 1 ? '' : 's'} rewritten)`);
	console.log(`        +${hashed.split('/').pop()}.br  ${raw} -> ${br} B at brotli q11`);
}

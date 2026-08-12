/* Shared CSS bundler for the @browser.style packages.
 *
 * WHY: the packages ship a chain of relative @imports (index.css -> ui-card.css ->
 * 7 sheets). @import targets are only discovered after the parent sheet parses, so
 * a <link> consumer pays 3-4 SEQUENTIAL round trips before first paint and cannot
 * preload past them. Bundler users never see this; browser.style itself and every
 * demo page does. Minification is the consumer's job — the import graph is ours.
 *
 * THE INVARIANT — bundles are PEER-EXCLUSIVE. A bundle contains only its own
 * package's CSS. Consumers load one <link> per package, in dependency order:
 *
 *     base  ->  carousel  ->  card  ->  reveal
 *
 * Four requests, all PARALLEL, versus 3-4 sequential ones. If a package ever
 * re-adds a cross-package @import (ui-reveal.css used to pull in ../card/ui-card.css,
 * so every page linking both parsed the card engine twice), this build FAILS —
 * the check reads esbuild's metafile input list and asserts every input lives
 * inside the package directory. It is not a selector grep: carousel.css legitimately
 * *selects* ui-card/ui-media/lay-out, which is different from inlining their sheets.
 *
 * Usage:  node scripts/css-bundle.js <packageDir> <entry.css> <outName>
 *   or:   import { bundleCss } from '.../scripts/css-bundle.js'
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { relative, resolve } from 'node:path';

const esbuild = (cwd, args) =>
	execFileSync('npx', ['--yes', 'esbuild', ...args], { cwd, stdio: ['ignore', 'pipe', 'inherit'] });

const kb = (n) => (n / 1024).toFixed(1).padStart(6) + ' kB';
const brotli = (buf) => brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

/**
 * @param {string} pkgDir  absolute path to the package root
 * @param {string} entry   entry sheet, relative to pkgDir (e.g. 'index.css')
 * @param {string} outName base name for dist output (e.g. 'card')
 * @returns {{ raw:number, min:number, gzip:number, brotli:number, inputs:string[] }}
 */
export function bundleCss(pkgDir, entry, outName) {
	const root = resolve(pkgDir);
	mkdirSync(`${root}/dist`, { recursive: true });
	const meta = `${root}/dist/.meta.json`;

	/* SVG icons referenced by url() are inlined, not copied: ui/base ships 15 of
	   them totalling ~4 kB, and a relative url() would otherwise break — the bundle
	   sits in dist/, one level below the sheet that wrote the path. Inlining also
	   keeps the bundle a single self-contained request, which is the whole point.
	   A binary asset (woff2/png) would fail here loudly and needs its own decision.
	   Root-absolute /assets/* URLs are SITE references (ui/rating's star.svg) — left as-is. */
	const loaders = ['--loader:.svg=dataurl', '--external:/assets/*'];
	esbuild(root, [entry, '--bundle', ...loaders, `--outfile=dist/${outName}.css`, `--metafile=${meta}`, '--log-level=warning']);
	esbuild(root, [entry, '--bundle', ...loaders, '--minify', `--outfile=dist/${outName}.min.css`, '--log-level=warning']);

	/* peer-exclusivity gate — every input must live inside this package */
	const inputs = Object.keys(JSON.parse(readFileSync(meta, 'utf8')).inputs);
	rmSync(meta, { force: true });
	const foreign = inputs.filter((i) => relative(root, resolve(root, i)).startsWith('..'));
	if (foreign.length) {
		throw new Error(
			`css-bundle: ${outName} inlined CSS from outside its package — bundles must be peer-exclusive.\n` +
			foreign.map((f) => `    ${f}`).join('\n') +
			`\n  Fix the cross-package @import; declare that package as a peer and let the page load it.`
		);
	}

	const raw = statSync(`${root}/dist/${outName}.css`).size;
	const min = readFileSync(`${root}/dist/${outName}.min.css`);
	return { raw, min: min.length, gzip: gzipSync(min, { level: 9 }).length, brotli: brotli(min), inputs };
}

export function reportCss(rows) {
	console.log(`\n${'css bundle'.padEnd(22)}${'bundled'.padStart(9)}${'min'.padStart(9)}${'gzip'.padStart(9)}${'brotli'.padStart(9)}${'  files'}`);
	for (const [name, r] of rows)
		console.log(`${name.padEnd(22)}${kb(r.raw)}${kb(r.min)}${kb(r.gzip)}${kb(r.brotli)}${String(r.inputs.length).padStart(7)}`);
}

/* CLI */
if (import.meta.url === `file://${process.argv[1]}`) {
	const [pkgDir, entry = 'index.css', outName] = process.argv.slice(2);
	if (!pkgDir || !outName) {
		console.error('usage: node scripts/css-bundle.js <packageDir> <entry.css> <outName>');
		process.exit(1);
	}
	reportCss([[outName, bundleCss(pkgDir, entry, outName)]]);
}

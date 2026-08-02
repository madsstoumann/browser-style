/* Regenerates the tokens artifacts (data/tokens.data.js + tokens.md) from data/tokens.json,
 * lints the manifest against the CSS, then bundles + minifies each entry to <name>.min.js
 * (shared.js inlined) and prints a size table (source = bundled, unminified).
 * Exits nonzero if the tokens lint fails. Run: node build.js */

import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { buildTokens } from './tokens.build.js';

const ENTRIES = ['index.js', 'carousel.js', 'hover.js', 'video.js', 'lightbox.js'];
const dir = new URL('.', import.meta.url).pathname;

const esbuild = (args) => execFileSync('npx', ['--yes', 'esbuild', ...args], { cwd: dir, stdio: ['ignore', 'pipe', 'inherit'] });

const kb = (n) => (n / 1024).toFixed(1).padStart(6) + ' kB';
const brotli = (buf) => brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

/* tokens first: the lint imports the freshly written data/tokens.data.js */
const { manifest } = buildTokens();
for (const [attr, group] of Object.entries(manifest.attributes))
	console.log(`${(attr + '=').padEnd(16)}${String(Object.keys(group.tokens).length).padStart(4)} stems${String(Object.keys(group.bareFlags).length).padStart(4)} bare flags`);
const { lintTokens } = await import('./tokens.lint.js');
const lintErrors = lintTokens();
for (const error of lintErrors) console.error('  ' + error);
console.log(lintErrors.length ? `tokens lint: ${lintErrors.length} error(s)\n` : 'tokens lint: ok\n');

console.log(`${'file'.padEnd(16)}${'source'.padStart(9)}${'min'.padStart(9)}${'gzip'.padStart(9)}${'brotli'.padStart(9)}`);
for (const entry of ENTRIES) {
	const out = entry.replace('.js', '.min.js');
	const source = esbuild([entry, '--bundle', '--format=esm', '--log-level=warning']).length;
	esbuild([entry, '--bundle', '--minify', '--format=esm', `--outfile=${out}`, '--log-level=warning']);
	const min = readFileSync(dir + out);
	console.log(`${out.padEnd(16)}${kb(source)}${kb(min.length)}${kb(gzipSync(min, { level: 9 }).length)}${kb(brotli(min))}`);
}
console.log(`\nshared.js (source, inlined into carousel/video/index bundles): ${(statSync(dir + 'shared.js').size / 1024).toFixed(1)} kB`);
if (lintErrors.length) process.exit(1);

/* Bundles the two JS entries and prints a size table.
 *   engine.min.js  Leaflet 1.9.4 + Supercluster 9 + leaflet.css (as a string) — loaded
 *                  only when a <ui-map> scrolls into view, never on the critical path
 *   ui-map.min.js  the element alone, no third-party bytes
 * Run: node build.js   Docs: readme.md § Build */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';

const dir = new URL('.', import.meta.url).pathname;
const esbuild = (args) => execFileSync('npx', ['--yes', 'esbuild', ...args], { cwd: dir, stdio: ['ignore', 'pipe', 'inherit'] });

/* --loader:.css=text keeps leaflet.css a STRING, so its three url(images/*.png) are never
   resolved or copied; --legal-comments=eof preserves Leaflet's BSD-2 and Supercluster's
   and kdbush's ISC notices, which their licences require to travel with the bundle. */
const FLAGS = ['--bundle', '--format=esm', '--target=chrome150,safari26', '--loader:.css=text', '--legal-comments=eof'];
const ENTRIES = [['engine.js', 'engine.min.js'], ['ui-map.js', 'ui-map.min.js']];

const kb = (n) => (n / 1024).toFixed(1).padStart(6) + ' kB';
const brotli = (buf) => brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

console.log(`${'file'.padEnd(16)}${'source'.padStart(9)}${'min'.padStart(9)}${'gzip'.padStart(9)}${'brotli'.padStart(9)}`);
for (const [entry, out] of ENTRIES) {
	const source = esbuild([entry, ...FLAGS, '--log-level=warning']).length;
	esbuild([entry, ...FLAGS, '--minify', `--outfile=${out}`, '--log-level=warning']);
	const min = readFileSync(dir + out);
	console.log(`${out.padEnd(16)}${kb(source)}${kb(min.length)}${kb(gzipSync(min, { level: 9 }).length)}${kb(brotli(min))}`);
}

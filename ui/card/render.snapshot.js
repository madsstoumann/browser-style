/* SSR regression snapshot — renders every card instance in data/ (plus data/demo/)
 * against both preset collections and writes one deterministic text snapshot.
 *
 * The refactoring gate used throughout the v4 card-system work: capture a baseline
 * BEFORE a change, re-run AFTER, and require a byte-identical diff unless the
 * change intentionally alters renderer output (then justify each differing block).
 *
 *   node ui/card/render.snapshot.js . /tmp/before.txt     # baseline
 *   …make changes…
 *   node ui/card/render.snapshot.js . /tmp/after.txt
 *   cmp /tmp/before.txt /tmp/after.txt && echo identical
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || '.';
const out = process.argv[3];
if (!out) {
	console.error('usage: node ui/card/render.snapshot.js <repoRoot> <outFile>');
	process.exit(1);
}
const { renderCard } = await import(join(process.cwd(), root, 'ui/card/render.js'));
const load = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const presets = { ...load('ui/card/data/card.presets.json').presets, ...load('ui/card/data/card.presets.demo.json').presets };

const dataDir = join(root, 'ui/card/data');
const files = [];
for (const f of readdirSync(dataDir).sort())
	if (f.endsWith('.json') && !f.startsWith('card.presets') && f !== 'index.json' && f !== 'tokens.json' && f !== 'details.json') files.push(join('ui/card/data', f));
for (const f of readdirSync(join(dataDir, 'demo')).sort())
	if (f.endsWith('.json')) files.push(join('ui/card/data/demo', f));

let snap = '', ok = 0, fail = 0;
for (const f of files) {
	try {
		snap += `===== ${f} =====\n${renderCard(load(f), presets)}\n`;
		ok++;
	} catch (error) {
		snap += `===== ${f} =====\nERROR: ${error.message}\n`;
		fail++;
	}
}
writeFileSync(out, snap);
console.log(`rendered ${ok} ok, ${fail} failed, snapshot -> ${out}`);

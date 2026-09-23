/**
 * icons.build.js — the EU AI icons as CSS masks.
 * Reads the Commission's originals in /assets/ai (untouched) and writes ui/ai/icons/*.svg:
 * the shape white and the letters black inside an internal <mask>, so a CSS mask paints the
 * shape in currentColor with the letters knocked out. `--check` fails when an output is stale.
 * Docs: readme.md § Icons
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '../../assets/ai');
/* crop = the shape's own bounding box (SVGGraphicsElement.getBBox() on the cls-1 path): the
   originals pad it inside the viewBox — the disc fills 64% of its canvas, the pills 47% — which a
   mask would draw as dead space. Re-measure if the Commission ever reissues the files. */
const ICONS = {
	'ai.svg': ['LABEL_AI_black.svg', '89.28 100.72 365.49 365.49'],
	'ai-generated.svg': ['LABEL_AI GENERATED_black.svg', '207.3 144.36 1384.24 266.41'],
	'ai-modified.svg': ['LABEL_AI MODIFIED_black.svg', '231.11 144.36 1230.56 266.41']
};

const derive = (svg, name, viewBox) => {
	const paths = [...svg.matchAll(/<path class="(cls-[12])" d="([^"]+)"\s*\/>/g)];
	const shape = paths.filter(([, cls]) => cls === 'cls-1');
	const letters = paths.filter(([, cls]) => cls === 'cls-2');
	if (!viewBox || shape.length !== 1 || !letters.length) throw new Error(`${name}: expected one cls-1 shape and cls-2 letters`);
	const [x, y, w, h] = viewBox.split(/\s+/);
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`
		+ `<mask id="m" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">`
		+ `<path fill="#fff" fill-rule="evenodd" d="${shape[0][2]}"/>`
			+ letters.map(([, , d]) => `<path fill="#000" d="${d}"/>`).join('')
		+ `</mask><rect x="${x}" y="${y}" width="${w}" height="${h}" mask="url(#m)"/></svg>\n`;
};

const check = process.argv.includes('--check');
let stale = 0;
for (const [out, [original, crop]] of Object.entries(ICONS)) {
	const svg = derive(readFileSync(join(source, original), 'utf8'), original, crop);
	const target = join(here, 'icons', out);
	if (check) {
		let current = '';
		try { current = readFileSync(target, 'utf8'); } catch {}
		if (current !== svg) { console.error(`stale: ui/ai/icons/${out} — run node ui/ai/icons.build.js`); stale++; }
	} else {
		writeFileSync(target, svg);
		console.log(`ui/ai/icons/${out}  ${svg.length} bytes  ← assets/ai/${original}`);
	}
}
if (stale) process.exit(1);

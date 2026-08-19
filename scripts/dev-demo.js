/* Watch-rebuild the demo CSS bundle in place, for local iteration.
 *
 * WHY: the demo pages link ONE bundle, /dist/demo.<hash>.min.css, so editing a raw
 * sheet (ui/card/content.css, ui/base/tokens.css, …) changes nothing on screen until
 * it is rebundled. Running the full `npm run build:demo-css` per keystroke also
 * re-hashes the file, which rewrites the ~30 pages that reference it — churn you do
 * not want mid-feature.
 *
 * This writes to the CURRENT hashed filename instead of minting a new one, so the
 * pages keep working untouched and a refresh shows the change. The local dev server
 * (`python3 -m http.server`) sends no Cache-Control, so overwriting a name that
 * production serves as immutable is safe HERE and only here.
 *
 * FINISHING a feature: run `npm run build:demo-css` once. That re-hashes and rewrites
 * the references, which is the state that must be committed — never ship a bundle
 * whose bytes disagree with its hash.
 *
 * Usage:  npm run dev:demo        (Ctrl-C to stop)
 */

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ENTRY = 'ui/card/demo/demo.css';
const DIST = 'dist';

/* the hashed name the pages currently link; bare demo.min.css if none exists yet */
const hashed = readdirSync(join(ROOT, DIST)).find((f) => /^demo\.[0-9a-f]{8}\.min\.css$/.test(f));
if (!hashed) {
	console.error(
		`no dist/demo.<hash>.min.css found — run \`npm run build:demo-css\` once first,\n` +
		`so there is a hashed bundle for the demo pages to link.`
	);
	process.exit(1);
}
if (!existsSync(join(ROOT, ENTRY))) {
	console.error(`missing bundle entry ${ENTRY}`);
	process.exit(1);
}

/* Exactly the flags scripts/css-bundle.js uses for the .min output, --minify included:
   with identical flags an unchanged source tree reproduces the committed bytes, so
   starting a watch on a clean checkout leaves it clean. Drop --minify and merely
   watching would dirty a tracked 400 kB file. */
const args = [
	'--yes', 'esbuild', ENTRY,
	'--bundle',
	'--loader:.svg=dataurl',
	'--external:/assets/*',
	'--minify',
	`--outfile=${DIST}/${hashed}`,
	'--watch=forever',
	'--log-level=info',
];

console.log(
	`\nwatching  ${ENTRY}\n` +
	`writing   ${DIST}/${hashed}\n\n` +
	`Edit any raw sheet and refresh the demo page. When the feature is done:\n` +
	`  npm run build:demo-css      # re-hash + rewrite page references\n`
);

const child = spawn('npx', args, { cwd: ROOT, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));

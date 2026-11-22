/* Publish the packages that carry publishConfig.tag "next" — the v4 prereleases — under the dist-tag `next`.
 * Docs: npm.md § Prereleases from v4. `latest` never moves: the tag is explicit here and in each package.json.
 *
 *   node scripts/publish-next.js --check        pack every package (dry run) and fail on an export the tarball lacks
 *   node scripts/publish-next.js --otp <code>   check, then publish the versions npm does not have yet
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const otp = args.includes('--otp') ? args[args.indexOf('--otp') + 1] : null;
if (!otp && !args.includes('--check')) {
	console.error('usage: node scripts/publish-next.js --check | --otp <code>');
	process.exit(1);
}

/* every workspace of the root package.json (`ui/*`, `layout`, `ui/form-types/*`, …), as update-peer-deps.js reads them */
const dirs = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).workspaces
	.flatMap((pattern) => !pattern.endsWith('/*') ? [pattern]
		: existsSync(join(root, pattern.slice(0, -2))) ? readdirSync(join(root, pattern.slice(0, -2))).map((d) => `${pattern.slice(0, -2)}/${d}`) : [])
	.filter((d) => existsSync(join(root, d, 'package.json')));
const packages = dirs
	.map((dir) => ({ dir, pkg: JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) }))
	.filter(({ pkg }) => pkg.publishConfig?.tag === 'next' && !pkg.private);

const npm = (...a) => execFileSync('npm', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/* every file an export, `main`, `module` or `style` names must be in the tarball */
const targets = (pkg) => {
	const out = new Set();
	const walk = (v) => { if (typeof v === 'string') out.add(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
	walk(pkg.exports);
	for (const k of ['main', 'module', 'style']) if (pkg[k]) out.add(pkg[k]);
	return [...out].map((t) => t.replace(/^\.\//, ''));
};

const packed = JSON.parse(npm('pack', '--dry-run', '--json', '--ignore-scripts', ...packages.map(({ dir }) => `--workspace=${dir}`)));
let failed = 0;
for (const { dir, pkg } of packages) {
	const tar = packed.find((p) => p.name === pkg.name);
	const files = new Set(tar.files.map((f) => f.path));
	const missing = targets(pkg).filter((t) => t.includes('*')
		? ![...files].some((f) => new RegExp(`^${t.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('*', '.+')}$`).test(f))
		: !files.has(t));
	if (missing.length) failed++;
	console.log(`${missing.length ? '✗' : '✓'} ${pkg.name}@${pkg.version}  ${tar.entryCount} files, ${(tar.size / 1024).toFixed(1)} kB${missing.length ? `  missing: ${missing.join(', ')}` : ''}`);
}
if (failed) { console.error(`${failed} package(s) export a file the tarball lacks`); process.exit(1); }
console.log(`${packages.length} packages under next, every export packed`);
if (!otp) process.exit(0);

const todo = packages.filter(({ pkg }) => {
	try { return !npm('view', `${pkg.name}@${pkg.version}`, 'version').trim(); } catch { return true; }
});
if (!todo.length) { console.log('npm already has every version'); process.exit(0); }
execFileSync('npm', ['publish', ...todo.map(({ dir }) => `--workspace=${dir}`), '--tag', 'next', '--access', 'public', `--otp=${otp}`],
	{ cwd: root, stdio: 'inherit' });

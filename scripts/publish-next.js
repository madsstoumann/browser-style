/* Publish the packages that carry publishConfig.tag "next" — the v4 prereleases — under the dist-tag `next`.
 * Docs: npm.md § Prereleases from v4. `latest` never moves: the tag is explicit here and in each package.json.
 *
 *   node scripts/publish-next.js --check     pack every package (dry run) and fail on an export the tarball lacks,
 *                                            or on a packed file git does not track (a local file in a package folder)
 *   node scripts/publish-next.js --publish   check, ask npm which versions it lacks, then publish those one by one
 *                                            through npm's own sign-in: one browser 2FA with "remember me for
 *                                            5 minutes" covers the run. A run that stops is resumed by running it again.
 */
import { execFile, execFileSync, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const publish = args.includes('--publish');
if (!publish && !args.includes('--check')) {
	console.error('usage: node scripts/publish-next.js --check | --publish');
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
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/* every file an export, `main`, `module` or `style` names must be in the tarball */
const targets = (pkg) => {
	const out = new Set();
	const walk = (v) => { if (typeof v === 'string') out.add(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
	walk(pkg.exports);
	for (const k of ['main', 'module', 'style']) if (pkg[k]) out.add(pkg[k]);
	return [...out].map((t) => t.replace(/^\.\//, ''));
};

/* npm 10 and 11 print an array of tarballs, npm 12 an object keyed by package name */
const raw = JSON.parse(npm('pack', '--dry-run', '--json', '--ignore-scripts', ...packages.map(({ dir }) => `--workspace=${dir}`)));
const packed = Array.isArray(raw) ? raw : Object.values(raw).flat();
let failed = 0;
for (const { dir, pkg } of packages) {
	const tar = packed.find((p) => p.name === pkg.name);
	if (!tar) { failed++; console.log(`✗ ${pkg.name}@${pkg.version}  not in npm pack's output`); continue; }
	const files = new Set(tar.files.map((f) => f.path));
	const missing = targets(pkg).filter((t) => t.includes('*')
		? ![...files].some((f) => new RegExp(`^${t.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('*', '.+')}$`).test(f))
		: !files.has(t));
	/* every packed file is one git tracks (the built files are committed): a local, untracked file never ships */
	const tracked = new Set(git('ls-files', '-z', '--', dir).split('\0').filter(Boolean).map((f) => f.slice(dir.length + 1)));
	const untracked = [...files].filter((f) => !tracked.has(f));
	if (missing.length || untracked.length) failed++;
	console.log(`${missing.length || untracked.length ? '✗' : '✓'} ${pkg.name}@${pkg.version}  ${tar.entryCount} files, ${(tar.size / 1024).toFixed(1)} kB`
		+ `${missing.length ? `  missing: ${missing.join(', ')}` : ''}`
		+ `${untracked.length ? `  not in git (${untracked.length}): ${untracked.slice(0, 5).join(', ')}${untracked.length > 5 ? ', …' : ''}` : ''}`);
}
if (failed) { console.error(`${failed} package(s) export a file the tarball lacks, or pack a file git does not track`); process.exit(1); }
console.log(`${packages.length} packages under next, every export packed`);
if (!publish) process.exit(0);

/* which versions npm has, eight lookups at a time: a new package's document lags its dist-tags by minutes, so both are asked */
console.log('\nasking npm which versions it already has…');
const ask = promisify(execFile);
const onNpm = ({ name, version }) => Promise.all([
	ask('npm', ['dist-tag', 'ls', name], { cwd: root }).then(({ stdout }) => stdout.split('\n').some((l) => l.endsWith(`: ${version}`)), () => false),
	ask('npm', ['view', `${name}@${version}`, 'version'], { cwd: root }).then(({ stdout }) => stdout.trim() !== '', () => false),
]).then((found) => found.some(Boolean));
const has = new Array(packages.length).fill(false);
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
	while (next < packages.length) {
		const i = next++;
		has[i] = await onNpm(packages[i].pkg);
	}
}));
const todo = packages.filter((_, i) => !has[i]);
if (!todo.length) { console.log('npm already has every version'); process.exit(0); }
console.log(`${packages.length - todo.length} already on npm, ${todo.length} to publish`);

/* one package at a time, with npm's own prompts: no --otp, so npm signs in through the browser (one 2FA per OTP is what rate-limits) */
let done = 0;
for (const { dir, pkg } of todo) {
	console.log(`\npublishing ${pkg.name}@${pkg.version} (${done + 1} of ${todo.length})`);
	const r = spawnSync('npm', ['publish', `--workspace=${dir}`, '--tag', 'next', '--access', 'public'], { cwd: root, stdio: 'inherit' });
	if (r.status !== 0) {
		console.error(`\nstopped at ${pkg.name}@${pkg.version}: ${done} of ${todo.length} published. Run npm run publish-next again to go on.`);
		process.exit(1);
	}
	done++;
}
console.log(`\npublished ${done} package(s) under next`);

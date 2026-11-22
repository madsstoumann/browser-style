import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const rootPackage = JSON.parse(readFileSync(join(rootDir, 'package.json')));

// Every workspace in the root package.json (`ui/*`, `layout`, `ui/data/*`, …); a folder without a package.json is not a package
const workspaceDirs = rootPackage.workspaces.flatMap(pattern => {
  if (!pattern.endsWith('/*')) return [pattern];
  const parent = join(rootDir, pattern.slice(0, -2));
  if (!existsSync(parent)) return [];
  return readdirSync(parent, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => join(pattern.slice(0, -2), dirent.name));
}).filter(dir => existsSync(join(rootDir, dir, 'package.json')));

// The version of every @browser.style package in the workspace
const packages = {};
for (const dir of workspaceDirs) {
  const pkg = JSON.parse(readFileSync(join(rootDir, dir, 'package.json')));
  if (pkg.name?.startsWith('@browser.style/')) packages[pkg.name] = pkg.version;
}

// peerDependencies and dependencies on our own packages become ^<their workspace version>
for (const dir of workspaceDirs) {
  const packagePath = join(rootDir, dir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath));
  let updated = false;
  for (const field of ['peerDependencies', 'dependencies']) {
    for (const dep of Object.keys(packageJson[field] || {})) {
      const range = packages[dep] && `^${packages[dep]}`;
      if (range && packageJson[field][dep] !== range) {
        packageJson[field][dep] = range;
        updated = true;
      }
    }
  }
  if (updated) {
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated peer dependencies for ${packageJson.name}`);
  }
}

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const packages = {};

// Read workspace packages
const rootPackage = JSON.parse(readFileSync(join(rootDir, 'package.json')));

// Get all workspace package versions by reading the ui directory
const uiDir = join(rootDir, 'ui');
const uiPackages = readdirSync(uiDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Load all package versions
uiPackages.forEach(pkgName => {
  const packagePath = join(uiDir, pkgName, 'package.json');
  try {
    const pkg = JSON.parse(readFileSync(packagePath));
    if (pkg.name.startsWith('@browser.style/')) {
      packages[pkg.name] = pkg.version;
    }
  } catch (err) {
    console.warn(`Could not read package.json for ${pkgName}`);
  }
});

// Update peerDependencies in all packages
uiPackages.forEach(pkgName => {
  const packagePath = join(uiDir, pkgName, 'package.json');
  try {
    const packageJson = JSON.parse(readFileSync(packagePath));
    
    if (packageJson.peerDependencies) {
      let updated = false;
      Object.keys(packageJson.peerDependencies).forEach(dep => {
        if (packages[dep]) {
          packageJson.peerDependencies[dep] = `^${packages[dep]}`;
          updated = true;
        }
      });
      
      if (updated) {
        writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`Updated peer dependencies for ${packageJson.name}`);
      }
    }
  } catch (err) {
    console.warn(`Could not process package.json for ${pkgName}`);
  }
});

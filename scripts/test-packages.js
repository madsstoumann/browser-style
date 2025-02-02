import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const uiPath = join(__dirname, '..', 'ui');

const checkPackages = async () => {
  try {
    const dirs = await readdir(uiPath, { withFileTypes: true });
    
    console.log('\nChecking UI packages:\n');
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const hasPackage = existsSync(join(uiPath, dir.name, 'package.json'));
        console.log(`${dir.name}: ${hasPackage ? '✓ has package.json' : '⨯ no package.json'}`);
      }
    }
  } catch (error) {
    console.error('Error checking packages:', error);
  }
};

checkPackages();

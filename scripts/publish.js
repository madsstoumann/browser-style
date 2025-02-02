import { readdir, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const getPackages = async () => {
  const uiDir = join(__dirname, '..', 'ui');
  const dirs = await readdir(uiDir, { withFileTypes: true });
  const packages = [];

  for (const dir of dirs) {
    if (dir.isDirectory()) {
      try {
        await readFile(join(uiDir, dir.name, 'package.json'));
        packages.push(`ui/${dir.name}`);
      } catch {
        // Skip directories without package.json
      }
    }
  }
  return packages;
};

const publishPackages = async (otp) => {
  const packages = await getPackages();
  const workspaces = packages.map(pkg => `--workspace=${pkg}`).join(' ');
  const cmd = `npm publish ${workspaces} --access public --otp=${otp}`;
  execSync(cmd, { stdio: 'inherit' });
};

// Get OTP from command line argument
const otp = process.argv[2];
if (!otp) {
  console.error('Please provide OTP: node scripts/publish.js <otp>');
  process.exit(1);
}

publishPackages(otp);

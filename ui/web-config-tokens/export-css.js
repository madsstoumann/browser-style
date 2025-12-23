import { exportFromFile } from '../design-token-utils/exporters/toCSS.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, 'design.tokens.json');

console.log(`Exporting tokens from ${jsonPath}...`);

try {
  await exportFromFile(jsonPath);
  console.log('Export complete.');
} catch (error) {
  console.error('Export failed:', error);
  process.exit(1);
}

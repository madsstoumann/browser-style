import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function renderIcons(layouts, gap = 2, borderRadius = 4) {
  return layouts.map(layout => {
    if (!layout.icon) return null;
    
    return `<svg viewBox="0 0 100 100">${
      layout.icon.map((rect, index) => {
        const tX = rect.x + (rect.w / 2) - 4;
        const tY = rect.y + (rect.h / 2) + 2;
        return `
        <rect rx="${borderRadius}" width="${rect.w - gap}" height="${rect.h - gap}" x="${rect.x}" y="${rect.y}"${rect.class ? ` class="${rect.class}"` : ''} />
        <text x="${tX}" y="${tY}%">${index + 1}</text>`;
      }).join('')
    }${layout.text ? `<text x="50%" y="90%" class="text">${layout.text}</text>` : ''}
    </svg>`;
  }).filter(Boolean);
}

function buildIcons(gap = 2, borderRadius = 4) {
  try {
    const gridPath = path.join(__dirname, 'systems', 'layouts', 'grid.json');
    const gridData = JSON.parse(fs.readFileSync(gridPath, 'utf8'));
    
    const icons = renderIcons(gridData.layouts, gap, borderRadius);
    
    console.log(`Generated ${icons.length} icons from ${gridData.layouts.length} layouts`);
    return icons;
  } catch (error) {
    console.error('Error building icons:', error.message);
    return [];
  }
}

export {
  renderIcons,
  buildIcons
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const icons = buildIcons();
  icons.forEach((icon, index) => {
    console.log(`\n--- Icon ${index + 1} ---`);
    console.log(icon);
  });
}
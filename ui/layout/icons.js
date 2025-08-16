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
    const layoutsDir = path.join(__dirname, 'systems', 'layouts');
    const iconsDir = path.join(__dirname, 'dist', 'icons');
    
    // Create icons directory if it doesn't exist, or clear it if it does
    if (fs.existsSync(iconsDir)) {
      // Delete all files in the icons directory
      const files = fs.readdirSync(iconsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(iconsDir, file));
      });
    } else {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    // Get all JSON files from layouts directory
    const jsonFiles = fs.readdirSync(layoutsDir).filter(file => file.endsWith('.json'));
    
    let totalIcons = 0;
    
    jsonFiles.forEach(jsonFile => {
      const filePath = path.join(layoutsDir, jsonFile);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.layouts && Array.isArray(data.layouts)) {
        const icons = renderIcons(data.layouts, gap, borderRadius);
        const prefix = data.prefix || path.basename(jsonFile, '.json');
        
        // Save each icon as separate SVG file
        icons.forEach((icon, index) => {
          const layout = data.layouts[index];
          const layoutId = layout?.id || (index + 1);
          const fileName = `${prefix}(${layoutId}).svg`;
          const svgPath = path.join(iconsDir, fileName);
          fs.writeFileSync(svgPath, icon);
        });
        
        totalIcons += icons.length;
        console.log(`Generated ${icons.length} icons from ${jsonFile}`);
      }
    });
    
    console.log(`Total: Generated ${totalIcons} SVG files in icons/ folder`);
    return totalIcons;
  } catch (error) {
    console.error('Error building icons:', error.message);
    return 0;
  }
}

export {
  renderIcons,
  buildIcons
};

if (import.meta.url === `file://${process.argv[1]}`) {
  buildIcons();
}
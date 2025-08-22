import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import cssnano from 'cssnano';
import preset from 'cssnano-preset-advanced';

async function buildCSS() {
  const srcDir = 'src/css';
  const distDir = 'dist/static/css';
  
  // Ensure dist directory exists
  fs.mkdirSync(distDir, { recursive: true });
  
  // Process index.css
  const cssPath = path.join(srcDir, 'index.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  
  const result = await postcss([
    cssnano({
      preset: preset()
    })
  ]).process(css, { from: cssPath });
  
  fs.writeFileSync(path.join(distDir, 'index.min.css'), result.css);
  console.log('✓ CSS minified to dist/static/css/index.min.css');
}

buildCSS().catch(console.error);
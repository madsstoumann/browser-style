import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import cssnano from 'cssnano';
import preset from 'cssnano-preset-advanced';
import puppeteer from 'puppeteer';
import { minify } from 'html-minifier-terser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Static file server for build process
function createStaticServer(port = 3000) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath;
      
      // Handle different URL patterns
      if (req.url === '/') {
        filePath = path.join(__dirname, 'public/index.html');
      } else if (req.url.startsWith('/ui/layout/')) {
        // Proxy layout system requests to actual location
        const layoutPath = req.url.replace('/ui/layout/', '');
        filePath = path.join(__dirname, '../layout/', layoutPath);
      } else if (req.url.startsWith('/ui/content-card/')) {
        // Handle content-card internal paths (remove the prefix)
        const localPath = req.url.replace('/ui/content-card/', '');
        filePath = path.join(__dirname, localPath);
      } else {
        filePath = path.join(__dirname, req.url);
      }
      
      // Handle file extensions
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.avif': 'image/avif',
        '.png': 'image/png',
        '.jpg': 'image/jpeg'
      };
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log(`404: ${req.url} -> ${filePath}`);
          res.writeHead(404);
          res.end('File not found: ' + req.url);
          return;
        }
        
        res.writeHead(200, { 
          'Content-Type': mimeTypes[ext] || 'text/plain',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });
    
    server.listen(port, () => {
      console.log(`✓ Static server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

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

// Minify CSS files from public/static/css
async function minifyPublicCSS() {
  const publicCssDir = 'public/static/css';
  const distCssDir = 'dist/static/css';
  
  if (!fs.existsSync(publicCssDir)) return;
  
  // Process all CSS files recursively
  async function processDirectory(srcDir, destDir) {
    const items = fs.readdirSync(srcDir, { withFileTypes: true });
    
    for (const item of items) {
      const srcPath = path.join(srcDir, item.name);
      const destPath = path.join(destDir, item.name);
      
      if (item.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await processDirectory(srcPath, destPath);
      } else if (item.isFile() && path.extname(item.name) === '.css') {
        const css = fs.readFileSync(srcPath, 'utf8');
        
        const result = await postcss([
          cssnano({
            preset: preset()
          })
        ]).process(css, { from: srcPath });
        
        // Create minified filename (e.g., demo.css -> demo.min.css)
        const baseName = path.basename(item.name, '.css');
        const minifiedName = `${baseName}.min.css`;
        const minifiedPath = path.join(destDir, minifiedName);
        
        fs.writeFileSync(minifiedPath, result.css);
        console.log(`✓ CSS minified: ${srcPath} -> ${minifiedPath}`);
        
        // Don't copy the original CSS file since we have the minified version
      } else if (item.isFile() && path.extname(item.name) !== '.css') {
        // Copy non-CSS files as-is
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  await processDirectory(publicCssDir, distCssDir);
}

// Clean and minify HTML for production
async function cleanHTML(html) {
  // First, clean up development-specific content
  let cleanedHtml = html
    // Remove runtime script tag
    .replace(/<script type="module">\s*import { initContentCards }[^<]*<\/script>/gs, '')
    // Remove importmap script
    .replace(/<script type="importmap">\s*\{[\s\S]*?"@browser\.style\/layout"[\s\S]*?\}\s*<\/script>/gs, '')
    // Update CSS paths to minified versions
    .replace(/href="\.\.\/src\/css\/index\.css"/g, 'href="static/css/index.min.css"')
    // Update layout CSS path to local version
    .replace(/href="\/ui\/layout\/dist\/layout\.min\.css"/g, 'href="static/css/layout.min.css"')
    // Update CSS files to minified versions (but avoid double minification)
    .replace(/href="static\/css\/([^"]+?)(?<!\.min)\.css"/g, 'href="static/css/$1.min.css"')
    // Update static asset paths to be relative
    .replace(/href="static\//g, 'href="static/')
    .replace(/src="static\//g, 'src="static/');

  // Then minify the HTML
  try {
    const minifiedHtml = await minify(cleanedHtml, {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeScriptTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true,
      // Keep some readability for debugging
      conservativeCollapse: true,
      preserveLineBreaks: false
    });
    
    return minifiedHtml;
  } catch (error) {
    console.warn('HTML minification failed, using cleaned HTML:', error.message);
    return cleanedHtml.replace(/\n\s*\n/g, '\n').trim();
  }
}

// Render page with Puppeteer
async function renderPage(url, outputPath) {
  const browser = await puppeteer.launch({ headless: true }); // Run headless
  const page = await browser.newPage();
  
  try {
    console.log(`Loading ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Check what's available
    const debug = await page.evaluate(() => {
      return {
        hasCardData: !!window._cardData,
        hasContentElements: document.querySelectorAll('[content]').length,
        hasCustomElements: !!window.customElements,
        title: document.title
      };
    });
    console.log('Debug info:', debug);
    
    // Wait for cards to be loaded and rendered (more flexible)
    await page.waitForFunction(() => {
      const contentElements = document.querySelectorAll('[content]');
      return contentElements.length > 0 && Array.from(contentElements).some(el => el.innerHTML.trim() !== '');
    }, { timeout: 15000 });
    
    // Get the final HTML
    let html = await page.content();
    
    // Clean up and minify for production
    html = await cleanHTML(html);
    
    // Save to dist
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Rendered and minified ${path.basename(outputPath)}`);
    
  } finally {
    await browser.close();
  }
}

// Copy static assets to dist (excluding data and api since they're pre-rendered)
function copyAssets() {
  const publicStatic = 'public/static';
  const distStatic = 'dist/static';
  
  if (fs.existsSync(publicStatic)) {
    // Copy images only (CSS is handled by minifyPublicCSS)
    const imagePath = path.join(publicStatic, 'images');
    const destImagePath = path.join(distStatic, 'images');
    
    if (fs.existsSync(imagePath)) {
      fs.cpSync(imagePath, destImagePath, { recursive: true });
      console.log('✓ Static images copied to dist/static/images/');
    }
  }
  
  // Copy layout.min.css from layout system
  const layoutCssPath = '../layout/dist/layout.min.css';
  const distLayoutCssPath = 'dist/static/css/layout.min.css';
  
  if (fs.existsSync(layoutCssPath)) {
    // Ensure the CSS directory exists
    fs.mkdirSync(path.dirname(distLayoutCssPath), { recursive: true });
    fs.copyFileSync(layoutCssPath, distLayoutCssPath);
    console.log('✓ Layout CSS copied to dist/static/css/layout.min.css');
  }
}

async function build() {
  await buildCSS();
  await minifyPublicCSS();
  copyAssets();
  
  // Start static server
  const server = await createStaticServer();
  
  try {
    // Ensure dist directory exists
    fs.mkdirSync('dist', { recursive: true });
    
    // Render pages
    await renderPage('http://localhost:3000/public/index.html', 'dist/index.html');
    await renderPage('http://localhost:3000/public/cards.html', 'dist/cards.html');
    
    console.log('✓ Build complete');
  } finally {
    server.close();
  }
}

build().catch(console.error);
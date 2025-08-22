import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import cssnano from 'cssnano';
import preset from 'cssnano-preset-advanced';
import puppeteer from 'puppeteer';

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

// Clean HTML for production
function cleanHTML(html) {
  return html
    // Remove runtime script tag
    .replace(/<script type="module">\s*import { initContentCards }[^<]*<\/script>/gs, '')
    // Update CSS paths to minified versions
    .replace(/href="\.\.\/src\/css\/index\.css"/g, 'href="static/css/index.min.css"')
    // Update static asset paths to be relative
    .replace(/href="static\//g, 'href="static/')
    .replace(/src="static\//g, 'src="static/')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim();
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
    
    // Clean up for production
    html = cleanHTML(html);
    
    // Save to dist
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Rendered ${path.basename(outputPath)}`);
    
  } finally {
    await browser.close();
  }
}

// Copy static assets to dist (excluding data and api since they're pre-rendered)
function copyAssets() {
  const publicStatic = 'public/static';
  const distStatic = 'dist/static';
  
  if (fs.existsSync(publicStatic)) {
    // Copy only CSS and images, skip data and api folders
    const folders = ['css', 'images'];
    
    folders.forEach(folder => {
      const srcPath = path.join(publicStatic, folder);
      const destPath = path.join(distStatic, folder);
      
      if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      }
    });
    
    console.log('✓ Static assets (css, images) copied to dist/static/');
  }
}

async function build() {
  await buildCSS();
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
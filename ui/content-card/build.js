import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
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
    postcssImport(),
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

// Extract all CSS hrefs from HTML files in public directory
function extractCSSFromHTML() {
  const publicDir = 'public';
  const cssFiles = new Set();
  const excludedFiles = new Set();
  
  // Read all HTML files and extract CSS hrefs
  const htmlFiles = fs.readdirSync(publicDir)
    .filter(file => file.endsWith('.html') && fs.statSync(path.join(publicDir, file)).isFile());
  
  for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(path.join(publicDir, htmlFile), 'utf8');
    
    // Extract all CSS link hrefs
    const cssMatches = htmlContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi);
    if (cssMatches) {
      cssMatches.forEach(match => {
        const hrefMatch = match.match(/href=["']([^"']+)["']/);
        if (hrefMatch) {
          const href = hrefMatch[1];
          
          // Skip links marked for build exclusion
          if (match.includes('data-build="exclude"')) {
            excludedFiles.add(href);
            console.log(`⏭️  Excluded from bundle: ${href}`);
            return;
          }
          
          cssFiles.add(href);
        }
      });
    }
  }
  
  console.log(`Found ${cssFiles.size} CSS files for bundling:`, Array.from(cssFiles));
  if (excludedFiles.size > 0) {
    console.log(`Excluded ${excludedFiles.size} CSS files from bundling:`, Array.from(excludedFiles));
  }
  return Array.from(cssFiles);
}

// Generate content-card specific layout CSS
async function generateContentCardLayoutCSS() {
  try {
    console.log('🎨 Generating content-card layout CSS...');
    
    // Import from the layout package (simulated via import map)
    const { generateLayoutCSS } = await import('@browser.style/layout');
    
    const result = await generateLayoutCSS('./config.json', {
      layoutsPath: '../layout/systems',  // Local path for development
      outputPath: './temp-layout.css',
      minify: true
    });
    
    console.log(`✓ Generated layout CSS: ${(result.size / 1024).toFixed(1)}KB, ${result.rules} rules`);
    return result.outputPath;
  } catch (error) {
    console.error('❌ Failed to generate layout CSS:', error.message);
    // Fallback to copying existing layout CSS
    const fallbackPath = '../layout/dist/layout.min.css';
    if (fs.existsSync(fallbackPath)) {
      console.log('📋 Using fallback layout CSS');
      return fallbackPath;
    }
    throw error;
  }
}

// Bundle all CSS files into a single file
async function bundleCSS(cssFiles) {
  const bundledCSS = [];
  
  // Generate layout CSS first
  const layoutCssPath = await generateContentCardLayoutCSS();
  const layoutCSS = fs.readFileSync(layoutCssPath, 'utf8');
  bundledCSS.push('/* Generated Content-Card Layout CSS */');
  bundledCSS.push(layoutCSS);
  
  for (const cssFile of cssFiles) {
    let cssPath;
    
    // Handle different CSS path patterns
    if (cssFile.startsWith('../src/css/')) {
      // Source CSS files
      cssPath = cssFile.replace('../', '');
    } else if (cssFile.startsWith('static/css/')) {
      // Public CSS files
      cssPath = path.join('public', cssFile);
    } else {
      // Fallback
      cssPath = cssFile;
    }
    
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8');
      
      // Process with PostCSS
      const result = await postcss([
        postcssImport(),
        cssnano({
          preset: preset()
        })
      ]).process(css, { from: cssPath });
      
      bundledCSS.push(`/* ${cssFile} */`);
      bundledCSS.push(result.css);
      console.log(`✓ Bundled: ${cssFile}`);
    } else {
      console.warn(`⚠ CSS file not found: ${cssPath}`);
    }
  }
  
  // Ensure assets/css directory exists
  const assetsDir = '../../assets/css';
  fs.mkdirSync(assetsDir, { recursive: true });
  
  // Write bundled CSS
  const bundlePath = path.join(assetsDir, 'content-card-bundle.css');
  fs.writeFileSync(bundlePath, bundledCSS.join('\n\n'));
  console.log(`✓ CSS bundle created: ${bundlePath}`);
  
  // Clean up temporary layout CSS file
  try {
    if (layoutCssPath.includes('temp-layout.css')) {
      fs.unlinkSync(layoutCssPath);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
  
  return bundlePath;
}

// Clean and minify HTML for production
async function cleanHTML(html) {
  // First, clean up development-specific content and replace all CSS with bundle
  let cleanedHtml = html
    // Remove runtime script tag
    .replace(/<script type="module">\s*import { initContentCards }[^<]*<\/script>/gs, '')
    // Remove importmap script
    .replace(/<script type="importmap">\s*\{[\s\S]*?"@browser\.style\/layout"[\s\S]*?\}\s*<\/script>/gs, '')
    // Remove all existing CSS links
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    // Add CSS preload hint early in head (for parallel downloading)
    .replace('<meta name="view-transition"', '<link rel="preload" href="/assets/css/content-card-bundle.css" as="style">\n\t<meta name="view-transition"')
    // Add single CSS bundle link in head
    .replace('</head>', '\t<link rel="stylesheet" href="/assets/css/content-card-bundle.css">\n</head>')
    // Update static asset paths to be relative
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
  // Extract and bundle CSS first
  const cssFiles = extractCSSFromHTML();
  await bundleCSS(cssFiles);
  
  await buildCSS();
  await minifyPublicCSS();
  copyAssets();
  
  // Start static server
  const server = await createStaticServer();
  
  try {
    // Ensure dist directory exists
    fs.mkdirSync('dist', { recursive: true });
    
    // Discover and render all HTML files in public directory
    const publicDir = 'public';
    const htmlFiles = fs.readdirSync(publicDir)
      .filter(file => file.endsWith('.html') && fs.statSync(path.join(publicDir, file)).isFile());
    
    console.log(`Found ${htmlFiles.length} HTML files to build:`, htmlFiles);
    
    for (const htmlFile of htmlFiles) {
      const sourceUrl = `http://localhost:3000/public/${htmlFile}`;
      const outputPath = `dist/${htmlFile}`;
      await renderPage(sourceUrl, outputPath);
    }
    
    console.log('✓ Build complete');
  } finally {
    server.close();
  }
}

build().catch(console.error);
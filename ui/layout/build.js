#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CSS Layout Builder
 * Generates optimized CSS from config.json and layout JSON files
 */
class LayoutBuilder {
  constructor(configPath, layoutsDir, outputPath) {
    this.configPath = configPath;
    this.layoutsDir = layoutsDir;
    this.outputPath = outputPath;
    this.config = null;
    this.layouts = new Map();
    this.cssRules = new Map();
  }

  /**
   * Load configuration and layout files
   */
  async loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configContent);
      console.log('✓ Loaded config.json');
    } catch (error) {
      throw new Error(`Failed to load config: ${error.message}`);
    }
  }

  /**
   * Load all layout JSON files
   */
  async loadLayouts() {
    const layoutFiles = fs.readdirSync(this.layoutsDir)
      .filter(file => file.endsWith('.json'));

    for (const file of layoutFiles) {
      const layoutName = path.basename(file, '.json');
      const layoutPath = path.join(this.layoutsDir, file);
      
      try {
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        const layoutData = JSON.parse(layoutContent);
        
        // Handle new structure with layouts array
        if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
          // Store metadata and transform layouts
          const transformedData = {
            name: layoutData.name,
            prefix: layoutData.prefix,
            layouts: layoutData.layouts.map(layout => ({
              ...layout,
              id: `${layoutData.prefix}(${layout.id})`,  // Reconstruct full ID for CSS generation
              originalId: layout.id  // Keep original short ID for reference
            }))
          };
          this.layouts.set(layoutName, transformedData.layouts);
          // Store prefix mapping for CSS generation
          this.layouts.set(`${layoutName}_prefix`, layoutData.prefix);
        } else {
          // Handle old structure (if any files still use it)
          this.layouts.set(layoutName, layoutData);
        }
        
        console.log(`✓ Loaded ${file}`);
      } catch (error) {
        console.warn(`⚠ Failed to load ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Load core CSS files
   */
  async loadCoreFiles() {
    let coreCSS = '';
    
    if (this.config.core && Array.isArray(this.config.core)) {
      for (const coreFile of this.config.core) {
        const corePath = path.join(__dirname, 'core', `${coreFile}.css`);
        
        try {
          if (fs.existsSync(corePath)) {
            const coreContent = fs.readFileSync(corePath, 'utf8');
            coreCSS += coreContent + '\n\n';
            console.log(`✓ Loaded core file: ${coreFile}.css`);
          } else {
            console.warn(`⚠ Core file not found: ${coreFile}.css`);
          }
        } catch (error) {
          console.warn(`⚠ Failed to load core file ${coreFile}.css: ${error.message}`);
        }
      }
    }
    
    return coreCSS;
  }

  /**
   * Load common CSS files (loaded after layouts)
   */
  async loadCommonFiles() {
    let commonCSS = '';
    
    if (this.config.common && Array.isArray(this.config.common)) {
      for (const commonFile of this.config.common) {
        const commonPath = path.join(__dirname, 'core', `${commonFile}.css`);
        
        try {
          if (fs.existsSync(commonPath)) {
            const commonContent = fs.readFileSync(commonPath, 'utf8');
            commonCSS += commonContent + '\n\n';
            console.log(`✓ Loaded common file: ${commonFile}.css`);
          } else {
            console.warn(`⚠ Common file not found: ${commonFile}.css`);
          }
        } catch (error) {
          console.warn(`⚠ Failed to load common file ${commonFile}.css: ${error.message}`);
        }
      }
    }
    
    return commonCSS;
  }
  generateMediaQuery(breakpoint, config) {
    const conditions = [];
    if (config.min) conditions.push(`min-width: ${config.min}`);
    if (config.max) conditions.push(`max-width: ${config.max}`);
    
    if (config.type === '@media') {
      return `@media (${conditions.join(' and ')})`;
    } else if (config.type === '@container') {
      return `@container (${conditions.join(' and ')})`;
    }
    
    return null;
  }

  /**
   * Process layouts for a specific breakpoint
   */
  processBreakpoint(breakpointName, breakpointConfig) {
    const mediaQuery = this.generateMediaQuery(breakpointName, breakpointConfig);
    if (!mediaQuery) return;

    const processedLayouts = new Set();

    for (const layoutRef of breakpointConfig.layouts) {
      if (typeof layoutRef === 'string') {
        // Simple layout reference
        this.processLayout(layoutRef, breakpointName, mediaQuery, processedLayouts);
      } else if (typeof layoutRef === 'object') {
        // Complex layout reference with specific variants
        for (const [layoutType, variants] of Object.entries(layoutRef)) {
          for (const variant of variants) {
            this.processLayoutVariant(layoutType, variant, breakpointName, mediaQuery, processedLayouts);
          }
        }
      }
    }
  }

  /**
   * Extract layout identifier from full id string
   */
  extractLayoutId(fullId) {
    const match = fullId.match(/\(([^)]+)\)$/);
    return match ? match[1] : fullId;
  }

  /**
   * Process a single layout type
   */
  processLayout(layoutName, breakpointName, mediaQuery, processedLayouts) {
    const layoutData = this.layouts.get(layoutName);
    if (!layoutData) {
      console.warn(`⚠ Layout '${layoutName}' not found`);
      return;
    }

    const prefix = this.layouts.get(`${layoutName}_prefix`) || layoutName;

    for (const layout of layoutData) {
      const layoutId = this.extractLayoutId(layout.id);
      const key = `${mediaQuery}::${prefix}(${layoutId})`;
      
      if (processedLayouts.has(key)) continue;
      processedLayouts.add(key);

      this.generateLayoutCSS(layout, prefix, layoutId, breakpointName, mediaQuery);
    }
  }

  /**
   * Process a specific layout variant
   */
  processLayoutVariant(layoutType, variantId, breakpointName, mediaQuery, processedLayouts) {
    const layoutData = this.layouts.get(layoutType);
    if (!layoutData) {
      console.warn(`⚠ Layout type '${layoutType}' not found`);
      return;
    }

    const layout = layoutData.find(l => l.id === variantId);
    if (!layout) {
      console.warn(`⚠ Layout variant '${variantId}' not found in ${layoutType}`);
      return;
    }

    const layoutId = this.extractLayoutId(variantId);
    const key = `${mediaQuery}::${variantId}`;
    if (processedLayouts.has(key)) return;
    processedLayouts.add(key);

    this.generateLayoutCSS(layout, layoutType, layoutId, breakpointName, mediaQuery);
  }

  /**
   * Generate CSS for a specific layout
   */
  generateLayoutCSS(layout, layoutType, layoutId, breakpointName, mediaQuery) {
    const baseSelector = `lay-out[${breakpointName}="${layoutType}(${layoutId})"]`;
    
    // Container properties
    const containerProps = {
      '--layout-gtc': layout.columns || 'auto',
      '--layout-gtr': layout.rows || 'auto'
    };

    // Add global container rules
    const globalContainerSelector = `lay-out[${breakpointName}*="${layoutType}("]`;
    this.addRule(mediaQuery, globalContainerSelector, {
      '--_ga': 'initial'
    });

    // Add global child rules
    this.addRule(mediaQuery, `${globalContainerSelector} > *`, {
      '--layout-ga': 'auto'
    });

    // Add specific container rules
    this.addRule(mediaQuery, baseSelector, containerProps);

    // Process layout-specific rules
    if (layout.rules) {
      for (const rule of layout.rules) {
        let selector;
        
        if (rule.selector === '&') {
          selector = baseSelector;
        } else if (rule.selector === '&>*') {
          selector = `${baseSelector} > *`;
        } else if (rule.selector.startsWith('&')) {
          selector = baseSelector + rule.selector.substring(1);
        } else {
          selector = `${baseSelector} ${rule.selector}`;
        }

        this.addRule(mediaQuery, selector, rule.properties);
      }
    }
  }

  /**
   * Add a CSS rule to the collection
   */
  addRule(mediaQuery, selector, properties) {
    const key = `${mediaQuery}::${selector}`;
    
    if (!this.cssRules.has(key)) {
      this.cssRules.set(key, new Map());
    }

    const ruleProps = this.cssRules.get(key);
    for (const [prop, value] of Object.entries(properties)) {
      ruleProps.set(prop, value);
    }
  }

  /**
   * Minify CSS by removing unnecessary whitespace and formatting
   */
  minifyCSS(css) {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace and newlines
      .replace(/\s+/g, ' ')
      // Remove whitespace around selectors and braces
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*,\s*/g, ',')
      .replace(/\s*:\s*/g, ':')
      // Remove trailing semicolons before closing braces
      .replace(/;}/g, '}')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Generate optimized CSS output with breakpoint-specific layers
   */
  generateCSS(minify = false, coreCSS = '', commonCSS = '') {
    // Group rules by media query and breakpoint
    const breakpointGroups = new Map();
    
    for (const [key, properties] of this.cssRules) {
      const [mediaQuery, selector] = key.split('::', 2);
      
      // Extract breakpoint name from media query processing
      let breakpointName = 'unknown';
      for (const [bpName, bpConfig] of Object.entries(this.config.breakpoints)) {
        const expectedQuery = this.generateMediaQuery(bpName, bpConfig);
        if (expectedQuery === mediaQuery) {
          breakpointName = bpName;
          break;
        }
      }
      
      if (!breakpointGroups.has(breakpointName)) {
        breakpointGroups.set(breakpointName, new Map());
      }
      
      const breakpointRules = breakpointGroups.get(breakpointName);
      if (!breakpointRules.has(mediaQuery)) {
        breakpointRules.set(mediaQuery, new Map());
      }
      
      breakpointRules.get(mediaQuery).set(selector, properties);
    }

    let css = '';

    // Add core CSS first (already contains its own layers)
    if (coreCSS) {
      css += coreCSS;
    }

    // Process each breakpoint in its own layer
    for (const [breakpointName, mediaQueries] of breakpointGroups) {
      css += `@layer layout.${breakpointName} {\n`;
      
      // Process each media query within the breakpoint layer
      for (const [mediaQuery, rules] of mediaQueries) {
        css += `\t${mediaQuery} {\n`;
        
        // Group selectors with identical properties
        const propertyGroups = new Map();
        
        for (const [selector, properties] of rules) {
          const propsKey = JSON.stringify([...properties.entries()].sort());
          
          if (!propertyGroups.has(propsKey)) {
            propertyGroups.set(propsKey, { selectors: [], properties });
          }
          
          propertyGroups.get(propsKey).selectors.push(selector);
        }

        // Output grouped rules
        for (const { selectors, properties } of propertyGroups.values()) {
          const selectorList = selectors.join(',\n\t\t');
          css += `\t\t${selectorList} {\n`;
          
          for (const [prop, value] of properties) {
            css += `\t\t\t${prop}: ${value};\n`;
          }
          
          css += '\t\t}\n\n';
        }
        
        css += '\t}\n\n';
      }
      
      css += '}\n\n';
    }

    // Add common CSS last (animations, demo styles, etc.)
    if (commonCSS) {
      css += commonCSS;
    }

    return minify ? this.minifyCSS(css) : css;
  }

  /**
   * Build the complete CSS
   */
  async build(minify = false, outputName = 'layout') {
    console.log('🚀 Starting CSS build...\n');

    // Load configuration and layouts
    await this.loadConfig();
    await this.loadLayouts();

    // Load core CSS files
    const coreCSS = await this.loadCoreFiles();

    console.log('\n📝 Processing breakpoints...');

    // Process each breakpoint
    for (const [breakpointName, breakpointConfig] of Object.entries(this.config.breakpoints)) {
      console.log(`\t- Processing ${breakpointName} (${breakpointConfig.min})`);
      this.processBreakpoint(breakpointName, breakpointConfig);
    }

    // Load common CSS files (animations, demo styles, etc.)
    const commonCSS = await this.loadCommonFiles();

    console.log(`\n🎨 Generating ${minify ? 'minified' : 'optimized'} CSS...`);

    // Generate final CSS with core files and common files
    const css = this.generateCSS(minify, coreCSS, commonCSS);

    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Write output file to dist directory
    const outputPath = minify 
      ? path.join(distDir, `${outputName}.min.css`)
      : path.join(distDir, `${outputName}.css`);
    
    fs.writeFileSync(outputPath, css, 'utf8');

    console.log(`\n✅ Build complete!`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Generated ${this.cssRules.size} CSS rules`);
    console.log(`📏 File size: ${(css.length / 1024).toFixed(1)}KB`);
    
    return { outputPath, size: css.length, rules: this.cssRules.size };
  }

  /**
   * Generate HTML template for a layout file
   */
  generateLayoutHTML(layoutName, layoutData, layoutType) {
    const title = layoutType.name || `${layoutName.charAt(0).toUpperCase() + layoutName.slice(1)} Layouts`;
    const prefix = layoutType.prefix || layoutName;
    
  	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="layout.min.css">
</head>
<body>
	<h1>${title}</h1>`;

    // Add description from layout type data
    if (layoutType.desc) {
      html += `
	<p>${layoutType.desc}</p>`;
    } else {
      // Fallback description if no desc property is found
      html += `
	<p>These layouts use the <strong>${prefix}()</strong> layout mode to create various patterns.<br>
		${layoutData.some(l => l.repeatable) ? 'When you add more items, repeatable patterns continue automatically.' : 'Fixed layouts display a specific number of items.'}</p>`;
    }

    // Group layouts by item count
    const layoutsByItems = new Map();
    layoutData.forEach(layout => {
      const items = layout.items || 1;
      if (!layoutsByItems.has(items)) {
        layoutsByItems.set(items, []);
      }
      layoutsByItems.get(items).push(layout);
    });

    // Generate sections for each item count
    for (const [itemCount, layouts] of Array.from(layoutsByItems.entries()).sort(([a], [b]) => a - b)) {
      html += `\n\n	<h2>${itemCount} Item${itemCount !== 1 ? 's' : ''}</h2>`;
      
      for (const layout of layouts) {
        const layoutId = layout.originalId || layout.id.replace(`${prefix}(`, '').replace(')', '');
        const description = layout.description || '';
        
        // Generate breakpoint attributes from layout.breakpoints
        let breakpointAttrs = '';
        let codeExample = '';
        
        if (layout.breakpoints) {
          // Use the breakpoints defined in the layout
          const breakpointPairs = [];
          for (const [breakpoint, value] of Object.entries(layout.breakpoints)) {
            breakpointAttrs += ` ${breakpoint}="${value}"`;
            breakpointPairs.push(`${breakpoint}="${value}"`);
          }
          codeExample = `&lt;lay-out${breakpointAttrs}&gt;`;
        } else {
          // Fallback to old behavior if no breakpoints defined
          breakpointAttrs = ` md="columns(${itemCount})" lg="${prefix}(${layoutId})"`;
          codeExample = `&lt;lay-out lg="${prefix}(${layoutId})"&gt;`;
        }
        
        html += `
	<section>
		<h3>${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${layoutId}</h3>
		${description ? `<small>${description}</small>` : ''}
		<code>${codeExample}</code>
		<lay-out${breakpointAttrs}>`;

        // Add content items
        for (let i = 0; i < itemCount; i++) {
          html += `
			<item-card></item-card>`;
        }

        // Add repeat items if layout is repeatable
        if (layout.repeatable) {
          const repeatCount = Math.min(itemCount, 6); // Add same number as base items, max 6
          for (let i = 0; i < repeatCount; i++) {
            html += `
			<item-card repeat></item-card>`;
          }
        }

        html += `
		</lay-out>
	</section>`;
      }
    }

    html += `\n\n</body>
</html>`;

    return html;
  }

  /**
   * Generate all HTML demo files
   */
  async generateHTML() {
    console.log('\n🎨 Generating HTML demos...');
    
    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Get all layout files from layouts directory
    const layoutFiles = fs.readdirSync(this.layoutsDir)
      .filter(file => file.endsWith('.json') && file !== 'config.json');

    for (const file of layoutFiles) {
      const layoutName = path.basename(file, '.json');
      
      // Skip overflow or empty layout files
      if (layoutName === 'overflow') continue;
      
      const layoutPath = path.join(this.layoutsDir, file);
      
      try {
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        const layoutData = JSON.parse(layoutContent);
        
        // Handle new structure with layouts array
        if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
          if (layoutData.layouts.length === 0) {
            console.log(`⚠ Skipping ${file}: No layouts defined`);
            continue;
          }
          
          // Transform layouts for HTML generation (without full ID reconstruction)
          const layoutsForHTML = layoutData.layouts.map(layout => ({
            ...layout,
            originalId: layout.id  // Keep the original short ID for HTML
          }));
          
          const html = this.generateLayoutHTML(layoutName, layoutsForHTML, layoutData);
          const outputPath = path.join(distDir, `${layoutName}.html`);
          fs.writeFileSync(outputPath, html, 'utf8');
          console.log(`✓ Generated ${layoutName}.html`);
        } else {
          console.log(`⚠ Skipping ${file}: Old format or invalid structure`);
        }
      } catch (error) {
        console.warn(`⚠ Failed to generate HTML for ${file}: ${error.message}`);
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');
  const isMinify = args.includes('--minify');
  
  const configPath = path.join(__dirname, 'config.json');
  const layoutsDir = path.join(__dirname, 'layouts');
  const outputPath = path.join(__dirname, 'dist.css');

  const builder = new LayoutBuilder(configPath, layoutsDir, outputPath);

  const runBuild = async () => {
    try {
      // Build layout.css (standard)
      const layoutBuild = await builder.build(false, 'layout');
      
      // Generate HTML demos
      await builder.generateHTML();
      
      // Build minified version if requested or if not in watch mode
      if (isMinify || !isWatch) {
        const layoutMinBuild = await builder.build(true, 'layout');
        
        // Show comparison
        const reduction = Math.round((1 - layoutMinBuild.size / layoutBuild.size) * 100);
        console.log(`💾 Minified version: ${(layoutMinBuild.size / 1024).toFixed(1)}KB (${reduction}% smaller)`);
      }
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      if (!isWatch) process.exit(1);
    }
  };

  await runBuild();

  if (isWatch) {
    console.log('\n👀 Watching for changes...');
    
    // Watch config and layouts files
    const watchPaths = [configPath, layoutsDir];
    
    // Simple file watcher
    const { watch } = await import('fs');
    
    for (const watchPath of watchPaths) {
      watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.json') || filename.endsWith('.js'))) {
          console.log(`\n🔄 File changed: ${filename}`);
          runBuild();
        }
      });
    }
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Build watcher stopped');
      process.exit(0);
    });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default LayoutBuilder;

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
  constructor(configPath, buildDir, outputPath) {
    this.configPath = configPath;
    this.buildDir = buildDir;
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
    const layoutFiles = fs.readdirSync(this.buildDir)
      .filter(file => file.endsWith('.json'));

    for (const file of layoutFiles) {
      const layoutName = path.basename(file, '.json');
      const layoutPath = path.join(this.buildDir, file);
      
      try {
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        const layoutData = JSON.parse(layoutContent);
        this.layouts.set(layoutName, layoutData);
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
        const corePath = path.join(__dirname, 'modules', `${coreFile}.css`);
        
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

    for (const layout of layoutData) {
      const layoutId = this.extractLayoutId(layout.id);
      const key = `${mediaQuery}::${layoutName}(${layoutId})`;
      
      if (processedLayouts.has(key)) continue;
      processedLayouts.add(key);

      this.generateLayoutCSS(layout, layoutName, layoutId, breakpointName, mediaQuery);
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
   * Generate optimized CSS output
   */
  generateCSS(minify = false, coreCSS = '') {
    // Group rules by media query
    const mediaGroups = new Map();
    
    for (const [key, properties] of this.cssRules) {
      const [mediaQuery, selector] = key.split('::', 2);
      
      if (!mediaGroups.has(mediaQuery)) {
        mediaGroups.set(mediaQuery, new Map());
      }
      
      mediaGroups.get(mediaQuery).set(selector, properties);
    }

    let css = '';

    // Add core CSS first (outside of @layer layout)
    if (coreCSS) {
      css += coreCSS;
    }

    // Generate layout layer
    css += '@layer layout {\n';

    // Process each media query
    for (const [mediaQuery, rules] of mediaGroups) {
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

    css += '}\n';

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

    console.log(`\n🎨 Generating ${minify ? 'minified' : 'optimized'} CSS...`);

    // Generate final CSS with core files
    const css = this.generateCSS(minify, coreCSS);

    // Write output file
    const outputPath = minify 
      ? path.join(__dirname, `${outputName}.min.css`)
      : path.join(__dirname, `${outputName}.css`);
    
    fs.writeFileSync(outputPath, css, 'utf8');

    console.log(`\n✅ Build complete!`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Generated ${this.cssRules.size} CSS rules`);
    console.log(`📏 File size: ${(css.length / 1024).toFixed(1)}KB`);
    
    return { outputPath, size: css.length, rules: this.cssRules.size };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');
  const isMinify = args.includes('--minify');
  
  const configPath = path.join(__dirname, 'config.json');
  const buildDir = path.join(__dirname, 'build');
  const outputPath = path.join(__dirname, 'dist.css');

  const builder = new LayoutBuilder(configPath, buildDir, outputPath);

  const runBuild = async () => {
    try {
      // Build layout.css (standard)
      const layoutBuild = await builder.build(false, 'layout');
      
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
    
    // Watch config and build files
    const watchPaths = [configPath, buildDir];
    
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

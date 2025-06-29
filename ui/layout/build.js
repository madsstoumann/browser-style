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
            layouts: layoutData.layouts.map(layout => {
              // For content layouts, don't transform the ID as it already has the correct format
              if (layoutData.prefix === 'content') {
                return {
                  ...layout,
                  originalId: layout.id  // Keep original ID for reference
                };
              } else {
                return {
                  ...layout,
                  id: `${layoutData.prefix}(${layout.id})`,  // Reconstruct full ID for CSS generation
                  originalId: layout.id  // Keep original short ID for reference
                };
              }
            })
          };
          this.layouts.set(layoutName, transformedData.layouts);
          // Store prefix mapping for CSS generation
          this.layouts.set(`${layoutName}_prefix`, layoutData.prefix);
        } else if (layoutData.groups && typeof layoutData.groups === 'object') {
          // Handle grouped structure (like content.json)
          const allLayouts = [];
          
          for (const [groupName, groupData] of Object.entries(layoutData.groups)) {
            const groupPrefix = groupData.prefix || groupName;
            
            for (const layout of groupData.layouts) {
              allLayouts.push({
                ...layout,
                id: `${groupPrefix}(${layout.id})`,  // Create full ID: stack(t-l), columns(r-l), etc.
                originalId: layout.id,
                groupName: groupName,
                groupPrefix: groupPrefix
              });
            }
          }
          
          this.layouts.set(layoutName, allLayouts);
          // For grouped layouts, we don't set a single prefix
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
      return `@media (${conditions.join(') and (')})`;
    } else if (config.type === '@container') {
      return `@container (${conditions.join(') and (')})`;
    }
    
    return null;
  }

  /**
   * Process layouts for a specific breakpoint
   */
  processBreakpoint(breakpointName, breakpointConfig, layoutType = 'layout') {
    const mediaQuery = this.generateMediaQuery(breakpointName, breakpointConfig);
    if (!mediaQuery) return;

    const processedLayouts = new Set();
    const processedGlobalRules = new Set(); // Track global rules to avoid duplication

    for (const layoutRef of breakpointConfig.layouts) {
      if (typeof layoutRef === 'string') {
        // Simple layout reference
        this.processLayout(layoutRef, breakpointName, mediaQuery, processedLayouts, layoutType, processedGlobalRules);
      } else if (typeof layoutRef === 'object') {
        // Complex layout reference with specific variants
        for (const [layoutName, variants] of Object.entries(layoutRef)) {
          for (const variant of variants) {
            this.processLayoutVariant(layoutName, variant, breakpointName, mediaQuery, processedLayouts, layoutType, processedGlobalRules);
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
  processLayout(layoutName, breakpointName, mediaQuery, processedLayouts, layoutType = 'layout', processedGlobalRules = new Set()) {
    const layoutData = this.layouts.get(layoutName);
    if (!layoutData) {
      console.warn(`⚠ Layout '${layoutName}' not found`);
      return;
    }

    const prefix = this.layouts.get(`${layoutName}_prefix`) || layoutName;

    for (const layout of layoutData) {
      let layoutId;
      let actualPrefix;
      
      if (layoutType === 'content') {
        // For content layouts, use the full ID (which includes the function format)
        layoutId = layout.id;
        // For grouped layouts, use the group prefix, otherwise use the layout prefix
        actualPrefix = layout.groupPrefix || prefix;
      } else {
        // For regular layouts, extract the ID from parentheses if present
        layoutId = this.extractLayoutId(layout.id);
        actualPrefix = prefix;
      }
      
      const key = `${mediaQuery}::${actualPrefix}(${layoutId})`;
      
      if (processedLayouts.has(key)) continue;
      processedLayouts.add(key);

      this.generateLayoutCSS(layout, actualPrefix, layoutId, breakpointName, mediaQuery, layoutType, processedGlobalRules);
    }
  }

  /**
   * Process a specific layout variant
   */
  processLayoutVariant(layoutName, variantId, breakpointName, mediaQuery, processedLayouts, layoutType = 'layout', processedGlobalRules = new Set()) {
    const layoutData = this.layouts.get(layoutName);
    if (!layoutData) {
      console.warn(`⚠ Layout type '${layoutName}' not found`);
      return;
    }

    const layout = layoutData.find(l => l.id === variantId);
    if (!layout) {
      console.warn(`⚠ Layout variant '${variantId}' not found in ${layoutName}`);
      return;
    }

    let layoutId;
    
    if (layoutType === 'content') {
      // For content layouts, use the full ID
      layoutId = variantId;
    } else {
      // For regular layouts, extract the ID from parentheses if present
      layoutId = this.extractLayoutId(variantId);
    }
    
    const key = `${mediaQuery}::${variantId}`;
    if (processedLayouts.has(key)) return;
    processedLayouts.add(key);

    this.generateLayoutCSS(layout, layoutName, layoutId, breakpointName, mediaQuery, layoutType, processedGlobalRules);
  }

  /**
   * Generate CSS for a specific layout
   */
  generateLayoutCSS(layout, layoutPrefix, layoutId, breakpointName, mediaQuery, layoutType = 'layout', processedGlobalRules = new Set()) {
    // Determine the element selector based on layout type
    const elementSelector = layoutType === 'content' ? 'item-card' : 'lay-out';
    
    // For content layouts, use the full layout.id which already includes the format we want
    // For regular layouts, combine prefix and id
    let selectorValue;
    if (layoutType === 'content') {
      // For grouped content layouts, layout.id already contains the full format (e.g., "stack(t-l)")
      selectorValue = layout.id;
    } else {
      selectorValue = `${layoutPrefix}(${layoutId})`;
    }
    
    const baseSelector = `${elementSelector}[${breakpointName}="${selectorValue}"]`;
    
    // Container properties
    const containerProps = {};
    
    if (layoutType === 'layout') {
      // Traditional layout properties
      containerProps['--layout-gtc'] = layout.columns || 'auto';
      containerProps['--layout-gtr'] = layout.rows || 'auto';
    } else if (layoutType === 'content') {
      // Content-specific properties (using item-card custom properties)
      if (layout.columns && layout.columns !== '1fr') {
        containerProps['--item-card-gtc'] = layout.columns;
      }
      if (layout.rows && layout.rows !== 'auto') {
        containerProps['--item-card-gtr'] = layout.rows;
      }
    }

    // Add global container rules (only for layout, not content) - avoid duplicates
    if (layoutType === 'layout') {
      const globalRuleKey = `${mediaQuery}::${layoutPrefix}`;
      
      if (!processedGlobalRules.has(globalRuleKey)) {
        processedGlobalRules.add(globalRuleKey);
        
        const globalContainerSelector = `${elementSelector}[${breakpointName}*="${layoutPrefix}("]`;
        this.addRule(mediaQuery, globalContainerSelector, {
          '--_ga': 'initial'
        });

        // Add global child rules
        this.addRule(mediaQuery, `${globalContainerSelector} > *`, {
          '--layout-ga': 'auto'
        });
      }
    }

    // Add specific container rules (only if there are properties to set)
    if (Object.keys(containerProps).length > 0) {
      this.addRule(mediaQuery, baseSelector, containerProps);
    }

    // Process layout-specific rules
    if (layout.rules) {
      for (const rule of layout.rules) {
        let selector;
        
        if (rule.selector === '&') {
          selector = baseSelector;
        } else if (rule.selector === 'root') {
          // Root selector targets the element itself (e.g., item-card[xs="stack(t-l)"])
          selector = baseSelector;
        } else if (rule.selector === '&>*') {
          selector = `${baseSelector} > *`;
        } else if (rule.selector.startsWith('&')) {
          selector = baseSelector + rule.selector.substring(1);
        } else if (rule.selector === elementSelector) {
          // If the rule selector is the same as the base element, use the base selector
          selector = baseSelector;
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
   * Analyze property patterns and optimize for better grouping
   */
  optimizePropertyPatterns() {
    const optimizedRules = new Map();
    
    // Group rules by media query for within-breakpoint optimization
    const rulesByMediaQuery = new Map();
    
    for (const [key, properties] of this.cssRules) {
      const [mediaQuery, selector] = key.split('::', 2);
      
      if (!rulesByMediaQuery.has(mediaQuery)) {
        rulesByMediaQuery.set(mediaQuery, new Map());
      }
      
      rulesByMediaQuery.get(mediaQuery).set(selector, properties);
    }
    
    // Optimize within each media query
    for (const [mediaQuery, rules] of rulesByMediaQuery) {
      const optimized = this.optimizeWithinMediaQuery(mediaQuery, rules);
      
      for (const [selector, properties] of optimized) {
        const key = `${mediaQuery}::${selector}`;
        optimizedRules.set(key, properties);
      }
    }
    
    // Replace original rules with optimized ones
    this.cssRules = optimizedRules;
  }

  /**
   * Optimize rules within a single media query by extracting common patterns
   */
  optimizeWithinMediaQuery(mediaQuery, rules) {
    const propertyFrequency = new Map();
    const selectorsByProperty = new Map();
    
    // Analyze property frequency
    for (const [selector, properties] of rules) {
      for (const [prop, value] of properties) {
        const propValue = `${prop}:${value}`;
        
        if (!propertyFrequency.has(propValue)) {
          propertyFrequency.set(propValue, 0);
          selectorsByProperty.set(propValue, []);
        }
        
        propertyFrequency.set(propValue, propertyFrequency.get(propValue) + 1);
        selectorsByProperty.get(propValue).push(selector);
      }
    }
    
    // Find properties that appear in 3+ selectors (good candidates for grouping)
    const commonProperties = new Map();
    for (const [propValue, frequency] of propertyFrequency) {
      if (frequency >= 3) {
        const selectors = selectorsByProperty.get(propValue);
        commonProperties.set(propValue, selectors);
      }
    }
    
    // Create optimized rules
    const optimizedRules = new Map();
    const processedSelectors = new Set();
    
    // First, create grouped rules for common properties
    for (const [propValue, selectors] of commonProperties) {
      const [prop, value] = propValue.split(':', 2);
      
      // Group selectors that share this common property
      const groupedSelectors = selectors.filter(sel => {
        // Only group if selector hasn't been processed and shares this property
        const originalProps = rules.get(sel);
        return originalProps && originalProps.has(prop) && originalProps.get(prop) === value;
      });
      
      if (groupedSelectors.length >= 3) {
        // Create a grouped selector for this common property
        const groupedKey = groupedSelectors.sort().join(', ');
        
        if (!optimizedRules.has(groupedKey)) {
          optimizedRules.set(groupedKey, new Map());
        }
        
        optimizedRules.get(groupedKey).set(prop, value);
        
        // Mark these selectors as having this property processed
        groupedSelectors.forEach(sel => {
          if (!processedSelectors.has(sel)) {
            processedSelectors.add(sel);
          }
        });
      }
    }
    
    // Then, add remaining unique properties for each selector
    for (const [selector, properties] of rules) {
      const remainingProps = new Map();
      
      for (const [prop, value] of properties) {
        const propValue = `${prop}:${value}`;
        const commonSelectors = commonProperties.get(propValue) || [];
        
        // If this property wasn't grouped, or this selector wasn't part of the group
        if (!commonProperties.has(propValue) || commonSelectors.length < 3) {
          remainingProps.set(prop, value);
        }
      }
      
      // Add remaining properties if any
      if (remainingProps.size > 0) {
        optimizedRules.set(selector, remainingProps);
      }
    }
    
    return optimizedRules;
  }

  /**
   * Generate optimized CSS output with breakpoint-specific layers
   */
  generateCSS(minify = false, coreCSS = '', commonCSS = '') {
    // Apply property pattern optimization before generating CSS
    this.optimizePropertyPatterns();
    
    // Group rules by media query and breakpoint
    const layoutBreakpointGroups = new Map();
    const contentBreakpointGroups = new Map();
    
    for (const [key, properties] of this.cssRules) {
      const [mediaQuery, selector] = key.split('::', 2);
      
      // Determine if this is a layout or content rule
      const isContentRule = selector.includes('item-card[');
      const breakpointGroups = isContentRule ? contentBreakpointGroups : layoutBreakpointGroups;
      
      // Extract breakpoint name from media query processing
      let breakpointName = 'unknown';
      const configBreakpoints = isContentRule 
        ? (this.config.content?.breakpoints || {})
        : (this.config.layout?.breakpoints || this.config.breakpoints || {});
        
      for (const [bpName, bpConfig] of Object.entries(configBreakpoints)) {
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

    // Process layout breakpoints in their own layers
    for (const [breakpointName, mediaQueries] of layoutBreakpointGroups) {
      css += `@layer layout.${breakpointName} {\n`;
      
      // Process each media query within the breakpoint layer
      for (const [mediaQuery, rules] of mediaQueries) {
        css += `\t${mediaQuery} {\n`;
        css += this.generateRulesCSS(rules, '\t\t');
        css += '\t}\n\n';
      }
      
      css += '}\n\n';
    }

    // Process content breakpoints in content layer
    if (contentBreakpointGroups.size > 0) {
      css += `@layer layout.content {\n`;
      
      for (const [breakpointName, mediaQueries] of contentBreakpointGroups) {
        // Process each container query within the content layer
        for (const [mediaQuery, rules] of mediaQueries) {
          css += `\t${mediaQuery} {\n`;
          css += this.generateRulesCSS(rules, '\t\t');
          css += '\t}\n\n';
        }
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
   * Generate CSS rules with proper indentation and enhanced grouping
   */
  generateRulesCSS(rules, indent = '') {
    let css = '';
    
    // Separate single selectors from grouped selectors
    const singleRules = new Map();
    const groupedRules = new Map();
    
    for (const [selector, properties] of rules) {
      if (selector.includes(', ')) {
        // This is already a grouped selector from optimization
        groupedRules.set(selector, properties);
      } else {
        singleRules.set(selector, properties);
      }
    }
    
    // Output grouped rules first (they are more efficient)
    for (const [groupedSelector, properties] of groupedRules) {
      css += `${indent}${groupedSelector} {\n`;
      
      for (const [prop, value] of properties) {
        css += `${indent}\t${prop}: ${value};\n`;
      }
      
      css += `${indent}}\n\n`;
    }
    
    // Then group remaining single selectors with identical properties
    const propertyGroups = new Map();
    
    for (const [selector, properties] of singleRules) {
      const propsKey = JSON.stringify([...properties.entries()].sort());
      
      if (!propertyGroups.has(propsKey)) {
        propertyGroups.set(propsKey, { selectors: [], properties });
      }
      
      propertyGroups.get(propsKey).selectors.push(selector);
    }

    // Output newly grouped single rules
    for (const { selectors, properties } of propertyGroups.values()) {
      if (selectors.length > 1) {
        // Group multiple selectors with same properties
        const selectorList = selectors.sort().join(',\n' + indent);
        css += `${indent}${selectorList} {\n`;
      } else {
        // Single selector
        css += `${indent}${selectors[0]} {\n`;
      }
      
      for (const [prop, value] of properties) {
        css += `${indent}\t${prop}: ${value};\n`;
      }
      
      css += `${indent}}\n\n`;
    }
    
    return css;
  }

  /**
   * Reset builder state for a fresh build
   */
  reset() {
    this.config = null;
    this.layouts.clear();
    this.cssRules.clear();
  }

  /**
   * Build the complete CSS
   */
  async build(minify = false, outputName = 'layout') {
    // Reset state for fresh build
    this.reset();
    
    console.log('🚀 Starting CSS build...\n');

    // Load configuration and layouts
    await this.loadConfig();
    await this.loadLayouts();

    // Load core CSS files
    const coreCSS = await this.loadCoreFiles();

    console.log('\n📝 Processing breakpoints...');

    // Process layout breakpoints (media queries)
    if (this.config.layout && this.config.layout.breakpoints) {
      console.log('\n🔧 Processing layout breakpoints...');
      for (const [breakpointName, breakpointConfig] of Object.entries(this.config.layout.breakpoints)) {
        console.log(`\t- Processing layout ${breakpointName} (${breakpointConfig.min})`);
        this.processBreakpoint(breakpointName, breakpointConfig, 'layout');
      }
    }

    // Process content breakpoints (container queries)
    if (this.config.content && this.config.content.breakpoints) {
      console.log('\n📦 Processing content breakpoints...');
      for (const [breakpointName, breakpointConfig] of Object.entries(this.config.content.breakpoints)) {
        console.log(`\t- Processing content ${breakpointName} (${breakpointConfig.min})`);
        this.processBreakpoint(breakpointName, breakpointConfig, 'content');
      }
    }

    // Handle legacy config format (for backwards compatibility)
    if (this.config.breakpoints && !this.config.layout && !this.config.content) {
      console.log('\n⚠️  Processing legacy breakpoints format...');
      for (const [breakpointName, breakpointConfig] of Object.entries(this.config.breakpoints)) {
        console.log(`\t- Processing ${breakpointName} (${breakpointConfig.min})`);
        this.processBreakpoint(breakpointName, breakpointConfig, 'layout');
      }
    }

    // Load common CSS files (animations, demo styles, etc.)
    const commonCSS = await this.loadCommonFiles();

    console.log(`\n🎨 Generating ${minify ? 'minified' : 'optimized'} CSS...`);

    // Store original rule count for comparison
    const originalRuleCount = this.cssRules.size;

    // Generate final CSS with core files and common files
    const css = this.generateCSS(minify, coreCSS, commonCSS);

    // Calculate optimization stats
    const optimizedRuleCount = this.cssRules.size;
    const reductionPercent = Math.round((1 - optimizedRuleCount / originalRuleCount) * 100);

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
    console.log(`📊 Generated ${optimizedRuleCount} CSS rules (${reductionPercent}% reduction from ${originalRuleCount})`);
    console.log(`📏 File size: ${(css.length / 1024).toFixed(1)}KB`);
    
    return { outputPath, size: css.length, rules: optimizedRuleCount };
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
        } else if (layoutData.groups && typeof layoutData.groups === 'object') {
          // Handle grouped structure (like content.json)
          const allLayoutsForHTML = [];
          
          for (const [groupName, groupData] of Object.entries(layoutData.groups)) {
            for (const layout of groupData.layouts) {
              allLayoutsForHTML.push({
                ...layout,
                originalId: layout.id,  // Keep the original short ID for HTML
                groupName: groupName,
                groupPrefix: groupData.prefix || groupName
              });
            }
          }
          
          if (allLayoutsForHTML.length === 0) {
            console.log(`⚠ Skipping ${file}: No layouts defined in groups`);
            continue;
          }
          
          const html = this.generateLayoutHTML(layoutName, allLayoutsForHTML, layoutData);
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

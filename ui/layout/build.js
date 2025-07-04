#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import cssnano from 'cssnano';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LayoutBuilder {
  constructor(configPath, layoutsDir, outputPath) {
    this.configPath = configPath;
    this.layoutsDir = layoutsDir;
    this.outputPath = outputPath;
    this.config = null;
    this.layouts = new Map();
    this.cssRules = new Map();
    this.currentSystem = null;
  }

  async loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configContent);
      console.log('✓ Loaded config.json');
    } catch (error) {
      throw new Error(`Failed to load config: ${error.message}`);
    }
  }

  async loadLayouts(systemPath = '') {
    const targetDir = systemPath === '/' || systemPath === '' 
      ? this.layoutsDir 
      : path.join(this.layoutsDir, systemPath);
    
    if (!fs.existsSync(targetDir)) {
      console.warn(`⚠ Layout directory not found: ${targetDir}`);
      return;
    }

    const layoutFiles = fs.readdirSync(targetDir).filter(file => file.endsWith('.json'));

    for (const file of layoutFiles) {
      const layoutName = path.basename(file, '.json');
      const layoutPath = path.join(targetDir, file);
      
      try {
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        const layoutData = JSON.parse(layoutContent);
        
        if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
          const transformedData = {
            name: layoutData.name,
            prefix: layoutData.prefix,
            layouts: layoutData.layouts.map(layout => ({
              ...layout,
              id: `${layoutData.prefix}(${layout.id})`,
              originalId: layout.id
            }))
          };
          this.layouts.set(layoutName, transformedData.layouts);
          this.layouts.set(`${layoutName}_prefix`, layoutData.prefix);
        } else {
          this.layouts.set(layoutName, layoutData);
        }
        
        console.log(`✓ Loaded ${file}`);
      } catch (error) {
        console.warn(`⚠ Failed to load ${file}: ${error.message}`);
      }
    }
  }

  async loadCoreFiles(coreFiles = []) {
    let coreCSS = '';
    
    if (coreFiles && Array.isArray(coreFiles)) {
      for (const coreFile of coreFiles) {
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

  async loadCommonFiles(commonFiles = []) {
    let commonCSS = '';
    
    if (commonFiles && Array.isArray(commonFiles)) {
      for (const commonFile of commonFiles) {
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
  generateMediaQuery(breakpoint, config, layer = null) {
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

  processBreakpoint(breakpointName, breakpointConfig, systemType = 'layout') {
    const layer = this.currentSystem?.layer || null;
    const mediaQuery = this.generateMediaQuery(breakpointName, breakpointConfig, layer);
    if (!mediaQuery) return;

    const processedLayouts = new Set();
    const processedGlobalRules = new Set();

    for (const layoutRef of breakpointConfig.layouts) {
      if (typeof layoutRef === 'string') {
        this.processLayout(layoutRef, breakpointName, mediaQuery, processedLayouts, systemType, processedGlobalRules);
      } else if (typeof layoutRef === 'object') {
        for (const [layoutName, variants] of Object.entries(layoutRef)) {
          for (const variant of variants) {
            this.processLayoutVariant(layoutName, variant, breakpointName, mediaQuery, processedLayouts, systemType, processedGlobalRules);
          }
        }
      }
    }
  }

  extractLayoutId(fullId) {
    const match = fullId.match(/\(([^)]+)\)$/);
    return match ? match[1] : fullId;
  }

  processLayout(layoutName, breakpointName, mediaQuery, processedLayouts, layoutType = 'layout', processedGlobalRules = new Set()) {
    const layoutData = this.layouts.get(layoutName);
    if (!layoutData) {
      console.warn(`⚠ Layout '${layoutName}' not found`);
      return;
    }

    console.log(`🔍 Processing layout '${layoutName}' for breakpoint '${breakpointName}' with ${layoutData.length} layouts`);

    const prefix = this.layouts.get(`${layoutName}_prefix`) || layoutName;

    for (const layout of layoutData) {
      const layoutId = this.extractLayoutId(layout.id);
      const actualPrefix = prefix;
      
      const key = `${mediaQuery}::${actualPrefix}(${layoutId})`;
      
      console.log(`  - Layout ID: ${layout.id}, extracted: ${layoutId}, prefix: ${actualPrefix}`);
      
      if (processedLayouts.has(key)) continue;
      processedLayouts.add(key);

      this.generateLayoutCSS(layout, actualPrefix, layoutId, breakpointName, mediaQuery, layoutType, processedGlobalRules);
    }
  }

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

    const layoutId = this.extractLayoutId(variantId);
    
    const key = `${mediaQuery}::${variantId}`;
    if (processedLayouts.has(key)) return;
    processedLayouts.add(key);

    this.generateLayoutCSS(layout, layoutName, layoutId, breakpointName, mediaQuery, layoutType, processedGlobalRules);
  }

  generateLayoutCSS(layout, layoutPrefix, layoutId, breakpointName, mediaQuery, layoutType = 'layout', processedGlobalRules = new Set()) {
    const elementSelector = this.currentSystem.element || 'lay-out';
    const selectorValue = `${layoutPrefix}(${layoutId})`;
    const baseSelector = `${elementSelector}[${breakpointName}="${selectorValue}"]`;
    
    console.log(`    🎯 Generating CSS for ${baseSelector}`);
    
    const containerProps = {};
    const propertyPrefix = elementSelector === 'item-card' ? '--item-card' : '--layout';
    
    if (layout.columns) {
      containerProps[`${propertyPrefix}-gtc`] = layout.columns;
    }
    if (layout.rows) {
      containerProps[`${propertyPrefix}-gtr`] = layout.rows;
    }

    if (elementSelector === 'lay-out') {
      const globalRuleKey = `${mediaQuery}::${layoutPrefix}`;
      
      if (!processedGlobalRules.has(globalRuleKey)) {
        processedGlobalRules.add(globalRuleKey);
        
        const globalContainerSelector = `${elementSelector}[${breakpointName}*="${layoutPrefix}("]`;
        this.addRule(mediaQuery, globalContainerSelector, {
          '--_ga': 'initial'
        });

        this.addRule(mediaQuery, `${globalContainerSelector} > *`, {
          '--layout-ga': 'auto'
        });
      }
    }

    if (Object.keys(containerProps).length > 0) {
      this.addRule(mediaQuery, baseSelector, containerProps);
    }

    if (layout.rules) {
      console.log(`    📝 Processing ${layout.rules.length} layout-specific rules`);
      for (const rule of layout.rules) {
        let selector;
        
        if (rule.selector === '&') {
          selector = baseSelector;
        } else if (rule.selector === 'root') {
          selector = baseSelector;
        } else if (rule.selector === '&>*') {
          selector = `${baseSelector} > *`;
        } else if (rule.selector.startsWith('&')) {
          selector = baseSelector + rule.selector.substring(1);
        } else if (rule.selector === elementSelector) {
          selector = baseSelector;
        } else {
          selector = `${baseSelector} ${rule.selector}`;
        }

        this.addRule(mediaQuery, selector, rule.properties);
      }
    } else {
      console.log(`    ⚠️  No layout-specific rules found for ${layout.id}`);
    }
  }

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

  async minifyCSS(css) {
    const result = await postcss([cssnano({ preset: 'advanced' })]).process(css, { from: undefined });
    return result.css;
  }

  optimizePropertyPatterns() {
    const optimizedRules = new Map();
    const rulesByMediaQuery = new Map();
    
    for (const [key, properties] of this.cssRules) {
      const [mediaQuery, selector] = key.split('::', 2);
      
      if (!rulesByMediaQuery.has(mediaQuery)) {
        rulesByMediaQuery.set(mediaQuery, new Map());
      }
      
      rulesByMediaQuery.get(mediaQuery).set(selector, properties);
    }
    
    for (const [mediaQuery, rules] of rulesByMediaQuery) {
      const optimized = this.optimizeWithinMediaQuery(mediaQuery, rules);
      
      for (const [selector, properties] of optimized) {
        const key = `${mediaQuery}::${selector}`;
        optimizedRules.set(key, properties);
      }
    }
    
    this.cssRules = optimizedRules;
  }

  optimizeWithinMediaQuery(mediaQuery, rules) {
    const propertyFrequency = new Map();
    const selectorsByProperty = new Map();
    
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
    
    const commonProperties = new Map();
    for (const [propValue, frequency] of propertyFrequency) {
      if (frequency >= 3) {
        const selectors = selectorsByProperty.get(propValue);
        commonProperties.set(propValue, selectors);
      }
    }
    
    const optimizedRules = new Map();
    const processedSelectors = new Set();
    
    for (const [propValue, selectors] of commonProperties) {
      const [prop, value] = propValue.split(':', 2);
      
      const groupedSelectors = selectors.filter(sel => {
        const originalProps = rules.get(sel);
        return originalProps && originalProps.has(prop) && originalProps.get(prop) === value;
      });

      if (groupedSelectors.length >= 3) {
        const groupedKey = groupedSelectors.sort().join(', ');
        
        if (!optimizedRules.has(groupedKey)) {
          optimizedRules.set(groupedKey, new Map());
        }
        
        optimizedRules.get(groupedKey).set(prop, value);
        
        groupedSelectors.forEach(sel => {
          if (!processedSelectors.has(sel)) {
            processedSelectors.add(sel);
          }
        });
      }
    }
    
    for (const [selector, properties] of rules) {
      const remainingProps = new Map();
      
      for (const [prop, value] of properties) {
        const propValue = `${prop}:${value}`;
        const commonSelectors = commonProperties.get(propValue) || [];
        
        if (!commonProperties.has(propValue) || commonSelectors.length < 3) {
          remainingProps.set(prop, value);
        }
      }
      
      if (remainingProps.size > 0) {
        optimizedRules.set(selector, remainingProps);
      }
    }
    
    return optimizedRules;
  }

  async generateCSS(minify = false, coreCSS = '', commonCSS = '') {
    return this.generateSystemCSS(minify, coreCSS, commonCSS, this.currentSystem);
  }

  async generateSystemCSS(minify = false, coreCSS = '', commonCSS = '', system) {
    this.optimizePropertyPatterns();
    
    const breakpointGroups = new Map();
    
    for (const [key, properties] of this.cssRules) {
      const [mediaQuery, selector] = key.split('::', 2);
      
      let breakpointName = 'unknown';
      if (system.breakpoints) {
        for (const [bpName, bpConfig] of Object.entries(system.breakpoints)) {
          const expectedQuery = this.generateMediaQuery(bpName, bpConfig);
          if (expectedQuery === mediaQuery) {
            breakpointName = bpName;
            break;
          }
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

    if (coreCSS) {
      css += coreCSS;
    }

    if (system.layer) {
      for (const [breakpointName, mediaQueries] of breakpointGroups) {
        if (mediaQueries.size > 0) {
          css += `@layer ${system.layer}.${breakpointName} {\n`;
          
          for (const [mediaQuery, rules] of mediaQueries) {
            css += `\t${mediaQuery} {\n`;
            css += this.generateRulesCSS(rules, '\t\t');
            css += '\t}\n\n';
          }
          
          css += '}\n\n';
        }
      }
    } else {
      for (const [breakpointName, mediaQueries] of breakpointGroups) {
        for (const [mediaQuery, rules] of mediaQueries) {
          css += `${mediaQuery} {\n`;
          css += this.generateRulesCSS(rules, '\t');
          css += '}\n\n';
        }
      }
    }

    if (commonCSS) {
      css += commonCSS;
    }

    return minify ? await this.minifyCSS(css) : css;
  }

  generateRulesCSS(rules, indent = '') {
    let css = '';
    
    const singleRules = new Map();
    const groupedRules = new Map();
    
    for (const [selector, properties] of rules) {
      if (selector.includes(', ')) {
        groupedRules.set(selector, properties);
      } else {
        singleRules.set(selector, properties);
      }
    }
    
    for (const [groupedSelector, properties] of groupedRules) {
      css += `${indent}${groupedSelector} {\n`;
      
      for (const [prop, value] of properties) {
        css += `${indent}\t${prop}: ${value};\n`;
      }
      
      css += `${indent}}\n\n`;
    }
    
    const propertyGroups = new Map();
    
    for (const [selector, properties] of singleRules) {
      const propsKey = JSON.stringify([...properties.entries()].sort());
      
      if (!propertyGroups.has(propsKey)) {
        propertyGroups.set(propsKey, { selectors: [], properties });
      }
      
      propertyGroups.get(propsKey).selectors.push(selector);
    }

    for (const { selectors, properties } of propertyGroups.values()) {
      if (selectors.length > 1) {
        const selectorList = selectors.sort().join(',\n' + indent);
        css += `${indent}${selectorList} {\n`;
      } else {
        css += `${indent}${selectors[0]} {\n`;
      }
      
      for (const [prop, value] of properties) {
        css += `${indent}\t${prop}: ${value};\n`;
      }
      
      css += `${indent}}\n\n`;
    }
    
    return css;
  }

  reset() {
    this.layouts.clear();
    this.cssRules.clear();
  }

  async buildSystems(minify = false) {
    console.log('🚀 Starting CSS build...\n');

    await this.loadConfig();

    if (!this.config.systems || !Array.isArray(this.config.systems)) {
      throw new Error('Configuration must contain a "systems" array with the new format');
    }

    console.log(`📁 Found ${this.config.systems.length} system(s) to build...\n`);

    const buildResults = [];

    for (const system of this.config.systems) {
      console.log(`🔧 Building system: ${system.fileName || 'unnamed system'}`);
      
      this.currentSystem = system;
      
      this.reset();
      
      await this.loadLayouts(system.path);
      
      const coreCSS = await this.loadCoreFiles(system.core);
      
      console.log(`📝 Processing breakpoints for ${system.fileName}...`);
      
      if (system.breakpoints) {
        for (const [breakpointName, breakpointConfig] of Object.entries(system.breakpoints)) {
          console.log(`\t- Processing ${breakpointName} (${breakpointConfig.min})`);
          this.processBreakpoint(breakpointName, breakpointConfig, 'layout');
        }
      }
      
      const commonCSS = await this.loadCommonFiles(system.common);
      
      console.log(`🎨 Generating ${minify ? 'minified' : 'optimized'} CSS for ${system.fileName}...`);
      
      const css = await this.generateSystemCSS(minify, coreCSS, commonCSS, system);
      
      const distDir = path.join(__dirname, 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
      
      const fileName = system.fileName || 'output.css';
      const outputPath = minify 
        ? path.join(distDir, fileName.replace('.css', '.min.css'))
        : path.join(distDir, fileName);
      
      fs.writeFileSync(outputPath, css, 'utf8');
      
      const result = {
        system: system.fileName,
        outputPath,
        size: css.length,
        rules: this.cssRules.size
      };
      
      buildResults.push(result);
      
      console.log(`✅ ${system.fileName} complete!`);
      console.log(`📁 Output: ${outputPath}`);
      console.log(`📊 Generated ${result.rules} CSS rules`);
      console.log(`📏 File size: ${(result.size / 1024).toFixed(1)}KB\n`);
    }

    return buildResults;
  }

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
  <link rel="stylesheet" href="/ui/layout/demo.css">
</head>
<body>
	<h1>${title}</h1>`;

    if (layoutType.desc) {
      html += `
	<p>${layoutType.desc}</p>`;
    } else {
      html += `
	<p>These layouts use the <strong>${prefix}()</strong> layout mode to create various patterns.<br>
		${layoutData.some(l => l.repeatable) ? 'When you add more items, repeatable patterns continue automatically.' : 'Fixed layouts display a specific number of items.'}</p>`;
    }

    const layoutsByItems = new Map();
    layoutData.forEach(layout => {
      const items = layout.items || 1;
      if (!layoutsByItems.has(items)) {
        layoutsByItems.set(items, []);
      }
      layoutsByItems.get(items).push(layout);
    });

    for (const [itemCount, layouts] of Array.from(layoutsByItems.entries()).sort(([a], [b]) => a - b)) {
      html += `\n\n	<h2>${itemCount} Item${itemCount !== 1 ? 's' : ''}</h2>`;
      
      for (const layout of layouts) {
        const layoutId = layout.originalId || layout.id.replace(`${prefix}(`, '').replace(')', '');
        const description = layout.description || '';
        
        let breakpointAttrs = '';
        let codeExample = '';
        
        if (layout.breakpoints) {
          const breakpointPairs = [];
          for (const [breakpoint, value] of Object.entries(layout.breakpoints)) {
            breakpointAttrs += ` ${breakpoint}="${value}"`;
            breakpointPairs.push(`${breakpoint}="${value}"`);
          }
          codeExample = `&lt;lay-out${breakpointAttrs}&gt;`;
        } else {
          breakpointAttrs = ` md="columns(${itemCount})" lg="${prefix}(${layoutId})"`;
          codeExample = `&lt;lay-out lg="${prefix}(${layoutId})"&gt;`;
        }
        
        html += `
	<section>
		<h3>${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${layoutId}</h3>
		${description ? `<small>${description}</small>` : ''}
		<code>${codeExample}</code>
		<lay-out${breakpointAttrs}>`;

        for (let i = 0; i < itemCount; i++) {
          html += `
			<item-card></item-card>`;
        }

        if (layout.repeatable) {
          const repeatCount = Math.min(itemCount, 6);
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

  generateMainIndexHTML(generatedFiles) {
    const title = 'Layout System Demos';
    
    let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="A collection of layout system demos">
	<meta name="view-transition" content="same-origin">
	<link rel="stylesheet" href="/base.css">
</head>
<body>
	<h1>UI: Components</h1>
	<h2>Layouts</h2>
	
	<ol>`;

    // Sort files alphabetically for consistent ordering
    const sortedFiles = Array.from(generatedFiles).sort();
    
    for (const fileName of sortedFiles) {
      const layoutName = fileName.replace('.html', '');
      // Convert filename to display name (capitalize first letter)
      const displayName = layoutName.charAt(0).toUpperCase() + layoutName.slice(1);
      
      html += `
		<li><a href="${fileName}">${displayName}</a></li>`;
    }

    html += `
	</ol>
</body>
</html>`;

    return html;
  }

  async generateHTML() {
    console.log('\n🎨 Generating HTML demos...');
    
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    if (!this.config || !this.config.systems) {
      console.warn('⚠ Skipping HTML generation: config not loaded or no systems defined.');
      return;
    }

    const generatedFiles = new Set();

    for (const system of this.config.systems) {
      if (!system.generateHTML) {
        console.warn(`HTML generation disabled for ${system.fileName}`);
        continue;
      }
      const systemLayoutsDir = system.path ? path.join(this.layoutsDir, system.path) : this.layoutsDir;
      
      if (!fs.existsSync(systemLayoutsDir)) {
        console.warn(`⚠ Layout directory not found for system, skipping: ${systemLayoutsDir}`);
        continue;
      }

      const layoutFiles = fs.readdirSync(systemLayoutsDir)
        .filter(file => file.endsWith('.json') && file !== 'config.json');

      for (const file of layoutFiles) {
        const layoutName = path.basename(file, '.json');
        
        if (layoutName === 'overflow') continue;
        
        const layoutPath = path.join(systemLayoutsDir, file);
        
        try {
          const layoutContent = fs.readFileSync(layoutPath, 'utf8');
          const layoutData = JSON.parse(layoutContent);
          
          if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
            if (layoutData.layouts.length === 0) {
              console.log(`⚠ Skipping ${file}: No layouts defined`);
              continue;
            }
            
            const layoutsForHTML = layoutData.layouts.map(layout => ({
              ...layout,
              originalId: layout.id
            }));
            
            const html = this.generateLayoutHTML(layoutName, layoutsForHTML, layoutData);
            const outputPath = path.join(distDir, `${layoutName}.html`);
            fs.writeFileSync(outputPath, html, 'utf8');
            console.log(`✓ Generated ${layoutName}.html`);
            generatedFiles.add(`${layoutName}.html`);
          } else if (layoutData.groups && typeof layoutData.groups === 'object') {
            const allLayoutsForHTML = [];
            
            for (const [groupName, groupData] of Object.entries(layoutData.groups)) {
              for (const layout of groupData.layouts) {
                allLayoutsForHTML.push({
                  ...layout,
                  originalId: layout.id,
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
            generatedFiles.add(`${layoutName}.html`);
          } else {
            console.log(`⚠ Skipping ${file}: Old format or invalid structure`);
          }
        } catch (error) {
          console.warn(`⚠ Failed to generate HTML for ${file}: ${error.message}`);
        }
      }
    }

    // Generate the main index.html file
    const indexHTML = this.generateMainIndexHTML(generatedFiles);
    fs.writeFileSync(path.join(distDir, 'index.html'), indexHTML, 'utf8');
    console.log('✓ Generated index.html');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');
  const isMinify = args.includes('--minify');
  
  const configPath = path.join(__dirname, 'config.json');
  const layoutsDir = path.join(__dirname, 'systems');
  const outputPath = path.join(__dirname, 'dist.css');

  const builder = new LayoutBuilder(configPath, layoutsDir, outputPath);

  const runBuild = async () => {
    try {
      await builder.loadConfig();
      
      if (builder.config.systems && Array.isArray(builder.config.systems)) {
        console.log('📋 Using new systems configuration format');
        
        const systemBuilds = await builder.buildSystems(false);
        
        await builder.generateHTML();
        
        if (isMinify || !isWatch) {
          console.log('\n🗜️  Building minified versions...');
          const minifiedBuilds = await builder.buildSystems(true);
          
          for (let i = 0; i < systemBuilds.length; i++) {
            const normal = systemBuilds[i];
            const minified = minifiedBuilds[i];
            const reduction = Math.round((1 - minified.size / normal.size) * 100);
            console.log(`💾 ${normal.system} minified: ${(minified.size / 1024).toFixed(1)}KB (${reduction}% smaller)`);
          }
        }
      } else {
        throw new Error('Configuration must use the new "systems" array format. Legacy format is no longer supported.');
      }
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      if (!isWatch) process.exit(1);
    }
  };

  await runBuild();

  if (isWatch) {
    console.log('\n👀 Watching for changes...');
    
    const watchPaths = [configPath, layoutsDir];
    
    const { watch } = await import('fs');
    
    for (const watchPath of watchPaths) {
      watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.json') || filename.endsWith('.css'))) {
          console.log(`\n🔄 File changed: ${filename}`);
          runBuild();
        }
      });
    }
    
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

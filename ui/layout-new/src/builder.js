/**
 * @browser.style/layout - CSS Builder
 * Build CSS from layout.config and layout JSON files
 *
 * Implements per-breakpoint layout filtering:
 * - String in layouts array = ALL variants of that layout type
 * - Object in layouts array = ONLY specific variants
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Layout Builder Class
 */
export class LayoutBuilder {
	constructor(configPath, layoutsDir, outputPath) {
		this.configPath = configPath
		this.layoutsDir = layoutsDir
		this.outputPath = outputPath
		this.config = null
		this.layouts = new Map()
		this.layoutSystemLayouts = new Map() // For srcset generation
		this.cssRules = new Map()
	}

	/**
	 * Load layout.config file
	 */
	async loadConfig() {
		try {
			const configContent = fs.readFileSync(this.configPath, 'utf8')
			this.config = JSON.parse(configContent)
			console.log('✓ Loaded layout.config')
		} catch (error) {
			throw new Error(`Failed to load config: ${error.message}`)
		}
	}

	/**
	 * Load ALL layout JSON files from layouts folder
	 * (We load all, but only generate CSS for those specified in breakpoints)
	 */
	async loadLayouts() {
		const layoutFiles = fs.readdirSync(this.layoutsDir).filter(file => file.endsWith('.json'))

		for (const file of layoutFiles) {
			const layoutName = path.basename(file, '.json')
			const layoutPath = path.join(this.layoutsDir, file)

			try {
				const layoutContent = fs.readFileSync(layoutPath, 'utf8')
				const layoutData = JSON.parse(layoutContent)

				if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
					const transformedData = {
						name: layoutData.name,
						prefix: layoutData.prefix,
						layouts: layoutData.layouts.map(layout => ({
							...layout,
							id: `${layoutData.prefix}(${layout.id})`,
							originalId: layout.id
						}))
					}
					this.layouts.set(layoutName, transformedData.layouts)
					this.layouts.set(`${layoutName}_prefix`, layoutData.prefix)

					// Store for srcset generation
					this.layoutSystemLayouts.set(layoutName, transformedData.layouts)
					this.layoutSystemLayouts.set(`${layoutName}_prefix`, layoutData.prefix)
				} else {
					this.layouts.set(layoutName, layoutData)
					this.layoutSystemLayouts.set(layoutName, layoutData)
				}

				console.log(`✓ Loaded ${file}`)
			} catch (error) {
				console.warn(`⚠ Failed to load ${file}: ${error.message}`)
			}
		}
	}

	/**
	 * Load CSS files from /core folder
	 */
	async loadCSSFiles(files = [], fileType = 'file') {
		let css = ''

		for (const fileName of files) {
			const filePath = path.join(path.dirname(this.configPath), 'core', `${fileName}.css`)

			try {
				if (fs.existsSync(filePath)) {
					const content = fs.readFileSync(filePath, 'utf8')
					css += content + '\n\n'
					console.log(`✓ Loaded ${fileName}.css`)
				} else {
					console.warn(`⚠ CSS file not found: ${filePath}`)
				}
			} catch (error) {
				console.warn(`⚠ Failed to load ${fileName}.css: ${error.message}`)
			}
		}

		return css
	}

	/**
	 * Generate media query from breakpoint config
	 */
	generateMediaQuery(breakpointConfig) {
		const { type = '@media', min, max } = breakpointConfig

		const conditions = []
		if (min) conditions.push(`min-width: ${min}`)
		if (max) conditions.push(`max-width: ${max}`)

		if (conditions.length === 0) return null

		if (type === '@media') {
			return `@media (${conditions.join(') and (')})`
		} else if (type === '@container') {
			return `@container (${conditions.join(') and (')})`
		}

		return null
	}

	/**
	 * Process all breakpoints and generate CSS
	 * This is the CRITICAL method that implements per-breakpoint filtering
	 */
	async processBreakpoints() {
		const breakpoints = this.config.breakpoints || {}

		for (const [breakpointName, breakpointConfig] of Object.entries(breakpoints)) {
			await this.processBreakpoint(breakpointName, breakpointConfig)
		}
	}

	/**
	 * Process a single breakpoint
	 * Implements the string vs object logic for layout filtering
	 */
	async processBreakpoint(breakpointName, breakpointConfig) {
		const mediaQuery = this.generateMediaQuery(breakpointConfig)
		if (!mediaQuery) return

		const processedLayouts = new Set()
		const processedGlobalRules = new Set()

		// Process each layout reference in the breakpoint's layouts array
		for (const layoutRef of breakpointConfig.layouts || []) {
			if (typeof layoutRef === 'string') {
				// String = ALL variants of this layout type
				this.processLayout(layoutRef, breakpointName, mediaQuery, processedLayouts, processedGlobalRules)
			} else if (typeof layoutRef === 'object') {
				// Object = ONLY specific variants
				for (const [layoutName, variants] of Object.entries(layoutRef)) {
					for (const variant of variants) {
						this.processLayoutVariant(layoutName, variant, breakpointName, mediaQuery, processedLayouts, processedGlobalRules)
					}
				}
			}
		}
	}

	/**
	 * Process ALL variants of a layout type (e.g., "columns" = all 6 column layouts)
	 */
	processLayout(layoutName, breakpointName, mediaQuery, processedLayouts, processedGlobalRules) {
		const layoutData = this.layouts.get(layoutName)
		if (!layoutData) {
			console.warn(`⚠ Layout '${layoutName}' not found`)
			return
		}

		if (!Array.isArray(layoutData)) {
			console.warn(`⚠ Layout '${layoutName}' is not an array`)
			return
		}

		const prefix = this.layouts.get(`${layoutName}_prefix`) || layoutName

		for (const layout of layoutData) {
			const layoutId = this.extractLayoutId(layout.id)
			const key = `${mediaQuery}::${prefix}(${layoutId})`

			if (processedLayouts.has(key)) continue
			processedLayouts.add(key)

			this.generateLayoutCSS(layout, prefix, layoutId, breakpointName, mediaQuery, processedGlobalRules)
		}
	}

	/**
	 * Process a SPECIFIC variant of a layout type (e.g., "grid(3a)")
	 */
	processLayoutVariant(layoutName, variantId, breakpointName, mediaQuery, processedLayouts, processedGlobalRules) {
		const layoutData = this.layouts.get(layoutName)
		if (!layoutData) {
			console.warn(`⚠ Layout type '${layoutName}' not found`)
			return
		}

		// Find the specific variant
		const layout = layoutData.find(l => l.id === variantId)
		if (!layout) {
			console.warn(`⚠ Layout variant '${variantId}' not found in ${layoutName}`)
			return
		}

		const layoutId = this.extractLayoutId(variantId)
		const key = `${mediaQuery}::${variantId}`

		if (processedLayouts.has(key)) return
		processedLayouts.add(key)

		this.generateLayoutCSS(layout, layoutName, layoutId, breakpointName, mediaQuery, processedGlobalRules)
	}

	/**
	 * Extract layout ID from full ID (e.g., "columns(2)" => "2")
	 */
	extractLayoutId(fullId) {
		const match = fullId.match(/\(([^)]+)\)$/)
		return match ? match[1] : fullId
	}

	/**
	 * Generate CSS for a specific layout variant
	 */
	generateLayoutCSS(layout, layoutPrefix, layoutId, breakpointName, mediaQuery, processedGlobalRules) {
		const elementSelector = this.config.element || 'lay-out'
		const selectorValue = `${layoutPrefix}(${layoutId})`
		const baseSelector = `${elementSelector}[${breakpointName}="${selectorValue}"]`

		// Container properties (columns, rows)
		const containerProps = {}
		if (layout.columns) {
			containerProps['--layout-gtc'] = layout.columns
		}
		if (layout.rows) {
			containerProps['--layout-gtr'] = layout.rows
		}

		// Add --_ci property for columns layout type (items count)
		if (layoutPrefix === 'columns' && layout.items) {
			containerProps['--_ci'] = layout.items
		}

		// Global reset rules (once per layout type per breakpoint)
		const globalRuleKey = `${mediaQuery}::${layoutPrefix}`
		if (!processedGlobalRules.has(globalRuleKey)) {
			processedGlobalRules.add(globalRuleKey)

			const globalContainerSelector = `${elementSelector}[${breakpointName}*="${layoutPrefix}("]`
			this.addRule(mediaQuery, globalContainerSelector, {
				'--_ga': 'initial'
			})

			this.addRule(mediaQuery, `${globalContainerSelector} > *`, {
				'--layout-ga': 'auto'
			})
		}

		// Add container properties
		if (Object.keys(containerProps).length > 0) {
			this.addRule(mediaQuery, baseSelector, containerProps)
		}

		// Layout-specific rules (nth-child patterns)
		if (layout.rules && Array.isArray(layout.rules)) {
			for (const rule of layout.rules) {
				let selector

				if (rule.selector === '&' || rule.selector === 'root' || rule.selector === elementSelector) {
					selector = baseSelector
				} else if (rule.selector === '&>*') {
					selector = `${baseSelector} > *`
				} else if (rule.selector.startsWith('&')) {
					selector = baseSelector + rule.selector.substring(1)
				} else {
					selector = `${baseSelector} > ${rule.selector}`
				}

				this.addRule(mediaQuery, selector, rule.properties)
			}
		}
	}

	/**
	 * Add a CSS rule to the rules map
	 */
	addRule(mediaQuery, selector, properties) {
		const key = `${mediaQuery}::${selector}`

		if (!this.cssRules.has(key)) {
			this.cssRules.set(key, new Map())
		}

		const ruleProps = this.cssRules.get(key)
		for (const [prop, value] of Object.entries(properties)) {
			ruleProps.set(prop, value)
		}
	}

	/**
	 * Generate theme CSS from config.themes
	 */
	generateThemeCSS() {
		const themes = this.config.themes || {}
		let css = ''

		for (const [themeName, themeConfig] of Object.entries(themes)) {
			css += `${this.config.element}[theme="${themeName}"] {\n`
			css += `  --layout-bg: ${themeConfig.bg};\n`
			css += `  --layout-c: ${themeConfig.color};\n`
			css += `}\n\n`
		}

		return css
	}

	/**
	 * Assemble final CSS
	 */
	async generateCSS(minify = false, coreCSS = '', commonCSS = '') {
		let css = ''

		// Core CSS (base styles)
		if (coreCSS) {
			css += coreCSS
		}

		// Common CSS (animations, etc.)
		if (commonCSS) {
			css += commonCSS
		}

		// Theme CSS
		const themeCSS = this.generateThemeCSS()
		if (themeCSS) {
			css += `/* Themes */\n${themeCSS}\n`
		}

		// Layout-specific CSS by media query
		const rulesByMediaQuery = new Map()

		for (const [key, properties] of this.cssRules) {
			const [mediaQuery, selector] = key.split('::', 2)

			if (!rulesByMediaQuery.has(mediaQuery)) {
				rulesByMediaQuery.set(mediaQuery, [])
			}

			const props = Array.from(properties.entries())
				.map(([prop, value]) => `  ${prop}: ${value};`)
				.join('\n')

			rulesByMediaQuery.get(mediaQuery).push(`${selector} {\n${props}\n}`)
		}

		// Output CSS organized by media query
		for (const [mediaQuery, rules] of rulesByMediaQuery) {
			css += `\n${mediaQuery} {\n`
			css += rules.join('\n\n')
			css += `\n}\n`
		}

		// Note: Minification removed - let client build tools handle this
		// (Vite, webpack, PostCSS, etc. will minify CSS in production)

		return css
	}

	/**
	 * Build the layout system
	 */
	async build(minify = false) {
		console.log('\n🏗️  Building @browser.style/layout...\n')

		// Load configuration
		await this.loadConfig()

		// Load ALL layout files (we'll filter when generating CSS)
		await this.loadLayouts()

		// Load core CSS
		const coreCSS = await this.loadCSSFiles(this.config.core || [])
		const commonCSS = await this.loadCSSFiles(this.config.common || [])

		// Process breakpoints and generate layout CSS (with per-breakpoint filtering)
		await this.processBreakpoints()

		// Generate final CSS
		const css = await this.generateCSS(minify, coreCSS, commonCSS)

		// Write to output
		const outputDir = path.dirname(this.outputPath)
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		fs.writeFileSync(this.outputPath, css, 'utf8')
		console.log(`\n✓ Generated: ${this.outputPath}`)
		console.log(`  Size: ${(css.length / 1024).toFixed(2)} KB\n`)

		return {
			css,
			layouts: this.layoutSystemLayouts,
			config: this.config
		}
	}

	/**
	 * Build multiple outputs (regular + minified)
	 * Note: Minification is now handled by client build tools
	 */
	async buildAll() {
		// Just build once - minification happens at client build time
		return await this.build(false)
	}

	/**
	 * Get layouts data for srcset generation
	 */
	getLayoutsData() {
		return this.layoutSystemLayouts
	}
}

/**
 * Build layout CSS from config
 *
 * @param {Object} options - Build options
 * @param {string} [options.configPath] - Path to layout.config
 * @param {string} [options.layoutsPath] - Path to layouts folder
 * @param {string} [options.outputPath] - Output CSS path
 * @param {boolean} [options.minify] - Minify output
 * @returns {Promise<Object>} Build result
 */
export async function buildLayout(options = {}) {
	const configPath = options.configPath || path.join(process.cwd(), 'layout.config')
	const layoutsPath = options.layoutsPath || path.join(path.dirname(configPath), 'layouts')
	const outputPath = options.outputPath || path.join(process.cwd(), 'dist', 'layout.css')

	const builder = new LayoutBuilder(configPath, layoutsPath, outputPath)

	if (options.minify) {
		return await builder.buildAll()
	} else {
		return await builder.build(false)
	}
}

export default LayoutBuilder

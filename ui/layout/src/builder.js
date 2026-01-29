import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class LayoutBuilder {
	constructor(configPath, layoutsDir, outputPath, coreDir = null) {
		this.configPath = configPath
		this.layoutsDir = layoutsDir
		this.outputPath = outputPath
		this.coreDir = coreDir || path.join(path.dirname(configPath), 'core')
		this.config = null
		this.layouts = new Map()
		this.cssRules = new Map()
		this.ruleBreakpoints = new Map()
	}

	async loadConfig() {
		try {
			const configContent = fs.readFileSync(this.configPath, 'utf8')
			this.config = JSON.parse(configContent)
			console.log('✓ Loaded layout.config')
		} catch (error) {
			throw new Error(`Failed to load config: ${error.message}`)
		}
	}

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
						layouts: layoutData.layouts.map(layout => ({
							...layout,
							id: `${layoutData.prefix}(${layout.id})`
						}))
					}
					this.layouts.set(layoutName, transformedData.layouts)
					this.layouts.set(`${layoutName}_prefix`, layoutData.prefix)
				} else {
					this.layouts.set(layoutName, layoutData)
				}

				console.log(`✓ Loaded ${file}`)
			} catch (error) {
				console.warn(`⚠ Failed to load ${file}: ${error.message}`)
			}
		}
	}

	async loadCSSFiles(files = []) {
		let css = ''

		for (const fileName of files) {
			const filePath = path.join(this.coreDir, `${fileName}.css`)

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

	async processBreakpoints() {
		const breakpoints = this.config.breakpoints || {}

		for (const [breakpointName, breakpointConfig] of Object.entries(breakpoints)) {
			await this.processBreakpoint(breakpointName, breakpointConfig)
		}
	}

	async processBreakpoint(breakpointName, breakpointConfig) {
		const mediaQuery = this.generateMediaQuery(breakpointConfig)
		if (!mediaQuery) return

		const processedLayouts = new Set()
		const processedGlobalRules = new Set()

		for (const layoutRef of breakpointConfig.layouts || []) {
			if (typeof layoutRef === 'string') {
				this.processLayout(layoutRef, breakpointName, mediaQuery, processedLayouts, processedGlobalRules)
			} else if (typeof layoutRef === 'object') {
				for (const [layoutName, variants] of Object.entries(layoutRef)) {
					for (const variant of variants) {
						this.processLayoutVariant(layoutName, variant, breakpointName, mediaQuery, processedLayouts, processedGlobalRules)
					}
				}
			}
		}
	}

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

	processLayoutVariant(layoutName, variantId, breakpointName, mediaQuery, processedLayouts, processedGlobalRules) {
		const layoutData = this.layouts.get(layoutName)
		if (!layoutData) {
			console.warn(`⚠ Layout type '${layoutName}' not found`)
			return
		}

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

	extractLayoutId(fullId) {
		const match = fullId.match(/\(([^)]+)\)$/)
		return match ? match[1] : fullId
	}

	generateLayoutCSS(layout, layoutPrefix, layoutId, breakpointName, mediaQuery, processedGlobalRules) {
		const elementSelector = this.config.element || 'lay-out'
		const selectorValue = `${layoutPrefix}(${layoutId})`
		const baseSelector = `${elementSelector}[${breakpointName}="${selectorValue}"]`

		const containerProps = {}
		if (layout.columns) containerProps['--layout-gtc'] = layout.columns
		if (layout.rows) containerProps['--layout-gtr'] = layout.rows
		if (layoutPrefix === 'columns' && layout.items) containerProps['--_ci'] = layout.items
		if (layoutPrefix === 'lanes' && !isNaN(parseInt(layoutId))) {
			const cols = parseInt(layoutId)
			containerProps['--_ci'] = cols
			// Use auto-fill with calculated min-width accounting for gaps
			const gaps = cols - 1
			containerProps['--layout-gtc'] = `repeat(auto-fill, minmax(min(calc((100% - ${gaps} * var(--layout-colmg) * var(--layout-space-unit)) / ${cols}), 100%), 1fr))`
		}

		const globalRuleKey = `${mediaQuery}::${layoutPrefix}`
		if (!processedGlobalRules.has(globalRuleKey)) {
			processedGlobalRules.add(globalRuleKey)
			const globalContainerSelector = `${elementSelector}[${breakpointName}*="${layoutPrefix}("]`
			this.addRule(mediaQuery, globalContainerSelector, { '--_ga': 'initial' }, breakpointName)
			this.addRule(mediaQuery, `${globalContainerSelector} > *`, { '--layout-ga': 'auto' }, breakpointName)
		}

		if (Object.keys(containerProps).length > 0) {
			this.addRule(mediaQuery, baseSelector, containerProps, breakpointName)
		}

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

				this.addRule(mediaQuery, selector, rule.properties, breakpointName)
			}
		}
	}

	addRule(mediaQuery, selector, properties, breakpointName = null) {
		const key = `${mediaQuery}::${selector}`

		if (!this.cssRules.has(key)) {
			this.cssRules.set(key, new Map())
		}

		const ruleProps = this.cssRules.get(key)
		for (const [prop, value] of Object.entries(properties)) {
			ruleProps.set(prop, value)
		}

		if (breakpointName) {
			this.ruleBreakpoints.set(key, breakpointName)
		}
	}
	generateLayerDeclaration() {
		const baseLayers = ['layout.base', 'layout.reset', 'layout.animations']
		const breakpointNames = Object.keys(this.config.breakpoints || {})
		const breakpointLayers = breakpointNames.map(name => `layout.${name}`)
		return `@layer ${[...baseLayers, ...breakpointLayers].join(', ')};`
	}

	generateLayoutContainerCSS() {
		const container = this.config.layoutContainer
		if (!container) return ''

		const element = container.element || 'body'
		const maxWidth = container.maxWidth || 1024
		const margin = container.margin || '1rem'
		const setRoot = container.setRoot !== false

		const maxWidthPx = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

		let css = `\n${element} {
  --layout-bleed-mw: ${maxWidthPx};
  --layout-mi: ${margin};`

		if (setRoot) {
			css += `\n  margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw) / 2);`
		}

		css += `\n}\n`
		return css
	}

	async generateCSS(coreCSS = '', commonCSS = '') {
		let css = ''

		// Output layer declaration at the top
		css += this.generateLayerDeclaration() + '\n\n'

		if (coreCSS) css += coreCSS
		if (commonCSS) css += commonCSS

		// Group rules by media query, tracking breakpoint for each
		const rulesByMediaQuery = new Map()

		for (const [key, properties] of this.cssRules) {
			const [mediaQuery, selector] = key.split('::', 2)
			const breakpointName = this.ruleBreakpoints.get(key)

			if (!rulesByMediaQuery.has(mediaQuery)) {
				rulesByMediaQuery.set(mediaQuery, { rules: [], breakpointName })
			}

			const props = Array.from(properties.entries())
				.map(([prop, value]) => `    ${prop}: ${value};`)
				.join('\n')

			rulesByMediaQuery.get(mediaQuery).rules.push(`  ${selector} {\n${props}\n  }`)
		}

		// Output media queries with layer wrappers
		for (const [mediaQuery, { rules, breakpointName }] of rulesByMediaQuery) {
			css += `\n${mediaQuery} {\n`
			if (breakpointName) {
				css += `@layer layout.${breakpointName} {\n`
			}
			css += rules.join('\n\n')
			if (breakpointName) {
				css += `\n}\n`
			}
			css += `}\n`
		}

		css += this.generateLayoutContainerCSS()

		return css
	}

	async build() {
		console.log('\n🏗️  Building @browser.style/layout...\n')

		await this.loadConfig()
		await this.loadLayouts()

		const coreCSS = await this.loadCSSFiles(this.config.core || [])
		const commonCSS = await this.loadCSSFiles(this.config.common || [])

		await this.processBreakpoints()

		const css = await this.generateCSS(coreCSS, commonCSS)

		const outputDir = path.dirname(this.outputPath)
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		fs.writeFileSync(this.outputPath, css, 'utf8')
		console.log(`\n✓ Generated: ${this.outputPath}`)
		console.log(`  Size: ${(css.length / 1024).toFixed(2)} KB\n`)

		return {
			css,
			config: this.config
		}
	}
}

export async function buildLayout(options = {}) {
	const configPath = options.configPath || path.join(process.cwd(), 'layout.config.json')
	const layoutsPath = options.layoutsPath || path.join(path.dirname(configPath), 'layouts')
	const outputPath = options.outputPath || path.join(process.cwd(), 'dist', 'layout.css')
	const coreDir = options.coreDir || path.join(path.dirname(configPath), 'core')

	const builder = new LayoutBuilder(configPath, layoutsPath, outputPath, coreDir)
	return await builder.build(false)
}

export default LayoutBuilder

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

	/* Bundle external stylesheets verbatim (paths relative to the config file) —
	   keeps dist/layout.css a self-contained drop-in (e.g. shared carousel controls). */
	loadIncludeFiles(files = []) {
		let css = ''

		for (const file of files) {
			const filePath = path.resolve(path.dirname(this.configPath), file)

			try {
				if (fs.existsSync(filePath)) {
					css += `\n/* === included: ${file} === */\n` + fs.readFileSync(filePath, 'utf8') + '\n'
					console.log(`✓ Included ${file}`)
				} else {
					console.warn(`⚠ Include not found: ${filePath}`)
				}
			} catch (error) {
				console.warn(`⚠ Failed to include ${file}: ${error.message}`)
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
		// A breakpoint with no min/max (the mobile-first base, e.g. `xs`) yields a
		// null media query. Rather than skip it, emit its rules UN-wrapped (empty
		// string sentinel) so they apply at all widths; larger @media breakpoints
		// override via layer order. See generateCSS() for the empty-mq output path.
		const mediaQuery = this.generateMediaQuery(breakpointConfig) || ''

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

		this.generateSpacingCSS(breakpointName, mediaQuery, breakpointConfig)
		this.generateSubgridCSS(breakpointName, mediaQuery)
		this.generateAlignmentCSS(breakpointName, mediaQuery)
	}

	// items — per-breakpoint block-axis alignment of the layout's own children
	// (grid cells / flex slides), e.g. lg="columns(2) items(start)" to stop
	// unequal-height cells stretching to the tallest. Writes --layout-ai, which
	// base.css composes into `align-items`. Enumerated values only; exotic values
	// keep the `style="--layout-ai:…"` escape hatch.
	generateAlignmentCSS(breakpointName, mediaQuery) {
		const el = this.config.element || 'lay-out'
		for (const value of ['start', 'center', 'end', 'stretch']) {
			this.addRule(mediaQuery, `${el}[${breakpointName}*="items(${value})"]`,
				{ '--layout-ai': value }, breakpointName)
		}
	}

	// subgrid — breakpoint-scoped row alignment.
	//
	// ON: the `subgrid(on)` keyword in a breakpoint attribute (e.g.
	// lg="columns(3) subgrid(on)") turns it on from that breakpoint up. The row
	// count is set ONCE, globally, via the `subgrid="N"` attribute — read with
	// attr() into a typed custom property (a bare `grid-row: span attr()` doesn't
	// resolve, but `span var()` does). Each direct child adopts N shared rows,
	// aligning its internal rows (media / eyebrow / headline …) across the grid;
	// container-type is neutralised on those children so a card's own inline-size
	// container (which would sever the subgrid chain) steps out of the way.
	//
	// OFF: `subgrid(off)` turns it back off from a LARGER breakpoint up (e.g.
	// md="subgrid(on)" xl="subgrid(off)"). Because @media(min-width) is cumulative,
	// the ON rule persists at larger widths on its own; the OFF rule lives in the
	// later `@layer layout.<bp>`, so it wins by cascade-layer order (same
	// specificity, no hacks). It restores the container's default rows and the CARD
	// child's own inline-size query container — `revert-layer` can't be used here
	// because the ON rule sits in a lower layer that revert-layer would resolve back
	// to, so the reset uses explicit, card-oriented values. `~=` is exact-token
	// matching, so `subgrid(on)` and `subgrid(off)` never cross-match.
	//
	// Only emitted from `md` upward (never xs/sm) — subgrid at tiny widths makes no
	// sense (cards stack into one column).
	generateSubgridCSS(breakpointName, mediaQuery) {
		if (breakpointName === 'xs' || breakpointName === 'sm') return
		const el = this.config.element || 'lay-out'

		// ON — `subgrid(on)`.
		const on = `${el}[${breakpointName}~="subgrid(on)"]`
		this.addRule(mediaQuery, on,
			{ '--_sg': 'attr(subgrid type(<integer>), 1)', 'grid-template-rows': 'repeat(var(--_sg), auto)' }, breakpointName)
		this.addRule(mediaQuery, `${on} > :not(${el})`,
			{ 'container-type': 'normal', 'display': 'grid', 'grid-row': 'span var(--_sg)', 'grid-template-rows': 'subgrid' }, breakpointName)

		// OFF — `subgrid(off)`. Restore container rows + card child's query container.
		// Placement is handed BACK to whatever layout is active at this breakpoint by
		// re-asserting the same `grid-area` base rule uses (`var(--_ga, var(--layout-ga,
		// auto))`) — NOT a bare `grid-row: auto`, which would override the row half of
		// an area-placed layout's `--layout-ga` (bento / grid / mosaic / asym) and
		// collapse it. This works for uniform-cell layouts too (their --layout-ga is
		// `auto`). `grid-template-rows: initial` drops the child's own `subgrid`.
		const off = `${el}[${breakpointName}~="subgrid(off)"]`
		this.addRule(mediaQuery, off, { 'grid-template-rows': 'var(--layout-gtr)' }, breakpointName)
		this.addRule(mediaQuery, `${off} > :not(${el})`,
			{ 'container-type': 'inline-size', 'grid-area': 'var(--_ga, var(--layout-ga, auto))', 'grid-template-rows': 'initial' }, breakpointName)
	}

	// Spacing tokens — card-style, per-breakpoint, config-gated.
	//
	// Each token maps to one or more `--layout-*` custom properties that base.css
	// (and group.css) compose into padding/margin/gap. `p` (all-sides) and `pb`
	// (block) are shorthands that write several props at once. Margin is
	// block-only by design: margin-inline stays `auto` for centering.
	//
	// WHICH tokens are emitted is driven by config — a top-level `spacing.tokens`
	// default, overridable per breakpoint via `breakpointConfig.spacing`. This is
	// how a project trims generated CSS: only list the tokens each breakpoint
	// actually needs. Steps come from `spacing.steps` (the multiplier values).
	//
	// Selectors target BOTH the layout element and its `-group` sibling via :is(),
	// so <lay-out-group> spacing uses the same token vocabulary. `*=` (contains)
	// matching is collision-safe here because every value is delimited as `token(N)`
	// and no token name is a prefix of another up to its `(`.
	generateSpacingCSS(breakpointName, mediaQuery, breakpointConfig = {}) {
		const spacing = this.config.spacing
		if (!spacing) return

		// Optional allowlist: `spacing.breakpoints: ["xs","lg"]` limits spacing-token
		// generation to just those breakpoints. Omit it to emit for all breakpoints.
		if (Array.isArray(spacing.breakpoints) && !spacing.breakpoints.includes(breakpointName)) return

		const steps = spacing.steps || [0, 1, 2, 3, 4]
		// Token set: a per-breakpoint `spacing: [...]` array wins; otherwise the
		// top-level default. `spacing: []` on a breakpoint disables its tokens.
		const tokens = breakpointConfig.spacing !== undefined
			? breakpointConfig.spacing
			: (spacing.tokens || [])
		if (!tokens.length) return

		const el = this.config.element || 'lay-out'
		const groupEl = this.config.groupElement || `${el}-group`
		const scope = `:is(${el}, ${groupEl})`

		const TOKEN_PROPS = {
			p:   ['--layout-pi', '--layout-pbs', '--layout-pbe'],
			pi:  ['--layout-pi'],
			pb:  ['--layout-pbs', '--layout-pbe'],
			pbs: ['--layout-pbs'],
			pbe: ['--layout-pbe'],
			mbs: ['--layout-mbs'],
			mbe: ['--layout-mbe'],
			cg:  ['--layout-colmg'],
			rg:  ['--layout-rg'],
		}

		for (const token of tokens) {
			const props = TOKEN_PROPS[token]
			if (!props) {
				console.warn(`⚠ Unknown spacing token '${token}' in breakpoint '${breakpointName}'`)
				continue
			}
			for (const value of steps) {
				const selector = `${scope}[${breakpointName}*="${token}(${value})"]`
				const properties = {}
				for (const prop of props) properties[prop] = value
				this.addRule(mediaQuery, selector, properties, breakpointName)
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
		const isWildcard = layoutId === '*'
		const selectorValue = isWildcard
			? `${layoutPrefix}(`
			: `${layoutPrefix}(${layoutId})`
		const baseSelector = `${elementSelector}[${breakpointName}*="${selectorValue}"]`

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

		const breakpointResetKey = `${mediaQuery}::${breakpointName}`
		if (!processedGlobalRules.has(breakpointResetKey)) {
			processedGlobalRules.add(breakpointResetKey)
			const resetSelector = `${elementSelector}[${breakpointName}]`
			this.addRule(mediaQuery, resetSelector, { '--_ga': 'initial' }, breakpointName)
			this.addRule(mediaQuery, `${resetSelector} > *`, { '--layout-ga': 'auto' }, breakpointName)
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
		const layoutEl = this.config.element || 'lay-out'
		const maxWidth = container.maxWidth || 1024
		const margin = container.margin || '1rem'
		const setRoot = container.setRoot !== false

		const maxWidthPx = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

		// Public knobs live on :root so a project can override them from anywhere
		// (a later `:root { --layout-mi: … }` wins). Keep them here, NOT on the
		// container rule below — declaring them directly on <body> would beat an
		// inherited :root override and silently lock projects to these defaults.
		let css = `\n:root {
  --layout-bleed-mw: ${maxWidthPx};
  --layout-mi: ${margin};
}\n`

		if (setRoot) {
			// Container behaviour is gated on :has(<layout>) so dropping this
			// stylesheet onto a page is inert until a layout element exists — then
			// the container takes over page width. The :has() selector also lifts
			// specificity above base's :where(body) so the resets win without
			// !important. Values are read from the inherited :root knobs above.
			css += `${element}:has(${layoutEl}) {
  margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw) / 2);`
			// When the container is <body>, neutralise common base resets
			// (max-inline-size reading column + inline padding) so the layout's
			// calculated gutter fully owns page width and `bleed` breaks out cleanly.
			if (element === 'body') {
				css += `\n  max-inline-size: none;\n  padding-inline: 0;`
			}
			css += `\n}\n`
		}

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
			// split on the FIRST '::' only — selectors may contain '::' themselves (pseudo-elements)
			const sep = key.indexOf('::')
			const mediaQuery = key.slice(0, sep)
			const selector = key.slice(sep + 2)
			const breakpointName = this.ruleBreakpoints.get(key)

			if (!rulesByMediaQuery.has(mediaQuery)) {
				rulesByMediaQuery.set(mediaQuery, { rules: [], breakpointName })
			}

			const props = Array.from(properties.entries())
				.map(([prop, value]) => `    ${prop}: ${value};`)
				.join('\n')

			rulesByMediaQuery.get(mediaQuery).rules.push(`  ${selector} {\n${props}\n  }`)
		}

		// Output media queries with layer wrappers. An empty mediaQuery is the
		// mobile-first base breakpoint (no min/max) — emit its rules with NO @media
		// wrapper, still inside their `@layer layout.<bp>` so cascade order holds.
		for (const [mediaQuery, { rules, breakpointName }] of rulesByMediaQuery) {
			if (mediaQuery) css += `\n${mediaQuery} {\n`
			if (breakpointName) {
				css += `@layer layout.${breakpointName} {\n`
			}
			css += rules.join('\n\n')
			if (breakpointName) {
				css += `\n}\n`
			}
			if (mediaQuery) css += `}\n`
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
		const includeCSS = this.loadIncludeFiles(this.config.include || [])

		await this.processBreakpoints()

		const css = await this.generateCSS(coreCSS, commonCSS) + includeCSS

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

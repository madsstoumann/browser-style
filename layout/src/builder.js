import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Equal-width column tracks must not be widened by their own content.
 * `1fr` is shorthand for `minmax(auto, 1fr)`, and that `auto` floor is a grid item's
 * automatic minimum size — one item with a wide min-content (an unbreakable string, a
 * flex child that never got `min-width: 0`) grows its track and starves the others, so
 * a columns(2) grid silently stops being two equal columns. `minmax(0, 1fr)` removes the
 * floor. Only the columns() family is normalised: the pattern layouts (grid/bento/mosaic)
 * intentionally size some tracks to their content.
 */
const equalTracks = (tracks) => tracks.replace(/(^|\s)1fr(?=\s|$)/g, '$1minmax(0, 1fr)')

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
		this.ruleMeta = new Map()
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
				{ '--layout-ai': value }, breakpointName, { kind: 'feature', variantKey: `items(${value})` })
		}
	}

	// subgrid — breakpoint-scoped row alignment, one-way.
	//
	// The bare `subgrid` keyword in a breakpoint attribute (e.g.
	// lg="columns(3) subgrid") turns it on from that breakpoint up — there is no
	// off token: once a layout commits to shared rows it doesn't uncommit at a
	// larger width (the old subgrid(off) was removed with its parenthesised
	// spelling). The row count is set ONCE, globally, via the `subgrid="N"`
	// attribute — read with attr() into a typed custom property (a bare
	// `grid-row: span attr()` doesn't resolve, but `span var()` does). `~=` is
	// exact-token matching, so the token never collides with that attribute (a
	// selector on `[lg~="subgrid"]` never reads `subgrid="3"`).
	//
	// The heavy per-child body (container-type / display / grid-row /
	// grid-template-rows: subgrid) lives ONCE in core/base.css behind
	// `@container style(--_subgrid: on)` — the rule emitted here is just the flag
	// flip plus the container's own physical rows (physical because it must
	// outrank later breakpoints' --layout-gtr variant tokens).
	//
	// Only emitted from `md` upward (never xs/sm) — subgrid at tiny widths makes no
	// sense (cards stack into one column).
	generateSubgridCSS(breakpointName, mediaQuery) {
		if (breakpointName === 'xs' || breakpointName === 'sm') return
		const el = this.config.element || 'lay-out'

		this.addRule(mediaQuery, `${el}[${breakpointName}~="subgrid"]`,
			{ '--_subgrid': 'on', '--_sg': 'attr(subgrid type(<integer>), 1)', 'grid-template-rows': 'repeat(var(--_sg), auto)' },
			breakpointName, { kind: 'feature', variantKey: 'subgrid' })
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
	// Steps are numbers (multipliers, spelled literally: `cg(2)`) or labeled
	// objects `{label, value}` for word sizes (`cg(2xs)` -> 0.125). Both write the
	// same multiplier custom props; word labels follow the content-DSL ladder.
	//
	// Selectors target BOTH the layout element and its `-group` sibling via :is(),
	// so <lay-out-group> spacing uses the same token vocabulary. `*=` (contains)
	// matching is collision-safe here because every value is delimited as `token(N)`
	// and no token name is a prefix of another up to its `(`. Step spellings can't
	// cross-fire either: the needle includes the closing paren, so `cg(2)` is not
	// a substring of `cg(2xs)`.
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
			for (const step of steps) {
				const label = typeof step === 'object' ? step.label : step
				const value = typeof step === 'object' ? step.value : step
				const selector = `${scope}[${breakpointName}*="${token}(${label})"]`
				const properties = {}
				for (const prop of props) properties[prop] = value
				this.addRule(mediaQuery, selector, properties, breakpointName, { kind: 'feature', variantKey: `${token}(${label})` })
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
		if (layout.columns) containerProps['--layout-gtc'] = layoutPrefix === 'columns' ? equalTracks(layout.columns) : layout.columns
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
			this.addRule(mediaQuery, resetSelector, { '--_ga': 'initial' }, breakpointName, { kind: 'reset' })
			this.addRule(mediaQuery, `${resetSelector} > *`, { '--layout-ga': 'auto' }, breakpointName, { kind: 'reset' })
		}

		const meta = { kind: 'layout', variantKey: `${layoutPrefix}(${layoutId})`, prefix: layoutPrefix, wildcard: isWildcard }

		if (Object.keys(containerProps).length > 0) {
			this.addRule(mediaQuery, baseSelector, containerProps, breakpointName, meta)
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

				this.addRule(mediaQuery, selector, rule.properties, breakpointName, meta)
			}
		}
	}

	addRule(mediaQuery, selector, properties, breakpointName = null, meta = null) {
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
		if (meta) {
			this.ruleMeta.set(key, meta)
		}
	}

	// --- Grouped-selector emission -------------------------------------------
	//
	// Identical declaration bodies inside one media-query bucket are emitted ONCE
	// with a grouped selector list (`selA,\n  selB { … }`) instead of re-serialized
	// per rule. Grouping moves a later rule up to the group's first-occurrence
	// position, so it is only applied when provably cascade-safe: a merge is
	// blocked if any rule between the group and the candidate (a) sets one of the
	// candidate's properties with a DIFFERENT body and (b) could match the same
	// element (`mayCoMatch`). Different layout variants are mutually exclusive on
	// an element by the system's contract (one layout token per breakpoint
	// attribute), as are different values of the same feature token — those pairs
	// merge freely; everything else is treated conservatively as co-matching.

	static childPartOf(selector) {
		const i = selector.lastIndexOf(' > ')
		return i === -1 ? null : selector.slice(i + 3).trim()
	}

	// true only when the two subjects PROVABLY never coincide: two exact
	// :nth-child(N) indexes, or two same-modulus formulas (An+B vs An+C, B≠C —
	// different residues mod A never share an element). Everything else —
	// container vs child, mixed exact/formula, different moduli — stays "may
	// co-match" (a nested lay-out can be both container and child).
	static childDisjoint(a, b) {
		const re = /^\*?:nth-child\((?:(\d+)n\+)?(\d+)\)$/
		const ma = a && a.match(re)
		const mb = b && b.match(re)
		if (!ma || !mb) return false
		const modA = ma[1] || '', modB = mb[1] || ''
		return modA === modB && ma[2] !== mb[2]
	}

	static mayCoMatch(a, b) {
		if (!a.meta || !b.meta) return true
		if (a.meta.kind === 'reset' || b.meta.kind === 'reset') return true
		const va = a.meta.variantKey, vb = b.meta.variantKey
		if (a.meta.kind === 'layout' && b.meta.kind === 'layout') {
			if (va !== vb) {
				const overlap = (a.meta.wildcard && b.meta.prefix === a.meta.prefix)
					|| (b.meta.wildcard && a.meta.prefix === b.meta.prefix)
				if (!overlap) return false
			}
			return !LayoutBuilder.childDisjoint(a.childPart, b.childPart)
		}
		if (a.meta.kind === 'feature' && b.meta.kind === 'feature') {
			const name = (k) => k.slice(0, k.indexOf('('))
			if (va === vb) return !LayoutBuilder.childDisjoint(a.childPart, b.childPart)
			if (name(va) === name(vb)) return false
			return true
		}
		return true
	}

	groupBucketRules(bucket) {
		// bucket: [{selector, body, props:Set, meta, childPart}] in source order.
		// Returns [{selectors: [...], body}] preserving first-occurrence order.
		const groups = []
		const byBody = new Map()
		bucket.forEach((rule, i) => {
			rule.index = i
			const target = byBody.get(rule.body)
			let merged = false
			if (target) {
				let hazard = false
				for (let j = target.index + 1; j < i && !hazard; j++) {
					const h = bucket[j]
					if (h.body === rule.body) continue
					let intersects = false
					for (const p of rule.props) if (h.props.has(p)) { intersects = true; break }
					if (intersects && LayoutBuilder.mayCoMatch(h, rule)) hazard = true
				}
				if (!hazard) {
					target.group.selectors.push(rule.selector)
					merged = true
				}
			}
			if (!merged) {
				const group = { selectors: [rule.selector], body: rule.body }
				groups.push(group)
				// later duplicates merge into the MOST RECENT occurrence — the
				// shortest hazard window
				byBody.set(rule.body, { index: i, group })
			}
		})
		return groups
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

		// Emitted INSIDE `@layer layout.base` — the first (lowest-priority) layout
		// sub-layer, and the right home: these rules style the page container
		// (`:root` / `<body>`), not lay-out internals, so nothing in layout.reset,
		// layout.animations or the per-breakpoint layers competes with them. They
		// still beat `@browser.style/base`'s `:where(body)` reading column, because
		// pages link base BEFORE layout.css, so every `layout.*` layer sorts after
		// every `bs-*` layer.
		//
		// Consequence of layering (was unlayered until v4 Phase 6): an *unlayered*
		// author rule on `body` / `:root` now wins over these regardless of
		// specificity. For the `:root` knobs that is exactly the documented
		// contract ("override from anywhere"). For the container rule it means a
		// page with an unlayered `body { margin-inline / max-inline-size /
		// padding-inline }` takes page width back from the layout system — put such
		// overrides in a layer (or rely on the `--layout-mi` / `--layout-bleed-mw`
		// knobs) if the calculated gutter should keep winning.
		//
		// Public knobs live on :root so a project can override them from anywhere.
		// Keep them here, NOT on the container rule below — declaring them directly
		// on <body> would beat an inherited :root override and silently lock
		// projects to these defaults.
		let css = `\n@layer layout.base {\n  :root {
    --layout-bleed-mw: ${maxWidthPx};
    --layout-mi: ${margin};
  }\n`

		if (setRoot) {
			// Container behaviour is gated on :has(<layout>) so dropping this
			// stylesheet onto a page is inert until a layout element exists — then
			// the container takes over page width. The :has() selector also lifts
			// specificity above base's :where(body) so the resets win without
			// !important. Values are read from the inherited :root knobs above.
			css += `  ${element}:has(${layoutEl}) {
    margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw) / 2);`
			// When the container is <body>, neutralise common base resets
			// (max-inline-size reading column + inline padding) so the layout's
			// calculated gutter fully owns page width and `bleed` breaks out cleanly.
			if (element === 'body') {
				css += `\n    max-inline-size: none;\n    padding-inline: 0;`
			}
			css += `\n  }\n`
		}

		css += `}\n`

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
				rulesByMediaQuery.set(mediaQuery, { bucket: [], breakpointName })
			}

			const body = Array.from(properties.entries())
				.map(([prop, value]) => `    ${prop}: ${value};`)
				.join('\n')

			rulesByMediaQuery.get(mediaQuery).bucket.push({
				selector,
				body,
				props: new Set(properties.keys()),
				meta: this.ruleMeta.get(key) || null,
				childPart: LayoutBuilder.childPartOf(selector),
			})
		}

		// Output media queries with layer wrappers. An empty mediaQuery is the
		// mobile-first base breakpoint (no min/max) — emit its rules with NO @media
		// wrapper, still inside their `@layer layout.<bp>` so cascade order holds.
		for (const [mediaQuery, { bucket, breakpointName }] of rulesByMediaQuery) {
			const rules = this.groupBucketRules(bucket)
				.map(({ selectors, body }) => `  ${selectors.join(',\n  ')} {\n${body}\n  }`)
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

/**
 * @browser.style/layout - Srcset Utilities
 * Functions for generating responsive image srcsets from layout configurations
 */

/**
 * Auto-generate srcsets attribute from a layout preset
 *
 * NEW in v2: Automatically generates srcsets based on preset breakpoints
 *
 * @param {LayoutPreset} preset - Layout preset with breakpoint definitions
 * @param {LayoutConfig} config - Layout configuration
 * @param {Map} layoutsData - Layout data map
 * @returns {string} Srcsets string (e.g., "default:100vw;540:50%;720:33.33%")
 *
 * @example
 * ```javascript
 * const preset = {
 *   breakpoints: { md: 'columns(2)', lg: 'bento(4a)' }
 * }
 * const srcsets = autoGenerateSrcsets(preset, config, layoutsData)
 * // "default:100vw;540:50%;720:33.33%"
 * ```
 */
export function autoGenerateSrcsets(preset, config, layoutsData) {
	if (!preset.breakpoints || Object.keys(preset.breakpoints).length === 0) {
		return 'default:100vw'
	}

	const srcsetParts = ['default:100vw']

	for (const [breakpointName, layoutPattern] of Object.entries(preset.breakpoints)) {
		const srcset = getSrcsetForPattern(layoutPattern, layoutsData)
		if (srcset) {
			const pixelKey = getPixelKeyForBreakpoint(breakpointName, config)
			if (pixelKey) {
				srcsetParts.push(`${pixelKey}:${srcset}`)
			}
		}
	}

	return srcsetParts.join(';')
}

/**
 * Generate srcset strings from layout element attributes and layout data
 *
 * @param {HTMLElement|string} element - Layout element or HTML string
 * @param {LayoutConfig} config - Layout configuration
 * @param {Map} layoutsData - Layout data map
 * @returns {string} Srcsets string
 */
export function generateLayoutSrcsets(element, config, layoutsData) {
	const breakpoints = parseBreakpointsFromElement(element)

	if (!breakpoints || Object.keys(breakpoints).length === 0) {
		return 'default:100vw'
	}

	const srcsetParts = ['default:100vw']

	for (const [breakpointName, layoutPattern] of Object.entries(breakpoints)) {
		const srcset = getSrcsetForPattern(layoutPattern, layoutsData)
		if (srcset) {
			const pixelKey = getPixelKeyForBreakpoint(breakpointName, config)
			if (pixelKey) {
				srcsetParts.push(`${pixelKey}:${srcset}`)
			}
		}
	}

	return srcsetParts.join(';')
}

/**
 * Generate constraint-aware sizes attribute for responsive images
 *
 * Converts srcsets attribute and child index into a CSS sizes attribute
 *
 * @param {HTMLElement|string} layoutElementOrSrcsets - Layout element or srcsets string
 * @param {number} childIndex - Child element index (0-based)
 * @param {LayoutConfig} [config] - Layout configuration
 * @param {LayoutConstraints} [constraints] - Pre-calculated constraints
 * @returns {string} CSS sizes attribute value
 *
 * @example
 * ```javascript
 * getSrcset('<lay-out srcsets="default:100vw;540:50%;720:33.33%">', 0, config)
 * // "(min-width: 720px) min(33.33vw, 341px), (min-width: 540px) min(50vw, 512px), 100vw"
 * ```
 */
export function getSrcset(layoutElementOrSrcsets, childIndex, config = null, constraints = null) {
	let srcsets
	let layoutElement = null

	if (typeof layoutElementOrSrcsets === 'string') {
		const match = layoutElementOrSrcsets.match(/srcsets="([^"]+)"/)
		if (match) {
			srcsets = match[1]
		} else {
			srcsets = layoutElementOrSrcsets
		}
	} else if (layoutElementOrSrcsets?.getAttribute) {
		layoutElement = layoutElementOrSrcsets
		srcsets = layoutElementOrSrcsets.getAttribute('srcsets')
	}

	if (!srcsets) return '100vw'

	const rules = parseSrcsetRules(srcsets)
	const cssRules = []

	const sortedRules = rules
		.filter(rule => rule.pixelKey !== 'default')
		.sort((a, b) => {
			const aMin = parseInt(a.pixelKey.split('-')[0])
			const bMin = parseInt(b.pixelKey.split('-')[0])
			return bMin - aMin
		})

	for (const rule of sortedRules) {
		const width = getWidthForChild(rule.widths, childIndex)
		if (width) {
			let processedWidth = width
			if (config && width.includes('%')) {
				const elementOrConstraints = constraints || layoutElement || layoutElementOrSrcsets
				processedWidth = generateConstrainedSizes([width], elementOrConstraints, config)[0]
			}
			cssRules.push(`${rule.mediaQuery} ${processedWidth}`)
		}
	}

	const defaultRule = rules.find(rule => rule.pixelKey === 'default')
	if (defaultRule) {
		const defaultWidth = getWidthForChild(defaultRule.widths, childIndex)
		if (defaultWidth) {
			let processedWidth = defaultWidth
			if (config && defaultWidth.includes('%')) {
				const elementOrConstraints = constraints || layoutElement || layoutElementOrSrcsets
				processedWidth = generateConstrainedSizes([defaultWidth], elementOrConstraints, config)[0]
			}
			cssRules.push(processedWidth)
		}
	}

	return cssRules.join(', ') || '100vw'
}

/**
 * Extract breakpoint attributes from layout element
 *
 * @param {HTMLElement|string} element - Layout element or HTML string
 * @returns {Object} Breakpoint name to layout pattern mapping
 */
function parseBreakpointsFromElement(element) {
	let elementString

	if (typeof element === 'string') {
		elementString = element
	} else if (element?.outerHTML) {
		elementString = element.outerHTML
	} else {
		return {}
	}

	const breakpointRegex = /(\w+)="([^"]+)"/g
	const breakpoints = {}
	let match

	while ((match = breakpointRegex.exec(elementString)) !== null) {
		const [, breakpoint, value] = match
		if (breakpoint !== 'srcsets' && breakpoint !== 'overflow') {
			breakpoints[breakpoint] = value
		}
	}

	return breakpoints
}

/**
 * Look up srcset data for a specific layout pattern
 *
 * @param {string} pattern - Layout pattern (e.g., "columns(2)", "bento(4a)")
 * @param {Map} layoutsData - Layout data map
 * @returns {string|null} Srcset value or null
 */
function getSrcsetForPattern(pattern, layoutsData) {
	const match = pattern.match(/(\w+)\(([^)]+)\)/)
	if (!match) return null

	const [, layoutType, layoutId] = match

	let layouts = layoutsData.get(layoutType) ||
		layoutsData.get(layoutType + 's')

	if (!layouts) {
		for (const [, value] of layoutsData.entries()) {
			if (Array.isArray(value) && value.length > 0 && value[0].id?.startsWith(layoutType + '(')) {
				layouts = value
				break
			}
		}
	}

	if (!layouts) return null

	const layout = layouts.find(l => l.originalId === layoutId || l.id === `${layoutType}(${layoutId})`)
	return layout?.srcset || null
}

/**
 * Convert breakpoint name to pixel range key
 *
 * @param {string} breakpointName - Breakpoint name (e.g., "md", "lg")
 * @param {LayoutConfig} config - Layout configuration
 * @returns {string|null} Pixel key (e.g., "720", "720-1024")
 */
function getPixelKeyForBreakpoint(breakpointName, config) {
	const breakpointConfig = config?.breakpoints?.[breakpointName]

	if (!breakpointConfig) return null

	const min = breakpointConfig.min ? parseInt(breakpointConfig.min.replace('px', '')) : null
	const max = breakpointConfig.max ? parseInt(breakpointConfig.max.replace('px', '')) : null

	if (min && max) return `${min}-${max}`
	if (min) return `${min}`
	if (max) return `0-${max}`

	return null
}

/**
 * Transform layout files into a searchable Map structure
 *
 * @param {Object} layoutFiles - Layout files object
 * @returns {Map} Layout data map
 */
export function createLayoutsDataMap(layoutFiles) {
	const layoutsData = new Map()

	for (const [filename, layoutData] of Object.entries(layoutFiles)) {
		const layoutName = filename.replace('.json', '')

		if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
			const transformedLayouts = layoutData.layouts.map(layout => ({
				...layout,
				id: `${layoutData.prefix}(${layout.id})`,
				originalId: layout.id
			}))
			layoutsData.set(layoutName, transformedLayouts)
			layoutsData.set(`${layoutName}_prefix`, layoutData.prefix)
		} else {
			layoutsData.set(layoutName, layoutData)
		}
	}

	return layoutsData
}

/**
 * Parse srcset string into structured rules with media queries
 *
 * @param {string} srcsets - Srcsets string
 * @returns {Array} Array of parsed rules
 */
function parseSrcsetRules(srcsets) {
	return srcsets.split(';').map(rule => {
		const [pixelKey, widthsString] = rule.split(':')
		const widths = widthsString.split(',').map(w => w.trim())

		let mediaQuery = null
		if (pixelKey !== 'default') {
			if (pixelKey.includes('-')) {
				const [min, max] = pixelKey.split('-')
				mediaQuery = `(min-width: ${min}px) and (max-width: ${max}px)`
			} else {
				mediaQuery = `(min-width: ${pixelKey}px)`
			}
		}

		return { pixelKey, mediaQuery, widths }
	})
}

/**
 * Get width value for specific child position in layout
 *
 * @param {string[]} widths - Array of width values
 * @param {number} childIndex - Child index (0-based)
 * @returns {string} Width value
 */
function getWidthForChild(widths, childIndex) {
	if (widths.length === 1) return widths[0]
	if (childIndex < widths.length) return widths[childIndex]
	return widths[widths.length - 1]
}

/**
 * Convert percentage widths to constrained sizes with min() functions
 *
 * @param {string[]} percentages - Array of percentage widths
 * @param {HTMLElement|LayoutConstraints} elementOrConstraints - Element or constraints
 * @param {LayoutConfig} config - Layout configuration
 * @returns {string[]} Array of constrained size values
 */
function generateConstrainedSizes(percentages, elementOrConstraints, config) {
	const constraints = elementOrConstraints.hasMaxWidth !== undefined
		? elementOrConstraints
		: getLayoutConstraints(elementOrConstraints, config)

	return percentages.map(percentage => {
		const percent = parseFloat(percentage)

		if (!constraints.hasMaxWidth) {
			return `${percent}vw`
		}

		return generateComplexSizes(percent, constraints, config)
	})
}

/**
 * Extract layout constraints from element and config
 *
 * @param {HTMLElement|string} element - Layout element or HTML string
 * @param {LayoutConfig} config - Layout configuration
 * @returns {LayoutConstraints} Layout constraints
 */
export function getLayoutConstraints(element, config) {
	const layoutConfig = config?.layoutContainer
	if (!layoutConfig) return { hasMaxWidth: false }

	const constraints = {
		hasMaxWidth: false,
		maxWidth: null,
		widthToken: null,
		globalMaxWidth: layoutConfig.maxLayoutWidth?.value,
		layoutMargin: layoutConfig.layoutMargin?.value,
		hasBleed: false
	}

	let bleedValue = null
	let widthAttribute = null

	if (typeof element === 'string') {
		const bleedMatch = element.match(/bleed="([^"]*)"/)
		bleedValue = bleedMatch ? bleedMatch[1] : null
		const widthMatch = element.match(/width="([^"]+)"/)
		widthAttribute = widthMatch ? widthMatch[1] : null
	} else if (element?.hasAttribute) {
		bleedValue = element.hasAttribute('bleed') ? element.getAttribute('bleed') : null
		widthAttribute = element.getAttribute('width')
	}

	if (bleedValue === '0') {
		return { hasMaxWidth: false, hasBleed: true, isFullWidth: true }
	} else if (bleedValue !== null) {
		constraints.hasBleed = true
	}

	if (widthAttribute) {
		constraints.hasMaxWidth = true
		constraints.widthToken = widthAttribute
		constraints.maxWidth = layoutConfig.widthTokens?.[constraints.widthToken]?.value
	} else if (constraints.globalMaxWidth) {
		constraints.hasMaxWidth = true
		constraints.maxWidth = constraints.globalMaxWidth
	}

	return constraints
}

/**
 * Generate min() CSS function for constrained layouts
 *
 * @param {number} percentage - Width percentage
 * @param {LayoutConstraints} constraints - Layout constraints
 * @param {LayoutConfig} config - Layout configuration
 * @returns {string} CSS size value
 */
function generateComplexSizes(percentage, constraints, config) {
	const breakpoints = config?.breakpoints
	if (!breakpoints) return `${percentage}vw`

	if (constraints.maxWidth && constraints.maxWidth.includes('vw')) {
		return `${percentage}vw`
	}

	const maxWidthValue = constraints.maxWidth.includes('rem')
		? parseFloat(constraints.maxWidth) * 16
		: parseFloat(constraints.maxWidth)

	const constrainedWidth = Math.round(maxWidthValue * (percentage / 100))
	return `min(${percentage}vw, ${constrainedWidth}px)`
}

/**
 * Apply layout CSS custom properties to the root element
 *
 * @param {LayoutConfig} config - Layout configuration
 * @param {Document} [doc] - Document object (defaults to global document)
 * @returns {boolean} Success status
 */
export function applyCSSDefaults(config, doc = document) {
	const layoutConfig = config?.layoutContainer
	if (!layoutConfig?.layoutRootElement) return false

	const rootElement = doc.querySelector(layoutConfig.layoutRootElement)
	if (!rootElement) {
		console.warn(`Layout root element "${layoutConfig.layoutRootElement}" not found`)
		return false
	}

	if (layoutConfig.maxLayoutWidth) {
		rootElement.style.setProperty(
			layoutConfig.maxLayoutWidth.cssProperty,
			layoutConfig.maxLayoutWidth.value
		)
	}

	if (layoutConfig.layoutMargin) {
		rootElement.style.setProperty(
			layoutConfig.layoutMargin.cssProperty,
			layoutConfig.layoutMargin.value
		)
	}

	if (layoutConfig.widthTokens) {
		Object.entries(layoutConfig.widthTokens).forEach(([, tokenConfig]) => {
			rootElement.style.setProperty(tokenConfig.cssProperty, tokenConfig.value)
		})
	}

	return true
}

/**
 * Generate CSS from config without overwriting layout system files
 *
 * @param {string} configPath - Path to layout.config
 * @param {Object} [options] - Build options
 * @returns {Promise<Object>} Build result
 */
export async function generateLayoutCSS(configPath, options = {}) {
	const path = await import('path')
	const { fileURLToPath } = await import('url')
	const { LayoutBuilder } = await import('./builder.js')

	const defaultLayoutsPath = options.layoutsPath ||
		path.join(path.dirname(fileURLToPath(import.meta.url)), '../layouts')

	const builder = new LayoutBuilder(
		configPath,
		defaultLayoutsPath,
		options.outputPath || './generated-layout.css'
	)

	const results = await builder.build(options.minify !== false)

	return results
}

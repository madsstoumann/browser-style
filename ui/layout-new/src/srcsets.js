/**
 * @browser.style/layout - Srcsets Utilities
 * Generate srcsets strings for responsive images without web components
 */

/**
 * Generate srcsets string from breakpoint attributes
 * @param {Object} breakpoints - Layout patterns per breakpoint (e.g., { md: "columns(2)", lg: "grid(3c)" })
 * @param {Object} srcsetMap - Map of layout patterns to srcsets
 * @param {Object} layoutConfig - Configuration with breakpoints and maxLayoutWidth
 * @returns {string} Srcsets string (e.g., "540:50%;720:66.67%,33.33%@1024")
 *
 * @example
 * import { generateSrcsets } from '@browser.style/layout/srcsets'
 * import { srcsetMap, layoutConfig } from '@browser.style/layout/maps'
 *
 * const srcsets = generateSrcsets(
 *   { md: "columns(2)", lg: "grid(3c)" },
 *   srcsetMap,
 *   layoutConfig
 * )
 * // Returns: "540:50%;720:66.67%,33.33%,33.33%@1024"
 */
export function generateSrcsets(breakpoints, srcsetMap, layoutConfig) {
	const bps = layoutConfig.breakpoints || {}
	const maxWidth = layoutConfig.maxLayoutWidth || 1024
	const parts = []

	for (const [breakpointName, layoutPattern] of Object.entries(breakpoints)) {
		const breakpointValue = bps[breakpointName]

		if (breakpointValue && srcsetMap[layoutPattern]) {
			parts.push(`${breakpointValue}:${srcsetMap[layoutPattern]}`)
		}
	}

	if (parts.length > 0) {
		return `${parts.join(';')}@${maxWidth}`
	}

	return ''
}

/**
 * Apply srcsets to existing lay-out elements in the DOM
 * Useful when HTML is already created/inserted
 * @param {string} selector - CSS selector for lay-out elements (default: 'lay-out')
 * @param {Object} srcsetMap - Map of layout patterns to srcsets
 * @param {Object} layoutConfig - Configuration with breakpoints and maxLayoutWidth
 *
 * @example
 * import { applySrcsets } from '@browser.style/layout/srcsets'
 * import { srcsetMap, layoutConfig } from '@browser.style/layout/maps'
 *
 * // After inserting HTML
 * document.body.innerHTML += '<lay-out md="columns(2)">...</lay-out>'
 *
 * // Apply srcsets to all lay-out elements
 * applySrcsets('lay-out', srcsetMap, layoutConfig)
 */
export function applySrcsets(selector = 'lay-out', srcsetMap, layoutConfig) {
	if (typeof document === 'undefined') {
		return // Skip if not in browser
	}

	document.querySelectorAll(selector).forEach(element => {
		// Skip if srcsets already set
		if (element.hasAttribute('srcsets')) {
			return
		}

		const breakpoints = {}
		const bps = layoutConfig.breakpoints || {}

		// Collect breakpoint attributes from the element
		for (const breakpointName of Object.keys(bps)) {
			const layoutPattern = element.getAttribute(breakpointName)
			if (layoutPattern) {
				breakpoints[breakpointName] = layoutPattern
			}
		}

		// Generate and set srcsets
		const srcsets = generateSrcsets(breakpoints, srcsetMap, layoutConfig)
		if (srcsets) {
			element.setAttribute('srcsets', srcsets)
		}
	})
}

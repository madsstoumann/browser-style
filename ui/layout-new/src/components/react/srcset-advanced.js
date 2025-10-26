/**
 * Advanced srcset utilities with child-position awareness
 * Converts layout patterns + breakpoints to per-child sizes attributes
 */

import { layoutsMap, layoutConfig } from '../../../layouts-map.js'
import { normalizeSrcsets } from './srcset-utils.js'

/**
 * Parse srcset string to get width for specific child
 * Handles both single-value (all children same) and comma-separated (per-child)
 *
 * @param {string} srcset - Srcset value (e.g., "50%" or "66.67%,33.33%,33.33%")
 * @param {number} childIndex - Child index (0-based)
 * @returns {string} Width for this child
 */
export function getWidthForChild(srcset, childIndex) {
	if (!srcset) return '100vw'

	const widths = srcset.split(',').map(w => w.trim())

	// Single value = all children get same width
	if (widths.length === 1) return widths[0]

	// Multiple values = per-child widths
	if (childIndex < widths.length) return widths[childIndex]

	// Repeatable patterns: wrap around
	return widths[childIndex % widths.length]
}

/**
 * Calculate constrained width with min() function
 * Converts percentage to pixel value based on maxLayoutWidth
 *
 * @param {string} percentage - Width percentage (e.g., "66.67%")
 * @param {string|number} maxLayoutWidth - Max layout width (e.g., "1024px" or 1024)
 * @returns {string} Constrained size (e.g., "min(66.67vw, 683px)")
 */
export function calculateConstrainedWidth(percentage, maxLayoutWidth) {
	// If already in vw format, return as-is
	if (percentage.includes('vw')) return percentage

	// Extract percentage number
	const percent = parseFloat(percentage)
	if (isNaN(percent)) return '100vw'

	// Parse maxLayoutWidth to pixels
	const maxWidthPx = typeof maxLayoutWidth === 'string'
		? parseFloat(maxLayoutWidth.replace('px', '').replace('rem', ''))
		: maxLayoutWidth

	// If maxLayoutWidth uses rem, convert to px (assuming 16px base)
	const maxWidthValue = typeof maxLayoutWidth === 'string' && maxLayoutWidth.includes('rem')
		? maxWidthPx * 16
		: maxWidthPx

	// Calculate constrained width
	const constrainedPx = Math.round(maxWidthValue * (percent / 100))

	return `min(${percent}vw, ${constrainedPx}px)`
}

/**
 * Build srcsets attribute from layout breakpoints
 * Auto-generates the srcsets string from layout patterns
 *
 * @param {Object} breakpoints - Breakpoints object (e.g., { md: 'columns(2)', lg: 'grid(3c)' })
 * @param {Object} [config] - Optional config override
 * @returns {string} Srcsets string (e.g., "default:100vw;540:50%;720:66.67%,33.33%,33.33%")
 *
 * @example
 * buildSrcsets({ md: 'columns(2)', lg: 'grid(3c)' })
 * // → "default:100vw;540:50%;720:66.67%,33.33%,33.33%"
 */
export function buildSrcsets(breakpoints, config = layoutConfig) {
	const parts = ['default:100vw']
	const bpMap = config.breakpoints || {}

	// Sort breakpoints by pixel value (ascending)
	const sortedBps = Object.entries(breakpoints)
		.map(([bpName, layoutPattern]) => ({
			bpName,
			layoutPattern,
			pixels: bpMap[bpName] || 0
		}))
		.sort((a, b) => a.pixels - b.pixels)

	for (const { pixels, layoutPattern } of sortedBps) {
		const layoutData = layoutsMap[layoutPattern]
		if (layoutData?.srcset) {
			parts.push(`${pixels}:${layoutData.srcset}`)
		}
	}

	return parts.join(';')
}

/**
 * Get sizes attribute for a specific child
 * This is the main function that combines everything
 *
 * @param {string|Object} srcsets - Srcsets string or object
 * @param {number} childIndex - Child index (0-based)
 * @param {Object} [options] - Options
 * @param {string|number} [options.maxLayoutWidth] - Max layout width
 * @returns {string} CSS sizes attribute
 *
 * @example
 * // Simple format (all children same)
 * getSizesForChild("default:100vw;720:50%", 0)
 * // → "(min-width: 720px) min(50vw, 512px), 100vw"
 *
 * @example
 * // Per-child format
 * getSizesForChild("default:100vw;720:66.67%,33.33%,33.33%", 0)
 * // → "(min-width: 720px) min(66.67vw, 683px), 100vw"
 *
 * getSizesForChild("default:100vw;720:66.67%,33.33%,33.33%", 1)
 * // → "(min-width: 720px) min(33.33vw, 341px), 100vw"
 */
export function getSizesForChild(srcsets, childIndex, options = {}) {
	const maxLayoutWidth = options.maxLayoutWidth || layoutConfig.maxLayoutWidth || '1024px'

	// Normalize to object format
	const normalized = normalizeSrcsets(srcsets)

	if (!normalized || Object.keys(normalized).length === 0) {
		return '100vw'
	}

	// Extract default value
	const defaultSrcset = normalized.default || normalized.Default || '100vw'
	const defaultWidth = getWidthForChild(defaultSrcset, childIndex)

	// Get all breakpoint entries (excluding default)
	const breakpoints = Object.entries(normalized)
		.filter(([key]) => key !== 'default' && key !== 'Default')
		.map(([bp, srcset]) => ({
			breakpoint: parseInt(bp, 10),
			srcset
		}))
		.filter(({ breakpoint }) => !isNaN(breakpoint))
		.sort((a, b) => b.breakpoint - a.breakpoint) // Sort descending

	// Build media query string
	const mediaQueries = breakpoints.map(({ breakpoint, srcset }) => {
		const width = getWidthForChild(srcset, childIndex)
		const constrainedWidth = calculateConstrainedWidth(width, maxLayoutWidth)
		return `(min-width: ${breakpoint}px) ${constrainedWidth}`
	})

	// Combine: media queries + default
	const finalDefault = defaultWidth.includes('%')
		? calculateConstrainedWidth(defaultWidth, maxLayoutWidth)
		: defaultWidth

	return [...mediaQueries, finalDefault].join(', ')
}

/**
 * Auto-generate srcsets and calculate sizes for a child
 * Convenience function that combines buildSrcsets + getSizesForChild
 *
 * @param {Object} breakpoints - Layout breakpoints
 * @param {number} childIndex - Child index (0-based)
 * @param {Object} [options] - Options
 * @returns {string} CSS sizes attribute
 *
 * @example
 * autoGenerateSizes({ md: 'columns(2)', lg: 'grid(3c)' }, 0)
 * // → "(min-width: 720px) min(66.67vw, 683px), (min-width: 540px) min(50vw, 512px), 100vw"
 */
export function autoGenerateSizes(breakpoints, childIndex, options = {}) {
	const srcsets = buildSrcsets(breakpoints, options.config)
	return getSizesForChild(srcsets, childIndex, options)
}

/**
 * Helper to get srcset from layouts map
 * @param {string} layoutPattern - Layout pattern (e.g., "grid(3c)")
 * @returns {string|null} Srcset value
 */
export function getLayoutSrcset(layoutPattern) {
	return layoutsMap[layoutPattern]?.srcset || null
}

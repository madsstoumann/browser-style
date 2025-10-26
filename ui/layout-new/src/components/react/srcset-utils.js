/**
 * Srcset utilities for React components
 * Converts between various srcset formats and Next.js Image sizes attribute
 */

/**
 * Parse srcset string to object
 * @param {string} srcsetString - Format: "default:100vw;540:50vw;720:33.33vw"
 * @returns {Object} - Format: { default: '100vw', 540: '50vw', 720: '33.33vw' }
 */
export function parseSrcsetString(srcsetString) {
	if (!srcsetString || typeof srcsetString !== 'string') {
		return {}
	}

	const result = {}
	const parts = srcsetString.split(';')

	for (const part of parts) {
		const [breakpoint, size] = part.split(':').map(s => s.trim())
		if (breakpoint && size) {
			result[breakpoint] = size
		}
	}

	return result
}

/**
 * Normalize srcset to object format
 * Accepts both string and object formats
 * @param {string|Object} srcsets - Srcset in string or object format
 * @returns {Object} - Normalized object format
 */
export function normalizeSrcsets(srcsets) {
	if (!srcsets) {
		return {}
	}

	if (typeof srcsets === 'string') {
		return parseSrcsetString(srcsets)
	}

	if (typeof srcsets === 'object' && !Array.isArray(srcsets)) {
		return srcsets
	}

	return {}
}

/**
 * Convert srcset object to Next.js Image sizes attribute
 * @param {Object} srcsets - Format: { default: '100vw', 540: '50vw', 720: '33.33vw' }
 * @returns {string} - Next.js sizes format: "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw"
 */
export function srcsetToSizes(srcsets) {
	const normalized = normalizeSrcsets(srcsets)

	if (!normalized || Object.keys(normalized).length === 0) {
		return '100vw'
	}

	// Extract default value
	const defaultValue = normalized.default || normalized.Default || '100vw'

	// Get all breakpoint entries (excluding default)
	const breakpoints = Object.entries(normalized)
		.filter(([key]) => key !== 'default' && key !== 'Default')
		.map(([bp, size]) => ({
			breakpoint: parseInt(bp, 10),
			size
		}))
		.filter(({ breakpoint }) => !isNaN(breakpoint))
		.sort((a, b) => b.breakpoint - a.breakpoint) // Sort descending

	// Build media query string
	const mediaQueries = breakpoints.map(
		({ breakpoint, size }) => `(min-width: ${breakpoint}px) ${size}`
	)

	// Combine: media queries + default
	return [...mediaQueries, defaultValue].join(', ')
}

/**
 * Convert srcset string directly to Next.js sizes
 * Convenience function that combines normalize + convert
 * @param {string|Object} srcsets - Srcset in any format
 * @returns {string} - Next.js sizes attribute
 */
export function getSizes(srcsets) {
	return srcsetToSizes(srcsets)
}

/**
 * Convert srcset object to vanilla HTML srcsets attribute string
 * @param {Object} srcsets - Format: { default: '100vw', 540: '50vw' }
 * @returns {string} - Format: "default:100vw;540:50vw"
 */
export function srcsetToString(srcsets) {
	if (!srcsets || typeof srcsets !== 'object') {
		return ''
	}

	return Object.entries(srcsets)
		.map(([key, value]) => `${key}:${value}`)
		.join(';')
}

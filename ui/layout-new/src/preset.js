/**
 * @browser.style/layout - Preset Utilities
 * Functions for creating, validating, and converting layout presets
 */

/**
 * Default preset values
 */
const PRESET_DEFAULTS = {
	colGap: 1,
	rowGap: 1,
	spaceBottom: 0,
	spaceTop: 0,
	padBottom: 0,
	padTop: 0,
	padInline: 0,
	maxWidth: '100vw',
	self: 'auto',
	gapDecorations: false
}

/**
 * Valid width tokens
 */
const VALID_WIDTH_TOKENS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

/**
 * Valid overflow modes
 */
const VALID_OVERFLOW_MODES = ['', 'preview', 'dynamic', 'none']

/**
 * Create and validate a layout preset
 *
 * @param {Partial<LayoutPreset>} config - Preset configuration
 * @returns {LayoutPreset} Validated preset with defaults applied
 * @throws {Error} If required fields are missing
 *
 * @example
 * ```javascript
 * const preset = createPreset({
 *   id: 'hero',
 *   name: 'Hero Layout',
 *   breakpoints: { md: 'columns(2)', lg: 'bento(4a)' },
 *   spaceTop: 2
 * })
 * ```
 */
export function createPreset(config) {
	if (!config.id) {
		throw new Error('Preset must have an "id" field')
	}
	if (!config.name) {
		throw new Error('Preset must have a "name" field')
	}
	if (!config.breakpoints || Object.keys(config.breakpoints).length === 0) {
		throw new Error('Preset must have at least one breakpoint definition')
	}

	// Merge with defaults
	const preset = mergePresetDefaults(config)

	// Validate
	const validation = validatePreset(preset)
	if (!validation.valid) {
		throw new Error(`Invalid preset: ${validation.errors.join(', ')}`)
	}

	return preset
}

/**
 * Merge preset with defaults
 *
 * @param {Partial<LayoutPreset>} preset - Partial preset
 * @returns {LayoutPreset} Complete preset with defaults
 */
export function mergePresetDefaults(preset) {
	return {
		...preset,
		// Only apply defaults for undefined values, not null
		...(preset.colGap === undefined && { colGap: PRESET_DEFAULTS.colGap }),
		...(preset.rowGap === undefined && { rowGap: PRESET_DEFAULTS.rowGap }),
		...(preset.spaceBottom === undefined && { spaceBottom: PRESET_DEFAULTS.spaceBottom }),
		...(preset.spaceTop === undefined && { spaceTop: PRESET_DEFAULTS.spaceTop }),
		...(preset.padBottom === undefined && { padBottom: PRESET_DEFAULTS.padBottom }),
		...(preset.padTop === undefined && { padTop: PRESET_DEFAULTS.padTop }),
		...(preset.padInline === undefined && { padInline: PRESET_DEFAULTS.padInline }),
		...(preset.maxWidth === undefined && { maxWidth: PRESET_DEFAULTS.maxWidth }),
		...(preset.self === undefined && { self: PRESET_DEFAULTS.self }),
		...(preset.gapDecorations === undefined && { gapDecorations: PRESET_DEFAULTS.gapDecorations })
	}
}

/**
 * Validate preset structure and values
 *
 * @param {any} preset - Preset to validate
 * @returns {ValidationResult} Validation result with errors and warnings
 */
export function validatePreset(preset) {
	const errors = []
	const warnings = []

	// Required fields
	if (!preset.id || typeof preset.id !== 'string') {
		errors.push('Preset must have a valid "id" string')
	}
	if (!preset.name || typeof preset.name !== 'string') {
		errors.push('Preset must have a valid "name" string')
	}
	if (!preset.breakpoints || typeof preset.breakpoints !== 'object') {
		errors.push('Preset must have a "breakpoints" object')
	} else if (Object.keys(preset.breakpoints).length === 0) {
		errors.push('Preset must have at least one breakpoint definition')
	}

	// Validate breakpoint patterns
	if (preset.breakpoints) {
		for (const [bp, pattern] of Object.entries(preset.breakpoints)) {
			if (typeof pattern !== 'string') {
				errors.push(`Breakpoint "${bp}" must have a string pattern`)
			} else if (!pattern.match(/^\w+\([^)]*\)$/)) {
				warnings.push(`Breakpoint "${bp}" pattern "${pattern}" doesn't match expected format: layoutType(id)`)
			}
		}
	}

	// Validate numeric fields
	const numericFields = ['colGap', 'rowGap', 'spaceBottom', 'spaceTop', 'padBottom', 'padTop', 'padInline', 'bleed']
	for (const field of numericFields) {
		if (preset[field] !== undefined && typeof preset[field] !== 'number') {
			errors.push(`Field "${field}" must be a number`)
		}
		if (field === 'bleed' && preset[field] !== undefined) {
			if (preset[field] < 0 || preset[field] > 100) {
				errors.push('Field "bleed" must be between 0 and 100')
			}
		}
	}

	// Validate width token
	if (preset.width !== undefined && !VALID_WIDTH_TOKENS.includes(preset.width)) {
		errors.push(`Field "width" must be one of: ${VALID_WIDTH_TOKENS.join(', ')}`)
	}

	// Validate overflow mode
	if (preset.overflow !== undefined && !VALID_OVERFLOW_MODES.includes(preset.overflow)) {
		errors.push(`Field "overflow" must be one of: ${VALID_OVERFLOW_MODES.map(v => v || '(empty string)').join(', ')}`)
	}

	// Validate boolean fields
	if (preset.gapDecorations !== undefined && typeof preset.gapDecorations !== 'boolean') {
		errors.push('Field "gapDecorations" must be a boolean')
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings
	}
}

/**
 * Convert preset to HTML attributes object
 *
 * @param {LayoutPreset} preset - Layout preset
 * @returns {Object} Attributes object with key-value pairs
 *
 * @example
 * ```javascript
 * const attrs = presetToAttributes(heroPreset)
 * // { md: 'columns(2)', lg: 'bento(4a)', 'space-top': '2', ... }
 * ```
 */
export function presetToAttributes(preset) {
	const attrs = {}

	// Breakpoint attributes
	for (const [breakpoint, pattern] of Object.entries(preset.breakpoints)) {
		attrs[breakpoint] = pattern
	}

	// Grid configuration
	if (preset.columns !== undefined) attrs.columns = preset.columns
	if (preset.rows !== undefined) attrs.rows = preset.rows

	// Spacing (only include if not default)
	if (preset.colGap !== undefined && preset.colGap !== PRESET_DEFAULTS.colGap) {
		attrs['col-gap'] = String(preset.colGap)
	}
	if (preset.rowGap !== undefined && preset.rowGap !== PRESET_DEFAULTS.rowGap) {
		attrs['row-gap'] = String(preset.rowGap)
	}
	if (preset.spaceBottom !== undefined && preset.spaceBottom !== PRESET_DEFAULTS.spaceBottom) {
		attrs['space-bottom'] = String(preset.spaceBottom)
	}
	if (preset.spaceTop !== undefined && preset.spaceTop !== PRESET_DEFAULTS.spaceTop) {
		attrs['space-top'] = String(preset.spaceTop)
	}
	if (preset.padBottom !== undefined && preset.padBottom !== PRESET_DEFAULTS.padBottom) {
		attrs['pad-bottom'] = String(preset.padBottom)
	}
	if (preset.padTop !== undefined && preset.padTop !== PRESET_DEFAULTS.padTop) {
		attrs['pad-top'] = String(preset.padTop)
	}
	if (preset.padInline !== undefined && preset.padInline !== PRESET_DEFAULTS.padInline) {
		attrs['pad-inline'] = String(preset.padInline)
	}

	// Constraints
	if (preset.maxWidth !== undefined && preset.maxWidth !== PRESET_DEFAULTS.maxWidth) {
		attrs['max-width'] = preset.maxWidth
	}
	if (preset.width !== undefined) {
		attrs.width = preset.width
	}
	if (preset.bleed !== undefined) {
		attrs.bleed = String(preset.bleed)
	}
	if (preset.self !== undefined && preset.self !== PRESET_DEFAULTS.self) {
		attrs.self = preset.self
	}

	// Visual & Behavior
	if (preset.gapDecorations) {
		attrs.gap = '' // Presence attribute
	}
	if (preset.overflow !== undefined) {
		attrs.overflow = preset.overflow
	}
	if (preset.theme !== undefined) {
		attrs.theme = preset.theme
	}
	if (preset.animation !== undefined) {
		attrs.animation = preset.animation
	}

	return attrs
}

/**
 * Convert preset to HTML <lay-out> element string
 *
 * @param {LayoutPreset} preset - Layout preset
 * @param {LayoutConfig} [config] - Layout configuration (for srcset generation)
 * @param {string} [srcsets] - Optional srcsets attribute value
 * @returns {string} HTML string
 *
 * @example
 * ```javascript
 * const html = presetToHTML(heroPreset)
 * // '<lay-out md="columns(2)" lg="bento(4a)" space-top="2">'
 * ```
 */
export function presetToHTML(preset, config = null, srcsets = null) {
	const attrs = presetToAttributes(preset)

	// Add srcsets if provided
	if (srcsets) {
		attrs.srcsets = srcsets
	}

	// Convert attributes to HTML string
	const attrString = Object.entries(attrs)
		.map(([key, value]) => {
			// Boolean attributes (presence only)
			if (value === '') {
				return key
			}
			// Regular attributes
			return `${key}="${escapeHTML(String(value))}"`
		})
		.join(' ')

	return `<lay-out ${attrString}>`
}

/**
 * Convert preset to opening tag with children and closing tag
 *
 * @param {LayoutPreset} preset - Layout preset
 * @param {string} children - Inner HTML content
 * @param {LayoutConfig} [config] - Layout configuration (for srcset generation)
 * @param {string} [srcsets] - Optional srcsets attribute value
 * @returns {string} Complete HTML string with children
 */
export function presetToHTMLWithChildren(preset, children, config = null, srcsets = null) {
	const openTag = presetToHTML(preset, config, srcsets)
	return `${openTag}\n${children}\n</lay-out>`
}

/**
 * Parse a layout pattern into components
 *
 * @param {string} pattern - Layout pattern (e.g., "columns(2)", "bento(4a)")
 * @returns {Object|null} Parsed pattern with layoutType and layoutId
 *
 * @example
 * ```javascript
 * parseLayoutPattern('columns(2)')
 * // { layoutType: 'columns', layoutId: '2' }
 * ```
 */
export function parseLayoutPattern(pattern) {
	const match = pattern.match(/^(\w+)\(([^)]*)\)$/)
	if (!match) return null

	return {
		layoutType: match[1],
		layoutId: match[2]
	}
}

/**
 * Escape HTML special characters
 *
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	}
	return str.replace(/[&<>"']/g, char => map[char])
}

/**
 * Clone a preset (deep copy)
 *
 * @param {LayoutPreset} preset - Preset to clone
 * @returns {LayoutPreset} Cloned preset
 */
export function clonePreset(preset) {
	return JSON.parse(JSON.stringify(preset))
}

/**
 * Merge two presets (second preset overrides first)
 *
 * @param {LayoutPreset} basePreset - Base preset
 * @param {Partial<LayoutPreset>} overridePreset - Override preset
 * @returns {LayoutPreset} Merged preset
 */
export function mergePresets(basePreset, overridePreset) {
	return {
		...basePreset,
		...overridePreset,
		breakpoints: {
			...basePreset.breakpoints,
			...overridePreset.breakpoints
		}
	}
}

/**
 * Extract breakpoints from preset
 *
 * @param {LayoutPreset} preset - Layout preset
 * @returns {string[]} Array of breakpoint names
 */
export function getPresetBreakpoints(preset) {
	return Object.keys(preset.breakpoints)
}

/**
 * Check if preset has a specific breakpoint
 *
 * @param {LayoutPreset} preset - Layout preset
 * @param {string} breakpoint - Breakpoint name
 * @returns {boolean} True if breakpoint exists
 */
export function hasBreakpoint(preset, breakpoint) {
	return breakpoint in preset.breakpoints
}

/**
 * Get layout pattern for a specific breakpoint
 *
 * @param {LayoutPreset} preset - Layout preset
 * @param {string} breakpoint - Breakpoint name
 * @returns {string|null} Layout pattern or null if not found
 */
export function getBreakpointLayout(preset, breakpoint) {
	return preset.breakpoints[breakpoint] || null
}

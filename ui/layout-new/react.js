/**
 * @browser.style/layout - React Components
 * Client-side only exports (no Node.js dependencies)
 *
 * @module @browser.style/layout/react
 */

// React Component
export { Layout, LayoutWithContext, useLayoutSizes, getSizes } from './src/components/react/Layout.jsx'

// Srcset utilities - Simple
export {
	parseSrcsetString,
	normalizeSrcsets,
	srcsetToSizes,
	srcsetToString
} from './src/components/react/srcset-utils.js'

// Srcset utilities - Advanced (child-position aware)
export {
	getWidthForChild,
	calculateConstrainedWidth,
	buildSrcsets,
	getSizesForChild,
	autoGenerateSizes,
	getLayoutSrcset
} from './src/components/react/srcset-advanced.js'

// Layouts map and config
export { layoutsMap, layoutConfig } from './layouts-map.js'

// Preset utilities (browser-safe)
export {
	createPreset,
	presetToHTML,
	presetToHTMLWithChildren,
	presetToAttributes,
	validatePreset,
	mergePresetDefaults,
	parseLayoutPattern,
	clonePreset,
	mergePresets,
	getPresetBreakpoints,
	hasBreakpoint,
	getBreakpointLayout
} from './src/preset.js'

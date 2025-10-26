/**
 * @browser.style/layout - React Components
 * Client-side only exports (no Node.js dependencies)
 *
 * @module @browser.style/layout/react
 */

// React Component
export { Layout, LayoutWithContext, useLayoutSizes, getSizes } from './src/components/react/Layout.jsx'

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

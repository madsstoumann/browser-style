/**
 * @browser.style/layout v2.0
 * Modern CSS layout system with React/Web components
 *
 * @module @browser.style/layout
 */

// Preset utilities
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

// Srcset utilities
export {
	autoGenerateSrcsets,
	generateLayoutSrcsets,
	getSrcset,
	getLayoutConstraints,
	createLayoutsDataMap,
	applyCSSDefaults,
	generateLayoutCSS
} from './src/srcset.js'

// Builder (for programmatic use)
export { LayoutBuilder, buildLayout } from './src/builder.js'

// React Component
export { Layout, LayoutWithContext, useLayoutSizes, getSizes } from './src/components/react/Layout.jsx'

// Web Component - Coming in Phase 4.1
// export { LayoutElement } from './src/components/web/LayoutElement.js'

// Type definitions (for TypeScript users)
// Types are automatically picked up from src/types.ts via package.json "types" field

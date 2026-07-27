/**
 * @browser.style/layout — package entry.
 *
 * Node-safe: everything exported statically here runs without a DOM, so the
 * srcset/map API works in SSR and build scripts (`npm test` imports this file
 * in plain Node). The <lay-out> web component extends HTMLElement at module
 * evaluation, so it CANNOT be re-exported statically without breaking Node —
 * browsers get it via registerLayOut() below, or by importing
 * '@browser.style/layout/components' directly.
 */

export { srcsetMap, srcsetConfig, getLayoutSrcset } from './layouts-map.js'
export { generateSrcsets, applySrcsets, calculateSizes } from './src/srcsets.js'

/**
 * Browser-only: dynamically import the component barrel and define <lay-out>
 * (the component self-defines on import when `document` exists).
 * @returns {Promise<typeof import('./src/components/index.js').LayOut>}
 */
export async function registerLayOut() {
	const { LayOut } = await import('./src/components/index.js')
	return LayOut
}

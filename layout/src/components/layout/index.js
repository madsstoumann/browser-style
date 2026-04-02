// Auto-load package's layout data
import { srcsetMap as defaultSrcsetMap, layoutConfig as defaultLayoutConfig } from '../../../layouts-map.js'

export class LayOut extends HTMLElement {
	static srcsetMap = defaultSrcsetMap
	static layoutConfig = defaultLayoutConfig

	/**
	 * Initialize with custom maps (optional)
	 * Use this if you have your own layout.config.json and generated layouts-map.js
	 * @param {Object} srcsetMap - Custom srcset map
	 * @param {Object} layoutConfig - Custom layout config
	 */
	static initialize(srcsetMap = {}, layoutConfig = {}) {
		LayOut.srcsetMap = srcsetMap
		LayOut.layoutConfig = layoutConfig

		if (typeof document !== 'undefined') {
			document.querySelectorAll('lay-out:not([srcsets])').forEach(element => {
				if (element instanceof LayOut) {
					const srcsets = element.buildSrcsets()
					if (srcsets) {
						element.setAttribute('srcsets', srcsets)
					}
				}
			})
		}
	}

	connectedCallback() {
		if (!this.hasAttribute('srcsets')) {
			const srcsets = this.buildSrcsets()
			if (srcsets) {
				this.setAttribute('srcsets', srcsets)
			}
		}
	}

	buildSrcsets() {
		const { srcsetMap, layoutConfig } = LayOut
		const { breakpoints = {}, maxLayoutWidth = 1024 } = layoutConfig
		const parts = []

		for (const [breakpointName, breakpointValue] of Object.entries(breakpoints)) {
			const layoutPattern = this.getAttribute(breakpointName)
			if (layoutPattern && srcsetMap[layoutPattern]) {
				parts.push(`${breakpointValue}:${srcsetMap[layoutPattern]}`)
			}
		}

		if (parts.length > 0) {
			return `${parts.join(';')}@${maxLayoutWidth}`
		}

		return ''
	}
}

customElements.define('lay-out', LayOut)

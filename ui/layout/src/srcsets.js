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

	return parts.length > 0 ? `${parts.join(';')}@${maxWidth}` : ''
}

export function applySrcsets(selector = 'lay-out', srcsetMap, layoutConfig) {
	if (typeof document === 'undefined') return

	document.querySelectorAll(selector).forEach(element => {
		if (element.hasAttribute('srcsets')) return

		const breakpoints = {}
		const bps = layoutConfig.breakpoints || {}

		for (const breakpointName of Object.keys(bps)) {
			const layoutPattern = element.getAttribute(breakpointName)
			if (layoutPattern) {
				breakpoints[breakpointName] = layoutPattern
			}
		}

		const srcsets = generateSrcsets(breakpoints, srcsetMap, layoutConfig)
		if (srcsets) {
			element.setAttribute('srcsets', srcsets)
		}
	})
}

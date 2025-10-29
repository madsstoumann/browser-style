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

export function calculateSizes(srcsets, childIndex) {
	if (!srcsets) return '100vw'

	const atIndex = srcsets.lastIndexOf('@')
	const maxWidth = atIndex !== -1 ? parseInt(srcsets.slice(atIndex + 1)) : 1024
	const breakpointRules = srcsets.slice(0, atIndex !== -1 ? atIndex : srcsets.length)

	const rules = []

	for (const rule of breakpointRules.split(';')) {
		const [breakpoint, widths] = rule.split(':')
		const widthArray = widths.split(',')
		const width = widthArray[childIndex] || widthArray[widthArray.length - 1]

		if (width) {
			rules.push({
				breakpoint: parseInt(breakpoint),
				width: width.trim()
			})
		}
	}

	rules.sort((a, b) => b.breakpoint - a.breakpoint)

	const sizesParts = rules.map(({ breakpoint, width }) => {
		const percent = parseFloat(width)
		const pxValue = Math.round(maxWidth * (percent / 100))
		return `(min-width: ${breakpoint}px) min(${percent}vw, ${pxValue}px)`
	})

	if (rules.length > 0) {
		const firstPercent = parseFloat(rules[0].width)
		const firstPx = Math.round(maxWidth * (firstPercent / 100))
		sizesParts.push(`min(${firstPercent}vw, ${firstPx}px)`)
	} else {
		sizesParts.push('100vw')
	}

	return sizesParts.join(', ')
}

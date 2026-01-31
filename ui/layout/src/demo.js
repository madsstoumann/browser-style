import fs from 'fs'
import path from 'path'
import { buildIcons } from './icons.js'
import { generateSrcsets } from './srcsets.js'
import { srcsetMap, layoutConfig } from '../layouts-map.js'

function generateLayoutHTML(layoutName, layoutData, layoutType, iconsDir) {
	const title = layoutType.name || `${layoutName.charAt(0).toUpperCase() + layoutName.slice(1)} Layouts`
	const prefix = layoutType.prefix || layoutName

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/ui/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.js"></script>
</head>
<body>
	<h1>${title}</h1>`

	if (layoutType.desc) {
		html += `
	<p>${layoutType.desc}</p>`
	} else {
		html += `
	<p>These layouts use the <strong>${prefix}()</strong> layout mode to create various patterns.<br>
		${layoutData.some(l => l.repeatable) ? 'When you add more items, repeatable patterns continue automatically.' : 'Fixed layouts display a specific number of items.'}</p>`
	}

	const layoutsByItems = new Map()
	layoutData.forEach(layout => {
		const items = layout.items || 1
		if (!layoutsByItems.has(items)) {
			layoutsByItems.set(items, [])
		}
		layoutsByItems.get(items).push(layout)
	})

	for (const [itemCount, layouts] of Array.from(layoutsByItems.entries()).sort(([a], [b]) => a - b)) {
		// Skip item count heading for lanes layouts
		if (prefix !== 'lanes') {
			html += `\n\n	<h2>${itemCount} Item${itemCount !== 1 ? 's' : ''}</h2>`
		}

		for (const layout of layouts) {
			const layoutId = layout.originalId || layout.id.replace(`${prefix}(`, '').replace(')', '')
			const description = layout.description || ''

			let breakpointAttrs = ''
			let codeExample = ''
			let breakpointsObj = {}

			if (layout.breakpoints) {
				const breakpointPairs = []
				for (const [breakpoint, value] of Object.entries(layout.breakpoints)) {
					breakpointAttrs += ` ${breakpoint}="${value}"`
					breakpointPairs.push(`${breakpoint}="${value}"`)
					breakpointsObj[breakpoint] = value
				}
				codeExample = `&lt;lay-out${breakpointAttrs}`
			} else {
				breakpointAttrs = ` md="columns(${itemCount})" lg="${prefix}(${layoutId})"`
				codeExample = `&lt;lay-out lg="${prefix}(${layoutId})"`
				breakpointsObj = { md: `columns(${itemCount})`, lg: `${prefix}(${layoutId})` }
			}

			const srcsets = generateSrcsets(breakpointsObj, srcsetMap, layoutConfig)
			const srcsetsAttr = srcsets ? ` srcsets="${srcsets}"` : ''
			const overflowAttr = layout.overflow ? ` overflow="${layout.overflow}"` : ''

			// Add overflow to code example if present
			if (layout.overflow) {
				codeExample += ` overflow="${layout.overflow}"`
			}
			codeExample += `&gt;`

			const iconPath = path.join(iconsDir, `${prefix}(${layoutId}).svg`)
			let iconSvg = ''

			if (fs.existsSync(iconPath)) {
				try {
					iconSvg = fs.readFileSync(iconPath, 'utf8')
				} catch (error) {
					console.warn(`⚠ Failed to read icon ${iconPath}: ${error.message}`)
				}
			}

			html += `
	<section>
		<h3>${iconSvg}${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${layoutId}</h3>
		${description ? `<small>${description}</small>` : ''}
		<code>${codeExample}</code>
		<lay-out${breakpointAttrs}${srcsetsAttr}${overflowAttr}>`

			// Aspect ratios for lanes demo
			const aspectRatios = ['1', '1 / 2', '1 / .5', '1 / 3', '1 / .75', '1 / 1.5', '1 / .33', '1', '1 / 2.5', '1 / .6', '1 / 1.25', '1 / .4', '1 / 2', '1 / .8', '1']

			for (let i = 0; i < itemCount; i++) {
				if (layout.aspectRatios) {
					const ratio = aspectRatios[i % aspectRatios.length]
					html += `
			<item-card style="aspect-ratio: ${ratio};"></item-card>`
				} else {
					html += `
			<item-card></item-card>`
				}
			}

			if (layout.repeatable) {
				const repeatCount = Math.min(itemCount, 6)
				for (let i = 0; i < repeatCount; i++) {
					html += `
			<item-card repeat></item-card>`
				}
			}

			html += `
		</lay-out>
	</section>`
		}
	}

	html += `
</body>
</html>`

	return html
}

function generateOverflowHTML(columnsData, iconsDir) {
	const title = 'Overflow Layouts'
	const prefix = 'columns'

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/ui/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.js"></script>
	<script src="../polyfills/overflow-drag.js"></script>
</head>
<body>
	<h1>${title}</h1>
	<p>These layouts demonstrate the <strong>overflow</strong> attribute with column layouts.<br>
		The <strong>overflow="preview"</strong> shows a partial preview of the next item.</p>`

	const overflowType = 'preview'

	for (const layout of columnsData.layouts) {
		const layoutId = layout.id
		const itemCount = layout.items || 1
		const description = layout.description || ''

		let breakpointAttrs = ''
		let breakpointsObj = {}

		if (layout.breakpoints) {
			for (const [breakpoint, value] of Object.entries(layout.breakpoints)) {
				breakpointAttrs += ` ${breakpoint}="${value}"`
				breakpointsObj[breakpoint] = value
			}
		} else {
			breakpointAttrs = ` md="columns(${itemCount})" lg="${prefix}(${layoutId})"`
			breakpointsObj = { md: `columns(${itemCount})`, lg: `${prefix}(${layoutId})` }
		}

		const codeExample = `&lt;lay-out${breakpointAttrs} overflow="${overflowType}"&gt;`

		// Use preview icon if available
		const iconPath = path.join(iconsDir, `${prefix}(${layoutId})-preview.svg`)
		const fallbackIconPath = path.join(iconsDir, `${prefix}(${layoutId}).svg`)
		let iconSvg = ''

		if (fs.existsSync(iconPath)) {
			try {
				iconSvg = fs.readFileSync(iconPath, 'utf8')
			} catch (error) {
				console.warn(`⚠ Failed to read icon ${iconPath}: ${error.message}`)
			}
		} else if (fs.existsSync(fallbackIconPath)) {
			try {
				iconSvg = fs.readFileSync(fallbackIconPath, 'utf8')
			} catch (error) {
				console.warn(`⚠ Failed to read icon ${fallbackIconPath}: ${error.message}`)
			}
		}

		html += `
	<section>
		<h3>${iconSvg}${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${layoutId}</h3>
		${description ? `<small>${description}</small>` : ''}
		<code>${codeExample}</code>
		<lay-out${breakpointAttrs} overflow="${overflowType}">`

		for (let i = 0; i < itemCount; i++) {
			html += `
			<item-card></item-card>`
		}

		// Add extra items to show overflow
		for (let i = 0; i < 3; i++) {
			html += `
			<item-card repeat></item-card>`
		}

		html += `
		</lay-out>
	</section>`
	}

	// Preview Sizes section
	html += `

	<h2>Preview Sizes</h2>
	<p>Control the preview width with size modifiers. All examples use <strong>columns(1)</strong>.</p>`

	const previewSizes = [
		{ size: 'preview-xs', label: 'Extra Small', desc: '40px preview width' },
		{ size: 'preview-sm', label: 'Small', desc: '60px preview width' },
		{ size: 'preview', label: 'Medium (default)', desc: '100px preview width' },
		{ size: 'preview-lg', label: 'Large', desc: '150px preview width' },
		{ size: 'preview-xl', label: 'Extra Large', desc: '200px preview width' }
	]

	for (const { size, label, desc } of previewSizes) {
		html += `
	<section>
		<h3>${label}</h3>
		<small>${desc}</small>
		<code>&lt;lay-out md="columns(1)" overflow="${size}"&gt;</code>
		<lay-out md="columns(1)" overflow="${size}">
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>`
	}

	// Fade Masks section
	html += `

	<h2>Fade Masks</h2>
	<p>Add fade effects to the overflow edges. Masks animate based on scroll position. All examples use <strong>columns(1)</strong>.</p>`

	const fadeMasks = [
		{ overflow: 'preview fade', label: 'Fade Both', desc: 'Fade masks on both start and end edges' },
		{ overflow: 'preview fade-start', label: 'Fade Start', desc: 'Fade mask on start edge only' },
		{ overflow: 'preview fade-end', label: 'Fade End', desc: 'Fade mask on end edge only' }
	]

	for (const { overflow, label, desc } of fadeMasks) {
		html += `
	<section>
		<h3>${label}</h3>
		<small>${desc}</small>
		<code>&lt;lay-out md="columns(1)" overflow="${overflow}"&gt;</code>
		<lay-out md="columns(1)" overflow="${overflow}">
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>`
	}

	html += `
</body>
</html>`

	return html
}

function generateIconsHTML(iconsDir) {
	const title = 'Layout Icons'

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="All layout system icons">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/ui/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.js"></script>
	<style>
		.icon-list {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 1rem;
		}
		.icon-item {
			padding: 1rem;
			border: 1px solid #ccc;
			border-radius: 4px;
			text-align: center;
		}
		.icon-item svg {
			width: 100%;
			max-width: 150px;
			height: auto;
		}
		.icon-name {
			font-family: monospace;
			font-size: 0.875rem;
			margin-top: 0.5rem;
		}
	</style>
</head>
<body>
	<h1>${title}</h1>
	<p>A complete collection of all generated layout icons.</p>

	<section class="icon-list">`

	if (!fs.existsSync(iconsDir)) {
		html += `
		<p>No icons found. Run icon generation first.</p>`
	} else {
		const iconFiles = fs.readdirSync(iconsDir)
			.filter(file => file.endsWith('.svg'))
			.sort()

		for (const iconFile of iconFiles) {
			const iconPath = path.join(iconsDir, iconFile)
			const iconName = iconFile.replace('.svg', '')

			try {
				const iconSvg = fs.readFileSync(iconPath, 'utf8')

				html += `
		<div class="icon-item">
			${iconSvg}
			<div class="icon-name">${iconName}</div>
		</div>`
			} catch (error) {
				console.warn(`⚠ Failed to read icon ${iconPath}: ${error.message}`)
			}
		}
	}

	html += `
	</section>
</body>
</html>`

	return html
}

function generateBleedHTML() {
	const title = 'Bleed Layouts'

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/ui/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.js"></script>
	<style>
		body { --layout-mi: 1rem; --layout-bleed-mw: 900px; }
		lay-out[bleed] { --layout-bg: hsl(220 60% 95%); }
	</style>
</head>
<body>
	<h1>${title}</h1>
	<p>The <strong>bleed</strong> attribute allows layouts to extend beyond their container to full viewport width.<br>
		Useful for hero sections, banners, and full-width content within constrained containers.</p>

	<h2>Basic Bleed</h2>
	<p>Full-width layout that bleeds to viewport edges.</p>
	<section>
		<h3>Full Bleed (no padding)</h3>
		<small>Layout extends to full viewport width</small>
		<code>&lt;lay-out md="columns(1)" bleed="0"&gt;</code>
		<lay-out md="columns(1)" bleed="0">
			<item-card style="clip-path:none;"></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Full Bleed (with padding)</h3>
		<small>Full bleed with block and inline padding</small>
		<code>&lt;lay-out md="columns(1)" bleed="0" pad-top="1" pad-bottom="1" pad-inline="1"&gt;</code>
		<lay-out md="columns(1)" bleed="0" pad-top="1" pad-bottom="1" pad-inline="1">
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Bleed with Columns</h3>
		<small>Multi-column layout at full width</small>
		<code>&lt;lay-out md="columns(2)" bleed pad-top="1" pad-bottom="1" pad-inline="1"&gt;</code>
		<lay-out md="columns(2)" bleed pad-top="1" pad-bottom="1" pad-inline="1">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>

	<h2>Bleed with Width Constraint</h2>
	<p>Bleed layouts can have a max-width while still using full-width background.</p>
	<section>
		<h3>Bleed + Width MD</h3>
		<small>Content constrained to md width, background bleeds</small>
		<code>&lt;lay-out md="columns(2)" bleed width="md" pad-top="1" pad-bottom="1" pad-inline="1"&gt;</code>
		<lay-out md="columns(2)" bleed width="md" pad-top="1" pad-bottom="1" pad-inline="1">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Bleed + Width LG</h3>
		<small>Content constrained to lg width, background bleeds</small>
		<code>&lt;lay-out md="columns(2)" bleed width="lg" pad-top="1" pad-bottom="1" pad-inline="1"&gt;</code>
		<lay-out md="columns(2)" bleed width="lg" pad-top="1" pad-bottom="1" pad-inline="1">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>

	<h2>Asymmetric Bleed</h2>
	<p>Use a percentage value to offset the content asymmetrically.</p>
	<section>
		<h3>Bleed 10%</h3>
		<small>Content shifted 10% toward start</small>
		<code>&lt;lay-out md="columns(1)" bleed="10" pad-top="1" pad-bottom="1" pad-inline="1"&gt;</code>
		<lay-out md="columns(1)" bleed="10" pad-top="1" pad-bottom="1" pad-inline="1">
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Bleed 25%</h3>
		<small>Content shifted 25% toward start</small>
		<code>&lt;lay-out md="columns(1)" bleed="25" pad-top="1" pad-bottom="1" pad-inline="1"&gt;</code>
		<lay-out md="columns(1)" bleed="25" pad-top="1" pad-bottom="1" pad-inline="1">
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Bleed -15% (negative)</h3>
		<small>Content shifted toward end</small>
		<code>&lt;lay-out md="columns(1)" bleed="-15" pad-top="1" pad-bottom="1" pad-inline="1"&gt;</code>
		<lay-out md="columns(1)" bleed="-15" pad-top="1" pad-bottom="1" pad-inline="1">
			<item-card></item-card>
		</lay-out>
	</section>

	<h2>Bleed with Inline Padding</h2>
	<p>Add inline padding to bleed layouts.</p>
	<section>
		<h3>Bleed + Inline Padding</h3>
		<small>Full bleed with internal padding</small>
		<code>&lt;lay-out md="columns(2)" bleed pad-inline="2" pad-top="1" pad-bottom="1"&gt;</code>
		<lay-out md="columns(2)" bleed pad-inline="2" pad-top="1" pad-bottom="1">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
</body>
</html>`

	return html
}

function generateGapdecoHTML() {
	const title = 'Gap Decorations'

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/ui/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.js"></script>
	<style>
		lay-out[gap-decorations] {
			--layout-rule-w: 1px;
			--layout-rule-c: #999;
		}
	</style>
</head>
<body>
	<h1>${title}</h1>
	<p>The <strong>gap-decorations</strong> attribute adds visual separators (rules) between grid items.<br>
		Use <strong>cols</strong>, <strong>rows</strong>, or both for different effects.</p>

	<h2>Column Rules</h2>
	<p>Vertical lines between columns.</p>
	<section>
		<h3>Grid 3a with Column Rules</h3>
		<small>Vertical separators between columns</small>
		<code>&lt;lay-out lg="columns(2)" gap-decorations="cols"&gt;</code>
		<lay-out lg="columns(2)" gap-decorations="cols">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>

	<h2>Row Rules</h2>
	<p>Horizontal lines between rows.</p>
	<section>
		<h3>Grid 3a with Row Rules</h3>
		<small>Horizontal separators between rows</small>
		<code>&lt;lay-out lg="grid(3a)" gap-decorations="rows"&gt;</code>
		<lay-out lg="grid(3a)" gap-decorations="rows">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
	
	<h2>Both Column and Row Rules</h2>
	<p>Full grid decoration with both directions.</p>
	<section>
		<h3>Grid 3a with Both</h3>
		<small>Complete grid decoration</small>
		<code>&lt;lay-out lg="grid(3a)" gap-decorations="cols rows"&gt;</code>
		<lay-out lg="grid(3a)" gap-decorations="cols rows">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
</body>
</html>`

	return html
}

function generateWidthsHTML() {
	const title = 'Width Tokens'

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/ui/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.js"></script>
	<style>
		lay-out[width] { --layout-bg: hsl(220 60% 95%); }
	</style>
</head>
<body>
	<h1>${title}</h1>
	<p>The <strong>width</strong> attribute constrains the layout to predefined max-widths.<br>
		Available tokens: <code>xs</code>, <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>, <code>xxl</code>.</p>

	<h2>Width Tokens</h2>
	<p>Each token maps to a CSS custom property for consistent sizing.</p>
	<section>
		<h3>Width XS (20rem)</h3>
		<small>Extra small container - 320px</small>
		<code>&lt;lay-out md="columns(1)" width="xs"&gt;</code>
		<lay-out md="columns(1)" width="xs">
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Width SM (30rem)</h3>
		<small>Small container - 480px</small>
		<code>&lt;lay-out md="columns(1)" width="sm"&gt;</code>
		<lay-out md="columns(1)" width="sm">
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Width MD (48rem)</h3>
		<small>Medium container - 768px</small>
		<code>&lt;lay-out md="columns(2)" width="md"&gt;</code>
		<lay-out md="columns(2)" width="md">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Width LG (64rem)</h3>
		<small>Large container - 1024px</small>
		<code>&lt;lay-out md="columns(2)" width="lg"&gt;</code>
		<lay-out md="columns(2)" width="lg">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Width XL (80rem)</h3>
		<small>Extra large container - 1280px</small>
		<code>&lt;lay-out md="columns(2)" width="xl"&gt;</code>
		<lay-out md="columns(2)" width="xl">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Width XXL (96rem)</h3>
		<small>Extra extra large container - 1536px</small>
		<code>&lt;lay-out md="columns(2)" width="xxl"&gt;</code>
		<lay-out md="columns(2)" width="xxl">
			<item-card></item-card>
			<item-card></item-card>
		</lay-out>
	</section>
</body>
</html>`

	return html
}

function generateMainIndexHTML(generatedFiles) {
	const title = 'Layout System Demos'

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="A collection of layout system demos">
	<meta name="view-transition" content="same-origin">
	<link rel="stylesheet" href="/ui/base/index.css">
</head>
<body>
	<h1>UI: Components</h1>
	<h2>Layouts</h2>

	<ol>`

	const sortedFiles = Array.from(generatedFiles).sort()

	for (const fileName of sortedFiles) {
		const layoutName = fileName.replace('.html', '')
		const displayName = layoutName.charAt(0).toUpperCase() + layoutName.slice(1)

		html += `
		<li><a href="${fileName}">${displayName}</a></li>`
	}

	html += `
	</ol>
</body>
</html>`

	return html
}

export function buildDemoFiles(layoutsDir, outputDir) {
	console.log('\n🎨 Generating demo files...\n')

	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	const iconsDir = path.join(outputDir, 'icons')
	console.log('🎯 Generating SVG icons...\n')
	const iconCount = buildIcons(layoutsDir, iconsDir)

	const layoutFiles = fs.readdirSync(layoutsDir).filter(file => file.endsWith('.json'))
	const generatedFiles = new Set()
	let demoCount = 0

	for (const file of layoutFiles) {
		const layoutName = path.basename(file, '.json')

		const layoutPath = path.join(layoutsDir, file)

		try {
			const layoutContent = fs.readFileSync(layoutPath, 'utf8')
			const layoutData = JSON.parse(layoutContent)

			if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
				if (layoutData.layouts.length === 0) {
					console.log(`⚠ Skipping ${file}: No layouts defined`)
					continue
				}

				const layoutsForHTML = layoutData.layouts.map(layout => ({
					...layout,
					originalId: layout.id
				}))

				const html = generateLayoutHTML(layoutName, layoutsForHTML, layoutData, iconsDir)
				const htmlPath = path.join(outputDir, `${layoutName}.html`)
				fs.writeFileSync(htmlPath, html)

				generatedFiles.add(`${layoutName}.html`)
				demoCount++
				console.log(`✓ Generated ${layoutName}.html`)
			}
		} catch (error) {
			console.warn(`⚠ Failed to generate demo for ${file}: ${error.message}`)
		}
	}

	// Generate overflow.html from columns.json
	const columnsPath = path.join(layoutsDir, 'columns.json')
	if (fs.existsSync(columnsPath)) {
		try {
			const columnsContent = fs.readFileSync(columnsPath, 'utf8')
			const columnsData = JSON.parse(columnsContent)

			if (columnsData.layouts && columnsData.overflowIcons) {
				const overflowHTML = generateOverflowHTML(columnsData, iconsDir)
				const overflowPath = path.join(outputDir, 'overflow.html')
				fs.writeFileSync(overflowPath, overflowHTML)
				generatedFiles.add('overflow.html')
				demoCount++
				console.log(`✓ Generated overflow.html`)
			}
		} catch (error) {
			console.warn(`⚠ Failed to generate overflow.html: ${error.message}`)
		}
	}

	// Generate bleed.html
	const bleedHTML = generateBleedHTML()
	fs.writeFileSync(path.join(outputDir, 'bleed.html'), bleedHTML)
	generatedFiles.add('bleed.html')
	demoCount++
	console.log(`✓ Generated bleed.html`)

	// Generate gapdeco.html
	const gapdecoHTML = generateGapdecoHTML()
	fs.writeFileSync(path.join(outputDir, 'gapdeco.html'), gapdecoHTML)
	generatedFiles.add('gapdeco.html')
	demoCount++
	console.log(`✓ Generated gapdeco.html`)

	// Generate widths.html
	const widthsHTML = generateWidthsHTML()
	fs.writeFileSync(path.join(outputDir, 'widths.html'), widthsHTML)
	generatedFiles.add('widths.html')
	demoCount++
	console.log(`✓ Generated widths.html`)

	const iconsHTML = generateIconsHTML(iconsDir)
	const iconsPath = path.join(outputDir, 'icons.html')
	fs.writeFileSync(iconsPath, iconsHTML)
	generatedFiles.add('icons.html')
	demoCount++
	console.log(`✓ Generated icons.html`)

	const indexHTML = generateMainIndexHTML(generatedFiles)
	const indexPath = path.join(outputDir, 'index.html')
	fs.writeFileSync(indexPath, indexHTML)
	demoCount++
	console.log(`✓ Generated index.html`)

	console.log(`\n✅ Demo generation complete!`)
	console.log(`   Generated ${demoCount} HTML files`)
	console.log(`   Generated ${iconCount} SVG icons\n`)

	return demoCount
}

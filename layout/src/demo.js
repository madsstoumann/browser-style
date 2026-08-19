import fs from 'fs'
import path from 'path'
import { buildIcons } from './icons.js'
import { generateSrcsets } from './srcsets.js'
import { srcsetMap, srcsetConfig } from '../layouts-map.js'

function generateLayoutHTML(layoutName, layoutData, layoutType, iconsDir) {
	const title = layoutType.name || `${layoutName.charAt(0).toUpperCase() + layoutName.slice(1)} Layouts`
	const prefix = layoutType.prefix || layoutName

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="text-scale" content="scale">
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.min.js"></script>
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

	const groupedEntries = prefix === 'lanes'
		? [[0, layoutData]]
		: (() => {
			const layoutsByItems = new Map()
			layoutData.forEach(layout => {
				const items = layout.items || 1
				if (!layoutsByItems.has(items)) {
					layoutsByItems.set(items, [])
				}
				layoutsByItems.get(items).push(layout)
			})
			return Array.from(layoutsByItems.entries()).sort(([a], [b]) => a - b)
		})()

	for (const [itemCount, layouts] of groupedEntries) {
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

			const srcsets = generateSrcsets(breakpointsObj, srcsetMap, srcsetConfig)
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
		<p><code>${codeExample}</code></p>
		<lay-out${breakpointAttrs}${srcsetsAttr}${overflowAttr}>`

			// Aspect ratios for lanes demo
			const aspectRatios = ['1', '1 / 2', '1 / .5', '1 / 3', '1 / .75', '1 / 1.5', '1 / .33', '1', '1 / 2.5', '1 / .6', '1 / 1.25', '1 / .4', '1 / 2', '1 / .8', '1']

			const count = layout.items || itemCount
			for (let i = 0; i < count; i++) {
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
	<meta name="text-scale" content="scale">
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.min.js"></script>
	<script src="../polyfills/overflow-drag.js"></script>
</head>
<body>
	<h1>${title}</h1>
	<p>These layouts demonstrate the <strong>overflow</strong> attribute with column layouts.<br>
		The <strong>overflow="preview"</strong> shows a partial preview of the next item.
		Carousel controls live on the <code>media=</code> attribute — see <a href="carousel.html">carousel.html</a>.</p>`

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
		<p><code>${codeExample}</code></p>
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
		{ size: 'preview-xl', label: 'Extra Large', desc: '200px preview width' },
		{ size: 'preview-2xl', label: '2X Large', desc: 'Container-relative — 25% of the scroller width' }
	]

	for (const { size, label, desc } of previewSizes) {
		html += `
	<section>
		<h3>${label}</h3>
		<small>${desc}</small>
		<p><code>&lt;lay-out md="columns(1)" overflow="${size}"&gt;</code></p>
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
		{ overflow: 'fade', label: 'Fade (standalone)', desc: 'Bare fade — no preview token; the edge falls back to the 100px default' },
		{ overflow: 'preview fade', label: 'Fade Both', desc: 'Fade masks on both start and end edges' },
		{ overflow: 'preview fade-start', label: 'Fade Start', desc: 'Fade mask on start edge only' },
		{ overflow: 'preview fade-end', label: 'Fade End', desc: 'Fade mask on end edge only' }
	]

	for (const { overflow, label, desc } of fadeMasks) {
		html += `
	<section>
		<h3>${label}</h3>
		<small>${desc}</small>
		<p><code>&lt;lay-out md="columns(1)" overflow="${overflow}"&gt;</code></p>
		<lay-out md="columns(1)" overflow="${overflow}">
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>`
	}

	// Overflow Modifiers section
	html += `

	<h2>Overflow Modifiers</h2>
	<p>Snap behaviour and edge treatment. <strong>center</strong> and <strong>frame</strong> only take effect alongside a <strong>preview*</strong> token — they subtract a peek from <em>each</em> side.</p>`

	const modifiers = [
		{ attrs: ' md="columns(2)" lg="columns(3)"', overflow: 'stop', base: 3, desc: '<code>scroll-snap-stop: always</code> — one item per fling, no skipping' },
		{ attrs: ' md="columns(3)"', overflow: 'none', base: 3, desc: 'Clipped, no scrolling — overflowing items are hidden' },
		{ attrs: ' md="columns(2)"', overflow: 'preview gaps', base: 2, desc: 'Leading and trailing gutter equal to the column gap' },
		{ attrs: ' md="columns(1)"', overflow: 'preview-2xl center', base: 1, desc: 'Centre-snapped with a peek on each side — the 50/25/25 cinematic hero' },
		{ attrs: ' md="columns(1)" lg="columns(2)"', overflow: 'preview-sm frame', base: 2, desc: 'Start-snapped page framed between symmetric peeks — advances one item at a time, works multi-up' }
	]

	for (const { attrs, overflow, base, desc } of modifiers) {
		html += `
	<section>
		<h3><code>overflow="${overflow}"</code></h3>
		<small>${desc}</small>
		<p><code>&lt;lay-out${attrs} overflow="${overflow}"&gt;</code></p>
		<lay-out${attrs} overflow="${overflow}">`

		for (let i = 0; i < base; i++) {
			html += `
			<item-card></item-card>`
		}
		for (let i = 0; i < 3; i++) {
			html += `
			<item-card repeat></item-card>`
		}

		html += `
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
	<meta name="text-scale" content="scale">
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="All layout system icons">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.min.js"></script>
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

/* Index groups. Each entry is [file, label, blurb]; a file listed here but not
   produced by this run is skipped, and anything produced but NOT listed falls into
   "Other" at the end — so a new src/pages/*.html always shows up somewhere rather
   than silently vanishing from the index. */
const INDEX_GROUPS = [
	['Layouts', 'The layout tokens themselves — one demo per pattern, generated from layouts/*.json.', [
		['columns.html', 'Columns', 'Equal-width columns, 1–6'],
		['ratios.html', 'Ratios', '9 proportional splits — columns at uneven widths'],
		['asymmetrical.html', 'Asymmetrical', '6 sidebar/content splits'],
		['autofit.html', 'Autofit', 'auto(fit) and auto(fill)'],
		['grid.html', 'Grid', '19 mixed-size grid patterns'],
		['bento.html', 'Bento', '10 dashboard-style box layouts'],
		['mosaic.html', 'Mosaic', '5 patterns, including hex'],
		['lanes.html', 'Lanes', 'Masonry via display: grid-lanes'],
		['stack.html', 'Stack', 'Overlapping layers in one cell'],
	]],
	['Modifiers', 'Attributes that change how a layout behaves, on top of any layout token.', [
		['overflow.html', 'Overflow', 'Horizontal scroller — preview, snap, fade, center/frame'],
		['carousel.html', 'Carousel', 'media= controls: dots, arrows, paging, autoplay'],
		['spacing.html', 'Spacing', 'Breakpoint padding, margin and gap tokens'],
		['widths.html', 'Widths', 'width= max-width tokens'],
		['bleed.html', 'Bleed', 'Escaping the page column, full-bleed bands'],
		['gapdeco.html', 'Gap decorations', 'Rules drawn in the grid gaps'],
	]],
	['Motion', 'Scroll-driven animation. The engine lives in @browser.style/base; load it alongside layout.css.', [
		['animate.html', 'Animate', 'animate= — the children animate, staggered'],
		['animate-self.html', 'Animate-self', 'animate-self= — the container animates'],
		['reveal.html', 'Reveal', 'clip-path reveals on scroll entry'],
		['reveal-stack.html', 'Reveal stack', 'stack(reveal) — sticky, layered scroll scenes'],
	]],
	['Extras', null, [
		['icons.html', 'Icons', 'SVG preview glyph for every layout variant'],
	]],
]

function generateMainIndexHTML(generatedFiles) {
	const title = 'Layout System Demos'
	const listed = new Set(INDEX_GROUPS.flatMap(([, , items]) => items.map(([f]) => f)))
	const groups = INDEX_GROUPS
		.map(([name, desc, items]) => [name, desc, items.filter(([f]) => generatedFiles.has(f))])
		.filter(([, , items]) => items.length)

	// anything built this run but not placed in a group above
	const ungrouped = Array.from(generatedFiles)
		.filter(f => !listed.has(f) && f !== 'index.html')
		.sort()
		.map(f => [f, f.replace('.html', '').replace(/^./, c => c.toUpperCase()), ''])
	if (ungrouped.length) groups.push(['Other', 'Not yet grouped — add them to INDEX_GROUPS in src/demo.js.', ungrouped])

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="text-scale" content="scale">
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="A collection of layout system demos">
	<meta name="view-transition" content="same-origin">
	<link rel="stylesheet" href="/ui/base/index.css">
	<style>
		.index { margin-block: var(--spacing-lg); }
		.index > section { break-inside: avoid; margin-block-end: var(--spacing-lg); }
		.index h2 { font-size: 1rem; letter-spacing: 0.04em; margin: 0 0 0.25rem; text-transform: uppercase; }
		.index p { color: GrayText; font-size: 0.875rem; margin: 0 0 0.5rem; }
		.index ol { margin: 0; padding-inline-start: 1.25rem; }
		.index li { margin-block-end: 0.25rem; }
		.index small { color: GrayText; }
		@media (min-width: 45rem) {
			.index { columns: 2; column-gap: var(--spacing-xl); }
		}
		@media (min-width: 70rem) {
			.index { columns: 3; }
		}
	</style>
</head>
<body>
	<h1>Layout System Demos</h1>
	<p>Demos for <code>&lt;lay-out&gt;</code>. Every page here is build output — edit
	<code>src/pages/*.html</code> or <code>src/demo.js</code>, then run <code>npm run build:demo</code>.</p>

	<div class="index">`

	for (const [name, desc, items] of groups) {
		html += `
		<section>
			<h2>${name}</h2>${desc ? `
			<p>${desc}</p>` : ''}
			<ol>`
		for (const [file, label, blurb] of items) {
			html += `
				<li><a href="${file}">${label}</a>${blurb ? `<br><small>${blurb}</small>` : ''}</li>`
		}
		html += `
			</ol>
		</section>`
	}

	html += `
	</div>
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

	// Copy static demo pages from src/pages/
	const pagesDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'pages')
	const staticPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'))
	for (const page of staticPages) {
		const pageContent = fs.readFileSync(path.join(pagesDir, page), 'utf8')
			.replaceAll('/ui/layout/', '/layout/')
		fs.writeFileSync(path.join(outputDir, page), pageContent)
		generatedFiles.add(page)
		demoCount++
		console.log(`✓ Copied ${page}`)
	}

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

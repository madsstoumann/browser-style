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
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/layout/demo.css">
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
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="${title} using CSS layout system">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/layout/demo.css">
	<script type="module" src="../polyfills/attr-fallback.js"></script>
	<script src="../polyfills/overflow-drag.js"></script>
</head>
<body>
	<h1>${title}</h1>
	<p>These layouts demonstrate the <strong>overflow</strong> attribute with column layouts.<br>
		The <strong>overflow="preview"</strong> shows a partial preview of the next item.
		Each carousel below pairs <code>stagger</code> (per-card reveal as you swipe) with a
		<strong>wilder</strong> <code>animate-self="…() trigger-both"</code> container entry
		(3D flips + clip-path reveals) — <code>trigger-both</code> replays it every time you
		scroll away and back. The <strong>Pages</strong> demo at the end is <code>stagger</code>-only.
		<em>(Big-translate effects like <code>bounce-in-up</code> can't drive an
		<code>animate-self</code> container entry — the element translates out of its own
		scroll-trigger's view range and deadlocks — so the wild set here is transform-in-place:
		rotate / clip.)</em></p>

	<div style="height: 80vh; display: grid; place-items: center;">
		<p style="opacity: 0.5;">↓ Scroll down to see the carousels animate in ↓</p>
	</div>`

	// Carousel controls — shared styles from ui/base/carousel.css, loaded via the
	// linked @browser.style/base (ui/base/index.css); opt-in via media= control tokens.
	// (base also provides the animation @keyframes and stagger.css used below.)
	html += `
	<section>
		<h3>Carousel controls — <code>media="nav"</code></h3>
		<small>Shared carousel controls from <code>ui/base/carousel.css</code>: markers + arrows via the <code>media="nav"</code> token</small>
		<code>&lt;lay-out overflow media="nav" stagger animate-self="flip-up() trigger-both"&gt;</code>
		<lay-out overflow media="nav" stagger animate-self="flip-up() trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Band below — <code>nav(blw)</code></h3>
		<small>Controls in a reserved band below the items — bare arrows</small>
		<code>&lt;lay-out overflow media="nav(blw) arw(bare)" stagger animate-self="flip-left() trigger-both"&gt;</code>
		<lay-out overflow media="nav(blw) arw(bare)" stagger animate-self="flip-left() trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Band above — <code>nav(abv)</code> + <code>arw(set)</code></h3>
		<small>Controls in a band above the items, arrow pair clustered at the inline-end</small>
		<code>&lt;lay-out overflow media="nav(abv) arw(set)" stagger animate-self="flip-diagonal() trigger-both"&gt;</code>
		<lay-out overflow media="nav(abv) arw(set)" stagger animate-self="flip-diagonal() trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Clustered arrows on media — <code>arw(set) arw(be)</code></h3>
		<small>Arrow pair as one cluster in the bottom-end corner, dots bottom-center</small>
		<code>&lt;lay-out overflow media="nav arw(set) arw(be)" stagger animate-self="reveal(polygon) trigger-both"&gt;</code>
		<lay-out overflow media="nav arw(set) arw(be)" stagger animate-self="reveal(polygon) trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Dots below, arrows on media — <code>mrk(blw)</code></h3>
		<small>Dots alone in a band below; arrows stay centered on the items</small>
		<code>&lt;lay-out overflow media="nav mrk(blw)" stagger animate-self="flip-right() trigger-both"&gt;</code>
		<lay-out overflow media="nav mrk(blw)" stagger animate-self="flip-right() trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Arrows below, dots on media — <code>arw(blw)</code></h3>
		<small>Arrows alone in a band below; dots stay on the items</small>
		<code>&lt;lay-out overflow media="nav arw(blw)" stagger animate-self="flip-down() trigger-both"&gt;</code>
		<lay-out overflow media="nav arw(blw)" stagger animate-self="flip-down() trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Markers only, pill timer — <code>nav(mrk)</code> + <code>mrk(pll)</code></h3>
		<small>No arrows; the current pill fills over <code>--ui-carousel-autoplay</code> (5s)</small>
		<code>&lt;lay-out overflow media="nav(mrk) mrk(pll)" stagger animate-self="reveal(circle) trigger-both"&gt;</code>
		<lay-out overflow media="nav(mrk) mrk(pll)" stagger animate-self="reveal(circle) trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Arrows only, dark — <code>nav(arw)</code> + <code>arw(drk)</code></h3>
		<small>No dots; dark circles with white chevrons, auto-hidden at the dead end (<code>arw(hid)</code>)</small>
		<code>&lt;lay-out overflow media="nav(arw) arw(drk) arw(hid)" stagger animate-self="reveal(inset) trigger-both"&gt;</code>
		<lay-out overflow media="nav(arw) arw(drk) arw(hid)" stagger animate-self="reveal(inset) trigger-both">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Preview + controls — <code>overflow="preview"</code> + <code>media="nav"</code></h3>
		<small>Next-item preview composes with controls — arrows advance one item at a time; dots in a band below via <code>mrk(blw)</code>, full-arrow glyph via <code>arw(arr)</code>. (For a control-less swipe scroller, <code>overflow="stop"</code> gives the same one-item-per-fling stepping.)</small>
		<code>&lt;lay-out md="columns(2)" overflow="preview" media="nav mrk(blw) arw(arr)"&gt;</code>
		<lay-out md="columns(2)" overflow="preview" media="nav mrk(blw) arw(arr)">
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>
	<section>
		<h3>Pages + stagger — <code>media="pages"</code> + <code>stagger</code></h3>
		<small>Snap + dot per <strong>page</strong> of N items (dot count adapts per breakpoint), dots in a band below via <code>mrk(blw)</code>. <code>stagger</code> reveals the carousel as it scrolls into view and each card as you swipe — scroll-driven, so it re-runs on scroll back (add <code>trigger</code> for a one-shot). <code>stagger="rise|fall|lft|rgt|zom|blr|fde"</code> picks the effect (bare = rise).</small>
		<code>&lt;lay-out md="columns(2)" lg="columns(3)" overflow media="nav pages mrk(blw)" stagger&gt;</code>
		<lay-out md="columns(2)" lg="columns(3)" overflow media="nav pages mrk(blw)" stagger>
			<item-card></item-card>
			<item-card></item-card>
			<item-card></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
			<item-card repeat></item-card>
		</lay-out>
	</section>`

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
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="All layout system icons">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="layout.min.css">
	<link rel="stylesheet" href="/layout/demo.css">
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

function generateMainIndexHTML(generatedFiles) {
	const title = 'Layout System Demos'

	let html = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${title}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="color-scheme" content="light dark">
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

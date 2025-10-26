/**
 * @browser.style/layout - Icon Generator
 * Generates SVG icons from layout JSON definitions
 */

import fs from 'fs'
import path from 'path'

/**
 * Render SVG icons from layout icon data
 *
 * @param {Array} layouts - Array of layout objects with icon data
 * @param {number} gap - Gap between icon rectangles
 * @param {number} borderRadius - Border radius for rectangles
 * @returns {Array<string>} Array of SVG strings
 */
export function renderIcons(layouts, gap = 2, borderRadius = 4) {
	return layouts.map(layout => {
		if (!layout.icon) return null

		return `<svg viewBox="0 0 100 100">${
			layout.icon.map((rect, index) => {
				const tX = rect.x + (rect.w / 2) - 4
				const tY = rect.y + (rect.h / 2) + 2
				return `
        <rect rx="${borderRadius}" width="${rect.w - gap}" height="${rect.h - gap}" x="${rect.x}" y="${rect.y}"${rect.class ? ` class="${rect.class}"` : ''} />
        <text x="${tX}" y="${tY}%">${index + 1}</text>`
			}).join('')
		}${layout.text ? `<text x="50%" y="90%" class="text">${layout.text}</text>` : ''}
    </svg>`
	}).filter(Boolean)
}

/**
 * Build all layout icons from JSON files
 *
 * @param {string} layoutsDir - Path to layouts folder
 * @param {string} outputDir - Path to output icons folder
 * @param {number} gap - Gap between icon rectangles
 * @param {number} borderRadius - Border radius for rectangles
 * @returns {number} Total number of icons generated
 */
export function buildIcons(layoutsDir, outputDir, gap = 2, borderRadius = 4) {
	try {
		// Create icons directory if it doesn't exist, or clear it if it does
		if (fs.existsSync(outputDir)) {
			// Delete all files in the icons directory
			const files = fs.readdirSync(outputDir)
			files.forEach(file => {
				fs.unlinkSync(path.join(outputDir, file))
			})
		} else {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		// Get all JSON files from layouts directory
		const jsonFiles = fs.readdirSync(layoutsDir).filter(file => file.endsWith('.json'))

		let totalIcons = 0

		jsonFiles.forEach(jsonFile => {
			const filePath = path.join(layoutsDir, jsonFile)
			const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

			if (data.layouts && Array.isArray(data.layouts)) {
				const icons = renderIcons(data.layouts, gap, borderRadius)
				const prefix = data.prefix || path.basename(jsonFile, '.json')

				// Save each icon as separate SVG file
				icons.forEach((icon, index) => {
					const layout = data.layouts[index]
					const layoutId = layout?.id || (index + 1)
					const fileName = `${prefix}(${layoutId}).svg`
					const svgPath = path.join(outputDir, fileName)
					fs.writeFileSync(svgPath, icon)
				})

				// Generate overflow preview icons if available
				if (data.overflowIcons) {
					const overflowIcons = renderIcons(
						Object.entries(data.overflowIcons).map(([id, icon]) => ({ id, icon })),
						gap,
						borderRadius
					)

					overflowIcons.forEach((icon, index) => {
						const overflowEntries = Object.entries(data.overflowIcons)
						const [layoutId] = overflowEntries[index]
						const fileName = `${prefix}(${layoutId})-preview.svg`
						const svgPath = path.join(outputDir, fileName)
						fs.writeFileSync(svgPath, icon)
					})

					totalIcons += overflowIcons.length
					console.log(`✓ Generated ${overflowIcons.length} overflow preview icons from ${jsonFile}`)
				}

				totalIcons += icons.length
				console.log(`✓ Generated ${icons.length} icons from ${jsonFile}`)
			}
		})

		console.log(`\n✓ Total: Generated ${totalIcons} SVG icon files\n`)
		return totalIcons
	} catch (error) {
		console.error('❌ Error building icons:', error.message)
		return 0
	}
}

#!/usr/bin/env node

/**
 * @browser.style/layout - Build Script
 * Generates CSS from layout.config
 */

import { LayoutBuilder } from './src/builder.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
const minify = args.includes('--minify')
const watch = args.includes('--watch')

const configIndex = args.indexOf('--config')
const configPath = configIndex !== -1 ? args[configIndex + 1] : path.join(__dirname, 'layout.config')

const outputIndex = args.indexOf('--output')
const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : path.join(__dirname, 'dist', 'layout.css')

const layoutsDir = path.join(path.dirname(configPath), 'layouts')

/**
 * Build CSS
 */
async function build() {
	try {
		const builder = new LayoutBuilder(configPath, layoutsDir, outputPath)

		if (minify) {
			await builder.buildAll()
		} else {
			await builder.build(false)
		}

		console.log('✅ Build complete!\n')
	} catch (error) {
		console.error('❌ Build failed:', error.message)
		console.error(error.stack)
		process.exit(1)
	}
}

/**
 * Watch mode
 */
async function watchBuild() {
	const fs = await import('fs')

	console.log('👀 Watching for changes...\n')

	// Watch config file
	fs.watch(configPath, async (eventType) => {
		if (eventType === 'change') {
			console.log('🔄 Config changed, rebuilding...\n')
			await build()
		}
	})

	// Watch layouts directory
	fs.watch(layoutsDir, { recursive: true }, async (eventType, filename) => {
		if (filename && filename.endsWith('.json')) {
			console.log(`🔄 Layout ${filename} changed, rebuilding...\n`)
			await build()
		}
	})

	// Initial build
	await build()
}

// Run
if (watch) {
	watchBuild()
} else {
	build()
}

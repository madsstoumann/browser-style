#!/usr/bin/env node

/**
 * @browser.style/layout - Build Script
 * Generates CSS from layout.config
 */

import { LayoutBuilder } from './src/builder.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
const minify = args.includes('--minify')
const watch = args.includes('--watch')

/**
 * Find config file
 * 1. Check if --config flag is provided
 * 2. Check user's project directory (process.cwd())
 * 3. Fall back to package directory (__dirname)
 */
function findConfigPath() {
	const configIndex = args.indexOf('--config')

	if (configIndex !== -1) {
		// User specified config path
		return args[configIndex + 1]
	}

	// Check user's project directory first
	const userConfigPath = path.join(process.cwd(), 'layout.config.json')
	if (existsSync(userConfigPath)) {
		console.log('✓ Found layout.config.json in project directory')
		return userConfigPath
	}

	// Fall back to package directory
	return path.join(__dirname, 'layout.config.json')
}

/**
 * Find output path
 * 1. Check if --output flag is provided
 * 2. If config is in user's project, output to ./dist/layout.css
 * 3. Otherwise output to package dist
 */
function findOutputPath(configPath) {
	const outputIndex = args.indexOf('--output')

	if (outputIndex !== -1) {
		// User specified output path
		return args[outputIndex + 1]
	}

	// If config is in user's project, output there too
	if (configPath.startsWith(process.cwd())) {
		return path.join(process.cwd(), 'dist', 'layout.css')
	}

	// Fall back to package directory
	return path.join(__dirname, 'dist', 'layout.css')
}

const configPath = findConfigPath()
const outputPath = findOutputPath(configPath)

/**
 * Find layouts directory
 * 1. Check next to config file
 * 2. Fall back to package layouts directory
 */
function findLayoutsDir(configPath) {
	// Check next to config file first
	const localLayoutsDir = path.join(path.dirname(configPath), 'layouts')
	if (existsSync(localLayoutsDir)) {
		return localLayoutsDir
	}

	// Fall back to package layouts
	return path.join(__dirname, 'layouts')
}

const layoutsDir = findLayoutsDir(configPath)

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

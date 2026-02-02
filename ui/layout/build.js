#!/usr/bin/env node

import { LayoutBuilder } from './src/builder.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync, writeFileSync, readFileSync } from 'fs'
import postcss from 'postcss'
import cssnano from 'cssnano'
import preset from 'cssnano-preset-advanced'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv.slice(2)

function findConfigPath() {
	const configIndex = args.indexOf('--config')
	if (configIndex !== -1) return args[configIndex + 1]

	const userConfigPath = path.join(process.cwd(), 'layout.config.json')
	if (existsSync(userConfigPath)) return userConfigPath

	return path.join(__dirname, 'layout.config.json')
}

function findOutputPath(configPath) {
	const outputIndex = args.indexOf('--output')
	if (outputIndex !== -1) return args[outputIndex + 1]

	if (configPath.startsWith(process.cwd())) {
		return path.join(process.cwd(), 'dist', 'layout.css')
	}

	return path.join(__dirname, 'dist', 'layout.css')
}

const configPath = findConfigPath()
const outputPath = findOutputPath(configPath)

function findLayoutsDir(configPath) {
	const localLayoutsDir = path.join(path.dirname(configPath), 'layouts')
	if (existsSync(localLayoutsDir)) return localLayoutsDir
	return path.join(__dirname, 'layouts')
}

const layoutsDir = findLayoutsDir(configPath)

async function build() {
	try {
		const builder = new LayoutBuilder(configPath, layoutsDir, outputPath)
		await builder.build(false)

		// Generate minified version
		const css = readFileSync(outputPath, 'utf8')
		const result = await postcss([
			cssnano({ preset: preset() })
		]).process(css, { from: outputPath })

		const minPath = outputPath.replace(/\.css$/, '.min.css')
		writeFileSync(minPath, result.css, 'utf8')
		console.log(`✓ Generated: ${minPath}`)
		console.log(`  Size: ${(result.css.length / 1024).toFixed(2)} KB\n`)
	} catch (error) {
		console.error('❌ Build failed:', error.message)
		process.exit(1)
	}
}

build()

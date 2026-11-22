#!/usr/bin/env node

import { LayoutBuilder } from './src/builder.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync, writeFileSync, readFileSync } from 'fs'

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

		// Generate minified version — postcss and cssnano are dev dependencies, so a project that installed the package may not have them
		const minifier = await Promise.all([import('postcss'), import('cssnano')]).catch(() => null)
		if (!minifier) {
			console.log('  (no postcss/cssnano installed: layout.min.css skipped)\n')
			return
		}
		const [{ default: postcss }, { default: cssnano }] = minifier
		const css = readFileSync(outputPath, 'utf8')
		const result = await postcss([
			cssnano({ preset: ['cssnano-preset-advanced', {
				convertValues: false,
				reduceIdents: false,
				discardUnused: false
			}] })
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

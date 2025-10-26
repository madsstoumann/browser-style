#!/usr/bin/env node

/**
 * Generate layouts-map.js from JSON layout files
 * This creates a lightweight JavaScript module that can be imported in the browser
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const layoutsDir = join(__dirname, '../layouts')
const outputPath = join(__dirname, '../layouts-map.js')
const configPath = join(__dirname, '../layout.config')

/**
 * Extract only the essential data needed for srcset calculations
 */
function extractLayoutData(layoutFile) {
    const layouts = {}
    for (const layout of layoutFile.layouts) {
        const key = `${layoutFile.prefix}(${layout.id})`
        layouts[key] = layout.srcset
    }
    return layouts
}

/**
 * Load layout configuration
 */
function loadConfig() {
    const configContent = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent)

    return {
        maxLayoutWidth: config.layoutContainer?.maxLayoutWidth?.value || '1024px',
        breakpoints: Object.entries(config.breakpoints || {}).reduce((acc, [name, bp]) => {
            if (bp.min) {
                acc[name] = parseInt(bp.min.replace('px', ''))
            }
            return acc
        }, {})
    }
}

/**
 * Main generation function
 */
function generateLayoutsMap() {
    console.log('🔨 Generating layouts map...\n')

    const srcsetMap = {}
    const files = readdirSync(layoutsDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
        const filePath = join(layoutsDir, file)
        const content = readFileSync(filePath, 'utf-8')
        const layoutFile = JSON.parse(content)

        if (layoutFile.layouts && Array.isArray(layoutFile.layouts)) {
            const extracted = extractLayoutData(layoutFile)
            Object.assign(srcsetMap, extracted)
            console.log(`✓ Loaded ${file.padEnd(20)} (${Object.keys(extracted).length} layouts)`)
        }
    }

    const config = loadConfig()

    // Generate simplified JavaScript module
    const jsContent = `/**
 * Auto-generated layout srcset map
 * Generated from JSON layout files
 * Do not edit manually - run: npm run generate:layouts-map
 */

/**
 * Layout srcset map
 * Key: layout pattern (e.g., "grid(3c)", "columns(2)")
 * Value: srcset string
 */
export const srcsetMap = ${JSON.stringify(srcsetMap, null, 2)}

/**
 * Configuration from layout.config
 */
export const layoutConfig = ${JSON.stringify(config, null, 2)}

/**
 * Get srcset for a layout pattern
 * @param {string} pattern - Layout pattern (e.g., "grid(3c)")
 * @returns {string|null} Srcset value or null
 */
export function getLayoutSrcset(pattern) {
    return srcsetMap[pattern] || null
}
`

    writeFileSync(outputPath, jsContent, 'utf-8')

    console.log(`\n✅ Generated: ${outputPath}`)
    console.log(`   Total layouts: ${Object.keys(srcsetMap).length}`)
    console.log(`   Breakpoints: ${Object.keys(config.breakpoints).join(', ')}`)
    console.log(`   Max width: ${config.maxLayoutWidth}\n`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generateLayoutsMap()
}

export { generateLayoutsMap }
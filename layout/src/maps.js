#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const layoutsDir = join(__dirname, '../layouts')
const outputPath = join(__dirname, '../layouts-map.js')
const configPath = join(__dirname, '../layout.config.json')

function extractLayoutData(layoutFile) {
    const layouts = {}
    for (const layout of layoutFile.layouts) {
        if (layout.id === '*') continue
        const key = `${layoutFile.prefix}(${layout.id})`
        layouts[key] = layout.srcset
    }
    return layouts
}

// A breakpoint needs a numeric width here even when it has no `min` in the
// config: the mobile-first base (`xs`) deliberately omits `min` so the CSS
// builder emits its rules un-wrapped, but srcset generation still needs its
// design width — and applySrcsets only reads element attributes for names
// present in srcsetConfig.breakpoints, so dropping it would silently disable
// `xs=` srcset hints entirely. Such breakpoints declare `srcsetMin` instead
// (builder ignores it; it never becomes a media query).
function loadConfig() {
    const configContent = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent)

    return {
        maxLayoutWidth: config.layoutContainer?.maxWidth || 1024,
        breakpoints: Object.entries(config.breakpoints || {}).reduce((acc, [name, bp]) => {
            const width = bp.min ?? bp.srcsetMin
            if (width) {
                acc[name] = parseInt(width.replace('px', ''))
            }
            return acc
        }, {})
    }
}

function generateLayoutsMap() {
    const srcsetMap = {}
    const files = readdirSync(layoutsDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
        const filePath = join(layoutsDir, file)
        const content = readFileSync(filePath, 'utf-8')
        const layoutFile = JSON.parse(content)

        if (layoutFile.layouts && Array.isArray(layoutFile.layouts)) {
            const extracted = extractLayoutData(layoutFile)
            Object.assign(srcsetMap, extracted)
        }
    }

    const config = loadConfig()

    const jsContent = `export const srcsetMap = ${JSON.stringify(srcsetMap, null, 2)}

export const srcsetConfig = ${JSON.stringify(config, null, 2)}

export function getLayoutSrcset(pattern) {
    return srcsetMap[pattern] || null
}
`

    writeFileSync(outputPath, jsContent, 'utf-8')

    console.log(JSON.stringify({
        generated: outputPath,
        totalLayouts: Object.keys(srcsetMap).length,
        breakpoints: Object.keys(config.breakpoints),
        maxWidth: config.maxLayoutWidth
    }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) {
    generateLayoutsMap()
}

export { generateLayoutsMap }
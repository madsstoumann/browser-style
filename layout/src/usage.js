/* Read layout usage from markup or JSON for `build.js --check`. Docs: layout/readme.md § Checking usage against the config. */
import fs from 'fs'

const BREAKPOINT_ATTR = /\s(xs|sm|md|lg|xl|xxl)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

// Every <lay-out> / <lay-out-group> start tag -> { bp: value } (element names are configurable)
export function usageFromMarkup(text, element = 'lay-out') {
	const tag = new RegExp(`<(?:${element}|${element}-group)\\b[^>]*>`, 'g')
	return [...text.matchAll(tag)].map(([start]) => {
		const usage = {}
		for (const m of start.matchAll(BREAKPOINT_ATTR)) usage[m[1]] = m[2] ?? m[3]
		return usage
	}).filter(u => Object.keys(u).length)
}

// A .json file is an array of attribute objects: [{ "md": "columns(2)", "lg": "bento(6a) cg(sm)" }]
export function usageFromFile(file, element) {
	const text = fs.readFileSync(file, 'utf8')
	if (file.endsWith('.json')) {
		const data = JSON.parse(text)
		if (!Array.isArray(data)) throw new Error(`${file}: expected an array of attribute objects`)
		return data
	}
	return usageFromMarkup(text, element)
}

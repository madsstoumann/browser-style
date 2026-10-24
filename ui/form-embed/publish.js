/**
 * Writes form bundles: forms/{id}/{version}.json (immutable) and forms/{id}/latest.json = { id, version, form, rules, functions, runtime }.
 * Stands in for the publish step until the editor or the CMS writes bundles.
 * Usage: node ui/form-embed/publish.js <id> <version> <form.json> [rules.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [id, version, formPath, rulesPath] = process.argv.slice(2);
if (!id || !version || !formPath) {
	console.error('Usage: node ui/form-embed/publish.js <id> <version> <form.json> [rules.json]');
	process.exit(1);
}

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const form = read(formPath);
const rules = rulesPath ? read(rulesPath) : { id: 'none', rules: [] };
const registry = read(join(here, 'functions/registry.json'));
const runtime = read(join(here, '../form-flow/package.json')).version;

/* Every registry name used as an operator key or as a field check. */
const used = new Set();
(function walk(node) {
	if (Array.isArray(node)) return node.forEach(walk);
	if (!node || typeof node !== 'object') return;
	for (const [key, value] of Object.entries(node)) {
		if (key in registry && key !== '$comment') used.add(key);
		if (key === 'check' && typeof value === 'string') used.add(value);
		walk(value);
	}
})([form, rules]);

const unknown = [...used].filter(name => !(name in registry));
if (unknown.length) {
	console.error(`Not in functions/registry.json: ${unknown.join(', ')}`);
	process.exit(1);
}

const bundle = `${JSON.stringify({ id, version: Number(version) || version, runtime, functions: [...used].sort(), form, rules }, null, '\t')}\n`;
const target = join(here, 'forms', id, `${version}.json`);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, bundle);
/* latest.json is what <form-embed> loads without a version attribute. */
writeFileSync(join(here, 'forms', id, 'latest.json'), bundle);
console.log(`${target} (+ latest.json): ${used.size} functions`);

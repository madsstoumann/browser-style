/**
 * Runs every conformance fixture in ../fixtures. A fixture is
 * { description, form, rules, patches?, input, expect }, where form, rules and
 * patch paths are relative to the fixture. Any other runtime of the engine
 * should pass the same files.
 *
 * In `expect`, values, matched, patches, path, issues and effects must match
 * exactly; fields, steps and explain only need to contain what is listed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, merge } from '../index.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const read = (base, path) => JSON.parse(readFileSync(join(base, path), 'utf8'));
const EXACT = new Set(['values', 'matched', 'patches', 'path', 'issues', 'effects']);

function contains(actual, expected, path) {
	if (Array.isArray(expected)) {
		assert.ok(Array.isArray(actual), `${path} should be an array`);
		assert.equal(actual.length, expected.length, `${path} length`);
		expected.forEach((item, index) => contains(actual[index], item, `${path}[${index}]`));
	} else if (expected && typeof expected === 'object') {
		assert.ok(actual && typeof actual === 'object', `${path} should be an object`);
		Object.entries(expected).forEach(([key, value]) => contains(actual[key], value, `${path}.${key}`));
	} else {
		assert.deepEqual(actual, expected, path);
	}
}

for (const file of readdirSync(dir).filter(name => name.endsWith('.json')).sort()) {
	const fixture = read(dir, file);
	test(`${file}: ${fixture.description}`, () => {
		const form = read(dir, fixture.form);
		let rules = read(dir, fixture.rules);
		for (const { owner, patch } of fixture.patches ?? []) {
			const result = merge(form, rules, read(dir, patch), { owner });
			assert.deepEqual(result.errors, [], 'patch should merge');
			rules = result.ruleSet;
		}
		const state = evaluate(form, rules, fixture.input);
		for (const [key, expected] of Object.entries(fixture.expect)) {
			if (EXACT.has(key)) assert.deepEqual(state[key], expected, key);
			else contains(state[key], expected, key);
		}
	});
}

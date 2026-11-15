import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fromTree, toTree, renameVisibleWhen, usesName } from '../modules/visible-when.js';
import { renameField, usesOfVariable } from '../modules/model.js';
import { apply, validate, visibleWhenLogic } from '../../form-rules/index.js';

const conformance = JSON.parse(readFileSync(new URL('../../form-rules/fixtures/visible-when/conformance.json', import.meta.url), 'utf8'));

test('every visibleWhen the rows can draw comes back as it went in', () => {
	const conditions = [
		{ field: 'kind', is: 'video' }, { field: 'kind', in: ['video', 'map'] }, { field: 'kind', notIn: ['image'] },
		{ field: 'title', empty: true }, { field: 'title', empty: false }, { field: 'count', gt: 1 }, { field: 'count', lte: 0 },
		{ field: 'url', startsWith: 'https://' }, { field: 'url', contains: 'YT', matchCase: true },
		{ not: { field: 'kind', is: 'map' } }, { not: { field: 'url', contains: 'vimeo' } },
		{ all: [{ field: 'kind', is: 'video' }, { any: [{ field: 'count', gte: 2 }, { field: 'title', empty: false }] }] },
		'isSenior', { not: 'isSenior' }, { any: ['isSenior', { field: 'live', is: true }] }
	];
	for (const condition of conditions) assert.deepEqual(fromTree(toTree(condition)), condition, JSON.stringify(condition));
});

test('a conformance condition drawn as rows and written back says the same on every case', () => {
	const unique = [...new Set(conformance.cases.map(c => JSON.stringify(c.condition)))];
	assert.ok(unique.filter(text => toTree(JSON.parse(text))).length >= unique.length - 1);
	for (const c of conformance.cases) {
		const tree = toTree(c.condition);
		if (!tree) continue;
		const values = Object.fromEntries(Object.keys(conformance.fields).map(k => [k, c.values[k] ?? null]));
		assert.equal(Boolean(apply(visibleWhenLogic(fromTree(tree)), { values })), c.holds, JSON.stringify(c));
	}
	/* a not around a group has no row */
	assert.equal(toTree({ not: { any: [{ field: 'count', gt: 5 }, { field: 'url', contains: 'vimeo' }] } }), null);
});

test('rows visibleWhen cannot say give null; no rows give undefined', () => {
	const tree = { kind: 'group', mode: 'and', items: [{ kind: 'cond', path: 'context.channel', op: '===', value: 'web' }] };
	assert.equal(fromTree(tree), null);
	assert.equal(fromTree({ kind: 'group', mode: 'and', items: [{ kind: 'cond', path: 'values.a', op: '<', value: null, other: 'values.b' }] }), null);
	assert.equal(fromTree({ kind: 'group', mode: 'and', items: [] }), undefined);
});

test('renaming a field renames it in visibleWhen; a named condition used there counts as a use', () => {
	assert.deepEqual(renameVisibleWhen({ all: [{ field: 'drug', is: 'x' }, { not: { field: 'drug', empty: true } }, 'isThc'] }, 'drug', 'substance'),
		{ all: [{ field: 'substance', is: 'x' }, { not: { field: 'substance', empty: true } }, 'isThc'] });
	assert.equal(usesName({ any: [{ field: 'a', is: 1 }, { not: 'isThc' }] }, 'isThc'), true);
	const form = { id: 'f', model: 'form-definition', fields: { title: 'F', structure: { layout: [
		{ type: 'step', id: 'one', fields: ['drug', 'level'] },
		{ type: 'step', id: 'two', fields: ['note'], visibleWhen: { field: 'drug', is: 'cannabis' } }
	] }, properties: {
		drug: { type: 'select', title: 'Drug', options: { choices: [{ value: 'cannabis', label: 'Cannabis' }, { value: 'other', label: 'Other' }] } },
		level: { type: 'string', title: 'Level', visibleWhen: { all: [{ field: 'drug', is: 'cannabis' }, 'isAdult'] } },
		note: { type: 'string', title: 'Note' }
	} } };
	const rules = { id: 'r', model: 'form-rules', fields: { form: 'f', variables: { isAdult: { type: 'boolean', title: 'Is adult', compute: true } }, rules: [] } };
	assert.deepEqual(validate(form, rules).errors, []);
	const result = renameField(form, rules, 'drug', 'substance');
	assert.deepEqual(result.form.fields.properties.level.visibleWhen, { all: [{ field: 'substance', is: 'cannabis' }, 'isAdult'] });
	assert.deepEqual(result.form.fields.structure.layout[1].visibleWhen, { field: 'substance', is: 'cannabis' });
	assert.deepEqual(validate(result.form, result.rules).errors, []);
	assert.deepEqual(usesOfVariable(rules, 'isAdult', form), ['field "Level"']);
});

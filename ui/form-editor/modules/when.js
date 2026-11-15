/**
 * "When …" written on the form: a field's or step's showWhen and a text block's cases.
 * The picker offers the rule set's named conditions by title, so the form (which is translated)
 * stores only a name. A new condition becomes a named condition at once.
 */
import { h, button, select } from './dom.js';
import { addNamedCondition, clone, isNamedCondition } from './model.js';
import { parseCondition, serializeCondition } from './conditions.js';
import { groupEditor, rawEditor } from './view-rules.js';
import { fromTree, toTree } from './visible-when.js';

export const namedConditions = rules => Object.entries(rules.fields.variables ?? {}).filter(([, definition]) => isNamedCondition(definition));

/* apply(value, rules?): value is a name, JSON Logic, or undefined for "Always"; rules is passed when a named condition was added. */
export function whenPicker(editor, value, { label, always = false, when = false, apply }) {
	const named = namedConditions(editor.rules);
	const custom = value !== undefined && typeof value !== 'string';
	const missing = typeof value === 'string' && value !== '__when' && !named.some(([name]) => name === value);
	const options = [
		always ? ['', 'Always'] : ['', 'Choose a condition…'],
		when ? ['__when', 'When…'] : null,
		...named.map(([name, definition]) => [name, definition.title ?? name]),
		missing ? [value, `${value} (no such named condition)`] : null,
		custom ? ['__custom', 'A condition of its own'] : null,
		['__new', '+ New named condition…']
	].filter(Boolean);
	const current = value === undefined ? '' : custom ? '__custom' : value;
	const create = compute => {
		const title = prompt('Name the condition, as editors will read it, for example "Medium THC level"')?.trim();
		if (!title) return null;
		return addNamedCondition(editor.rules, title, compute);
	};
	const picker = select(options, current, choice => {
		if (choice === '__custom') return;
		if (choice === '__new') {
			const result = create(true);
			if (!result) { picker.value = current; return; }
			apply(result.name, result.rules);
			return;
		}
		apply(choice === '' ? undefined : choice);
	}, { 'aria-label': label });

	/* The chosen named condition, editable here; it changes everywhere it is used. */
	let detail = null;
	if (typeof value === 'string' && value !== '__when' && !missing) {
		const definition = editor.rules.fields.variables[value];
		const commitCompute = next => {
			const rules = clone(editor.rules);
			rules.fields.variables[value].compute = serializeCondition(next);
			editor.commit({ rules });
		};
		detail = h('details', { part: 'when' },
			h('summary', {}, `Edit "${definition.title ?? value}"`),
			h('p', {}, h('small', {}, 'A named condition: changing it here changes it in every rule and text that uses it.')),
			groupEditor(editor, parseCondition(definition.compute), commitCompute));
	} else if (custom) {
		detail = h('div', { part: 'when' },
			rawEditor(editor, value, logic => apply(logic), 'Condition'),
			button('Save as named condition…', () => {
				const result = create(value);
				if (result) apply(result.name, result.rules);
			}));
	}
	return h('div', { part: 'when-picker' }, h('label', {}, h('span', {}, label), picker), detail);
}

/**
 * "Show this field / step / panel": Always, a named condition, or "When…": rows of field, test and value, written as
 * the content models' visibleWhen (the grammar a CMS's own fields use). A row that says what visibleWhen cannot (a
 * variable, a context value, one field against another) turns the condition into JSON Logic, "A condition of its
 * own", which Save as named condition… can name. apply({ showWhen, visibleWhen }, rules?) writes both keys; an
 * undefined one is removed.
 */
export function showPicker(editor, { showWhen, visibleWhen }, { label, apply }) {
	const objectWhen = visibleWhen !== undefined && typeof visibleWhen !== 'string';
	const tree = objectWhen ? toTree(visibleWhen) : null;
	/* A name in visibleWhen is the same named condition as in showWhen. */
	const named = typeof visibleWhen === 'string' && showWhen === undefined ? visibleWhen : showWhen;
	const firstField = editor.form.fields.structure?.layout?.flatMap(entry => entry.fields ?? []).find(id => editor.form.fields.properties[id]?.type !== 'content');
	const start = () => {
		/* A condition of its own that the rows can say moves over as it is. */
		const fromLogic = showWhen && typeof showWhen === 'object' ? fromTree(parseCondition(showWhen)) : null;
		return fromLogic ?? (firstField ? { field: firstField, empty: false } : undefined);
	};
	const picker = whenPicker(editor, objectWhen ? '__when' : named, {
		label, always: true, when: true,
		apply: (value, nextRules) => {
			if (value === '__when') {
				const next = start();
				return next === undefined ? undefined : apply({ visibleWhen: next, showWhen: undefined }, nextRules);
			}
			apply({ showWhen: value, visibleWhen: undefined }, nextRules);
		}
	});
	if (!objectWhen) return picker;
	const commit = next => {
		const written = fromTree(next);
		if (written === undefined) apply({ showWhen: undefined, visibleWhen: undefined });
		else if (written === null) apply({ showWhen: serializeCondition(next), visibleWhen: undefined });
		else apply({ visibleWhen: written, showWhen: undefined });
	};
	const detail = tree
		? h('div', { part: 'when' },
			h('p', {}, h('small', {}, 'Written as visibleWhen, the same condition a CMS field uses. Comparing with another field, a variable or a context value makes it a condition of its own.')),
			groupEditor(editor, tree, commit),
			button('Save as named condition…', () => {
				const title = prompt('Name the condition, as editors will read it, for example "Medium THC level"')?.trim();
				if (!title) return;
				const result = addNamedCondition(editor.rules, title, serializeCondition(tree));
				apply({ showWhen: result.name, visibleWhen: undefined }, result.rules);
			}))
		: h('div', { part: 'when' }, rawEditor(editor, visibleWhen, value => apply({ visibleWhen: value, showWhen: undefined }), 'visibleWhen'));
	picker.append(detail);
	return picker;
}

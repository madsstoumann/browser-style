/**
 * "When …" written on the form: a field's or step's showWhen and a text block's cases.
 * The picker offers the rule set's named conditions by title, so the form (which is translated)
 * stores only a name. A new condition becomes a named condition at once.
 */
import { h, button, select } from './dom.js';
import { addNamedCondition, clone, isNamedCondition } from './model.js';
import { parseCondition, serializeCondition } from './conditions.js';
import { groupEditor, rawEditor } from './view-rules.js';

export const namedConditions = rules => Object.entries(rules.fields.variables ?? {}).filter(([, definition]) => isNamedCondition(definition));

/* apply(value, rules?): value is a name, JSON Logic, or undefined for "Always"; rules is passed when a named condition was added. */
export function whenPicker(editor, value, { label, always = false, apply }) {
	const named = namedConditions(editor.rules);
	const custom = value !== undefined && typeof value !== 'string';
	const missing = typeof value === 'string' && !named.some(([name]) => name === value);
	const options = [
		always ? ['', 'Always'] : ['', 'Choose a condition…'],
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
	if (typeof value === 'string' && !missing) {
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

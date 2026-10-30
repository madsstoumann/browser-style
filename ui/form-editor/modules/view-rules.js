/**
 * The rule designer: rules as sentences, a When / Then / Otherwise builder made of pickers,
 * and the services rules can fetch from.
 */
import { h, field, check, select, button } from './dom.js';
import { addNamedCondition, clone, copyRule, fieldsOfRule, isNamedCondition, moveItem, nameCondition, newRule, pasteRule, slugify, stepsOf, usesOfVariable } from './model.js';
import { COMPARE, OPERATOR_WORDS, TEXT_OPS, parseCondition, serializeCondition, summarize } from './conditions.js';
import { ROW_ACTIONS, actionName } from '../../form-rules/modules/actions.js';

const FIELD_VERBS = [['invalid', 'Mark as invalid'], ['show', 'Show'], ['hide', 'Hide'], ['enable', 'Enable'], ['disable', 'Disable'], ['require', 'Require'], ['optional', 'Make optional'], ['clear', 'Clear'], ['setValue', 'Set value of'], ['only', 'Offer only, in'], ['exclude', 'Remove options from']];
const STEP_VERBS = [['skip', 'Skip step'], ['include', 'Include step'], ['goto', 'Go to step']];
const OTHER_VERBS = [['add', 'Add to variable'], ['set', 'Set variable'], ['fetch', 'Fetch from service'], ['emit', 'Send event']];

const itemsOf = (form, list) => form.fields.properties[list]?.items?.properties ?? {};
const propertyOf = (form, path, rules, list) => {
	if (path?.startsWith('values.')) return form.fields.properties[path.slice(7)];
	if (list && path?.startsWith('row.')) return itemsOf(form, list)[path.slice(4)];
	if (list && path === 'index') return { type: 'integer' };
	if (path?.startsWith('vars.')) return { type: rules?.fields.variables?.[path.slice(5)]?.type ?? 'number' };
	return null;
};
const choicesOf = property => property?.options?.choices ?? [];

/* Operators that make sense for a field, as [op, words]. */
function operatorsFor(property) {
	if (property?.type === 'list') return ['filled', 'empty'].map(op => [op, OPERATOR_WORDS[op]]);
	const ops = ['===', '!=='];
	const choices = choicesOf(property);
	const numericChoices = choices.length && choices.every(c => typeof c.value === 'number');
	if (property?.type !== 'boolean' && (!choices.length || numericChoices)) ops.push('>', '>=', '<', '<=');
	if (property?.type !== 'boolean') ops.push('in', 'notin');
	if (property?.type === 'string' && !choices.length) ops.push(...TEXT_OPS);
	ops.push('filled', 'empty');
	return ops.map(op => [op, OPERATOR_WORDS[op]]);
}

/* A value picker that fits the field: its choices, a number, yes/no or text. */
function valueEditor(property, value, onchange, { many = false, label = 'Value', numeric = false } = {}) {
	const choices = choicesOf(property);
	if (choices.length && many) {
		const chosen = Array.isArray(value) ? value : [];
		return h('fieldset', { part: 'choices-inline' }, h('legend', {}, label),
			choices.map(choice => check(choice.label, chosen.includes(choice.value), on => {
				onchange(on ? [...chosen, choice.value] : chosen.filter(v => v !== choice.value));
			})));
	}
	if (choices.length) {
		return select([['', '…'], ...choices.map(c => [String(c.value), c.label])], value === null || value === undefined ? '' : String(value),
			text => onchange(choices.find(c => String(c.value) === text)?.value ?? null), { 'aria-label': label });
	}
	if (property?.type === 'boolean') {
		return select([['true', 'yes'], ['false', 'no']], String(value === true), text => onchange(text === 'true'), { 'aria-label': label });
	}
	if (many) {
		return h('input', { value: (Array.isArray(value) ? value : []).join(', '), 'aria-label': `${label}, comma-separated`, onchange: e => onchange(e.target.value.split(',').map(v => v.trim()).filter(Boolean)) });
	}
	if (numeric || property?.type === 'number' || property?.type === 'integer') {
		return h('input', { type: 'number', value: value ?? '', 'aria-label': label, onchange: e => onchange(e.target.value === '' ? null : Number(e.target.value)) });
	}
	return h('input', { value: value ?? '', 'aria-label': label, onchange: e => onchange(e.target.value) });
}

/* === Conditions === */

function conditionRow(editor, node, onchange, onremove, list) {
	const { form } = editor;
	const property = propertyOf(form, node.path, editor.rules, list);
	const variables = Object.entries(editor.rules.fields.variables ?? {}).map(([name, v]) => [`vars.${name}`, `${v.title ?? name} (${isNamedCondition(v) ? 'named condition' : 'variable'})`]);
	/* A row rule reads the cells of the current row first. */
	const rowFields = list ? [...Object.entries(itemsOf(form, list)).map(([key, item]) => [`row.${key}`, `${item.title ?? key} (this row)`]), ['index', 'Row number (from 0)']] : [];
	const fields = [...rowFields, ...stepsOf(form).flatMap(step => step.fields.filter(id => form.fields.properties[id]?.type !== 'content').map(id => [`values.${id}`, `${form.fields.properties[id]?.title ?? id} (${step.name})`])), ...variables];
	const known = fields.some(([path]) => path === node.path);
	const fieldOptions = [...fields, ['other', 'Context, fact or service…']];
	const ops = operatorsFor(property);
	const many = node.op === 'in' || node.op === 'notin';
	const text = TEXT_OPS.includes(node.op);
	const needsValue = node.op !== 'filled' && node.op !== 'empty';
	/* Comparisons can take another field instead of a value. */
	const comparable = COMPARE.includes(node.op);
	const others = fields.filter(([path]) => path !== node.path);
	/* A string field compared as a number needs num(); choice and number fields do not. */
	const withNum = (next, prop = propertyOf(form, next.path, editor.rules, list)) => ({ ...next, num: COMPARE.slice(2).includes(next.op) && (prop?.type === 'string' || !prop) });

	return h('li', { part: 'condition' },
		select(fieldOptions, known ? node.path : 'other', value => {
			if (value === 'other') onchange({ ...node, path: 'context.', value: null });
			else onchange(withNum({ ...node, path: value, value: propertyOf(form, value, editor.rules, list)?.type === 'boolean' ? true : null, op: '===' }));
		}, { 'aria-label': 'Field' }),
		known ? null : h('input', { value: node.path, 'aria-label': 'Path, for example context.channel or facts.pricing.region', onchange: e => onchange(withNum({ ...node, path: e.target.value.trim() })) }),
		select(ops, node.op, op => {
			const switching = (op === 'in' || op === 'notin') !== many || TEXT_OPS.includes(op) !== text;
			const value = switching ? (op === 'in' || op === 'notin' ? [] : TEXT_OPS.includes(op) ? '' : null) : node.value;
			onchange(withNum({ ...node, op, value, other: COMPARE.includes(op) ? node.other : undefined, matchCase: TEXT_OPS.includes(op) ? node.matchCase : undefined }, property));
		}, { 'aria-label': 'Operator' }),
		comparable ? select([['value', 'a value'], ['field', 'the field']], node.other ? 'field' : 'value', mode => {
			onchange({ ...node, other: mode === 'field' ? others[0]?.[0] : undefined, value: null });
		}, { 'aria-label': 'Compare with' }) : null,
		comparable && node.other
			? select(others, node.other, other => onchange({ ...node, other }), { 'aria-label': 'Other field' })
			: text
				? [h('input', { value: node.value ?? '', 'aria-label': 'Text', onchange: e => onchange({ ...node, value: e.target.value }) }), check('match case', node.matchCase === true, on => onchange({ ...node, matchCase: on || undefined }))]
				: needsValue ? valueEditor(property, node.value, value => onchange({ ...node, value }), { many, numeric: node.num }) : null,
		button('Remove', onremove, { 'aria-label': 'Remove condition' })
	);
}

export function groupEditor(editor, node, onchange, depth = 0, onremove = null, list) {
	const setItem = (index, item) => onchange({ ...node, items: node.items.map((current, i) => (i === index ? item : current)) });
	const removeItem = index => onchange({ ...node, items: node.items.filter((_, i) => i !== index) });
	const firstField = stepsOf(editor.form).flatMap(step => step.fields)[0];
	const firstItem = list ? Object.keys(itemsOf(editor.form, list))[0] : null;
	const firstPath = firstItem ? `row.${firstItem}` : firstField ? `values.${firstField}` : 'context.';

	return h('div', { part: depth ? 'group nested' : 'group' },
		h('div', { part: 'row' },
			select([['and', 'All of these are true'], ['or', 'Any of these is true']], node.mode, mode => onchange({ ...node, mode }), { 'aria-label': 'Match' }),
			onremove ? button('Remove group', onremove) : null
		),
		node.items.length ? null : h('p', {}, h('small', {}, 'No conditions: the rule always applies.')),
		h('ul', {}, node.items.map((item, index) => {
			if (item.kind === 'group') return h('li', {}, groupEditor(editor, item, next => setItem(index, next), depth + 1, () => removeItem(index), list));
			if (item.kind === 'raw') return h('li', { part: 'condition' }, rawEditor(editor, item.logic, logic => setItem(index, { kind: 'raw', logic }), 'Custom condition'), button('Remove', () => removeItem(index)));
			return conditionRow(editor, item, next => setItem(index, next), () => removeItem(index), list);
		})),
		h('div', { part: 'row' },
			button('+ Condition', () => onchange({ ...node, items: [...node.items, { kind: 'cond', path: firstPath, num: false, op: 'filled', value: null }] })),
			depth < 2 ? button('+ Group', () => onchange({ ...node, items: [...node.items, { kind: 'group', mode: 'or', items: [] }] })) : null
		)
	);
}

/* JSON the builder cannot draw: read-only unless Advanced is on. */
export function rawEditor(editor, value, onchange, label) {
	return field(label, h('textarea', {
		rows: 4, readOnly: !editor.advanced, value: JSON.stringify(value, null, 1),
		onchange: e => {
			try {
				onchange(JSON.parse(e.target.value));
				e.target.setCustomValidity('');
			} catch (error) {
				e.target.setCustomValidity(error.message);
				e.target.reportValidity();
			}
		}
	}), editor.advanced ? 'JSON Logic' : 'Turn on Advanced to edit');
}

/* === Actions === */

function toRow(action) {
	const name = actionName(action);
	const value = action[name];
	if (name === 'options') return value.only ? { verb: 'only', target: value.field, values: value.only } : { verb: 'exclude', target: value.field, values: value.exclude ?? [] };
	if (name === 'setValue') return { verb: 'setValue', target: value.field, value: value.value };
	if (name === 'fetch') return { verb: 'fetch', service: value.service, into: value.into, after: value.after, wait: value.wait };
	if (name === 'add' || name === 'set') return { verb: name, variable: value.var, value: value.value };
	if (name === 'invalid') return { verb: 'invalid', target: value.field, message: value.message, code: value.code, level: value.level };
	if (name === 'goto') return typeof value === 'string' ? { verb: 'goto', target: value } : { verb: 'goto', target: value.step, from: value.from };
	if (name === 'emit') return { verb: 'emit', type: value.type, data: value.data, on: value.on, where: value.where };
	if (name) return { verb: name, target: Array.isArray(value) ? value[0] : value, rest: Array.isArray(value) ? value.slice(1) : [] };
	return { verb: 'raw', action };
}

function fromRow(row) {
	switch (row.verb) {
		case 'only': return { options: { field: row.target, only: row.values ?? [] } };
		case 'exclude': return { options: { field: row.target, exclude: row.values ?? [] } };
		case 'setValue': return { setValue: { field: row.target, value: row.value ?? null } };
		case 'fetch': return { fetch: { service: row.service ?? '', ...(row.after ? { after: row.after } : row.into ? { into: row.into } : {}), ...(row.wait ? { wait: true } : {}) } };
		case 'add': case 'set': return { [row.verb]: { var: row.variable ?? '', value: row.value ?? (row.verb === 'add' ? 0 : null) } };
		case 'invalid': return { invalid: { field: row.target, message: row.message ?? '', ...(row.code ? { code: row.code } : {}), ...(row.level === 'warning' ? { level: 'warning' } : {}) } };
		case 'goto': return { goto: row.from ? { step: row.target, from: row.from } : row.target };
		case 'emit': {
			const emit = { type: row.type ?? '' };
			if (row.data !== undefined) emit.data = row.data;
			if (row.on) emit.on = row.on;
			if (row.where) emit.where = row.where;
			return { emit };
		}
		case 'raw': return row.action;
		default: return { [row.verb]: row.rest?.length ? [row.target, ...row.rest] : row.target };
	}
}

function actionRow(editor, action, onchange, onremove, list) {
	const { form, rules } = editor;
	const row = toRow(action);
	if (row.verb === 'raw') return h('li', { part: 'action' }, rawEditor(editor, action, onchange, 'Custom action'), button('Remove', onremove));
	const set = patch => onchange(fromRow({ ...row, ...patch }));
	/* A row rule acts on the cells of its row (list.item), with a shorter list of verbs. */
	const fieldList = list
		? Object.entries(itemsOf(form, list)).map(([key, item]) => [`${list}.${key}`, item.title ?? key])
		: stepsOf(form).flatMap(step => step.fields.map(id => [id, form.fields.properties[id]?.title ?? id]));
	const choiceFields = fieldList.filter(([id]) => choicesOf(form.fields.properties[id]).length);
	const isField = FIELD_VERBS.some(([verb]) => verb === row.verb);
	const isStep = STEP_VERBS.some(([verb]) => verb === row.verb);
	const services = Object.keys(rules.fields.services ?? {});
	const slots = stepsOf(form).flatMap(step => step.slots ?? []);
	const variables = Object.keys(rules.fields.variables ?? {});

	const verbs = list ? FIELD_VERBS.filter(([verb]) => ROW_ACTIONS.has(verb)) : [...FIELD_VERBS, ...STEP_VERBS, ...OTHER_VERBS];
	const verbSelect = select(verbs, row.verb, verb => {
		const firstField = (verb === 'only' || verb === 'exclude' ? choiceFields : fieldList)[0]?.[0] ?? '';
		if (FIELD_VERBS.some(([v]) => v === verb)) set({ verb, target: isField && row.target ? row.target : firstField, values: [], value: null, rest: [], message: verb === 'invalid' ? 'Please check this value' : undefined });
		else if (verb === 'add' || verb === 'set') set({ verb, variable: variables[0] ?? '', value: verb === 'add' ? 1 : null });
		else if (STEP_VERBS.some(([v]) => v === verb)) set({ verb, target: stepsOf(form)[0]?.id ?? '', rest: [] });
		else if (verb === 'fetch') set({ verb, service: services[0] ?? '', into: slots[0] ?? '' });
		else set({ verb, type: 'form.event' });
	}, { 'aria-label': 'Action' });

	let detail = [];
	if (isField) {
		const targets = row.verb === 'only' || row.verb === 'exclude' ? choiceFields : fieldList;
		detail.push(select(targets, row.target, target => set({ target, values: [], value: null }), { 'aria-label': 'Field' }));
		const property = list ? itemsOf(form, list)[String(row.target).slice(list.length + 1)] : form.fields.properties[row.target];
		if (row.verb === 'setValue') detail.push(h('span', {}, 'to'), valueEditor(property, row.value, value => set({ value })));
		if (row.verb === 'invalid') {
			detail.push(h('input', { value: row.message ?? '', 'aria-label': 'Message', placeholder: 'Message', onchange: e => set({ message: e.target.value }) }),
				select([['', 'blocks'], ['warning', 'only warns']], row.level === 'warning' ? 'warning' : '', level => set({ level: level || undefined }), { 'aria-label': 'Severity' }));
		}
		if (row.verb === 'only' || row.verb === 'exclude') detail.push(valueEditor(property, row.values, values => set({ values }), { many: true, label: 'Options' }));
	} else if (isStep) {
		const stepOptions = stepsOf(form).map(step => [step.id, step.name]);
		detail.push(select(stepOptions, row.target, target => set({ target }), { 'aria-label': 'Step' }));
		if (row.verb === 'goto') {
			detail.push(h('span', {}, 'when leaving'), select([['', 'the step it reads'], ...stepOptions], row.from ?? '', from => set({ from: from || undefined }), { 'aria-label': 'Jump from step' }));
		}
	} else if (row.verb === 'fetch') {
		const mode = row.after ? 'after' : 'into';
		const stepOptions = stepsOf(form).map(step => [step.id, step.name]);
		detail.push(select(services.length ? services : [['', 'Add a service below']], row.service, service => set({ service }), { 'aria-label': 'Service' }),
			select([['into', 'fields into slot'], ['after', 'steps after']], mode, next => set(next === 'after' ? { after: stepOptions[0]?.[0] ?? '', into: undefined } : { after: undefined, into: slots[0] ?? '' }), { 'aria-label': 'What the reply may add' }),
			mode === 'after'
				? select(stepOptions, row.after, after => set({ after }), { 'aria-label': 'Insert after step' })
				: select(slots.length ? slots : [['', 'Add a slot to a step']], row.into, into => set({ into }), { 'aria-label': 'Slot' }),
			check('wait for it', row.wait === true, wait => set({ wait })));
	} else if (row.verb === 'add' || row.verb === 'set') {
		const definition = rules.fields.variables?.[row.variable];
		const literal = row.value === null || typeof row.value !== 'object';
		detail.push(select(variables.length ? variables : [['', 'Add a variable below']], row.variable, variable => set({ variable }), { 'aria-label': 'Variable' }),
			h('span', {}, row.verb === 'add' ? 'by' : 'to'),
			literal
				? valueEditor({ type: row.verb === 'add' ? 'number' : definition?.type }, row.value, value => set({ value }))
				: rawEditor(editor, row.value, value => set({ value }), 'Calculated value'));
	} else if (row.verb === 'emit') {
		detail.push(h('input', { value: row.type ?? '', 'aria-label': 'Event type, for example quote.segment', onchange: e => set({ type: e.target.value.trim() }) }),
			select([['', 'when it starts to apply'], ['leave', 'when it stops applying']], row.on ?? '', on => set({ on: on || undefined }), { 'aria-label': 'When' }));
	}
	return h('li', { part: 'action' }, verbSelect, detail, button('Remove', onremove, { 'aria-label': 'Remove action' }));
}

const firstTarget = (form, list) => (list ? `${list}.${Object.keys(itemsOf(form, list))[0] ?? ''}` : stepsOf(form).flatMap(step => step.fields)[0] ?? '');

function actionList(editor, actions, onchange, list) {
	const firstField = firstTarget(editor.form, list);
	return h('div', {},
		h('ul', {}, actions.map((action, index) => actionRow(editor, action,
			next => onchange(actions.map((a, i) => (i === index ? next : a))),
			() => onchange(actions.filter((_, i) => i !== index)), list))),
		button('+ Action', () => onchange([...actions, { show: firstField }]))
	);
}

/* === The view === */

export function renderRulesView(editor) {
	const { form, rules, selection } = editor;
	const list = rules.fields.rules ?? [];
	const commitRules = fn => {
		const next = clone(rules);
		fn(next.fields);
		editor.commit({ rules: next });
	};
	const updateRule = (id, fn) => commitRules(f => { fn(f.rules.find(rule => rule.id === id)); });
	const copied = editor.clipboard?.kind === 'form-editor/rule' ? editor.clipboard : null;

	/* Filtering hides rows in place, so typing never re-renders the list. */
	const items = list.map((rule, index) => {
		const open = selection.rule === rule.id;
		const summary = summarize(form, rule, rules);
		const item = h('li', { part: open ? 'rule open' : 'rule' },
			button(h('span', {}, h('strong', {}, rule.title ?? rule.id), h('br'), h('small', {}, summary), rule.note ? [h('br'), h('small', { part: 'note' }, `Note: ${rule.note}`)] : null),
				() => editor.select({ view: 'rules', rule: open ? null : rule.id }), { part: 'rule-summary', 'aria-expanded': String(open) }),
			open ? ruleEditor(editor, rule, index, list.length, updateRule, commitRules) : null
		);
		return { item, rule, open, text: [rule.id, rule.title, rule.note, summary].join(' ').toLowerCase(), fields: fieldsOfRule(rule) };
	});
	const count = h('small', { 'aria-live': 'polite' });
	const filter = () => {
		const words = (selection.ruleQuery ?? '').toLowerCase().split(/\s+/).filter(Boolean);
		let shown = 0;
		items.forEach(({ item, open, text, fields, rule }) => {
			const usesField = !selection.ruleField || fields.includes(selection.ruleField) || JSON.stringify(rule).includes(`"values.${selection.ruleField}`);
			item.hidden = !open && !(usesField && words.every(word => text.includes(word)));
			if (!item.hidden) shown++;
		});
		count.textContent = shown === items.length ? '' : `${shown} of ${items.length} rules`;
	};
	const fieldOptions = stepsOf(form).flatMap(step => step.fields).filter(id => form.fields.properties[id]?.type !== 'content').map(id => [id, form.fields.properties[id]?.title ?? id]);
	const filters = list.length > 3 || selection.ruleQuery || selection.ruleField ? h('div', { part: 'row filter' },
		h('input', { type: 'search', value: selection.ruleQuery ?? '', placeholder: 'Find a rule', 'aria-label': 'Find a rule by title, note or wording', oninput: e => { selection.ruleQuery = e.target.value; filter(); } }),
		select([['', 'Any field'], ...fieldOptions], selection.ruleField ?? '', value => { selection.ruleField = value || undefined; filter(); }, { 'aria-label': 'Only rules that use this field' }),
		count) : null;
	filter();

	return h('section', { part: 'inspector' },
		h('h2', {}, 'Rules'),
		filters,
		h('ol', { part: 'rules' }, items.map(({ item }) => item)),
		h('div', { part: 'row' },
			button('+ Rule', () => {
				const result = newRule(rules, `Rule ${list.length + 1}`);
				editor.commit({ rules: result.rules });
				editor.select({ view: 'rules', rule: result.id });
			}, { part: 'add' }),
			copied ? button(`Paste rule “${copied.rule.title ?? copied.rule.id}”`, () => {
				const result = pasteRule(form, rules, copied);
				editor.commit({ rules: result.rules });
				editor.select({ view: 'rules', rule: result.id });
				if (result.missing.length) editor.notify(`Pasted. This form has no field ${result.missing.join(', ')}: pick other fields in the rule.`);
			}, { part: 'add' }) : null),
		namedConditionsEditor(editor, commitRules),
		variablesEditor(editor, commitRules),
		servicesEditor(editor, commitRules),
		editor.advanced ? rawEditor(editor, rules.fields.listen ?? [], listen => commitRules(f => { f.listen = listen; }), 'Events this rule set listens for') : null
	);
}

function ruleEditor(editor, rule, index, count, updateRule, commitRules) {
	const tree = parseCondition(rule.when);
	const list = rule.forEach;
	const lists = stepsOf(editor.form).flatMap(step => step.fields).filter(id => editor.form.fields.properties[id]?.type === 'list');
	return h('div', { part: 'rule-editor' },
		h('div', { part: 'row' },
			field('Title', h('input', { value: rule.title ?? '', onchange: e => updateRule(rule.id, r => { r.title = e.target.value; }) })),
			editor.advanced ? field('Priority', h('input', { type: 'number', value: rule.priority ?? 0, onchange: e => updateRule(rule.id, r => { r.priority = Number(e.target.value) || 0; if (!r.priority) delete r.priority; }) }), 'Higher wins') : null
		),
		editor.advanced ? field('Rule id', h('input', {
			value: rule.id,
			onchange: e => {
				const id = slugify(e.target.value);
				if ((editor.rules.fields.rules ?? []).some(r => r.id === id)) { e.target.value = rule.id; return; }
				updateRule(rule.id, r => { r.id = id; });
				editor.select({ rule: id });
			}
		})) : null,
		lists.length || list ? field('Runs', select([['', 'Once for the form'], ...lists.map(id => [id, `For each row of ${editor.form.fields.properties[id]?.title ?? id}`])], list ?? '', next => {
			const used = rule.when !== true && rule.when !== undefined || (rule.then ?? []).length || rule.else;
			if (used && !confirm('Changing this clears the rule\'s conditions and actions, since they read and change other fields. Continue?')) { editor.select({}); return; }
			updateRule(rule.id, r => {
			if (next) r.forEach = next; else delete r.forEach;
			r.when = true;
			r.then = [{ show: firstTarget(editor.form, next) }];
			delete r.else;
			});
		}), list ? 'Conditions read this row; actions change its cells' : null) : null,
		field('Note', h('textarea', { rows: 2, value: rule.note ?? '', onchange: e => updateRule(rule.id, r => { const note = e.target.value.trim(); if (note) r.note = note; else delete r.note; }) }), 'For editors: why the rule is there. Not shown to people filling in the form'),
		check('Track this rule in analytics', rule.track === true, value => updateRule(rule.id, r => { if (value) r.track = true; else delete r.track; })),
		h('h3', {}, 'When'),
		groupEditor(editor, tree, next => updateRule(rule.id, r => { r.when = serializeCondition(next); }), 0, null, list),
		!list && tree.items.length && !(tree.items.length === 1 && isNamedCondition(editor.rules.fields.variables?.[tree.items[0].path?.slice(5)])) ? button('Save as named condition…', () => {
			const title = prompt('Name the condition, for example "Is senior customer"', rule.title ?? '')?.trim();
			if (!title) return;
			editor.commit({ rules: nameCondition(editor.rules, rule.id, title).rules });
		}) : null,
		h('h3', {}, 'Then'),
		actionList(editor, rule.then ?? [], then => updateRule(rule.id, r => { r.then = then; }), list),
		rule.else ? [h('h3', {}, 'Otherwise'), actionList(editor, rule.else, otherwise => updateRule(rule.id, r => { if (otherwise.length) r.else = otherwise; else delete r.else; }), list)]
			: button('+ Otherwise', () => updateRule(rule.id, r => { r.else = [{ show: firstTarget(editor.form, list) }]; })),
		h('div', { part: 'row' },
			button('Move up', () => commitRules(f => { f.rules = moveItem(f.rules, index, -1); }), { disabled: index === 0 }),
			button('Move down', () => commitRules(f => { f.rules = moveItem(f.rules, index, 1); }), { disabled: index === count - 1 }),
			button('Copy rule', () => {
				editor.clipboard = copyRule(editor.rules, rule.id);
				editor.notify(`Copied "${rule.title ?? rule.id}". Open another form's Rules and choose Paste rule.`);
			}),
			button('Delete rule', () => {
				if (!confirm(`Delete the rule "${rule.title ?? rule.id}"?`)) return;
				commitRules(f => { f.rules = f.rules.filter(r => r.id !== rule.id); });
				editor.select({ rule: null });
			}, { part: 'danger' })
		)
	);
}

/* Named conditions: yes/no variables computed from a condition, built with the same pickers as a rule. */
function namedConditionsEditor(editor, commitRules) {
	const named = Object.entries(editor.rules.fields.variables ?? {}).filter(([, definition]) => isNamedCondition(definition));
	return h('details', { part: 'services', open: named.length > 0 },
		h('summary', {}, `Named conditions (${named.length})`),
		h('p', {}, h('small', {}, 'A condition with a name, such as "Is senior customer". Rules pick it like a field; change it here and every rule that uses it follows.')),
		named.map(([name, definition]) => h('fieldset', { part: 'service' },
			h('legend', {}, definition.title ?? name),
			field('Name', h('input', { value: definition.title ?? '', onchange: e => commitRules(f => { f.variables[name].title = e.target.value; }) }), editor.advanced ? `vars.${name}` : null),
			groupEditor(editor, parseCondition(definition.compute), next => commitRules(f => { f.variables[name].compute = serializeCondition(next); })),
			button('Delete named condition', () => {
				const uses = usesOfVariable(editor.rules, name, editor.form);
				if (!confirm(uses.length ? `"${definition.title ?? name}" is used by ${uses.join(', ')}. Delete it anyway?` : `Delete "${definition.title ?? name}"?`)) return;
				commitRules(f => { delete f.variables[name]; });
			}, { part: 'danger' })
		)),
		h('form', {
			part: 'row',
			onsubmit: event => {
				event.preventDefault();
				const title = String(new FormData(event.target).get('title')).trim();
				if (title) editor.commit({ rules: addNamedCondition(editor.rules, title).rules });
			}
		},
		field('New named condition', h('input', { name: 'title', required: true, placeholder: 'Is senior customer' })),
		h('button', { type: 'submit' }, 'Add'))
	);
}

function variablesEditor(editor, commitRules) {
	const variables = Object.fromEntries(Object.entries(editor.rules.fields.variables ?? {}).filter(([, definition]) => !isNamedCondition(definition)));
	const count = Object.keys(variables).length;
	return h('details', { part: 'services', open: count > 0 },
		h('summary', {}, `Variables (${count})`),
		h('p', {}, h('small', {}, 'Rules read a variable as vars.name. Give it a start value for rules to add to or set, or a calculation (Advanced).')),
		Object.entries(variables).map(([name, definition]) => h('fieldset', { part: 'service' },
			h('legend', {}, name),
			field('Title', h('input', { value: definition.title ?? '', onchange: e => commitRules(f => { f.variables[name].title = e.target.value; }) })),
			'compute' in definition
				? rawEditor(editor, definition.compute, compute => commitRules(f => { f.variables[name].compute = compute; }), 'Calculated from')
				: field('Start value', valueEditor({ type: definition.type }, definition.initial ?? null, initial => commitRules(f => { f.variables[name].initial = initial; }))),
			button('Delete variable', () => commitRules(f => { delete f.variables[name]; }), { part: 'danger' })
		)),
		h('form', {
			part: 'row',
			onsubmit: event => {
				event.preventDefault();
				const data = new FormData(event.target);
				const name = String(data.get('name')).trim().replace(/[^A-Za-z0-9_]/g, '');
				if (!name || variables[name]) return;
				const type = data.get('type');
				commitRules(f => { f.variables = { ...(f.variables ?? {}), [name]: { type, initial: type === 'number' ? 0 : type === 'boolean' ? false : '' } }; });
			}
		},
		field('New variable', h('input', { name: 'name', required: true, pattern: '[A-Za-z_][A-Za-z0-9_]*' })),
		field('Type', select([['number', 'Number'], ['string', 'Text'], ['boolean', 'Yes / no']], 'number', () => {}, { name: 'type' })),
		h('button', { type: 'submit' }, '+ Variable'))
	);
}

function servicesEditor(editor, commitRules) {
	const { form, rules } = editor;
	const services = rules.fields.services ?? {};
	const fieldIds = stepsOf(form).flatMap(step => step.fields);
	return h('details', { part: 'services', open: Object.keys(services).length > 0 },
		h('summary', {}, `Services (${Object.keys(services).length})`),
		h('p', {}, h('small', {}, 'A rule can fetch extra fields and rules from a service, and a choice or type-ahead field can take its list from one. The preview uses the sample reply, or calls the URL when there is none. Samples are not exported.')),
		Object.entries(services).map(([name, service]) => h('fieldset', { part: 'service' },
			h('legend', {}, name),
			field('URL', h('input', { type: 'url', value: service.url ?? '', onchange: e => commitRules(f => { f.services[name].url = e.target.value; }) })),
			h('fieldset', { part: 'choices-inline' }, h('legend', {}, 'Sends'),
				fieldIds.map(id => check(form.fields.properties[id]?.title ?? id, (service.send ?? []).includes(id), on => commitRules(f => {
					const send = new Set(f.services[name].send ?? []);
					if (on) send.add(id); else send.delete(id);
					f.services[name].send = fieldIds.filter(fid => send.has(fid));
				})))),
			field('Method', select([['POST', 'POST (values as JSON)'], ['GET', 'GET (values as query; a static file works)']], service.method ?? 'POST',
				method => commitRules(f => { if (method === 'GET') f.services[name].method = 'GET'; else delete f.services[name].method; }))),
			field('Timeout (ms)', h('input', { type: 'number', min: 0, value: service.timeoutMs ?? '', onchange: e => commitRules(f => { if (e.target.value) f.services[name].timeoutMs = Number(e.target.value); else delete f.services[name].timeoutMs; }) })),
			field('Sample reply (a patch)', h('textarea', {
				rows: 5, value: editor.samples[name] ?? '',
				onchange: e => {
					try {
						if (e.target.value.trim()) JSON.parse(e.target.value);
						e.target.setCustomValidity('');
						editor.setSample(name, e.target.value);
					} catch (error) {
						e.target.setCustomValidity(error.message);
						e.target.reportValidity();
					}
				}
			})),
			button('Delete service', () => commitRules(f => { delete f.services[name]; }), { part: 'danger' })
		)),
		h('form', {
			part: 'row',
			onsubmit: event => {
				event.preventDefault();
				const name = slugify(new FormData(event.target).get('name'));
				if (!name || services[name]) return;
				commitRules(f => { f.services = { ...(f.services ?? {}), [name]: { url: 'https://', send: [] } }; });
			}
		}, field('New service name', h('input', { name: 'name', required: true })), h('button', { type: 'submit' }, '+ Service'))
	);
}

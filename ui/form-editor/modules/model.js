/**
 * Pure helpers for editing a form definition and a rule set as UCF documents.
 * No DOM: everything here runs in Node too (see test/model.test.js).
 */
import { isRule } from '../../form-rules/modules/logic.js';
import { renameTargets } from '../../form-rules/modules/actions.js';

export const clone = value => structuredClone(value);

export function slugify(text, taken = []) {
	const base = String(text ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
		.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
	let slug = base;
	for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
	return slug;
}

/* A field id is camelCase, like the UCM models. */
export function fieldId(text, taken = []) {
	const words = slugify(text).split('-');
	const base = words[0] + words.slice(1).map(word => word[0].toUpperCase() + word.slice(1)).join('');
	let id = /^[a-z]/.test(base) ? base : `field${base}`;
	for (let n = 2; taken.includes(id); n++) id = `${base}${n}`;
	return id;
}

/* Wraps a plain document as UCF content; returns UCF documents unchanged. */
export function asUcf(doc, model) {
	if (doc?.model && doc.fields) return clone(doc);
	const { id, $schema, ...fields } = doc ?? {};
	return { id: id ?? model, model, meta: { locale: 'en', status: 'draft' }, fields };
}

export function emptyForm(id = 'form-new') {
	return {
		id,
		model: 'form-definition',
		meta: { locale: 'en', status: 'draft' },
		fields: {
			title: 'New form',
			structure: { layout: [{ area: 'main', type: 'step', id: 'step-1', name: 'Step 1', fields: [] }] },
			type: 'object',
			properties: {}
		}
	};
}

export function emptyRules(formId, id = 'rules-new') {
	return { id, model: 'form-rules', meta: { locale: 'en', status: 'draft' }, fields: { form: formId, version: 1, services: {}, listen: [], rules: [] } };
}

export const stepsOf = form => (form.fields.structure?.layout ?? []).filter(entry => entry.type === 'step');
export const fieldIds = form => Object.keys(form.fields.properties ?? {});
export const stepOfField = (form, id) => stepsOf(form).find(step => step.fields.includes(id));

export function addStep(form, name) {
	const next = clone(form);
	const id = slugify(name, stepsOf(next).map(step => step.id));
	next.fields.structure.layout.push({ area: 'main', type: 'step', id, name, fields: [] });
	return { form: next, id };
}

/* `type` is a base type ('string', 'select', …) or a whole property, such as fieldFromType() makes. */
export function addField(form, stepId, title, type = 'string') {
	const next = clone(form);
	const property = typeof type === 'object' ? clone(type) : { type };
	const id = fieldId(title || property.title || property.kind?.split('/').pop() || property.type, fieldIds(next));
	next.fields.properties[id] = { ...property, title: title ?? property.title };
	if (property.type === 'select' && !property.options) next.fields.properties[id].options = { choices: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }] };
	stepsOf(next).find(step => step.id === stepId).fields.push(id);
	return { form: next, id };
}

export function moveItem(list, index, direction) {
	const to = index + direction;
	if (to < 0 || to >= list.length) return list;
	const copy = [...list];
	[copy[index], copy[to]] = [copy[to], copy[index]];
	return copy;
}

/* Rewrites every read of `values.<from>` in a condition. */
function renameReads(logic, from, to) {
	if (Array.isArray(logic)) return logic.map(item => renameReads(item, from, to));
	if (!isRule(logic)) return logic;
	const [op] = Object.keys(logic);
	const args = logic[op];
	if (op === 'var') {
		const rename = path => {
			if (typeof path !== 'string') return path;
			if (path === `values.${from}`) return `values.${to}`;
			if (path.startsWith(`values.${from}.`)) return `values.${to}${path.slice(7 + from.length)}`;
			return path;
		};
		return { var: Array.isArray(args) ? [rename(args[0]), ...args.slice(1)] : rename(args) };
	}
	return { [op]: renameReads(args, from, to) };
}

/* Renames a field in the form and in every rule, service and step that names it. */
export function renameField(form, rules, from, to) {
	if (from === to || !to || form.fields.properties[to]) return { form, rules, renamed: false };
	const nextForm = clone(form);
	const properties = {};
	for (const [key, value] of Object.entries(nextForm.fields.properties)) properties[key === from ? to : key] = value;
	nextForm.fields.properties = properties;
	stepsOf(nextForm).forEach(step => { step.fields = step.fields.map(id => (id === from ? to : id)); });
	if (Array.isArray(nextForm.fields.required)) nextForm.fields.required = nextForm.fields.required.map(id => (id === from ? to : id));

	const nextRules = clone(rules);
	/* A row rule targets list.item, so a renamed list renames the prefix too. */
	const swap = id => (id === from ? to : typeof id === 'string' && id.startsWith(`${from}.`) ? `${to}${id.slice(from.length)}` : id);
	nextRules.fields.rules = (nextRules.fields.rules ?? []).map(rule => ({
		...rule,
		...(rule.forEach === from ? { forEach: to } : {}),
		when: renameReads(rule.when, from, to),
		then: (rule.then ?? []).map(action => renameTargets(action, swap)),
		...(rule.else ? { else: rule.else.map(action => renameTargets(action, swap)) } : {})
	}));
	Object.values(nextRules.fields.services ?? {}).forEach(service => {
		if (Array.isArray(service.send)) service.send = service.send.map(swap);
	});
	return { form: nextForm, rules: nextRules, renamed: true };
}

/* Renames a step id in the form and in skip/include actions. */
export function renameStep(form, rules, from, to) {
	if (from === to || !to || stepsOf(form).some(step => step.id === to)) return { form, rules, renamed: false };
	const nextForm = clone(form);
	stepsOf(nextForm).forEach(step => { if (step.id === from) step.id = to; });
	const nextRules = clone(rules);
	const swap = id => (id === from ? to : id);
	nextRules.fields.rules = (nextRules.fields.rules ?? []).map(rule => ({
		...rule,
		then: (rule.then ?? []).map(action => renameTargets(action, id => id, swap)),
		...(rule.else ? { else: rule.else.map(action => renameTargets(action, id => id, swap)) } : {})
	}));
	return { form: nextForm, rules: nextRules, renamed: true };
}

/* Ids of the rules that read or act on a field: shown before it is deleted. */
export function rulesUsingField(rules, id) {
	return (rules.fields.rules ?? []).filter(rule => {
		const text = JSON.stringify([rule.when, rule.then, rule.else]);
		return rule.forEach === id || text.includes(`"values.${id}"`) || text.includes(`"values.${id}.`) || text.includes(`"${id}"`) || text.includes(`"${id}.`);
	}).map(rule => rule.id);
}

export function removeField(form, id) {
	const next = clone(form);
	delete next.fields.properties[id];
	stepsOf(next).forEach(step => { step.fields = step.fields.filter(field => field !== id); });
	return next;
}

export function removeStep(form, stepId) {
	const next = clone(form);
	const step = stepsOf(next).find(s => s.id === stepId);
	step?.fields.forEach(id => delete next.fields.properties[id]);
	next.fields.structure.layout = next.fields.structure.layout.filter(entry => entry !== step);
	return next;
}

export function newRule(rules, title = 'New rule') {
	const next = clone(rules);
	const id = slugify(title, (next.fields.rules ?? []).map(rule => rule.id));
	next.fields.rules = [...(next.fields.rules ?? []), { id, title, when: { and: [] }, then: [] }];
	return { rules: next, id };
}

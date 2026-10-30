/**
 * Pure helpers for editing a form definition and a rule set as UCF documents.
 * No DOM: everything here runs in Node too (see test/model.test.js).
 */
import { isRule } from '../../form-rules/modules/logic.js';
import { actionName, actionTargets, renameTargets } from '../../form-rules/modules/actions.js';

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
/* Steps and result panels: the layout entries that hold fields. */
export const sectionsOf = form => (form.fields.structure?.layout ?? []).filter(entry => entry.type === 'step' || entry.type === 'panel');
export const panelsOf = form => (form.fields.structure?.layout ?? []).filter(entry => entry.type === 'panel');
export const stepOfField = (form, id) => sectionsOf(form).find(step => step.fields.includes(id));

export function addStep(form, name) {
	const next = clone(form);
	const id = slugify(name, sectionsOf(next).map(step => step.id));
	/* Before the panels, so the layout reads steps first. */
	const at = next.fields.structure.layout.findIndex(entry => entry.type === 'panel');
	next.fields.structure.layout.splice(at < 0 ? next.fields.structure.layout.length : at, 0, { area: 'main', type: 'step', id, name, fields: [] });
	return { form: next, id };
}

/* A result panel: text blocks and calculated values shown beside the form, whichever step is current. */
export function addPanel(form, name = 'Result') {
	const next = clone(form);
	const id = slugify(name, sectionsOf(next).map(step => step.id));
	next.fields.structure.layout.push({ type: 'panel', id, name, place: 'aside', fields: [] });
	return { form: next, id };
}

/* `type` is a base type ('string', 'select', …) or a whole property, such as fieldFromType() makes. */
export function addField(form, stepId, title, type = 'string') {
	const next = clone(form);
	const property = typeof type === 'object' ? clone(type) : { type };
	const id = fieldId(title || property.title || property.kind?.split('/').pop() || property.type, fieldIds(next));
	next.fields.properties[id] = { ...property, title: title ?? property.title };
	if (property.type === 'select' && !property.options) next.fields.properties[id].options = { choices: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }] };
	sectionsOf(next).find(step => step.id === stepId).fields.push(id);
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
	sectionsOf(nextForm).forEach(step => { step.fields = step.fields.map(id => (id === from ? to : id)); });
	if (Array.isArray(nextForm.fields.required)) nextForm.fields.required = nextForm.fields.required.map(id => (id === from ? to : id));
	/* Conditions written on the form: showWhen and text cases (a named condition's name needs nothing). */
	const renameWhen = when => (when && typeof when === 'object' ? renameReads(when, from, to) : when);
	for (const property of Object.values(nextForm.fields.properties)) {
		if (property?.showWhen !== undefined) property.showWhen = renameWhen(property.showWhen);
		(property?.cases ?? []).forEach(entry => { if (entry) entry.when = renameWhen(entry.when); });
	}
	stepsOf(nextForm).forEach(step => { if (step.showWhen !== undefined) step.showWhen = renameWhen(step.showWhen); });

	const nextRules = clone(rules);
	Object.values(nextRules.fields.variables ?? {}).forEach(definition => {
		if (definition && 'compute' in definition) definition.compute = renameReads(definition.compute, from, to);
	});
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
	if (from === to || !to || sectionsOf(form).some(step => step.id === to)) return { form, rules, renamed: false };
	const nextForm = clone(form);
	sectionsOf(nextForm).forEach(step => { if (step.id === from) step.id = to; });
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
	sectionsOf(next).forEach(step => { step.fields = step.fields.filter(field => field !== id); });
	return next;
}

export function removeStep(form, stepId) {
	const next = clone(form);
	const step = sectionsOf(next).find(s => s.id === stepId);
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

/* Named conditions: a computed yes/no variable, read in rules as { "===": [{ "var": "vars.x" }, true] }. */
export const isNamedCondition = definition => definition?.type === 'boolean' && 'compute' in (definition ?? {});

export function addNamedCondition(rules, title, compute = true) {
	const next = clone(rules);
	const taken = Object.keys(next.fields.variables ?? {});
	const name = fieldId(title, taken).replace(/^field/, 'is');
	next.fields.variables = { ...(next.fields.variables ?? {}), [name]: { type: 'boolean', title, compute } };
	return { rules: next, name };
}

/* Moves a rule's condition into a named condition and makes the rule read it. */
export function nameCondition(rules, ruleId, title) {
	const rule = (rules.fields.rules ?? []).find(r => r.id === ruleId);
	if (!rule || rule.forEach) return { rules, name: null };
	const result = addNamedCondition(rules, title, rule.when ?? true);
	result.rules.fields.rules.find(r => r.id === ruleId).when = { '===': [{ var: `vars.${result.name}` }, true] };
	return result;
}

/* Ids of the rules, names of the variables, and (given the form) fields and steps that read a variable.
   showWhen and text cases name a named condition by its name. */
export function usesOfVariable(rules, name, form = null) {
	const reads = value => JSON.stringify(value ?? null).includes(`"vars.${name}"`);
	const names = value => value === name || reads(value);
	const properties = Object.entries(form?.fields?.properties ?? {});
	return [
		...(rules.fields.rules ?? []).filter(rule => reads([rule.when, rule.then, rule.else])).map(rule => rule.id),
		...Object.entries(rules.fields.variables ?? {}).filter(([other, definition]) => other !== name && reads(definition.compute)).map(([other]) => `vars.${other}`),
		...properties.filter(([, property]) => names(property?.showWhen) || (property?.cases ?? []).some(entry => names(entry?.when))).map(([id, property]) => `field "${property?.title ?? id}"`),
		...(form ? stepsOf(form) : []).filter(step => names(step.showWhen)).map(step => `step "${step.name ?? step.id}"`)
	];
}

/* Every var path a piece of JSON Logic (or a document) reads. */
function readsOf(value, found = new Set()) {
	if (Array.isArray(value)) value.forEach(item => readsOf(item, found));
	else if (value && typeof value === 'object') {
		if (isRule(value) && 'var' in value) {
			const path = Array.isArray(value.var) ? value.var[0] : value.var;
			if (typeof path === 'string') found.add(path);
		}
		Object.values(value).forEach(item => readsOf(item, found));
	} else if (typeof value === 'string') {
		for (const [, path] of value.matchAll(/\{((?:values|vars)\.[\w.]+)\}/g)) found.add(path);
		if (/^vars\.\w+$/.test(value)) found.add(value);
	}
	return found;
}

/* The field ids a rule reads or acts on (a row target list.item counts as its list). */
export function fieldsOfRule(rule) {
	const fields = new Set(rule.forEach ? [rule.forEach] : []);
	readsOf(rule.when).forEach(path => { if (path.startsWith('values.')) fields.add(path.slice(7).split('.')[0]); });
	[...(rule.then ?? []), ...(rule.else ?? [])].forEach(action => {
		actionTargets(action).fields.forEach(id => fields.add(String(id).split('.')[0]));
		readsOf(action[actionName(action)]).forEach(path => { if (path.startsWith('values.')) fields.add(path.slice(7).split('.')[0]); });
	});
	return [...fields];
}

/* The variables and services a set of rules (and field properties) need, following computed variables. */
export function dependenciesOf(rules, parts) {
	const declared = rules.fields.variables ?? {};
	const variables = {};
	const services = {};
	const visit = value => {
		readsOf(value).forEach(path => {
			const name = path.startsWith('vars.') ? path.slice(5) : null;
			if (name && declared[name] && !variables[name]) { variables[name] = clone(declared[name]); visit(declared[name].compute); }
		});
		JSON.stringify(value ?? null).replace(/"(?:service|source)":"([^"]+)"/g, (_, name) => {
			if (rules.fields.services?.[name]) services[name] = clone(rules.fields.services[name]);
			return '';
		});
		JSON.stringify(value ?? null).replace(/"var":"([^"]+)"/g, (_, name) => {
			if (declared[name] && !variables[name]) { variables[name] = clone(declared[name]); visit(declared[name].compute); }
			return '';
		});
	};
	parts.forEach(visit);
	return { variables, services };
}

/* A rule with what it needs, to paste into another form. */
export function copyRule(rules, ruleId) {
	const rule = (rules.fields.rules ?? []).find(r => r.id === ruleId);
	if (!rule) return null;
	return { kind: 'form-editor/rule', rule: clone(rule), ...dependenciesOf(rules, [rule]) };
}

/* Adds a copied rule: a free id, plus the variables and services it needs that the rule set lacks.
   Returns the fields it uses that this form does not have. */
export function pasteRule(form, rules, copied) {
	const next = clone(rules);
	const ids = (next.fields.rules ?? []).map(rule => rule.id);
	const id = slugify(copied.rule.id, ids);
	next.fields.rules = [...(next.fields.rules ?? []), { ...clone(copied.rule), id }];
	for (const key of ['variables', 'services']) {
		const extra = Object.entries(copied[key] ?? {}).filter(([name]) => !next.fields[key]?.[name]);
		if (extra.length) next.fields[key] = { ...(next.fields[key] ?? {}), ...Object.fromEntries(extra.map(([name, value]) => [name, clone(value)])) };
	}
	const used = new Set(fieldsOfRule(copied.rule));
	Object.values(copied.variables ?? {}).forEach(definition => readsOf(definition.compute).forEach(path => { if (path.startsWith('values.')) used.add(path.slice(7).split('.')[0]); }));
	const missing = [...used].filter(field => !form.fields.properties[field]);
	return { rules: next, id, missing };
}

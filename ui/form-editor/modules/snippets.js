/**
 * Snippets: a reusable group of fields, with the rules, variables and services that belong to them,
 * inserted into a step in one go. Ids that are taken are renamed, and everything that names them follows.
 *
 * A snippet: { snippet, title, description?, keywords?, fields: [ids in order], properties, variables?, services?, rules? }
 * No DOM: runs in Node too (see test/snippets.test.js).
 */
import { clone, dependenciesOf, fieldId, fieldIds, fieldsOfRule, renameField, slugify, stepsOf } from './model.js';

const replaceIn = (value, pairs) => {
	let text = JSON.stringify(value);
	for (const [from, to] of pairs) text = text.split(from).join(to);
	return JSON.parse(text);
};

/* Checks a snippet's shape; returns a list of problems (empty when it can be inserted). */
export function snippetProblems(snippet) {
	const problems = [];
	if (typeof snippet?.snippet !== 'string' || !snippet.snippet) problems.push('A snippet needs an id ("snippet")');
	if (!snippet?.properties || typeof snippet.properties !== 'object') problems.push('A snippet needs properties');
	(snippet?.fields ?? []).forEach(id => { if (!snippet?.properties?.[id]) problems.push(`"${id}" is listed in fields but has no property`); });
	return problems;
}

export function insertSnippet(form, rules, snippet, stepId) {
	const problems = snippetProblems(snippet);
	if (problems.length) throw new Error(problems.join('. '));
	const order = snippet.fields ?? Object.keys(snippet.properties);

	/* The snippet as a one-step form of its own, so renameField can rename inside it. */
	let part = { fields: { structure: { layout: [{ type: 'step', id: 'snippet', fields: [...order] }] }, properties: clone(snippet.properties) } };
	let partRules = { fields: { rules: clone(snippet.rules ?? []), services: clone(snippet.services ?? {}) } };
	const taken = [...fieldIds(form)];
	const renamed = {};
	for (const id of order) {
		if (!taken.includes(id)) { taken.push(id); continue; }
		const to = fieldId(id, [...taken, ...Object.keys(part.fields.properties)]);
		({ form: part, rules: partRules } = renameField(part, partRules, id, to));
		renamed[id] = to;
		taken.push(to);
	}
	/* Texts and calculated fields name answers as {values.x}; services send them. */
	let pairs = Object.entries(renamed).map(([from, to]) => [`{values.${from}}`, `{values.${to}}`]);
	part.fields.properties = replaceIn(part.fields.properties, pairs);

	/* Variables and services keep their names unless the form already has a different one. */
	const variables = clone(rules.fields.variables ?? {});
	const services = clone(rules.fields.services ?? {});
	pairs = [];
	for (const [name, definition] of Object.entries(clone(snippet.variables ?? {}))) {
		let next = name;
		if (variables[next] && JSON.stringify(variables[next]) !== JSON.stringify(definition)) next = fieldId(`${snippet.snippet} ${name}`, Object.keys(variables));
		if (next !== name) pairs.push([`"vars.${name}"`, `"vars.${next}"`], [`{vars.${name}}`, `{vars.${next}}`]);
		variables[next] = definition;
	}
	for (const [name, service] of Object.entries(partRules.fields.services)) {
		let next = name;
		if (services[next] && JSON.stringify(services[next]) !== JSON.stringify(service)) next = slugify(`${snippet.snippet}-${name}`, Object.keys(services));
		if (next !== name) pairs.push([`"service":"${name}"`, `"service":"${next}"`], [`"source":"${name}"`, `"source":"${next}"`]);
		services[next] = service;
	}
	part.fields.properties = replaceIn(part.fields.properties, pairs);
	const ruleIds = (rules.fields.rules ?? []).map(rule => rule.id);
	const added = replaceIn(partRules.fields.rules, pairs).map(rule => {
		const id = slugify(rule.id, ruleIds);
		ruleIds.push(id);
		return { ...rule, id };
	});

	const nextForm = clone(form);
	Object.assign(nextForm.fields.properties, part.fields.properties);
	const step = stepsOf(nextForm).find(s => s.id === stepId) ?? stepsOf(nextForm)[0];
	step.fields.push(...part.fields.structure.layout[0].fields);
	const nextRules = clone(rules);
	nextRules.fields.rules = [...(nextRules.fields.rules ?? []), ...added];
	if (Object.keys(variables).length) nextRules.fields.variables = replaceIn(variables, pairs);
	if (Object.keys(services).length) nextRules.fields.services = services;
	return { form: nextForm, rules: nextRules, fields: part.fields.structure.layout[0].fields, renamed };
}

/* Makes a snippet of some fields: their properties, the rules that use only them, and the variables
   and services those need. Rules that also use other fields are left out and listed in `skipped`. */
export function extractSnippet(form, rules, ids, { title, description, keywords } = {}) {
	const order = stepsOf(form).flatMap(step => step.fields).filter(id => ids.includes(id));
	const properties = Object.fromEntries(order.map(id => [id, clone(form.fields.properties[id])]));
	const kept = [];
	const skipped = [];
	for (const rule of rules.fields.rules ?? []) {
		const fields = fieldsOfRule(rule);
		if (!fields.some(id => order.includes(id))) continue;
		if (fields.every(id => order.includes(id))) kept.push(clone(rule));
		else skipped.push(rule.id);
	}
	const { variables, services } = dependenciesOf(rules, [...kept, properties]);
	const snippet = { snippet: slugify(title || order[0] || 'snippet'), title: title || order.join(', '), fields: order, properties };
	if (description) snippet.description = description;
	if (keywords?.length) snippet.keywords = keywords;
	if (kept.length) snippet.rules = kept;
	if (Object.keys(variables).length) snippet.variables = variables;
	if (Object.keys(services).length) snippet.services = services;
	return { snippet, skipped };
}

/* Loads snippet files (URLs); a file holds one snippet or { snippets: [...] }. */
export async function loadSnippets(urls, { fetch: get = globalThis.fetch } = {}) {
	const snippets = [];
	const errors = [];
	for (const url of urls) {
		try {
			const response = await get(url);
			if (!response.ok) throw new Error(`${url}: ${response.status}`);
			const doc = await response.json();
			for (const snippet of doc.snippets ?? [doc]) {
				const problems = snippetProblems(snippet);
				if (problems.length) errors.push({ url, message: problems.join('. ') });
				else snippets.push(snippet);
			}
		} catch (error) {
			errors.push({ url, message: error.message });
		}
	}
	return { snippets, errors };
}

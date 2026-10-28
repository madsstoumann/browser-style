/**
 * Field types as data. A package is a JSON document listing the types it adds:
 * { package, title, description?, version?, functions?, widgets?, types: [{ kind, title, description, group, glyph,
 *   keywords?, privacy?, template, settings? }] }
 * The core package is types/core.json; country and domain packages (CPR, IBAN, …) are installed on their own.
 * Everything here is pure, so an editor in another host can bundle it (loadTypes only fetches what it is given).
 */

const clone = value => structuredClone(value);
const CORE = 'core';
/* Keys a type's template sets that say nothing about which type a field is. */
const PRESENTATION = new Set(['title', 'description', 'required', 'privacy', 'default', 'content', 'consent', 'from', 'track', 'localized']);

/* Merges package documents into one registry: { packages, types, kinds, errors }. Later packages cannot replace a kind. */
export function defineTypes(...docs) {
	const packages = [];
	const types = [];
	const kinds = {};
	const errors = [];
	for (const doc of docs.flat()) {
		const name = doc?.package;
		if (typeof name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
			errors.push({ code: 'package', message: `A type package needs a "package" name of lowercase letters, digits and dashes` });
			continue;
		}
		if (packages.some(entry => entry.package === name)) {
			errors.push({ code: 'package', message: `The package "${name}" is installed twice`, package: name });
			continue;
		}
		const { types: list = [], ...info } = doc;
		packages.push({ ...clone(info), title: info.title ?? name });
		for (const entry of list) {
			const kind = entry?.kind;
			if (typeof kind !== 'string' || !kind) errors.push({ code: 'kind', message: `A type in "${name}" has no kind`, package: name });
			else if (name !== CORE && !kind.startsWith(`${name}/`)) errors.push({ code: 'kind', message: `"${kind}" must start with "${name}/"`, package: name });
			else if (kinds[kind]) errors.push({ code: 'kind', message: `"${kind}" is defined by "${kinds[kind].package}" and "${name}"`, package: name });
			else if (typeof entry.template?.type !== 'string') errors.push({ code: 'template', message: `"${kind}" needs a template with a type`, package: name });
			else {
				const type = { ...clone(entry), package: name, group: entry.group ?? 'Other', settings: entry.settings ?? [] };
				types.push(type);
				kinds[kind] = type;
			}
		}
	}
	return { packages, types, kinds, errors };
}

/* Fetches package documents (URLs) and merges them with any given as objects. */
export async function loadTypes(sources, { fetch: get = globalThis.fetch, base } = {}) {
	const docs = await Promise.all([].concat(sources).map(async source => {
		if (typeof source !== 'string' && !(source instanceof URL)) return source;
		const url = base ? new URL(source, base) : source;
		const response = await get(url);
		if (!response.ok) throw new Error(`${url}: ${response.status}`);
		return { ...(await response.json()), url: String(response.url || url) };
	}));
	return defineTypes(docs);
}

const flatten = (value, prefix = '', found = []) => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		for (const [key, inner] of Object.entries(value)) {
			if (!prefix && PRESENTATION.has(key)) continue;
			if (prefix === 'options.' && key === 'choices') continue;
			if (prefix === 'validation.' && key === 'messages') continue;
			if (prefix === 'ui.' && key !== 'widget') continue;
			flatten(inner, `${prefix}${key}.`, found);
		}
	} else found.push([prefix.slice(0, -1), value]);
	return found;
};

const read = (object, path) => path.split('.').reduce((at, key) => at?.[key], object);

/* Whether a property has everything a template says about its type, and the same widget. */
function fits(property, template) {
	if (property.type !== template.type) return false;
	if ((property.ui?.widget ?? null) !== (template.ui?.widget ?? null)) return false;
	if ((property.options?.multiple === true) !== (template.options?.multiple === true)) return false;
	return flatten(template).every(([path, value]) => {
		const own = read(property, path);
		if (path === 'validation.check') return [].concat(own ?? []).includes(value);
		return JSON.stringify(own) === JSON.stringify(value);
	});
}

/* The type of a field: its `kind` when the registry has it, otherwise the closest fitting template. Core wins a tie. */
export function typeOf(property, registry) {
	if (!property || !registry) return null;
	if (property.kind && registry.kinds[property.kind]) return registry.kinds[property.kind];
	let best = null;
	let score = -1;
	for (const type of registry.types) {
		if (!fits(property, type.template)) continue;
		const size = flatten(type.template).length;
		if (size > score || (size === score && type.package === CORE && best?.package !== CORE)) {
			best = type;
			score = size;
		}
	}
	/* A widget no type knows (an older editor's "toggle"): the core type with the same base type. */
	return best ?? registry.types.find(type => type.package === CORE && type.template.type === property.type && !type.template.ui?.widget && !type.template.options?.multiple === !property.options?.multiple) ?? null;
}

/* A new field property from a type: its template, its kind and a title. */
export function fieldFromType(type, { title } = {}) {
	const property = { kind: type.kind, ...clone(type.template) };
	property.title = title ?? property.title ?? type.title;
	if (type.privacy && type.privacy !== 'none' && !property.privacy) property.privacy = type.privacy;
	return property;
}

/* Changes a field to another type: what the new template sets wins, label, help, required and placement stay. */
export function changeType(property, type) {
	const keep = Object.fromEntries(['title', 'description', 'required', 'ui'].filter(key => key in property).map(key => [key, clone(property[key])]));
	const next = fieldFromType(type, { title: property.title });
	if (keep.description) next.description = keep.description;
	if (keep.required && next.type !== 'content') next.required = true;
	if (keep.ui?.hidden) next.ui = { ...(next.ui ?? {}), hidden: true };
	if (property.options?.choices && next.options && !type.template.options?.choices) next.options.choices = clone(property.options.choices);
	return next;
}

const words = text => String(text ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* Types matching a search, best first: every word must appear in the title, kind, description, keywords or package. */
export function searchTypes(registry, query = '') {
	const terms = words(query).split(/\s+/).filter(Boolean);
	if (!terms.length) return [...registry.types];
	const titleOf = name => registry.packages.find(entry => entry.package === name)?.title ?? name;
	return registry.types
		.map(type => {
			const title = words(type.title);
			const haystack = words([type.title, type.kind, type.description, ...(type.keywords ?? []), type.package, titleOf(type.package), type.group].join(' '));
			if (!terms.every(term => haystack.includes(term))) return null;
			return { type, rank: terms.every(term => title.includes(term)) ? 0 : 1 };
		})
		.filter(Boolean)
		.sort((a, b) => a.rank - b.rank)
		.map(entry => entry.type);
}

/* Types in their groups, in the order the groups first appear: [{ group, types }]. */
export function groupTypes(registry, types = registry.types) {
	const groups = [];
	for (const type of types) {
		let group = groups.find(entry => entry.group === type.group);
		if (!group) groups.push(group = { group: type.group, types: [] });
		group.types.push(type);
	}
	return groups;
}

/* Like loadTypes, and also imports each package's `functions` module (relative to its types.json): { …registry, functions }.
   With { widgets: true } (a browser host) it also imports each package's `widgets` module: { …, widgets: { name: adapter } }. */
export async function loadPackages(sources, { fetch: get, base, load = url => import(url), widgets: withWidgets = false } = {}) {
	const registry = await loadTypes(sources, { fetch: get, base });
	const functions = {};
	const widgets = {};
	for (const entry of registry.packages) {
		if (withWidgets && entry.widgets && entry.url) {
			const module = await load(new URL(entry.widgets, entry.url).href);
			for (const [name, adapter] of Object.entries(module.default ?? module.widgets ?? {})) {
				if (widgets[name] && widgets[name] !== adapter) registry.errors.push({ code: 'widgets', message: `The widget "${name}" is provided twice (again by "${entry.package}")`, package: entry.package });
				else widgets[name] = adapter;
			}
		}
		if (!entry.functions) continue;
		if (!entry.url) {
			registry.errors.push({ code: 'functions', message: `"${entry.package}" names functions, but was not loaded from a URL to find them from`, package: entry.package });
			continue;
		}
		const module = await load(new URL(entry.functions, entry.url).href);
		for (const [name, fn] of Object.entries(module.default ?? module.functions ?? {})) {
			if (functions[name] && functions[name] !== fn) registry.errors.push({ code: 'functions', message: `The function "${name}" is provided twice (again by "${entry.package}")`, package: entry.package });
			else functions[name] = fn;
		}
	}
	return withWidgets ? { ...registry, functions, widgets } : { ...registry, functions };
}

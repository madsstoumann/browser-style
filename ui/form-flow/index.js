/**
 * <form-flow>
 * Renders a multi-step form from a form definition and a rule set (see @browser.style/form-rules).
 * Fields are plain native controls in light DOM, so @browser.style/base form.css styles them.
 * Every input re-evaluates the rules; the engine's effects (fetch, emit) are carried out here.
 */
import { calculatedFrom, consentRecords, evaluate, expirePatches, fillText, handleEvent, loadPackages, merge, normalizeForm, normalizeRuleSet, placeholdersOf, privacyOf, safeUrl } from '../form-rules/index.js';
import { FlowTracking, validityCode } from './tracking.js';

const INPUT_TYPES = ['color', 'date', 'datetime-local', 'email', 'month', 'password', 'search', 'tel', 'time', 'url', 'week'];
const EMPTY_RULES = { id: 'none', rules: [] };

/* Builds an element: h('label', { for: 'x' }, 'text', child) */
function h(tag, attributes = {}, ...children) {
	const element = document.createElement(tag);
	for (const [key, value] of Object.entries(attributes)) {
		if (value === false || value === null || value === undefined) continue;
		if (key in element && typeof value !== 'string') element[key] = value;
		else element.setAttribute(key, value === true ? '' : value);
	}
	element.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
	return element;
}

const choicesOf = property => (property?.options?.choices ?? []).map(choice => (choice && typeof choice === 'object' ? choice : { value: choice, label: String(choice) }));
/* Today in the user's time zone, as the engine expects it (YYYY-MM-DD). */
const localToday = () => {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const isEmpty = value => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

async function fetchJSON(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url}: ${response.status}`);
	return response.json();
}

export default class FormFlow extends HTMLElement {
	static observedAttributes = ['form', 'rules', 'locale'];

	#definition = null;
	#form = null;
	#rules = EMPTY_RULES;
	#values = {};
	#context = {};
	#store = {};
	#state = null;
	#current = null;
	#previous;
	#requests = new Map();
	#files = new Map();
	#element;
	/* Lists fetched for sourced choice fields: { [id]: [{ value, label }] } */
	#choices = {};
	/* Controls for ui.widget values beyond the native ones, from widget packages: { name: adapter } (readme § Widgets) */
	#widgets = {};
	/* A language pack (locales/*.json): { locale, labels, messages } */
	#locale = null;
	#suggestTimers = new Map();
	/* Text nodes with {values.x} / {vars.x} placeholders, and the text they were written as. */
	#templates = new Map();

	/* Replace to fetch patches another way (a proxy, a mock): async (effect, service) => patch, or undefined for the built-in request */
	fetcher = null;

	#functions = {};
	#pending = new Set();

	/* Receives every ff:track event, e.g. a beacon or dataLayer adapter from ./trackers/ (readme § Tracking) */
	tracker = null;
	#tracking = null;
	#onVisibility = () => {
		if (document.visibilityState === 'hidden') this.#abandon();
		else this.#tracking?.resume();
	};
	#onPageHide = () => this.#abandon();

	async connectedCallback() {
		document.addEventListener('visibilitychange', this.#onVisibility);
		window.addEventListener('pagehide', this.#onPageHide);
		if (!this.#definition && this.getAttribute('form')) await this.load();
	}

	disconnectedCallback() {
		document.removeEventListener('visibilitychange', this.#onVisibility);
		window.removeEventListener('pagehide', this.#onPageHide);
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'locale') {
			if (oldValue === newValue || !this.#form) return;
			try {
				this.locale = newValue ? await fetchJSON(new URL(newValue, document.baseURI)) : null;
			} catch (error) {
				this.#dispatch('ff:error', { error });
			}
			return;
		}
		if (oldValue !== null && oldValue !== newValue && this.isConnected) await this.load();
	}

	async load() {
		try {
			if (this.getAttribute('locale')) this.#locale = await fetchJSON(new URL(this.getAttribute('locale'), document.baseURI));
			/* Type packages: their checks become functions, their widgets controls. The page's own functions win. */
			if (this.getAttribute('packages')) {
				const registry = await loadPackages(this.getAttribute('packages').split(/\s+/).filter(Boolean).map(url => new URL(url, document.baseURI).href), { widgets: true });
				this.#functions = { ...registry.functions, ...this.#functions };
				this.#widgets = { ...registry.widgets, ...this.#widgets };
				if (registry.errors.length) this.#dispatch('ff:error', { errors: registry.errors });
			}
			const [definition, rules] = await Promise.all([
				fetchJSON(new URL(this.getAttribute('form'), document.baseURI)),
				this.getAttribute('rules') ? fetchJSON(new URL(this.getAttribute('rules'), document.baseURI)) : EMPTY_RULES
			]);
			this.setup(definition, rules);
		} catch (error) {
			this.#dispatch('ff:error', { error });
		}
	}

	/* Starts the form from objects instead of URLs. A saved session passes `step`, `previous` (its matched rules) and
	   `resumed: { age }` to continue; `keepTracking` re-renders without starting a new tracking run. */
	setup(definition, rules = EMPTY_RULES, { values = {}, context = this.#context, facts, step = null, previous, resumed = null, keepTracking = false } = {}) {
		this.#definition = definition;
		this.#form = normalizeForm(definition);
		this.#rules = rules;
		this.#values = { ...values };
		this.#context = context;
		if (facts) this.#store = { ...this.#store, facts };
		this.#current = step;
		this.#previous = previous?.matched;
		this.#requests.clear();
		this.#files.clear();
		this.#choices = {};
		if (!keepTracking || !this.#tracking) this.#tracking = new FlowTracking(event => this.#track(event), {
			contextKeys: (this.getAttribute('track-context') ?? 'channel campaign').split(/\s+/).filter(Boolean),
			contextOf: () => this.#context,
			propertyOf: id => this.#propertyOf(id),
			privacyOf: id => privacyOf(this.#definition, this.#rules, id),
			resumed
		});
		this.#render();
		this.update();
	}

	/* A language pack: { locale, labels: { next, … }, messages: { minimum: 'At least {limit}', … } }. label-* attributes still win. */
	set locale(value) {
		this.#locale = value ?? null;
		if (this.#form) this.setup(this.#definition, this.#rules, { values: this.#values, step: this.#current, previous: { matched: this.#previous }, keepTracking: true });
	}
	get locale() { return this.#locale; }

	#label(name, fallback) {
		return this.getAttribute(`label-${name}`) ?? this.#locale?.labels?.[name] ?? fallback;
	}

	/* Host functions the rules call by name (operators and field checks): { name: fn } */
	set functions(value) {
		this.#functions = value ?? {};
		if (this.#form) this.update();
	}
	get functions() { return this.#functions; }

	/* Widget adapters by ui.widget name: { render({ id, property, value, flow, service }), read(control, property), write?(control, value, property), load?(), group? } */
	set widgets(value) {
		this.#widgets = value ?? {};
		if (this.#form) this.setup(this.#definition, this.#rules, { values: this.#values, step: this.#current, previous: { matched: this.#previous }, keepTracking: true });
	}
	get widgets() { return this.#widgets; }

	get definition() { return this.#definition; }
	get state() { return this.#state; }
	get values() { return this.#state?.values ?? {}; }
	get rules() { return this.#rules; }
	get currentStep() { return this.#current; }

	set context(value) {
		this.#context = value ?? {};
		if (this.#form) this.update();
	}
	get context() { return this.#context; }

	set facts(value) {
		this.#store = { ...this.#store, facts: value ?? {} };
		if (this.#form) this.update();
	}
	get facts() { return this.#store.facts ?? {}; }

	/* Applies an incoming event the rule set listens for: { id, source, type, sequence?, data } */
	receive(event) {
		const result = handleEvent(this.#definition, this.#rules, this.#store, event);
		this.#store = result.store;
		if (result.changed) {
			this.#rules = result.ruleSet;
			this.update();
		}
		if (result.errors.length) this.#dispatch('ff:error', { errors: result.errors, event });
		return result;
	}

	goTo(stepId) {
		return this.#goTo(stepId, 'goTo()');
	}

	#goTo(stepId, via) {
		if (!this.#state?.path.includes(stepId)) return false;
		this.#tracking?.step(this.#current, stepId, via);
		this.#current = stepId;
		this.update();
		this.#dispatch('ff:step', { step: stepId });
		return true;
	}

	/* === Rendering === */

	#render() {
		this.#templates.clear();
		const form = h('form', { part: 'form', noValidate: true });
		form.append(h('ol', { class: 'ui-step', part: 'steps' }));
		for (const step of this.#form.steps) {
			const fieldset = h('fieldset', { part: 'step', 'data-step': step.id }, h('legend', {}, step.name));
			step.fields.forEach(id => fieldset.append(this.#renderField(id, this.#propertyOf(id))));
			step.slots.forEach(slot => fieldset.append(h('div', { 'data-slot': slot, part: 'slot' })));
			form.append(fieldset);
		}
		form.append(h('nav', { part: 'nav' },
			h('button', { type: 'button', 'data-action': 'prev' }, this.#label('prev', 'Back')),
			h('button', { type: 'button', 'data-action': 'next' }, this.#label('next', 'Next')),
			h('button', { type: 'submit' }, this.#label('submit', 'Send'))
		));
		if (this.hasAttribute('explain')) {
			form.append(h('details', { part: 'explain' }, h('summary', {}, this.#label('explain', 'Why')), h('ul')));
		}

		form.addEventListener('input', event => this.#onInput(event));
		form.addEventListener('change', event => this.#onInput(event));
		form.addEventListener('focusin', event => { if (event.target.name) this.#tracking?.focus(event.target.name); });
		form.addEventListener('click', event => {
			const action = event.target.closest('[data-action]')?.dataset.action;
			if (action === 'next') this.#move(1);
			if (action === 'prev') this.#move(-1);
			const add = event.target.closest('[data-list-add]');
			const remove = event.target.closest('[data-list-remove]');
			if (add || remove) this.#changeRows(add?.dataset.listAdd ?? remove.dataset.listRemove, remove?.closest('[data-row]'));
		});
		form.addEventListener('submit', event => this.#onSubmit(event));

		this.#element?.remove();
		this.#element = form;
		this.replaceChildren(form);
	}

	/* A text node; one with placeholders is refilled on every update. */
	#text(text) {
		const node = document.createTextNode(text ?? '');
		if (placeholdersOf(text).length) this.#templates.set(node, text);
		return node;
	}

	get #lang() {
		return this.#locale?.locale || this.closest('[lang]')?.lang || navigator.language;
	}

	/* A value as text: numbers use the field's ui.format (Intl.NumberFormat options) in the page language. */
	#formatValue(value, property) {
		if (value === null || value === undefined || value === '') return '';
		if (typeof value === 'number') {
			try { return new Intl.NumberFormat(this.#lang, property?.ui?.format ?? {}).format(value); } catch { return String(value); }
		}
		if (typeof value === 'boolean') return value ? (this.#label('yes', 'yes')) : (this.#label('no', 'no'));
		const label = choicesOf(property).find(choice => choice.value === value)?.label;
		if (label) return label;
		return Array.isArray(value) ? value.map(item => this.#formatValue(item, property)).join(', ') : String(value);
	}

	#fill(text, state = this.#state) {
		if (!state || !placeholdersOf(text).length) return text;
		const data = { values: state.values, vars: state.vars, context: this.#context, facts: this.#store.facts ?? {} };
		return fillText(text, data, { format: (value, path) => this.#formatValue(value, path.startsWith('values.') ? this.#propertyOf(path.slice(7)) : null) });
	}

	#labelText(id, property) {
		return h('span', {},
			this.#text(property?.title ?? id),
			h('abbr', { title: this.#label('required-marker', 'Required'), hidden: true }, '*'),
			property?.description ? h('small', {}, this.#text(property.description)) : null
		);
	}

	#renderField(id, property = {}) {
		const value = Object.hasOwn(this.#values, id) ? this.#values[id] : property.default;
		const widget = property.ui?.widget;
		const validation = property.validation ?? {};
		const choices = choicesOf(property);

		/* A text block: no control and no value. Blank lines start new paragraphs. */
		if (property.type === 'content') {
			return h('div', { 'data-field': id, part: 'field content' },
				property.title ? h('strong', {}, this.#text(property.title)) : null,
				String(property.content ?? '').split(/\n\s*\n/).map(text => text.trim()).filter(Boolean).map(text => h('p', {}, this.#text(text))));
		}
		/* A control from a widget package; it loads its component the first time a field uses it. */
		const adapter = widget && Object.hasOwn(this.#widgets, widget) ? this.#widgets[widget] : null;
		if (adapter) {
			Promise.resolve(adapter.load?.(this)).catch(error => this.#dispatch('ff:error', { error, widget }));
			const service = normalizeRuleSet(this.#rules).services[property.options?.source];
			const control = adapter.render({ id, property, value, flow: this, service });
			control.setAttribute('data-widget-control', '');
			/* group: a fieldset with a legend; ownLabel: the component draws its label; otherwise a label around it. */
			if (adapter.ownLabel) return h('div', { 'data-field': id, 'data-widget': widget, part: 'field widget' }, control);
			return adapter.group
				? h('fieldset', { 'data-field': id, 'data-widget': widget, part: 'field widget' }, h('legend', {}, this.#labelText(id, property)), control)
				: h('label', { 'data-field': id, 'data-widget': widget, part: 'field widget' }, this.#labelText(id, property), control);
		}
		/* A calculated value: shown, never typed; the engine computes it from a variable. */
		if (calculatedFrom(property) || widget === 'output') {
			return h('label', { 'data-field': id, part: 'field output' }, this.#labelText(id, property), h('output', { name: id }));
		}
		/* Sent with the answers, never shown. The engine fills it from `from` or `default`. */
		if (widget === 'hidden') {
			return h('div', { 'data-field': id, part: 'field hidden-value', 'data-hidden-value': true, hidden: true },
				h('input', { type: 'hidden', name: id, value: value ?? '' }));
		}
		/* The wording is the label, so what is recorded is what the person saw. */
		if (widget === 'consent') {
			const notice = property.consent?.notice;
			/* The link may come from a service's patch: only http(s) or relative, never javascript: */
			const noticeUrl = safeUrl(notice?.url);
			return h('label', { 'data-field': id, part: 'field consent' },
				h('input', { type: 'checkbox', name: id, checked: value === true }),
				h('span', {},
					property.consent?.text ?? property.title ?? id,
					noticeUrl ? [' ', h('a', { href: noticeUrl, target: '_blank', rel: 'noopener' }, notice.label ?? 'Privacy notice')] : null,
					h('abbr', { title: this.#label('required-marker', 'Required'), hidden: true }, '*'),
					property.description ? h('small', {}, property.description) : null));
		}
		/* Files stay in the browser until the final submit; the engine only sees { name, size, type }. */
		if (property.type === 'file') {
			const control = h('input', { type: 'file', name: id, accept: validation.accept, multiple: (validation.maxFiles ?? 1) > 1 });
			return h('label', { 'data-field': id, part: 'field file' }, this.#labelText(id, property), control);
		}

		if (property.type === 'select' && (property.options?.multiple || widget === 'radio')) {
			const multiple = property.options?.multiple === true;
			const chosen = (Array.isArray(value) ? value : [value]).map(String);
			return h('fieldset', { 'data-field': id, part: 'field group' },
				h('legend', {}, this.#labelText(id, property)),
				choices.map(choice => h('label', { 'data-choice': String(choice.value) },
					h('input', { type: multiple ? 'checkbox' : 'radio', name: id, value: String(choice.value), checked: chosen.includes(String(choice.value)) }),
					choice.label
				))
			);
		}

		if (property.type === 'list') return this.#renderList(id, property, value);
		if (property.type === 'boolean') {
			return h('label', { 'data-field': id, part: 'field' }, this.#control(id, property, value), this.#labelText(id, property));
		}
		if (widget === 'range') {
			/* A slider shows its value next to it; ui/base form.css styles the track. */
			return h('label', { 'data-field': id, part: 'field range' }, this.#labelText(id, property), this.#control(id, property, value), h('output', { 'data-of': id }));
		}
		const control = this.#control(id, property, value);
		return h('label', { 'data-field': id, part: 'field' }, this.#labelText(id, property), control);
	}

	/* One native control for a plain value: a dropdown, a switch, a number, a slider, a text area or an input. */
	#control(name, property, value, attributes = {}) {
		const widget = property.ui?.widget;
		const validation = property.validation ?? {};
		const placeholder = property.ui?.placeholder;
		if (property.type === 'select') {
			return h('select', { name, ...attributes },
				h('option', { value: '' }, ''),
				choicesOf(property).map(choice => h('option', { value: String(choice.value), selected: String(choice.value) === String(value) }, choice.label))
			);
		}
		if (property.type === 'boolean') return h('input', { type: 'checkbox', role: 'switch', name, checked: value === true, ...attributes });
		if (widget === 'range') {
			return h('input', {
				type: 'range', name, value: value ?? '', ...attributes,
				min: validation.minimum ?? 0, max: validation.maximum ?? 100,
				step: property.ui?.step ?? (property.type === 'integer' ? '1' : 'any')
			});
		}
		if (property.type === 'number' || property.type === 'integer') {
			return h('input', {
				type: 'number', name, value: value ?? '', ...attributes,
				min: validation.minimum, max: validation.maximum,
				step: property.ui?.step ?? (property.type === 'integer' ? '1' : 'any')
			});
		}
		if (widget === 'textarea') return h('textarea', { name, placeholder, minLength: validation.minLength, maxLength: validation.maxLength, ...attributes }, value ?? '');
		/* Type-ahead: suggestions from the field's service, in a native datalist. */
		if (property.type === 'string' && property.options?.source) {
			const list = `${this.id || 'form-flow'}-${name}-suggestions`;
			return [h('input', { type: 'text', name, value: value ?? '', placeholder, autocomplete: 'off', list, ...attributes, minLength: validation.minLength, maxLength: validation.maxLength }), h('datalist', { id: list })];
		}
		return h('input', {
			type: INPUT_TYPES.includes(widget) ? widget : 'text', name, value: value ?? '', placeholder, ...attributes,
			pattern: validation.pattern?.replace(/^\^|\$$/g, ''),
			minLength: validation.minLength, maxLength: validation.maxLength
		});
	}

	/* A repeating group: rows of the same fields, as a table (ui.widget "table") or stacked, with add and remove. */
	#renderList(id, property, value) {
		const element = h('fieldset', { 'data-field': id, 'data-list': property.ui?.widget === 'table' ? 'table' : 'rows', part: 'field list' },
			h('legend', {}, this.#labelText(id, property)));
		const rows = Array.isArray(value) ? value : [];
		const minimum = Math.max(property.validation?.minItems ?? 0, property.required ? 1 : 0);
		const start = rows.length ? rows : Array.from({ length: Math.max(minimum, 1) }, () => ({}));
		if (element.dataset.list === 'table') {
			const items = Object.entries(property.items?.properties ?? {});
			element.append(h('div', { part: 'table' }, h('table', {},
				h('thead', {}, h('tr', {}, items.map(([key, item]) => h('th', { scope: 'col' }, this.#text(item.title ?? key))), h('td'))),
				h('tbody', {}, start.map(row => this.#renderRow(id, property, row))))));
		} else {
			element.append(h('ol', { part: 'rows' }, start.map(row => this.#renderRow(id, property, row))));
		}
		element.append(h('button', { type: 'button', 'data-list-add': id }, this.#label('add-row', '+ Add row')));
		return element;
	}

	#renderRow(id, property, row = {}) {
		const table = property.ui?.widget === 'table';
		const items = Object.entries(property.items?.properties ?? {});
		const remove = h('button', { type: 'button', 'data-list-remove': id }, this.#label('remove-row', 'Remove'));
		const cells = items.map(([key, item]) => {
			const control = this.#control(`${id}.${key}`, item, row[key], { 'data-item': key });
			if (table) {
				[].concat(control)[0].setAttribute('aria-label', item.title ?? key);
				return h('td', {}, control);
			}
			return item.type === 'boolean'
				? h('label', { part: 'field' }, control, this.#text(item.title ?? key))
				: h('label', { part: 'field' }, h('span', {}, this.#text(item.title ?? key)), control);
		});
		return table ? h('tr', { 'data-row': '' }, cells, h('td', {}, remove)) : h('li', { 'data-row': '' }, cells, remove);
	}

	/* Adds a row, or removes one; the last row is emptied instead of removed. */
	#changeRows(id, row) {
		const element = this.#fieldElement(id);
		const property = this.#propertyOf(id);
		if (!element || !property) return;
		if (row && this.#listRows(element).length > 1) row.remove();
		else if (row) row.querySelectorAll('[data-item]').forEach(control => { if (control.type === 'checkbox') control.checked = false; else control.value = ''; });
		else {
			const next = this.#renderRow(id, property);
			this.#listRows(element).at(-1)?.after(next) ?? element.querySelector('tbody, ol').append(next);
			next.querySelector('[data-item]')?.focus();
		}
		this.#values[id] = this.#readValue(id);
		this.#tracking?.input(id);
		this.update();
	}

	#listRows(element) {
		return [...element.querySelectorAll('[data-row]')];
	}

	#readRow(id, row) {
		const items = this.#propertyOf(id)?.items?.properties ?? {};
		const value = {};
		for (const control of row.querySelectorAll('[data-item]')) {
			const item = items[control.dataset.item];
			const raw = control.type === 'checkbox' ? control.checked : control.value;
			const converted = item?.type === 'boolean' ? raw : this.#convertWith(item, raw);
			if (converted !== undefined && !(item?.type === 'boolean' && converted === false)) value[control.dataset.item] = converted;
		}
		return value;
	}

	#fieldElement(id) {
		return this.querySelector(`[data-field="${CSS.escape(id)}"]`);
	}

	/* Mounts patch steps and fields (fields in their slot or step), and removes those of unmounted patches. */
	#syncPatchFields(state) {
		const patches = normalizeRuleSet(this.#rules).patches;
		let previous = null;
		for (const step of state.steps) {
			let fieldset = this.querySelector(`fieldset[data-step="${CSS.escape(step.id)}"]`);
			if (!fieldset) {
				fieldset = h('fieldset', { part: 'step', 'data-step': step.id, 'data-source': step.source }, h('legend', {}, step.name));
				(previous ?? this.querySelector('[part="steps"]')).after(fieldset);
			}
			previous = fieldset;
		}
		this.querySelectorAll('fieldset[data-source]').forEach(fieldset => {
			if (!state.steps.some(step => step.id === fieldset.dataset.step)) fieldset.remove();
		});
		for (const [id, field] of Object.entries(state.fields)) {
			if (field.source === 'form' || this.#fieldElement(id)) continue;
			const patch = patches.find(p => p.id === field.source);
			const slot = Object.entries(patch?.place ?? {}).find(([, ids]) => ids.includes(id))?.[0];
			const container = slot
				? this.querySelector(`[data-slot="${CSS.escape(slot)}"]`)
				: this.querySelector(`fieldset[data-step="${CSS.escape(field.step)}"][data-source]`);
			if (container) container.append(this.#renderField(id, patch.fields[id]));
		}
		this.querySelectorAll('[data-slot] > [data-field], fieldset[data-source] > [data-field]').forEach(element => {
			if (!state.fields[element.dataset.field]) element.remove();
		});
	}

	/* === Values === */

	#convert(id, raw) {
		return this.#convertWith(this.#propertyOf(id), raw);
	}

	#convertWith(property, raw) {
		const choice = choicesOf(property).find(c => String(c.value) === raw);
		if (choice) return choice.value;
		if (property?.type === 'number' || property?.type === 'integer') return raw === '' ? undefined : Number(raw);
		return raw === '' ? undefined : raw;
	}

	#propertyOf(id) {
		const field = this.#form.fields.get(id);
		const property = field ? field.property : normalizeRuleSet(this.#rules).patches.find(patch => patch.fields?.[id])?.fields[id];
		/* A sourced field gets the list its service returned as its choices. */
		const list = this.#choices[id];
		return list && property?.options?.source && property.type === 'select' ? { ...property, options: { ...property.options, choices: list } } : property;
	}

	#readValue(id) {
		const element = this.#fieldElement(id);
		if (!element) return undefined;
		if (element.dataset.widget) {
			const value = this.#widgets[element.dataset.widget]?.read(element.querySelector('[data-widget-control]'), this.#propertyOf(id));
			return value === '' || value === null ? undefined : value;
		}
		if (element.dataset.list) {
			const rows = this.#listRows(element).map(row => this.#readRow(id, row)).filter(row => Object.keys(row).length);
			return rows.length ? rows : undefined;
		}
		const controls = [...element.querySelectorAll('input, select, textarea')];
		const first = controls[0];
		if (first?.type === 'file') {
			const files = [...first.files];
			this.#files.set(id, files);
			return files.length ? files.map(file => ({ name: file.name, size: file.size, type: file.type })) : undefined;
		}
		if (first?.type === 'radio') return this.#convert(id, controls.find(c => c.checked)?.value ?? '');
		if (first?.type === 'checkbox' && controls.length > 1) return controls.filter(c => c.checked).map(c => this.#convert(id, c.value));
		if (first?.type === 'checkbox') return first.checked;
		return this.#convert(id, first?.value ?? '');
	}

	#writeValue(id, value) {
		const element = this.#fieldElement(id);
		if (!element) return;
		if (element.dataset.list) {
			element.replaceWith(this.#renderField(id, this.#propertyOf(id)));
			return;
		}
		if (element.dataset.widget) {
			this.#widgets[element.dataset.widget]?.write?.(element.querySelector('[data-widget-control]'), value, this.#propertyOf(id));
			return;
		}
		const controls = [...element.querySelectorAll('input, select, textarea')];
		const wanted = (Array.isArray(value) ? value : [value]).map(String);
		for (const control of controls) {
			if (control.type === 'file') {
				if (isEmpty(value)) { control.value = ''; this.#files.delete(id); }
				continue;
			}
			if (control.type === 'radio' || (control.type === 'checkbox' && controls.length > 1)) control.checked = wanted.includes(control.value);
			else if (control.type === 'checkbox') control.checked = value === true;
			else control.value = isEmpty(value) ? '' : String(value);
		}
	}

	#onInput(event) {
		const id = event.target.closest('[data-list], [data-widget]')?.dataset.field ?? event.target.name;
		if (!id || !this.#fieldElement(id)) return;
		if (event.type === 'input' && event.target.list) this.#suggest(id, event.target);
		this.#values[id] = this.#readValue(id);
		this.#tracking?.input(id);
		this.update();
	}

	/* === Evaluation === */

	update() {
		if (!this.#form) return;
		let state;
		try {
			state = evaluate(this.#definition, expirePatches(this.#rules, new Date().toISOString()), {
				values: this.#values,
				context: this.#context,
				facts: this.#store.facts ?? {},
				step: { current: this.#current },
				today: localToday(),
				functions: this.#functions,
				choices: this.#choices,
				messages: this.#locale?.messages,
				previous: this.#previous ? { matched: this.#previous } : undefined
			});
		} catch (error) {
			this.#dispatch('ff:error', { error });
			return;
		}
		this.#previous = state.matched;
		this.#state = state;
		this.#syncPatchFields(state);
		this.#applyFields(state);
		this.#applyTexts(state);
		this.#applySteps(state);
		this.#applyExplain(state);
		this.#tracking?.update(state, this.#current, state.effects);
		this.#runEffects(state);
		this.#dispatch('ff:change', { values: state.values, state });
	}

	#applyFields(state) {
		const unavailable = new Set(state.issues.filter(issue => issue.code === 'option-unavailable').map(issue => issue.field));
		for (const [id, field] of Object.entries(state.fields)) {
			const element = this.#fieldElement(id);
			if (!element) continue;
			if (element.dataset.list) {
				this.#applyList(id, element, field, state);
				continue;
			}
			if (element.dataset.widget) {
				element.hidden = !field.visible;
				const control = element.querySelector('[data-widget-control]');
				control.toggleAttribute('disabled', !field.visible || !field.enabled);
				control.toggleAttribute('required', field.required);
				const marker = element.querySelector('abbr');
				if (marker) marker.hidden = !field.required;
				if (state.explain[`${id}.value`]) {
					this.#values[id] = state.values[id];
					this.#writeValue(id, state.values[id]);
				}
				continue;
			}
			const controls = [...element.querySelectorAll('input, select, textarea')];
			const group = element.tagName === 'FIELDSET';
			element.hidden = !field.visible || element.hasAttribute('data-hidden-value');
			const marker = element.querySelector('abbr');
			if (marker) marker.hidden = !field.required;

			if (state.explain[`${id}.value`]) {
				this.#values[id] = state.values[id];
				this.#writeValue(id, state.values[id]);
			}

			for (const control of controls) {
				const allowed = !field.options || control.value === '' || field.options.map(String).includes(control.value);
				const off = !field.visible || !field.enabled;
				if (group) {
					control.closest('label').hidden = !allowed;
					control.disabled = off || !allowed;
				} else {
					control.disabled = off;
					if (control.tagName === 'SELECT') {
						[...control.options].forEach(option => { option.hidden = option.disabled = option.value !== '' && !field.options?.map(String).includes(option.value); });
					}
				}
				if (control.type === 'radio' || !group) control.required = field.required;
				control.setCustomValidity('');
			}

			const first = controls.find(control => !control.disabled) ?? controls[0];
			const own = state.issues.filter(issue => issue.field === id && issue.message);
			const error = own.find(issue => issue.level !== 'warning');
			const warning = own.find(issue => issue.level === 'warning');
			let note = element.nextElementSibling?.matches('[part="warning"]') ? element.nextElementSibling : null;
			if (warning && field.visible) {
				if (!note) element.after(note = h('small', { part: 'warning', role: 'status' }));
				note.textContent = this.#fill(warning.message, state);
			} else note?.remove();
			if (error) first?.setCustomValidity(this.#fill(error.message, state));
			else if (unavailable.has(id)) first?.setCustomValidity(this.#label('unavailable', 'This option is no longer available'));
			else if (group && field.required && controls[0]?.type === 'checkbox' && isEmpty(this.#values[id])) {
				first?.setCustomValidity(this.#label('required', 'Choose at least one'));
			}
		}
	}

	/* Row issues ({ row, item }) count rows with a value, as the engine does: empty rows are not submitted. */
	#applyList(id, element, field, state) {
		const property = this.#propertyOf(id);
		element.hidden = !field.visible;
		element.disabled = !field.visible || !field.enabled;
		const marker = element.querySelector('legend abbr');
		if (marker) marker.hidden = !field.required;
		const rows = this.#listRows(element);
		const filled = rows.filter(row => Object.keys(this.#readRow(id, row)).length);
		const issues = state.issues.filter(issue => issue.field === id);
		const items = property?.items?.properties ?? {};
		/* Rules for each row (forEach) decide each filled row's cells; state.rows counts filled rows, as issues do. */
		const cells = state.rows?.[id];
		const submitted = Array.isArray(state.values[id]) ? state.values[id] : [];
		element.querySelectorAll('[data-row-warning]').forEach(note => note.remove());
		/* A row field is required once its row has a value; the first row also when the group itself is required. */
		rows.forEach((row, index) => row.querySelectorAll('[data-item]').forEach(control => {
			const key = control.dataset.item;
			const at = filled.indexOf(row);
			const cell = at >= 0 ? cells?.[at]?.[key] : null;
			const visible = cell ? cell.visible : items[key]?.ui?.hidden !== true;
			const wrapper = control.closest('td, label');
			if (wrapper) wrapper.toggleAttribute('data-cell-hidden', !visible);
			control.disabled = !visible || cell?.enabled === false;
			control.required = visible && (cell ? cell.required : items[key]?.required === true) && (at >= 0 || (field.required && index === 0));
			if (cell && state.explain[`${id}[${at}].${key}.value`]) {
				const value = submitted[at]?.[key] ?? null;
				if (control.type === 'checkbox') control.checked = value === true;
				else control.value = value ?? '';
			}
			control.setCustomValidity('');
		}));
		for (const issue of issues) {
			if (issue.row === undefined) continue;
			const control = filled[issue.row]?.querySelector(`[data-item="${CSS.escape(issue.item)}"]`);
			const text = issue.message ? this.#fill(issue.message, state) : issue.code === 'option-unavailable' ? (this.#label('unavailable', 'This option is no longer available')) : null;
			if (!control || !text) continue;
			if (issue.level === 'warning') control.after(h('small', { part: 'warning', role: 'status', 'data-row-warning': '' }, text));
			else control.setCustomValidity(text);
		}
		const own = issues.find(issue => issue.row === undefined && issue.message && issue.level !== 'warning');
		const first = rows[0]?.querySelector('[data-item]');
		if (own) first?.setCustomValidity(this.#fill(own.message, state));
		else if (field.required && !filled.length) first?.setCustomValidity(this.#label('required-row', 'Add at least one row'));
		const add = element.querySelector('[data-list-add]');
		if (add) add.disabled = typeof property?.validation?.maxItems === 'number' && rows.length >= property.validation.maxItems;
	}

	#applyTexts(state) {
		for (const [node, text] of this.#templates) {
			if (!this.#element?.contains(node)) this.#templates.delete(node);
			else node.data = this.#fill(text, state);
		}
		this.querySelectorAll('output[name], output[data-of]').forEach(output => {
			const id = output.getAttribute('name') ?? output.dataset.of;
			output.value = this.#formatValue(state.values[id], this.#propertyOf(id));
		});
	}

	#applySteps(state) {
		const { path } = state;
		if (!path.includes(this.#current)) {
			const order = state.steps.map(step => step.id);
			const from = Math.max(0, order.indexOf(this.#current));
			const before = this.#current;
			this.#current = order.slice(from).find(id => path.includes(id)) ?? path.at(-1) ?? null;
			if (before) this.#tracking?.step(before, this.#current, 'rule');
		}
		for (const step of state.steps) {
			const fieldset = this.querySelector(`fieldset[data-step="${CSS.escape(step.id)}"]`);
			fieldset.disabled = !step.visible;
			fieldset.hidden = step.id !== this.#current;
		}
		const index = path.indexOf(this.#current);
		this.querySelector('[part="steps"]').replaceChildren(...path.map((id, i) => {
			const step = state.steps.find(s => s.id === id);
			return h('li', { class: i === index ? '--active' : null, 'aria-current': i === index ? 'step' : null }, step.name);
		}));
		this.querySelector('[data-action="prev"]').disabled = index <= 0;
		this.querySelector('[data-action="next"]').hidden = index >= path.length - 1;
		this.querySelector('[type="submit"]').hidden = index < path.length - 1;
	}

	#applyExplain(state) {
		const list = this.querySelector('[part="explain"] ul');
		if (!list) return;
		list.replaceChildren(...Object.entries(state.explain).map(([key, rules]) => h('li', {}, h('code', {}, key), ' ← ', rules.map(rule => rule.replace(/:else$/, ' (else)')).join(', '))));
		Object.entries(state.vars ?? {}).forEach(([name, value]) => list.append(h('li', { part: 'var' }, h('code', {}, `vars.${name}`), ' = ', JSON.stringify(value))));
		if (!list.children.length) list.append(h('li', {}, 'No rule has changed the form.'));
	}

	#runEffects(state) {
		for (const effect of state.effects) {
			if (effect.type === 'emit') {
				this.#dispatch('ff:emit', { type: effect.event, data: effect.data, rule: effect.rule, where: effect.where });
			} else if (effect.type === 'options' && !this.#requests.has(effect.key)) {
				this.#fetchChoices(effect);
			} else if (effect.type === 'fetch' && !this.#requests.has(effect.key)) {
				const request = this.#fetchPatch(effect);
				if (effect.wait) {
					this.#pending.add(request);
					request.finally(() => this.#pending.delete(request));
				}
			}
		}
	}

	async #fetchPatch(effect) {
		this.#requests.set(effect.key, 'pending');
		const service = normalizeRuleSet(this.#rules).services[effect.service] ?? {};
		const started = performance.now();
		const ms = () => Math.round(performance.now() - started);
		this.#tracking?.service('request', { service: effect.service, wait: effect.wait === true });
		try {
			let patch;
			if (this.fetcher) patch = await this.fetcher(effect, service);
			if (patch === undefined) patch = await this.#request(effect, service);
			const result = merge(this.#definition, this.#rules, patch, { owner: effect.rule });
			if (result.errors.length) throw Object.assign(new Error(`${effect.service}: patch refused`), { errors: result.errors });
			this.#requests.set(effect.key, 'done');
			this.#tracking?.service('reply', { service: effect.service, ms: ms(), status: 'ok' });
			this.#rules = result.ruleSet;
			this.update();
		} catch (error) {
			this.#requests.set(effect.key, 'error');
			const status = error.status ?? (error.name === 'TimeoutError' ? 'timeout' : error.errors ? 'refused' : 'failed');
			this.#tracking?.service('error', { service: effect.service, ms: ms(), status });
			this.#dispatch('ff:error', { error, effect });
		}
	}

	/* A sourced choice list: the reply is [{ value, label }] (or { choices: [...] }); the field is drawn again with it. */
	async #fetchChoices(effect) {
		this.#requests.set(effect.key, 'pending');
		const service = normalizeRuleSet(this.#rules).services[effect.service] ?? {};
		try {
			let reply;
			if (this.fetcher) reply = await this.fetcher(effect, service);
			if (reply === undefined) reply = await this.#request(effect, service);
			const list = (Array.isArray(reply) ? reply : reply?.choices ?? []).map(choice => (choice && typeof choice === 'object' ? { value: choice.value, label: String(choice.label ?? choice.value) } : { value: choice, label: String(choice) }));
			this.#requests.set(effect.key, 'done');
			this.#choices[effect.field] = list;
			const element = this.#fieldElement(effect.field);
			element?.replaceWith(this.#renderField(effect.field, this.#propertyOf(effect.field)));
			this.update();
		} catch (error) {
			this.#requests.set(effect.key, 'error');
			this.#dispatch('ff:error', { error, effect });
		}
	}

	/* Asks the field's service for suggestions once typing pauses: GET adds q, POST sends it with the answers. */
	#suggest(id, input) {
		clearTimeout(this.#suggestTimers.get(id));
		const property = this.#propertyOf(id);
		const name = property?.options?.source;
		const text = input.value.trim();
		if (!name || text.length < (property.options.minLength ?? 2)) return;
		this.#suggestTimers.set(id, setTimeout(async () => {
			const service = normalizeRuleSet(this.#rules).services[name] ?? {};
			const send = Object.fromEntries((service.send ?? []).map(field => [field, this.#state?.values[field] ?? null]));
			const effect = { type: 'suggest', field: id, service: name, url: service.url, send: { ...send, q: text } };
			try {
				let reply;
				if (this.fetcher) reply = await this.fetcher(effect, service);
				if (reply === undefined) reply = await this.#request(effect, service);
				const list = Array.isArray(reply) ? reply : reply?.choices ?? [];
				input.list?.replaceChildren(...list.slice(0, property.options.max ?? 10).map(item => (item && typeof item === 'object'
					? h('option', { value: String(item.value ?? item.label) }, item.label && item.label !== item.value ? String(item.label) : '')
					: h('option', { value: String(item) }))));
			} catch (error) {
				this.#dispatch('ff:error', { error, effect });
			}
		}, 250));
	}

	/* POST sends the values as JSON; GET sends them as query parameters (a static file works as a service). */
	async #request(effect, service) {
		const url = new URL(effect.url, document.baseURI);
		const get = service.method === 'GET';
		if (get) Object.entries(effect.send).forEach(([key, value]) => url.searchParams.set(key, value ?? ''));
		const response = await fetch(url, {
			method: get ? 'GET' : 'POST',
			...(get ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(effect.send) }),
			signal: AbortSignal.timeout(service.timeoutMs ?? 5000)
		});
		if (!response.ok) throw Object.assign(new Error(`${effect.service}: ${response.status}`), { status: response.status });
		return response.json();
	}

	/* === Navigation === */

	#validStep(stepId) {
		const fieldset = this.querySelector(`fieldset[data-step="${CSS.escape(stepId)}"]`);
		const invalid = [...fieldset.querySelectorAll('input, select, textarea')].find(control => !control.disabled && !control.checkValidity());
		if (!invalid) return true;
		const controls = [...fieldset.querySelectorAll('input, select, textarea')].filter(control => !control.disabled && !control.validity.valid);
		const fieldOf = control => control.closest('[data-field]')?.dataset.field ?? control.name;
		const codeOf = control => (control.validity.customError && this.#state.issues.find(issue => issue.field === fieldOf(control) && issue.message && issue.level !== 'warning')?.code) || validityCode(control);
		this.#tracking?.blocked([...new Set(controls.map(fieldOf))], [...new Set(controls.map(codeOf))]);
		if (this.#current !== stepId) this.#goTo(stepId, 'submit');
		invalid.reportValidity();
		return false;
	}

	/* A fetch marked wait (a backend check) must answer before the user moves on. */
	async #settle() {
		if (!this.#pending.size) return;
		const next = this.querySelector('[data-action="next"]');
		next.setAttribute('aria-busy', 'true');
		next.disabled = true;
		await Promise.allSettled([...this.#pending]);
		next.removeAttribute('aria-busy');
		next.disabled = false;
		this.update();
	}

	async #move(direction) {
		if (direction > 0) await this.#settle();
		const { path } = this.#state;
		const index = path.indexOf(this.#current);
		if (direction > 0 && !this.#validStep(this.#current)) return;
		const next = path[index + direction];
		const via = direction < 0 ? 'back' : this.#state.jumps?.some(jump => jump.from === this.#current) ? 'goto' : 'next';
		if (next) this.#goTo(next, via);
		this.querySelector(`fieldset[data-step="${CSS.escape(this.#current)}"] legend`)?.scrollIntoView({ block: 'nearest' });
	}

	async #onSubmit(event) {
		event.preventDefault();
		this.update();
		await this.#settle();
		if (!this.#state.path.every(stepId => this.#validStep(stepId))) return;
		const blocking = this.#state.issues.filter(issue => issue.field && issue.level !== 'warning');
		if (blocking.length) {
			const field = this.#state.fields[blocking[0].field];
			this.#tracking?.blocked([...new Set(blocking.map(issue => issue.field))], [...new Set(blocking.map(issue => issue.code))]);
			this.#goTo(field.step, 'submit');
			this.#fieldElement(blocking[0].field)?.querySelector('input, select, textarea')?.reportValidity();
			return;
		}
		const { form, rules, version, values } = this.#state;
		const at = new Date().toISOString();
		/* The File objects of the file fields that are submitted, and what each ticked consent said. */
		const files = Object.fromEntries([...this.#files].filter(([id, list]) => id in values && list.length));
		const consents = consentRecords(this.#definition, values).map(record => ({ ...record, at }));
		this.#tracking?.submit(this.#state);
		this.tracker?.flush?.();
		this.#dispatch('ff:submit', { form, rules, version, values, files, consents, state: this.#state });
	}

	/* === Tracking === */

	#track(event) {
		this.#dispatch('ff:track', event);
		try {
			this.tracker?.(event);
		} catch (error) {
			this.#dispatch('ff:error', { error });
		}
	}

	#abandon() {
		if (this.#tracking?.abandon()) this.tracker?.flush?.();
	}

	#dispatch(type, detail) {
		this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
	}
}

if (!customElements.get('form-flow')) customElements.define('form-flow', FormFlow);

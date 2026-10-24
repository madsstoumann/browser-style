/**
 * <form-flow>
 * Renders a multi-step form from a form definition and a rule set (see @browser.style/form-rules).
 * Fields are plain native controls in light DOM, so @browser.style/base form.css styles them.
 * Every input re-evaluates the rules; the engine's effects (fetch, emit) are carried out here.
 */
import { evaluate, expirePatches, handleEvent, merge, normalizeForm, normalizeRuleSet } from '../form-rules/index.js';

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
const isEmpty = value => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

async function fetchJSON(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url}: ${response.status}`);
	return response.json();
}

export default class FormFlow extends HTMLElement {
	static observedAttributes = ['form', 'rules'];

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
	#element;

	/* Replace to fetch patches another way (a proxy, a mock): async (effect, service) => patch, or undefined for the built-in request */
	fetcher = null;

	async connectedCallback() {
		if (!this.#definition && this.getAttribute('form')) await this.load();
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== null && oldValue !== newValue && this.isConnected) await this.load();
	}

	async load() {
		try {
			const [definition, rules] = await Promise.all([
				fetchJSON(new URL(this.getAttribute('form'), document.baseURI)),
				this.getAttribute('rules') ? fetchJSON(new URL(this.getAttribute('rules'), document.baseURI)) : EMPTY_RULES
			]);
			this.setup(definition, rules);
		} catch (error) {
			this.#dispatch('ff:error', { error });
		}
	}

	/* Starts the form from objects instead of URLs. */
	setup(definition, rules = EMPTY_RULES, { values = {}, context = this.#context, facts } = {}) {
		this.#definition = definition;
		this.#form = normalizeForm(definition);
		this.#rules = rules;
		this.#values = { ...values };
		this.#context = context;
		if (facts) this.#store = { ...this.#store, facts };
		this.#current = null;
		this.#previous = undefined;
		this.#requests.clear();
		this.#render();
		this.update();
	}

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
		if (!this.#state?.path.includes(stepId)) return false;
		this.#current = stepId;
		this.update();
		this.#dispatch('ff:step', { step: stepId });
		return true;
	}

	/* === Rendering === */

	#render() {
		const form = h('form', { part: 'form', noValidate: true });
		form.append(h('ol', { class: 'ui-step', part: 'steps' }));
		for (const step of this.#form.steps) {
			const fieldset = h('fieldset', { part: 'step', 'data-step': step.id }, h('legend', {}, step.name));
			step.fields.forEach(id => fieldset.append(this.#renderField(id, this.#form.fields.get(id).property)));
			step.slots.forEach(slot => fieldset.append(h('div', { 'data-slot': slot, part: 'slot' })));
			form.append(fieldset);
		}
		form.append(h('nav', { part: 'nav' },
			h('button', { type: 'button', 'data-action': 'prev' }, this.getAttribute('label-prev') ?? 'Back'),
			h('button', { type: 'button', 'data-action': 'next' }, this.getAttribute('label-next') ?? 'Next'),
			h('button', { type: 'submit' }, this.getAttribute('label-submit') ?? 'Send')
		));
		if (this.hasAttribute('explain')) {
			form.append(h('details', { part: 'explain' }, h('summary', {}, 'Why'), h('ul')));
		}

		form.addEventListener('input', event => this.#onInput(event));
		form.addEventListener('change', event => this.#onInput(event));
		form.addEventListener('click', event => {
			const action = event.target.closest('[data-action]')?.dataset.action;
			if (action === 'next') this.#move(1);
			if (action === 'prev') this.#move(-1);
		});
		form.addEventListener('submit', event => this.#onSubmit(event));

		this.#element?.remove();
		this.#element = form;
		this.replaceChildren(form);
	}

	#labelText(id, property) {
		return h('span', {},
			property?.title ?? id,
			h('abbr', { title: 'Required', hidden: true }, '*'),
			property?.description ? h('small', {}, property.description) : null
		);
	}

	#renderField(id, property = {}) {
		const value = this.#values[id];
		const widget = property.ui?.widget;
		const validation = property.validation ?? {};
		const choices = choicesOf(property);

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

		let control;
		if (property.type === 'select') {
			control = h('select', { name: id },
				h('option', { value: '' }, ''),
				choices.map(choice => h('option', { value: String(choice.value), selected: String(choice.value) === String(value) }, choice.label))
			);
		} else if (property.type === 'boolean') {
			control = h('input', { type: 'checkbox', role: 'switch', name: id, checked: value === true });
			return h('label', { 'data-field': id, part: 'field' }, control, this.#labelText(id, property));
		} else if (property.type === 'number' || property.type === 'integer') {
			control = h('input', {
				type: 'number', name: id, value: value ?? '',
				min: validation.minimum, max: validation.maximum,
				step: property.type === 'integer' ? '1' : 'any'
			});
		} else if (widget === 'textarea') {
			control = h('textarea', { name: id, minLength: validation.minLength, maxLength: validation.maxLength }, value ?? '');
		} else {
			control = h('input', {
				type: INPUT_TYPES.includes(widget) ? widget : 'text', name: id, value: value ?? '',
				pattern: validation.pattern?.replace(/^\^|\$$/g, ''),
				minLength: validation.minLength, maxLength: validation.maxLength
			});
		}
		return h('label', { 'data-field': id, part: 'field' }, this.#labelText(id, property), control);
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
		const property = this.#propertyOf(id);
		const choice = choicesOf(property).find(c => String(c.value) === raw);
		if (choice) return choice.value;
		if (property?.type === 'number' || property?.type === 'integer') return raw === '' ? undefined : Number(raw);
		return raw === '' ? undefined : raw;
	}

	#propertyOf(id) {
		const field = this.#form.fields.get(id);
		if (field) return field.property;
		return normalizeRuleSet(this.#rules).patches.find(patch => patch.fields?.[id])?.fields[id];
	}

	#readValue(id) {
		const element = this.#fieldElement(id);
		if (!element) return undefined;
		const controls = [...element.querySelectorAll('input, select, textarea')];
		const first = controls[0];
		if (first?.type === 'radio') return this.#convert(id, controls.find(c => c.checked)?.value ?? '');
		if (first?.type === 'checkbox' && controls.length > 1) return controls.filter(c => c.checked).map(c => this.#convert(id, c.value));
		if (first?.type === 'checkbox') return first.checked;
		return this.#convert(id, first?.value ?? '');
	}

	#writeValue(id, value) {
		const element = this.#fieldElement(id);
		if (!element) return;
		const controls = [...element.querySelectorAll('input, select, textarea')];
		const wanted = (Array.isArray(value) ? value : [value]).map(String);
		for (const control of controls) {
			if (control.type === 'radio' || (control.type === 'checkbox' && controls.length > 1)) control.checked = wanted.includes(control.value);
			else if (control.type === 'checkbox') control.checked = value === true;
			else control.value = isEmpty(value) ? '' : String(value);
		}
	}

	#onInput(event) {
		const id = event.target.name;
		if (!id || !this.#fieldElement(id)) return;
		this.#values[id] = this.#readValue(id);
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
		this.#applySteps(state);
		this.#applyExplain(state);
		this.#runEffects(state);
		this.#dispatch('ff:change', { values: state.values, state });
	}

	#applyFields(state) {
		const unavailable = new Set(state.issues.filter(issue => issue.code === 'option-unavailable').map(issue => issue.field));
		for (const [id, field] of Object.entries(state.fields)) {
			const element = this.#fieldElement(id);
			if (!element) continue;
			const controls = [...element.querySelectorAll('input, select, textarea')];
			const group = element.tagName === 'FIELDSET';
			element.hidden = !field.visible;
			element.querySelector('abbr').hidden = !field.required;

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
			if (unavailable.has(id)) first?.setCustomValidity(this.getAttribute('label-unavailable') ?? 'This option is no longer available');
			else if (group && field.required && controls[0]?.type === 'checkbox' && isEmpty(this.#values[id])) {
				first?.setCustomValidity(this.getAttribute('label-required') ?? 'Choose at least one');
			}
		}
	}

	#applySteps(state) {
		const { path } = state;
		if (!path.includes(this.#current)) {
			const order = state.steps.map(step => step.id);
			const from = Math.max(0, order.indexOf(this.#current));
			this.#current = order.slice(from).find(id => path.includes(id)) ?? path.at(-1) ?? null;
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
		if (!list.children.length) list.append(h('li', {}, 'No rule has changed the form.'));
	}

	#runEffects(state) {
		for (const effect of state.effects) {
			if (effect.type === 'emit') {
				this.#dispatch('ff:emit', { type: effect.event, data: effect.data, rule: effect.rule, where: effect.where });
			} else if (effect.type === 'fetch' && !this.#requests.has(effect.key)) {
				this.#fetchPatch(effect);
			}
		}
	}

	async #fetchPatch(effect) {
		this.#requests.set(effect.key, 'pending');
		const service = normalizeRuleSet(this.#rules).services[effect.service] ?? {};
		try {
			let patch;
			if (this.fetcher) patch = await this.fetcher(effect, service);
			if (patch === undefined) patch = await this.#request(effect, service);
			const result = merge(this.#definition, this.#rules, patch, { owner: effect.rule });
			if (result.errors.length) throw Object.assign(new Error(`${effect.service}: patch refused`), { errors: result.errors });
			this.#requests.set(effect.key, 'done');
			this.#rules = result.ruleSet;
			this.update();
		} catch (error) {
			this.#requests.set(effect.key, 'error');
			this.#dispatch('ff:error', { error, effect });
		}
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
		if (!response.ok) throw new Error(`${effect.service}: ${response.status}`);
		return response.json();
	}

	/* === Navigation === */

	#validStep(stepId) {
		const fieldset = this.querySelector(`fieldset[data-step="${CSS.escape(stepId)}"]`);
		const invalid = [...fieldset.querySelectorAll('input, select, textarea')].find(control => !control.disabled && !control.checkValidity());
		if (!invalid) return true;
		if (this.#current !== stepId) this.goTo(stepId);
		invalid.reportValidity();
		return false;
	}

	#move(direction) {
		const { path } = this.#state;
		const index = path.indexOf(this.#current);
		if (direction > 0 && !this.#validStep(this.#current)) return;
		const next = path[index + direction];
		if (next) this.goTo(next);
		this.querySelector(`fieldset[data-step="${CSS.escape(this.#current)}"] legend`)?.scrollIntoView({ block: 'nearest' });
	}

	#onSubmit(event) {
		event.preventDefault();
		this.update();
		if (!this.#state.path.every(stepId => this.#validStep(stepId))) return;
		const blocking = this.#state.issues.filter(issue => issue.field);
		if (blocking.length) {
			const field = this.#state.fields[blocking[0].field];
			this.goTo(field.step);
			this.#fieldElement(blocking[0].field)?.querySelector('input, select, textarea')?.reportValidity();
			return;
		}
		const { form, rules, version, values } = this.#state;
		this.#dispatch('ff:submit', { form, rules, version, values, state: this.#state });
	}

	#dispatch(type, detail) {
		this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
	}
}

if (!customElements.get('form-flow')) customElements.define('form-flow', FormFlow);

/**
 * <form-editor>: a visual editor for a multi-step form and its rules. Its only output is two
 * JSON documents (UCF content): a form definition and a @browser.style/form-rules rule set.
 * Docs: readme.md
 */
import '../form-flow/index.js';
import { validate } from '../form-rules/index.js';
import { h, button } from './modules/dom.js';
import { asUcf, clone, emptyForm, emptyRules } from './modules/model.js';
import { renderOutline, renderFormView } from './modules/view-form.js';
import { renderRulesView } from './modules/view-rules.js';

const DRAFT_KEY = 'form-editor:draft';
const HISTORY = 50;

const fetchJSON = async url => {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url}: ${response.status}`);
	return response.json();
};

/* One draft per example (the form attribute), so switching examples never mixes them up. */
const storage = {
	read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
	write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } }
};

/* Which model a dropped-in JSON file is: 'form-definition', 'form-rules', 'form-patch' or null. */
export function detectModel(doc) {
	if (doc?.model === 'form-definition' || doc?.model === 'form-rules') return doc.model;
	const schema = String(doc?.$schema ?? '');
	if (schema.includes('form-definition')) return 'form-definition';
	if (schema.includes('form-rules')) return 'form-rules';
	if (schema.includes('form-patch') || doc?.patch) return 'form-patch';
	if (Array.isArray(doc?.rules) || Array.isArray(doc?.fields?.rules)) return 'form-rules';
	if (doc?.properties || doc?.fields?.properties) return 'form-definition';
	return null;
}

const download = (name, doc) => {
	const url = URL.createObjectURL(new Blob([`${JSON.stringify(doc, null, '\t')}\n`], { type: 'application/json' }));
	h('a', { href: url, download: name }).click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export class FormEditor extends HTMLElement {
	form = emptyForm();
	rules = emptyRules(this.form.id);
	samples = {};
	selection = { view: 'form', step: null, field: null, rule: null };
	advanced = false;
	#past = [];
	#future = [];
	#example = null;
	#parts = {};
	#preview;
	#message = '';
	#functions = {};
	#draftKey = DRAFT_KEY;

	async connectedCallback() {
		if (this.#parts.main) return;
		this.advanced = this.hasAttribute('advanced');
		this.#build();
		if (this.getAttribute('form')) this.#draftKey = `${DRAFT_KEY}:${this.getAttribute('form')}`;
		const draft = storage.read(this.#draftKey);
		if (this.getAttribute('functions')) {
			try {
				const module = await import(new URL(this.getAttribute('functions'), document.baseURI));
				this.functions = module.default ?? module.functions ?? {};
			} catch (error) {
				this.#message = `Could not load the functions: ${error.message}`;
			}
		}
		if (this.getAttribute('form')) {
			try {
				const [form, rules] = await Promise.all([
					fetchJSON(new URL(this.getAttribute('form'), document.baseURI)),
					this.getAttribute('rules') ? fetchJSON(new URL(this.getAttribute('rules'), document.baseURI)) : null
				]);
				const samples = {};
				for (const [service, url] of Object.entries(JSON.parse(this.getAttribute('samples') ?? '{}'))) {
					samples[service] = JSON.stringify(await fetchJSON(new URL(url, document.baseURI)), null, 1);
				}
				this.#example = { form: asUcf(form, 'form-definition'), rules: rules ? asUcf(rules, 'form-rules') : emptyRules(form.id), samples };
			} catch (error) {
				this.#message = `Could not load the example: ${error.message}`;
			}
		}
		if (draft?.form && draft?.rules) {
			this.#load(draft, 'Your draft was restored.');
		} else if (this.#example) {
			this.#load(clone(this.#example), '');
		} else {
			this.#render(true);
		}
	}

	/* Starts editing two documents (plain or UCF). */
	load(form, rules, samples = {}) {
		this.#past = [];
		this.#future = [];
		this.#load({ form: asUcf(form, 'form-definition'), rules: rules ? asUcf(rules, 'form-rules') : emptyRules(form.id), samples }, '');
	}

	/* The sample reply a service gives in the preview: a form-patch as JSON text. */
	setSample(service, text) {
		this.samples = { ...this.samples, [service]: text };
		this.#save();
		this.#restartPreview();
	}

	/* Host functions the rules may call by name (operators and field checks), as in evaluate(). */
	set functions(value) {
		this.#functions = value ?? {};
		if (this.#preview) this.#preview.functions = this.#functions;
		if (this.#parts.main) this.#render(false);
	}
	get functions() { return this.#functions; }

	get output() { return { form: clone(this.form), rules: clone(this.rules) }; }

	commit({ form = this.form, rules = this.rules }) {
		this.#past = [...this.#past.slice(-HISTORY + 1), { form: this.form, rules: this.rules }];
		this.#future = [];
		this.form = form;
		this.rules = rules;
		this.#changed();
	}

	select(patch) {
		this.selection = { ...this.selection, ...patch };
		this.#render(false);
	}

	undo() { this.#travel(this.#past, this.#future); }
	redo() { this.#travel(this.#future, this.#past); }

	#travel(from, to) {
		const entry = from.pop();
		if (!entry) return;
		to.push({ form: this.form, rules: this.rules });
		Object.assign(this, entry);
		this.#changed();
	}

	#load({ form, rules, samples = {} }, message) {
		this.form = form;
		this.rules = rules;
		this.samples = samples;
		this.selection = { view: 'form', step: null, field: null, rule: null };
		this.#message = message;
		this.#save();
		this.#render(true);
	}

	#changed() {
		this.#message = '';
		this.#save();
		this.#render(true);
		this.dispatchEvent(new CustomEvent('fe:change', { bubbles: true, composed: true, detail: this.output }));
	}

	#save() { storage.write(this.#draftKey, { form: this.form, rules: this.rules, samples: this.samples }); }

	/* === Layout === */

	#build() {
		const tab = view => button(view === 'json' ? 'JSON' : view[0].toUpperCase() + view.slice(1), () => this.select({ view }), { role: 'tab', 'data-view': view });
		const fileInput = h('input', { type: 'file', accept: '.json,application/json', multiple: true, hidden: true, onchange: e => this.#import(e.target) });
		this.#parts.title = h('h1', {});
		this.#parts.tabs = h('div', { role: 'tablist', 'aria-label': 'View' }, tab('form'), tab('rules'), tab('json'));
		this.#parts.undo = button('Undo', () => this.undo());
		this.#parts.redo = button('Redo', () => this.redo());
		this.#parts.export = button('Export', () => this.#export(), { part: 'primary' });
		this.#parts.advanced = h('input', { type: 'checkbox', checked: this.advanced, onchange: e => { this.advanced = e.target.checked; if (!this.advanced && this.selection.view === 'json') this.selection.view = 'form'; this.#render(false); } });
		this.#parts.outline = h('aside', { part: 'outline-pane' });
		this.#parts.main = h('main', { part: 'main' });
		this.#preview = h('form-flow', { explain: true });
		this.#preview.fetcher = (effect) => this.#sampleReply(effect);
		this.#parts.status = h('footer', { part: 'status', role: 'status', 'aria-live': 'polite' });

		this.replaceChildren(
			h('header', { part: 'toolbar' },
				this.#parts.title,
				this.#parts.tabs,
				h('div', { part: 'actions' },
					this.#parts.undo, this.#parts.redo,
					button('Example', () => {
						if (!this.#example || !confirm('Replace what you are editing with the example?')) return;
						this.commit(clone(this.#example));
						this.samples = clone(this.#example.samples);
						this.#save();
						this.#restartPreview();
					}, { disabled: !this.getAttribute('form') }),
					button('New', () => {
						if (!confirm('Start a new, empty form? Export first to keep what you have.')) return;
						const form = emptyForm();
						this.commit({ form, rules: emptyRules(form.id) });
						this.select({ view: 'form', step: null, field: null, rule: null });
					}),
					button('Import', () => fileInput.click()), fileInput,
					this.#parts.export,
					h('label', { part: 'toggle' }, this.#parts.advanced, 'Advanced')
				)
			),
			h('div', { part: 'panes' },
				this.#parts.outline,
				this.#parts.main,
				h('section', { part: 'preview-pane', 'aria-label': 'Preview' },
					h('div', { part: 'row' }, h('h2', {}, 'Preview'), button('Restart', () => this.#restartPreview())),
					this.#preview)
			),
			this.#parts.status
		);
		this.addEventListener('keydown', event => {
			if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z' || event.target.closest('input, textarea, select')) return;
			event.preventDefault();
			if (event.shiftKey) this.redo(); else this.undo();
		});
	}

	/* Re-renders the panes; the preview restarts only when the documents changed. */
	#render(documentsChanged) {
		const focus = this.#focusPath();
		const { view } = this.selection;
		this.#parts.title.textContent = this.form.fields.title || 'Untitled form';
		this.#parts.tabs.querySelectorAll('[role=tab]').forEach(tab => {
			tab.setAttribute('aria-selected', String(tab.dataset.view === view));
			tab.hidden = tab.dataset.view === 'json' && !this.advanced;
		});
		this.#parts.undo.disabled = !this.#past.length;
		this.#parts.redo.disabled = !this.#future.length;
		this.#parts.advanced.checked = this.advanced;
		this.#parts.outline.replaceChildren(renderOutline(this));
		this.#parts.main.replaceChildren(view === 'rules' ? renderRulesView(this) : view === 'json' ? this.#jsonView() : renderFormView(this));
		if (documentsChanged) this.#restartPreview(true);
		this.#renderStatus();
		this.#restoreFocus(focus);
	}

	/* Keeps keyboard focus on the same control across a re-render. */
	#focusPath() {
		const active = document.activeElement;
		if (!active || !this.#parts.main?.contains(active)) return null;
		return [...this.#parts.main.querySelectorAll('input, select, textarea, button, summary')].indexOf(active);
	}

	#restoreFocus(index) {
		if (index === null || index < 0) return;
		const controls = this.#parts.main.querySelectorAll('input, select, textarea, button, summary');
		controls[Math.min(index, controls.length - 1)]?.focus({ preventScroll: true });
	}

	#jsonView() {
		const area = (label, key, model) => h('label', {}, h('span', {}, label), h('textarea', {
			rows: 18, spellcheck: false, value: JSON.stringify(this[key], null, '\t'),
			onchange: e => {
				try {
					const doc = JSON.parse(e.target.value);
					if (detectModel(doc) !== model) throw new Error(`This is not a ${model} document`);
					e.target.setCustomValidity('');
					this.commit({ [key]: asUcf(doc, model) });
				} catch (error) {
					e.target.setCustomValidity(error.message);
					e.target.reportValidity();
				}
			}
		}));
		return h('section', { part: 'inspector json' },
			h('h2', {}, 'JSON'),
			h('p', {}, h('small', {}, 'What Export downloads. Edit and leave the box to apply.')),
			area(`${this.form.id}.form.json`, 'form', 'form-definition'),
			area(`${this.rules.id}.rules.json`, 'rules', 'form-rules'));
	}

	/* === Preview === */

	#restartPreview(keepValues = false) {
		const values = keepValues ? this.#preview.values : {};
		try {
			this.#preview.setup(clone(this.form), clone(this.rules), { values });
		} catch (error) {
			this.#message = `The preview failed: ${error.message}`;
		}
	}

	async #sampleReply(effect) {
		const text = this.samples[effect.service];
		if (!text) return undefined;
		return { ...JSON.parse(text), expires: new Date(Date.now() + 36e5).toISOString() };
	}

	/* === Status, import, export === */

	#errors() {
		try {
			return validate(this.form, this.rules, { functions: this.#functions }).errors;
		} catch (error) {
			return [{ code: 'invalid', message: error.message }];
		}
	}

	#renderStatus() {
		const errors = this.#errors();
		this.#parts.export.disabled = errors.length > 0;
		this.#parts.export.title = errors.length ? 'Fix the problems below to export' : '';
		const summary = errors.length ? `${errors.length} problem${errors.length > 1 ? 's' : ''} to fix before export` : 'No problems: ready to export';
		this.#parts.status.replaceChildren(
			...(this.#message ? [h('p', {}, this.#message)] : []),
			errors.length
				? h('details', { open: errors.length < 4 }, h('summary', { part: 'problem' }, summary), h('ul', {}, errors.map(error => h('li', {}, error.message, error.path ? h('small', {}, ` (${error.path})`) : null))))
				: h('p', { part: 'ok' }, summary)
		);
	}

	async #import(input) {
		const notes = [];
		let { form, rules } = this;
		const samples = { ...this.samples };
		for (const file of input.files) {
			try {
				const doc = JSON.parse(await file.text());
				const model = detectModel(doc);
				if (model === 'form-definition') form = asUcf(doc, model);
				else if (model === 'form-rules') rules = asUcf(doc, model);
				else if (model === 'form-patch') {
					const service = Object.keys(rules.fields.services ?? {})[0];
					if (service) samples[service] = JSON.stringify(doc, null, 1);
					notes.push(service ? `${file.name} is now the sample reply of ${service}` : `${file.name} is a patch, but there is no service to attach it to`);
					continue;
				} else throw new Error('not a form, rule set or patch');
				notes.push(`${file.name} loaded`);
			} catch (error) {
				notes.push(`${file.name}: ${error.message}`);
			}
		}
		input.value = '';
		if (rules.fields.form && rules.fields.form !== form.id) notes.push(`The rule set is for "${rules.fields.form}", not "${form.id}"`);
		this.samples = samples;
		this.commit({ form, rules });
		this.#message = notes.join('. ');
		this.#renderStatus();
	}

	#export() {
		if (this.#errors().length) return;
		download(`${this.form.id}.form.json`, this.form);
		download(`${this.rules.id}.rules.json`, this.rules);
		this.dispatchEvent(new CustomEvent('fe:export', { bubbles: true, composed: true, detail: this.output }));
	}
}

if (!customElements.get('form-editor')) customElements.define('form-editor', FormEditor);

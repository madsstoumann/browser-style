/* <editor-card> — the card model's `details` editor for CMS embedding.
 * One card content type per CMS: a grouped schemaType dropdown (the eleven schema.html
 * sections) plus the per-type details panel, all generated from ./details.data.js
 * (built by ui/card/details.build.js from ui/card/data/details.json).
 * Value contract: { schemaType, details } — object or JSON string in, JSON string out
 * (get value / form association), object detail on the change/input events.
 * Round-trip: unknown details keys pass through untouched; a key is only written on
 * user action; clearing a field deletes its key unless the loaded payload had it.
 * Docs: README.md · architecture: AGENTS.md */

import { adoptSharedStyles, createTranslator } from '@browser.style/editor-shared';
import { SCHEMA_TYPE_GROUPS, DETAILS_SCHEMAS, LOOKUPS, TYPE_FLAGS, INJECTED } from './details.data.js';
import { esc, parseValue, serializeValue, getPath, setPath, deletePath, emptyItemFor } from './state.js';
import i18nData from './i18n.json' with { type: 'json' };

const localStylesheetPromise = fetch(new URL('./index.css', import.meta.url))
	.then((r) => r.text())
	.then(async (css) => {
		const sheet = new CSSStyleSheet();
		await sheet.replace(css);
		return sheet;
	});

const INPUT_TYPES = { text: 'text', number: 'number', date: 'date', url: 'url', email: 'email', tel: 'tel', time: 'time' };

class EditorCard extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['value', 'locked'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
		this.state = { schemaType: '', details: {} };
		this._original = {};
		this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');
		this.ready = new Promise((resolve) => { this._resolveReady = resolve; });
	}

	async connectedCallback() {
		await adoptSharedStyles(this.shadowRoot);
		try {
			this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, await localStylesheetPromise];
		} catch (error) { console.error('editor-card: failed to load local styles', error); }
		this._boundInput = (e) => this._handleInput(e);
		this._boundChange = (e) => this._handleChange(e);
		this._boundClick = (e) => this._handleClick(e);
		this.render();
		this._resolveReady(this);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'value') this._setPayload(newValue);
		if (name === 'locked') {
			const select = this.shadowRoot.querySelector('[data-type=schema-type]');
			if (select) select.disabled = this.locked;
		}
	}

	get value() {
		return serializeValue(this.state.schemaType, this.state.details);
	}

	/* accepts an object (Contentful JSON field) or a JSON string (Umbraco, forms) */
	set value(input) {
		this._setPayload(input);
	}

	_setPayload(input) {
		const parsed = parseValue(input);
		if (!parsed) { console.error('editor-card: invalid JSON value'); return; }
		this.state = parsed;
		this._original = structuredClone(parsed.details);
		this._internals.setFormValue(this.value);
		this.render();
	}

	get locked() { return this.hasAttribute('locked'); }

	_schema(type = this.state.schemaType) {
		return DETAILS_SCHEMAS[type] ?? null;
	}

	/* keys some other field's `requires` points at — a write to one re-renders the panel */
	_gateKeys() {
		const schema = this._schema() ?? {};
		return new Set(Object.values(schema).map((field) => field.requires).filter(Boolean));
	}

	_emitChange() {
		this._internals.setFormValue(this.value);
		this._updatePreview();
		const detail = structuredClone({ schemaType: this.state.schemaType, details: this.state.details });
		this.dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }));
		this.dispatchEvent(new CustomEvent('input', { detail: structuredClone(detail), bubbles: true, composed: true }));
	}

	_updatePreview() {
		const code = this.shadowRoot.querySelector('code');
		if (code) code.textContent = JSON.stringify({ schemaType: this.state.schemaType, details: this.state.details }, null, 2);
	}

	/* ── events (delegated on the form — remove before every re-render) ── */

	_addEventListeners() {
		const form = this.shadowRoot.querySelector('form');
		if (!form) return;
		form.addEventListener('input', this._boundInput);
		form.addEventListener('change', this._boundChange);
		form.addEventListener('click', this._boundClick);
	}

	_removeEventListeners() {
		const form = this.shadowRoot.querySelector('form');
		if (!form) return;
		form.removeEventListener('input', this._boundInput);
		form.removeEventListener('change', this._boundChange);
		form.removeEventListener('click', this._boundClick);
	}

	_handleInput(e) {
		const { target } = e;
		const path = target.dataset.path;
		if (!path || target.dataset.json !== undefined || target.type === 'checkbox' || target.tagName === 'SELECT') return;
		this._write(path, target.type === 'number'
			? (target.value === '' ? undefined : Number(target.value))
			: (target.value === '' ? undefined : target.value));
	}

	_handleChange(e) {
		const { target } = e;
		if (target.dataset.type === 'schema-type') { this._updateType(target.value); return; }
		const path = target.dataset.path;
		if (!path) return;
		if (target.dataset.json !== undefined) {
			try {
				const parsed = target.value.trim() ? JSON.parse(target.value) : undefined;
				target.removeAttribute('aria-invalid');
				this._write(path, parsed);
			} catch { target.setAttribute('aria-invalid', 'true'); }
			return;
		}
		if (target.type === 'checkbox') {
			/* unchecking deletes the key unless the loaded payload carried it explicitly
			   (an explicit false can differ from the renderer's per-type default) */
			const value = target.checked ? true : (getPath(this._original, path) !== undefined ? false : undefined);
			this._write(path, value, { rerender: this._gateKeys().has(path.split('.')[0]) });
			return;
		}
		if (target.tagName === 'SELECT') this._write(path, target.value === '' ? undefined : target.value);
	}

	_handleClick(e) {
		const action = e.target.dataset.action;
		if (!action) return;
		const path = e.target.dataset.path;
		if (action === 'add') {
			const items = Array.isArray(getPath(this.state.details, path)) ? getPath(this.state.details, path) : [];
			setPath(this.state.details, path, [...items, emptyItemFor(this._itemsSpecAt(path))]);
			this._emitChange();
			this.render();
		}
		if (action === 'add-ref') {
			const items = Array.isArray(getPath(this.state.details, path)) ? getPath(this.state.details, path) : [];
			setPath(this.state.details, path, [...items, { $ref: 'card/' }]);
			this._emitChange();
			this.render();
		}
		if (action === 'remove') {
			deletePath(this.state.details, `${path}.${e.target.dataset.index}`);
			const remaining = getPath(this.state.details, path);
			if (Array.isArray(remaining) && !remaining.length && getPath(this._original, path) === undefined)
				deletePath(this.state.details, path);
			this._emitChange();
			this.render();
		}
	}

	/* the items spec for an array path like "tiers" or "tiers.0.benefits" */
	_itemsSpecAt(path) {
		let spec = { fields: this._schema() ?? {} };
		for (const key of String(path).split('.')) {
			if (/^\d+$/.test(key)) spec = spec.items ?? {};
			else spec = spec.fields?.[key] ?? {};
		}
		return spec.items;
	}

	_write(path, value, { rerender = false } = {}) {
		if (value === undefined) deletePath(this.state.details, path);
		else setPath(this.state.details, path, value);
		this._emitChange();
		if (rerender) this.render();
	}

	_updateType(schemaType) {
		this.state.schemaType = schemaType;
		this._emitChange();
		this.render();
	}

	/* ── rendering ── */

	_renderSelect(field, value, path) {
		const options = LOOKUPS[field.lookup] ?? [];
		const known = options.some((o) => o.value === value);
		return `<select data-path="${esc(path)}">
			<option value="">${esc(this.t('select'))}</option>
			${value && !known ? `<option value="${esc(value)}" selected>${esc(value)} (${esc(this.t('offList'))})</option>` : ''}
			${options.map((o) => `<option value="${esc(o.value)}"${o.value === value ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}
		</select>`;
	}

	_labelFor(key, field) {
		const label = field.label ?? key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
		return `${esc(label)}${field.display ? ` <small>(${esc(this.t('displayTwin'))})</small>` : ''}`;
	}

	_renderField(key, field, value, path) {
		/* requires-gate: hidden until the sibling key is truthy */
		if (field.requires) {
			const gatePath = path.split('.').slice(0, -1).concat(field.requires).join('.');
			if (!getPath(this.state.details, gatePath)) return '';
		}

		const label = this._labelFor(key, field);

		/* open shapes (free JSON) — and object fields whose current value is a string (`also`) */
		if (field.open) {
			const json = value === undefined ? '' : JSON.stringify(value, null, 2);
			return `<label>${label} <small>(JSON)</small><textarea data-path="${esc(path)}" data-json rows="4" spellcheck="false">${esc(json)}</textarea></label>`;
		}
		if (field.type === 'object' && typeof value === 'string' && field.also?.includes('string')) {
			return `<label>${label}<input type="text" value="${esc(value)}" data-path="${esc(path)}"></label>`;
		}

		switch (field.control) {
			case 'select': return `<label>${label}${this._renderSelect(field, value, path)}</label>`;
			case 'toggle': return `<label class="toggle"><input type="checkbox" data-path="${esc(path)}"${value ? ' checked' : ''}>${label}</label>`;
			case 'textarea': return `<label>${label}<textarea data-path="${esc(path)}" rows="3">${esc(value ?? '')}</textarea></label>`;
			case 'datetime':
				/* text, not datetime-local: corpus values carry seconds + timezone offsets
				   that the native control cannot represent — round-trip beats chrome */
				return `<label>${label}<input type="text" value="${esc(value ?? '')}" data-path="${esc(path)}" placeholder="2026-01-31T09:00:00+00:00"></label>`;
			case 'date': {
				const native = value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(String(value));
				return `<label>${label}<input type="${native ? 'date' : 'text'}" value="${esc(value ?? '')}" data-path="${esc(path)}"></label>`;
			}
			case 'time': {
				/* corpus times carry timezone offsets ("16:00:00+02:00") the native control
				   cannot represent — it would render EMPTY while the value survives underneath */
				const native = value === undefined || /^\d{2}:\d{2}(:\d{2})?$/.test(String(value));
				return `<label>${label}<input type="${native ? 'time' : 'text'}" value="${esc(value ?? '')}" data-path="${esc(path)}"></label>`;
			}
			case 'geopoint':
			case 'fieldset': {
				const fields = field.fields ?? {};
				const inner = Object.entries(fields)
					.map(([k, f]) => this._renderField(k, f, value?.[k], `${path}.${k}`)).join('');
				return `<fieldset data-part="group"><legend>${label}</legend>${inner}</fieldset>`;
			}
			case 'repeater': return this._renderRepeater(key, field, value, path, label);
			default: {
				const type = INPUT_TYPES[field.control] ?? 'text';
				return `<label>${label}<input type="${type}" value="${esc(value ?? '')}" data-path="${esc(path)}"></label>`;
			}
		}
	}

	_renderRepeater(key, field, value, path, label) {
		const items = Array.isArray(value) ? value : [];
		const spec = field.items ?? {};
		const addButton = `<button type="button" data-action="add" data-path="${esc(path)}">${esc(this.t('add'))} ${esc((field.label ?? key).toLowerCase())}</button>`;
		/* a ref-enabled array (data/details.json `ref`) may hold { $ref: "card/<id>" } rows */
		const addRefButton = field.ref
			? `<button type="button" data-action="add-ref" data-path="${esc(path)}">${esc(this.t('addReference'))}</button>`
			: '';
		const rows = items.map((item, index) => {
			const remove = `<button type="button" data-action="remove" data-path="${esc(path)}" data-index="${index}">${esc(this.t('remove'))}</button>`;
			/* a referenced row renders as reference UI — never the full empty field set,
			   which would silently grow shadow keys beside the $ref. Only override keys
			   actually present render as inputs; the projection supplies the rest. */
			if (item && typeof item === 'object' && '$ref' in item) {
				const overrides = Object.entries(item).filter(([k]) => k !== '$ref')
					.map(([k, v]) => this._renderField(k, spec.fields?.[k] ?? { type: 'string', control: 'text' }, v, `${path}.${index}.${k}`)).join('');
				return `<fieldset data-part="item" data-ref><legend>${index + 1} · ${esc(this.t('reference'))}</legend>
					<label>${esc(this.t('reference'))}<input type="text" value="${esc(item.$ref ?? '')}" data-path="${esc(path)}.${index}.$ref" placeholder="card/<id>"></label>
					${overrides}<p>${remove}</p></fieldset>`;
			}
			/* a listItem-style shape accepts plain strings — render the kind the data has */
			if (spec.fields && typeof item !== 'string') {
				const inner = Object.entries(spec.fields)
					.map(([k, f]) => this._renderField(k, f, item?.[k], `${path}.${index}.${k}`)).join('');
				return `<fieldset data-part="item"><legend>${index + 1}</legend>${inner}<p>${remove}</p></fieldset>`;
			}
			if (spec.lookup) return `<div data-part="item">${this._renderSelect(spec, item, `${path}.${index}`)} ${remove}</div>`;
			return `<div data-part="item"><input type="${INPUT_TYPES[spec.control] ?? 'text'}" value="${esc(item ?? '')}" data-path="${esc(path)}.${index}"> ${remove}</div>`;
		}).join('');
		return `<fieldset data-part="group"><legend>${label}</legend>${rows}<p>${addButton}${addRefButton ? ' ' + addRefButton : ''}</p></fieldset>`;
	}

	_renderPanel() {
		const type = this.state.schemaType;
		const schema = this._schema();
		if (!schema) return '';
		const fields = Object.entries(schema)
			.map(([key, field]) => this._renderField(key, field, this.state.details[key], key)).join('');
		const paywalled = TYPE_FLAGS.paywalled.includes(type)
			? this._renderField('paywalled', INJECTED.paywalled, this.state.details.paywalled, 'paywalled')
			: '';
		const hint = TYPE_FLAGS.subheadline.includes(type) ? `<p data-part="hint">${esc(this.t('subheadlineHint'))}</p>` : '';
		if (!fields && !paywalled) return `<p data-part="hint">${esc(this.t('envelopeOnly'))}</p>`;
		return `${hint}${fields}${paywalled}`;
	}

	render() {
		const type = this.state.schemaType;
		const groups = SCHEMA_TYPE_GROUPS.map((group) =>
			`<optgroup label="${esc(group.label)}">${group.options.map((o) =>
				`<option value="${esc(o.value)}"${o.value === type ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</optgroup>`).join('');

		this._removeEventListeners();
		this.shadowRoot.innerHTML = `
			<form>
				<label>${esc(this.t('schemaType'))}
					<select data-type="schema-type"${this.locked ? ' disabled' : ''}>
						<option value=""${!type ? ' selected' : ''}>${esc(this.t('chooseType'))}</option>
						${groups}
					</select>
				</label>
				${this._renderPanel()}
			</form>
			<details><summary>${esc(this.t('valueSummary'))}</summary><pre><code></code></pre></details>`;
		this._updatePreview();
		this._addEventListeners();
	}
}

customElements.define('editor-card', EditorCard);

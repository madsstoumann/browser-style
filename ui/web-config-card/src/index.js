import { adoptSharedStyles } from '@browser.style/web-config-shared';
import { schemas, cardTypes } from './schemas.js';

class WebConfigCard extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['value'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
		this._typeLocked = false;
		this.state = {
			type: '',
			data: {}
		};
	}

	async connectedCallback() {
		await adoptSharedStyles(this.shadowRoot);
		this._boundHandleInput = (e) => this._handleInput(e);
		this._boundHandleChange = (e) => this._handleChange(e);
		this._boundHandleClick = (e) => this._handleClick(e);
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;

		if (name === 'value') {
			try {
				const parsed = JSON.parse(newValue);
				if (parsed?.type && cardTypes.includes(parsed.type)) {
					this.state.type = parsed.type;
					this._typeLocked = true;
				}
				this.state.data = parsed || {};
				if (this.state.data.type && cardTypes.includes(this.state.data.type)) {
					this.state.type = this.state.data.type;
					this._typeLocked = true;
				}
				this.render();
			} catch (e) {
				console.error('Invalid JSON value', e);
			}
		}
	}

	get lockType() {
		return this._typeLocked;
	}

	get value() {
		return JSON.stringify({
			type: this.state.type,
			...this.state.data
		});
	}

	set value(val) {
		if (typeof val === 'string') {
			this.setAttribute('value', val);
		} else if (val && typeof val === 'object') {
			this.state.data = val;
			if (val.type && cardTypes.includes(val.type)) {
				this.state.type = val.type;
				this._typeLocked = true;
			}
			this.render();
		}
	}

	_addEventListeners() {
		const form = this.shadowRoot.querySelector('form');
		if (!form) return;

		form.addEventListener('input', this._boundHandleInput);
		form.addEventListener('change', this._boundHandleChange);
		form.addEventListener('click', this._boundHandleClick);
	}

	_removeEventListeners() {
		const form = this.shadowRoot.querySelector('form');
		if (!form) return;

		form.removeEventListener('input', this._boundHandleInput);
		form.removeEventListener('change', this._boundHandleChange);
		form.removeEventListener('click', this._boundHandleClick);
	}

	_handleInput(e) {
		const { target } = e;
		const path = target.dataset.path;
		if (!path) return;

		const value = target.type === 'number' ? Number(target.value) : target.value;
		this._updateData(path, value);
	}

	_handleChange(e) {
		const { target } = e;

		// Handle type selector
		if (target.dataset.type === 'card-type') {
			this._updateType(target.value);
			return;
		}

		// Handle array item inputs (use change for these)
		const path = target.dataset.path;
		const index = target.dataset.index;
		if (path && index !== undefined) {
			const keys = path.split('.');
			let current = this.state.data;
			for (const key of keys) {
				current = current?.[key];
			}
			if (Array.isArray(current)) {
				const newItems = [...current];
				newItems[parseInt(index, 10)] = target.value;
				this._updateData(path, newItems);
			}
		}
	}

	_handleClick(e) {
		const { target } = e;

		// Handle remove button
		if (target.dataset.action === 'remove') {
			const path = target.dataset.path;
			const index = parseInt(target.dataset.index, 10);
			const keys = path.split('.');
			let current = this.state.data;
			for (const key of keys) {
				current = current?.[key];
			}
			if (Array.isArray(current)) {
				this._updateData(path, current.filter((_, i) => i !== index));
				this.render();
			}
			return;
		}

		// Handle add button
		if (target.dataset.action === 'add') {
			const path = target.dataset.path;
			const itemType = target.dataset.itemType;
			const keys = path.split('.');
			let current = this.state.data;
			for (const key of keys) {
				current = current?.[key];
			}
			const items = Array.isArray(current) ? current : [];
			this._updateData(path, [...items, itemType === 'object' ? {} : '']);
			this.render();
		}
	}

	_updateType(newType) {
		this.state.type = newType;
		if (!this.state.data) this.state.data = {};
		this.state.data.type = newType;
		this._emitChange();
		this.render();
	}

	_updateData(path, value) {
		const keys = path.split('.');
		let current = this.state.data;

		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) current[keys[i]] = {};
			current = current[keys[i]];
		}

		current[keys[keys.length - 1]] = value;
		this._emitChange();
	}

	_emitChange() {
		const val = this.value;
		this._internals.setFormValue(val);
		this._updateOutput();
		this.dispatchEvent(new CustomEvent('change', { detail: { type: this.state.type, ...this.state.data }, bubbles: true, composed: true }));
		this.dispatchEvent(new CustomEvent('input', { detail: { type: this.state.type, ...this.state.data }, bubbles: true, composed: true }));
	}

	_updateOutput() {
		const code = this.shadowRoot.querySelector('code');
		if (code) {
			const output = this.state.type ? { type: this.state.type, ...this.state.data } : {};
			code.textContent = JSON.stringify(output, null, 2);
		}
	}

	_renderField(key, schema, value, path) {
		const label = schema.title || key;
		const placeholder = schema.placeholder ? ` placeholder="${schema.placeholder}"` : '';

		if (schema.type === 'string') {
			if (schema.enum) {
				const options = schema.enum.map(opt =>
					`<option value="${opt}"${value === opt ? ' selected' : ''}>${opt}</option>`
				).join('');
				return `
					<label>${label}
						<select data-path="${path}">
							<option value="">Select...</option>
							${options}
						</select>
					</label>`;
			}
			const type = schema.format === 'date' ? 'date' : 'text';
			return `
				<label>${label}
					<input type="${type}" value="${value || ''}" data-path="${path}"${placeholder}>
				</label>`;
		}

		if (schema.type === 'number') {
			return `
				<label>${label}
					<input type="number" value="${value || ''}" data-path="${path}"${placeholder}>
				</label>`;
		}

		if (schema.type === 'object') {
			return Object.entries(schema.properties).map(([propKey, propSchema]) => {
				const propPath = path ? `${path}.${propKey}` : propKey;
				const propValue = value?.[propKey];
				return this._renderField(propKey, propSchema, propValue, propPath);
			}).join('');
		}

		if (schema.type === 'array') {
			const items = value || [];
			const itemPlaceholder = schema.items?.placeholder ? ` placeholder="${schema.items.placeholder}"` : '';
			const itemTitle = schema.itemTitle || 'Item';
			const isLastItem = (index) => index === items.length - 1;
			const itemsHtml = items.map((item, index) => {
				const addButton = isLastItem(index)
					? `<button type="button" data-action="add" data-path="${path}" data-item-type="${schema.items.type}">Add ${itemTitle.toLowerCase()}</button>`
					: '';
				if (schema.items.type === 'object') {
					const objectFields = Object.entries(schema.items.properties).map(([k, s]) =>
						this._renderField(k, s, item[k], `${path}.${index}.${k}`)
					).join('');
					return `
						<div>
							<h4>${itemTitle} ${index + 1}</h4>
							${objectFields}
							<fieldset>
								<button type="button" data-action="remove" data-path="${path}" data-index="${index}">Remove ${itemTitle.toLowerCase()}</button>
								${addButton}
							</fieldset>
						</div>`;
				}
				return `
					<div>
						<label>${label}
							<input type="text" value="${item}" data-path="${path}" data-index="${index}"${itemPlaceholder}>
						</label>
						<fieldset>
							<button type="button" data-action="remove" data-path="${path}" data-index="${index}">Remove</button>
							${addButton}
						</fieldset>
					</div>`;
			}).join('');

			// If no items yet, show just the Add button
			const emptyHtml = items.length === 0 ? `
				<fieldset>
					<button type="button" data-action="add" data-path="${path}" data-item-type="${schema.items.type}">Add ${itemTitle.toLowerCase()}</button>
				</fieldset>` : '';

			return `
				<div>
					<h3>${label}</h3>
					${itemsHtml}
					${emptyHtml}
				</div>`;
		}

		return '';
	}

	render() {
		if (!schemas) {
			this.shadowRoot.innerHTML = `<div class="error">Error: Schemas not loaded</div>`;
			return;
		}

		const type = this.state.type;
		const typeSchema = type ? schemas[type] : null;
		const typeOptions = cardTypes.map(t =>
			`<option value="${t}"${type === t ? ' selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
		).join('');

		let fieldsHtml = '';
		if (typeSchema) {
			const typeData = this.state.data[type] || {};
			fieldsHtml = Object.entries(typeSchema.properties).map(([key, schema]) =>
				this._renderField(key, schema, typeData[key], `${type}.${key}`)
			).join('');
		}

		const outputJson = JSON.stringify(type ? { type: this.state.type, ...this.state.data } : {}, null, 2);

		const disabledAttr = this.lockType ? ' disabled' : '';

		this._removeEventListeners();

		this.shadowRoot.innerHTML = `
			<form>
				<div>
					<label>Card Type
						<select data-type="card-type"${disabledAttr}>
							<option value=""${!type ? ' selected' : ''}>Choose card type...</option>
							<hr>
							${typeOptions}
						</select>
					</label>
				</div>
				${typeSchema ? `
					<div>
						<h2>${type}</h2>
						${fieldsHtml}
					</div>
				` : ''}
			</form>
			<details><summary>Value</summary><pre><code>${outputJson}</code></pre></details>`;

		this._addEventListeners();
	}
}

customElements.define('web-config-card', WebConfigCard);

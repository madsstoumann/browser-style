import { FormElement } from '../common/form.element.js';

export class TextImport extends FormElement {
	static defaultAccept = '.txt';
	static defaultLabel = 'Select file';
	
	#state = {
		elements: {},
		fileContent: '',
		separator: ',',
		firstrow: true,
		mapping: null
	};
	
	#converters = {
		int: value => parseInt(value, 10) || null,
		date: value => {
			const [month, day, year] = value.split('/');
			return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		},
		float: value => parseFloat(value) || null
	};

	#formatters = {
		titleCase: str => str.toLowerCase().replace(/\b\w+/g, word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		)
	};

	constructor() {
		super();
		this.uid = this.uuid();
		this.accept = this.getAttribute('accept') || TextImport.defaultAccept;
		this.label = this.getAttribute('label') || TextImport.defaultLabel;
		this.required = this.hasAttribute('required');
		
		const mappingAttr = this.getAttribute('mapping');
		if (mappingAttr) {
			try {
				this.#state.mapping = JSON.parse(mappingAttr);
			} catch (error) {
				console.warn('Invalid mapping JSON:', error);
			}
		}
	}

	get converters() { return this.#converters; }
	set converters(newConverters) {
		this.#converters = { ...this.#converters, ...newConverters };
	}

	get formatters() { return this.#formatters; }
	set formatters(newFormatters) {
		this.#formatters = { ...this.#formatters, ...newFormatters };
		this.initialized && this.#updateDataLists();
	}

	get customMapping() { return this.#state.mapping; }
	set customMapping(mapping) {
		this.#state.mapping = mapping;
		const mappingEl = this.#state.elements.mapping;
		mappingEl?.hasAttribute('popover-open') && this.#applyCustomMapping();
	}

	initializeComponent() {
		const elements = this.#state.elements;
		elements.input = this.querySelector('[part~=file]');
		if (!elements.input) {
			console.warn('TextImport: No file input found. Add an input with part="file".');
			return;
		}

		const firstRowCheckbox = this.querySelector('[part~=firstrow]');
		this.#state.firstrow = firstRowCheckbox ? firstRowCheckbox.checked : true;
		firstRowCheckbox?.addEventListener('change', e => this.#state.firstrow = e.target.checked);

		this.root.innerHTML = this.#getTemplate();
		elements.mapping = this.root.querySelector(`#mapping${this.uid}`);
		
		this.#updateDataLists();
		this.#setupEventListeners();
	}

	#updateDataLists() {
		const lists = {
			converters: Object.keys(this.#converters),
			formatters: Object.keys(this.#formatters)
		};

		Object.entries(lists).forEach(([type, keys]) => {
			const list = this.root.querySelector(`#${type}${this.uid}`);
			list.innerHTML = keys.map(key => `<option value="${key}">`).join('');
		});
	}

	async #processFile(file) {
		try {
			const text = await file.text();
			const lines = text.trim().split('\n');
			this.#state.separator = text.includes('\t') ? '\t' : ',';
			
			const headers = this.#getHeaders(lines);
			if (!headers.length) throw new Error('No headers found in file');
			
			this.#renderMapping(headers);
			const { mapping, input } = this.#state.elements;
			
			mapping.togglePopover(true);
			input.value = '';
			input.toggleAttribute('inert', true);
			
			this.#state.fileContent = this.#state.firstrow ? lines.slice(1).join('\n') : lines.join('\n');
		} catch (error) {
			console.error('Error processing file:', error);
			this.dispatchEvent(new CustomEvent('ti:error', { 
				detail: { message: error.message },
				bubbles: true
			}));
		}
	}

	#getHeaders(lines) {
		if (!lines.length) return [];
		if (this.#state.firstrow) return lines[0].split(this.#state.separator);
		const columnCount = lines[0].split(this.#state.separator).length;
		return Array.from({ length: columnCount }, (_, i) => `COL ${i + 1}`);
	}

	#processMapping(mappings) {
		const mappingsByTarget = new Map();
		mappings.forEach(mapping => {
			if (!mappingsByTarget.has(mapping.target)) {
				mappingsByTarget.set(mapping.target, []);
			}
			mappingsByTarget.get(mapping.target).push(mapping);
		});

		return this.#state.fileContent.trim().split('\n')
			.map(line => {
				const values = line.split(this.#state.separator);
				const row = {};

				mappingsByTarget.forEach((targetMappings, target) => {
					row[target] = this.#processTargetField(targetMappings, values);
				});

				return Object.fromEntries(
					Object.entries(row).sort(([a], [b]) => a.localeCompare(b))
				);
			});
	}

	#processTargetField(mappings, values) {
		if (mappings.length === 1) {
			const mapping = mappings[0];
			const idx = this.#getFieldIndex(mapping.source);
			return idx > -1 ? this.#convertField(values[idx], mapping) : null;
		}

		const parts = mappings
			.sort((a, b) => a.order - b.order)
			.map(mapping => {
				const idx = this.#getFieldIndex(mapping.source);
				return idx > -1 ? this.#convertField(values[idx], mapping) : '';
			})
			.filter(Boolean);

		return parts.length ? parts.join('\n') : null;
	}

	#convertField(value, mapping) {
		if (!value?.trim()) return null;
		
		const converted = mapping.type ? 
			this.#converters[mapping.type]?.(value.trim()) ?? value.trim() : 
			value.trim();
			
		const formatted = mapping.formatter ? 
			this.#formatters[mapping.formatter]?.(converted) ?? converted : 
			converted;
			
		return mapping.prefix || mapping.suffix ? 
			`${mapping.prefix || ''}${formatted}${mapping.suffix || ''}` : 
			formatted;
	}

	#getFieldIndex(sourceName) {
		if (!this.#state.firstrow) {
			return parseInt(sourceName.split(' ')[1]) - 1;
		}
		const headers = this.#state.elements.mapping.querySelectorAll('[part~="mapping-header"]');
		return Array.from(headers).findIndex(h => h.textContent === sourceName);
	}

	#setupEventListeners() {
		const { input, mapping } = this.#state.elements;
		
		input?.addEventListener('change', e => {
			const file = e.target.files[0];
			file && this.#processFile(file);
		});

		if (mapping) {
			mapping.addEventListener('beforetoggle', e => {
				input.toggleAttribute('inert', e.newState === 'open');
			});

			this.addEventListener('ti:close', () => mapping.togglePopover(false));
		}
	}

	#renderMapping(headers) {
		const mappingEl = this.#state.elements.mapping;
		mappingEl.innerHTML = `
			<button type="button" part="close">
				${this.icon('M18 6l-12 12,M6 6l12 12', 'icon')}
			</button>
			<ul part="mapping-content">
				${headers.map(header => `
					<li part="mapping-row">
						<span part="mapping-header">${header}</span>
						<input type="text" part="mapping-input" data-source="${header}" placeholder="target">
						<input type="text" part="mapping-input" list="converters${this.uid}" placeholder="type">
						<input type="text" part="mapping-input" list="formatters${this.uid}" placeholder="formatter">
						<input type="text" part="mapping-input" placeholder="prefix">
						<input type="text" part="mapping-input" placeholder="suffix">
					</li>
				`).join('')}
			</ul>
			<nav part="mapping-nav">
				<button type="button" part="preview">Preview</button>
				<button type="button" part="process">Process</button>
			</nav>
			<pre part="output" hidden></pre>
		`;

		const elements = {
			close: mappingEl.querySelector('[part~=close]'),
			preview: mappingEl.querySelector('[part~=preview]'),
			process: mappingEl.querySelector('[part~=process]'),
			output: mappingEl.querySelector('[part~=output]')
		};

		elements.close?.addEventListener('click', () => 
			mappingEl.togglePopover(false));
		
		elements.preview?.addEventListener('click', () => {
			const tempContent = this.#state.fileContent;
			this.#state.fileContent = this.#state.fileContent.split('\n')[0];

			const mappings = this.#getCurrentMappings();
			const previewData = this.#processMapping(mappings);

			if (previewData.length > 0) {
				elements.output.textContent = JSON.stringify(previewData[0], null, 2);
				elements.output.hidden = false;
			}

			this.#state.fileContent = tempContent;
		});
		
		elements.process?.addEventListener('click', () => {
			const mappings = this.#getCurrentMappings();
			const processedData = this.#processMapping(mappings);

			this.dispatchEvent(new CustomEvent('ti:processed', { 
				detail: processedData,
				bubbles: true
			}));

			if (processedData.length > 0) {
				elements.output.textContent = JSON.stringify(processedData[0], null, 2);
				elements.output.hidden = false;
			}
		});

		this.#state.mapping && this.#applyCustomMapping();
	}

	#getCurrentMappings() {
		const mappingsByTarget = new Map();
		const rows = this.#state.elements.mapping.querySelectorAll('[part~=mapping-row]');
		
		rows.forEach(row => {
			const [target, type, formatter, prefix, suffix] = 
				row.querySelectorAll('[part~=mapping-input]');
			
			if (target.value) {
				const [targetField, orderStr] = target.value.split('|');
				const order = parseInt(orderStr, 10) || 0;
				
				const mapping = {
					source: target.dataset.source,
					target: targetField,
					order
				};
				
				if (type.value) mapping.type = type.value;
				if (formatter.value) mapping.formatter = formatter.value;
				if (prefix.value || suffix.value) {
					mapping.prefix = prefix.value;
					mapping.suffix = suffix.value;
				}
				
				if (!mappingsByTarget.has(targetField)) {
					mappingsByTarget.set(targetField, []);
				}
				mappingsByTarget.get(targetField).push(mapping);
			}
		});
		
		return Array.from(mappingsByTarget.values()).flat();
	}

	#applyCustomMapping() {
		const { mapping } = this.#state;
		if (!mapping) return;
		
		const rows = this.#state.elements.mapping.querySelectorAll('[part~=mapping-row]');
		rows.forEach(row => {
			const [target, type, formatter, prefix, suffix] = 
				row.querySelectorAll('[part~=mapping-input]');
			const source = target.dataset.source;
			
			const sourceMapping = mapping.find(m => m.source === source);
			if (sourceMapping) {
				target.value = sourceMapping.order ? 
					`${sourceMapping.target}|${sourceMapping.order}` : 
					sourceMapping.target;
				type.value = sourceMapping.type || '';
				formatter.value = sourceMapping.formatter || '';
				prefix.value = sourceMapping.prefix || '';
				suffix.value = sourceMapping.suffix || '';
			}
		});
	}

	#getTemplate() {
		return `
			<slot></slot>
			<datalist id="converters${this.uid}"></datalist>
			<datalist id="formatters${this.uid}"></datalist>
			<fieldset id="mapping${this.uid}" part="mapping" popover="manual"></fieldset>
		`;
	}

	formReset() {
		super.value = '';
		this.#state.elements.input.value = '';
	}
}

TextImport.register();
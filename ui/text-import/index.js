import { FormElement } from '../common/form.element.js';

/**
 * TextImport
 * @description Web Component that converts TSV or CSV files, with a custom mapping, into JSON objects.
 * @author Mads Stoumann
 * @version 1.0.0
 * @summary 13-02-2025
 * @class TextImport
 * @extends {FormElement}
 */
export class TextImport extends FormElement {
	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	#elements = {};
	#state = {
		accept: '.txt',
		label: 'Select file',
		required: false,
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

	get converters() {
		return this.#converters;
	}

	set converters(newConverters) {
		this.#converters = { ...this.#converters, ...newConverters };
	}

	get formatters() {
		return this.#formatters;
	}

	set formatters(newFormatters) {
		this.#formatters = { 
			...this.#formatters,
			...newFormatters
		};
		
		// Update datalist if component is initialized
		if (this.initialized) {
			this.#populateDataLists();
		}
	}

	get customMapping() {
		return this.#state.mapping;
	}

	set customMapping(mapping) {
		this.#state.mapping = mapping;
		if (this.#elements.mapping?.hasAttribute('popover-open')) {
			this.#applyCustomMapping();
		}
	}

	constructor() {
		super();
		this.#state.uid = this.uuid();
		this.#state.accept = this.getAttribute('accept') || this.#state.accept;
		this.#state.label = this.getAttribute('label') || this.#state.label;
		this.#state.required = this.hasAttribute('required');
		const mappingAttr = this.getAttribute('mapping');
		if (mappingAttr) {
			try {
				this.#state.mapping = JSON.parse(mappingAttr);
			} catch (error) {
				console.warn('Invalid mapping JSON:', error);
			}
		}
	}

	initializeComponent() {
		this.root.innerHTML = this.template();
		this.#elements.mapping = this.root.querySelector(`#popover${this.#state.uid}`);
		this.#elements.input = this.root.querySelector('[part~=file]');
		this.#populateDataLists();
		this.addEvents();

		// Add beforetoggle event listener
		this.#elements.mapping?.addEventListener('beforetoggle', (e) => {
			const isOpening = e.newState === 'open';
			this.#elements.input.toggleAttribute('inert', isOpening);
		});
	}

	async #processFile(file) {
		try {
			const text = await file.text();
			const lines = text.trim().split('\n');
			const separator = text.includes('\t') ? '\t' : ',';
			const headers = lines[0].split(separator);
			
			if (headers.length > 0) {
				this.#renderMapping(headers);
				this.#elements.mapping.togglePopover(true);
				this.#elements.input.value = '';
				this.#elements.input.toggleAttribute('inert', true);
			}
			
			this.#state.fileContent = text;
			this.#state.separator = separator;
		} catch (error) {
			console.error('Error processing file:', error);
		}
	}

	#populateDataLists() {
		const convertersList = this.root.querySelector(`#converters${this.#state.uid}`);
		const formattersList = this.root.querySelector(`#formatters${this.#state.uid}`);

		convertersList.innerHTML = Object.keys(this.#converters)
			.map(key => `<option value="${key}">`).join('');
		
		formattersList.innerHTML = Object.keys(this.#formatters)
			.map(key => `<option value="${key}">`).join('');
	}

	#renderMapping(headers) {
		const mappingHtml = `
			<button type="button" part="close">
				${this.icon('M18 6l-12 12,M6 6l12 12', 'icon')}
			</button>
			<ul part="mapping-content">
				${headers.map(header => `
					<li part="mapping-row">
						<span part="mapping-header">${header}</span>
						<input type="text" part="mapping-input" data-source="${header}" placeholder="target">
						<input type="text" part="mapping-input" list="converters${this.#state.uid}" placeholder="type">
						<input type="text" part="mapping-input" list="formatters${this.#state.uid}" placeholder="formatter">
						<input type="text" part="mapping-input" name="prefix" placeholder="prefix">
						<input type="text" part="mapping-input" name="suffix" placeholder="suffix">
					</label>
				`).join('')}
			</ul>
			<button type="button" part="process">Process mapping</button>
			<pre part="output" hidden></pre>
		`;
		this.#elements.mapping.innerHTML = mappingHtml;
		this.#setMappingElements();
		if (this.#state.mapping) {
			this.#applyCustomMapping();
		}
	}

	#setMappingElements() {
		this.#elements.close = this.#elements.mapping.querySelector('[part~=close]');
		this.#elements.process = this.#elements.mapping.querySelector('[part~=process]');
		this.#elements.output = this.#elements.mapping.querySelector('[part~=output]');
		
		this.#elements.close?.addEventListener('click', () => 
			this.#elements.mapping.togglePopover(false));
		
		this.#elements.process?.addEventListener('click', () => {
			const mappingsByTarget = new Map();
			const rows = this.#elements.mapping.querySelectorAll('[part~=mapping-row]');
			
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
			
			// Sort mappings by order for each target
			mappingsByTarget.forEach(mappings => 
				mappings.sort((a, b) => a.order - b.order));
			
			const finalMappings = Array.from(mappingsByTarget.values())
				.flat();
			
			const processedData = this.#processMapping(finalMappings);
			console.log('Processed Data:', processedData);
			// Show first item in formatted JSON
			if (processedData.length > 0) {
				this.#elements.output.textContent = JSON.stringify(processedData[0], null, 2);
				this.#elements.output.hidden = false;
				// Removed: this.#elements.mapping.togglePopover(false);
			}
		});
	}

	#applyCustomMapping() {
		if (!this.#state.mapping) return;
		
		const inputs = this.#elements.mapping.querySelectorAll('[part~=mapping-row]');
		inputs.forEach(row => {
			const [target, type, formatter, prefix, suffix] = 
				row.querySelectorAll('[part~=mapping-input]');
			const source = target.dataset.source;
			
			const mapping = this.#state.mapping.find(m => m.source === source);
			
			if (mapping) {
				target.value = mapping.order ? 
					`${mapping.target}|${mapping.order}` : 
					mapping.target;
				type.value = mapping.type || '';
				formatter.value = mapping.formatter || '';
				prefix.value = mapping.prefix || '';
				suffix.value = mapping.suffix || '';
			}
		});
	}

	#convertValue(value, type, formatter) {
		if (!value) return null;
		const converted = type ? this.#converters[type]?.(value) ?? value : value;
		return formatter ? this.#formatters[formatter]?.(converted) ?? converted : converted;
	}

	#processMapping(mappings) {
		const lines = this.#state.fileContent.trim().split('\n');
		const headers = lines[0].split(this.#state.separator);
		const result = [];

		// Group mappings by target field
		const mappingsByTarget = new Map();
		mappings.forEach(mapping => {
			if (!mappingsByTarget.has(mapping.target)) {
				mappingsByTarget.set(mapping.target, []);
			}
			mappingsByTarget.get(mapping.target).push(mapping);
		});

		// Process each line
		lines.slice(1).forEach(line => {
			const values = line.split(this.#state.separator);
			const row = {};

			mappingsByTarget.forEach((targetMappings, target) => {
				if (targetMappings.length === 1) {
					// Single field mapping
					const mapping = targetMappings[0];
					const idx = headers.indexOf(mapping.source);
					if (idx > -1) {
						const value = this.#convertValue(values[idx], mapping.type, mapping.formatter);
						if (mapping.prefix || mapping.suffix) {
							row[target] = value ? `${mapping.prefix || ''}${value}${mapping.suffix || ''}` : null;
						} else {
							row[target] = value;
						}
					}
				} else {
					// Multiple fields mapping to same target (ordered by mapping.order)
					const parts = targetMappings
						.sort((a, b) => a.order - b.order)
						.map(mapping => {
							const idx = headers.indexOf(mapping.source);
							if (idx > -1) {
								const value = this.#convertValue(values[idx], mapping.type, mapping.formatter);
								return value ? `${mapping.prefix || ''}${value}${mapping.suffix || ''}` : '';
							}
							return '';
						})
						.filter(Boolean);

					row[target] = parts.length ? parts.join('\n') : null;
				}
			});

			result.push(row);
		});

		return result;
	}

	addEvents() {
		this.#elements.input?.addEventListener('change', e => {
			const file = e.target.files[0];
			if (file) {
				this.#processFile(file);
			}
		});
	}

	template() {
		return `
			<label part="row">
				<span part="label">${this.#state.label}${this.#state.required ? '<abbr title="required" part="abbr">*</abbr>' : ''}</span>
				<input type="file" name="file" accept="${this.#state.accept}" part="file">
			</label>
			<datalist id="converters${this.#state.uid}"></datalist>
			<datalist id="formatters${this.#state.uid}"></datalist>
			<fieldset id="popover${this.#state.uid}" part="mapping" popover="manual"></fieldset>
		`;
	}

	formReset() {
		super.value = '';
		this.input.value = '';
	}
}

TextImport.register();

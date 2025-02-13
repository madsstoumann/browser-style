export class TextImport extends HTMLElement {
	#initialized = false;
	#shadow;
	#styles = `
		:host *, :host *::after, :host *::before { box-sizing: border-box; }
		:host {
			--accent-color: light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%));
			--accent-color-text: hsl(211, 100%, 95%);
			--grey-light: #f3f3f3;
			--grey-dark: #333;
			--text-import-button-bg: light-dark(var(--grey-light), var(--grey-dark));
		}
		:host::part(close) {
			background: #0000;
			border: 0;
			border-radius: 50%;
			block-size: 3.5rem;
			color: inherit;
			font-size: 1.5rem;
			grid-row: 1;
			inline-size: 3.5rem;
			padding: 1rem;
			place-self: start end;
		}
		:host::part(close):hover {
			background: var(--text-import-button-bg);
			outline: none;
		}
		:host::part(icon) {
			aspect-ratio: 1;
			block-size: 1em;
			fill: none;
			pointer-events: none;
			stroke: currentColor;
			stroke-linecap: round;
			stroke-linejoin: round;
			stroke-width: 2;
		}
		:host::part(mapping) {
			align-content: start;
			background: Canvas;
			border: 0;
			color: CanvasText;
			height: 100dvh;
			inset: 0;
			padding: 1rem;
			width: 100vw;
		}
		:host::part(mapping):popover-open {
			display: grid;
		}
		:host::part(mapping-content) {
			display: grid;
			font-family: ui-monospace, monospace;
			font-size: small;
			column-gap: .5rem;
			row-gap: .25rem;
			grid-template-columns: 150px 150px 90px 110px 175px 175px;
			justify-self: center;
			max-width: 1024px;
			padding: 0;
		}
		:host::part(mapping-header) {
			overflow: hidden;
			text-overflow: ellipsis;
		}
		:host::part(mapping-input) {
			background: var(--text-import-input-bg, light-dark(var(--grey-light), var(--grey-dark)));
			border: 0;
			font-family: inherit;
			padding-inline: 1ch;
		}
		:host::part(mapping-input):focus-visible {
			background: var(--text-import-close-bg, light-dark(var(--grey-dark), var(--grey-light)));
			color: Canvas;
			outline: none;
		}
		:host::part(mapping-nav) {
			display: flex;
			gap: 1rem;
			justify-content: center;
		}
		:host::part(mapping-row) {
			display: contents;
		}
		:host::part(output) {
			background: var(--grey-dark);
			border-radius: 4px;
			color: var(--grey-light);
			font-size: .875rem;
			justify-self: center;
			max-width: 900px;
			padding: 1rem;
			white-space: pre-wrap;
		}
		:host::part(preview),
		:host::part(process) {
			background: var(--text-import-button-bg);
			border: 0;
			border-radius: .25rem;
			color: inherit;
			padding: 0.75rem 1.25rem;
		}
		:host::part(preview):hover {
			background: color-mix(in oklab, var(--text-import-button-bg), #000 10%);
		}
		:host::part(process) {
			background-color: var(--accent-color);
			color: var(--accent-color-text);
		}
		:host::part(process):hover {
			background-color: color-mix(in oklab, var(--accent-color), #000 10%);
		}
		input::placeholder {
			color: var(--text-import-input-placeholder, light-dark(#CCC, #777));
		}
	`;

	static defaultAccept = '.txt';
	static defaultLabel = 'Select file';
	
	#state = {
		content: '',
		elements: {},
		separator: ',',
		firstrow: true,
		mapping: null
	};
	
	#converters = {
		boolean: value => {
			const truthyValues = ['true', '1', 'yes', 'y'];
			const falsyValues = ['false', '0', 'no', 'n'];
			value = value.toLowerCase().trim();
			return truthyValues.includes(value) ? true : 
				falsyValues.includes(value) ? false : null;
		},
		date: value => {
			const [month, day, year] = value.split('/');
			return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		},
		float: value => parseFloat(value) || null,
		int: value => parseInt(value, 10) || null,
		number: value => {
			const num = Number(value);
			return !isNaN(num) ? num : null;
		}
	};

	#formatters = {
		capitalize: str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
		currency: str => {
			const num = parseFloat(str);
			return !isNaN(num) ? num.toFixed(2) : null;
		},
		lowercase: str => str.toLowerCase(),
		percentage: str => {
			const num = parseFloat(str);
			return !isNaN(num) ? `${num}%` : null;
		},
		removeSpaces: str => str.replace(/\s+/g, ''),
		slugify: str => str.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, ''),
		titleCase: str => str.toLowerCase().replace(/\b\w+/g, word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		),
		trim: str => str.trim(),
		truncate: str => str.length > 100 ? str.substring(0, 97) + '...' : str,
		uppercase: str => str.toUpperCase(),
	};

	constructor() {
		super();
		this.#shadow = this.attachShadow({ mode: 'open' });
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(this.#styles);
		this.#shadow.adoptedStyleSheets = [sheet];

		if (!this.hasAttribute('nomount')) {
			this.#initialize();
		}
	}

	get initialized() { return this.#initialized; }

	async #initialize() {
		if (this.#initialized) return;
		
		this.uid = crypto.getRandomValues(new Uint8Array(4))
			.reduce((acc, val) => acc + val.toString(36).padStart(2, '0'), '');
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

		await this.initializeComponent();
		this.#initialized = true;
	}

	async mount() {
		if (!this.#initialized) {
			await this.#initialize();
		}
	}

	async initializeComponent() {
		const elements = this.#state.elements;
		elements.input = this.querySelector('[part~=file]');
		if (!elements.input) {
			console.warn('TextImport: No file input found. Add an input with part="file".');
			return;
		}

		const firstRowCheckbox = this.querySelector('[part~=firstrow]');
		this.#state.firstrow = firstRowCheckbox ? firstRowCheckbox.checked : true;
		firstRowCheckbox?.addEventListener('change', e => this.#state.firstrow = e.target.checked);

		this.#shadow.innerHTML = this.#getTemplate();
		elements.mapping = this.#shadow.querySelector(`#mapping${this.uid}`);
		
		this.#updateDataLists();
		this.#setupEventListeners();
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

	#updateDataLists() {
		const lists = {
			converters: Object.keys(this.#converters),
			formatters: Object.keys(this.#formatters)
		};

		Object.entries(lists).forEach(([type, keys]) => {
			const list = this.#shadow.querySelector(`#${type}${this.uid}`);
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
			
			this.#state.content = this.#state.firstrow ? lines.slice(1).join('\n') : lines.join('\n');
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

		return this.#state.content.trim().split('\n')
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
				<svg viewBox="0 0 24 24" part="icon">
					<path d="M18 6l-12 12"></path>
					<path d="M6 6l12 12"></path>
				</svg>
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
			const tempContent = this.#state.content;
			this.#state.content = this.#state.content.split('\n')[0];

			const mappings = this.#getCurrentMappings();
			const previewData = this.#processMapping(mappings);

			if (previewData.length > 0) {
				elements.output.textContent = JSON.stringify(previewData[0], null, 2);
				elements.output.hidden = false;
			}

			this.#state.content = tempContent;
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

	static register() {
		const name = this.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		if (!customElements.get(name)) customElements.define(name, this);
	}
}

TextImport.register();
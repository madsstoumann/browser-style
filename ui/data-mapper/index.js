import { dataFormats, mimeTypes, inputParsers } from './dataformats.js';

export class DataMapper extends HTMLElement {
	#icons = {
		arrowright: 'M7 12l14 0, M18 15l3 -3l-3 -3, M3 10h4v4h-4z',
		clipboard: 'M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2, M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 0 0 1 -2 -2z',
		download: 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2, M7 11l5 5l5 -5, M12 4l0 12',
		import: 'M3.32 12.774l7.906 7.905c.427 .428 1.12 .428 1.548 0l7.905 -7.905a1.095 1.095 0 0 0 0 -1.548l-7.905 -7.905a1.095 1.095 0 0 0 -1.548 0l-7.905 7.905a1.095 1.095 0 0 0 0 1.548z, M8 12h7.5, M12 8.5l3.5 3.5l-3.5 3.5',
		preview: 'M4 8v-2a2 2 0 0 1 2 -2h2, M4 16v2a2 2 0 0 0 2 2h2, M16 4h2a2 2 0 0 1 2 2v2, M16 20h2a2 2 0 0 0 2 -2v-2, M7 12c3.333 -4.667 6.667 -4.667 10 0, M7 12c3.333 4.667 6.667 4.667 10 0, M12 12h-.01'
	}

	static #SLUGIFY_PATTERN = /[^a-z0-9]+/g;
	static #TRIM_PATTERN = /^-+|-+$/g;
	static #WORD_PATTERN = /\b\w+/g;

	#initialized = false;
	#shadow;
	#styles = `
		:host *, :host *::after, :host *::before { box-sizing: border-box; }
		:host {
			--accent-color: light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%));
			--accent-color-text: hsl(211, 100%, 95%);
			--grey-light: #f3f3f3;
			--grey-dark: #333;
			--data-mapper-button-bg: light-dark(hsl(0, 0%, 90%), hsl(0, 0%, 40%));
			--CanvasText: light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%));

			color: var(--CanvasText);
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
			background: var(--data-mapper-button-bg);
			outline: none;
		}
		:host::part(icon) {
			aspect-ratio: 1;
			block-size: 24px;
			fill: none;
			pointer-events: none;
			stroke: currentColor;
			stroke-linecap: round;
			stroke-linejoin: round;
			stroke-width: 1.5;
		}
		:host::part(mapping) {
			align-content: start;
			background: Canvas;
			border: 0;
			color: inherit;
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
			grid-template-columns: 150px 1fr 90px 110px 175px 175px;
			padding: 0;
		}
		:host::part(mapping-header) {
			overflow: hidden;
			text-overflow: ellipsis;
		}
		:host::part(mapping-input) {
			background: var(--data-mapper-input-bg, light-dark(var(--grey-light), var(--grey-dark)));
			border: 0;
			font-family: inherit;
			padding-inline: 1ch;
		}
		:host::part(mapping-input):focus-visible {
			background: var(--data-mapper-close-bg, light-dark(var(--grey-dark), var(--grey-light)));
			color: Canvas;
			outline: none;
		}
		:host::part(mapping-nav) {
			align-items: center;
			display: flex;
			gap: .75ch;
			justify-content: end;
		}
		:host::part(mapping-row) {
			display: contents;
		}
		:host::part(mapping-thead) {
			display: contents;
		}
		:host::part(mapping-wrapper) {
			justify-self: center;
			max-width: 950px;
		}
		:host::part(numobjects) {
			color: var(--accent-color);
			margin-inline-end: auto;
		}
		:host::part(output) {
			background: var(--grey-dark);
			border-radius: 4px;
			color: var(--grey-light);
			font-size: .75rem;
			line-height: 1.6;
			padding: 1em;
			white-space: pre-wrap;
		}
		:host::part(outputformat) {
			background: var(--data-mapper-button-bg);
			border: 0;
			border-radius: .25rem;
			color: inherit;
			height: 26px;
			padding: 0 .5ch 0 1ch;
		}
		:host::part(button) {
			aspect-ratio: 1;
			background: var(--data-mapper-button-bg);
			border: 0;
			border-radius: .25rem;
			color: inherit;
			height: 26px;
			padding: 0;
			width: 26px;
		}
		:host::part(button):hover {
			background: color-mix(in oklab, var(--data-mapper-button-bg), var(--CanvasText) 25%);
		}
		:host::part(import) {
			background-color: var(--accent-color);
			color: var(--accent-color-text);
		}
		:host::part(import):hover {
			background-color: color-mix(in oklab, var(--accent-color), #000 10%);
		}
		input::placeholder {
			color: var(--data-mapper-input-placeholder, light-dark(#CCC, #777));
		}
	`;

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
			.replace(DataMapper.#SLUGIFY_PATTERN, '-')
			.replace(DataMapper.#TRIM_PATTERN, ''),
		titleCase: str => str.toLowerCase().replace(
			DataMapper.#WORD_PATTERN, 
			word => word[0].toUpperCase() + word.slice(1)
		),
		trim: str => str.trim(),
		truncate: str => str.length > 100 ? str.substring(0, 97) + '...' : str,
		uppercase: str => str.toUpperCase(),
	};

	#i18n = {
		en: {
			download: 'Download',
			import: 'Import',
			formatter: 'Formatter',
			numObjects: 'Number of objects: ',
			prefix: 'Prefix',
			preview: 'Preview',
			source: 'Source',
			suffix: 'Suffix',
			target: 'Target',
			type: 'Type',
			updateTargets: 'Use Source Names as Targets'
		}
	};

	#lang = 'en';
	#state = {
		concatenator: '\n',
		content: '',
		elements: {
			close: null,
			import: null,
			input: null,
			mapping: null,
			numObjects: null,
			output: null,
			preview: null,
			updateTarget: null
		},
		firstrow: true,
		mapping: null,
		outputData: null,
		separator: null
	};

	static defaultAccept = '.csv,.json,.ndjson,.tsv,,txt,.xml,.yaml,.yml';
	static defaultLabel = 'Select file';

	constructor() {
		super();
		this.#lang = this.getAttribute('lang') || 'en';
		this.#state.concatenator = this.getAttribute('separator') || '\n';
		this.#shadow = this.attachShadow({ mode: 'open' });
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(this.#styles);
		this.#shadow.adoptedStyleSheets = [sheet];

		if (!this.hasAttribute('nomount')) {
			this.#initialize();
		}
	}

	// Getters & Setters
	get converters() { return this.#converters; }
	get customMapping() { return this.#state.mapping; }
	get formatters() { return this.#formatters; }
	get initialized() { return this.#initialized; }
	get content() { return this.#state.content; }
	set content(value) { 
		this.#state.content = value;
		this.#state.separator = value.includes('\t') ? '\t' : ',';
	}

	get outputData() { return this.#state.outputData; }
	set outputData(data) { 
		if (Array.isArray(data) && data.length > 0) {
			this.#state.outputData = data;
		}
	}

	set converters(newConverters) {
		this.#converters = { ...this.#converters, ...newConverters };
	}
	set customMapping(mapping) {
		this.#state.mapping = mapping;
		const mappingEl = this.#state.elements.mapping;
		mappingEl?.hasAttribute('popover-open') && this.#applyCustomMapping();
	}
	set formatters(newFormatters) {
		this.#formatters = { ...this.#formatters, ...newFormatters };
		this.initialized && this.#updateDataLists();
	}

	// Public Methods
	async initializeComponent() {
		const elements = this.#state.elements;
		elements.input = this.querySelector('[part~=file]');
		if (!elements.input) {
			console.warn('DataMapper: No file input found. Add an input with part="file".');
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

	async mount() {
		if (!this.#initialized) {
			await this.#initialize();
		}
	}

	static register() {
		const name = this.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		if (!customElements.get(name)) customElements.define(name, this);
	}

	async import() {
		if (this.#state.outputData) {
			return this.#state.outputData;
		}
		const mappings = this.customMapping || [];
		return this.#processMapping(mappings);
	}

	async output(format = null) {
		const data = await this.import();
		if (!data?.length) return '';
		
		if (format) {
			return dataFormats[format](data);
		}
		
		return data;
	}

	async preview(format = 'json') {
		const data = await this.import();
		return data.length ? dataFormats[format]([data[0]]) : '';
	}

	async download(format = 'json') {
		const content = await this.output(format);
		if (!content) return;
		
		const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
		const filename = `export-${timestamp}.${format}`;
		this.#downloadFile(content, filename, `${mimeTypes[format]};charset=utf-8;`);
	}

	// Private Methods
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

	#downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
		try {
			const blob = new Blob([content], { type: mimeType });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.warn('Error creating downloadable file');
		}
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

	#getFieldIndex(sourceName) {
		if (!this.#state.firstrow) {
			return parseInt(sourceName.split(' ')[1]) - 1;
		}
		const headers = this.#state.elements.mapping.querySelectorAll('[part~="mapping-header"]');
		return Array.from(headers).findIndex(h => h.textContent === sourceName);
	}

	#getHeaders(lines) {
		if (!lines.length) return [];
		
		const separator = this.#state.separator;
		const firstLine = lines[0];
		
		if (this.#state.firstrow) {
			// Split and clean each header
			return firstLine.split(separator)
				.map(header => header.trim())
				.filter(Boolean);  // Remove empty headers
		}
		
		const columnCount = firstLine.split(separator)
			.filter(Boolean).length;  // Count non-empty columns
			
		return Array.from(
			{ length: columnCount }, 
			(_, i) => `COL ${i + 1}`
		);
	}

	#getTemplate() {
		return `
			<slot></slot>
			<datalist id="converters${this.uid}"></datalist>
			<datalist id="formatters${this.uid}"></datalist>
			<fieldset id="mapping${this.uid}" part="mapping" popover="manual"></fieldset>
		`;
	}

	#icon(paths, part) {
		return `<svg viewBox="0 0 24 24"${part ? `part="${part}"`:''}>${paths.split(',').map((path) => `<path d="${path}"></path>`).join('')}</svg>`;
	}

	async #initialize() {
		if (this.#initialized) return;
		
		this.uid = crypto.getRandomValues(new Uint8Array(4))
			.reduce((acc, val) => acc + val.toString(36).padStart(2, '0'), '');
		this.accept = this.getAttribute('accept') || DataMapper.defaultAccept;
		this.label = this.getAttribute('label') || DataMapper.defaultLabel;
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

	async #processFile(file) {
		try {
			const text = await file.text();
			let format = this.#detectFormat(file);
			
			// For .txt files, examine content to determine if it's TSV or CSV
			if (file.name.endsWith('.txt')) {
				const firstLine = text.split('\n')[0];
				format = firstLine.includes('\t') ? 'tsv' : 'csv';
			}

			let data;

			if (format === 'csv' || format === 'tsv') {
				const separator = format === 'tsv' ? '\t' : ',';
				this.#state.separator = separator;
				
				// Clean the text - normalize line endings and remove any BOM
				const cleanText = text.replace(/^\uFEFF/, '')  // Remove BOM if present
					.replace(/\r\n?/g, '\n')    // Normalize line endings
					.trim();                    // Remove leading/trailing whitespace
				
				const lines = cleanText.split('\n')
					.map(line => line.trim())   // Trim each line
					.filter(Boolean);           // Remove empty lines
				
				if (!lines.length) throw new Error('File is empty');
				
				const headers = this.#getHeaders(lines);
				if (!headers.length) throw new Error('No headers found in file');
				
				this.#renderMapping(headers);
				this.#state.content = this.#state.firstrow ? 
					lines.slice(1).join('\n') : lines.join('\n');
			} else {
				// For other formats, parse to array of objects first
				data = this.#parseInputFormat(text, format);
				// Ensure data is an array
				data = Array.isArray(data) ? data : [data];
				if (!data?.length) throw new Error('No valid data found in file');
				
				// If we have an array of primitive values, convert them to objects
				if (typeof data[0] !== 'object') {
					data = data.map(value => ({ value }));
				}
				
				// Use first object's keys as headers
				const headers = Object.keys(data[0]);
				this.#renderMapping(headers);
				
				// Convert structured data back to CSV format for internal processing
				this.#state.separator = ',';
				this.#state.content = this.#objectsToCsv(data);
			}

			const { mapping, input, numObjects } = this.#state.elements;
			mapping.togglePopover(true);
			input.value = '';
			input.toggleAttribute('inert', true);
			
			const lineCount = this.#state.content.split('\n').length;
			numObjects.textContent = `${this.#t('numObjects')}${lineCount}`;
		} catch (error) {
			console.error('Error processing file:', error);
			this.dispatchEvent(new CustomEvent('dm:error', { 
				detail: { message: error.message },
				bubbles: true
			}));
		}
	}

	#detectFormat(file) {
		const extension = file.name.split('.').pop()?.toLowerCase();

		if (['csv', 'json', 'ndjson', 'tsv', 'xml', 'yaml', 'yml'].includes(extension)) {
			return extension === 'yml' ? 'yaml' : extension;
		}

		// Special case for .txt files - examine content
		if (extension === 'txt') {
			return file.name.toLowerCase().includes('tsv') ? 'tsv' : 'csv';
		}

		for (const [format, mime] of Object.entries(mimeTypes)) {
			if (file.type === mime) return format;
		}

		return 'csv';
	}

	#parseInputFormat(text, format) {
		switch (format) {
			case 'json':
				return JSON.parse(text);
			case 'ndjson':
				return text.trim().split('\n').map(line => JSON.parse(line));
			case 'xml':
				return inputParsers.xml(text);
			case 'yaml':
				return inputParsers.yaml(text);
			default:
				throw new Error(`Unsupported input format: ${format}`);
		}
	}

	#objectsToCsv(data) {
		if (!data?.length) return '';
		const headers = Object.keys(data[0]);
		return data.map(obj => 
			headers.map(key => obj[key] ?? '').join(this.#state.separator)
		).join('\n');
	}

	#processMapping(mappings) {
		const mappingsByTarget = new Map();
		mappings.forEach(mapping => {
			// Extract base target name (without order suffix)
			const [baseTarget] = mapping.target.split('|');
			if (!mappingsByTarget.has(baseTarget)) {
				mappingsByTarget.set(baseTarget, []);
			}
			mappingsByTarget.get(baseTarget).push(mapping);
		});

		return this.#state.content.trim().split('\n')
			.map(line => {
				const values = line.split(this.#state.separator);
				const row = {};

				mappingsByTarget.forEach((targetMappings, target) => {
					// Use the same logic as preview for all fields
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

		return parts.length ? parts.join(this.#state.concatenator) : null;
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
			<div part="mapping-wrapper">
				<ul part="mapping-content">
					<li part="mapping-thead">
					<li part="mapping-thead">
						<span>${this.#t('source')}</span>
						<span>${this.#t('target')}</span>
						<span>${this.#t('type')}</span>
						<span>${this.#t('formatter')}</span>
						<span>${this.#t('prefix')}</span>
						<span>${this.#t('suffix')}</span>
					</li>
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
					<small part="numobjects"></small>
					<select part="outputformat">
						<option value="csv">CSV</option>
						<option value="json" selected>JSON</option>
						<option value="ndjson">NDJSON</option>
						<option value="tsv">TSV</option>
						<option value="xml">XML</option>
						<option value="yaml">YAML</option>
					</select>
					<button type="button" part="button updatetarget" title="${this.#t('updateTargets')}">${this.#icon(this.#icons.arrowright, 'icon')}</button>
					<button type="button" part="button preview" title="${this.#t('preview')}">${this.#icon(this.#icons.preview, 'icon')}</button>
					<button type="button" part="button download" title="${this.#t('download')}">${this.#icon(this.#icons.download, 'icon')}</button>
					<button type="button" part="button import" title="${this.#t('import')}">${this.#icon(this.#icons.import, 'icon')}</button>
				</nav>
				<pre part="output" hidden></pre>
			</div>
		`;

		const elements = {
			close: mappingEl.querySelector('[part~=close]'),
			numObjects: mappingEl.querySelector('[part~=numobjects]'),
			output: mappingEl.querySelector('[part~=output]'),
			preview: mappingEl.querySelector('[part~=preview]'),
			import: mappingEl.querySelector('[part~=import]'),
			updateTarget: mappingEl.querySelector('[part~=updatetarget]')
		};
		this.#state.elements = { ...this.#state.elements, ...elements };

		elements.close?.addEventListener('click', () => 
			mappingEl.togglePopover(false));
			
		elements.updateTarget?.addEventListener('click', () => {
			const rows = mappingEl.querySelectorAll('[part~=mapping-row]');
			rows.forEach(row => {
				const source = row.querySelector('[part~=mapping-header]').textContent;
				const target = row.querySelector('[part~=mapping-input]');
				if (!target.value.trim()) {
					target.value = source.toLowerCase().replace(/\s+/g, '_');
				}
			});
		});

		elements.preview?.addEventListener('click', () => {
			const tempContent = this.#state.content;
			this.#state.content = this.#state.content.split('\n')[0];

			const mappings = this.#getCurrentMappings();
			const previewData = this.#processMapping(mappings);
			const format = mappingEl.querySelector('[part~=outputformat]').value;

			if (previewData.length > 0) {
				elements.output.textContent = dataFormats[format]([previewData[0]]);
				elements.output.hidden = false;
			}

			this.#state.content = tempContent;
		});

		elements.import?.addEventListener('click', async () => {
			const mappings = this.#getCurrentMappings();
			const data = await this.import();
			const format = mappingEl.querySelector('[part~=outputformat]').value;

			this.dispatchEvent(new CustomEvent('dm:imported', { 
				detail: data,
				bubbles: true
			}));

			if (data.length > 0) {
				elements.output.textContent = await this.output(format);
				elements.output.hidden = false;
			}
		});

		const downloadButton = mappingEl.querySelector('[part~=download]');
		downloadButton?.addEventListener('click', () => {
			const mappings = this.#getCurrentMappings();
			const processedData = this.#processMapping(mappings);
			const format = mappingEl.querySelector('[part~=outputformat]').value;
			const content = dataFormats[format](processedData);
			const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
			const filename = `export-${timestamp}.${format}`;
			this.#downloadFile(content, filename, `${mimeTypes[format]};charset=utf-8;`);
		});

		const formatSelect = mappingEl.querySelector('[part~=outputformat]');
		formatSelect?.addEventListener('change', () => {
			const output = elements.output;
			if (!output.hidden && output.textContent.trim()) {
				const mappings = this.#getCurrentMappings();
				const previewData = this.#processMapping(mappings);
				if (previewData.length > 0) {
					output.textContent = dataFormats[formatSelect.value]([previewData[0]]);
				}
			}
		});

		this.#state.mapping && this.#applyCustomMapping();
	}

	#setupEventListeners() {
		const { input, mapping } = this.#state.elements;
		
		const handlers = new Map([
			['change', e => e.target.files[0] && this.#processFile(e.target.files[0])],
			['beforetoggle', e => input.toggleAttribute('inert', e.newState === 'open')],
			['dm:close', () => mapping.togglePopover(false)]
		]);

		input?.addEventListener('change', handlers.get('change'));
		mapping?.addEventListener('beforetoggle', handlers.get('beforetoggle'));
		this.addEventListener('dm:close', handlers.get('dm:close'));
	}

	#t(key) {
		return this.#i18n[this.#lang]?.[key] ?? this.#i18n.en[key] ?? key;
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
}

DataMapper.register();
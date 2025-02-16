import { dataFromTable, parseData } from './modules/data.js';
import { renderTable, renderTBody, updateNavigation } from './modules/render.table.js';
import { calculatePages, consoleLog } from './modules/utility.js';
import { attachCustomEventHandlers, attachEventListeners } from './modules/events.js';
import { renderForm, renderSearch } from './modules/render.form.js';
import { printTable } from './modules/print.js';

/**
 * Data Grid
 * Wraps a HTML table element and adds functionality for sorting, pagination, searching and selection.
 * @author Mads Stoumann
 * @version 1.0.33
 * @summary 16-02-2025
 * @class
 * @extends {HTMLElement}
 */
export default class DataGrid extends HTMLElement {
	static observedAttributes = ['items', 'itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder'];
	constructor() {
		super();
		this.log = (message, color) => consoleLog(message, color, this.settings.debug);
		this._settings = this.createSettings();
		this.state = this.createState();

		this.dataInitialized = false;
		this.lang = this.getAttribute('lang') || 'en';
		this.manualTableData = false;
		this._i18n = {
			en: {
				all: "All",
				columns: 'Columns',
				densityLarge: "Large density",
				densityMedium: "Medium density",
				densitySmall: "Small density",
				endsWith: "Ends with",
				equals: "Equals",
				first: "First",
				includes: "Includes",
				last: "Last",
				layoutFixed: "Toggle Fixed layout",
				next: "Next",
				noResult: "No results",
				of: "of",
				page: "Page",
				prev: "Previous",
				print: "Print",
				printpreview: "Print preview",
				rowsPerPage: "Rows",
				search: "Search",
				selected: "selected",
				selectAll: "Select all across pages",
				startsWith: "Starts with",
				textWrap: "Toggle Text wrap",
			}
		};
	}

	async connectedCallback() {
		await this.loadResources();

		this.setupElements();
		this.settingsWatcher(this.settings);

		if (this.state.items > 0) {
			renderTable(this);
		}

		attachEventListeners(this);
		attachCustomEventHandlers(this);

		// Handle manual table data if no `data` attribute is provided
		if (this.manualTableData && !this.getAttribute('data')) {
			if (!this.hasAttribute('itemsperpage')) {
				this.state.itemsPerPage = this.state.items;
			}
			if (this.hasAttribute('page')) {
				this.state.page = parseInt(this.getAttribute('page'), 10);
			}
			renderTable(this);
		}

		this.setInitialWidths();

		this.dispatchEvent(new CustomEvent('dg:loaded', {
			bubbles: true,
			detail: { message: 'DataGrid is ready' }
		}));
	}

	disconnectedCallback() {
		try {
			// Clean up overflow observer
			if (this.overflowListener) {
				this.overflowListener();
				this.overflowListener = null;
			}

			// Clean up print preview template
			if (this.printPreview && this.templateId) {
				this.printPreview._templates.delete(this.templateId);
				this.printPreview._templates.delete(`${this.templateId}-settings`);
			}
		} catch (error) {
			this.log(`Error in disconnectedCallback: ${error}`, '#F00');
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const render = (oldValue && (oldValue !== newValue)) || false;
		this.log(`attr: ${name}=${newValue} (${oldValue})`, '#046');

		if (name === 'itemsperpage') {
			this.setItemsPerPage(newValue);
			if (render) renderTBody(this);
		}
		if (name === 'page') {
			if (parseInt(newValue, 10) !== this.state.page) {
				this.setPage(parseInt(newValue, 10));
			}
		}
		if (name === 'searchterm') {
			if (render) {
				this.setAttribute('page', 0);
				renderTBody(this);
			}
		}
		if (name === 'sortindex') {
			this.state.sortIndex = parseInt(newValue, 10);
			if (oldValue === newValue) this.setAttribute('sortorder', +!this.state.sortOrder);
			renderTBody(this);
		}
		if (name === 'sortorder') {
			this.state.sortOrder = parseInt(newValue, 10);
			if (render) renderTBody(this);
		}
	}

	checkAndSetInitialPage() {
		try {
			const page = parseInt(this.getAttribute('page'), 10);
			if (this.state.pages > 0 && !isNaN(page) && page >= 0 && page < this.state.pages) {
				this.state.page = page;
			}
		} catch (error) {
			this.log(`Error setting initial page: ${error}`, '#F00');
		}
	}

	createColgroup() {
		const colgroup = document.createElement('colgroup');
		this.table.prepend(colgroup);
		return colgroup;
	}

	createForm() {
		const form = document.createElement('form');
		form.id = `form${crypto.randomUUID()}`;
		form.innerHTML = renderForm(this);
		return form;
	}

	createSettings() {
		return {
			debug: this.hasAttribute('debug') || false,
			density: this.getAttribute('density') || '',
			densityOptions: {
				small: { label: 'Small', icon: 'densitySmall', class: '--density-sm', i18n: 'densitySmall' },
				medium: { label: 'Medium', icon: 'densityMedium', class: '--density-md', i18n: 'densityMedium' },
				large: { label: 'Large', icon: 'densityLarge', class: '--density-lg', i18n: 'densityLarge' },
			},
			exportCSV: this.hasAttribute('export-csv') || false,
			exportJSON: this.hasAttribute('export-json') || false,
			externalNavigation: this.hasAttribute('external-navigation') || false,
			isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
			layoutFixed: this.getAttribute('layoutfixed') === "false" ? false : true,
			navigation: !this.hasAttribute('nonav'),
			pagesize: this.getAttribute('pagesize')?.split(',') || [5, 10, 25, 50, 100],
			pagination: !this.hasAttribute('nopage'),
			printable: this.hasAttribute('printable') || false,
			rows: !this.hasAttribute('norows'),
			searchable: this.hasAttribute('searchable') || false,
			selectable: this.hasAttribute('selectable') || false,
			sortable: !this.hasAttribute('nosortable'),
			stickyCols: this.parseStickyCols(this.getAttribute('stickycols')) || [],
			tableClasses: this.getAttribute('tableclasses')?.split(' ') || ['ui-table', '--th-light', '--hover-all'],
			textoptions: this.hasAttribute('textoptions') || false,
			textwrap: this.getAttribute('textwrap') === "false" ? false : true,
			wrapperClasses: this.getAttribute('wrapperclasses')?.split(',') || ['ui-table-wrapper'],
		}
	}

	createState() {
		return {
			cellIndex: 0,
			cols: 0,
			items: 0, /* total amount of items */
			itemsPerPage: parseInt(this.getAttribute('itemsperpage'), 10) || 10,
			page: 0,
			pages: 0,
			pageItems: 0, /* actual amount of items on the current page */
			rowIndex: 0,
			searchItems: 0, /* amount of items after search */
			searchPages: 0, /* total pages in the current search result */
			selected: new Set(),
			sortIndex: -1,
			sortOrder: 0,
			tbody: [],
			thead: [],
		}
	}

	createTable() {
		const table = document.createElement('table');
		this.wrapper.appendChild(table);
		return table;
	}

	dispatch(name, detail) {
		try {
			this.log(`event: ${name}`, '#A0A', this.settings.debug);
			this.dispatchEvent(new CustomEvent(name, { detail }));
		} catch (error) {
			this.log(`Error in dispatch: ${error}`, '#F00');
		}
	};

	async fetchResource(url) {
		if (!url) return null;
		if (!this.isValidUrl(url)) return null;
	
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			this.log(`Error fetching resource: ${error.message}`);
			return null;
		}
	}

	isValidUrl(str) {
		// First, try to parse the string as JSON. If it succeeds, return false (as it is valid JSON, not a URL).
		try {
			JSON.parse(str);
			return false;
		} catch {
			// If JSON parsing fails, proceed to check if it is a valid URL.
		}

		// Now try to validate the string as a URL.
		try {
			const url = new URL(str, window.location.origin);
			return ['http:', 'https:', 'ftp:'].includes(url.protocol);
		} catch {
			return false;
		}
	}

	async loadResources() {
		try {
			const dataAttr = this.getAttribute('data');
			const i18nAttr = this.getAttribute('i18n');
			const schemaUrl = this.getAttribute('schema');
			let dataPromise = Promise.resolve(null);
	
			// Handle `data` attribute as either a URL or JSON
			if (dataAttr) {
				if (this.isValidUrl(dataAttr)) {
					dataPromise = this.fetchResource(dataAttr);
				} else {
					try {
						dataPromise = Promise.resolve(JSON.parse(dataAttr));
					} catch (jsonError) {
						this.log(`Invalid JSON in data attribute: ${jsonError.message}`, '#F00');
					}
				}
			}
	
			// Handle `i18n` attribute as either a URL or JSON
			let i18nPromise;
			if (i18nAttr) {
				if (this.isValidUrl(i18nAttr)) {
					// Fetch if it's a URL
					i18nPromise = this.fetchResource(i18nAttr);
				} else {
					// Try parsing as JSON if it's not a URL
					try {
						const parsedI18n = JSON.parse(i18nAttr);
						i18nPromise = Promise.resolve(parsedI18n);
					} catch (jsonError) {
						this.log(`Invalid JSON in i18n attribute: ${jsonError.message}`, '#F00');
						i18nPromise = Promise.resolve(null);
					}
				}
			} else {
				i18nPromise = Promise.resolve(null);
			}
	
			// Load all resources in parallel
			const [data, i18n, schema] = await Promise.all([
				dataPromise,
				i18nPromise,
				schemaUrl ? this.fetchResource(schemaUrl) : Promise.resolve(null),
			]);
	
			// Apply loaded data to component state
			this.state = { ...this.state, ...(data ? parseData(data, this) : {}) };
			this.schema = schema || {};
			this.i18n = { ...this._i18n, ...i18n };
	
			this.checkAndSetInitialPage();
	
		} catch (error) {
			this.log(`Error loading resources: ${error}`, '#F00');
		}
	}

	navigatePage(page = null, direction = null) {
		try {
			let newPage = this.state.page;
			const searchtermExists = this.form?.elements.searchterm?.value?.length > 0;

			if (direction === 'next') {
				newPage = Math.min(this.state.page + 1, this.state.pages - 1);
			} else if (direction === 'prev') {
				newPage = Math.max(this.state.page - 1, 0);
			}

			if (page !== null) {
				newPage = Math.max(0, Math.min(page, this.state.pages - 1));
			}

			if (this.settings.externalNavigation && !searchtermExists) {
				this.dispatch('dg:requestpagechange', { page: newPage, direction });
			} else {
				this.setPage(newPage);
			}
		} catch (error) {
			this.log(`Error navigating to page: ${error}`, '#F00');
		}
	}

	parseStickyCols(stickycolsAttr) {
		return stickycolsAttr
			? stickycolsAttr.split(',').map(col => parseInt(col.trim(), 10)).filter(Number.isInteger)
			: [];
	}

	print(directPrint = false) {
		printTable(this, directPrint);
	}

	renderIcon(paths) {
		return `<svg viewBox="0 0 24 24" class="ui-icon">${paths.split(',').map(path => `<path d="${path}"></path>`).join('')}</svg>`;
	}

	resizeColumn(index, value) {
		try {
			const col = this.colgroup.children[index];
			const width = (col.offsetWidth / this.table.offsetWidth) * 100;
			col.style.width = `${width + value}%`;
		} catch (error) {
			this.log(`Error resizing column: ${error}`, '#F00');
		}
	}

	selectRows = (rows, toggle = true, force = false, shiftKey = false) => {
		try {
			if (shiftKey) {
				this.toggleSelection(toggle);
			}

		// Regular selection logic
			Array.from(rows).forEach(row => {
				const shouldSelect = force ? toggle : row.hasAttribute('aria-selected') ? !toggle : toggle;
				row.toggleAttribute('aria-selected', shouldSelect);
				
				const selected = row.hasAttribute('aria-selected');
				const input = row.querySelector(`input[data-toggle-row]`);
				if (input) input.checked = selected;
				
				const key = row.dataset.keys;
				if (selected) this.state.selected.add(key);
				else this.state.selected.delete(key);
			});

			this.form.elements.selected.value = this.state.selected.size;
			this.dispatch('dg:selection', this.state.selected);

			if (this.toggle) {
				this.toggle.indeterminate = this.state.selected.size > 0 && this.state.selected.size < this.state.pageItems;
			}
		} catch (error) {
			this.log(`Error selecting rows: ${error}`, '#F00');
		}
	};

	setActive = () => {
		try {
			const { rowIndex, cellIndex } = this.state;
			const targetCell = this.table.rows[rowIndex]?.cells[cellIndex];
			if (this.active === targetCell && this.active.isContentEditable) return;
			if (this.active) {
				this.active.setAttribute('tabindex', '-1');
			}

			this.active = targetCell;
			if (this.active) {
				this.active.setAttribute('tabindex', '0');
				this.active.focus();
			}
		} catch (error) {
			this.log(`Error setting active cell: ${error}`, '#F00');
		}
	};

	setInitialWidths() {
		try {
			if (!this.table || !this.colgroup) return;
	
			const calculateWidths = () => {
				const tableWidth = this.table.offsetWidth;

				Array.from(this.colgroup.children).forEach((col, index) => {
					if (this.settings?.colWidths && this.settings.colWidths[index] !== undefined) {
						col.style.width = `${this.settings.colWidths[index]}%`;
					} else {
						const cell = this.table.tHead?.rows[0]?.cells[index] || this.table.tBodies[0].rows[0].cells[index];
						if (cell) {
							const colWidthPercentage = ((cell.offsetWidth / tableWidth) * 100).toFixed(2);
							col.style.width = `${colWidthPercentage}%`;
						}
					}
				});
			};

			requestAnimationFrame(calculateWidths);

		} catch (error) {
			this.log(`Error setting initial column widths: ${error}`, '#F00');
		}
	}

	setItemsPerPage(itemsPerPage) {
		try {
			const newItemsPerPage = parseInt(itemsPerPage, 10) || 10;
			if (newItemsPerPage === this.state.itemsPerPage) return;

			this.state.itemsPerPage = newItemsPerPage;
			this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);

			if (this.form?.elements.itemsperpage) {
				this.form.elements.itemsperpage.value = newItemsPerPage;
			}

			if (parseInt(this.getAttribute('itemsperpage'), 10) !== this.state.itemsPerPage) {
				this.setAttribute('itemsperpage', this.state.itemsPerPage);
			}

			this.setPage(0);
			this.dispatch('dg:itemsperpage', this.state);
			
		} catch (error) {
			this.log(`Error setting items per page: ${error}`, '#F00');
		}
	}

	setTotalItems(totalItems) {
		if (this.settings.externalNavigation && Number.isInteger(totalItems) && totalItems >= 0) {
			this.state.items = totalItems;
			this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);
			this.state.pageItems = Math.min(this.state.itemsPerPage, totalItems - this.state.page * this.state.itemsPerPage);
			this.form.elements.pages.value = this.state.pages;
			this.form.elements.total.value = this.state.items;
		}
	}

	setPage(page, forceRender = false) {
		try {
			const newPage = Math.max(0, Math.min(page, this.state.pages - 1));
			if (newPage === this.state.page) return;

			this.state.page = newPage;
			const currentPage = parseInt(this.getAttribute('page'), 10);

			if (currentPage !== this.state.page) {
				this.setAttribute('page', this.state.page);
			}

			const searchtermExists = this.form?.elements.searchterm?.value?.length > 0;

			if (!this.settings.externalNavigation || searchtermExists || forceRender) {
				renderTBody(this);
			}

			if (this.settings.externalNavigation && !forceRender) {
				updateNavigation(this);
			}
		} catch (error) {
			this.log(`Error setting page: ${error}`, '#F00');
		}
	}

	setupElements() {
		this.wrapper = document.createElement('div');
		this.appendChild(this.wrapper);
		this.table = this.querySelector('table');

		if (this.table) {
			this.manualTableData = true;
			this.state = Object.assign(this.state, dataFromTable(this.table, this.state.itemsPerPage, this.settings.selectable));
		} else {
				this.table = this.createTable();
		}

		if (!this.table.tHead) this.table.appendChild(document.createElement('thead'));
		if (!this.table.tBodies.length) this.table.appendChild(document.createElement('tbody'));

		this.colgroup = this.table.querySelector('colgroup') || this.createColgroup();

		this.form = this.createForm();
		this.appendChild(this.form);
		this.insertAdjacentHTML('afterbegin', renderSearch(this));
	}

	setupOverflowListener(wrapper, table, callback) {
		let callbackPending = false; // Debounce flag to avoid duplicate calls
	
		const checkOverflow = () => {
			const isOverflowing = wrapper.scrollHeight > wrapper.clientHeight || wrapper.scrollWidth > wrapper.clientWidth;
			// Trigger the callback only if not pending
			if (!callbackPending && typeof callback === 'function') {
				callbackPending = true;
				requestAnimationFrame(() => {
					callback(isOverflowing);
					setTimeout(() => callbackPending = false, 50); // Reset pending flag after short delay
				});
			}
		};

		// Observe size changes on wrapper (overflow detection)
		const wrapperObserver = new ResizeObserver(checkOverflow);
		wrapperObserver.observe(wrapper);
		const tableObserver = new ResizeObserver(checkOverflow);
		tableObserver.observe(table);

		return () => {
			wrapperObserver.disconnect();
			tableObserver.disconnect();
		};
	}

	setStickyCols(isOverflowing) {
		if (isOverflowing) {
			this.wrapper.classList.add('--overflowing');
			let offset = 0;
			this.settings.stickyCols.forEach((index, i) => {
				const cell = this.table.tHead.rows[0].cells[index];
				if (!cell) return;
				const cellWidth = offset + cell.offsetWidth;
				this.table.style.setProperty(`--c${index}`, `${offset}px`);
				this.table.classList.add(`--c${index}`);
				offset = cellWidth;
			});
		} else {
			this.wrapper.classList.remove('--overflowing');
		}
	}

	/**
	 * Watches for changes in the settings and updates the UI elements accordingly.
	 */
	settingsWatcher() {
		try {
			if (!this.form || !this.table) {
				this.log('Form or Table element is not yet initialized.');
				return;
			}

			this.settings.tableClasses.forEach(cls => this.table.classList.toggle(cls, true));
			this.settings.wrapperClasses.forEach(cls => this.wrapper.classList.toggle(cls, true));

			/* density */
			this.form.elements.density.hidden = !this.settings.density;
			if (this.settings.density) {
				this.form.elements.density_option.value = this.settings.density;
				this.form.elements.density.value = this.settings.density;
				this.form.elements.density.dispatchEvent(new Event('change'));
			}

			/* exportable */
			this.form.elements.csv.hidden = !this.settings.exportCSV;
			this.form.elements.json.hidden = !this.settings.exportJSON;

			/* misc */
			this.form.elements.preview.hidden = !this.settings.printable;
			this.form.elements.print.hidden = !this.settings.printable;
			this.form.elements.search.hidden = !this.settings.searchable;

			/* navigation */
			this.form.elements.pagination.hidden = !this.settings.pagination;
			this.form.elements.rows.hidden = !this.settings.rows;

			/* selectable */
			this.form.elements.selection.hidden = !this.settings.selectable;

			/* sorting */
			this.table.classList.toggle('--nosortable', !this.settings.sortable);

			/* textoptions */
			this.form.textoptions.hidden = !this.settings.textoptions;
			this.form.elements.layoutfixed.checked = this.settings.layoutFixed;
			this.form.elements.textwrap.checked = this.settings.textwrap;
			this.table.classList.toggle('--fixed', this.settings.layoutFixed);
			this.table.classList.toggle('--no-wrap', !this.settings.textwrap);
		
			/* sticky cols */
			const toggleEventListener = (condition, addListener) => {
				if (condition && !this.overflowListener) {
					this.overflowListener = addListener();
				} else if (!condition && this.overflowListener) {
					this.overflowListener();
					this.overflowListener = null;
				}
			};
			toggleEventListener(
				this.settings.stickyCols && this.settings.stickyCols.length > 0,
				() => this.setupOverflowListener(this.wrapper, this.table, this.setStickyCols.bind(this))
			);
			if (!this.settings.stickyCols || this.settings.stickyCols.length === 0) {
				this.wrapper.classList.remove('--overflowing');
				for (let index = 0; index < this.state.cols; index++) {
					this.table.classList.remove(`--c${index}`);
					this.table.style.removeProperty(`--c${index}`);
				}
			}

		} catch (error) {
			this.log(`Error in settingsWatcher: ${error.message}`);
		}
	}

	/**
	 * Toggles selection for all rows in the current tbody based on the specified toggle parameter.
	 * This method is only called if Shift is held down during a select-all action.
	 * 
	 * @param {boolean} select - Determines if all rows should be selected (true) or deselected (false).
	 */
	toggleSelection(select = true) {
		const keyFields = this.state.thead.filter(col => col.key).map(col => col.field);

		this.state.tbody.forEach(row => {
			const compositeKey = keyFields.map(field => row[field]).join(',');

			if (select) {
				this.state.selected.add(compositeKey);
			} else {
				this.state.selected.delete(compositeKey);
			}
		});

		this.form.elements.selected.value = this.state.selected.size;
	}

	/*
	===================
	Getters and Setters
	===================
	*/
	/**
	 * @param {string | any[]} newData
	 */
	set data(newData) {
		if (Array.isArray(newData) || (newData && typeof newData === 'object')) {
			if (!this.dataInitialized) {
				// First time: parse all data including thead
				this.state = { ...this.state, ...parseData(newData, this) };
				renderTable(this);
				this.setInitialWidths();
				this.dataInitialized = true;
			} else {
				// Subsequent times: only update tbody
				const parsed = parseData(newData, this);
				this.state.tbody = parsed.tbody;
				renderTBody(this);
			}
		} else {
			this.log(`Invalid data format: ${newData}`, '#F00');
		}
	}

	get i18n() {
		return this._i18n;
	}

	set i18n(value) {
		if (typeof value === 'object' && value !== null) {
			this._i18n = value;
		} else {
			this.log('i18n should be a valid object. Defaulting to an empty object.');
			this._i18n = {};
		}
	}

	set settings(value) {
		this._settings = { ...this._settings, ...value };
		this.settingsWatcher();
	}

	get settings() {
		return this._settings || {};
	}
}

customElements.define("data-grid", DataGrid);

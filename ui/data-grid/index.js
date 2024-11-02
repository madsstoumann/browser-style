import { dataFromTable, parseData } from './modules/data.js';
import { renderTable, renderTBody } from './modules/render.table.js';
import { calculatePages, consoleLog, setupOverflowListener } from './modules/utility.js';
import { attachCustomEventHandlers, attachEventListeners } from './modules/events.js';
import { renderForm, renderSearch } from './modules/render.form.js';
import printElements from '../../assets/js/printElements.js';

/**
 * Data Grid
 * Wraps a HTML table element and adds functionality for sorting, pagination, searching and selection.
 * @author Mads Stoumann
 * @version 1.0.23
 * @summary 01-11-2024
 * @class
 * @extends {HTMLElement}
 */
export default class DataGrid extends HTMLElement {
	static observedAttributes = ['items', 'itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder'];
	constructor() {
		super();

		this.log = (message, color) => consoleLog(message, color, this.options.debug);

		this.dataInitialized = false;
		this.lang = this.getAttribute('lang') || 'en';
		this.manualTableData = false;
		this._i18n = {};

		this.options = {
			debug: this.hasAttribute('debug') || false,
			density: this.getAttribute('density') || '',
			exportable: this.hasAttribute('exportable') || false,
			externalNavigation: this.hasAttribute('external-navigation') || false,
			pagesize: this.getAttribute('pagesize')?.split(',') || [5, 10, 25, 50, 100],
			printable: this.hasAttribute('printable') || false,
			searchable: this.hasAttribute('searchable') || false,
			selectable: this.hasAttribute('selectable') || false,
			stickycols: this.parseStickyCols(this.dataset.stickyCols)
		};

		this.state = {
			cellIndex: 0,
			cols: 0,
			items: 0, /* total amount of items */
			itemsPerPage: parseInt(this.getAttribute('itemsperpage'), 10) || 10,
			page: 0,
			pages: 0,
			pageItems: 0, /* actual amount of items on the current page */
			rowIndex: 0,
			selected: new Set(),
			sortIndex: -1,
			sortOrder: 0,
			tbody: [],
			thead: [],
		};

		if (this.options.debug) console.table(this.options, ['locale', 'searchable', 'selectable']);

		this.wrapper = document.createElement('div');
		this.appendChild(this.wrapper);
		this.table = this.querySelector('table');

		this.densityOptions = {
			compact: { label: 'Small', icon: 'densitySmall', class: '--density-compact' },
			medium: { label: 'Medium', icon: 'densityMedium', class: '--density-medium' },
			large: { label: 'Large', icon: 'densityLarge', class: '--density-loose' },
			...this.options.densityOptions
		};

		if (this.table) {
			this.manualTableData = true;
			this.state = Object.assign(this.state, dataFromTable(this.table, this.state.itemsPerPage, this.options.selectable));
		}
		else {
			this.table = this.createTable();
		}

		if (this.hasAttribute('tableclass')) {
			const classes = this.getAttribute('tableclass').split(' ')
			this.table.classList.add(...classes)
		}

		if (!this.table.tHead) this.table.appendChild(document.createElement('thead'));
		if (!this.table.tBodies.length) this.table.appendChild(document.createElement('tbody'));

		this.colgroup = this.table.querySelector('colgroup') || this.createColgroup();
	}

	/**
	 * Handles the component's connection to the DOM.
	 * 
	 * This method is called when the element is added to the document's DOM. It performs the following tasks:
	 * 1. Loads necessary resources asynchronously.
	 * 2. Creates and appends a form element to the component.
	 * 3. If the component is searchable, inserts a search bar at the beginning.
	 * 4. Renders the data table.
	 * 5. Attaches event listeners and custom event handlers.
	 * 6. If manual table data is provided and no data attribute is set, it sets the items per page and re-renders the table.
	 * 7. Dispatches a custom 'dg:loaded' event indicating that the DataGrid is ready.
	 * 
	 * @async
	 * @returns {Promise<void>} A promise that resolves when the component has finished setting up.
	 */
	async connectedCallback() {
		await this.loadResources();

		this.form = this.createForm();
		this.appendChild(this.form);

		if (this.options.searchable) {
			this.insertAdjacentHTML('afterbegin', renderSearch(this))
		}

		if (this.state.items > 0) {
			renderTable(this);
		}

		attachEventListeners(this);
		attachCustomEventHandlers(this);
		
		if (this.manualTableData && !this.getAttribute('data')) {
			if (!this.hasAttribute('itemsperpage'))	this.state.itemsPerPage = this.state.items;
			renderTable(this);
		}

		this.setInitialWidths();
		if (this.options.stickycols.length > 0) {
			setupOverflowListener(this.wrapper, this.setStickyCols.bind(this));
		}

		this.dispatchEvent(new CustomEvent('dg:loaded', {
			bubbles: true,
			detail: { message: 'DataGrid is ready' }
		}));
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

	/**
	 * Checks and sets the initial page for the data grid.
	 * 
	 * This method retrieves the 'page' attribute, parses it as an integer, and sets the 
	 * current page state if the parsed value is valid and within the range of available pages.
	 * 
	 * @throws Will log an error message if an exception occurs during the process.
	 */
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

	/**
	 * Creates a <colgroup> element and inserts it at the beginning of the table.
	 *
	 * @returns {HTMLTableColElement} The created <colgroup> element.
	 */
	createColgroup() {
		const colgroup = document.createElement('colgroup');
		this.table.prepend(colgroup);
		return colgroup;
	}

	/**
	 * Creates a new form element with a unique ID and populates it with content.
	 *
	 * @returns {HTMLFormElement} The newly created form element.
	 */
	createForm() {
		const form = document.createElement('form');
		form.id = `form${crypto.randomUUID()}`;
		form.innerHTML = renderForm(this);
		return form;
	}

	/**
	 * Creates a new table element, appends it to the wrapper, and returns the table element.
	 *
	 * @returns {HTMLTableElement} The newly created table element.
	 */
	createTable() {
		const table = document.createElement('table');
		this.wrapper.appendChild(table);
		return table;
	}

	/**
	 * Dispatches a custom event with the given name and detail.
	 * Logs the event name and any errors that occur during dispatch.
	 *
	 * @param {string} name - The name of the event to dispatch.
	 * @param {Object} detail - The detail object to include with the event.
	 */
	dispatch(name, detail) {
		try {
			this.log(`event: ${name}`, '#A0A', this.options.debug);
			this.dispatchEvent(new CustomEvent(name, { detail }));
		} catch (error) {
			this.log(`Error in dispatch: ${error}`, '#F00');
		}
	};

	/**
	 * Fetches a resource from the given URL and returns the parsed JSON data.
	 * If the URL is invalid or the fetch operation fails, it logs an error and returns null.
	 *
	 * @async
	 * @param {string} url - The URL of the resource to fetch.
	 * @returns {Promise<Object|null>} A promise that resolves to the parsed JSON data, or null if an error occurs.
	 */
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

	/**
	 * Checks if a given string is a valid URL.
	 *
	 * @param {string} str - The string to be validated as a URL.
	 * @returns {boolean} - Returns true if the string is a valid URL, otherwise false.
	 */
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

	/**
	 * Asynchronously loads resources for the data grid component.
	 * 
	 * This method fetches data, schema, and internationalization (i18n) resources.
	 * If the `data` attribute is a URL, it fetches the data from the URL; otherwise,
	 * it treats the `data` attribute as JSON.
	 * 
	 * @async
	 * @function loadResources
	 * @returns {Promise<void>} A promise that resolves when all resources are loaded.
	 */
	async loadResources() {
		try {
			const dataAttr = this.getAttribute('data');
			const i18nUrl = this.getAttribute('i18n');
			const schemaUrl = this.getAttribute('schema');
			let dataPromise = Promise.resolve(null);

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
	
			// Load all resources in parallel, passing URLs directly to fetchResource
			const [data, i18n, schema] = await Promise.all([
				dataPromise,
				i18nUrl ? this.fetchResource(i18nUrl) : Promise.resolve(null),
				schemaUrl ? this.fetchResource(schemaUrl) : Promise.resolve(null)
			]);

			this.state = { ...this.state, ...(data ? parseData(data, this) : {}) };
			this.schema = schema || {};
			this.i18n = i18n || {};

			this.checkAndSetInitialPage();

		} catch (error) {
			this.log(`Error loading resources: ${error}`, '#F00');
		}
	}

	/**
	 * Navigates to a specified page or in a specified direction within the data grid.
	 *
	 * @param {number|null} [page=null] - The page number to navigate to. If null, navigation is based on the direction.
	 * @param {string|null} [direction=null] - The direction to navigate ('next' or 'prev'). Ignored if page is specified.
	 * @throws Will throw an error if navigation fails.
	 */
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

			if (this.options.externalNavigation && !searchtermExists) {
				this.dispatch('dg:requestpagechange', { page: newPage, direction });
			} else {
				this.setPage(newPage);
			}
		} catch (error) {
			this.log(`Error navigating to page: ${error}`, '#F00');
		}
	}

	/**
	 * Parses a string of comma-separated column indices and returns an array of integers.
	 *
	 * @param {string} stickycolsAttr - A string of comma-separated column indices.
	 * @returns {number[]} An array of integers representing the column indices.
	 */
	parseStickyCols(stickycolsAttr) {
		return stickycolsAttr
			? stickycolsAttr.split(',').map(col => parseInt(col.trim(), 10)).filter(Number.isInteger)
			: [];
	}

	/**
	 * Prints the current table using the printElements class.
	 * If an error occurs during printing, it logs the error message.
	 *
	 * @method printTable
	 * @throws Will log an error message if printing fails.
	 */
	printTable() {
		try {
			const printer = new printElements();
			printer.print([this.table]);
		} catch (error) {
			this.log(`Error printing: ${error}`, '#F00');
		}
	}

	/**
	 * Renders an SVG icon using the provided paths.
	 *
	 * @param {string} paths - A comma-separated string of path data for the SVG.
	 * @returns {string} The SVG element as a string.
	 */
	renderIcon(paths) {
		return `<svg viewBox="0 0 24 24" class="ui-icon">${paths.split(',').map(path => `<path d="${path}"></path>`).join('')}</svg>`;
	}

	/**
	 * Resizes a column in the table by adjusting its width.
	 *
	 * @param {number} index - The index of the column to resize.
	 * @param {number} value - The value to adjust the column width by, in percentage points.
	 */
	resizeColumn(index, value) {
		try {
			const col = this.colgroup.children[index];
			const width = (col.offsetWidth / this.table.offsetWidth) * 100;
			col.style.width = `${width + value}%`;
		} catch (error) {
			this.log(`Error resizing column: ${error}`, '#F00');
		}
	}

	/**
	 * Selects or deselects rows in the data grid.
	 *
	 * @param {NodeList|Array} rows - The rows to be selected or deselected.
	 * @param {boolean} [toggle=true] - If true, toggles the selection state of each row.
	 * @param {boolean} [force=false] - If true, forces the selection state based on the toggle parameter.
	 *
	 * @throws Will throw an error if there is an issue during the selection process.
	 */
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

	/**
	 * Sets the active cell in the data grid.
	 * 
	 * This method updates the tabindex of the previously active cell to -1, ends editing if necessary,
	 * and sets the new active cell based on the current row and cell indices. The new active cell's tabindex
	 * is set to 0, and it is focused.
	 * 
	 * @throws Will log an error message if an exception occurs during the process.
	 */
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

	/**
	 * Sets the initial widths of the columns in the data grid based on the widths of the cells in the first row.
	 * 
	 * This method calculates the width of each column as a percentage of the total table width and applies it to the corresponding <col> element.
	 * @throws Will log an error message if an error occurs during the width calculation and setting process.
	 */
	setInitialWidths() {
		try {
			if (!this.table || !this.colgroup) return;
	
			const calculateWidths = () => {
				const tableWidth = this.table.offsetWidth;

				Array.from(this.colgroup.children).forEach((col, index) => {
					if (this.config?.colWidths && this.config.colWidths[index] !== undefined) {
						col.style.width = `${this.config.colWidths[index]}%`;
					} else {
						const cell = this.table.tHead?.rows[0]?.cells[index] || this.table.tBodies[0].rows[0].cells[index];
						if (cell) {
							const colWidthPercentage = ((cell.offsetWidth / tableWidth) * 100).toFixed(2);
							col.style.width = `${colWidthPercentage}%`;
						}
					}
				});
			};

			// Use requestAnimationFrame to ensure browser has completed layout rendering
			requestAnimationFrame(calculateWidths);

		} catch (error) {
			this.log(`Error setting initial column widths: ${error}`, '#F00');
		}
	}

	/**
	 * Sets the number of items to display per page in the data grid.
	 *
	 * @param {number|string} itemsPerPage - The number of items per page. If a string is provided, it will be parsed as an integer.
	 * @throws Will log an error if setting items per page fails.
	 */
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

	/**
	 * Sets the current page of the data grid.
	 *
	 * @param {number} page - The page number to set.
	 * @param {boolean} [forceRender=false] - Whether to force rendering of the table body.
	 * @throws Will log an error message if an exception occurs during the page setting process.
	 */
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

			if (!this.options.externalNavigation || searchtermExists || forceRender) {
				renderTBody(this);
			}
		} catch (error) {
			this.log(`Error setting page: ${error}`, '#F00');
		}
	}

	/**
	 * Sets the sticky columns for the data grid.
	 * Iterates over the indices of the sticky columns and adjusts their offset positions.
	 * Adds CSS custom properties and classes to the table for each sticky column.
	 */
	setStickyCols() {
		let offset = 0;
		this.options.stickycols.forEach((index, i) => {
			const cell = this.table.tHead.rows[0].cells[index];
			if (!cell) return;

			// const isAdjacent = i > 0 && (index - this.options.stickycols[i - 1] === 1);
			// const bdw = isAdjacent ? 0 : parseFloat(getComputedStyle(cell).getPropertyValue('border-inline-end-width')) || 0;
			const cellWidth = offset + cell.offsetWidth // + bdw;

			this.table.style.setProperty(`--c${index}`, `${offset}px`);
			this.table.classList.add(`--c${index}`);
			offset = cellWidth;
		});
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
			this.state = { ...this.state, ...parseData(newData, this) };

				if (!this.dataInitialized) {
					renderTable(this);
					this.setInitialWidths();
					this.dataInitialized = true;
				} else {
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
			console.warn('i18n should be a valid object. Defaulting to an empty object.');
			this._i18n = {};
		}
	}
}
customElements.define("data-grid", DataGrid);

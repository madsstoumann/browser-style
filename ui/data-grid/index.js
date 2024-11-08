import { dataFromTable, parseData } from './modules/data.js';
import { renderTable, renderTBody, updateNavigation } from './modules/render.table.js';
import { calculatePages, consoleLog } from './modules/utility.js';
import { attachCustomEventHandlers, attachEventListeners } from './modules/events.js';
import { renderForm, renderSearch } from './modules/render.form.js';
import printElements from '../../assets/js/printElements.js';

/**
 * Data Grid
 * Wraps a HTML table element and adds functionality for sorting, pagination, searching and selection.
 * @author Mads Stoumann
 * @version 1.0.28
 * @summary 08-11-2024
 * @class
 * @extends {HTMLElement}
 */
export default class DataGrid extends HTMLElement {
	static observedAttributes = ['items', 'itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder'];
	constructor() {
		super();
		this.log = (message, color) => consoleLog(message, color, this.settings.debug);
		this.settings = this.createSettings();
		this.state = this.createState();

		this.dataInitialized = false;
		this.lang = this.getAttribute('lang') || 'en';
		this.loading = false;
		this.manualTableData = false;
		this._i18n = {
			en: {
				all: "All",
				endsWith: "Ends with",
				equals: "Equals",
				first: "First",
				includes: "Includes",
				last: "Last",
				next: "Next",
				noResult: "No results",
				of: "of",
				page: "Page",
				prev: "Previous",
				rowsPerPage: "Rows",
				search: "Filter Columns",
				selected: "selected",
				startsWith: "Starts with"
			}
		};
	}

	/**
	 * Lifecycle method called when the element is added to the document's DOM.
	 * Sets up necessary elements and initializes the grid functionality.
	 */
	async connectedCallback() {
		await this.loadResources();

		this.setupElements();
		this.settingsWatcher(this.settings);

		// Initial rendering of the table if there is data
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
			renderTable(this);
		}

		this.setInitialWidths();

		this.dispatchEvent(new CustomEvent('dg:loaded', {
			bubbles: true,
			detail: { message: 'DataGrid is ready' }
		}));
	}

	/**
	 * Callback that fires when a custom element's attribute is added, removed, updated, or replaced
	 * @param {string} name - The name of the attribute that changed
	 * @param {string|null} oldValue - The previous value of the attribute
	 * @param {string|null} newValue - The new value of the attribute
	 * @returns {void}
	 */
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
	 * Creates a default Settings-object based on the attributes of the custom element.
	 *
	 * @returns {Object} The newly created settings object.
	 */
	createSettings() {
		return {
			debug: this.hasAttribute('debug') || false,
			density: this.getAttribute('density') || '',
			densityOptions: {
				small: { label: 'Small', icon: 'densitySmall', class: '--density-sm' },
				medium: { label: 'Medium', icon: 'densityMedium', class: '--density-md' },
				large: { label: 'Large', icon: 'densityLarge', class: '--density-lg' }
			},
			exportCSV: this.hasAttribute('export-csv') || false,
			exportJSON: this.hasAttribute('export-json') || false,
			externalNavigation: this.hasAttribute('external-navigation') || false,
			navigation: !this.hasAttribute('nonav'),
			pagesize: this.getAttribute('pagesize')?.split(',') || [5, 10, 25, 50, 100],
			pagination: !this.hasAttribute('nopage'),
			printable: this.hasAttribute('printable') || false,
			rows: !this.hasAttribute('norows'),
			searchable: this.hasAttribute('searchable') || false,
			selectable: this.hasAttribute('selectable') || false,
			stickyCols: this.parseStickyCols(this.dataset.stickyCols) || [],
			tableClasses: this.getAttribute('tableclasses')?.split(',') || ['ui-table', '--th-light', '--hover-all'],
			textoptions: this.hasAttribute('textoptions') || false,
			textwrap: this.getAttribute('textwrap') === "false" ? false : true,
			wrapperClasses: this.getAttribute('wrapperclasses')?.split(',') || ['ui-table-wrapper'],
		}
	}

	/**
	 * Creates a default state-object
	 *
	 * @returns {Object} The newly created state object.
	 */
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
			this.log(`event: ${name}`, '#A0A', this.settings.debug);
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
			this.i18n = { ...this._i18n, ...i18n };

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

			if (this.settings.externalNavigation && !searchtermExists) {
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
	 * Sets the loading state of the data grid.
	 *
	 * @param {boolean} isLoading - A boolean indicating whether the data grid is in a loading state.
	 */
	setLoading(isLoading) {
		this.loading = isLoading;
		this.toggleAttribute('loading', this.loading);
	}

	/**
	 * Sets the total number of items for pagination when using external navigation.
	 * This is particularly useful when the grid data represents only a subset of a larger dataset.
	 *
	 * @param {number} totalItems - The total number of items across all pages.
	 */
	setTotalItems(totalItems) {
		if (this.settings.externalNavigation && Number.isInteger(totalItems) && totalItems >= 0) {
			this.state.items = totalItems;
			this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);
			this.state.pageItems = Math.min(this.state.itemsPerPage, totalItems - this.state.page * this.state.itemsPerPage);
			this.form.elements.pages.value = this.state.pages;
			this.form.elements.total.value = this.state.items;
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

	/**
	 * Sets up and initializes the essential DOM elements for the data grid.
	 * Creates or uses existing table structure and adds form elements.
	 * If a table exists in the DOM, data is extracted from it.
	 * If no table exists, one is created programmatically.
	 * Ensures the table has required elements: thead, tbody, and colgroup.
	 * @private
	 */
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

	/**
	 * Sets up listeners to detect overflow changes on the wrapper and table elements.
	 * Triggers the provided callback function when an overflow condition is detected.
	 *
	 * @param {HTMLElement} wrapper - The wrapper element to monitor for overflow.
	 * @param {HTMLElement} table - The table element to monitor for width changes.
	 * @param {Function} callback - The callback function to execute when an overflow condition is detected.
	 * 
	 * @returns {Function} A cleanup function to disconnect the observers.
	 */
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

	/**
	 * Sets the sticky columns for the data grid.
	 * Iterates over the indices of the sticky columns and adjusts their offset positions.
	 * Adds CSS custom properties and classes to the table for each sticky column.
	 */
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

			/* navigation */
			this.form.elements.pagination.hidden = !this.settings.pagination;
			this.form.elements.rows.hidden = !this.settings.rows;

			this.form.elements.print.hidden = !this.settings.printable;
			this.form.elements.search.hidden = !this.settings.searchable;
			this.form.elements.selection.hidden = !this.settings.selectable;
			
			/* textwrap */
			this.form.textoptions.hidden = !this.settings.textoptions;
			this.form.elements.textwrap.checked = this.settings.textwrap;
			if (!this.settings.textwrap) {
				this.table.classList.toggle('--no-wrap', !this.settings.textwrap);
			}

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

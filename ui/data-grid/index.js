import { calculatePages, dataFromTable, fetchData } from './modules/data.js';
import { i18n, baseTranslate } from './modules/i18n.js';
import { renderTable, renderTBody, updateNavigation } from './modules/render.js';
import { capitalize, consoleLog } from './modules/utils.js';
import { attachCustomEventHandlers, attachEventListeners } from './modules/events.js';
import { renderForm, renderSearch } from './modules/form.js';
import printElements from '../../assets/js/printElements.js';

/**
 * Data Grid
 * Wraps a HTML table element and adds functionality for sorting, pagination, searching and selection.
 * @author Mads Stoumann
 * @version 1.0.08
 * @summary 02-07-2024
 * @class
 * @extends {HTMLElement}
 */
export default class DataGrid extends HTMLElement {
	static observedAttributes = ['data', 'items', 'itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder'];
	constructor() {
		super();

		this.defaultLang = {
			en: {
				all: 'All',
				endsWith: 'Ends with',
				equals: 'Equals',
				first: 'First',
				includes: 'Includes',
				last: 'Last',
				next: 'Next',
				noResult: 'No results',
				of: 'of',
				page: 'Page',
				prev: 'Previous',
				rowsPerPage: 'Rows',
				search: 'Filter Columns',
				selected: 'selected',
				startsWith: 'Starts with',
			}
		};

		this.options = {
			density: this.hasAttribute('density') || false,
			debug: this.hasAttribute('debug') || false,
			editable: this.hasAttribute('editable') || false,
			exportable: this.hasAttribute('exportable') || false,
			i18n: this.hasAttribute('i18n') ? i18n(this.getAttribute('i18n'), this.defaultLang) : this.defaultLang,
			locale: this.getAttribute('lang') || document.documentElement.lang || 'en',
			pagesize: this.getAttribute('pagesize')?.split(',') || [5, 10, 25, 50, 100],
			printable: this.hasAttribute('printable') || false,
			searchable: this.hasAttribute('searchable') || false,
			selectable: this.hasAttribute('selectable') || false
		};

		this.state = {
			cellIndex: 0,
			cols: 0,
			editing: false,
			itemsPerPage: 10,
			page: 0,
			pages: 0,
			pageItems: 0,
			rowIndex: 0,
			rows: 0,
			selected: new Set(),
			sortIndex: -1,
			sortOrder: 0,
			tbody: [],
			thead: [],
		};
	}

	async connectedCallback() {
		if (this.options.debug) console.table(this.options, ['editable', 'locale', 'searchable', 'selectable']);
		if (!this.options.i18n[this.options.locale]) this.options.locale = 'en';

		/* Create elements / references to elements */
		this.wrapper = document.createElement('div');
		this.appendChild(this.wrapper);
		this.table = this.querySelector('table') || this.createTable();

		if (this.hasAttribute('tableclass')) {
			const classes = this.getAttribute('tableclass').split(' ')
			this.table.classList.add(...classes)
		}

		if (!this.table.tHead) this.table.appendChild(document.createElement('thead'));
		if (!this.table.tBodies.length) this.table.appendChild(document.createElement('tbody'));

		this.colgroup = this.table.querySelector('colgroup') || this.createColgroup();
		this.form = this.createForm();
		this.appendChild(this.form);

		if (this.options.searchable) {
			this.insertAdjacentHTML('afterbegin', renderSearch(this))
		}

		if (!this.getAttribute('data')) {
			this.state = Object.assign(this.state, dataFromTable(this.table, this.state.itemsPerPage, this.options.selectable));
			if (!this.hasAttribute('itemsperpage'))	this.state.itemsPerPage = this.state.rows;
			renderTable(this);
		}

		attachEventListeners(this);
		attachCustomEventHandlers(this);
	}

	/*
	========================
	Detect attribute changes
	========================
	*/

	attributeChangedCallback(name, oldValue, newValue) {
		const render = (oldValue && (oldValue !== newValue)) || false;
		consoleLog(`attr: ${name}=${newValue} (${oldValue})`, '#046');
	
		if (name === 'data') {
			try {
				const jsonData = JSON.parse(newValue);
				this.state = Object.assign(this.state, jsonData);
				renderTable(this);
			} catch (e) {
				fetchData(newValue, this).then(data => {
					this.state = Object.assign(this.state, data);
					renderTable(this);
				});
			}
		}
		if (name === 'items') {
			this.state.items = parseInt(newValue, 10);
			this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);
			updateNavigation(this);
		}
		if (name === 'itemsperpage') {
			this.state.itemsPerPage = parseInt(newValue, 10);
			if (this.state.itemsPerPage === -1) this.state.itemsPerPage = this.state.rows;
			this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);
			if (render) {
				this.setAttribute('page', 0);
				renderTBody(this);
			}
		}
		if (name === 'page') {
			this.state.page = parseInt(newValue, 10);
			if (render) {
				this.dispatch('pagechange', this.state);
				renderTBody(this);
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

	/*
	=======
	Methods
	=======
	*/

	createColgroup() {
		const colgroup = document.createElement('colgroup');
		this.table.insertAdjacentElement('afterbegin', colgroup);
		return colgroup;
	}

	createForm() {
		const form = document.createElement('form');
		form.id = `form${window.crypto.randomUUID()}`;
		form.innerHTML = renderForm(this);
		return form;
	}

	createTable() {
		const table = document.createElement('table');
		this.wrapper.appendChild(table);
		return table;
	}

	/**
	 * Dispatches a custom event with a specified name and detail.
	 * @param {string} name - The name of the event.
	 * @param {*} detail - The detail to be attached to the event.
	 * @returns {void}
	 */
	dispatch(name, detail) {
		try {
			consoleLog(`event: ${name}`, '#A0A');
			this.dispatchEvent(new CustomEvent(name, { detail }));
		} catch (error) {
			consoleLog(`Error in dispatch: ${error}`, '#F00');
		}
	};

	/**
	 * Begins the editing process for an active node if it is editable.
	 * @returns {void}
	 */
	editBegin() {
		try {
			// Check if editing is allowed and if there's an active node
			if (!this.options.editable || !this.active) return;

			const node = this.active;

			// Check if the active node is a table cell (TD)
			if (node.nodeName === 'TD') {
				// Set the editing state to true and make the cell content editable
				this.state.editing = true;
				node.toggleAttribute('contenteditable', this.state.editing);

				// Store the original cell value
				node.dataset.oldValue = node.textContent;

				// Move the cursor to the end of the cell content
				window.getSelection().collapseToEnd();
			}
		} catch (error) {
			consoleLog(`An error occurred while beginning edit: ${error}`, '#F00');
		}
	}

	/**
	 * Ends the editing process for a given node and dispatches a 'cellchange' event if the content has changed.
	 * @param {Node} node - The node representing the content being edited.
	 * @returns {void}
	 */
	editEnd(node) {
		try {
			// Set the editing state to false and make the node non-editable
			this.state.editing = false;
			node.toggleAttribute('contenteditable', this.state.editing);

			// Check if the content has changed; if not, remove the old value and return
			if (node.textContent === node.dataset.oldValue) {
				delete node.dataset.oldValue;
				return;
			}

			// Get the object associated with the node and update its field with the new content
			const obj = this.getObj(node);
			const field = this.table.tHead.rows[0].cells[node.cellIndex].dataset.field;
			obj[field] = node.textContent;

			// Dispatch a 'cellchange' event with the updated object
			this.dispatch('cellchange', obj);
		} catch (error) {
			consoleLog(`An error occurred while editing: ${error}`, '#F00');
		}
	}

	/**
	 * Retrieves the object data associated with a particular table-cell (node).
	 * @param {HTMLElement} node - The node for which object data is to be retrieved.
	 * @returns {Object|null} The object associated with the node or null if not found.
	 */
	getObj = (node) => {
		try {
			const uid = this.state.thead.find(cell => cell.uid)?.field;
			const key = node.parentNode.dataset.uid;
			return this.state.tbody.find(row => row[uid] === key) || null;
		} catch (error) {
			consoleLog(`Error retrieving object data: ${error}`, '#F00');
			return null;
		}
	}

	/**
	 * Moves to the next page and updates the 'page' attribute.
	 * In case the 'page' attribute is at its maximum value, it won't increment further.
	 */
	next = () => {
		try {
			this.state.rowIndex = 1;
			this.setAttribute('page', Math.min(this.state.page + 1, this.state.pages - 1));
		} catch (error) {
			consoleLog(`Error while moving to the next page: ${error}`, '#F00');
		}
	}

	/**
	* Moves to the previous page by updating the 'page' attribute.
	*/
	prev = () => {
		try {
			this.setAttribute('page', Math.max(this.state.page - 1, 0));
		} catch (error) {
			consoleLog(`Error while navigating to previous page: ${error}`, '#F00');
		}
	};

	/**
	 * Prints the table using a printElements instance.
	 */
	printTable() {
		try {
			const printer = new printElements(); // Assuming 'printElements' is the correct class name
			printer.print([this.table]);
		} catch (error) {
			consoleLog(`Error printing: ${error}`, '#F00');
		}
	}

	/**
	 * Renders an SVG icon based on a comma-separated list of SVG path data.
	 */
	renderIcon(paths) {
		return `<svg viewBox="0 0 24 24" class="ui-icon">${paths.split(',').map(path => `<path d="${path}"></path>`).join('')}</svg>`;
	}

	/**
	 * Resizes a column by adjusting its width based on the provided value.
	 * @param {number} index - The index of the column to resize.
	 * @param {number} value - The value by which to resize the column (positive or negative).
	 */
	resizeColumn = (index, value) => {
		try {
			const col = this.colgroup.children[index];
			const width = col.offsetWidth / this.table.offsetWidth * 100;
			col.style.width = `${width + value}%`;
		} catch (error) {
			consoleLog(`Error resizing column: ${error}`, '#F00');
		}
	}

	/**
	* Toggles selection on rows or sets them as selected based on the provided toggle flag.
	* @param {HTMLCollectionOf<Element>} rows - The rows to be selected/toggled.
	* @param {boolean} [toggle=true] - Optional flag to toggle selection (default: true).
	*/
	selectRows = (rows, toggle = true, force = false) => {
		try {
			Array.from(rows).forEach(row => {
				if (force) {
					toggle ? row.setAttribute('aria-selected', 'true') : row.removeAttribute('aria-selected');
				} else {
					toggle ? row.toggleAttribute('aria-selected') : row.setAttribute('aria-selected', 'true');
				}
				const selected = row.hasAttribute('aria-selected');
				const input = row.querySelector(`input[data-toggle-row]`);
				if (input) input.checked = selected;
				const key = row.dataset.uid;
				if (selected) this.state.selected.add(key);
				else this.state.selected.delete(key);
			});
			this.form.elements.selected.value = this.state.selected.size;

			if (this.toggle) {
				this.toggle.indeterminate = this.state.selected.size > 0 && this.state.selected.size < this.state.pageItems;
			}

			this.dispatch('selection', this.state.selected);
		} catch (error) {
			consoleLog(`Error selecting rows: ${error}`, '#F00');
		}
	}

	/**
	* Sets the active cell and focuses it for navigation/editing purposes.
	*/
	setActive = () => {
		try {
			if (this.active) {
				this.active.setAttribute('tabindex', '-1');
				if (this.state.editing) {
					this.editEnd(this.active);
				}
			}
			this.active = this.table.rows[this.state.rowIndex].cells[this.state.cellIndex];
			this.active.setAttribute('tabindex', '0');
			this.active.focus();
		} catch (error) {
			consoleLog(`Error setting active cell: ${error}`, '#F00');
		}
	}

	/**
	 * Translates a given key using the specified locale and i18n options.
	 *
	 * @param {string} key - The key to be translated.
	 * @returns {string} The translated value for the given key.
	 */
	translate(key) {
		return baseTranslate(key, this.options.locale, this.options.i18n);
	}

	/*
	===================
	Getters and Setters
	===================
	*/

	get data() {
		return this.state.tbody;
	}

	set data(newData) {
		if (Array.isArray(newData)) {
			this.state.tbody = newData;

			// Automatically generate thead based on the keys of the first object
			if (newData.length > 0) {
				this.state.thead = Object.keys(newData[0]).map((key) => ({
					field: key,
					label: capitalize(key),
					hidden: false,
					uid: false,
				}));
				this.state.cols = this.state.thead.length;
			} else {
				// If newData is an empty array, reset thead and cols
				this.state.thead = [];
				this.state.cols = 0;
			}

			// Update other state properties
			this.state.rows = newData.length;
			this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);

			// Re-render the table
			renderTable(this);
		} else {
			consoleLog(`Invalid data format: ${newData}`, '#F00');
		}
	}
}
customElements.define("data-grid", DataGrid);

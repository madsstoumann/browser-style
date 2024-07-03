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
 * @version 1.0.09
 * @summary 03-07-2024
 * @class
 * @extends {HTMLElement}
 */
export default class DataGrid extends HTMLElement {
	static observedAttributes = ['data', 'items', 'itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder'];
	constructor() {
		super();

		this.dataSet = false;

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
				if (!this.dataSet) renderTBody(this);
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

	dispatch(name, detail) {
		try {
			consoleLog(`event: ${name}`, '#A0A');
			this.dispatchEvent(new CustomEvent(name, { detail }));
		} catch (error) {
			consoleLog(`Error in dispatch: ${error}`, '#F00');
		}
	};

	editBegin() {
		try {
			if (!this.options.editable || !this.active) return;

			const node = this.active;

			if (node.nodeName === 'TD') {
				this.state.editing = true;
				node.toggleAttribute('contenteditable', this.state.editing);
				node.dataset.oldValue = node.textContent;
				window.getSelection().collapseToEnd();
			}
		} catch (error) {
			consoleLog(`An error occurred while beginning edit: ${error}`, '#F00');
		}
	}

	editEnd(node) {
		try {
			this.state.editing = false;
			node.toggleAttribute('contenteditable', this.state.editing);

			if (node.textContent === node.dataset.oldValue) {
				delete node.dataset.oldValue;
				return;
			}

			const obj = this.getObj(node);
			const field = this.table.tHead.rows[0].cells[node.cellIndex].dataset.field;
			obj[field] = node.textContent;

			this.dispatch('cellchange', obj);
		} catch (error) {
			consoleLog(`An error occurred while editing: ${error}`, '#F00');
		}
	}

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

	next = () => {
		try {
			this.state.rowIndex = 1;
			this.setAttribute('page', Math.min(this.state.page + 1, this.state.pages - 1));
		} catch (error) {
			consoleLog(`Error while moving to the next page: ${error}`, '#F00');
		}
	}

	prev = () => {
		try {
			this.setAttribute('page', Math.max(this.state.page - 1, 0));
		} catch (error) {
			consoleLog(`Error while navigating to previous page: ${error}`, '#F00');
		}
	};

	printTable() {
		try {
			const printer = new printElements();
			printer.print([this.table]);
		} catch (error) {
			consoleLog(`Error printing: ${error}`, '#F00');
		}
	}

	renderIcon(paths) {
		return `<svg viewBox="0 0 24 24" class="ui-icon">${paths.split(',').map(path => `<path d="${path}"></path>`).join('')}</svg>`;
	}

	resizeColumn = (index, value) => {
		try {
			const col = this.colgroup.children[index];
			const width = col.offsetWidth / this.table.offsetWidth * 100;
			col.style.width = `${width + value}%`;
		} catch (error) {
			consoleLog(`Error resizing column: ${error}`, '#F00');
		}
	}

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

			if (newData.length > 0) {
				this.state.thead = Object.keys(newData[0]).map((key) => ({
					field: key,
					label: capitalize(key),
					hidden: false,
					uid: false,
				}));
				this.state.cols = this.state.thead.length;
			} else {
				this.state.thead = [];
				this.state.cols = 0;
			}

			this.state.rows = newData.length;
			this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);

			if (!this.dataSet) {
				renderTable(this);
				this.dataSet = true;
			}
			else {
				renderTBody(this);
			}
			
		} else {
			consoleLog(`Invalid data format: ${newData}`, '#F00');
		}
	}
}
customElements.define("data-grid", DataGrid);

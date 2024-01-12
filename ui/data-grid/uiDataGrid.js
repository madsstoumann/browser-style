import printElements from '../../assets/js/printElements.js';
/**
 * uiDataGrid
 * Wraps a HTML table element and adds functionality for sorting, pagination, searching and selection.
 * @author Mads Stoumann
 * @version 1.0.05
 * @summary 11-01-2024
 * @class
 * @extends {HTMLElement}
 */
export default class uiDataGrid extends HTMLElement {
	static observedAttributes = ['itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder', 'src'];
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
		},

		this.options = {
			density: this.hasAttribute('density') || false,
			debug: this.hasAttribute('debug') || false,
			editable: this.hasAttribute('editable') || false,
			exportable: this.hasAttribute('exportable') || false,
			i18n: this.hasAttribute('i18n') ? this.i18n(this.getAttribute('i18n')) : this.defaultLang,
			locale: this.getAttribute('lang') || document.documentElement.lang || 'en',
			pagesize: this.getAttribute('pagesize')?.split(',') || [5, 10, 25, 50, 100],
			printable: this.hasAttribute('printable') || false,
			searchable: this.hasAttribute('searchable') || false,
			selectable: this.hasAttribute('selectable') || false
		}

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
		}
	}

	async connectedCallback() {
		if (this.options.debug) console.table(this.options, ['editable', 'locale', 'searchable', 'selectable']);
		if (!this.options.i18n[this.options.locale]) this.options.locale = 'en';

		const icons = {
			chevronLeft: 'M15 6l-6 6l6 6',
			chevronLeftPipe: 'M7 6v12, M18 6l-6 6l6 6',
			chevronRight: 'M9 6l6 6l-6 6',
			chevronRightPipe: 'M7 6l6 6l-6 6,M18 6v12',
			csv: 'M10 15a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1,M17 8l2 8l2 -8,M7 10a2 2 0 1 0 -4 0v4a2 2 0 1 0 4 0',
			density: 'M4 6h16,M4 10h16,M4 14h16,M4 18h16',
			json: 'M20 16v-8l3 8v-8,M15 8a2 2 0 0 1 2 2v4a2 2 0 1 1 -4 0v-4a2 2 0 0 1 2 -2z,M1 8h3v6.5a1.5 1.5 0 0 1 -3 0v-.5,M7 15a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-1a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1h1a1 1 0 0 1 1 1',
			printer: 'M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2,M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4,M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z'
		}

		/* Create elements / references to elements */
		this.wrapper = document.createElement('div');
		this.appendChild(this.wrapper);

		this.table = this.querySelector('table') || (() => {
			const table = document.createElement('table');
			this.wrapper.appendChild(table);
			return table;
		})();

		if (this.hasAttribute('tableclass')) {
			const classes = this.getAttribute('tableclass').split(' ')
			this.table.classList.add(...classes)
		}

		if (!this.table.tHead) this.table.appendChild(document.createElement('thead'));
		if (!this.table.tBodies.length) this.table.appendChild(document.createElement('tbody'));

		this.colgroup = this.table.querySelector('colgroup') || (() => {
			const colgroup = document.createElement('colgroup');
			this.table.insertAdjacentElement('afterbegin', colgroup);
			return colgroup;
		})();

		this.form = document.createElement('form');
		this.form.id = `form${window.crypto.randomUUID()}`;
		this.form.innerHTML = `
		<fieldset name="selection">
			<small><output name="selected">0</output> ${this.t('selected')}</small>
		</fieldset>

		<fieldset name="actions">
			${this.options.printable ? `<button type="button" name="print">${this.renderIcon(icons.printer)}</button>` : ''}
			${this.options.density ? `<button type="button" name="density">${this.renderIcon(icons.density)}</button>` : ''}
			${this.options.exportable ? `<button type="button" name="csv">${this.renderIcon(icons.csv)}</button>` : ''}
			${this.options.exportable ? `<button type="button" name="json">${this.renderIcon(icons.json)}</button>` : ''}
		</fieldset>

		<fieldset name="navigation">
			<label>${this.t('rowsPerPage')}:
				<select name="itemsperpage">${this.options.pagesize
					.map(
						(value) =>
							`<option${
								value === this.state.itemsPerPage ? ` selected` : ''
							}>${value}</option>`,
					)
					.join('')}</select>
			</label>
			<small>
			<output name="start"></output>&ndash;<output name="end"></output>
			${this.t('of')}
			<output name="total"></output>
		</small>
			<fieldset>
				<button type="button" name="first" title="${this.t('first')}">
					${this.renderIcon(icons.chevronLeftPipe)}
				</button>
				<button type="button" name="stepdown" title="${this.t('prev')}">
					${this.renderIcon(icons.chevronLeft)}
				</button>
				<label title="${this.t('page')}">
					<input type="number" name="page" min="1" size="1">
				</label>
				${this.t('of')}<output name="pages"></output>
				<button type="button" name="stepup" title="${this.t('next')}">
					${this.renderIcon(icons.chevronRight)}
				</button>
				<button type="button" name="last" title="${this.t('last')}">
					${this.renderIcon(icons.chevronRightPipe)}
				</button>
			</fieldset>
		</fieldset>`;

		this.appendChild(this.form)

		/* Search */
		if (this.options.searchable) {
			const search = `
			<fieldset name="search" form="${this.form.id}">
				<label>
					<input type="search" name="searchterm" form="${this.form.id}" placeholder="${this.t('search')}" value="${this.getAttribute('searchterm') || ''}">
				</label>
				<label>
					<select name="searchmethod" form="${this.form.id}" >
						<option value="includes" selected>${this.t('includes')}</option>
						<option value="start">${this.t('startsWith')}</option>
						<option value="end">${this.t('endsWith')}</option>
						<option value="equals">${this.t('equals')}</option>
					</select>
				</label>
			</fieldset>`
			this.insertAdjacentHTML('afterbegin', search)
		}

		/* Use inline table, if `src` attribute is not set */
		if (!this.getAttribute('src')) {
			this.state = Object.assign(this.state, this.dataFromTable(this.table))
			if (!this.hasAttribute('itemsperpage'))	this.state.itemsPerPage = this.state.rows
			this.renderTable()
		}

		/*
		======
		Events
		======
		*/

		this.form.elements.stepdown.addEventListener('click', () => this.prev());
		this.form.elements.stepup.addEventListener('click', () => this.next());
		this.form.elements.first.addEventListener('click', () => this.setAttribute('page', 0));
		this.form.elements.last.addEventListener('click', () => this.setAttribute('page', this.state.pages - 1));
		if (this.options.printable) this.form.elements.print.addEventListener('click', () => this.printTable());
		if (this.options.exportable) {
			this.form.elements.csv.addEventListener('click', () => {
				const csv = this.exportCSV();
				if (csv) this.downloadFile(csv, 'export.csv');
			})
			this.form.elements.json.addEventListener('click', () => {
				const json = JSON.stringify(this.state.tbody, null, 2);
				if (json) this.downloadFile(json, 'export.json', 'application/json;charset=utf-8;');
			})
		}
		if (this.options.density) this.form.elements.density.addEventListener('click', () => { this.table.classList.toggle('--compact')});
		if (this.options.searchable) {
			['input', 'search'].forEach(str => {
				this.form.elements.searchterm.addEventListener(str, event => {
					this.setAttribute('searchterm', event.target.value)
				})
			})
			this.form.elements.searchmethod.addEventListener('change', event => {
				this.setAttribute('searchmethod', event.target.value)
				this.renderTBody()
			})
		}

		this.table.addEventListener('click', (event) => {
			const node = event.target
			if (node === this.table) return
			if (['TD', 'TH'].includes(node.nodeName)) {
				this.state.cellIndex = node.cellIndex
				this.state.rowIndex = node.parentNode.rowIndex
				if (this.state.rowIndex === 0) {
					const index = node.dataset.sortIndex;
					if (index !== undefined) this.setAttribute('sortindex', parseInt(index, 10));
				}
				this.setActive()
			}
			if (this.options.selectable && node.nodeName === 'INPUT') {
				if (node.hasAttribute('data-toggle-row')) this.selectRows([node.closest('tr')], true)
				if (node.hasAttribute('data-toggle-all')) {
					if (this.state.selected.size) {
						node.checked = false;
						this.selectRows(this.table.tBodies[0].rows, false, true)
					} else {
						this.selectRows(this.table.tBodies[0].rows, true, true)
					}
				}
			}
		})

		/* Edit cell on dblclick */
		this.table.tBodies[0].addEventListener('dblclick', () => {
			this.editBegin()
		});

		this.table.addEventListener('keydown', (event) => {
			const node = event.target
			const { key, ctrlKey, metaKey, shiftKey } = event;
			const isEditable = this.options.editable;
			const isSelectable = this.options.selectable;

			const handleSpaceKey = () => {
				if (node.nodeName === 'TH') {
					/* Toggle selection of rows */
					if (isSelectable && this.state.cellIndex === 0) {
						if (this.state.selected.size) {
							this.selectRows(this.table.tBodies[0].rows, false, true)
							this.toggle.checked = false;
						} else {
							this.selectRows(this.table.tBodies[0].rows, true, true)
							this.toggle.checked = true;
						}
					} else {
						/* Press space to sort column */
						event.preventDefault();
						const index = node.dataset.sortIndex;
						if (index !== undefined) {
							this.setAttribute('sortindex', parseInt(index, 10));
						}
					}
				}
				/* Shift + Space to select row */
				if (node.nodeName === 'TD' && isSelectable) {
					if ((this.state.cellIndex === 0) || shiftKey) {
						event.preventDefault();
						this.selectRows([node.parentNode], true);
					}
				}
			}

			const handleAKey = () => {
				/* Ctrl/Command + a to select all rows */
				if (isSelectable && (ctrlKey || metaKey)) {
					event.preventDefault();
					this.selectRows(this.table.tBodies[0].rows, false);
				}
			}

			const handleIKey = () => {
				/* Ctrl/Command + Shift + i to invert selection */
				if (isSelectable && (ctrlKey || metaKey) && shiftKey) {
					event.preventDefault();
					this.selectRows(this.table.tBodies[0].rows);
				}
			}

			const handleArrowKeys = (direction) => {
				event.preventDefault();
				if (direction === 'ArrowDown') {
					this.state.rowIndex = Math.min(this.state.rowIndex + 1, this.state.pageItems);
				} else if (direction === 'ArrowUp') {
					this.state.rowIndex = Math.max(this.state.rowIndex - 1, 0);
				} else if (direction === 'ArrowRight' && !this.state.editing) {
					/* Shift + ArrowRight to resize column */
					if (shiftKey && node.nodeName === 'TH') {
						return this.resizeColumn(node.cellIndex, 1)
					}
					this.state.cellIndex = Math.min(this.state.cellIndex + 1, this.state.cols - 1)
				} else if (direction === 'ArrowLeft' && !this.state.editing) {
					/* Shift + ArrowLeft to resize column */
					if (shiftKey && node.nodeName === 'TH') {
						return this.resizeColumn(node.cellIndex, -1)
					}
					this.state.cellIndex = Math.max(this.state.cellIndex - 1, 0)
				}
			}

			const handleEndKey = () => {
				if (!shiftKey) {
					this.state.cellIndex = this.state.cols - 1;
				}
				if (ctrlKey || metaKey || shiftKey) {
					this.state.rowIndex = this.state.pageItems;
				}
			};
		
			const handleHomeKey = () => {
				if (!shiftKey) {
					this.state.cellIndex = 0;
				}
				if (ctrlKey || metaKey || shiftKey) {
					this.state.rowIndex = 0;
				}
			};

			const handlePKey = () => {
				if (ctrlKey || metaKey) {
					event.preventDefault();
					this.printTable()
				}
			}
		
			const handlePageKeys = (direction) => {
				if (direction === 'PageDown') {
					this.next();
				} else if (direction === 'PageUp') {
					this.prev();
				}
			}

			const handleF2Key = () => {
				if (!isEditable) return;
				this.editBegin();
			}

			const handleTabKey = () => {
				/* TODO! */
				// if (this.state.editing) {
				// 	event.preventDefault();
				// 	this.state.editing = false;
				// 	node.toggleAttribute('contenteditable', this.state.editing);
				// }
			}

			switch(event.key) {
				case ' ': handleSpaceKey(); break;
				case 'a': handleAKey(); break;
				case 'i': handleIKey(); break;
				case 'ArrowDown':
				case 'ArrowUp':
				case 'ArrowRight':
				case 'ArrowLeft': handleArrowKeys(key); break;
				case 'End': handleEndKey(); break;
				case 'Home': handleHomeKey(); break;
				case 'p': handlePKey(); break;
				case 'PageDown':
				case 'PageUp': handlePageKeys(key); break;
				case 'F2': handleF2Key(); break;
				case 'Tab': handleTabKey(); break;
			}

			if (!this.state.editing) this.setActive()
		})

		this.form.addEventListener('input', (event) => {
			const input = event.target;
			if (input.name === 'itemsperpage') this.setAttribute('itemsperpage', parseInt(event.target.value, 10));
			if (input.name === 'page') this.setAttribute('page', parseInt(event.target.value, 10) - 1);
		})

		/*
		==============
		Receive Events
		==============
		*/
		this.addEventListener('dg:append', (event) => {
			const { detail } = event;
			this.state.tbody.push(...detail);
			const rows = this.state.tbody.length;
			this.state.pages = Math.floor(rows / this.state.itemsPerPage);
			this.state.rows = rows;
			this.renderTBody();
		});

		this.addEventListener('dg:clearselected', () => {
			this.state.selected.clear();
			this.renderTBody();
			if (this.toggle) {
				this.toggle.checked = false;
				this.toggle.indeterminate = false;
			}
			this.dispatch('dg:selected', {detail: []});
		});

		this.addEventListener('dg:getrow', () => {
			const node = this.active;
			if (node) {
				const obj = this.getObj(node);
				this.dispatch('dg:row', {detail: obj});
			}
		});

		this.addEventListener('dg:getselected', () => {
			const selected = [...this.state.selected].map(key => this.state.tbody.find(row => row[this.state.thead.find(cell => cell.uid).field] === key));
			this.dispatch('dg:selected', {detail: selected});
		});
	}

	/*
	========================
	Detect attribute changes
	========================
	*/

	attributeChangedCallback(name, oldValue, newValue) {
		const render = (oldValue && (oldValue !== newValue)) || false;
		this.console(`attr: ${name}=${newValue} (${oldValue})`, '#046');

		if (name === 'itemsperpage') {
			this.state.itemsPerPage = parseInt(newValue, 10);
			if (this.state.itemsPerPage === -1) this.state.itemsPerPage = this.state.rows;
			this.state.pages = this.pages(this.state.rows, this.state.itemsPerPage);
			if (render) {
				this.setAttribute('page', 0);
				this.renderTBody();
			}
		}
		if (name === 'page') {
			this.state.page = parseInt(newValue, 10);
			if (render) {
				this.dispatch('pagechange', this.state);
				this.renderTBody();
			}
		}
		if (name === 'searchterm') {
			if (render) {
				this.setAttribute('page', 0);
				this.renderTBody();
			}
		}
		if (name === 'src') {
			this.fetchData(newValue).then(data => {
				this.state = Object.assign(this.state, data);
				this.renderTable();
			}) 
		}
		if (name === 'sortindex') {
			this.state.sortIndex = parseInt(newValue, 10);
			if (oldValue === newValue) this.setAttribute('sortorder', + !this.state.sortOrder);
			this.renderTBody();
		}
		if (name === 'sortorder') {
			this.state.sortOrder = parseInt(newValue, 10);
			if (render) this.renderTBody();
		}
	}

	/*
	=======
	Methods
	=======
	*/

	/**
	 * Converts a string to camelCase format.
	 * @param {string} str - The input string to be converted.
	 * @returns {string} The camelCase formatted string.
	 */
	camelCase(str) {
		try {
			return str.split(' ').map((e, i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('');
		} catch (error) {
			this.console(`Error in camelCase: ${error}`, '#F00');
			return str; // Return the original string in case of an error
		}
	};

	/**
	 * Updates the colgroup HTML element with columns based on the state's column count.
	 * @returns {void}
	 */
	colGroup() {
		try {
			this.colgroup.innerHTML = `<col>`.repeat(this.state.cols);
		} catch (error) {
			this.console(`Error in colGroup: ${error}`, '#F00');
		}
	};

	/**
	 * Outputs a formatted console log if debug mode is enabled.
	 * @param {string} str - The string to be logged.
	 * @param {string} [bg='#000'] - The background color for formatting in the console.
	 * @returns {void}
	 */
	console(str, bg = '#000') {
		if (this.options.debug) {
			console.log(`%c${str}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`);
		}
	};

	/**
	 * Extracts data from a provided table element and formats it into a structured object.
	 * @param {HTMLTableElement} table - The table element from which to extract data.
	 * @returns {Object} An object containing structured data extracted from the table.
	 */
	dataFromTable(table) {
		try {
			let hidden = 0;
			const thead = [...table.tHead.rows[0].cells].map(cell => {
				if (cell.hasAttribute('hidden')) hidden++;
				return {
					field: this.camelCase(cell.textContent),
					hidden: cell.hasAttribute('hidden'),
					label: cell.textContent,
					uid: cell.hasAttribute('data-uid')
				};
			});

			const tbody = [...table.tBodies[0].rows].map(row => {
				const obj = {};
				[...row.cells].forEach((cell, index) => {
					const field = thead[index].field;
					obj[field] = cell.textContent;
				});
				return obj;
			});

			return {
				cols: (thead.length - hidden) + (this.options.selectable ? 1 : 0),
				pages: Math.floor(tbody.length / this.state.itemsPerPage),
				rows: tbody.length,
				tbody,
				thead
			};
		} catch (error) {
			this.console(`Error extracting data from table: ${error}`, '#F00');
			return {}; // Return an empty object in case of an error
		}
	}

	/**
	 * Dispatches a custom event with a specified name and detail.
	 * @param {string} name - The name of the event.
	 * @param {*} detail - The detail to be attached to the event.
	 * @returns {void}
	 */
	dispatch(name, detail) {
		try {
			this.console(`event: ${name}`, '#A0A');
			this.dispatchEvent(new CustomEvent(name, { detail }));
		} catch (error) {
			this.console(`Error in dispatch: ${error}`, '#F00');
		}
	};

	/**
	 * Downloads an exported file based on the provided content.
	 * @param {string} content - The content to be downloaded.
	 * @param {string} filename - The desired filename for the downloaded file.
	 * @param {string} mimeType ['text/csv'] - The MIME type of the downloaded file.
	 */
	downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
		try {
			const blob = new Blob([content], { type: mimeType });
			const link = document.createElement('a');
			if (link.download !== undefined) {
				const url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', filename);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		} catch (error) {
			this.console(`Error creating downloadable file: ${error}`, '#F00');
		}
	}

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
			this.console(`An error occurred while beginning edit: ${error}`, '#F00');
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
			this.console(`An error occurred while editing: ${error}`, '#F00');
		}
	}

	/**
	 * Generates a CSV string from table data.
	 * @returns {string} The CSV string representation of the table data.
	 */
	exportCSV() {
		try {
			// Extract headers and rows
			const headers = this.state.thead.map(cell => cell.label).join(',');
			const rows = this.state.tbody.map(row => Object.values(row).join(','));
			// Combine headers and rows to form CSV string
			return `${headers}\r\n${rows.join('\r\n')}`;
		} catch (error) {
			this.console(`Error exporting CSV: ${error}`, '#F00');
			return ''; // Return empty string in case of an error
		}
	}

	/**
	 * Fetches data either from a JSON string or a URL and parses it.
	 * @param {string} str - The URL or JSON string from which data will be fetched.
	 * @returns {Promise<any>} A Promise that resolves to the parsed data.
	 */
	async fetchData(str) {
		let data;
		try {
			// Check if the `str` parameter is a JSON string
			data = JSON.parse(str);
		} catch (error) {
			// If it's not a JSON string, fetch the data from the URL
			const response = await fetch(str);
			data = await response.json();
		}
		return this.parseData(data);
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
			this.console(`Error retrieving object data: ${error}`, '#F00');
			return null;
		}
	}

	/**
	 * Parses a string into JSON and returns the parsed JSON object or the default language if parsing fails.
	 * @param {string} str - The string to be parsed into JSON.
	 * @returns {Object} The parsed JSON object or the default language object if parsing fails.
	 */
	i18n = (str) => {
		try {
			const json = JSON.parse(str);
			if (typeof json === 'object') return json;
			throw new Error('Invalid JSON format');
		} catch (error) {
			this.console(`Error parsing JSON: ${error}`, '#F00');
			return this.defaultLang;
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
			this.console(`Error while moving to the next page: ${error}`, '#F00');
		}
	}

	/**
	 * Parses data and extracts information necessary for table rendering.
	 * @param {Object} data - The data containing table headers and body.
	 * @returns {Object} An object containing information for table rendering.
	 * @throws {Error} Throws an error if the provided data is missing table headers or body.
	 */
	parseData = (data) => {
		try {
			if (!data.thead || !data.tbody) {
				throw new Error('Invalid JSON format: Missing table headers or body');
			}

			let hidden = 0;
			data.thead.forEach((cell) => {
				if (cell.hidden) hidden++;
			});

			return {
				cols: (data.thead.length - hidden) + (this.options.selectable ? 1 : 0),
				pages: this.pages(data.tbody.length, this.state.itemsPerPage),
				rows: data.tbody.length,
				tbody: data.tbody,
				thead: data.thead
			};
		} catch (error) {
			this.console(`Error parsing data: ${error}`, '#F00');
			throw error; // Re-throwing the error to handle it further if needed
		}
	};

	/**
	 * Calculates the total number of pages based on the number of items and items per page.
	 * @param {number} items - Total number of items.
	 * @param {number} itemsPerPage - Number of items per page.
	 * @returns {number} The total number of pages.
	 */
	pages = (items, itemsPerPage) => {
		if (itemsPerPage <= 0) {
			throw new Error('Invalid value: items per page should be greater than 0');
		}
		return Math.ceil(items / itemsPerPage);
	};

	/**
	* Moves to the previous page by updating the 'page' attribute.
	*/
	prev = () => {
		try {
			this.setAttribute('page', Math.max(this.state.page - 1, 0));
		} catch (error) {
			this.console(`Error while navigating to previous page: ${error}`, '#F00');
		}
	};

	/**
	* Paginates the provided data based on the current page and items per page settings.
	* @param {Array} data - The data to be paginated.
	* @returns {Array} The paginated portion of the data for the current page.
	*/
	paginate = (data) => {
		try {
			const startIndex = this.state.page * this.state.itemsPerPage;
			const endIndex = startIndex + this.state.itemsPerPage;
			return data.slice(startIndex, endIndex);
		} catch (error) {
			this.console(`Error while paginating data: ${error}`, '#F00');
			return []; // Return an empty array in case of an error
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
			this.console(`Error printing: ${error}`, '#F00');
		}
	}

	/**
	 * Renders an SVG icon based on a comma-separated list of SVG path data.
	 */
	renderIcon(paths) {
		return `<svg viewBox="0 0 24 24" class="ui-icon">${paths.split(',').map(path => `<path d="${path}"></path>`).join('')}</svg>`;
	}

	/**
	 * Renders an entire table including colgroup, table header, and table body.
	 */
	renderTable() {
		this.console(`render: table`, '#52B');
		this.colGroup();
		this.renderTHead();
		this.renderTBody();
	}

	/**
 	* Renders the table body (tbody) based on the current state and search parameters.
 	*/
	renderTBody() {
		try {
			if (!this.state.tbody.length) return;

			/* Create an array of indexes of hidden columns */
			const hidden = this.state.thead.map((cell, index) => cell.hidden ? index : '').filter(String)

			/* Get the (first) field containing a unique identifier */
			const uid = this.state.thead.find(cell => cell.uid)?.field

			const allowedMethods = ['end', 'equals', 'start'];
			let method = this.getAttribute('searchmethod') || 'includes';
			
			// Ensure the method is one of the allowed methods; otherwise, default to 'includes'
			method = allowedMethods.includes(method) ? method : 'includes';
			const searchterm = this.getAttribute('searchterm')?.toLowerCase();

			/* If `searchterm` exists, prevents search in hidden columns, otherwise return `tbody` */
			const data = searchterm
			? this.state.tbody.filter((row) =>
				Object.values(row).some((cell, index) => {
					if (!hidden.includes(index)) {
						const lowerCaseCell = cell.toString().toLowerCase();
						if (method === 'start') {
							return lowerCaseCell.startsWith(searchterm);
						} else if (method === 'end') {
							return lowerCaseCell.endsWith(searchterm);
						} else if (method === 'equals') {
							return lowerCaseCell === searchterm;
						} else { // method === 'includes'
							return lowerCaseCell.includes(searchterm);
						}
					}
					return false;
				})
			)
			: this.state.tbody;

			/* Create a regular expression from `searchterm` and `searchmethod` */
			const searchMethods = {
				end: `${searchterm}\\b`,
				equals: `^${searchterm}$`,
				includes: searchterm,
				start: `^\\b${searchterm}`
			};
			
			const regex = searchterm ? new RegExp(searchMethods[method], 'gi') : null;

			/* Sort data, if `sortIndex` is greater than -1 */
			if (this.state.sortIndex > -1) {
				data.sort(
					(a, b) => {
						const A = Object.values(a)[this.state.sortIndex]
						const B = Object.values(b)[this.state.sortIndex]
						return typeof A === 'string' ? A.localeCompare(B, this.options.locale, { sensitivity: 'variant' }) : A - B
					});
				if (this.state.sortOrder === 1) data.reverse()
			}

			/* If no data, exit early */
			if (!data.length) {
				this.table.tBodies[0].innerHTML = `<tr><td colspan="${this.state.cols}">${this.t('noResult')}</td></tr>`
				this.state.pageItems = 0
				this.state.items = 0
				this.state.pages = 0
				this.updateNavigation()
				return
			}

			/* Paginate data */
			const page = this.paginate(data)
			this.state.pageItems = page.length
			this.state.items = data.length
			this.state.pages = this.pages(data.length, this.state.itemsPerPage)

			this.table.tBodies[0].innerHTML = page
				.map((row) => {
					const selected = this.state.selected.has(row[uid]) ? ' aria-selected' : '';
					const mapped = Object.values(row)
						.map((cell, index) => {
							if (this.state.thead[index].hidden) return

							const formatMethod = this.state.thead[index].formatter;
							const formatter = this.formatters && this.formatters[formatMethod] || ((value) => value);
							const selectable = (this.options.selectable && index === 0) ? `<td><label><input type="checkbox" tabindex="-1"${selected ? ` checked`:''} data-toggle-row></label></td>` : '';

							return `${
								selectable}<td tabindex="-1">${
								formatter(regex
									? cell.toString().replaceAll(regex, (match) => `<mark>${match}</mark>`)
									: cell)
							}</td>`;
						})
						.join('');
					return `<tr${selected}${uid ? ` data-uid="${row[uid]}"`:''}>${mapped}</tr>`;
				})
				.join('');

			this.console(`render: tbody`, '#584');
			if (this.options.debug) console.log(this.state)

			this.updateNavigation()
		} catch (error) {
			this.console(`Error rendering table body (tbody): ${error}`, '#F00');
		}
	}

	/**
	 * Renders the table header (thead) based on the current state.
	 * Finds the first non-hidden column and constructs the table header accordingly.
	 */
	renderTHead() {
		try {
			const firstNotHidden = this.state.thead.find(cell => !cell.hidden);

			// Constructing the table header HTML
			const tableHeaderHTML = `<tr>${this.state.thead
				.map((cell, index) => {
						if (cell.hidden) return '';

						// Check if the column is selectable and assign appropriate attributes
						const isSelectable = this.options.selectable && index === 0;
						const tabIndex = cell === firstNotHidden ? (isSelectable ? -1 : 0) : -1;

						// Construct the table header content based on selectability
						const th = `<th tabindex="${tabIndex}"${cell.uid ? ` data-uid` : ''} data-field="${cell.field}" data-sort-index="${index}"><span>${cell.label || cell}</span></th>`;
						const content = isSelectable ? `<th tabindex="0"><label><input type="checkbox" tabindex="-1" data-toggle-all></label></th>${th}` : th;
						return content;
				})
				.join('')}</tr>`;

			this.table.tHead.innerHTML = tableHeaderHTML;
			if (this.options.selectable) this.toggle = this.table.querySelector('input[data-toggle-all]');

			this.console(`render: thead`, '#56F');
		} catch (error) {
			this.console(`Error rendering table header (thead): ${error}`, '#F00');
		}
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
			this.console(`Error resizing column: ${error}`, '#F00');
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
			this.console(`Error selecting rows: ${error}`, '#F00');
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
			this.console(`Error setting active cell: ${error}`, '#F00');
		}
	}

	/**
	 * Translates a key into the corresponding localized string.
	 * @param {string} key - The key to be translated.
	 * @returns {string} The translated string or a placeholder if the key is not found.
	 */
	t = (key) => {
		try {
			const translation = this.options.i18n[this.options.locale][key];
			return translation || `[${key}]`;
		} catch (error) {
			this.console(`Error translating key: ${error}`, '#F00');
			return `[${key}]`; // Return placeholder if an error occurs
		}
	}

	/**
	 * Updates the navigation elements based on the current state.
	 */
	updateNavigation() {
		try {
			const { page, pages, items, itemsPerPage, pageItems } = this.state;
			const E = this.form.elements;

			E.actions.hidden = !items;
			E.navigation.hidden = !this.hasAttribute('itemsperpage') || !items;
			E.selection.hidden = !this.options.selectable;

			E.end.value = Math.min((page + 1) * itemsPerPage, items);
			E.page.setAttribute('max', pages);
			E.page.size = page.toString().length;
			E.page.value = page + 1;
			E.pages.value = pages;
			E.start.value = page === pages - 1 ? page * itemsPerPage + 1 : page * pageItems + 1;
			E.first.disabled = page === 0;
			E.stepdown.disabled = page === 0;
			E.stepup.disabled = page === pages - 1;
			E.last.disabled = page === pages - 1;
			E.total.value = items;
		} catch (error) {
			this.console(`Error updating navigation: ${error}`, '#F00');
		}
	}
}
customElements.define("ui-datagrid", uiDataGrid);
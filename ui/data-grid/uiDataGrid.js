import { Icons } from './icons.js';
import tablerIcon from './tablerIcon.js';
import printElements from './printElements.js';
/**
 * uiDataGrid
 * Wraps a HTML table element and adds functionality for sorting, pagination, searching and selection.
 * @author Mads Stoumann
 * @version 1.0.02
 * @summary 09-01-2024
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
				of: 'of',
				next: 'Next',
				noResult: 'No results',
				page: 'Page',
				prev: 'Previous',
				selected: 'selected',
				rowsPerPage: 'Rows',
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

		/* Create elements / references to elements */
		this.table = this.querySelector('table') || (() => {
			const table = document.createElement('table');
			this.appendChild(table);
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

		this.navigation = document.createElement('form')
		this.navigation.innerHTML = `
		<fieldset name="selection">
			<small><output name="selected">0</output> ${this.t('selected')}</small>
		</fieldset>

		<fieldset name="actions">
			${this.options.printable ? `<button type="button" name="print">${tablerIcon(Icons.printer)}</button>` : ''}
			${this.options.density ? `<button type="button" name="density">${tablerIcon(Icons.densitySmall)}</button>` : ''}
			${this.options.exportable ? `<button type="button" name="csv">${tablerIcon(Icons.csv)}</button>` : ''}
			${this.options.exportable ? `<button type="button" name="json">${tablerIcon(Icons.json)}</button>` : ''}
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
				<button type="button" name="first" aria-label="${this.t('first')}">
					${tablerIcon(Icons.chevronLeftPipe)}
				</button>
				<button type="button" name="stepdown" aria-label="${this.t('prev')}">
					${tablerIcon(Icons.chevronLeft)}
				</button>
				<label aria-label="${this.t('page')}">
					<input type="number" name="page" min="1" size="1">
				</label>
				${this.t('of')}<output name="pages"></output>
				<button type="button" name="stepup" aria-label="${this.t('next')}">
					${tablerIcon(Icons.chevronRight)}
				</button>
				<button type="button" name="last" aria-label="${this.t('last')}">
					${tablerIcon(Icons.chevronRightPipe)}
				</button>
			</fieldset>
		</fieldset>`;

		this.navigation.elements.stepdown.addEventListener('click', () => this.prev());
		this.navigation.elements.stepup.addEventListener('click', () => this.next());
		this.navigation.elements.first.addEventListener('click', () => this.setAttribute('page', 0));
		this.navigation.elements.last.addEventListener('click', () => this.setAttribute('page', this.state.pages - 1));

		if (this.options.printable) this.navigation.elements.print.addEventListener('click', () => this.printTable());

		if (this.options.exportable) {
			this.navigation.elements.csv.addEventListener('click', () => {
				const csv = this.exportCSV();
				if (csv) this.downloadExport(csv, 'export.csv');
			})
			this.navigation.elements.json.addEventListener('click', () => {
				const json = JSON.stringify(this.state.tbody, null, 2);
				if (json) this.downloadExport(json, 'export.json', 'application/json;charset=utf-8;');
			})
		}

		if (this.options.density) this.navigation.elements.density.addEventListener('click', () => { this.table.classList.toggle('--compact')});

		this.appendChild(this.navigation)

		if (this.options.searchable && !this.search) {
			this.search = document.createElement('input')
			this.search.setAttribute('type', 'search')
			this.search.setAttribute('placeholder', 'Search')
			this.search.setAttribute('value', this.getAttribute('searchterm') || '');

			['input', 'search'].forEach(str => {
				this.search.addEventListener(str, event => {
					this.setAttribute('searchterm', event.target.value)
				})
			})
			this.insertAdjacentElement('afterbegin', this.search)
		}

		if (!this.getAttribute('src')) {
			this.state = Object.assign(this.state, this.dataFromTable(this.table))
			if (!this.hasAttribute('itemsperpage'))	this.state.itemsPerPage = this.state.rows
			this.renderTable()
		}

		/* Events */
		this.table.addEventListener('click', (event) => {
			const node = event.target
			if (['TD', 'TH'].includes(node.nodeName)) {
				this.state.cellIndex = node.cellIndex
				this.state.rowIndex = node.parentNode.rowIndex
				if (this.state.rowIndex === 0) {
					const index = node.dataset.sortIndex;
					if (index !== undefined) this.setAttribute('sortindex', parseInt(index, 10));
				}
				else {
					if (event.shiftKey) {
						event.preventDefault()
						document.getSelection().removeAllRanges();
						this.selectRows([node.parentNode]);
					}
				}
				this.setActive()
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
					/* Press space to sort column */
					event.preventDefault();
					const index = node.dataset.sortIndex;
					if (index !== undefined) {
						this.setAttribute('sortindex', parseInt(index, 10));
					}
				}
				/* Shift + Space to select row */
				if (node.nodeName === 'TD' && isSelectable && shiftKey) {
					event.preventDefault();
					this.selectRows([node.parentNode]);
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
				if (this.state.editing) {
					event.preventDefault();
					this.state.editing = false;
					node.toggleAttribute('contenteditable', this.state.editing);
				}
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

		this.navigation.addEventListener('input', (event) => {
			const input = event.target;
			if (input.name === 'itemsperpage') this.setAttribute('itemsperpage', parseInt(event.target.value, 10));
			if (input.name === 'page') this.setAttribute('page', parseInt(event.target.value, 10) - 1);
		})
	}

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
			console.error('Error in camelCase:', error);
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
			console.error('Error in colGroup:', error);
		}
	};

	/**
	 * Outputs a formatted console log if debug mode is enabled.
	 * @param {string} str - The string to be logged.
	 * @param {string} [bg='#000'] - The background color for formatting in the console.
	 * @returns {void}
	 */
	console(str, bg = '#000') {
		try {
			if (this.options.debug) {
				console.log(`%c${str}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`);
			}
		} catch (error) {
			console.error('Error in console:', error);
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
				cols: thead.length - hidden,
				pages: Math.floor(tbody.length / this.state.itemsPerPage),
				rows: tbody.length,
				tbody,
				thead
			};
		} catch (error) {
			console.error('Error extracting data from table:', error);
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
			console.error('Error in dispatch:', error);
		}
	};

	/**
	 * Downloads an exported file based on the provided content.
	 * @param {string} content - The content to be downloaded.
	 * @param {string} filename - The desired filename for the downloaded file.
	 * @param {string} mimeType ['text/csv'] - The MIME type of the downloaded file.
	 */
	downloadExport(content, filename, mimeType = 'text/csv;charset=utf-8;') {
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
			console.error('Error creating downloadable file:', error);
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
				console.error('An error occurred while beginning edit:', error);
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
			console.error('An error occurred while editing:', error);
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
			console.error('Error exporting CSV:', error);
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
			console.error('Error retrieving object data:', error);
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
			console.error('Error parsing JSON:', error);
			return this.defaultLang;
		}
	}

	next = () => {
		this.state.rowIndex = 1;
		this.setAttribute('page', Math.min(this.state.page + 1, this.state.pages - 1));
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
				cols: data.thead.length - hidden,
				pages: this.pages(data.tbody.length, this.state.itemsPerPage),
				rows: data.tbody.length,
				tbody: data.tbody,
				thead: data.thead
			};
		} catch (error) {
			console.error('Error parsing data:', error);
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
			console.error('Error while navigating to previous page:', error);
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
			console.error('Error while paginating data:', error);
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
			console.error('Error printing:', error);
		}
	}

	/**
	 * Renders an entire table including colgroup, table header, and table body.
	 */
	renderTable() {
		this.console(`render: table`, '#F00');
		this.colGroup();
		this.renderTHead();
		this.renderTBody();
	}

	/**
	 * Renders the table header (thead) based on the current state.
	 */
	renderTHead() {
		try {
			const firstNotHidden = this.state.thead.find(cell => !cell.hidden);
			this.table.tHead.innerHTML = `<tr>${this.state.thead
				.map((cell, index) => {
					if (cell.hidden) return '';
					return `<th tabindex="${cell === firstNotHidden ? 0 : -1}"${cell.uid ? ` data-uid` : ''} data-field="${cell.field}" data-sort-index="${index}"><span>${cell.label || cell}</span></th>`;
				})
				.join('')}</tr>`;
			this.console(`render: thead`, '#56F');
		} catch (error) {
			console.error('Error rendering table header (thead):', error);
			// Handle the error or log it as needed
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
			console.error('Error resizing column:', error);
		}
	}

	/**
	* Toggles selection on rows or sets them as selected based on the provided toggle flag.
	* @param {HTMLCollectionOf<Element>} rows - The rows to be selected/toggled.
	* @param {boolean} [toggle=true] - Optional flag to toggle selection (default: true).
	*/
	selectRows = (rows, toggle = true) => {
		try {
			Array.from(rows).forEach(row => {
				toggle ? row.toggleAttribute('aria-selected') : row.setAttribute('aria-selected', 'true');
				const selected = row.hasAttribute('aria-selected');
				const key = row.dataset.uid;
				if (selected) this.state.selected.add(key);
				else this.state.selected.delete(key);
			});
			this.navigation.elements.selected.value = this.state.selected.size;
		} catch (error) {
			console.error('Error selecting rows:', error);
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
			console.error('Error setting active cell:', error);
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
			console.error('Error translating key:', error);
			return `[${key}]`; // Return placeholder if an error occurs
		}
	}

	/**
	 * Updates the navigation elements based on the current state.
	 */
	updateNavigation() {
		try {
			const { page, pages, items, itemsPerPage, pageItems } = this.state;
			const E = this.navigation.elements;

			E.navigation.hidden = !this.hasAttribute('itemsperpage');
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
			console.error('Error updating navigation:', error);
			// Handle the error or log it as needed
		}
	}



	renderTBody() {
		if (!this.state.tbody.length) return;

		/* Create an array of indexes of hidden columns */
		const hidden = this.state.thead.map((cell, index) => cell.hidden ? index : '').filter(String)

		/* Get the (first) field containing a unique identifier */
		const uid = this.state.thead.find(cell => cell.uid)?.field

		const method = this.getAttribute('searchfilter') || 'includes';
		const searchterm = this.getAttribute('searchterm')?.toLowerCase();

		/* If `searchterm` exists, prevents search in hidden columns, otherwise return `tbody` */
		const data = searchterm
			? this.state.tbody.filter((row) => Object.values(row).some((cell, index) => !hidden.includes(index) && cell.toString().toLowerCase()[method](searchterm)))
			: this.state.tbody;

		/* Create a regular expression from `searchterm` */
		const regex = searchterm ? new RegExp(searchterm, 'gi') : null;

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
				const mapped = Object.values(row)
					.map((cell, index) => {
						if (this.state.thead[index].hidden) return

						const formatMethod = this.state.thead[index].formatter;
						const formatter = this.formatters && this.formatters[formatMethod] || ((value) => value);

						return `<td tabindex="-1">${
							formatter(regex
								? cell.toString().replaceAll(regex, (match) => `<mark>${match}</mark>`)
								: cell)
						}</td>`;
					})
					.join('');
				const selected = this.state.selected.has(row[uid]) ? ' aria-selected' : '';
				return `<tr${selected}${uid ? ` data-uid="${row[uid]}"`:''}>${mapped}</tr>`;
			})
			.join('');

		this.console(`render: tbody`, '#584');
		if (this.options.debug) console.log(this.state)

		this.updateNavigation()
	}


}
customElements.define("ui-datagrid", uiDataGrid);
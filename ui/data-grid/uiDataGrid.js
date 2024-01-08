/**
 * uiDataGrid
 * Wraps a HTML table element and adds functionality for sorting, pagination, searching and selection.
 * @author Mads Stoumann
 * @version 1.0.0
 * @summary 08-01-2024
 * @class
 * @extends {HTMLElement}
 */
export default class uiDataGrid extends HTMLElement {
	static observedAttributes = ['data', 'itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder', 'src'];
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
				size: 'Page Size',
			}
		},

		this.options = {
			debug: this.hasAttribute('debug') || false,
			editable: this.hasAttribute('editable') || false,
			i18n: this.hasAttribute('i18n') ? this.i18n(this.getAttribute('i18n')) : this.defaultLang,
			locale: this.getAttribute('lang') || document.documentElement.lang || 'en',
			pagesize: this.getAttribute('pagesize')?.split(',') || [5, 10, 25, 50, 100],
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
			<output name="selected">0</output> ${this.t('selected')}
		</fieldset>
		<fieldset name="navigation">
			<label>${this.t('size')}:
				<select name="itemsperpage">${this.options.pagesize
					.map(
						(value) =>
							`<option${
								value === this.state.itemsPerPage ? ` selected` : ''
							}>${value}</option>`,
					)
					.join('')}</select>
			</label>
			<div>
				<output name="start"></output>&ndash;<output name="end"></output>
				${this.t('of')}
				<output name="total"></output>
			</div>
			<fieldset>
				<button type="button" name="stepdown">${this.t('prev')}</button>
				<label>${this.t('page')}
					<input type="number" name="page" min="1">
				</label>
				${this.t('of')}
				<output name="pages"></output>
				<button type="button" name="stepup">${this.t('next')}</button>
			</fieldset>
		</fieldset>`;

		this.navigation.elements.stepdown.addEventListener('click', () => this.prev())
		this.navigation.elements.stepup.addEventListener('click', () => this.next())
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
						this.select([node.parentNode]);
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
					this.select([node.parentNode]);
				}
			}

			const handleAKey = () => {
				/* Ctrl/Command + a to select all rows */
				if (isSelectable && (ctrlKey || metaKey)) {
					event.preventDefault();
					this.select(this.table.tBodies[0].rows, false);
				}
			}

			const handleIKey = () => {
				/* Ctrl/Command + Shift + i to invert selection */
				if (isSelectable && (ctrlKey || metaKey) && shiftKey) {
					event.preventDefault();
					this.select(this.table.tBodies[0].rows);
				}
			}

			const handleArrowKeys = (direction) => {
				if (direction === 'ArrowDown') {
					this.state.rowIndex = Math.min(this.state.rowIndex + 1, this.state.pageItems);
				} else if (direction === 'ArrowUp') {
					this.state.rowIndex = Math.max(this.state.rowIndex - 1, 0);
				} else if (direction === 'ArrowRight' && !this.state.editing) {
					/* Shift + ArrowRight to resize column */
					if (shiftKey && node.nodeName === 'TH') {
						return this.resize(node.cellIndex, 1)
					}
					this.state.cellIndex = Math.min(this.state.cellIndex + 1, this.state.cols - 1)
				} else if (direction === 'ArrowLeft' && !this.state.editing) {
					/* Shift + ArrowLeft to resize column */
					if (shiftKey && node.nodeName === 'TH') {
						return this.resize(node.cellIndex, -1)
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

		if (name === 'data') {
			const data = JSON.parse(newValue);
			this.state = Object.assign(this.state, this.parseData(data));
			this.renderTable();
		}

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

	/* Methods */

	camelCase = str => str.split(' ').map((e,i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('');
	colGroup = () => this.colgroup.innerHTML = `<col>`.repeat(this.state.cols);
	console = (str, bg = '#000') => { if (this.options.debug) console.log(`%c${str}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`); }
	dispatch = (name, detail) => {
		this.console(`event: ${name}`, '#A0A');
		this.dispatchEvent(new CustomEvent(name, { detail }));
	}
	async fetchData(url) {
		const data = await (await fetch(url)).json();
		return this.parseData(data);
	}
	editBegin() {
		if (!this.options.editable || !this.active) return;
		const node = this.active;
		if (node.nodeName === 'TD') {
			this.state.editing = true;
			node.toggleAttribute('contenteditable', this.state.editing);
			window.getSelection().selectAllChildren(node);
			window.getSelection().collapseToEnd();
		}
	}
	editEnd(node) {
		this.state.editing = false;
		node.toggleAttribute('contenteditable', this.state.editing);

		const uid = this.state.thead.find(cell => cell.uid)?.field
		const key = node.parentNode.dataset.uid;
		const obj = this.state.tbody.find(row => row[uid] === key)

		const index = node.cellIndex;
		const field = this.table.tHead.rows[0].cells[index].dataset.field;
		const oldValue = obj[field];
		const newValue = node.textContent;

		node.dataset.oldValue = oldValue;

		if (oldValue !== newValue) {
			obj[field] = newValue;
			this.dispatch('cellchange', obj);
		}
	}
	i18n = str => {
		try {
			const json = JSON.parse(str);
			if (typeof json === 'object') return json;
			throw new Error('Invalid JSON format');
		}
		catch (error) {
			console.error(error);
			return this.defaultLang;
		}
	}
	next = () => {
		this.state.rowIndex = 1;
		this.setAttribute('page', Math.min(this.state.page + 1, this.state.pages - 1));
	}
	parseData = (data) => {
		if (!data.thead || !data.tbody) throw new Error('Invalid JSON format');
		let hidden = 0;
		data.thead.forEach(cell => { if (cell.hidden) hidden++ });
		return {
			cols: data.thead.length - hidden,
			pages: this.pages(data.tbody.length, this.state.itemsPerPage),
			rows: data.tbody.length,
			tbody: data.tbody,
			thead: data.thead
		}
	}
	pages = (items, itemsPerPage) => Math.ceil(items / itemsPerPage);
	prev = () => this.setAttribute('page', Math.max(this.state.page - 1, 0));
	paginate = data => data.slice(this.state.page * this.state.itemsPerPage, this.state.page * this.state.itemsPerPage + this.state.itemsPerPage);
	resize = (index, value) => {
		const col = this.colgroup.children[index];
		const width = col.offsetWidth / this.table.offsetWidth * 100;
		col.style.width = `${width + value}%`;
	}
	select = (rows, toggle = true) => {
		Array.from(rows).forEach(row => {
			toggle ? row.toggleAttribute('aria-selected') : row.setAttribute('aria-selected', 'true');
			const selected = row.hasAttribute('aria-selected');
			const key = row.dataset.uid;
			if (selected) this.state.selected.add(key)
			else this.state.selected.delete(key)
		})
		this.navigation.elements.selected.value = this.state.selected.size
	}
	setActive = () => {
		if (this.active) {
			this.active.setAttribute('tabindex', '-1');
			if (this.state.editing) {
				this.editEnd(this.active);
			}
		}
		this.active = this.table.rows[this.state.rowIndex].cells[this.state.cellIndex];
		this.active.setAttribute('tabindex', '0');
		this.active.focus();
	}
	t = (key) => this.options.i18n[this.options.locale][key] || `[${key}]`;
	updateNavigation() {
		const { page, pages, items, itemsPerPage, pageItems } = this.state;
		const E = this.navigation.elements;

		E.navigation.hidden = items <= itemsPerPage;
		E.selection.hidden = !this.options.selectable;

		E.end.value = Math.min((page + 1) * itemsPerPage, items);
		E.page.setAttribute('max', pages);
		E.page.value = page + 1;
		E.pages.value = pages;
		E.start.value = page === pages - 1 ? page * itemsPerPage + 1 : page * pageItems + 1;
		E.stepdown.disabled = page === 0;
		E.stepup.disabled = page === pages - 1;
		E.total.value = items;
	}

	renderTable() {
		this.console(`render: table`, '#F00');
		this.colGroup();
		this.renderTHead();
		this.renderTBody();
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

	renderTHead() {
		const firstNotHidden = this.state.thead.find(cell => !cell.hidden)
		this.table.tHead.innerHTML = `<tr>${this.state.thead
			.map((cell, index) => {
				if (cell.hidden) return
				return `<th tabindex="${cell === firstNotHidden ? 0 : -1}"${cell.uid? ` data-uid`:''} data-field="${cell.field}" data-sort-index="${index}"><span>${cell.label || cell}</span></th>`
			})
			.join('')}</tr>`;
		this.console(`render: thead`, '#56F');
	}

	dataFromTable(table) {
		let hidden = 0;
		try {
			const thead = [...table.tHead.rows[0].cells].map(cell => { 
				if (cell.hasAttribute('hidden')) hidden++;
				return {
					field: this.camelCase(cell.textContent),
					hidden: cell.hasAttribute('hidden'),
					label: cell.textContent,
					uid: cell.hasAttribute('data-uid')
				}
			})
			const tbody = [...table.tBodies[0].rows].map(row => {
				const obj = {};
				[...row.cells].forEach((cell, index) => {
						const field = thead[index].field
						obj[field] = cell.textContent
				});
				return obj
			});
			return {
				cols: thead.length - hidden,
				pages: Math.floor(tbody.length / this.state.itemsPerPage),
				rows: tbody.length,
				tbody,
				thead
			}
		}
		catch (error) {
			console.error(error)
		}
	}
}
customElements.define("ui-datagrid", uiDataGrid);
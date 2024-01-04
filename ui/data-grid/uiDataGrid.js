export default class uiDataGrid extends HTMLElement {
	static observedAttributes = ['itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder', 'src'];
	constructor() {
		super()

		this.options = {
			debug: this.hasAttribute('debug') || false,
			editable: this.hasAttribute('editable') || false,
			locale: this.getAttribute('lang') || document.documentElement.lang || 'en-US',
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
			selected: [],
			sortIndex: -1,
			sortOrder: 0,
			tbody: [],
			thead: [],
		}
	}

	async connectedCallback() {
		if (this.options.debug) console.table(this.options)
		this.table = this.querySelector('table') || (() => {
			const table = document.createElement('table')
			this.appendChild(table)
			return table
		})()

		if (!this.table.tHead) this.table.appendChild(document.createElement('thead'))
		if (!this.table.tBodies.length) this.table.appendChild(document.createElement('tbody'))
		this.colgroup = document.createElement('colgroup')
		this.table.appendChild(this.colgroup)

		this.pagination = document.createElement('fieldset')
		this.appendChild(this.pagination)

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
				this.setActive()
			}
		})

		this.table.addEventListener('keydown', (event) => {
			const node = event.target
			switch(event.key) {
				case ' ': /* Space */
					if (node.nodeName === 'TH') {
						event.preventDefault();
						const index = node.dataset.sortIndex;
						if (index !== undefined) this.setAttribute('sortindex', parseInt(index, 10));
					}
					if (node.nodeName === 'TD') {
						if (this.options.selectable && event.shiftKey) {
							this.select([node.parentNode])
						}
					}
					break;
				case 'a':
					if (this.options.selectable && (event.ctrlKey || event.metaKey)) {
						event.preventDefault();
						this.select(this.table.tBodies[0].rows, false)
					}
					break;
				case 'i':
					if (this.options.selectable && (event.ctrlKey || event.metaKey) && event.shiftKey) {
						event.preventDefault();
						this.select(this.table.tBodies[0].rows)
					}
					break;
				case 'ArrowDown':
					this.state.rowIndex = Math.min(this.state.rowIndex + 1, this.state.pageItems)
					break;
				case 'ArrowUp':
					this.state.rowIndex = Math.max(this.state.rowIndex - 1, 0)
					break;
				case 'ArrowRight':
					if (this.state.editing) break;
					if (event.shiftKey && node.nodeName === 'TH') {
						this.resize(node.cellIndex, 1)
						break;
					}
					this.state.cellIndex = Math.min(this.state.cellIndex + 1, this.state.cols - 1)
					break;
				case 'ArrowLeft':
					if (this.state.editing) break;
					if (event.shiftKey && node.nodeName === 'TH') {
						this.resize(node.cellIndex, -1)
						break;
					}
					this.state.cellIndex = Math.max(this.state.cellIndex - 1, 0)
					break;
				case 'End':
					if (!event.shiftKey) this.state.cellIndex = this.state.cols - 1
					if ((event.ctrlKey || event.metaKey) || event.shiftKey) this.state.rowIndex = this.state.pageItems
					break;
				case 'Home':
					if (!event.shiftKey) this.state.cellIndex = 0
					if ((event.ctrlKey || event.metaKey) || event.shiftKey) this.state.rowIndex = 0
					break;
				case 'PageDown':
					this.next()
					break;
				case 'PageUp':
					this.prev()
					break;
				case 'F2':
					if (!this.options.editable) break;
					this.state.editing = !this.state.editing
					node.toggleAttribute('contenteditable', this.state.editing)
					if (this.state.editing) {
						window.getSelection().selectAllChildren(node)
        		window.getSelection().collapseToEnd()
					}
					break;
				case 'Escape': break;
				case 'Tab':
					if (this.state.editing) {
						event.preventDefault()
						this.state.editing = false
						node.toggleAttribute('contenteditable', this.state.editing)
					}
					break;
				}
				
			this.setActive()
		})

		this.pagination.addEventListener('input', (event) => {
			const input = event.target
			if (input.name === 'itemsperpage') this.setAttribute('itemsperpage', parseInt(event.target.value, 10))
			if (input.name === 'page') {
				this.setAttribute('page', parseInt(event.target.value, 10) - 1)
			}
		})
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const render = (oldValue && (oldValue !== newValue)) || false
		this.console(`attr: ${name}=${newValue} (${oldValue})`, '#046');

		if (name === 'itemsperpage') {
			this.state.itemsPerPage = parseInt(newValue, 10)
			if (this.state.itemsPerPage === -1) this.state.itemsPerPage = this.state.rows
			this.state.pages = this.pages(this.state.rows, this.state.itemsPerPage)
			if (render) {
				this.setAttribute('page', 0)
				this.renderTBody()
			}
		}
		if (name === 'page') {
			this.state.page = parseInt(newValue, 10);
			if (render) {
				this.dispatch('pagechange', this.state)
				this.renderTBody()
			}
		}
		if (name === 'searchterm') {
			if (render) {
				this.setAttribute('page', 0)
				this.renderTBody()
			}
		}
		if (name === 'src') {
			this.fetchData(newValue).then(data => {
				this.state = Object.assign(this.state, data)
				this.renderTable()
			}) 
		}
		if (name === 'sortindex') {
			this.state.sortIndex = parseInt(newValue, 10)
			if (oldValue === newValue) this.setAttribute('sortorder', + !this.state.sortOrder)
			this.renderTBody()
		}
		if (name === 'sortorder') {
			this.state.sortOrder = parseInt(newValue, 10)
			if (render) this.renderTBody()
		}
  }

	/* Methods */
	camelCase = str => str.split(' ').map((e,i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('')
	colGroup = () => this.colgroup.innerHTML = `<col>`.repeat(this.state.cols)
	console = (str, bg = '#000') => { if (this.options.debug) console.log(`%c${str}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`) }
	dispatch = (name, detail) => {
		this.console(`event: ${name}`, '#A0A');
		this.dispatchEvent(new CustomEvent(name, { detail }))
	}
	next = () => {
		this.state.rowIndex = 1
		this.setAttribute('page', Math.min(this.state.page + 1, this.state.pages - 1))
	}
	pages = (items, itemsPerPage) => Math.ceil(items / itemsPerPage)
	prev = () => this.setAttribute('page', Math.max(this.state.page - 1, 0))
	paginate = data => data.slice(this.state.page * this.state.itemsPerPage, this.state.page * this.state.itemsPerPage + this.state.itemsPerPage)
	resize = (index, value) => {
		const col = this.colgroup.children[index]
		const width = col.offsetWidth / this.table.offsetWidth * 100;
		col.style.width = `${width + value}%`;
	}
	select = (rows, toggle = true) => {
		// this.state.selected = rows
		Array.from(rows).forEach(row => {
			toggle ? row.toggleAttribute('aria-selected') : row.setAttribute('aria-selected', 'true')
			// console.log(row.hasAttribute('aria-selected'))
		})
	}
	setActive = () => {
		if (this.active) this.active.setAttribute('tabindex', '-1')
		this.active = this.table.rows[this.state.rowIndex].cells[this.state.cellIndex]
		this.active.setAttribute('tabindex', '0')
		this.active.focus()
	}

	async fetchData(url) {
		const data = await (await fetch(url)).json();
		if (!data.thead || !data.tbody) throw new Error('Invalid JSON format')
		let hidden = 0;
		data.thead.forEach(cell => { if (cell.hidden) hidden++ })
		return {
			cols: data.thead.length - hidden,
			pages: this.pages(data.tbody.length, this.state.itemsPerPage),
			rows: data.tbody.length,
			tbody: data.tbody,
			thead: data.thead
		}
	}

	renderPagination() {
		const { page, pages, items, itemsPerPage, pageItems } = this.state;
		const start = page === pages - 1 ? page * itemsPerPage + 1 : page * pageItems + 1;
		const end = Math.min((page + 1) * itemsPerPage, items);
		const size = [
			{ val: 5 },
			{ val: 10 },
			{ val: 20 },
			{ val: 50 },
			{ val: 100 },
			{ val: items, key: 'All' },
		]
		this.pagination.innerHTML = `
				<label>Page Size: <select name="itemsperpage">${size
					.map((obj) => {
						if (obj.val > items) return;
						return `<option${
							obj.val === this.state.itemsPerPage ? ` selected` : ''
						} value="${obj.val}">${obj.key || obj.val}</option>`
					})
					.join('')}</select></label>
				<output>${start}&ndash;${end} of ${items}</output>
				<label>Page <input type="number" name="page" min="1" max="${
					this.state.pages
				}" value="${page + 1}"> of ${pages}</label>`
	}

	renderTable() {
		this.console(`render: table`, '#F00');
		this.colGroup()
		this.renderTHead()
		this.renderTBody()
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
		if (!data.length) return this.table.tBodies[0].innerHTML = `<tr><td colspan="${this.state.cols}">No results found</td></tr>`;

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
						return `<td tabindex="-1">${
							regex
								? cell.toString().replaceAll(regex, (match) => `<mark>${match}</mark>`)
								: cell
						}</td>`;
					})
					.join('');
				return `<tr${uid ? ` data-uid="${row[uid]}"`:''}>${mapped}</tr>`;
			})
			.join('');

		this.console(`render: tbody`, '#584');
		if (this.options.debug) console.log(this.state)

		this.renderPagination()
	}

	renderTHead() {
		const firstNotHidden = this.state.thead.find(cell => !cell.hidden)
		this.table.tHead.innerHTML = `<tr>${this.state.thead
			.map((cell, index) => {
				if (cell.hidden) return
				return `<th tabindex="${cell === firstNotHidden ? 0 : -1}"${cell.uid? ` data-uid`:''} data-sort-index="${index}"><span>${cell.label || cell}</span></th>`
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
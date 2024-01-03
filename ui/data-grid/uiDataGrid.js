export default class uiDataGrid extends HTMLElement {
	static observedAttributes = ['itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder', 'src'];
	constructor() {
		super()

		this.labels = {
			selectRow: 'Select row',
			toggleRows: 'Toggle all rows',
		}

		this.options = {
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
				if (this.state.rowIndex === 0) this.setAttribute('sortindex', this.state.cellIndex);
				this.setActive()
			}
		})

		this.table.addEventListener('keydown', (event) => {
			const node = event.target
			switch(event.key) {
				case ' ': /* Space */
					if (node.nodeName === 'TH') {
						event.preventDefault();
						const index = node.cellIndex
						if (index !== undefined) this.setAttribute('sortindex', index);
					}
					if (node.nodeName === 'TD') {
						if (this.options.selectable && event.shiftKey) {
							node.parentNode.toggleAttribute('aria-selected')
						}
					}
					break;
				case 'a':
					if (this.options.selectable && (event.ctrlKey || event.metaKey)) {
						event.preventDefault();
						Array.from(this.table.tBodies[0].rows).forEach(row => row.setAttribute('aria-selected', 'true'))
					}
					break;
				case 'i':
					if (this.options.selectable && (event.ctrlKey || event.metaKey) && event.shiftKey) {
						event.preventDefault();
						Array.from(this.table.tBodies[0].rows).forEach(row => row.toggleAttribute('aria-selected'))
					}
				case 'ArrowDown':
					this.state.rowIndex = Math.min(this.state.rowIndex + 1, this.state.pageItems)
					break;
				case 'ArrowUp':
					this.state.rowIndex = Math.max(this.state.rowIndex - 1, 0)
					break;
				case 'ArrowRight':
					if (this.state.editing) break;
					this.state.cellIndex = Math.min(this.state.cellIndex + 1, this.state.cols - 1)
					break;
				case 'ArrowLeft':
					if (this.state.editing) break;
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
					this.nextPage()
					break;
				case 'PageUp':
					this.prevPage()
					break;
				case 'F2':
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
		if (name === 'itemsperpage') {
			this.setAttribute('page', 0)
			this.state.itemsPerPage = parseInt(newValue, 10)
			if (this.state.itemsPerPage === -1) this.state.itemsPerPage = this.state.rows
			this.state.pages = this.pages(this.state.rows, this.state.itemsPerPage)
			this.renderTBody()
		}
		if (name === 'page') {
			this.state.page = parseInt(newValue, 10);
			if (oldValue && (oldValue !== newValue)) {
				this.dispatchEvent(new CustomEvent('pagechange', { detail: this.state }))
				this.renderTBody()
			}
		}
		if (name === 'searchterm') {
			if (newValue !== oldValue) {
				this.setAttribute('page', 0)
				this.renderTBody()
			}
		}
		if (name === 'src') { this.fetchData(newValue).then(data => {
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
			// if (newValue !== oldValue) this.renderTBody()
		}
  }

	/* Methods */
	camelCase = str => str.split(' ').map((e,i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('')
	colGroup = () => this.colgroup.innerHTML = `<col>`.repeat(this.state.cols)
	nextPage = () => {
		this.state.rowIndex = 1
		this.setAttribute('page', Math.min(this.state.page + 1, this.state.pages - 1))
	}
	pages = (items, itemsPerPage) => Math.ceil(items / itemsPerPage)
	prevPage = () => this.setAttribute('page', Math.max(this.state.page - 1, 0))
	paginate = data => data.slice(this.state.page * this.state.itemsPerPage, this.state.page * this.state.itemsPerPage + this.state.itemsPerPage)
	setActive = () => {
		if (this.active) this.active.setAttribute('tabindex', '-1')
		this.active = this.table.rows[this.state.rowIndex].cells[this.state.cellIndex]
		this.active.setAttribute('tabindex', '0')
		this.active.focus()
	}

	async fetchData(url) {
		const data = await (await fetch(url)).json();
		return {
			cols: data.thead.length,
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
		this.colGroup()
		this.renderTHead()
		this.renderTBody()
	}

	renderTBody() {
		if (!this.state.tbody.length) return;

		const method = this.getAttribute('searchfilter') || 'includes';
		const searchterm = this.getAttribute('searchterm')?.toLowerCase();
		const data = searchterm
			? this.state.tbody.filter((row) => Object.values(row).some(cell => cell.toString().toLowerCase()[method](searchterm)))
			: this.state.tbody;
		const regex = searchterm ? new RegExp(searchterm, 'gi') : null;
	
		/* Optional: Sort Data */
		if (this.state.sortIndex > -1) {
			data.sort(
				(a, b) => {
					const A = Object.values(a)[this.state.sortIndex]
					const B = Object.values(b)[this.state.sortIndex]
					return typeof A === 'string' ? A.localeCompare(B, this.options.locale, { sensitivity: 'variant' }) : A - B
				});
			if (this.state.sortOrder === 1) data.reverse()
		}

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
				return `<tr${row.id ? ` data-row-id="${row.id}"`:''}>${mapped}</tr>`;
			})
			.join('');

		console.log(this.state)
		this.renderPagination()
	}

	renderTHead() {
		this.table.tHead.innerHTML = `<tr>${this.state.thead
			.map((cell, index) => {
				return cell.hidden ? '': `<th tabindex="${index === 0 ? 0 : -1}"><span>${cell.label || cell}</span></th>`
			})
			.join('')}</tr>`;
	}

	dataFromTable(table) {
		try {
			const thead = [...table.tHead.rows[0].cells].map(cell => { return { field: this.camelCase(cell.textContent), label: cell.textContent } })
			const tbody = [...table.tBodies[0].rows].map((row, index) => {
				const obj = { id: index + 1 };
				[...row.cells].forEach((cell, index) => {
						const field = thead[index].field
						obj[field] = cell.textContent
				});
				return obj
			});
			thead.unshift({ field: 'id', label: 'ID', hidden: false });
			return {
				cols: thead.length,
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
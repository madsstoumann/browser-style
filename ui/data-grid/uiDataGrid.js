export default class uiDataGrid extends HTMLElement {
	static observedAttributes = ['itemsperpage', 'page', 'searchterm', 'sortindex', 'sortorder', 'src'];
	constructor() {
		super()

		this.options = {
			// density: this.getAttribute('density') || 'normal',
			editable: this.hasAttribute('editable') || false,
			locale: this.getAttribute('locale') || 'en-US',
			navigable: this.hasAttribute('navigable') || false,
			// resizable: this.hasAttribute('resizable') || false,
			/*searchfilter: this.getAttribute('searchfilter') || 'includes',*/ /* includes | startsWith | endsWith */
			selectable: this.hasAttribute('selectable') || false,
			// sortable: this.hasAttribute('sortable') || false,
			src: this.getAttribute('src') || '',
		}

		this.state = {
			cellIndex: 0,
			cols: 0,
			itemsPerPage: 1,
			page: 0,
			pages: 0,
			rowIndex: 0,
			rows: 0,
			sortIndex: -1,
			sortOrder: 0,
			tbody: [],
			thead: [],
		}
	}

	async connectedCallback() {
		// this.elements = {
		
		// 	fieldset: this.querySelector('fieldset'),
		// 	table: this.querySelector('table'),
		//  tbody: this.querySelector('tbody'),
		//	thead: this.querySelector('thead'),
		// }


		this.fieldset = this.querySelector('fieldset')
		this.table = this.querySelector('table')
		
		if (!this.table) {
			this.table = document.createElement('table')
			this.appendChild(this.table)
		}
		if (!this.table.tHead) {
			this.table.appendChild(document.createElement('thead'))
		}
		if (!this.table.tBodies.length) {
			this.table.appendChild(document.createElement('tbody'))
		}
		this.colgroup = document.createElement('colgroup')
		this.table.appendChild(this.colgroup)

		if (!this.options.src) {
			this.state = Object.assign(this.state, this.arrayFromTable(this.table))
			console.log(this.state)
			this.renderTable()
		}

		// console.log(this.state)

		if (this.options.navigable) {
			// console.log('add tabindex')
		}

		if (this.fieldset) {

			this.fieldset.addEventListener('change', event => {
				const { target } = event;
				const inputs = Array.from(this.fieldset.querySelectorAll('input:not([data-toggle])'));
				const toggle = this.fieldset.querySelector('[data-toggle]');

				if (target === toggle) {
					inputs.forEach(input => input.checked = toggle.checked);
				} else {
					const allChecked = inputs.every(input => input.checked);
					toggle.checked = allChecked;
					toggle.indeterminate = !allChecked && inputs.some(input => input.checked);
				}
			})

		}

		/* NAVIGATION HANDLER */
		this.table.addEventListener('click', event => {
			const { target } = event;
			if (!target.nodeName === 'TD') return
			this.state.cellIndex = target.cellIndex
			this.state.rowIndex = target.parentNode.rowIndex -1;
		})

		this.table.addEventListener('keydown', event => {
			switch(event.key) {
				case 'ArrowDown':
					this.state.rowIndex = Math.min(this.state.rowIndex + 1, this.state.itemsPerPage - 1)
					break;
				case 'ArrowUp':
					this.state.rowIndex = Math.max(this.state.rowIndex - 1, 0)
					break;
				case 'ArrowRight':
					this.state.cellIndex = Math.min(this.state.cellIndex + 1, this.state.cols - 1)
					break;
				case 'ArrowLeft':
					this.state.cellIndex = Math.max(this.state.cellIndex - 1, 0)
					break;
				case 'End':
					this.state.cellIndex = this.state.cols - 1
					if (event.ctrlKey) this.state.rowIndex = this.state.itemsPerPage - 1
					break;
				case 'Home':
					this.state.cellIndex = 0
					if (event.ctrlKey) this.state.rowIndex = 0
					break;
				case 'PageDown':
					this.nextPage()
					break;
				case 'PageUp':
					this.prevPage()
					break;
			}
			this.active()
		})
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'itemsperpage') {
			this.setAttribute('page', 0)
			this.state.itemsPerPage = parseInt(newValue, 10)
			this.state.pages = this.pages(this.state.rows, this.state.itemsPerPage)
			this.renderTBody()
		}
		if (name === 'page') {
			this.state.page = parseInt(newValue, 10);
			if (oldValue && oldValue !== newValue) this.renderTBody()
		}
		if (name === 'searchterm') {
			this.setAttribute('page', 0)
			this.renderTBody()
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
			this.renderTBody()
		}
  }

	/* Methods */
	active = () => this.table.tBodies[0].rows[this.state.rowIndex].cells[this.state.cellIndex].focus()
	camelCase = str => str.split(' ').map((e,i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('')
	colGroup = () => this.colgroup.innerHTML = `<col>`.repeat(this.state.cols)
	nextPage = () => this.setAttribute('page', Math.min(this.state.page + 1, this.state.pages))
	pages = (items, itemsPerPage) => Math.ceil(items / itemsPerPage)
	prevPage = () => this.setAttribute('page', Math.max(this.state.page - 1, 0))
	paginate = data => data.slice(this.state.page * this.state.itemsPerPage, this.state.page * this.state.itemsPerPage + this.state.itemsPerPage)

	async fetchData(url) {
		const data = await (await fetch(url)).json();
		const thead = data.shift()
		return {
			cols: thead.length,
			pages: this.pages(data.length, this.state.itemsPerPage),
			rows: data.length,
			tbody: data,
			thead
		}
	}

	renderTable() {
		this.colGroup()
		this.renderTHead()
		this.renderTBody()
	}

	renderTBody() {
		if (!this.state.tbody.length) return

		const method = this.getAttribute('searchfilter') || 'includes'
		const searchterm = this.getAttribute('searchterm')?.toLowerCase()
		const data = searchterm ? this.state.tbody.filter(row => row.some(cell => typeof cell === 'string' && cell.toLowerCase()[method](searchterm))) : this.state.tbody
		const regex = searchterm ? new RegExp(searchterm, 'gi') : null;

		/* Optional: Sort Data */
		if (this.state.sortIndex > -1) {
			data.sort((a, b) => typeof a[this.state.sortIndex] === 'string' && a[this.state.sortIndex].localeCompare(b[this.state.sortIndex], 
				this.options.locale, { sensitivity: 'variant' }
			))
			if (this.state.sortOrder === 1) data.reverse()
		}

		this.table.tBodies[0].innerHTML = this.paginate(data).map(row => {
			const mapped = row.map((cell, index) => {
				const td = regex ? cell.replaceAll(regex, match => `<mark>${match}</mark>`) : cell;
				const content = (this.options.selectable && index === 0) ? `<label><input type="checkbox">${td}</label>` : td;
				return `<td${this.options.navigable ? ` tabindex="-1"`: ''}>${content}</td>`;
			}).join('')
			return `<tr>${mapped}</tr>`
		}).join('')
		console.log(this.state)
	}

	renderTHead() {
		this.table.tHead.innerHTML = `<tr>${this.state.thead.map((cell, index) => {
			const th = cell.label || cell
			const content = (this.options.selectable && index === 0) ? `<label><input type="checkbox" data-toggle>${th}</label>` : th;
			return `<th tabindex="0">${content}</th>`
		}).join('')}</tr>`;

		[...this.table.tHead.rows].forEach(row => [...row.cells].forEach((cell, index) => {
			// cell.setAttribute('aria-sort', 'none');
			// cell.tabIndex = 0;
			cell.addEventListener('click', event => {
				this.setAttribute('sortindex', event.target.cellIndex)
			});
			cell.addEventListener('keydown', event => {
				if (event.key === ' ') {
					event.preventDefault();
					this.setAttribute('sortindex', event.target.cellIndex)
				}
			})
		}));
	}

	arrayFromTable(table) {
		const thead = [...table.tHead.rows[0].cells].map(cell => cell.textContent)
		const tbody = [...table.tBodies[0].rows].map(row => [...row.cells].map(cell => cell.textContent))
		return {
			cols: table.tHead.rows[0].cells.length,
			pages: Math.floor(tbody.length / this.state.itemsPerPage),
			rows: tbody.length,
			thead, 
			tbody
		}
	}

	// stateFromTable(table) {
	// 	const thead = [...table.tHead.rows[0].cells].map(cell => { return { field: this.camelCase(cell.textContent), label: cell.textContent } })
	// 	const tbody = [...table.tBodies[0].rows].map(row => {
	// 		const obj = {};
	// 		[...row.cells].forEach((cell, index) => {
	// 				const field = thead[index].field
	// 				obj[field] = cell.textContent
	// 		});
	// 		return obj
	// 	})
	// 	return {
	// 		cols: table.tHead.rows[0].cells.length,
	// 		pages: Math.floor(tbody.length / this.state.itemsPerPage),
	// 		rows: table.tBodies[0].rows.length,
	// 		tbody,
	// 		thead
	// 	}
	// }
}
customElements.define("ui-datagrid", uiDataGrid);
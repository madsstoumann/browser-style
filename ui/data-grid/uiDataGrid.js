export default class uiDataGrid extends HTMLElement {
	static observedAttributes = ['itemsperpage', 'page', 'searchterm', 'src'];
	constructor() {
		super()

		this.options = {
			density: this.getAttribute('density') || 'normal', /* compact | normal | comfortable */
			editable: this.hasAttribute('editable') || false,
			itemsperpage: parseInt(this.getAttribute('itemsperpage'), 10),
			navigable: this.hasAttribute('navigable') || false,
			resizable: this.hasAttribute('resizable') || false,
			searchable: this.hasAttribute('searchterm') || false,
			/*searchfilter: this.getAttribute('searchfilter') || 'includes',*/ /* includes | startsWith | endsWith */
			selectable: this.hasAttribute('selectable') || false,
			sortable: this.hasAttribute('sortable') || false,
			src: this.getAttribute('src') || '',
		}

		this.state = {
			cellindex: 0,
			cols: 0,
			page: 0,
			pages: 0,
			rowindex: 0,
			rows: 0,
			sortindex: 0,
			sortorder: 0,
			tbody: [],
			thead: [],
		}
	}

	async connectedCallback() {
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
			this.state = Object.assign(this.state, this.stateFromTable(this.table))
			this.colGroup()
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
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'itemsperpage') {
			this.setAttribute('page', 0);
			this.options.itemsperpage = parseInt(newValue, 10);
			this.state.pages = Math.floor(this.state.rows / this.options.itemsperpage);
			this.renderTBody()
		}
		if (name === 'page') {
			this.state.page = parseInt(newValue, 10);
			if (oldValue && oldValue !== newValue) this.renderTBody()
		}
		if (name === 'searchterm') {
			this.setAttribute('page', 0);
			this.renderTBody()
		}
		if (name === 'src') { this.fetchData(newValue).then(data => {
			this.state = Object.assign(this.state, data)
			this.render() 
		}) }
  }

	camelCase(str) {
		return str.split(' ').map((e,i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('')
	}

	colGroup() {
		this.colgroup.innerHTML = `<col>`.repeat(this.state.cols)
	}

	async fetchData(url) {
		const data = await (await fetch(url)).json();
		const thead = data.shift()
		return {
			cols: thead.length,
			pages: Math.floor(data.length / this.options.itemsperpage),
			rows: data.length,
			tbody: data,
			thead
		}
	}

	paginate(data = this.state.tbody) {
		return data.slice(this.state.page * this.options.itemsperpage, this.state.page * this.options.itemsperpage + this.options.itemsperpage) || data
	}

	render() {
		console.log('rendering ...')
		this.renderTHead()
		this.renderTBody()
		this.colGroup()
	}

	renderTBody() {
		if (!this.state.tbody.length) return
		const method = this.getAttribute('searchfilter') || 'includes'
		const searchterm = this.getAttribute('searchterm').toLowerCase()
		const data = searchterm ? this.state.tbody.filter(row => row.some(cell => typeof cell === 'string' && cell.toLowerCase()[method](searchterm))) : this.state.tbody
		const regex = searchterm ? new RegExp(searchterm, 'gi') : null;

		console.log(data.length)
		/* TODO! Update render state */

		this.table.tBodies[0].innerHTML = this.paginate(data).map(row => {
			const mapped = row.map((cell, index) => {
				const td = regex ? cell.replaceAll(regex, match => `<mark>${match}</mark>`) : cell;
				const content = (this.options.selectable && index === 0) ? `<label><input type="checkbox">${td}</label>` : td;
				return `<td tabindex="0">${content}</td>`
			}).join('')
			return `<tr>${mapped}</tr>`
		}).join('')
		console.log(this.state)
	}

	renderTHead() {
		this.table.tHead.innerHTML = `<tr>${this.state.thead.map((cell, index) => {
			const th = cell.label || cell
			const content = (this.options.selectable && index === 0) ? `<label><input type="checkbox" data-toggle>${th}</label>` : th;
			return `<th>${content}</th>`
		}).join('')}</tr>`
	}

	stateFromTable(table) {
		const thead = [...table.tHead.rows[0].cells].map(cell => { return { field: this.camelCase(cell.textContent), label: cell.textContent } })
		const tbody = [...table.tBodies[0].rows].map(row => {
			const obj = {};
			[...row.cells].forEach((cell, index) => {
					const field = thead[index].field
					obj[field] = cell.textContent
			});
			return obj
		})
		return {
			cols: table.tHead.rows[0].cells.length,
			pages: Math.floor(tbody.length / this.options.itemsperpage),
			rows: table.tBodies[0].rows.length,
			tbody,
			thead
		}
	}
}
customElements.define("ui-datagrid", uiDataGrid);
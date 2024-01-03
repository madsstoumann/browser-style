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
/**
 * Table Module
 * @summary 26-10-2021
 * @author Mads Stoumann
 * @description Various methods for tables. 
 * Assumption: `<thead>` contains a SINGLE `<tr>`-row of `<th>`s, only ONE `<tbody>`-element present.
 */

/**
 * @function editTable
 * @param {Node} table
 * @description Make a table editable
 */
 import keyHandler from './../../assets/js/keyhandler.mjs';
 import setCaret from '../../assets/js/setcaret.mjs';
 import updown from '../input/updown.mjs';
 import { uuid } from '../../assets/js/uuid.mjs';

export function editTable(table, config) {
	if (!table.__data) table.__data = tableToObj(table);
	const settings = Object.assign({ 
		addcol: false, 
		addrow: false,
		delcol: false,
		delrow: false
	}, config);

	table.__data.edit = true;
	ariaTable(table, true); /* TODO! */

	const editCell = (cell, editMode) => {
		cell.contentEditable = editMode;
		if (editMode) {
			cell.dataset.value = cell.textContent;
			setCaret(cell);
		}
		else {
			cellEvent(cell);
		}
	}

	const cellEvent = (cell) => {
		if (cell.textContent !== cell.dataset.value) {
			table.dispatchEvent(new CustomEvent('tableEdit', {
				detail: {
					col: cell.cellIndex,
					row: cell.parentNode.rowIndex,
					id: cell.dataset.id,
					old: cell.dataset.value,
					value: cell.textContent
				}
			}))
		}
	}

	new keyHandler(table, {
		editAllowedTags: 'TD',
		editCallBack: editCell
	});

	table.addEventListener('dblclick', (e) => {
		const cell = e.target;
		if (cell.contentEditable !== 'true') {
			editCell(cell, true);
			cell.addEventListener('blur', (e) => { 
				cell.contentEditable = false;
				cellEvent(cell);
		 	}, { once: true });
		}
	});
}

/**
 * @function exportCSV
 * @param {Node} table 
 * @description Export table-data to CSV
 */
export function exportCSV(table) {
	exportData(table, 'table.csv', 'Export CSV', () => {
		let csv = table.__data.thead.map(col => JSON.stringify(col)).join(',') + '\r\n';
		csv += table.__data.tbody.map(row => row.map(col => JSON.stringify(col)).join(',')).join('\r\n');
		return csv;
	})
}

/**
 * @function exportJSON
 * @param {Node} table 
 * @description Export table-data to JSON
 */
export function exportJSON(table) {
	exportData(table, 'table.json', 'Export JSON', () => {
		return JSON.stringify({
			thead: table.__data.thead||[],
			tbody: table.__data.tbody
		})
	})
}

/**
 * @function fetchTable
 * @param {Node} table
 * @param {Object} [config] Optional configuration
 * @description Fetch data and build table
*/
export async function fetchTable(table, config) {
	const data = await (await fetch(table.dataset.tableFetch)).json();
	if (data && data.length) {
		const settings = Object.assign({ sortindex: 0, sortorder: 'ascending'}, config);
		const thead = data.shift(), tbody = data, items = data.length, pageItems = table.dataset?.itemsPerPage-0 || data.length, pages = Math.floor(data.length / pageItems);
		const wrapper = table.closest(`[data-table-param]`);
		const param = wrapper?.dataset?.tableParam;

		table.__data = {
			cols: data[0].length,
			items,
			page: 0,
			pageItems,
			pages,
			sortindex: settings.sortindex,
			sortorder: settings.sortorder,
			tbody,
			thead
		}

		if (param.includes('selectable')) {
			table.__data.selectable = true;
			wrapper.addEventListener('change', (event) => {
				const row = event.target?.type === 'checkbox' && event.target.closest('tr');
				if (row) row.classList.toggle('tbl-row--selected', event.target.checked);
			});
		}

		table.tHead.innerHTML = arrToThead(table.__data.thead);
		if (pages > 1) {
			table.addEventListener('setPage', (e) => {
				table.__data.page = e.detail.page;
				setTbody(table);
			});
			table.addEventListener('setPageItems', (e) => {
				table.__data.page = 0;
				table.__data.pageItems = e.detail.pageItems;
				setTbody(table, 0);
			});
		}

		table.dispatchEvent(new CustomEvent('setPage', { detail: { page: 0 }}));

		/* Add `<colgroup>` with `<col>`s */
		table.insertAdjacentHTML('afterbegin', `<colgroup>${[...Array(table.__data.cols).keys()].map(() => `<col></col>`).join('')}</colgroup>`);
		paginateTable(table);


		if (param) {
			if (param.includes('density')) tableDensity(table);
			if (param.includes('exportcsv')) exportCSV(table);
			if (param.includes('exportjson')) exportJSON(table);
			if (param.includes('resizable')) resizeTable(table);
			if (param.includes('searchable')) searchTable(table);
			if (param.includes('sortable')) sortTable(table);
		}
	}
}

/**
 * @function hoverTable
 * @param {Node} table
 * @description Adds events for tracking cell-position on pointer-move
*/
export async function hoverTable(table) {
	let col = -1;
	table.addEventListener('pointermove', (e) => {
		if (e.target.cellIndex !== col) {
			col = e.target.cellIndex;
			table.dataset.col = col;
		}
	});
}

/**
 * @function paginateTable
 * @param {Node} table
 * @description Adds pagination to a table
*/
function paginateTable(table) {
	const div = document.createElement('div');
	div.dataset.blok = 'input-inline table-pagination updown';
	const input = document.createElement('input');
	input.dataset.blok = 'input';
// TODO: Add num of items per page
	input.max = table.__data.pages;
	input.min = 0;
	input.type = 'number';
	input.value = table.__data.page;

	input.addEventListener('input', () => {
		table.dispatchEvent(new CustomEvent('setPage', { detail: { page: input.valueAsNumber }}));
	})

	div.append(input);
	table.parentNode.insertBefore(div, table.nextSibling);

//! TODO: Configurable object
	const config = {
		first:"Go to last page",
		firstIcon:"chv-left-first",
		last:"Go to last page",
		lastIcon:"chv-right-last"
	}
	updown(input, config);
}

/**
 * @function resizeTable
 * @param {Node} table
 * @param {String} [selector] Find header-cells, defaults to `<thead> > <th>`
 * @param {Number} [minWitdh] Minimum width of resize-slider
 * @description Resize table-columns
 */
export function resizeTable(table, selector = 'thead th',  minWidth = 5) {
	if (!table) return;
	const cols = table.querySelectorAll(selector);
	const parent = table.parentNode;
	const tableWidth = table.offsetWidth;
	let value = 0;

	parent.dataset.tableParent = '';
	parent.style.setProperty(`--th`, `${table.offsetHeight - 1}px`);

	cols.forEach((col, index) => {
		const colWidth = parseInt(100 / (tableWidth / col.offsetWidth));
		col.style.width = `calc(1% * var(--c${index}))`;
		table.style.setProperty(`--c${index}`, colWidth);

		if (index > 0) {
			const input = document.createElement('input');
			input.dataset.tableCol = index;
			input.setAttribute('aria-label', 'resize column'); /* TODO! */
			input.type = 'range';
			input.value = value;
			parent.appendChild(input);

			input.addEventListener('input', () => {
				if (input.value < minWidth) input.value = minWidth;
				if (input.value > 100 - minWidth) input.value = 100 - minWidth;

				const next = input.nextElementSibling;
				const prev = input.previousElementSibling;

				if (next?.nodeName === 'INPUT' && (input.valueAsNumber > (next.valueAsNumber - minWidth))) {
					input.value = next.valueAsNumber - minWidth;
					return;
				}
				if (prev?.nodeName === 'INPUT' && (input.valueAsNumber < (prev.valueAsNumber + minWidth))) {
					input.value = prev.valueAsNumber + minWidth;
					return;
				}

				table.style.setProperty(`--c${index-1}`, prev?.nodeName === 'INPUT' ? input.valueAsNumber - prev.valueAsNumber : input.valueAsNumber);
				table.style.setProperty(`--c${index}`, next?.nodeName === 'INPUT' ? next.valueAsNumber - input.valueAsNumber : 100 - input.valueAsNumber);
			});
		}
		value += colWidth;
	});
	
/* HACK TO INIT FIREFOX: Trigger input event on last range to re-position sliders */
	const lastRange = table.parentNode.lastChild;
	if (lastRange?.nodeName === 'INPUT') {
		lastRange.dispatchEvent(new Event('input', {
			bubbles: true,
			cancelable: true,
		}));
	}
}

/**
 * @function searchTable
 * @param {Node} table
 * @param {String} [method] includes, startsWith, endsWith
 * @description Search a table
 */
export function searchTable(table, method = 'includes') {
	if (!table.__data) table.__data = tableToObj(table);
	const control = table.closest(`[data-blok~="table-outer"]`)?.querySelector(`[data-blok~="table-control"]`);
	if (!control) return;

	const input = document.createElement('input');
	input.dataset.blok = 'input search';
	input.type = 'search';
	control.insertBefore(input, control.firstChild);

	input.addEventListener('input', () => {
		const term = input.value.toLowerCase();
		if (term.length >= input.minLength-0) {
			const result = table.__data.tbody.filter(data => data.some(cell => typeof cell === 'string' && cell.toLowerCase()[method](term)));
			if (result?.length) {
				setTbody(table, 0, term, result);
			}
		}
	});
	input.addEventListener('search', () => { 
		if (!input.value.length) {
			setTbody(table, 0);
		}
	});
}

/**
 * @function sortTable
 * @param {Node} table 
 * @description Add sorting to table-columns. Requires `<thead>` with `<th>`-cells
 */
export function sortTable(table) {
	if (!table.__data) table.__data = tableToObj(table);
	const [locale, country] = (table?.lang || 'en-US').split('-');
	const columnSort = (th, table) => {
		const ascending = table.__data.sortorder === 'ascending';
		const index = th.cellIndex;

		if (index !== table.__data.sortindex) {
			/* Change column index, keep asc/desc-order as is */
			table.__data.sortindex = index;
		} else {
			/* Same index clicked, switch asc/desc-order */
			table.__data.sortorder = (ascending ? 'descending' : 'ascending');
		}
		let data = table.__data.tbody.sort((a, b) => {
			return typeof a[index] === 'string' && a[index].localeCompare(b[index], 
				locale, { sensitivity: 'variant' }
			)
		});
		if (table.__data.sortorder === 'descending') {
			data = data.reverse();
		}
		/* Update aria-sort-attribute on header-cells */
		[...table.tHead.rows[0].cells].forEach((cell, cellindex) => {
			cell.setAttribute('aria-sort', cellindex === index ? table.__data.sortorder : 'none');
		});
		setTbody(table);
	}

	/* Init */
	[...table.tHead.rows].forEach(row => [...row.cells].forEach((cell, index) => {
		cell.setAttribute('aria-sort', 'none');
		cell.tabIndex = 0;
		cell.addEventListener('click', event => columnSort(event.target, table));
		cell.addEventListener('keydown', event => {
			if (event.key === ' ') {
				event.preventDefault();
				columnSort(event.target, table);
			}
		})
	}));
}

/**
 * @function tableDensity
 * @param {Node} table 
 * @description Add range with table-density
 */
 export function tableDensity(table) {
	const outer = table.closest(`[data-blok~="table-outer"]`);
	const control = outer?.querySelector(`[data-blok~="table-control"]`);
	if (control) {
		const id = uuid();
		//! TODO: Configurable object
		const density = [
			{ icon: '../blok-icons.svg#icon-density-xl', label: 'xl', value: '1.25rem'},
			{ icon: '../blok-icons.svg#icon-density-md', label: 'medium', value: '1rem', checked: true },
			{ icon: '../blok-icons.svg#icon-density-sm', label: 'small', value: '0.75rem' }
		];
		control.insertAdjacentHTML('beforeend', 
		`<div data-blok="fieldset start halfgap radio table-density">
			${density.map(entry => 
				`<label data-blok="radio-button" aria-label="${entry.label}">
					<input type="radio" name="${id}_density" value="${entry.value}" data-blok="sr"${entry.checked? ` checked`:''}>
					<span data-blok="icon"><svg><use xlink:href="${entry.icon}"></use></svg></span>
				</label>`).join(' ')}
			</div>`);

			outer.addEventListener('change', event => {
				const element = event.target;
				if (event.target.name.includes('density')) table.style.setProperty('--tbl-fz', element.value);
			});
	}
}

/*
=================
 HELPER  METHODS
=================
*/

/**
 * @function ariaTable
 * @param {Node} table
 * @description Adss aria-roles to a table
 */
	function ariaTable(table, isFocusable = false) {
		/* TODO! */
	[...table.rows].forEach((row, rowindex) => {
		// row.setAttribute('aria-rowindex', rowindex);
		row.setAttribute('role', 'row');
		[...row.cells].forEach((col, colindex) => {
			const header = col.tagName.toLowerCase() === 'th';
			// col.setAttribute('aria-colindex', colindex);
			col.setAttribute('role', header ? 'columnheader' : 'gridcell');
			if (isFocusable) {
				col.tabIndex = (colindex === 0 && rowindex === 0) ? 0 : -1;
			}
		});
	});
}

/**
 * @function arrToTbody
 * @param {Array} data Array of arrays
 * @param {String} [term] Optional search-term to tag table-data
 * @description Build table-markup from data
 */
 function arrToTbody(data, term = '', selectable = false) {
	const regex = new RegExp(term, "gi");
	return data.map((row, rowindex) => `<tr>${row.map((cell, cellindex) => {
		const td = term ? cell.replaceAll(regex, `<mark>${term}</mark>`) : cell;
		return `<td>
			${selectable && cellindex === 0 ? `<label data-blok="radio radio-check"><input type="checkbox" data-blok="sr" value="${rowindex}"><span>${td}</span></label>` : td}</td>`}).join('')
	}</tr>`).join('');
}

/**
* @function arrToThead
* @param {Array} data Array of arrays
* @param {String} [term] Optional search-term to tag table-data
* @description Build table-markup from data
*/
function arrToThead(data) {
	return `<tr>${data.map(cell => `<th>${cell}</th>`).join('')}</tr>`;
}

/**
 * @function exportData
 * @param {Node} table
 * @param {String} filename
 * @param {String} linktext
 * @param {Function} data
 * @description Get subset of array
 */
function exportData(table, filename, linktext, data) {
	if (!table.__data) table.__data = tableToObj(table);
	const control = table.closest(`[data-blok~="table-outer"]`)?.querySelector(`[data-blok~="table-control"]`);
	 if (control && table.__data) {
		const lnk = document.createElement('a');
		 lnk.download = filename;
		 lnk.innerText = linktext;
		 lnk.href = '';
		 lnk.onclick = () => {
			lnk.href = 'data:text/plain;charset=UTF-8,' + data();
		 }
		 control.append(lnk);
	 }
}

/**
 * @function getRows
 * @param {Array} data
 * @param {Number} page
 * @param {Number} items
 * @description Get subset of array
 */
function getRows(data, page, items) {
	return items ? data.slice(page * items, page * items + items) : data;
}

/**
 * @function setTbody
 * @param {Node} table
 * @param {Number} [page] Overwrite page from table.__data.page
 * @param {String} [term] Optional search-term to tag table-data
 * @param {Array} [searchresult] Optional search-result
 * @description Returns a page from a table
 */
function setTbody(table, page = -1, term = '', searchresult = null) {
	const data = getRows(searchresult || table.__data.tbody, page > -1 ? page : table.__data.page, table.__data.pageItems);
	table.tBodies[0].innerHTML = arrToTbody(data, term, table.__data.selectable);
	if (table.__data.edit) ariaTable(table, true);
}

/**
 * @function tableToObj
 * @param {Node} table Table to extract data from
 * @param {Number} [index] Default column/sort-by-index
 * @param {String} [order] Search-order: ascending/descending
 * @description Create object with data from existing table
 */
function tableToObj(table, sortindex = 0, sortorder = 'ascending') {
	const out = (rows) => {
		let arr = [];
		for (let row of rows) {
			arr.push(Array.from(row.cells).map(cell => cell.textContent));
		}
		return arr;
	}
	const thead = out(table.tHead.rows), tbody = out(table.tBodies[0].rows), items = table.tBodies[0].rows.length, pageItems = table.dataset?.itemsPerPage-0 || items, pages = Math.floor(items / pageItems), selectable = false;
	return {
		items,
		page: 0,
		pageItems,
		pages,
		selectable,
		sortindex,
		sortorder,
		tbody,
		thead
	}
}
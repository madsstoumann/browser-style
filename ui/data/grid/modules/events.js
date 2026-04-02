import { renderTBody, renderTHead } from './render.table.js';
import { handleSorting } from './data.js';
import handleKeyboardEvents from './events.keyboard.js';
import { addEventListeners, getKeyValueObject, getObj } from './utility.js';

export function attachCustomEventHandlers(context) {
	// Append new rows to the table
	context.addEventListener('dg:append', (event) => {
		const { detail } = event;
		context.state.tbody.push(...detail);
		context.state.rows = context.state.tbody.length;
		context.state.pages = Math.floor(context.state.rows / context.state.itemsPerPage);
		renderTBody(context);
	});

	// Clear selected rows
	context.addEventListener('dg:clearselected', () => {
		context.state.selected.clear();
		context.form.elements.selected.value = 0;
		renderTBody(context);
		if (context.toggle) {
			context.toggle.checked = false;
			context.toggle.indeterminate = false;
		}
		context.dispatch('dg:selected', { detail: [] });
	});

	// Event listener for retrieving selected rows based on composite keys
	context.addEventListener('dg:getselected', () => {
		const selected = [...context.state.selected].map(key => {
			const tempNode = { parentNode: { dataset: { keys: key } } };
			return getObj(context.state, tempNode);
		}).filter(item => item !== null);
		context.dispatch('dg:selected', selected);
	});

	// Remove rows based on keys
	context.addEventListener('dg:remove', (event) => {
		const { detail } = event;
		
		// Check if component has keys defined in thead
		const hasKeys = context.state.thead.some(col => col.key);
		if (!hasKeys) {
			context.log('Cannot remove rows: no "key" field defined in thead', '#F00');
			return;
		}

		// detail should contain keys (array of composite key strings)
		const keysToRemove = Array.isArray(detail) ? detail : (detail.keys || []);
		
		if (!keysToRemove.length) {
			context.log('No keys provided for removal', '#F00');
			return;
		}

		// Capture deleted rows before filtering
		const deletedRows = [];
		const initialLength = context.state.tbody.length;

		// Filter out rows matching the keys
		context.state.tbody = context.state.tbody.filter(row => {
			const keyFields = context.state.thead.filter(col => col.key).map(col => col.field);
			const rowKey = keyFields.map(field => row[field]).join(',');
			const shouldRemove = keysToRemove.includes(rowKey);
			if (shouldRemove) {
				deletedRows.push(row);
			}
			return !shouldRemove;
		});

		// Remove from selection set
		keysToRemove.forEach(key => context.state.selected.delete(key));

		// Update state
		context.state.rows = context.state.tbody.length;
		context.state.items = context.state.tbody.length;
		context.state.pages = Math.ceil(context.state.rows / context.state.itemsPerPage);
		context.form.elements.selected.value = context.state.selected.size;

		// If current page is beyond available pages, go to last page
		if (context.state.page >= context.state.pages && context.state.pages > 0) {
			context.state.page = context.state.pages - 1;
		}

		renderTBody(context);

		const removedCount = initialLength - context.state.tbody.length;
		context.dispatch('dg:removed', { 
			count: removedCount, 
			rows: deletedRows,
			remaining: context.state.rows 
		});
	});
}

export function attachEventListeners(context) {
	const { form, table } = context;

	// Pagination controls
	form.elements.stepdown.addEventListener('click', () => context.navigatePage(null, 'prev'));
	form.elements.stepup.addEventListener('click', () => context.navigatePage(null, 'next'));
	form.elements.first.addEventListener('click', () => context.navigatePage(0));
	form.elements.last.addEventListener('click', () => context.navigatePage(context.state.pages - 1));

	// Printable option
	form.elements.preview.addEventListener('click', () => context.print());
	form.elements.print.addEventListener('click', () => context.print(true));
	form.elements.printoptions.addEventListener('change', (event) => {
		context.state.printOptions = event.target.value;
	});

	// Column filter
	form.elements.columnfilter.addEventListener('change', (event) => {
		const column = context.state.thead.find(col => col.field === event.target.name);
		if (column) {
			column.hidden = !event.target.checked;
			context.colgroup.innerHTML = '';
			renderTHead(context);
			renderTBody(context);
		}
	});

	// Select / Deselect All
	form.elements.selectall.addEventListener('click', () => {
		const selectAll = form.elements.selectall.value === 'true' ? false : true;
		form.elements.selectall.value = selectAll;
		context.selectRows(table.tBodies[0].rows, selectAll, true, true);
	});

	// Searchable option
	addEventListeners(form.elements.searchterm, ['input', 'search'], e => context.setAttribute('searchterm', e.target.value));
	form.elements.searchmethod.addEventListener('change', e => {
		context.setAttribute('searchmethod', e.target.value);
		renderTBody(context);
	});

	// Layout and textwrap options
	form.elements.layoutfixed.addEventListener('change', e => context.table.classList.toggle('--fixed', e.target.checked));
	form.elements.textwrap.addEventListener('change', e => context.table.classList.toggle('--no-wrap', !e.target.checked));

	// Table click and keyboard events
	table.addEventListener('click', (event) => handleTableClick(event, context));
	table.addEventListener('focus', (event) => handleCellFocus(event), true);
	table.addEventListener('focusout', (event) => handleCellUpdate(event, context));
	table.addEventListener('input', (event) => handleCellEdit(event, context));
	table.addEventListener('keydown', (event) => handleKeyboardEvents(event, context));
	form.addEventListener('input', (event) => handleFormInput(event, context));

	// Density options
	if (form.elements.density) {
		form.elements.density.addEventListener('change', (event) => {
			Object.values(context.settings.densityOptions).forEach(option => {
				table.classList.remove(option.class);
			});
			const densityValue = event.target.value || form.elements.density.value;
			const selected = context.settings.densityOptions[densityValue];
			if (selected) table.classList.add(selected.class);
		});
		const checked = form.elements.density.querySelector('input:checked');
		if (checked) {
			const selected = context.settings.densityOptions[checked.value];
			if (selected) table.classList.add(selected.class);
		}
	}
}

function handleFormInput(event, context) {
	const input = event.target;
	if (input.name === 'itemsperpage') context.setAttribute('itemsperpage', parseInt(input.value, 10));
	if (input.name === 'page') context.setAttribute('page', parseInt(input.value, 10) - 1);
}

function handleTableClick(event, context) {
	const { table, state, settings } = context;
	const node = event.target;

	if (node === table) return;

	if (['TD', 'TH'].includes(node.nodeName)) {
		state.cellIndex = node.cellIndex;
		state.rowIndex = node.parentNode.rowIndex;

		// Sorting logic
		if (state.rowIndex === 0 && node.nodeName === 'TH') {
			const index = node.dataset.sortIndex;
			handleSorting(context, index);
		}

		// Dispatch dg:rowclick on tbody row click
		if (node.nodeName === 'TD') {
			const row = node.closest('tr');
			if (row && row.parentNode.nodeName === 'TBODY') {
				const { row: rowData, rowIndex } = getObj(state, node) || {};
				const keyValueObject = getKeyValueObject(state, node);
				
				if (rowData && rowIndex !== undefined) {
					const eventData = {
						rowIndex,
						row: rowData,
						pageIndex: state.page
					};
					// Add keys if they exist
					if (keyValueObject && Object.keys(keyValueObject).length > 0) {
						eventData.keys = keyValueObject;
					}
					context.dispatch('dg:rowclick', eventData);
				}
			}
		}

		// Handle cell-specific events
		const columnConfig = state.thead[settings.selectable && state.cellIndex > 0 ? state.cellIndex - 1 : state.cellIndex];

		if (node.nodeName === 'TD' && columnConfig?.event) {
			const { row, rowIndex } = getObj(state, node) || {};
			const keyValueObject = getKeyValueObject(state, node);
			
			if (row && rowIndex !== undefined) {
				const eventData = {
					keys: keyValueObject,
					row,
					rowIndex,
					...columnConfig.eventData
				};
				context.dispatch(columnConfig.event, eventData);
			}
		}

		context.setActive();
	}

	if (settings.selectable && node.nodeName === 'INPUT') {
		if (node.hasAttribute('data-toggle-row')) {
			context.selectRows([node.closest('tr')], true);
		} else if (node.hasAttribute('data-toggle-all')) {
			const allRows = table.tBodies[0].rows;
			context.selectRows(allRows, node.checked, true, event.shiftKey);
		}
	}
}

function handleCellFocus(event) {
	const cell = event.target;
	if (cell.isContentEditable && !cell.dataset.oldValue) {
		const trimmedContent = cell.textContent.trim();
		cell.dataset.oldValue = trimmedContent;
		cell.dataset.newValue = trimmedContent;
	}
}

/**
 * Handles the cell edit event.
 * 
 * This function is triggered when a cell in the data grid is edited. 
 * If the cell is content editable, it stores the trimmed text content 
 * of the cell in the `data-new-value` attribute.
 * 
 * @param {Event} event - The event object representing the cell edit event.
 */
function handleCellEdit(event) {
	const cell = event.target;
	if (cell.isContentEditable) {
		cell.dataset.newValue = cell.textContent.trim();
	}
}

function handleCellUpdate(event, context) {
	const cell = event.target;
	if (!cell.isContentEditable) return;

	const { newValue, oldValue } = cell.dataset;

	if (newValue !== oldValue) {
		const adjustedCellIndex = context.settings.selectable && cell.cellIndex > 0 ? cell.cellIndex - 1 : cell.cellIndex;
		const columnConfig = context.state.thead[adjustedCellIndex];
		const field = columnConfig.field;
		const { row, rowIndex } = getObj(context.state, cell) || {};
		row[field] = newValue;

		context.dispatchEvent(new CustomEvent('dg:cellchange', {
			detail: {
				field,
				newValue,
				oldValue,
				row,
				rowIndex
			}
		}));

		cell.dataset.oldValue = newValue;
	}
	cell.dataset.newValue = cell.textContent.trim();
}

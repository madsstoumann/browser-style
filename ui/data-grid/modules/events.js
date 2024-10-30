import { renderTBody } from './render.table.js';
import { exportCSV, downloadFile, handleSorting } from './data.js';
import handleKeyboardEvents from './events.keyboard.js';
import { addEventListeners, getKeyValueObject, getObj } from './utility.js';

/**
 * Attaches custom event handlers for the context.
 * Handles events such as appending new rows, clearing selected rows, and retrieving rows.
 *
 * @param {Object} context - The context object containing the state, form, and event dispatching methods.
 */
export function attachCustomEventHandlers(context) {
	const { state } = context;

	// Append new rows to the table
	context.addEventListener('dg:append', (event) => {
		const { detail } = event;
		state.tbody.push(...detail);
		state.rows = state.tbody.length;
		state.pages = Math.floor(state.rows / state.itemsPerPage);
		renderTBody(context);
	});

	// Clear selected rows
	context.addEventListener('dg:clearselected', () => {
		state.selected.clear();
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
		const selected = [...state.selected].map(key => {
			const tempNode = { parentNode: { dataset: { keys: key } } };
			return getObj(state, tempNode);
		});
		
		context.dispatch('dg:selected', { detail: selected.filter(item => item !== null) });
	});
}

/**
 * Attaches standard event listeners to form controls, such as pagination, print, export, search, and density changes.
 *
 * @param {Object} context - The context object containing form, table, options, and state.
 */
export function attachEventListeners(context) {
	const { form, table, options, state } = context;

	// Pagination controls
	form.elements.stepdown.addEventListener('click', () => context.navigatePage(null, 'prev'));
	form.elements.stepup.addEventListener('click', () => context.navigatePage(null, 'next'));
	form.elements.first.addEventListener('click', () => context.navigatePage(0));
	form.elements.last.addEventListener('click', () => context.navigatePage(context.state.pages - 1));

	// Printable option
	if (options.printable) form.elements.print.addEventListener('click', () => context.printTable());

	// Exportable options
	if (options.exportable) {
		form.elements.csv.addEventListener('click', () => {
			const csv = exportCSV(state);
			if (csv) downloadFile(csv, 'export.csv');
		});
		form.elements.json.addEventListener('click', () => {
			const json = JSON.stringify(state.tbody, null, 2);
			if (json) downloadFile(json, 'export.json', 'application/json;charset=utf-8;');
		});
	}

	// Searchable option
	if (options.searchable) {
		addEventListeners(form.elements.searchterm, ['input', 'search'], e => context.setAttribute('searchterm', e.target.value));
		form.elements.searchmethod.addEventListener('change', e => {
			context.setAttribute('searchmethod', e.target.value);
			renderTBody(context);
		});
	}

	// Table click and keyboard events
	table.addEventListener('click', (event) => handleTableClick(event, context));
	table.tBodies[0].addEventListener('dblclick', () => context.editBegin());
	table.addEventListener('keydown', (event) => handleKeyboardEvents(event, context));
	form.addEventListener('input', (event) => handleFormInput(event, context));

	// Density options
	if (form.elements.density) {
		form.elements.density.addEventListener('change', (event) => {
			Object.values(context.densityOptions).forEach(option => {
				table.classList.remove(option.class);
			});
			const selected = context.densityOptions[event.target.value];
			if (selected) table.classList.add(selected.class);
		});
		const checked = form.elements.density.querySelector('input:checked');
		if (checked) {
			const selected = context.densityOptions[checked.value];
			if (selected) table.classList.add(selected.class);
		}
	}
}

/**
 * Handles form input events for pagination controls such as items per page and page number.
 *
 * @param {Event} event - The input event from the form.
 * @param {Object} context - The context object with state and options.
 */
function handleFormInput(event, context) {
	const input = event.target;
	if (input.name === 'itemsperpage') context.setAttribute('itemsperpage', parseInt(input.value, 10));
	if (input.name === 'page') context.setAttribute('page', parseInt(input.value, 10) - 1);
}

/**
 * Handles table clicks for sorting, row selection, and other actions.
 *
 * @param {MouseEvent} event - The click event from the table.
 * @param {Object} context - The context object with state and options.
 */
function handleTableClick(event, context) {
	const { table, state, options } = context;
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

		// Handle cell-specific events
		const columnConfig = state.thead[options.selectable && state.cellIndex > 0 ? state.cellIndex - 1 : state.cellIndex];

		if (node.nodeName === 'TD' && columnConfig?.event) {
			const { row, rowIndex } = getObj(state, node) || {};
			const keyValueObject = getKeyValueObject(state, node);
			
			if (row && rowIndex !== undefined) {
				context.dispatch(columnConfig.event, {
					keys: keyValueObject,
					row,
					rowIndex
				});
			}
		}

		context.setActive();
	}

	if (options.selectable && node.nodeName === 'INPUT') {
		if (node.hasAttribute('data-toggle-row')) {
			context.selectRows([node.closest('tr')], true);
		} else if (node.hasAttribute('data-toggle-all')) {
			const allRows = table.tBodies[0].rows;
			context.selectRows(allRows, node.checked, true);
		}
	}
}

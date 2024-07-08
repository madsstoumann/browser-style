import { renderTBody } from './render.js';
import { exportCSV, downloadFile } from './data.js';
import handleKeyboardEvents from './keyboard.js';
import { addEventListeners } from './utils.js';

export function attachCustomEventHandlers(context) {
	const { state } = context;

	context.addEventListener('dg:append', (event) => {
		const { detail } = event;
		state.tbody.push(...detail);
		state.rows = state.tbody.length;
		state.pages = Math.floor(state.rows / state.itemsPerPage);
		renderTBody(context);
	});

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

	context.addEventListener('dg:getrow', () => {
		const node = context.active;
		if (node) {
			const obj = context.getObj(node);
			context.dispatch('dg:row', { detail: obj });
		}
	});

	context.addEventListener('dg:getselected', () => {
		const selected = [...state.selected].map(key => state.tbody.find(row => row[state.thead.find(cell => cell.uid).field] === key));
		context.dispatch('dg:selected', { detail: selected });
	});
}

export function attachEventListeners(context) {
	const { form, table, options, state } = context;

	// Pagination controls
	form.elements.stepdown.addEventListener('click', () => context.prev());
	form.elements.stepup.addEventListener('click', () => context.next());
	form.elements.first.addEventListener('click', () => context.setAttribute('page', 0));
	form.elements.last.addEventListener('click', () => context.setAttribute('page', state.pages - 1));

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

	// Density option
	if (options.density) form.elements.density.addEventListener('click', () => table.classList.toggle('--compact'));

	// Searchable option
	if (options.searchable) {
		addEventListeners(form.elements.searchterm, ['input', 'search'], e => context.setAttribute('searchterm', e.target.value));
		form.elements.searchmethod.addEventListener('change', e => {
			context.setAttribute('searchmethod', e.target.value);
			renderTBody(context);
		});
	}

	table.addEventListener('click', (event) => handleTableClick(event, context));
	table.tBodies[0].addEventListener('dblclick', () => context.editBegin());
	table.addEventListener('keydown', (event) => handleKeyboardEvents(event, context));
	form.addEventListener('input', (event) => handleFormInput(event, context));
}

function handleFormInput(event, context) {
	const input = event.target;
	if (input.name === 'itemsperpage') context.setAttribute('itemsperpage', parseInt(input.value, 10));
	if (input.name === 'page') context.setAttribute('page', parseInt(input.value, 10) - 1);
}

function handleTableClick(event, context) {
	const { table, state, options } = context;
	const node = event.target;
	if (node === table) return;
	if (['TD', 'TH'].includes(node.nodeName)) {
		state.cellIndex = node.cellIndex;
		state.rowIndex = node.parentNode.rowIndex;
		if (state.rowIndex === 0) {
			const index = node.dataset.sortIndex;
			if (index !== undefined) context.setAttribute('sortindex', parseInt(index, 10));
		}
		context.setActive();
	}
	if (options.selectable && node.nodeName === 'INPUT') {
		if (node.hasAttribute('data-toggle-row')) context.selectRows([node.closest('tr')], true);
		if (node.hasAttribute('data-toggle-all')) {
			if (state.selected.size) {
				node.checked = false;
				context.selectRows(table.tBodies[0].rows, false, true);
			} else {
				context.selectRows(table.tBodies[0].rows, true, true);
			}
		}
	}
	const row = node.closest('tr');
	if (row && row.dataset.uid) {
		context.dispatch('dg:rowclick', { id: row.dataset.uid });
	}
}

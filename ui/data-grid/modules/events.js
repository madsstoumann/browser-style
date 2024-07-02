import { renderTBody } from './render.js';
import { exportCSV, downloadFile } from './data.js';
import handleKeyboardEvents from './keyboard.js';

export function attachCustomEventHandlers(context) {
	context.addEventListener('dg:append', (event) => {
		const { detail } = event;
		context.state.tbody.push(...detail);
		const rows = context.state.tbody.length;
		context.state.pages = Math.floor(rows / context.state.itemsPerPage);
		context.state.rows = rows;
		renderTBody(context);
	});

	context.addEventListener('dg:clearselected', () => {
		context.state.selected.clear();
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
		const selected = [...context.state.selected].map(key => context.state.tbody.find(row => row[context.state.thead.find(cell => cell.uid).field] === key));
		context.dispatch('dg:selected', { detail: selected });
	});
}

export function attachEventListeners(context) {
	const { form, table, options, state } = context;

	form.elements.stepdown.addEventListener('click', () => context.prev());
	form.elements.stepup.addEventListener('click', () => context.next());
	form.elements.first.addEventListener('click', () => context.setAttribute('page', 0));
	form.elements.last.addEventListener('click', () => context.setAttribute('page', state.pages - 1));

	if (options.printable) form.elements.print.addEventListener('click', () => context.printTable());
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
	if (options.density) form.elements.density.addEventListener('click', () => { table.classList.toggle('--compact'); });
	if (options.searchable) {
		['input', 'search'].forEach(event => {
			form.elements.searchterm.addEventListener(event, e => context.setAttribute('searchterm', e.target.value));
		});
		form.elements.searchmethod.addEventListener('change', e => {
			context.setAttribute('searchmethod', e.target.value);
			renderTBody(context);
		});
	}

	table.addEventListener('click', (event) => {
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
	});

	table.tBodies[0].addEventListener('dblclick', () => context.editBegin());
	table.addEventListener('keydown', (event) => handleKeyboardEvents(event, context));

	form.addEventListener('input', (event) => {
		const input = event.target;
		if (input.name === 'itemsperpage') context.setAttribute('itemsperpage', parseInt(event.target.value, 10));
		if (input.name === 'page') context.setAttribute('page', parseInt(event.target.value, 10) - 1);
	});
}

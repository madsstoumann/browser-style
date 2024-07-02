import { consoleLog } from './utils.js';
import { calculatePages } from './data.js';

/**
 * Updates the colgroup HTML element with columns based on the state's column count.
 * @returns {void}
 */
export function renderColGroup(colgroup, cols) {
	try {
		colgroup.innerHTML = `<col>`.repeat(cols);
	} catch (error) {
		consoleLog(`Error in colGroup: ${error}`, '#F00');
	}
};

/**
 * Renders the table in the given context.
 *
 * @param {Object} context - The context object containing the necessary data for rendering.
 */
export function renderTable(context) {
	consoleLog(`render: table`, '#52B', context.options.debug);
	renderColGroup(context.colgroup, context.state.cols);
	renderTHead(context);
	renderTBody(context);
}

/**
 * Renders the table header (thead) based on the provided context.
 *
 * @param {Object} context - The context object containing the state and options.
 */
export function renderTHead(context) {
	try {
		const firstNotHidden = context.state.thead.find(cell => !cell.hidden);

		const tableHeaderHTML = `<tr>${context.state.thead
			.map((cell, index) => {
				if (cell.hidden) return '';

				const isSelectable = context.options.selectable && index === 0;
				const tabIndex = cell === firstNotHidden ? (isSelectable ? -1 : 0) : -1;

				const th = `<th tabindex="${tabIndex}"${cell.uid ? ` data-uid` : ''} data-field="${cell.field}" data-sort-index="${index}"><span>${cell.label || cell}</span></th>`;
				const content = isSelectable ? `<th tabindex="0"><label><input type="checkbox" tabindex="-1" data-toggle-all></label></th>${th}` : th;
				return content;
			})
			.join('')}</tr>`;

		context.table.tHead.innerHTML = tableHeaderHTML;
		if (context.options.selectable) context.toggle = context.table.querySelector('input[data-toggle-all]');

		consoleLog(`render: thead`, '#56F', context.options.debug);
	} catch (error) {
		consoleLog(`Error rendering table header (thead): ${error}`, '#F00', context.options.debug);
	}
}

/**
 * Renders the table body (tbody) based on the provided context.
 * @param {Object} context - The context object containing the necessary data and options.
 */
export function renderTBody(context) {
	try {
		if (!context.state.tbody.length) return;

		const hidden = context.state.thead.map((cell, index) => cell.hidden ? index : '').filter(String);

		const uid = context.state.thead.find(cell => cell.uid)?.field;

		const allowedMethods = ['end', 'equals', 'start'];
		let method = context.getAttribute('searchmethod') || 'includes';
		method = allowedMethods.includes(method) ? method : 'includes';
		const searchterm = context.getAttribute('searchterm')?.toLowerCase();

		const data = searchterm
			? context.state.tbody.filter((row) =>
				Object.values(row).some((cell, index) => {
					if (!hidden.includes(index)) {
						const lowerCaseCell = cell.toString().toLowerCase();
						if (method === 'start') {
							return lowerCaseCell.startsWith(searchterm);
						} else if (method === 'end') {
							return lowerCaseCell.endsWith(searchterm);
						} else if (method === 'equals') {
							return lowerCaseCell === searchterm;
						} else {
							return lowerCaseCell.includes(searchterm);
						}
					}
					return false;
				})
			)
			: context.state.tbody;

		if (context.state.sortIndex > -1) {
			data.sort(
				(a, b) => {
					const A = Object.values(a)[context.state.sortIndex];
					const B = Object.values(b)[context.state.sortIndex];
					return typeof A === 'string' ? A.localeCompare(B, context.options.locale, { sensitivity: 'variant' }) : A - B;
				});
			if (context.state.sortOrder === 1) data.reverse();
		}

		if (!data.length) {
			context.table.tBodies[0].innerHTML = `<tr><td colspan="${context.state.cols}">${context.t('noResult')}</td></tr>`;
			context.state.pageItems = 0;
			context.state.items = 0;
			context.state.pages = 0;
			updateNavigation(context);
			return;
		}

		const page = paginate(context, data);
		context.state.pageItems = page.length;
		context.state.items = data.length;
		context.state.pages = calculatePages(data.length, context.state.itemsPerPage);

		context.table.tBodies[0].innerHTML = page
			.map((row) => {
				const selected = context.state.selected.has(row[uid]) ? ' aria-selected' : '';
				const mapped = Object.values(row)
					.map((cell, index) => {
						if (context.state.thead[index].hidden) return '';

						const formatMethod = context.state.thead[index].formatter;
						const formatter = context.formatters && context.formatters[formatMethod] || ((value) => value);
						const selectable = (context.options.selectable && index === 0) ? `<td><label><input type="checkbox" tabindex="-1"${selected ? ` checked` : ''} data-toggle-row></label></td>` : '';

						return `${selectable}<td tabindex="-1">${formatter(cell)}</td>`;
					})
					.join('');
				return `<tr${selected}${uid ? ` data-uid="${row[uid]}"` : ''}>${mapped}</tr>`;
			})
			.join('');

		consoleLog(`render: tbody`, '#584', context.options.debug);
		if (context.options.debug) console.log(context.state);

		updateNavigation(context);
	} catch (error) {
		consoleLog(`Error rendering table body (tbody): ${error}`, '#F00', context.options.debug);
	}
}

/**
 * Updates the navigation elements in the UI based on the current state.
 *
 * @param {Object} context - The context object containing the state and form elements.
 */
export function updateNavigation(context) {
	try {
		const { page, pages, items, itemsPerPage, pageItems } = context.state;
		const E = context.form.elements;

		E.actions.hidden = !items;
		E.navigation.hidden = !context.hasAttribute('itemsperpage') || !items;
		E.selection.hidden = !context.options.selectable;

		E.end.value = Math.min((page + 1) * itemsPerPage, items);
		E.page.setAttribute('max', pages);
		E.page.size = page.toString().length;
		E.page.value = page + 1;
		E.pages.value = pages;
		E.start.value = page * itemsPerPage + 1;
		E.first.disabled = page === 0;
		E.stepdown.disabled = page === 0;
		E.stepup.disabled = page === pages - 1;
		E.last.disabled = page === pages - 1;
		E.total.value = items;
	} catch (error) {
		consoleLog(`Error updating navigation: ${error}`, '#F00', context.options.debug);
	}
}

/* Internal methods */
function paginate(context, data) {
	try {
		const startIndex = context.state.page * context.state.itemsPerPage;
		const endIndex = startIndex + context.state.itemsPerPage;
		return data.slice(startIndex, endIndex);
	} catch (error) {
		consoleLog(`Error while paginating data: ${error}`, '#F00', context.options.debug);
		return [];
	}
}
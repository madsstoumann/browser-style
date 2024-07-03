import { consoleLog } from './utils.js';
import { calculatePages } from './data.js';

function applySorting(context, data) {
	const { sortIndex, sortOrder } = context.state;
	const { locale } = context.options;

	if (sortIndex > -1) {
		data.sort((a, b) => {
			const A = Object.values(a)[sortIndex];
			const B = Object.values(b)[sortIndex];
			return typeof A === 'string' ? A.localeCompare(B, locale, { sensitivity: 'variant' }) : A - B;
		});
		if (sortOrder === 1) data.reverse();
	}
}

function filterData(context, data) {
	const { thead } = context.state;
	const hidden = thead.map((cell, index) => cell.hidden ? index : '').filter(String);
	const searchterm = context.getAttribute('searchterm')?.toLowerCase();
	const method = context.getAttribute('searchmethod') || 'includes';
	const allowedMethods = ['end', 'equals', 'start'];
	const searchMethod = allowedMethods.includes(method) ? method : 'includes';

	if (!searchterm) return data;

	return data.filter(row =>
		Object.values(row).some((cell, index) => {
			if (!hidden.includes(index)) {
				const lowerCaseCell = cell.toString().toLowerCase();
				switch (searchMethod) {
					case 'start': return lowerCaseCell.startsWith(searchterm);
					case 'end': return lowerCaseCell.endsWith(searchterm);
					case 'equals': return lowerCaseCell === searchterm;
					default: return lowerCaseCell.includes(searchterm);
				}
			}
			return false;
		})
	);
}

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

export function renderColGroup(colgroup, cols) {
	try {
		colgroup.innerHTML = `<col>`.repeat(cols);
	} catch (error) {
		consoleLog(`Error in colGroup: ${error}`, '#F00');
	}
}

export function renderTable(context) {
	consoleLog(`render: table`, '#52B', context.options.debug);
	renderColGroup(context.colgroup, context.state.cols);
	renderTHead(context);
	renderTBody(context);
}

export function renderTBody(context) {
	try {
		const { tbody, thead, cols, selected } = context.state;
		if (!tbody.length) return;

		const data = filterData(context, [...tbody]);
		applySorting(context, data);

		if (!data.length) {
			context.table.tBodies[0].innerHTML = `<tr><td colspan="${cols}">${context.t('noResult')}</td></tr>`;
			Object.assign(context.state, { pageItems: 0, items: 0, pages: 0 });
			updateNavigation(context);
			return;
		}

		const page = paginate(context, data);
		Object.assign(context.state, { pageItems: page.length, items: data.length, pages: calculatePages(data.length, context.state.itemsPerPage) });

		const uid = thead.find(cell => cell.uid)?.field;

		const tbodyHTML = page.map(row => {
			const rowSelected = selected.has(row[uid]) ? ' aria-selected' : '';
			const rowHTML = Object.values(row).map((cell, index) => {
				if (thead[index].hidden) return '';
				const formatter = context.formatters?.[thead[index].formatter] || ((value) => value);
				const selectable = (context.options.selectable && index === 0) ? `<td><label><input type="checkbox" tabindex="-1"${rowSelected ? ` checked` : ''} data-toggle-row></label></td>` : '';
				return `${selectable}<td tabindex="-1">${formatter(cell)}</td>`;
			}).join('');
			return `<tr${rowSelected}${uid ? ` data-uid="${row[uid]}"` : ''}>${rowHTML}</tr>`;
		}).join('');

		context.table.tBodies[0].innerHTML = tbodyHTML;
		consoleLog(`render: tbody`, '#584', context.options.debug);
		if (context.options.debug) console.log(context.state);

		updateNavigation(context);
	} catch (error) {
		consoleLog(`Error rendering table body (tbody): ${error}`, '#F00', context.options.debug);
	}
}

export function renderTHead(context) {
	try {
		const { thead } = context.state;
		const { selectable } = context.options;
		const firstNotHidden = thead.find(cell => !cell.hidden);

		const tableHeaderHTML = `<tr>${thead
			.map((cell, index) => {
				if (cell.hidden) return '';

				const isSelectable = selectable && index === 0;
				const tabIndex = cell === firstNotHidden ? (isSelectable ? -1 : 0) : -1;

				const th = `<th tabindex="${tabIndex}"${cell.uid ? ` data-uid` : ''} data-field="${cell.field}" data-sort-index="${index}"><span>${cell.label || cell}</span></th>`;
				const content = isSelectable ? `<th tabindex="0"><label><input type="checkbox" tabindex="-1" data-toggle-all></label></th>${th}` : th;
				return content;
			})
			.join('')}</tr>`;

		context.table.tHead.innerHTML = tableHeaderHTML;
		if (selectable) context.toggle = context.table.querySelector('input[data-toggle-all]');

		consoleLog(`render: thead`, '#56F', context.options.debug);
	} catch (error) {
		consoleLog(`Error rendering table header (thead): ${error}`, '#F00', context.options.debug);
	}
}

export function updateNavigation(context) {
	try {
		const { page, pages, items, itemsPerPage } = context.state;
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

import { consoleLog } from './utils.js';
import { calculatePages } from './data.js';

function applySorting(context, data) {
	const { sortIndex, sortOrder } = context.state;
	const { locale } = context.options;

	if (sortIndex > -1) {
		data.sort((a, b) => {
			const rowA = Object.values(a);
			const rowB = Object.values(b);
			const A = rowA[sortIndex];
			const B = rowB[sortIndex];
			return typeof A === 'string' ? A.localeCompare(B, locale, { sensitivity: 'variant' }) : A - B;
		});
		if (sortOrder === 1) data.reverse();
	}
}

function filterData(context, data) {
	const { thead } = context.state;
	const hidden = thead.map((cell, index) => cell.hidden ? index : null).filter(index => index !== null);
	const searchterm = context.getAttribute('searchterm')?.toLowerCase()?.trim();
	const method = context.getAttribute('searchmethod') || 'includes';
	const allowedMethods = ['end', 'equals', 'start'];
	const searchMethod = allowedMethods.includes(method) ? method : 'includes';

	// If no search term, return all data
	if (!searchterm) return data;

	return data.filter(row => 
		Object.values(row).some((cell, index) => {
			// Skip hidden columns
			if (!hidden.includes(index)) {
				try {
					// Handle null, undefined, empty, and non-relevant types
					if (cell === null || cell === undefined || cell === '' || typeof cell === 'object') {
						return false;
					}

					// Convert to lowercase string for comparison
					let lowerCaseCell = typeof cell === 'string' ? cell.toLowerCase().trim() : cell.toString();

					// Apply the filtering logic based on the search method
					switch (searchMethod) {
						case 'start':
							return lowerCaseCell.startsWith(searchterm);
						case 'end':
							return lowerCaseCell.endsWith(searchterm);
						case 'equals':
							return lowerCaseCell === searchterm;
						default:
							return lowerCaseCell.includes(searchterm);
					}
				} catch (error) {
					console.error(`Error processing cell at index ${index}:`, cell, error);
					return false;
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

		// Remove existing popovers
		context.querySelectorAll('[popover]').forEach(popover => popover.remove());

		// Filter for visible columns
		const visibleColumns = thead.filter(cell => !cell.hidden);
		context.state.cols = visibleColumns.length + 1; // Adjust for any extra columns like selection

		// Filter and sort the data
		let data = filterData(context, [...tbody]);
		applySorting(context, data);

		// If no data is found, show "no result" message
		if (!data.length) {
			context.table.tBodies[0].innerHTML = `<tr><td colspan="${cols}">${context.translate('noResult')}</td></tr>`;
			Object.assign(context.state, { pageItems: 0, items: 0, pages: 0 });
			updateNavigation(context);
			return;
		}

		// Use the paginate function to slice the data for the current page
		const page = paginate(context, data);

		// Initialize page-related state if necessary
		// if (!context.dataInitialized) {
			Object.assign(context.state, {
				pageItems: page.length,
				items: data.length,
				pages: calculatePages(data.length, context.state.itemsPerPage),
			});
		// }

		// Get unique identifier for rows if it exists
		const uid = thead.find(cell => cell.uid)?.field;
		const searchterm = context.getAttribute('searchterm')?.toLowerCase();

		// Determine the first visible column for checkbox handling
		const firstVisibleColumnIndex = visibleColumns[0] ? thead.indexOf(visibleColumns[0]) : 0;

		// Generate HTML for table body
		const tbodyHTML = page.map((row) => {
			const rowSelected = selected.has(row[uid]) ? ' aria-selected' : '';
			let lastVisibleCellIndex = -1;

			// Build the row HTML by iterating over visible columns
			let rowHTML = Object.values(row).map((cell, index) => {
				if (thead[index].hidden) return '';
				lastVisibleCellIndex = index;

				const formatter = context.formatters?.[thead[index].formatter] || ((value) => value);
				const selectable = (context.options.selectable && index === firstVisibleColumnIndex) ? 
					`<td><label><input type="checkbox" tabindex="-1"${rowSelected ? ` checked` : ''} data-toggle-row></label></td>` : '';
				let cellValue = (cell === null || cell === 'null' || cell === undefined) ? '' : cell.toString();

				// Apply search term highlighting if applicable
				cellValue = searchterm ? cellValue.replace(new RegExp(`(${searchterm})`, 'gi'), '<mark>$1</mark>') : cellValue;

				return `${selectable}<td tabindex="-1">${formatter(cellValue)}</td>`;
			}).join('');

			// Handle the expand feature
			const expandFields = thead
				.map((header) => header.expand ? `<p><strong>${header.label}</strong><br>${row[header.field]}</p>` : '')
				.filter(content => content !== '')
				.join('');

			if (expandFields) {
				// Generate a unique popover ID and insert the expand button
				const popoverId = `p${window.crypto.randomUUID()}`;
				const buttonHTML = ` <button type="button" tabindex="-1" popovertarget="${popoverId}"><ui-icon type="${context.config.expandIcon ? context.config.expandIcon : 'kebab'}"></ui-icon></button>`;
				const popoverHTML = `
					<div id="${popoverId}" popover class="ui-table-expand ${context.config.expandType ? context.config.expandType : '--inline-start'}">
						${expandFields}
					</div>
				`;
				context.wrapper.insertAdjacentHTML('beforeend', popoverHTML);

				// Insert the button into the last rendered <td> by appending to it
				const cellHTML = rowHTML.split('</td>');
				cellHTML[lastVisibleCellIndex] = cellHTML[lastVisibleCellIndex].replace(
					/(<td[^>]*>)(.*)/,
					`$1<span class="ui-table-expand--trigger">$2${buttonHTML}</span>`
				);
				rowHTML = cellHTML.join('</td>');
			}

			// Return the row HTML
			return `<tr${rowSelected}${uid ? ` data-uid="${row[uid]}"` : ''}>${rowHTML}</tr>`;
		}).join('');

		// Inject the newly generated HTML into the table body
		context.table.tBodies[0].innerHTML = tbodyHTML;

		// Log the rendering process for debugging purposes
		context.console(`render: tbody`, '#584');
		if (context.options.debug) console.log(context.state);

		// Update the navigation UI
		updateNavigation(context);
	} catch (error) {
		context.console(`Error rendering table body (tbody): ${error}`, '#F00');
	}
}


export function renderTHead(context) {
	try {
		const { thead } = context.state;
		const { selectable } = context.options;
		let firstVisibleColumnFound = false;

		const selectableHeader = selectable ? `<th tabindex="0"><label><input type="checkbox" tabindex="-1" data-toggle-all></label></th>` : '';

		const tableHeaderHTML = `<tr>${
			selectableHeader +
			thead.map((cell) => {
				if (cell.hidden) return '';
				const tabIndex = !firstVisibleColumnFound ? 0 : -1;
				firstVisibleColumnFound = true;

				return `<th tabindex="${tabIndex}"${cell.uid ? ` data-uid` : ''} data-field="${cell.field}" data-sort-index="${thead.indexOf(cell)}"><span>${cell.label || cell}</span></th>`;
			}).join('')
		}</tr>`;

		context.table.tHead.innerHTML = tableHeaderHTML;

		if (selectable) {
			context.toggle = context.table.querySelector('input[data-toggle-all]');
		}

		context.console(`render: thead`, '#56F');
	} catch (error) {
		context.console(`Error rendering table header (thead): ${error}`, '#F00');
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
		E.page.size = (page + 1).toString().length;
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

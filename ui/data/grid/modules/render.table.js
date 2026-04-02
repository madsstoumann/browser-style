import { icons } from './icons.js';
import { calculatePages, t } from './utility.js';

export function applySorting(context, data) {
	const { sortIndex, sortOrder } = context.state;
	const { locale } = context.settings;

	if (sortIndex > -1) {
		const { type = 'string' } = context.state.thead[sortIndex] || {};

		data.sort((a, b) => {
			const A = a[context.state.thead[sortIndex].field] ?? '';
			const B = b[context.state.thead[sortIndex].field] ?? '';

			switch (type) {
				case 'number':
					return Number(A) - Number(B);
				case 'date':
					return new Date(A) - new Date(B);
				case 'boolean':
					return (A === B) ? 0 : A ? 1 : -1;
				case 'currency':
					const numA = parseFloat(A.replace(/[^0-9.-]+/g, ""));
					const numB = parseFloat(B.replace(/[^0-9.-]+/g, ""));
					return numA - numB;
				case 'percentage':
					const percentA = parseFloat(A.replace('%', ''));
					const percentB = parseFloat(B.replace('%', ''));
					return percentA - percentB;
				default:
					// Default to string sorting
					return String(A).localeCompare(String(B), locale, { sensitivity: 'variant' });
			}
		});

		// Reverse order if sortOrder is descending
		if (sortOrder === 1) data.reverse();
	}
	return data;
}

export function filterData(context, data) {
	const { thead } = context.state;
	const hiddenIndices = thead.reduce((acc, cell, index) => cell.hidden ? [...acc, index] : acc, []);
	const searchterm = context.getAttribute('searchterm')?.toLowerCase()?.trim();
	const method = context.getAttribute('searchmethod') || 'includes';
	const searchMethods = {
		start: (cell, term) => cell.startsWith(term),
		end: (cell, term) => cell.endsWith(term),
		equals: (cell, term) => cell === term,
		includes: (cell, term) => cell.includes(term),
	};
	const searchMethod = searchMethods[method] || searchMethods.includes;

	if (!searchterm) return data;

	return data.filter(row =>
		Object.values(row).some((cell, index) => {
			if (hiddenIndices.includes(index) || cell == null || typeof cell === 'object') return false;
			return searchMethod(cell.toString().toLowerCase().trim(), searchterm);
		})
	);
}

function paginate(context, data) {
	if (context.settings.externalNavigation) return data;
	const { page, itemsPerPage } = context.state;
	const startIndex = page * itemsPerPage;
	return data.slice(startIndex, startIndex + itemsPerPage);
}

export function renderColGroup(colgroup, cols) {
	try {
		colgroup.innerHTML = new Array(cols).fill('<col>').join('');
	} catch (error) {
		console.error(`Error in colGroup: ${error}`);
	}
}

export function renderColumnFilter(context) {
	if (!context.form?.elements.columnfilter) return;
	const columnfilter = context.form.elements.columnfilter;
	columnfilter.innerHTML = `
		${context.state.thead.map((cell, index) => {
			const checked = cell.hidden ? '' : 'checked';
			return `<label><input type="checkbox" name="${cell.field}" ${checked}>${cell.label || cell}</label>`;
		}).join('')}`;
}

export function renderTable(context) {
	try {
		context.log(`render: table`, '#52B', context.settings.debug);
		renderColGroup(context.colgroup, context.state.cols);
		renderColumnFilter(context);
		renderTHead(context);
		renderTBody(context);
	} catch (error) {
		context.log(`Error rendering table: ${error}`, '#F00', context.settings.debug);
	}
}

export function renderTBody(context) {
	try {
		const { tbody, thead, cols, selected } = context.state;
		if (!tbody.length) return;

		// Remove existing popovers
		context.querySelectorAll('.ui-table-expand').forEach(popover => popover.remove());

		// Filter for visible columns
		const visibleColumns = thead.filter(cell => !cell.hidden);
		context.state.cols = visibleColumns.length + (context.settings.selectable ? 1 : 0);

		// Filter and sort the data
		let data = filterData(context, [...tbody]);
		if (context.settings.sortable) {
			applySorting(context, data);
		}

		// If no data is found, show "no result" message
		if (!data.length) {
			context.table.tBodies[0].innerHTML = `<tr><td colspan="${cols}">${t('noResult', context.lang, context.i18n)}</td></tr>`;
			Object.assign(context.state, { pageItems: 0, items: 0, pages: 0 });
			updateNavigation(context, true);
			return;
		}

		// Use the paginate function to slice the data for the current page
		const page = paginate(context, data);

		// Get the fields that make up the composite key/s
		const keyFields = thead.filter(cell => cell.key).map(cell => cell.field);
		const searchterm = context.getAttribute('searchterm')?.toLowerCase();

		// If externalNavigation is disabled, or a search term is present, update the state.
		if (!context.settings.externalNavigation || searchterm) {
			const updatedState = {
				pageItems: page.length,
			};

			// If there is a search term, use search-specific state variables.
			if (searchterm) {
				updatedState.searchItems = data.length;
				updatedState.searchPages = calculatePages(data.length, context.state.itemsPerPage);
			} else {
				// Revert to original full dataset state if search is cleared.
				updatedState.items = data.length;
				updatedState.pages = calculatePages(data.length, context.state.itemsPerPage);
				updatedState.searchItems = null;
				updatedState.searchPages = null;
			}
			Object.assign(context.state, updatedState);
		}

		// Determine the first visible column for checkbox handling
		const firstVisibleColumnIndex = visibleColumns[0] ? thead.indexOf(visibleColumns[0]) : 0;
		const lastVisibleColumnIndex = context.settings.selectable ? visibleColumns.length : visibleColumns.length - 1;

		// Generate HTML for table body
		const tbodyHTML = page.map((row) => {
			// Construct the composite key/s for this row
			const rowKeys = keyFields.map(field => row[field]).join(',');

			// Check if the current row is selected based on the composite key/s
			const rowSelected = selected.has(rowKeys) ? ' aria-selected' : '';

			// Build the row HTML by iterating over visible columns
			let rowHTML = Object.values(row).map((cell, index) => {
				if (thead[index].hidden) return '';
				const isEditable = thead[index].editable;

				const classList = thead[index].classList ? ` class="${thead[index].classList}"` : '';
				const formatter = context.formatters?.[thead[index].formatter] || ((value) => value);
				
				const selectable = (context.settings.selectable && index === firstVisibleColumnIndex) ? 
					`<td><label><input type="checkbox" tabindex="-1"${rowSelected ? ` checked` : ''} data-toggle-row></label></td>` : '';
				let cellValue = (cell === null || cell === 'null' || cell === undefined) ? '' : cell.toString();

				// Apply search term highlighting if applicable
				cellValue = searchterm ? cellValue.replace(new RegExp(`(${searchterm})`, 'gi'), '<mark>$1</mark>') : cellValue;

				// Pass both cell value and entire row to formatter
				return `${selectable}<td tabindex="-1"${classList}${isEditable ? ` contenteditable`:''}>${formatter(cellValue, row)}</td>`;
			}).join('');

			// Handle the expand / popover feature
			if (context.settings.expandable) {
				const expandFields = thead
					.map((header) => header.hidden ? `<p><strong>${header.label}</strong><br>${row[header.field]}</p>` : '')
					.filter(content => content !== '')
					.join('');

				if (expandFields) {
					// Generate a unique popover ID and insert the expand button
					const popoverId = `p${window.crypto.randomUUID()}`;
					const buttonHTML = ` <button type="button" tabindex="-1" popovertarget="${popoverId}">${context.renderIcon(icons.dots)}</button>`;
					const popoverHTML = `
						<div id="${popoverId}" popover class="ui-table-expand ${context.settings.expandType ? context.settings.expandType : '--inline-end'}">
							<button type="button" popovertarget="${popoverId}" popovertargetaction="hide" class="--icon">${context.renderIcon(icons.close)}</button>
							${expandFields}
						</div>
					`;
					context.wrapper.insertAdjacentHTML('beforeend', popoverHTML);

					// Insert the button into the last rendered <td> by appending to it
					const cellHTML = rowHTML.split('</td>');
					cellHTML[lastVisibleColumnIndex] = cellHTML[lastVisibleColumnIndex].replace(
						/(<td[^>]*>)(.*)/,
						`$1<span class="ui-table-expand--trigger"><span>$2</span>${buttonHTML}</span>`
					);
					rowHTML = cellHTML.join('</td>');
				}
			}

			// Return the row HTML with the composite key/s in `data-keys`
			return `<tr${rowSelected} data-keys="${rowKeys}">${rowHTML}</tr>`;
		}).join('');

		// Inject the newly generated HTML into the table body
		context.table.tBodies[0].innerHTML = tbodyHTML;

		// Log the rendering process for debugging purposes
		context.log(`render: tbody`, '#584');

		// Update the navigation UI
		updateNavigation(context);
	} catch (error) {
		context.log(`Error rendering table body (tbody): ${error}`, '#F00');
	}
}

export function renderTHead(context) {
	try {
		const { thead } = context.state;
		const { selectable } = context.settings;
		let firstVisibleColumnFound = false;

		const selectableHeader = selectable ? `<th tabindex="0"><label><input type="checkbox" tabindex="-1" data-toggle-all></label></th>` : '';

		const tableHeaderHTML = thead.reduce((html, cell) => {
			if (cell.hidden) return html;
			const tabIndex = !firstVisibleColumnFound ? 0 : -1;
			firstVisibleColumnFound = true;

			return html + `<th tabindex="${tabIndex}"${cell.key ? ` data-key` : ''} data-field="${cell.field}" data-sort-index="${thead.indexOf(cell)}"><span>${cell.label || cell}</span></th>`;
		}, `<tr>${selectableHeader}`) + '</tr>';

		context.table.tHead.innerHTML = tableHeaderHTML;

		if (selectable) {
			context.toggle = context.table.querySelector('input[data-toggle-all]');
		}

		context.log(`render: thead`, '#56F');
	} catch (error) {
		context.log(`Error rendering table header (thead): ${error}`, '#F00');
	}
}

export function updateNavigation(context, noData = false) {
	try {
		const { page, itemsPerPage, searchItems, searchPages } = context.state;
		const E = context.form.elements;

		// Check if a search is active and use search-specific values if available
		const isSearchActive = !!context.getAttribute('searchterm');
		const totalItems = noData ? 0 : (isSearchActive ? context.state.searchItems : context.state.items);
		const totalPages = noData ? 0 : (isSearchActive ? context.state.searchPages : context.state.pages);
		const isItemsPresent = !!totalItems;
		const isItemsPerPagePresent = context.hasAttribute('itemsperpage');

		// Toggle visibility based on whether items are present
		E.navigation.hidden = !isItemsPerPagePresent || !isItemsPresent;
		
		// Only show selection if both conditions are met: selectable is true AND there are items
		E.selection.hidden = !context.settings.selectable || !isItemsPresent;

		if (isItemsPresent) {
			// Update navigation elements based on current page and total items
			E.end.value = Math.min((page + 1) * itemsPerPage, totalItems);
			E.page.setAttribute('max', totalPages);
			E.page.size = (page + 1).toString().length;
			E.page.value = page + 1;
			E.pages.value = totalPages;
			E.start.value = page * itemsPerPage + 1;
			E.first.disabled = page === 0;
			E.stepdown.disabled = page === 0;
			E.stepup.disabled = page === totalPages - 1;
			E.last.disabled = page === totalPages - 1;
			E.total.value = totalItems;
		}
	} catch (error) {
		context.log(`Error updating navigation: ${error}`, '#F00', context.settings.debug);
	}
}

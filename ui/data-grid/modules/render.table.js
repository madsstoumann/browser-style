import { calculatePages, t } from './utility.js';

/**
 * Sorts the provided data array based on the sorting context.
 *
 * @param {Object} context - The context object containing state and options.
 * @param {Object} context.state - The state object containing sorting information.
 * @param {number} context.state.sortIndex - The index of the column to sort by.
 * @param {number} context.state.sortOrder - The order of sorting (1 for descending, -1 for ascending).
 * @param {Object} context.options - The options object containing locale information.
 * @param {string} context.options.locale - The locale string used for string comparison.
 * @param {Array<Object>} data - The array of data objects to be sorted.
 */
function applySorting(context, data) {
	const { sortIndex, sortOrder } = context.state;
	const { locale } = context.options;

	if (sortIndex > -1) {
		data.sort((a, b) => {
			const rowA = Object.values(a);
			const rowB = Object.values(b);
			const A = rowA[sortIndex] ?? '';
			const B = rowB[sortIndex] ?? '';
			return typeof A === 'string' ? A.localeCompare(B, locale, { sensitivity: 'variant' }) : A - B;
		});
		if (sortOrder === 1) data.reverse();
	}
}

/**
 * Filters the provided data based on the search term and method specified in the context.
 *
 * @param {Object} context - The context object containing state and attributes.
 * @param {Object} context.state - The state object containing thead information.
 * @param {Array} context.state.thead - The table header array with cell information.
 * @param {string} context.getAttribute - Function to get attributes from the context.
 * @param {Array} data - The data array to be filtered.
 * @returns {Array} - The filtered data array.
 */
function filterData(context, data) {
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

/**
 * Paginates the provided data based on the current page and items per page from the context state.
 *
 * @param {Object} context - The context object containing the state.
 * @param {Object} context.state - The state object containing pagination information.
 * @param {number} context.state.page - The current page number.
 * @param {number} context.state.itemsPerPage - The number of items per page.
 * @param {Array} data - The array of data to paginate.
 * @returns {Array} - A subset of the data array corresponding to the current page.
 */
function paginate(context, data) {
	const { page, itemsPerPage } = context.state;
	const startIndex = page * itemsPerPage;
	return data.slice(startIndex, startIndex + itemsPerPage);
}

/**
 * Renders a column group by setting its inner HTML to a specified number of <col> elements.
 *
 * @param {HTMLElement} colgroup - The column group element to render into.
 * @param {number} cols - The number of <col> elements to create and insert into the column group.
 */
export function renderColGroup(colgroup, cols) {
	try {
		colgroup.innerHTML = new Array(cols).fill('<col>').join('');
	} catch (error) {
		console.error(`Error in colGroup: ${error}`);
	}
}

/**
 * Renders the table by invoking functions to render the column group, table head, and table body.
 *
 * @param {Object} context - The context object containing necessary information for rendering.
 * @param {Object} context.log - Function to log messages.
 * @param {string} context.log.message - The message to log.
 * @param {string} context.log.color - The color code for the log message.
 * @param {boolean} context.log.debug - Flag to indicate if debugging is enabled.
 * @param {Object} context.colgroup - The column group element to be rendered.
 * @param {Object} context.state - The state object containing column information.
 * @param {Array} context.state.cols - Array of column definitions.
 * @param {Object} context.options - Options for rendering.
 * @param {boolean} context.options.debug - Flag to indicate if debugging is enabled.
 */
export function renderTable(context) {
	try {
		context.log(`render: table`, '#52B', context.options.debug);
		renderColGroup(context.colgroup, context.state.cols);
		renderTHead(context);
		renderTBody(context);
	} catch (error) {
		context.log(`Error rendering table: ${error}`, '#F00', context.options.debug);
	}
}

/**
 * Renders the table body (tbody) based on the provided context.
 *
 * @param {Object} context - The context object containing state, options, and other necessary properties.
 * @param {Object} context.state - The state object containing tbody, thead, cols, and selected properties.
 * @param {Array} context.state.tbody - The array of data rows to be rendered.
 * @param {Array} context.state.thead - The array of header cells defining the columns.
 * @param {number} context.state.cols - The number of visible columns.
 * @param {Set} context.state.selected - The set of selected row identifiers.
 * @param {Object} context.options - The options object containing configuration settings.
 * @param {boolean} context.options.selectable - Indicates if rows are selectable.
 * @param {Object} context.table - The table element where the tbody will be rendered.
 * @param {Object} context.config - The configuration object containing additional settings.
 * @param {string} context.config.expandIcon - The icon type for the expand button.
 * @param {string} context.config.expandType - The type of expand behavior.
 * @param {Object} context.wrapper - The wrapper element for the table.
 * @param {Object} context.formatters - The object containing formatter functions for cell values.
 * @param {Function} context.log - The logging function for debugging purposes.
 * @param {string} context.lang - The language code for localization.
 * @param {Object} context.i18n - The internationalization object for translations.
 * @param {Function} context.getAttribute - Function to get attributes from the context.
 * @param {boolean} context.options.debug - Indicates if debug mode is enabled.
 *
 * @throws Will throw an error if rendering the table body fails.
 */
export function renderTBody(context) {
	try {
		const { tbody, thead, cols, selected } = context.state;
		if (!tbody.length) return;

		// Remove existing popovers
		context.querySelectorAll('[popover]').forEach(popover => popover.remove());

		// Filter for visible columns
		const visibleColumns = thead.filter(cell => !cell.hidden);
		context.state.cols = visibleColumns.length + (context.options.selectable ? 1 : 0);

		// Filter and sort the data
		let data = filterData(context, [...tbody]);
		applySorting(context, data);

		// If no data is found, show "no result" message
		if (!data.length) {
			context.table.tBodies[0].innerHTML = `<tr><td colspan="${cols}">${t('noResult', context.lang, context.i18n)}</td></tr>`;
			Object.assign(context.state, { pageItems: 0, items: 0, pages: 0 });
			updateNavigation(context);
			return;
		}

		// Use the paginate function to slice the data for the current page
		const page = paginate(context, data);

		// Initialize page-related state if necessary
		Object.assign(context.state, {
			pageItems: page.length,
			items: data.length,
			pages: calculatePages(data.length, context.state.itemsPerPage),
		});

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

			// Handle the expand / popover feature
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
		context.log(`render: tbody`, '#584');
		if (context.options.debug) console.log(context.state);

		// Update the navigation UI
		updateNavigation(context);
	} catch (error) {
		context.log(`Error rendering table body (tbody): ${error}`, '#F00');
	}
}

/**
 * Renders the table header (thead) for a data grid.
 *
 * @param {Object} context - The context object containing state and options.
 * @param {Object} context.state - The state object containing thead information.
 * @param {Array} context.state.thead - Array of header cell objects.
 * @param {Object} context.options - The options object containing configuration.
 * @param {boolean} context.options.selectable - Flag indicating if rows are selectable.
 * @param {Object} context.table - The table DOM element.
 * @param {HTMLElement} context.table.tHead - The table header DOM element.
 * @param {Function} context.log - Function to log messages.
 */
export function renderTHead(context) {
	try {
		const { thead } = context.state;
		const { selectable } = context.options;
		let firstVisibleColumnFound = false;

		const selectableHeader = selectable ? `<th tabindex="0"><label><input type="checkbox" tabindex="-1" data-toggle-all></label></th>` : '';

		const tableHeaderHTML = thead.reduce((html, cell) => {
			if (cell.hidden) return html;
			const tabIndex = !firstVisibleColumnFound ? 0 : -1;
			firstVisibleColumnFound = true;

			return html + `<th tabindex="${tabIndex}"${cell.uid ? ` data-uid` : ''} data-field="${cell.field}" data-sort-index="${thead.indexOf(cell)}"><span>${cell.label || cell}</span></th>`;
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

/**
 * Updates the navigation elements of the data grid based on the current state.
 *
 * @param {Object} context - The context object containing state and form elements.
 * @param {Object} context.state - The current state of the data grid.
 * @param {number} context.state.page - The current page number.
 * @param {number} context.state.pages - The total number of pages.
 * @param {number} context.state.items - The total number of items.
 * @param {number} context.state.itemsPerPage - The number of items per page.
 * @param {Object} context.form - The form containing the navigation elements.
 * @param {Object} context.form.elements - The elements of the form.
 * @param {Object} context.options - The options for the data grid.
 * @param {boolean} context.options.selectable - Whether the data grid is selectable.
 * @param {boolean} context.options.debug - Whether debug mode is enabled.
 * @param {Function} context.log - The logging function.
 */
export function updateNavigation(context) {
	try {
		const { page, pages, items, itemsPerPage } = context.state;
		const E = context.form.elements;

		const isItemsPresent = !!items;
		const isItemsPerPagePresent = context.hasAttribute('itemsperpage');
		const isSelectable = context.options.selectable;

		E.actions.hidden = !isItemsPresent;
		E.navigation.hidden = !isItemsPerPagePresent || !isItemsPresent;
		E.selection.hidden = !isSelectable;

		if (isItemsPresent) {
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
		}
	} catch (error) {
		context.log(`Error updating navigation: ${error}`, '#F00', context.options.debug);
	}
}

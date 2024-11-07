import { calculatePages, camelCase, capitalize, consoleLog } from './utility.js';

/**
 * Extracts data from an HTML table element and returns it in a structured format.
 *
 * @param {HTMLTableElement} table - The HTML table element to extract data from.
 * @param {number} [itemsPerPage=5] - The number of items per page for pagination.
 * @param {number} [selectable=0] - Indicates if the table rows are selectable (1 for true, 0 for false).
 * @returns {Object} An object containing the extracted table data.
 * @returns {number} return.cols - The number of columns in the table, adjusted for hidden columns and selectable rows.
 * @returns {number} return.items - The total number of items (rows) in the table body.
 * @returns {number} return.pages - The total number of pages based on items per page.
 * @returns {Array} return.tbody - The extracted table body data.
 * @returns {Array} return.thead - The extracted table head data.
 */
export function dataFromTable(table, itemsPerPage = 5, selectable = 0) {
	try {
		const { thead, hiddenCount } = getTableHead(table);
		const tbody = getTableBody(table, thead);
		return {
			cols: (thead.length - hiddenCount) + (selectable ? 1 : 0),
			items: tbody.length,
			pages: calculatePages(tbody.length, itemsPerPage),
			tbody,
			thead
		};
	} catch (error) {
		consoleLog(`Error extracting data from table: ${error}`, '#F00');
		return {};
	}
}

/**
 * Downloads a file with the given content and filename.
 *
 * @param {string} content - The content to be included in the file.
 * @param {string} filename - The name of the file to be downloaded.
 * @param {string} [mimeType='text/csv;charset=utf-8;'] - The MIME type of the file.
 */
export function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
	try {
		const blob = new Blob([content], { type: mimeType });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = filename;
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	} catch (error) {
		consoleLog(`Error creating downloadable file: ${error}`, '#F00');
	}
}

/**
 * Exports the given state data to a CSV format string.
 *
 * @param {Object} state - The state object containing table data.
 * @param {Array} state.thead - Array of header cell objects.
 * @param {string} state.thead[].label - The label of the header cell.
 * @param {string} state.thead[].field - The field name corresponding to the header cell.
 * @param {Array} state.tbody - Array of row objects.
 * @returns {string} The CSV formatted string.
 */
export function exportCSV(state) {
	try {
		const headers = state.thead.map(cell => cell.label).join(',');
		const rows = state.tbody.map(row => 
			state.thead.map(cell => `"${(row[cell.field] || '').replace(/"/g, '""')}"`).join(',')
		);
		return `${headers}\r\n${rows.join('\r\n')}`;
	} catch (error) {
		consoleLog(`Error exporting CSV: ${error}`, '#F00');
		return '';
	}
}

/**
 * Generates a table header (thead) configuration from the first row of a table body (tbody).
 *
 * @param {Array<Object>} tbody - The table body data, where each object represents a row.
 * @returns {Array<Object>} An array of objects representing the table header configuration.
 */
function generateTheadFromTbody(tbody) {
	return Object.keys(tbody[0] || {}).map(key => ({
		field: key,
		label: capitalize(key),
		hidden: false
	}));
}

/**
 * Extracts and returns the data from the table body as an array of objects.
 *
 * @param {HTMLTableElement} table - The table element from which to extract the data.
 * @param {Array} thead - An array representing the table header, where each element contains a `field` property.
 * @returns {Array<Object>} An array of objects representing the table body data, where each object corresponds to a row and each property corresponds to a cell's text content.
 */
function getTableBody(table, thead) {
	return Array.from(table.tBodies[0].rows, row => {
		return Array.from(row.cells).reduce((rowData, cell, index) => {
			const field = thead[index].field;
			rowData[field] = cell.textContent;
			return rowData;
		}, {});
	});
}

/**
 * Extracts and processes the header cells of a given table element.
 *
 * @param {HTMLTableElement} table - The table element from which to extract the header cells.
 * @returns {Object} An object containing:
 * - `thead` {Array<Object>} - An array of objects representing each header cell, with properties:
 * - `field` {string} - The camelCase version of the cell's text content.
 * - `hidden` {boolean} - Whether the cell is hidden.
 * - `label` {string} - The text content of the cell.
 * - `uid` {boolean} - Whether the cell has a `data-uid` attribute.
 * - `hiddenCount` {number} - The number of hidden header cells.
 */
function getTableHead(table) {
	const thead = [];
	let hiddenCount = 0;

	for (const cell of table.tHead.rows[0].cells) {
		const isHidden = cell.hasAttribute('hidden');
		if (isHidden) hiddenCount++;

		thead.push({
			field: camelCase(cell.textContent),
			hidden: isHidden,
			label: cell.textContent,
			uid: cell.hasAttribute('data-uid')
		});
	}

	return { thead, hiddenCount };
}

/**
 * Handles the sorting logic for a data grid.
 *
 * @param {HTMLElement} context - The HTML element that contains the sorting attributes.
 * @param {number} index - The index of the column to sort.
 */
export function handleSorting(context, index) {
	const currentSortIndex = parseInt(context.getAttribute('sortindex'), 10);
	const currentSortOrder = parseInt(context.getAttribute('sortorder'), 10);

	if (index !== undefined) {
		if (currentSortIndex === parseInt(index, 10)) {
			context.setAttribute('sortorder', currentSortOrder === 0 ? 1 : 0);
			if (currentSortOrder === 1) context.removeAttribute('sortindex');
		} else {
			context.setAttribute('sortindex', parseInt(index, 10));
			context.setAttribute('sortorder', 0);
		}
	}
}

/**
 * Parses the provided data and updates the context's table structure.
 * If thead or tbody are not provided, they will be generated based on the data.
 * Thead can also be merged with a provided config.
 *
 * @param {Object|Array} data - The data to be parsed, which can either be an object containing thead and tbody, or just an array representing tbody.
 * @param {Object} context - The context object containing state, settings, and config.
 * @param {Object} context.config - Configuration object that can provide additional thead information.
 * @param {Array} context.config.thead - Array of column definitions from the config.
 * @param {Object} context.settings - Settings object, including table settings like 'selectable'.
 * @param {boolean} context.settings.selectable - Whether the table allows row selection.
 * @param {Object} context.state - State object that contains table information.
 * @param {number} context.state.itemsPerPage - Number of items displayed per page.
 * @param {Function} context.log - Function to log messages for debugging.
 *
 * @returns {Object} An object containing the parsed table structure with the following properties:
 * - cols: The number of visible columns (accounting for hidden columns and selectable rows).
 * - items: The number of items in tbody.
 * - pages: The total number of pages calculated based on the number of items and items per page.
 * - tbody: The parsed tbody array (the rows of the table).
 * - thead: The parsed or generated thead array (the headers of the table).
 *
 * @throws Will throw an error if parsing the data fails.
 */
export function parseData(data, context) {
	try {
		let { thead = [], tbody = [] } = data;
		const externalNavigation = context.settings.externalNavigation;

		// If no thead is provided but data is an array (assume tbody items)
		if (!thead.length && tbody.length) {
			thead = generateTheadFromTbody(tbody);
		}

		// If no tbody is provided, assume data itself is tbody
		if (!tbody.length && Array.isArray(data)) {
			tbody = data;
			thead = thead = generateTheadFromTbody(tbody);
		}

		// Check for a settings object and merge thead from settings if it exists
		if (context.settings?.thead) {
			thead = thead.map((col) => {
				const configCol = context.settings.thead.find((c) => c.field === col.field);
				return configCol ? { ...col, ...configCol } : col;
			});
		}

		// Calculate hidden columns count
		const hiddenCount = thead.filter(cell => cell.hidden).length;

		return {
			cols: (thead.length - hiddenCount) + (context.settings.selectable ? 1 : 0),
			items: externalNavigation ? context.state.items : tbody.length,
			pages: externalNavigation ? context.state.pages : calculatePages(tbody.length, context.state.itemsPerPage),
			tbody,
			thead
		};
	} catch (error) {
		context.log(`Error parsing data: ${error}`, '#F00', context.settings.debug);
		throw error;
	}
}

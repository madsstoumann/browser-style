import { calculatePages, camelCase, capitalize, consoleLog } from './utility.js';

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

export function exportCSV(state) {
	try {
		const headers = state.thead.map(cell => cell.label).join(',');
		const rows = state.tbody.map(row => 
			state.thead.map(cell => {
				const value = row[cell.field] ?? '';
				return `"${String(value).replace(/"/g, '""')}"`;
			}).join(',')
		);
		return `${headers}\r\n${rows.join('\r\n')}`;
	} catch (error) {
		consoleLog(`Error exporting CSV: ${error}`, '#F00');
		return '';
	}
}

function generateTheadFromTbody(tbody) {
	return Object.keys(tbody[0] || {}).map(key => ({
		field: key,
		label: capitalize(key),
		hidden: false
	}));
}

function getTableBody(table, thead) {
	return Array.from(table.tBodies[0].rows, row => {
		return Array.from(row.cells).reduce((rowData, cell, index) => {
			const field = thead[index].field;
			rowData[field] = cell.textContent;
			return rowData;
		}, {});
	});
}

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
 * Reorders columns based on displayOrder setting
 */
function reorderColumns(thead, tbody, displayOrder) {
		if (!displayOrder?.length) return { thead, tbody };

		// Create map of field positions in displayOrder
		const orderMap = displayOrder.reduce((acc, field, idx) => {
				acc[field] = idx;
				return acc;
		}, {});

		// Reorder thead
		const reorderedThead = [...thead].sort((a, b) => {
				const aOrder = orderMap[a.field] ?? Number.MAX_SAFE_INTEGER;
				const bOrder = orderMap[b.field] ?? Number.MAX_SAFE_INTEGER;
				return aOrder - bOrder;
		});

		// Create field mapping for tbody reordering
		const fieldMapping = thead.map(col => col.field);
		const newFieldMapping = reorderedThead.map(col => col.field);

		// Reorder tbody by creating new objects with reordered properties
		const reorderedTbody = tbody.map(row => {
				const newRow = {};
				newFieldMapping.forEach((field, idx) => {
						newRow[field] = row[fieldMapping[fieldMapping.indexOf(field)]];
				});
				return newRow;
		});

		return { thead: reorderedThead, tbody: reorderedTbody };
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
			thead = generateTheadFromTbody(tbody);
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

		// Apply column reordering if displayOrder is set
		if (context.settings?.displayOrder) {
			const { thead: reorderedThead, tbody: reorderedTbody } = reorderColumns(thead, tbody, context.settings.displayOrder);
			thead = reorderedThead;
			tbody = reorderedTbody;
		}

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

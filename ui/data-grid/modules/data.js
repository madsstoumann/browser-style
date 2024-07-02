import { camelCase, consoleLog } from './utils.js';

/**
 * Calculates the number of pages based on the total number of items and the number of items per page.
 *
 * @param {number} items - The total number of items.
 * @param {number} itemsPerPage - The number of items to display per page.
 * @returns {number} - The number of pages.
 * @throws {Error} - If the value of itemsPerPage is less than or equal to 0.
 */
export function calculatePages(items, itemsPerPage) {
	if (itemsPerPage <= 0) {
		throw new Error('Invalid value: items per page should be greater than 0');
	}
	return Math.ceil(items / itemsPerPage);
}

/**
 * Extracts data from an HTML table and returns an object containing the extracted data.
 * @param {HTMLTableElement} table - The HTML table element from which to extract data.
 * @param {Object} context - The context object containing options and state information.
 * @returns {Object} - An object containing the extracted data.
 */
export function dataFromTable(table, itemsPerPage = 5, selectable = 0) {
	try {
		let hidden = 0;
		const thead = [...table.tHead.rows[0].cells].map(cell => {
			if (cell.hasAttribute('hidden')) hidden++;
			return {
				field: camelCase(cell.textContent),
				hidden: cell.hasAttribute('hidden'),
				label: cell.textContent,
				uid: cell.hasAttribute('data-uid')
			};
		});

		const tbody = [...table.tBodies[0].rows].map(row => {
			const obj = {};
			[...row.cells].forEach((cell, index) => {
				const field = thead[index].field;
				obj[field] = cell.textContent;
			});
			return obj;
		});

		return {
			cols: (thead.length - hidden) + (selectable ? 1 : 0),
			pages: Math.floor(tbody.length / itemsPerPage),
			rows: tbody.length,
			tbody,
			thead
		};
	} catch (error) {
		consoleLog(`Error extracting data from table: ${error}`, '#F00');
		return {}; // Return an empty object in case of an error
	}
}

/**
 * Downloads a file with the given content, filename, and MIME type.
 *
 * @param {string} content - The content of the file to be downloaded.
 * @param {string} filename - The name of the file to be downloaded.
 * @param {string} [mimeType='text/csv;charset=utf-8;'] - The MIME type of the file.
 */
export function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
	try {
		const blob = new Blob([content], { type: mimeType });
		const link = document.createElement('a');
		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	} catch (error) {
		consoleLog(`Error creating downloadable file: ${error}`, '#F00', this.options.debug);
	}
}

/**
 * Exports the data from the state object as a CSV string.
 *
 * @param {object} state - The state object containing the data to export.
 * @returns {string} - The CSV string representing the exported data.
 */
export function exportCSV(state) {
 try {
	 const headers = state.thead.map(cell => cell.label).join(',');
	 const rows = state.tbody.map(row => Object.values(row).join(','));
	 return `${headers}\r\n${rows.join('\r\n')}`;
 } catch (error) {
	 consoleLog(`Error exporting CSV: ${error}`, '#F00');
	 return ''; // Return empty string in case of an error
 }
}

/**
 * Fetches data from a given source and parses it.
 * If the input string is valid JSON, it is parsed directly.
 * Otherwise, it is treated as a URL and fetched from the server.
 * @param {string} str - The input string or URL to fetch data from.
 * @param {any} context - The context object to be passed to the parseData function.
 * @returns {Promise<any>} - A promise that resolves to the parsed data.
 */
export async function fetchData(str, context) {
	let data;
	try {
		data = JSON.parse(str);
	} catch (error) {
		const response = await fetch(str);
		data = await response.json();
	}
	return parseData(data, context);
}

/**
 * Parses the data object and returns an object with information about the data.
 *
 * @param {Object} data - The data object to parse.
 * @param {Object} context - The context object containing options and state.
 * @returns {Object} - An object containing information about the parsed data.
 * @throws {Error} - If the data object is missing table headers or body.
 */
export function parseData(data, context) {
	try {
		if (!data.thead || !data.tbody) {
			throw new Error('Invalid JSON format: Missing table headers or body');
		}

		let hidden = 0;
		data.thead.forEach((cell) => {
			if (cell.hidden) hidden++;
		});

		return {
			cols: (data.thead.length - hidden) + (context.options.selectable ? 1 : 0),
			pages: calculatePages(data.tbody.length, context.state.itemsPerPage),
			rows: data.tbody.length,
			tbody: data.tbody,
			thead: data.thead
		};
	} catch (error) {
		consoleLog(`Error parsing data: ${error}`, '#F00', context.options.debug);
		throw error;
	}
}
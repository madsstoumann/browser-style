import { camelCase, consoleLog } from './utils.js';

export function calculatePages(items, itemsPerPage) {
	if (itemsPerPage <= 0) {
		throw new Error('Invalid value: items per page should be greater than 0');
	}
	return Math.ceil(items / itemsPerPage);
}

export function dataFromTable(table, itemsPerPage = 5, selectable = 0) {
	try {
		const { thead, hiddenCount } = getTableHead(table);
		const tbody = getTableBody(table, thead);
		return {
			cols: (thead.length - hiddenCount) + (selectable ? 1 : 0),
			pages: calculatePages(tbody.length, itemsPerPage),
			rows: tbody.length,
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
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		link.style.visibility = 'hidden';
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
		const rows = state.tbody.map(row => Object.values(row).join(','));
		return `${headers}\r\n${rows.join('\r\n')}`;
	} catch (error) {
		consoleLog(`Error exporting CSV: ${error}`, '#F00');
		return '';
	}
}

export async function fetchData(str, context) {
	try {
		let data = JSON.parse(str);
		return parseData(data, context);
	} catch (jsonError) {
		try {
			const response = await fetch(str);
			const data = await response.json();
			return parseData(data, context);
		} catch (fetchError) {
			consoleLog(`Error fetching data: ${fetchError}`, '#F00');
			throw fetchError;
		}
	}
}

function getTableBody(table, thead) {
	return [...table.tBodies[0].rows].map(row => {
		const rowData = {};
		[...row.cells].forEach((cell, index) => {
			const field = thead[index].field;
			rowData[field] = cell.textContent;
		});
		return rowData;
	});
}

function getTableHead(table) {
	let hiddenCount = 0;
	const thead = [...table.tHead.rows[0].cells].map(cell => {
		const isHidden = cell.hasAttribute('hidden');
		if (isHidden) hiddenCount++;
		return {
			field: camelCase(cell.textContent),
			hidden: isHidden,
			label: cell.textContent,
			uid: cell.hasAttribute('data-uid')
		};
	});
	return { thead, hiddenCount };
}

export function parseData(data, context) {
	try {
		if (!data.thead || !data.tbody) {
			throw new Error('Invalid JSON format: Missing table headers or body');
		}

		const hiddenCount = data.thead.filter(cell => cell.hidden).length;

		return {
			cols: (data.thead.length - hiddenCount) + (context.options.selectable ? 1 : 0),
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

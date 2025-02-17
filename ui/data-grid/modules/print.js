import PrintPreview from '../../print-preview/index.js';
import { filterData } from './render.table.js';

export function setupPrint(context) {
	try {
		let printPreview = document.querySelector('print-preview');
		if (!printPreview) {
			printPreview = document.createElement('print-preview');
			if (!(printPreview instanceof HTMLElement)) {
				throw new Error('PrintPreview component failed to initialize');
			}
			document.body.appendChild(printPreview);
		}
		context.printPreview = printPreview;

		// Generate unique template name for this grid instance
		if (!context.templateId) {
			context.templateId = `data-grid-${crypto.randomUUID()}`;
		}

		const template = (data) => {
			// Validate input data
			if (!Array.isArray(data)) {
				throw new Error('Print data must be an array');
			}
			if (!context.state?.thead) {
				throw new Error('Table headers not initialized');
			}

			const visibleColumns = context.state.thead.filter(col => !col.hidden);
			return `
				<style>
					table { width: 100%; border-collapse: separate; border-spacing: 2ch 0; }
					th { text-align: start; }
				</style>
				<paper-sheet>
					<table part="table">
						<thead>
							<tr>${visibleColumns.map(col => `<th>${col.label}</th>`).join('')}</tr>
						</thead>
						<tbody part="tbody">
							${data.map(row => `
								<tr>
									${visibleColumns.map(col => {
										return `<td>${row[col.field] || ''}</td>`;
									}).join('')}
								</tr>
							`).join('')}
						</tbody>
					</table>
				</paper-sheet>
			`;
		};

		printPreview.addTemplate(context.templateId, template, {
			'font-family': 'ff-system',
			'font-size': 'small',
			'margin-top': '15mm',
			'margin-right': '10mm',
			'margin-bottom': '15mm',
			'margin-left': '10mm',
			'orientation': 'portrait',
			'paper-size': 'A4'
		});
	} catch (error) {
		context.log(`Error setting up print: ${error}`, '#F00');
		throw error;
	}
}

export function printTable(context, directPrint = false) {
	try {
		if (!context.state?.tbody?.length) {
			context.log('No data to print', '#F00');
			return;
		}

		if (!context.printPreview) {
			setupPrint(context);
		}

		let dataToPrint = [];
		const { printOptions, tbody, page, itemsPerPage, selected } = context.state;

		switch (printOptions) {
			case 'search':
				dataToPrint = filterData(context, [...tbody]);
				if (!dataToPrint.length) {
					throw new Error('No search results to print');
				}
				break;
			case 'page':
				const startIndex = page * itemsPerPage;
				dataToPrint = tbody.slice(startIndex, startIndex + itemsPerPage);
				if (!dataToPrint.length) {
					throw new Error('No data on current page');
				}
				break;
			case 'selected':
				if (!selected?.size) {
					throw new Error('No rows selected');
				}
				const keyFields = context.state.thead.filter(col => col.key).map(col => col.field);
				dataToPrint = tbody.filter(row => {
					const compositeKey = keyFields.map(field => row[field]).join(',');
					return selected.has(compositeKey);
				});
				break;
			case 'all':
			default:
				dataToPrint = tbody;
		}

		if (!dataToPrint.length) {
			throw new Error('No data to print');
		}

		context.printPreview.setAttribute('template', context.templateId);
		context.printPreview.setAttribute('use-template', '');
		context.printPreview.data = dataToPrint;
		
		if (directPrint) {
			context.printPreview.print();
		} else {
			context.printPreview.preview();
		}
	} catch (error) {
		context.log(`Print error: ${error.message}`, '#F00');
		// Optionally dispatch an event that can be handled by the application
		context.dispatchEvent(new CustomEvent('dg:printerror', { 
			detail: { error: error.message, printOptions: context.state.printOptions } 
		}));
	}
}

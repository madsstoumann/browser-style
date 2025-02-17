import PrintPreview from '../../print-preview/index.js';
import { filterData } from './render.table.js';

export function setupPrint(context) {
	let printPreview = document.querySelector('print-preview');
	if (!printPreview) {
		printPreview = document.createElement('print-preview');
		document.body.appendChild(printPreview);
	}
	context.printPreview = printPreview;

	// Generate unique template name for this grid instance
	if (!context.templateId) {
		context.templateId = `data-grid-${crypto.randomUUID()}`;
	}

	const template = (data) => {
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
}

export function printTable(context, directPrint = false) {
	if (!context.printPreview) {
		setupPrint(context);
	}

	let dataToPrint = [];
	const { printOptions, tbody, page, itemsPerPage, selected } = context.state;

	switch (printOptions) {
		case 'search':
			dataToPrint = filterData(context, [...tbody]);
			break;
		case 'page':
			const startIndex = page * itemsPerPage;
			dataToPrint = tbody.slice(startIndex, startIndex + itemsPerPage);
			break;
		case 'selected':
			if (selected.size > 0) {
				const keyFields = context.state.thead.filter(col => col.key).map(col => col.field);
				dataToPrint = tbody.filter(row => {
					const compositeKey = keyFields.map(field => row[field]).join(',');
					return selected.has(compositeKey);
				});
			}
			break;
		case 'all':
		default:
			dataToPrint = tbody;
	}

	context.printPreview.setAttribute('template', context.templateId);
	context.printPreview.setAttribute('use-template', '');
	context.printPreview.data = dataToPrint;
	
	if (directPrint) {
		context.printPreview.print();
	} else {
		context.printPreview.preview();
	}
}

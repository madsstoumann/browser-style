import PrintPreview from '../../print-preview/index.js';

export function setupPrint(context) {
	// Either find existing print-preview or create new one
	let printPreview = document.querySelector('print-preview');
	if (!printPreview) {
		printPreview = document.createElement('print-preview');
		document.body.appendChild(printPreview);
	}
	context.printPreview = printPreview;

	const template = (data) => {
		const visibleColumns = context.state.thead.filter(col => !col.hidden);
		return `
			<style>
				table { width: 100%; border-collapse: collapse; }
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

	// Add template to print-preview with some default settings
	printPreview.addTemplate('data-grid', template, {
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

/**
 * Prints the current table using the PrintPreview component.
 * @param {boolean} [directPrint=false] - If true, prints directly without preview
 */
export function printTable(context, directPrint = false) {
	if (!context.printPreview) {
		setupPrint(context);
	}
	
	context.printPreview.setAttribute('template', 'data-grid');
	context.printPreview.setAttribute('use-template', '');
	context.printPreview.data = context.state.tbody;
	
	if (directPrint) {
		context.printPreview.print();
	} else {
		context.printPreview.preview();
	}
}

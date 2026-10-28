/**
 * A spreadsheet widget for <form-flow>: ui.widget "data-grid" on a repeating group (type list), drawn with
 * <data-grid> (ui/data/grid) with editable cells. Each row is an object of the group's item fields. Docs: readme.md
 */
const COMPONENT = new URL('../../data/grid/index.js', import.meta.url).href;
const SHEETS = ['../../table/index.css', '../../data/grid/index.css'].map(path => new URL(path, import.meta.url).href);

/* <data-grid> is light DOM: its sheets go where the form is (the page, or the shadow root of an embed). */
function addSheets(flow) {
	const root = flow.getRootNode();
	const target = root === document ? document.head : root;
	SHEETS.forEach(href => {
		if (!target.querySelector(`link[href="${href}"]`)) target.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
	});
}

/* The grid writes cells as HTML; everything typed is escaped first. */
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

const itemsOf = property => Object.entries(property.items?.properties ?? {});

function convert(item, text) {
	const raw = String(text ?? '').trim();
	if (raw === '') return undefined;
	if (item?.type === 'number' || item?.type === 'integer') return Number.isFinite(Number(raw.replace(',', '.'))) ? Number(raw.replace(',', '.')) : raw;
	if (item?.type === 'boolean') return ['true', 'yes', 'ja', '1', 'x'].includes(raw.toLowerCase());
	if (item?.type === 'select') return item.options?.choices?.find(choice => String(choice.value) === raw || choice.label === raw)?.value ?? raw;
	return raw;
}

const display = (item, value) => item?.type === 'select' ? (item.options?.choices?.find(choice => choice.value === value)?.label ?? value) : value;

/* The grid finds a row by its key column: a running row number, shown first like a spreadsheet's. */
const KEY = '_row';
let counter = 0;
const blankRow = property => ({ [KEY]: ++counter, ...Object.fromEntries(itemsOf(property).map(([key]) => [key, ''])) });

function fill(grid, property, rows) {
	const items = itemsOf(property);
	grid.formatters = { text: escape };
	grid.data = {
		thead: [{ field: KEY, label: '#', key: true, type: 'number' }, ...items.map(([key, item]) => ({ field: key, label: item.title ?? key, editable: true, formatter: 'text' }))],
		tbody: rows.length ? rows.map(row => ({ [KEY]: ++counter, ...Object.fromEntries(items.map(([key, item]) => [key, display(item, row[key]) ?? ''])) })) : [blankRow(property)]
	};
}

const ready = grid => new Promise(resolve => {
	if (grid.dataInitialized !== undefined && grid.form) resolve(grid);
	else grid.addEventListener('dg:loaded', () => resolve(grid), { once: true });
});

export const widgets = {
	'data-grid': {
		group: true,
		load: flow => {
			addSheets(flow);
			return import(COMPONENT);
		},
		render({ property, value, flow }) {
			const wrapper = document.createElement('div');
			const grid = document.createElement('data-grid');
			['nonav', 'nopage', 'norows', 'nosearch', 'nosortable'].forEach(name => grid.setAttribute(name, ''));
			grid.setAttribute('itemsperpage', '100');
			const changed = () => wrapper.dispatchEvent(new Event('input', { bubbles: true }));
			grid.addEventListener('dg:cellchange', changed);
			const add = document.createElement('button');
			add.type = 'button';
			add.textContent = flow.getAttribute('label-add-row') ?? flow.locale?.labels?.['add-row'] ?? '+ Add row';
			add.addEventListener('click', () => {
				grid.dispatchEvent(new CustomEvent('dg:append', { detail: [blankRow(property)] }));
				changed();
			});
			wrapper.append(grid, add);
			ready(grid).then(() => fill(grid, property, Array.isArray(value) ? value : []));
			return wrapper;
		},
		read(wrapper, property) {
			const grid = wrapper?.querySelector('data-grid');
			const items = Object.fromEntries(itemsOf(property));
			const rows = (grid?.state?.tbody ?? []).map(row => Object.fromEntries(Object.entries(items)
				.map(([key, item]) => [key, convert(item, row[key])])
				.filter(([, value]) => value !== undefined)))
				.filter(row => Object.keys(row).length);
			return rows.length ? rows : undefined;
		},
		write(wrapper, value, property) {
			const grid = wrapper?.querySelector('data-grid');
			if (grid) ready(grid).then(() => fill(grid, property, Array.isArray(value) ? value : []));
		}
	}
};

export default widgets;

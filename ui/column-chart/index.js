const styles = `
	:host {
		background: var(--column-chart-bg, #EEE0);
		border-radius: var(--column-chart-bdrs, 0.5rem);
		container-type: inline-size;
		display: grid;
		font-family: var(--column-chart-ff, ui-sans-serif, system-ui);
		padding: var(--column-chart-p, 0);
		row-gap: var(--column-chart-rowgap, 0.5rem);
	}
	:host::part(chart) {
		all: unset;
		column-gap: var(--column-chart-colgap, 0.25rem);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(var(--column-chart-item-miw, 2.5cqi), 1fr));
		height: var(--column-chart-h, 250px);
		row-gap: var(--column-chart-rowgap, 1rem);
		width: 100%;
	}
	:host::part(column) {
		background: var(--_bg, #007bff);
		border-radius: var(--column-chart-item-bdrs, max(2px, .66cqi));
		color: var(--_c, inherit);
		position: relative;
	}
	[part="column"]::before {
		content: attr(value);
		inset-block: var(--column-chart-item-ib, 1ex auto);
		inset-inline: 0;
		position: absolute;
	}
	:host::part(item) {
		align-content: end;
		display: grid;
		font-size: var(--column-chart-item-fs, 1.125cqi);
		gap: var(--column-chart-item-gap, 0.66em);
		grid-template-rows: var(--_p) auto;
		text-align: center;
	}
	:host::part(label) {
		text-box: cap alphabetic;
	}
	:host::part(title) {
		font-size: var(--column-chart-title-fs, 1.5rem);
		font-weight: var(--column-chart-title-fw, 300);
		margin: 0;
		text-box: text;
	}
	
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class ColumnChart extends HTMLElement {
	#dataset; #root;

	constructor() { super(); }

	static get observedAttributes() { return ['data']; }

	get dataset() { return this.#dataset; }
	get settings() { return this.#dataset?.settings; }
	get data() { return this.#dataset?.data; }

	set dataset(newData) {
		this.#dataset = newData;
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'data' && oldValue !== newValue) this.load(newValue);
	}

	connectedCallback() {
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [sheet];
		if (!this.hasAttribute('data')) this.render();
	}

	async load(source) {
		try {
			const trimmed = source.trim();
			this.#dataset =
				(['{', '['].includes(trimmed[0]) && ['}', ']'].includes(trimmed.at(-1)))
					? JSON.parse(trimmed)
					: await (await fetch(trimmed)).json();
		} catch {
			this.#dataset = null;
		} finally {
			this.render();
		}
	}

	render() {
		if (!this.data) {
			this.#root.innerHTML = `No data available`;
			return;
		}
		const min = this.settings?.min ?? 0;
		const max = this.settings?.max ?? 100;
		this.#root.innerHTML = `
		${this.settings?.title ? `<h2 part="title">${this.settings.title}</h2>` : ''}
		<ul part="chart"${this.settings.styles ? ` style="${this.settings.styles}"` : ''}>
			${this.data.map((item) => {
				const percent = ((item.value - min) / (max - min)) * 100;
				return `
				<li part="item" style="--_p: ${percent}%;${item.styles ? item.styles : ''}">
					<output part="column" value="${item.value}"></output>
					<span part="label">${item.label||'&nbsp;'}</span>
				</li>`;
			}).join('')}
		</ul>`;
	}
}

customElements.define('column-chart', ColumnChart);

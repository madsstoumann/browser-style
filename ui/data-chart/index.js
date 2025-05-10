const styles = `
:host {
	--data-chart-bar-bdrs: clamp(0.125rem, -0.35rem + 1cqi, 0.33rem);
	--data-chart-bar-c: currentColor;
	--data-chart-bdw: 1px;
	--data-chart-bds: solid;
	--data-chart-bdc: light-dark(#CCC, #666);
	--data-chart-nolabel-bdw: 1px;
	--data-chart-nolabel-bds: solid;
	--data-chart-nolabel-bdc: light-dark(#EBEBEB, #444);

	--data-chart-caption-h: 1.5rem;
	--data-chart-label-h: 20px;
	--data-chart-mih: 275px;
	--data-chart-y-axis-w: 1.5rem;

	--_min: attr(min type(<number>), 0);
	--_max: attr(max type(<number>), 100);
	--_sm: attr(small type(<number>), 0);
	--_md: attr(medium type(<number>), 0);

	--c1: hsla(210, 60%, 60%, .75);
	--c2: hsla(170, 45%, 55%, .75);
	--c3: hsla(100, 40%, 55%, .75);
	--c4: hsla(60, 40%, 60%, .75);
	--c5: hsla(35, 50%, 65%, .75);
	--c6: hsla(15, 55%, 60%, .75);
	--c7: hsla(350, 50%, 60%, .75);
	--c8: hsla(280, 40%, 60%, .75);
	--c9: hsla(240, 45%, 55%, .75);
	--c10: hsla(200, 30%, 65%, .75);

	background: var(--data-chart-bg, #FFF0);
	border-radius: var(--data-chart-bdrs, .5rem);
	box-sizing: border-box;
	container-type: inline-size;
	display: block;
	font-family: var(--data-chart-ff, ui-sans-serif, system-ui);
	padding: var(--data-chart-p, 0);
}

:host * {
	box-sizing: border-box;
}

caption {
	display: none;
	font-size: var(--data-chart-caption-fs, 11px);
	font-weight: var(--data-chart-caption-fw, 500);
	grid-area: 1 / 1 / 2 / 2;
	text-wrap: nowrap;
}

table {
	display: grid;
	grid-template-rows: var(--_gtr, var(--data-chart-caption-h) 1fr);
	min-height: var(--data-chart-mih);
}

tbody {
	container-type: size;
	display: grid;
	gap: var(--data-chart-bar-gap, .25rem);
	grid-area: 2 / 1 / 4 / 2;
	grid-template-columns: repeat(auto-fit, minmax(var(--data-chart-bar-miw, 1.25cqi), 1fr));

	td {
		--_v: attr(data-v type(<number>), 0);
		--_pv: attr(data-pv type(<number>), var(--_v));
		--_y: calc(1 - ((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))));
		--_py: calc(1 - ((var(--_pv) - var(--_min)) / (var(--_max) - var(--_min))));

		background: var(--data-chart-bar-bg, var(--_bg, light-dark(hsla(210, 100%, 70%, .8), hsla(210, 60%, 60%, .8))));
		color: #0000;
		font-size: var(--data-chart-bar-fs, clamp(0.5625rem, 0.45rem + .5cqi, 0.75rem));
		font-weight: var(--data-chart-bar-fw, 400);
		height: calc(
			(
				(var(--_v) - var(--_min)) / (var(--_max) - var(--_min))
			) * 100cqb
		);
		padding: var(--data-chart-bar-p, .75ch 0 0 0);
		text-align: center;
		&:first-of-type {
			border-radius: var(--data-chart-bar-bdrs) var(--data-chart-bar-bdrs) 0 0;
		}
	}

	th {
		border-block-start: var(--data-chart-x-axis-bdw, 0px) var(--data-chart-x-axis-bds, solid) var(--data-chart-x-axis-bdc, hsla(0, 0%, 41%, .95));
		color: var(--data-chart-x-axis-c, light-dark(#444, #EEE));
		display: none;
		font-size: var(--data-chart-x-axis-fs, clamp(0.5625rem, 0.4rem + .5cqi, 0.6875rem));
		font-weight: var(--data-chart-x-axis-fw, 400);
		grid-row: calc(var(--_c, 1) + 1);
		height: var(--data-chart-label-h);
		overflow-inline: clip;
		place-content: center;
	}

	tr {
		/* Count children. Each <tr> has one <th> and one <td> by default: --_c: 1; */
		&:has(> td:nth-child(3)) { --_c: 2; }
		&:has(> td:nth-child(4)) { --_c: 3; }
		&:has(> td:nth-child(5)) { --_c: 4; }
		&:has(> td:nth-child(6)) { --_c: 5; }
		&:has(> td:nth-child(7)) { --_c: 6; }
		&:has(> td:nth-child(8)) { --_c: 7; }
		&:has(> td:nth-child(9)) { --_c: 8; }
		align-content: end;
		align-items: end;
		display: grid;
		overflow-inline: clip;
	}
}

thead {
	align-items: end;
	color: #0000;
	display: none;
	grid-area: 1 / 1 / 3 / 2;
	grid-template-rows: var(--data-chart-caption-h) repeat(auto-fit, minmax(1rem, 1fr));

	th {
		font-size: var(--data-chart-y-axis-fs, 10px);
		font-weight: var(--data-chart-y-axis-fw, 300);
		text-align: start;
	}
	tr {
		display: contents;
	}
}

/* === Legend === */
ul {
	all: unset;
	display: flex;
	flex-wrap: wrap;
	font-size: var(--data-chart-legend-fs, small);
	gap: var(--data-chart-legend-gap, .25rem 1rem);
	list-style-type: none;
	justify-content: var(--data-chart-legend-jc, center);
	margin-block: var(--data-chart-legend-m, 1rem 0);

	li {
		align-items: center;
		display: flex;
		gap: var(--data-chart-legend-item-gap, 0.5rem);
		text-wrap: nowrap;
		&::before {
			background: var(--_lbg, #0000);
			border-radius: var(--data-chart-legend-item-bdrs, 0);
			content: '';
			height: var(--data-chart-legend-item-h, 1rem);
			width: var(--data-chart-legend-item-w, 1.5rem);
		}
		&:nth-child(10n+1) { --_lbg: var(--c1); }
		&:nth-child(10n+2) { --_lbg: var(--c2); }
		&:nth-child(10n+3) { --_lbg: var(--c3); }
		&:nth-child(10n+4) { --_lbg: var(--c4); }
		&:nth-child(10n+5) { --_lbg: var(--c5); }
		&:nth-child(10n+6) { --_lbg: var(--c6); }
		&:nth-child(10n+7) { --_lbg: var(--c7); }
		&:nth-child(10n+8) { --_lbg: var(--c8); }
		&:nth-child(10n+9) { --_lbg: var(--c9); }
		&:nth-child(10n+0) { --_lbg: var(--c10); }
	}
}

/* === Modifiers === */
:host([display*="caption"]) {
	caption { display: block; }
}
:host([display~="caption-end"]) {
	caption { text-align: end; }
}
:host([display~="caption-start"]) {
	caption { text-align: start; }
}
:host([display~="groups"]:not([type=area]):not([type=line])) {
	tbody {
		--data-chart-bar-bdrs: 0;
		th { grid-column: span var(--_c, 1); }
		tr { grid-template-columns: repeat(auto-fit, minmax(var(--chart-group-bar-miw, 2px), 1fr)); }
	}
}
:host([display*="value-labels"]) {
	td { color: var(--data-chart-bar-c); }
}
:host([display~="value-labels-center"]) {
	td { align-content: center; }
}
:host([display~="value-labels-end"]) {
	td { align-content: end; }
}
:host([display~="x-grid"]) {
	--data-chart-bar-gap: 0;
	tr {
		border-block-end: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
		border-inline-end: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
		&:first-of-type {
			border-inline-start: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
		}
	}
}
:host([display*="x-labels"]) {
	--_gtr: var(--data-chart-caption-h) 1fr var(--data-chart-label-h);
	td {
		height: calc(
			(
				(var(--_v) - var(--_min)) / (var(--_max) - var(--_min))
			) * 100cqb - var(--data-chart-label-h)
		);
	}
	th { display: inline grid; }
}
:host([display~="x-labels-vertical"]) {
	--data-chart-label-h: var(--data-chart-label-h-vertical, 5rem);
	--data-chart-mih: var(--data-chart-mih-vertical, 350px);
	th[scope="row"] {
		padding-inline-start: 2ch; /* TODO! */
		place-content: center start;
		text-orientation: mixed;
		writing-mode: vertical-rl;
	}
}
:host([display~="y-grid"]) {
	thead {
		display: grid; 
		th {
			border-block-end: var(--data-chart-bdw) var(--data-chart-bds) var(--data-chart-bdc);
			&:empty {
				border-block-end: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
			}
		}
	}
}
:host([display*="y-labels"]) {
	tbody { padding-inline: var(--data-chart-y-axis-w) 0; }
	thead {
		color: var(--data-chart-y-axis-c, light-dark(#696969, #EEE));
		display: grid;
	}
}
:host([display~="y-labels-end"]) {
	tbody { padding-inline: 0 var(--data-chart-y-axis-w); }
	thead th { text-align: end; }
}

/* === Responsive === */
@container (max-width: 400px) {
	:host([small="1"]) { tbody tr:nth-of-type(n+2) { display: none; } }
	:host([small="2"]) { tbody tr:nth-of-type(n+3) { display: none; } }
	:host([small="3"]) { tbody tr:nth-of-type(n+4) { display: none; } }
	:host([small="4"]) { tbody tr:nth-of-type(n+5) { display: none; } }
	:host([small="5"]) { tbody tr:nth-of-type(n+6) { display: none; } }
	:host([small="6"]) { tbody tr:nth-of-type(n+7) { display: none; } }
	:host([small="7"]) { tbody tr:nth-of-type(n+8) { display: none; } }
	:host([small="8"]) { tbody tr:nth-of-type(n+9) { display: none; } }
}

@container (min-width: 400px) and (max-width: 700px) {
	:host([medium="4"]) { tbody tr:nth-of-type(n+5) { display: none; } }
	:host([medium="5"]) { tbody tr:nth-of-type(n+6) { display: none; } }
	:host([medium="6"]) { tbody tr:nth-of-type(n+7) { display: none; } }
	:host([medium="7"]) { tbody tr:nth-of-type(n+8) { display: none; } }
	:host([medium="8"]) { tbody tr:nth-of-type(n+9) { display: none; } }
	:host([medium="9"]) { tbody tr:nth-of-type(n+10) { display: none; } }
	:host([medium="10"]) { tbody tr:nth-of-type(n+11) { display: none; } }
	:host([medium="11"]) { tbody tr:nth-of-type(n+12) { display: none; } }
	:host([medium="12"]) { tbody tr:nth-of-type(n+13) { display: none; } }
}

/* === Colors === */
:host(:not([display~="groups"])) tbody {
	tr:nth-of-type(10n+1) td { --_bg: var(--c1); }
	tr:nth-of-type(10n+2) td { --_bg: var(--c2); }
	tr:nth-of-type(10n+3) td { --_bg: var(--c3); }
	tr:nth-of-type(10n+4) td { --_bg: var(--c4); }
	tr:nth-of-type(10n+5) td { --_bg: var(--c5); }
	tr:nth-of-type(10n+6) td { --_bg: var(--c6); }
	tr:nth-of-type(10n+7) td { --_bg: var(--c7); }
	tr:nth-of-type(10n+8) td { --_bg: var(--c8); }
	tr:nth-of-type(10n+9) td { --_bg: var(--c9); }
	tr:nth-of-type(10n+0) td { --_bg: var(--c10); }
}

/* === Groups === */
:host([display~="groups"]) tbody tr {
	td:nth-of-type(10n+1) { --_bg: var(--c1); }
	td:nth-of-type(10n+2) { --_bg: var(--c2); }
	td:nth-of-type(10n+3) { --_bg: var(--c3); }
	td:nth-of-type(10n+4) { --_bg: var(--c4); }
	td:nth-of-type(10n+5) { --_bg: var(--c5); }
	td:nth-of-type(10n+6) { --_bg: var(--c6); }
	td:nth-of-type(10n+7) { --_bg: var(--c7); }
	td:nth-of-type(10n+8) { --_bg: var(--c8); }
	td:nth-of-type(10n+9) { --_bg: var(--c9); }
	td:nth-of-type(10n+0) { --_bg: var(--c10); }
}

/* === Types === */

/* === Area === */
:host([type=area]) tbody {
	--data-chart-bar-gap: 0;
	td {
		clip-path: polygon(
			-1% 100%,
			-1% calc(var(--_py) * 100%),
			101% calc(var(--_y) * 100%),
			101% 100%
		);
		font-size: 0;
		grid-area: 1 / 1 / 2 / 2; /* stack all columns */
		height: calc(100cqb - var(--data-chart-label-h));
	}
}

/* === Line === */
:host([type=line]) tbody {
	--line-chart-line-h: 2cqb;
	--data-chart-bar-gap: 0;
	td {
		--_y: calc(1 - ((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))));
		--_py: calc(1 - ((var(--_pv) - var(--_min)) / (var(--_max) - var(--_min))));
		clip-path: polygon(
			-1% calc(var(--_py) * 100% + var(--line-chart-line-h) / 2),
			-1% calc(var(--_py) * 100% - var(--line-chart-line-h) / 2),
			101% calc(var(--_y) * 100% - var(--line-chart-line-h) / 2),
			101% calc(var(--_y) * 100% + var(--line-chart-line-h) / 2)
		);
		font-size: 0;
		grid-area: 1 / 1 / 2 / 2; /* stack all columns */
		height: calc(100cqb - var(--data-chart-label-h));
	}
}

/* === Donut / Pie === */
:host([type=donut]) tbody,
:host([type=pie]) tbody {
	--_t: attr(data-t type(<number>), 0);
	aspect-ratio: 1;
	border-radius: 50%;
	td {
		--_av: attr(data-av type(<number>), 0);
		--_start: calc((var(--_av) / var(--_t)) * 360deg);
		--_end: calc((var(--_v) / var(--_t)) * 360deg);

		background: conic-gradient(from var(--_start),
		var(--_bg) 0 var(--_end),
		#0000 var(--_end) calc(var(--_start) + 360deg));
		border-radius: 50%;
		grid-area: 1 / 1 / 2 / 2;
		height: 100cqb;
		padding: 0;
		width: 100cqi;
	}
	th {
		display: none;
	}
	tr {
		display: contents;
	}
}

:host([type=donut]) tbody {
	mask: radial-gradient(circle, #0000 40%, #000 40%);
}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class DataChart extends HTMLElement {
	#dataset; #root;
	#resizeObserver;

	constructor() { super(); }

	#isAdvancedAttrSupported() {
		const T = document.createElement('div');
		document.body.appendChild(T);
		
		try {
			T.style.setProperty('--t', 'attr(data-test type(<number>), 0)');
			T.dataset.test = "123";
	
			const computedValue = getComputedStyle(T)
				.getPropertyValue('--t')
				.trim();
			
			return computedValue === "123";
		} catch (e) {
			return false;
		} finally {
			T.remove();
		}
	}

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
		if (!this.#dataset || !this.data) {
			this.#root.innerHTML = '';
			return;
		}

		this.setAttribute('max', this.settings?.max ?? 100);
		this.setAttribute('min', this.settings?.min ?? 0);

		const getStyleAttr = (styles, index = 0) => {
			if (!styles) return '';
			if (typeof styles === 'string') return ` style="${styles}"`;
			if (Array.isArray(styles) && styles.length > index) return ` style="${styles[index]}"`;
			return '';
		};

		const getDisplayContent = (value, displayValue) => {
			if (displayValue === false) return '';
			if (typeof displayValue === 'string') return displayValue;
			return value;
		};

		// Calculate sums for percentage calculation
		let totalSum = 0;
		let colSums = [];
		if (this.data.length > 0) {
			if (Array.isArray(this.data[0].value)) {
				const colCount = this.data[0].value.length;
				colSums = Array(colCount).fill(0);
				this.data.forEach(item => {
					if (Array.isArray(item.value)) {
						item.value.forEach((v, i) => {
							colSums[i] += Number(v) || 0;
						});
					}
				});
			} else {
				totalSum = this.data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
			}
		}

		const maxColspan = Math.max(...this.data.map(item => 
			1 + (Array.isArray(item.value) ? item.value.length : 1)
		));

		const yAxisData = [...(this.settings?.yAxis || [])];
		if (!this.hasAttribute('reverse')) {
			yAxisData.reverse();
		}

		this.#root.innerHTML = `
		<table aria-disabled="true">
			${this.settings?.caption ? `<caption>${this.settings.caption}</caption>` : ''}
			<thead aria-hidden="true">
				${yAxisData.map(x => `<tr><th colspan="${maxColspan}">${x}</th></tr>`).join('')}
			</thead>
				<tbody data-t="${Array.isArray(this.data[0]?.value) ? colSums.join(',') : totalSum}">
					${(() => {
						let accumulated = 0;
						let accumulatedArr = [];
						return this.data.map((item, rowIdx, arr) => {
							const tdElements = Array.isArray(item.value) 
								? item.value.map((v, index) => {
									let prevValue;
									if (rowIdx > 0 && Array.isArray(arr[rowIdx - 1]?.value)) {
										prevValue = arr[rowIdx - 1].value[index];
									} else {
										prevValue = v;
									}
									// Calculate accumulated value for this column
									const prevAccum = accumulatedArr[index] || 0;
									accumulatedArr[index] = prevAccum + (Number(v) || 0);
									return `<td data-v="${v}" data-pv="${prevValue}" data-av="${prevAccum}"${getStyleAttr(item.styles, index)}${item.displayValue === false ? ` aria-label="${v}"` : ''}>${getDisplayContent(v, item.displayValue)}</td>`;
								}).join('')
								: (() => {
									const prevValue = this.data[rowIdx - 1]?.value ?? item.value;
									const prevAccum = accumulated;
									accumulated += Number(item.value) || 0;
									return `<td data-v="${item.value}" data-pv="${prevValue}" data-av="${prevAccum}"${getStyleAttr(item.styles)}${item.displayValue === false ? ` aria-label="${item.value}"` : ''}>${getDisplayContent(item.value, item.displayValue)}</td>`;
								})();

							return `
							<tr>
								<th scope="row"${item.displayLabel === false ? ` aria-label="${item.label}"` : ''}>${item.displayLabel === false ? '' : (item.label || '')}</th>
								${tdElements}
							</tr>`;
						}).join('');
					})()}
				</tbody>
		</table>
		${this.settings?.legend ? `
			<ul>
				${this.settings.legend.map((item) => `<li>${item}</li>`).join('')}
			</ul>`: ''}`;
		
		// Apply polyfill for browsers without advanced attribute support
		if (!this.#isAdvancedAttrSupported()) {
			this.#applyAdvancedAttrPolyfill();
		}
	}



	/* Only for Safari */
	#applyAdvancedAttrPolyfill() {
		console.warn('Polyfilling advanced attribute support for DataChart'); 
		const tds = this.#root.querySelectorAll('[data-v]');
		tds.forEach(td => {
			td.style.setProperty('--_v', td.getAttribute('data-v'));
			td.style.setProperty('--_pv', td.getAttribute('data-pv'));
			td.style.setProperty('--_av', td.getAttribute('data-av'));
		});

		const tbody = this.#root.querySelector('tbody');
		if (tbody) {
			const host = this;
			let numCols;
			tbody.style.setProperty('--_t', tbody.getAttribute('data-t'));
			if (host.hasAttribute('small')) {
				const smallVal = parseInt(host.getAttribute('small'), 10);
				if (!isNaN(smallVal) && smallVal > 0) {
					numCols = smallVal;
				}
			} else if (host.hasAttribute('medium')) {
				const mediumVal = parseInt(host.getAttribute('medium'), 10);
				if (!isNaN(mediumVal) && mediumVal > 0) {
					numCols = mediumVal;
				}
			}
			if (!numCols) {
				numCols = tbody.querySelectorAll('tr').length;
			}
			tbody.style.setProperty('--_min', this.getAttribute('min'));
			tbody.style.setProperty('--_max', this.getAttribute('max'));
			tbody.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;

			// Setup ResizeObserver if small/medium attribute exists
			const needsObserver = host.hasAttribute('small') || host.hasAttribute('medium');
			if (needsObserver && !this.#resizeObserver) {
				this.#resizeObserver = new ResizeObserver(entries => {
					const width = entries[0].contentRect.width;
					let newNumCols;
					// Use >= and < for clear boundaries, matching CSS container queries
					if (host.hasAttribute('small') && width < 400) {
						const smallVal = parseInt(host.getAttribute('small'), 10);
						if (!isNaN(smallVal) && smallVal > 0) {
							newNumCols = smallVal;
						}
					} else if (host.hasAttribute('medium') && width >= 400 && width < 815) {
						const mediumVal = parseInt(host.getAttribute('medium'), 10);
						if (!isNaN(mediumVal) && mediumVal > 0) {
							newNumCols = mediumVal;
						}
					} else {
						newNumCols = tbody.querySelectorAll('tr').length;
					}
					tbody.style.gridTemplateColumns = `repeat(${newNumCols}, 1fr)`;
				});
				this.#resizeObserver.observe(this);
			} else if (!needsObserver && this.#resizeObserver) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
		}
	}
}

customElements.define('data-chart', DataChart);

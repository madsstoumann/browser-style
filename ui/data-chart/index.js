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
	--data-chart-label-w: 5rem;
	--data-chart-mih: 275px;
	--data-chart-y-axis-w: 1.5rem;

	--_min: attr(min type(<number>), 0);
	--_max: attr(max type(<number>), 100);

	--_xs: attr(items-xs type(<number>), 0);
	--_sm: attr(items-sm type(<number>), 0);
	--_md: attr(items-md type(<number>), 0);
	--_lg: attr(items-lg type(<number>), 0);
	--_xl: attr(items-xl type(<number>), 0);

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

:host * { box-sizing: border-box; }

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
}

tbody td {
	--_v: attr(data-v type(<number>), 0);
	--_pv: attr(data-pv type(<number>), var(--_v));
	--_y: calc(1 - ((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))));
	--_py: calc(1 - ((var(--_pv) - var(--_min)) / (var(--_max) - var(--_min))));

	background: var(--data-chart-bar-bg, var(--_bg, light-dark(hsla(210, 100%, 70%, .8), hsla(210, 60%, 60%, .8))));
	color: #0000;
	font-size: var(--data-chart-bar-fs, clamp(0.5625rem, 0.45rem + .5cqi, 0.75rem));
	font-weight: var(--data-chart-bar-fw, 400);
	height: calc(((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))) * 100cqb);
	padding: var(--data-chart-bar-p, .75ch 0 0 0);
	position: relative;
	text-align: center;
}

tbody td:first-of-type {
	border-radius: var(--data-chart-bar-bdrs) var(--data-chart-bar-bdrs) 0 0;
}

tbody th {
	border-block-start: var(--data-chart-x-axis-bdw, 0px) var(--data-chart-x-axis-bds, solid) var(--data-chart-x-axis-bdc, hsla(0, 0%, 41%, .95));
	color: var(--data-chart-x-axis-c, light-dark(#444, #EEE));
	display: none;
	font-size: var(--data-chart-x-axis-fs, clamp(0.5625rem, 0.4rem + .5cqi, 0.6875rem));
	font-weight: var(--data-chart-x-axis-fw, 400);
	grid-row: calc(var(--_c, 1) + 1);
	height: var(--data-chart-label-h);
	overflow-inline: clip;
	padding: var(--data-chart-x-axis-p, 0);
	place-content: center;
}

tbody tr {
	/* Count children. Each <tr> has one <th> and one <td> by default: --_c: 1; */
	align-content: end;
	align-items: end;
	display: grid;
	overflow-inline: clip;
}

tbody tr:has(> td:nth-child(3)) { --_c: 2; }
tbody tr:has(> td:nth-child(4)) { --_c: 3; }
tbody tr:has(> td:nth-child(5)) { --_c: 4; }
tbody tr:has(> td:nth-child(6)) { --_c: 5; }
tbody tr:has(> td:nth-child(7)) { --_c: 6; }
tbody tr:has(> td:nth-child(8)) { --_c: 7; }
tbody tr:has(> td:nth-child(9)) { --_c: 8; }

thead {
	align-items: end;
	color: #0000;
	display: none;
	grid-area: 1 / 1 / 3 / 2;
	grid-template-rows: var(--data-chart-caption-h) repeat(auto-fit, minmax(1rem, 1fr));
}

thead th {
	font-size: var(--data-chart-y-axis-fs, 10px);
	font-weight: var(--data-chart-y-axis-fw, 300);
	text-align: start;
}

thead tr {
	display: contents;
}

ul {
	all: unset;
	display: flex;
	flex-wrap: wrap;
	font-size: var(--data-chart-legend-fs, small);
	gap: var(--data-chart-legend-gap, .25rem 1rem);
	list-style-type: none;
	justify-content: var(--data-chart-legend-jc, center);
	margin-block: var(--data-chart-legend-m, 1rem 0);
}

ul li {
	align-items: center;
	display: flex;
	gap: var(--data-chart-legend-item-gap, 0.5rem);
	text-wrap: nowrap;
}

ul li::before {
	background: var(--_lbg, #0000);
	border-radius: var(--data-chart-legend-item-bdrs, 0);
	content: '';
	height: var(--data-chart-legend-item-h, 1rem);
	width: var(--data-chart-legend-item-w, 1.5rem);
}

ul li:nth-child(10n+1) { --_lbg: var(--c1); }
ul li:nth-child(10n+2) { --_lbg: var(--c2); }
ul li:nth-child(10n+3) { --_lbg: var(--c3); }
ul li:nth-child(10n+4) { --_lbg: var(--c4); }
ul li:nth-child(10n+5) { --_lbg: var(--c5); }
ul li:nth-child(10n+6) { --_lbg: var(--c6); }
ul li:nth-child(10n+7) { --_lbg: var(--c7); }
ul li:nth-child(10n+8) { --_lbg: var(--c8); }
ul li:nth-child(10n+9) { --_lbg: var(--c9); }
ul li:nth-child(10n+0) { --_lbg: var(--c10); }

/* === Options === */

:host([options*="caption"]) caption {
	display: block;
}

:host([options~="caption-end"]) caption {
	text-align: end;
}

:host([options~="caption-start"]) caption {
	text-align: start;
}

:host([options~="groups"]) tbody tr td:nth-of-type(10n+1) { --_bg: var(--c1); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+2) { --_bg: var(--c2); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+3) { --_bg: var(--c3); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+4) { --_bg: var(--c4); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+5) { --_bg: var(--c5); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+6) { --_bg: var(--c6); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+7) { --_bg: var(--c7); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+8) { --_bg: var(--c8); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+9) { --_bg: var(--c9); }
:host([options~="groups"]) tbody tr td:nth-of-type(10n+0) { --_bg: var(--c10); }

:host([options~="groups"][type=column]) tbody {
	--data-chart-bar-bdrs: 0;
}

:host([options~="groups"][type=column]) tbody th {
	grid-column: span var(--_c, 1);
}

:host([options~="groups"][type=column]) tbody tr {
	grid-template-columns: repeat(auto-fit, minmax(var(--chart-group-bar-miw, 2px), 1fr));
}

:host([options*="value-labels"]) td {
	color: var(--data-chart-bar-c);
}

:host([options~="value-labels-center"]) td {
	align-content: center;
}

:host([options~="value-labels-end"]) td {
	align-content: end;
}

:host([options~="x-grid"]) {
	--data-chart-bar-gap: 0;
}

:host([options~="x-grid"]) tr {
	border-block-end: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
	border-inline-end: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
}

:host([options~="x-grid"]) tr:first-of-type {
	border-inline-start: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
}

:host([options*="x-labels"]) {
	--_gtr: var(--data-chart-caption-h) 1fr var(--data-chart-label-h);
}

:host([options*="x-labels"]) td {
	height: calc(((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))) * 100cqb - var(--data-chart-label-h));
}

:host([options*="x-labels"]) th {
	display: inline grid;
}

:host([options~="x-labels-vertical"]:not([type=bar])) {
	--data-chart-label-h: var(--data-chart-label-h-vertical, 5rem);
	--data-chart-mih: var(--data-chart-mih-vertical, 350px);
}

:host([options~="x-labels-vertical"]:not([type=bar])) th[scope="row"] {
	--data-chart-x-axis-p: 2ch 0 0 0;
	place-content: center start;
	text-orientation: mixed;
	writing-mode: vertical-rl;
}

:host([options~="y-grid"]) thead {
	display: grid;
}

:host([options~="y-grid"]) thead th {
	border-block-end: var(--data-chart-bdw) var(--data-chart-bds) var(--data-chart-bdc);
}

:host([options~="y-grid"]) thead th:empty {
	border-block-end: var(--data-chart-nolabel-bdw) var(--data-chart-nolabel-bds) var(--data-chart-nolabel-bdc);
}

:host([options*="y-labels"]) tbody {
	padding-inline: var(--data-chart-y-axis-w) 0;
}

:host([options*="y-labels"]) thead {
	color: var(--data-chart-y-axis-c, light-dark(#696969, #EEE));
	display: grid;
}

:host([options~="y-labels-end"]) tbody {
	padding-inline: 0 var(--data-chart-y-axis-w);
}

:host([options~="y-labels-end"]) thead th {
	text-align: end;
}

/* === Colors === */

:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+1) td { --_bg: var(--c1); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+2) td { --_bg: var(--c2); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+3) td { --_bg: var(--c3); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+4) td { --_bg: var(--c4); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+5) td { --_bg: var(--c5); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+6) td { --_bg: var(--c6); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+7) td { --_bg: var(--c7); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+8) td { --_bg: var(--c8); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+9) td { --_bg: var(--c9); }
:host(:not([options~="groups"])) tbody tr:nth-of-type(10n+0) td { --_bg: var(--c10); }

/* === Responsive === */

/* xs */
@container (max-width: 400px) {
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="1"]) tbody tr:nth-of-type(n+2),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="2"]) tbody tr:nth-of-type(n+3),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="3"]) tbody tr:nth-of-type(n+4),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="4"]) tbody tr:nth-of-type(n+5),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="5"]) tbody tr:nth-of-type(n+6),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="6"]) tbody tr:nth-of-type(n+7),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="7"]) tbody tr:nth-of-type(n+8),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-xs="8"]) tbody tr:nth-of-type(n+9) {
		display: none;
	}
}

/* sm */
@container (min-width: 400px) and (max-width: 700px) {
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="4"]) tbody tr:nth-of-type(n+5),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="5"]) tbody tr:nth-of-type(n+6),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="6"]) tbody tr:nth-of-type(n+7),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="7"]) tbody tr:nth-of-type(n+8),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="8"]) tbody tr:nth-of-type(n+9),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="9"]) tbody tr:nth-of-type(n+10),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="10"]) tbody tr:nth-of-type(n+11),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="11"]) tbody tr:nth-of-type(n+12),
	:host(:is([type="area"], [type="column"], [type="line"], [type="candlestick"])[items-sm="12"]) tbody tr:nth-of-type(n+13) {
		display: none;
	}
}

/* === Types === */

/* -- Area -- */
:host([type=area]) tbody {
	--data-chart-bar-gap: 0;
}

:host([type=area]) tbody td {
	clip-path: polygon(-1% 100%,
			-1% calc(var(--_py) * 100%),
			101% calc(var(--_y) * 100%),
			101% 100%);
	font-size: 0;
	grid-area: 1 / 1 / 2 / 2;
	height: calc(100cqb - var(--data-chart-label-h));
}

/* -- Bar / Poll -- */
:host(:is([type=bar],[type=poll])) {
	--data-chart-bar-p: 0.5ch 1ch;
}

:host(:is([type=bar],[type=poll])) table {
	min-height: unset;
}

:host(:is([type=bar],[type=poll])) tbody {
	container-type: inline-size;
	grid-template-columns: 1fr;
	padding-inline: 0;
}

:host([type=bar]) tbody td {
	width: calc(((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))) * 100cqi - var(--data-chart-label-w));
}

:host(:is([type=bar],[type=poll])) tbody td {
	border-radius: 0;
	height: auto;
	text-align: end;
}

:host(:is([type=bar],[type=poll])) tbody th {
	--data-chart-x-axis-bdw: 0;
	grid-row: unset;
	padding-inline: var(--data-chart-bar-label-pi, 1ch);
	place-content: unset;
	text-align: end;
}

:host([type=bar]) tbody tr {
	grid-template-columns: var(--data-chart-label-w) repeat(auto-fit, minmax(var(--chart-group-bar-miw, 2px), auto));
}

:host(:is([type=bar],[type=poll])) thead {
	display: none;
}

:host([type=bar][options~="groups"]) td {
	width: calc(((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))) * ((100cqi - var(--data-chart-label-w)) / var(--_c, 1)));
}

:host([type=bar][options~="groups"]) th {
	width: var(--data-chart-label-w);
}

:host([type=bar][options~="groups"]) tr {
	display: flex;
}

/* -- Candlestick -- */
:host([type=candlestick]) tbody td {
	--_open: attr(data-open type(<number>), 0);
	--_high: attr(data-high type(<number>), 0);
	--_low: attr(data-low type(<number>), 0);
	--_close: attr(data-close type(<number>), 0);
	--data-chart-bar-bg: #0000;
	--data-chart-bar-p: 0;
	
	height: calc(((var(--_high) - var(--_min)) / (var(--_max) - var(--_min))) * 100cqb);
}

:host([type=candlestick][options*="x-labels"]) tbody td {
	height: calc(((var(--_high) - var(--_min)) / (var(--_max) - var(--_min))) * 100cqb - var(--data-chart-label-h));
}

/* -- Candlestick: Wick -- */
:host([type=candlestick]) tbody td::before {
	color: var(--data-chart-candlestick-wick, #666);
	background: currentColor;
	bottom: calc(((var(--_low) - var(--_min)) / (var(--_max) - var(--_min))) * 100%);
	content: '';
	height: calc(((var(--_high) - var(--_low)) / (var(--_max) - var(--_min))) * 100%);
	left: 50%;
	position: absolute;
	transform: translateX(-50%);
	width: var(--data-chart-candlestick-wick-w, 1px);
}

/* -- Candlestick: Body -- */
:host([type=candlestick]) tbody td::after {
	content: '';
	position: absolute;
	left: 10%;
	width: 80%;
	z-index: 1;
}

/* -- Candlestick: Bullish (green) -- */
:host([type=candlestick]) tbody td[data-direction="up"]::after {
	background: var(--data-chart-candlestick-up, #22c55e);
	bottom: calc(((var(--_open) - var(--_min)) / (var(--_max) - var(--_min))) * 100%);
	height: calc(((var(--_close) - var(--_open)) / (var(--_max) - var(--_min))) * 100%);
}

/* -- Candlestick: Bearish (red) -- */
:host([type=candlestick]) tbody td[data-direction="down"]::after {
	background: var(--data-chart-candlestick-down, #ef4444);
	bottom: calc(((var(--_close) - var(--_min)) / (var(--_max) - var(--_min))) * 100%);
	height: calc(((var(--_open) - var(--_close)) / (var(--_max) - var(--_min))) * 100%);
}

/* -- Donut / Pie -- */
:host(:is([type=donut], [type=pie])) table {
	min-height: unset;
}

:host(:is([type=donut], [type=pie])) tbody {
	--_t: attr(data-t type(<number>), 0);
	aspect-ratio: 1;
	border-radius: 50%;
	padding: 0;
}

:host(:is([type=donut], [type=pie])) tbody td {
	--_av: attr(data-av type(<number>), 0);
	--_start: calc((var(--_av) / var(--_t)) * 360deg);
	--_end: calc((var(--_v) / var(--_t)) * 360deg);

	background: conic-gradient(from var(--_start),
			var(--_bg) 0 var(--_end),
			#0000 var(--_end) calc(var(--_start) + 360deg));
	border-radius: 50%;
	color: #0000;
	grid-area: 1 / 1 / 2 / 2;
	height: 100cqb;
	padding: 0;
	width: 100cqi;
}

:host(:is([type=donut], [type=pie])) tbody th {
	display: none;
}

:host(:is([type=donut], [type=pie])) tbody tr {
	display: contents;
}

:host(:is([type=donut], [type=pie])) thead {
	display: none;
}

:host([type=donut]) tbody {
	mask: radial-gradient(circle, #0000 40%, #000 40%);
}

/* -- Line -- */
:host([type=line]) tbody {
	--line-chart-line-h: 2cqb;
	--data-chart-bar-gap: 0;
}

:host([type=line]) tbody td {
	--_y: calc(1 - ((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))));
	--_py: calc(1 - ((var(--_pv) - var(--_min)) / (var(--_max) - var(--_min))));
	clip-path: polygon(-1% calc(var(--_py) * 100% + var(--line-chart-line-h) / 2),
			-1% calc(var(--_py) * 100% - var(--line-chart-line-h) / 2),
			101% calc(var(--_y) * 100% - var(--line-chart-line-h) / 2),
			101% calc(var(--_y) * 100% + var(--line-chart-line-h) / 2));
	font-size: 0;
	grid-area: 1 / 1 / 2 / 2;
	height: calc(100cqb - var(--data-chart-label-h));
}

/* -- Pie -- */
:host([type=pie]) tbody {
	mask: radial-gradient(circle, #000 0 100%);
}

/* -- Poll -- */
:host([type=poll]) tbody {
	margin-block-end: var(--data-chart-poll-row-gap, 1ch);
	row-gap: var(--data-chart-poll-row-gap, 1ch);
}
:host([type=poll]) tbody td { background: var(--data-chart-poll-bg, #EEE); }

:host([type=poll]) tbody td::before {
	background: var(--_bg);
	content: "";
	height: 100%;
	left: 0;
	position: absolute;
	top: 0;
	width: calc(((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))) * 100%);
}

:host([type=poll]) tbody th {
	font-weight: var(--data-chart-poll-fw, 600);
	padding: 0;
	text-align: start;
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
		if (!this.#dataset || !Array.isArray(this.data) || this.data.length === 0) {
			this.#root.innerHTML = '<div style="padding: 1rem; text-align: center; color: grey;">Error: No data or invalid data provided.</div>';
			console.error('DataChart: Data is missing, not an array, or empty.');
			return;
		}

		const hasInvalidData = this.data.some(item => typeof item !== 'object' || item === null || typeof item.value === 'undefined');
		if (hasInvalidData) {
			this.#root.innerHTML = '<div style="padding: 1rem; text-align: center; color: grey;">Error: Invalid data structure. Each item must be an object with a "value" property.</div>';
			console.error('DataChart: Invalid data structure. Each item must be an object with a "value" property.');
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
							// Check if this is a candlestick chart
							const isCandlestick = this.getAttribute('type') === 'candlestick';
							
							const tdElements = isCandlestick && item.open !== undefined && item.high !== undefined && item.low !== undefined && item.close !== undefined
								? (() => {
									// Candlestick data structure
									const direction = item.close >= item.open ? 'up' : 'down';
									return `<td data-open="${item.open}" data-high="${item.high}" data-low="${item.low}" data-close="${item.close}" data-direction="${direction}"${getStyleAttr(item.styles)}${item.displayValue === false ? ` aria-label="${item.value || item.close}"` : ''}>${getDisplayContent(item.value || item.close, item.displayValue)}</td>`;
								})()
								: Array.isArray(item.value) 
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

		// Handle candlestick data attributes
		const candlestickTds = this.#root.querySelectorAll('[data-open]');
		candlestickTds.forEach(td => {
			td.style.setProperty('--_open', td.getAttribute('data-open'));
			td.style.setProperty('--_high', td.getAttribute('data-high'));
			td.style.setProperty('--_low', td.getAttribute('data-low'));
			td.style.setProperty('--_close', td.getAttribute('data-close'));
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

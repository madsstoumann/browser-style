/**
 * GUI Control
 * description
 * @summary 19-06-2024
 * @class
 * @extends {HTMLElement}
 */
export class GuiControl extends HTMLElement {
	static observedAttributes = [];

	constructor() {
		super();
		const shadow = this.attachShadow({ mode: 'open' })
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `
		<details open>
			<summary>${this.getAttribute('label') || 'Toggle Controls'}</summary>
			<form>
				<ul></ul>
			</form>
		</details>`;

		this.form = this.shadowRoot.querySelector('form');
		this.list = this.shadowRoot.querySelector('ul');
		this.scope = document.querySelector(this.getAttribute('scope')) || document.documentElement;

		this.form.addEventListener('input', (event) => {
			const input = event.target;
			const li = input.closest('li');
			const output = li.querySelector('output');
			let value = input.value;
			if (input.type === 'checkbox') { value = input.checked ? input.value : input.dataset.unchecked || ''; }
			li.dataset.value = value;
			if (output) output.textContent = value;
			this.scope.style.setProperty(input.dataset.property, value);
		});
	}

	add(content, label, value, property) {
		const li = document.createElement('li');
		li.innerHTML = label ? `<label>${label}${content}</label>` : content;
		if (value) {
			li.dataset.value = value;
			this.scope.style.setProperty(property, value);
		}
		this.list.appendChild(li);
	}

	addCheckbox(label, value, property, checked, unchecked) {
		this.add(
			`<input type="checkbox" value="${value}" data-unchecked="${unchecked || ''}" ${checked ? 'checked' : ''} data-property="${property}">`,
			label,
			checked ? value : unchecked,
			property
		);
	}

	addColor(label, value, property) {
		this.add(
			`<input type="color" value="${value}" data-property="${property}">`,
			label,
			value,
			property
		);
	}

	addRange(label, value, property, min, max) {
		this.add(
			`<input type="range" min="${min}" max="${max}" value="${value}" data-property="${property}"><output>${value}</output>`,
			label,
			value,
			property
		);
	}

	addReset(label) {
		this.add(
			`<button type="reset">${label || 'Reset'}</button>`
		);
	}

	addSelect(label, value, property, options) {
		this.add(
			`<select data-property="${property}">${
				options.map(option => `<option value="${option}"${option === value ? ' selected' : ''}>${option}</option>`).join('')
			}</select>`,
			label,
			value,
			property
		);
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
* { box-sizing: border-box; }
:host {
	--_c: #2FA1D6;
	--_bg: #303030;
	--_gap: .33em;
	--_h: 1lh;

	background: #2c2c2c;
	color: #eee;
	font-family: ui-sans-serif, system-ui;
	font-size: small;
	inline-size: fit-content;
	inset-block: 0 auto;
	inset-inline: auto 0;
	position: fixed;
}
:host([position~="bottom"]) { inset-block: auto 0; }
:host([position~="left"]) { inset-inline: 0 auto; }

label {
	display: contents;
	gap: calc(2 * var(--_gap));
}
li {
	align-items: center;
	background: #1a1a1a;
	border-inline-start: var(--_gap) solid var(--_bdc, var(--_c));
	column-gap: calc(2 * var(--_gap));
	display: grid;
	grid-template-columns: 6em 1fr 3em;
	padding-block: var(--_gap);
	padding-inline: calc(2 * var(--_gap)) var(--_gap);
	&:has([type=color])::after { 
		content: attr(data-value);
		font-size: x-small;
		grid-area: 1 / 2 / 1 / 4;
		text-align: center;
		text-shadow: 0 0 0.5em var(--_bg);
		pointer-events: none;
	}
	&:has([type=reset]) { --_bdc: #e61d5f; }
	&:has(select) { --_bdc: #1ed36f;}
}
output {
	background: var(--_bg);
	color: var(--_c);
	display: grid;
	font-family: ui-monospace, monospace;
	font-size: 80%;
	height: 100%;
	justify-self: end;
	padding-inline: var(--_gap);
	place-content: center;
	width: 100%;
}
select {
	background: var(--_bg);
	border: 0;
	color: var(--_c);
	font-family: inherit;
	font-size: inherit;
	grid-column: span 2;
}
summary {
	padding: var(--_gap) calc(2 * var(--_gap));
	text-align: center;
	user-select: none;
}
ul {
	all: unset;
	display: grid;
	row-gap: 0.125em;
}

/* === CONTROLS === */
[type=checkbox] {
	all: unset;
	aspect-ratio: 1;
	background: var(--_bg);
	height: 100%;
	place-self: start;
	&:checked { --_bg: var(--_c); }
}

[type=color] {
	border: 0;
	grid-area: 1 / 2 / 1 / 4;
	height: 100%;
	inline-size: 100%;
	padding: 0;
	&::-webkit-color-swatch {
		border: 0;
		border-radius: 0;
	}
	&::-webkit-color-swatch-wrapper {
		border: none;
		padding: 0;
	}
}
[type=range] {
	appearance: none;
	background: none;
	cursor: ew-resize;
	font-size: inherit;
	height: 100%;
	margin: 0;
	overflow: hidden;
	&::-webkit-slider-runnable-track { height: 100%; }
	&::-webkit-slider-thumb {
		appearance: none;
		aspect-ratio: 1;
		border-radius: 0;
		box-shadow: 0 0 0 100% inset var(--_c);
		border-image: linear-gradient(90deg, var(--_c) 50%, var(--_bg) 0) 0 1 / calc(50% - 100% / 2) 100vw / 0 calc(100vw);
		height: 100%;
		width: 0;
	}
}
[type=reset] {
	all: unset;
	grid-column: span 3;
	text-align: center;
}	
`);

/* Register element */
customElements.define('gui-control', GuiControl);
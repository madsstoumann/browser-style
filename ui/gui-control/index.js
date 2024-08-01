/**
 * GUI Control
 * description
 * @author Mads Stoumann
 * @version 1.0.04
 * @summary 30-07-2024
 * @class
 * @extends {HTMLElement}
 */
export default class GuiControl extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: 'open' });
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `
		<details open>
			<summary part="summary">${this.getAttribute('label') || 'Toggle Controls'}</summary>
			<form>
				<ul part="ul"></ul>
			</form>
		</details>`;

		this.form = this.shadowRoot.querySelector('form');
		this.list = this.shadowRoot.querySelector('ul');
		this.scope = document.querySelector(this.getAttribute('scope')) || document.documentElement;

		this.form.addEventListener('click', (event) => {
			if (event.target.tagName === 'BUTTON') {
				this.dispatchEvent(new CustomEvent('gui-input', { detail: { input: event.target, action: event.target.dataset.action || '' } }));
			}
		});

		this.form.addEventListener('input', (event) => {
			const input = event.target;
			const li = input.closest('li');
			const output = li.querySelector('output');
			let value = input.type === 'checkbox' ? (input.checked ? input.value : input.dataset.unchecked || '') : input.value;
			
			li.dataset.value = value;
			if (output) output.textContent = value;
			if (input.dataset.property) {
				this.scope.style.setProperty(input.dataset.property, value);
			}
			this.dispatchEvent(new CustomEvent('gui-input', { detail: { input, value, action: input.dataset.action || '' } }));
		});
	}

	add(content, label, value, property, list = this.list) {
		const li = document.createElement('li');
		li.innerHTML = label ? `<label>${label}${content}</label>` : content;
		li.setAttribute('part', 'li');
		if (value) {
			li.dataset.value = value;
			if (property) this.scope.style.setProperty(property, value);
		}
		list.appendChild(li);
	}	

	addButton(label, text, type = 'button', attributes = {}, list = this.list) {
		this.add(`<button type="${type}" part="${type}" ${this.attrs(attributes)}>${text}</button>`, label, '', '', list);
	}

	addCheckbox(label, value, property, attributes = {}, list = this.list) {
		this.addInput('checkbox', label, value, property, attributes, list);
	}

	addColor(label, value, property, attributes = {}, list = this.list) {
		this.addInput('color', label, value, property, attributes, list);
	}

	addGroup(label, content) {
		const details = document.createElement('details');
		details.innerHTML = `<summary>${label}</summary><ul part="ul"></ul>`;
		const ul = details.querySelector('ul');
		if (Array.isArray(content)) {
			content.forEach(func => {
				if (typeof func === 'function') {
					func.apply(this, [ul]);
				}
			});
		}
		const li = document.createElement('li');
		li.appendChild(details);
		this.list.appendChild(li);
	}

	addInput(type, label, value, property, attributes = {}, list = this.list) {
		this.setValProp(attributes, value, property);
		this.add(`<input type="${type}" part="${type}" ${this.attrs(attributes)}>`, label, value, property, list);
	}

	addRange(label, value, property, attributes = {}, list = this.list) {
		this.setValProp(attributes, value, property);
		this.add(`<input type="range" part="range" ${this.attrs(attributes)}><output part="output">${value}</output>`, label, value, property, list);
	}

	addSelect(label, value, property, attributes = {}, list = this.list) {
		if (!attributes.options) return;
		this.setValProp(attributes, value, property);

		let options = '';
		if (attributes.defaultOption) {
			options += `<option selected disabled value="">${attributes.defaultOption}</option>`;
			delete attributes.defaultOption;
		}

		options += attributes.options.map(option => 
			`<option value='${option.value}'${option.key === value ? ' selected' : ''}>${option.key}</option>`
		).join('');
		delete attributes.options;

		this.add(`<select ${this.attrs(attributes)} part="select">${options}</select>`, label, value, property, list);
	}

	addTextArea(label, value, property, attributes = {}, list = this.list) {
		this.setValProp(attributes, value, property);
		this.add(`<textarea part="textarea" ${this.attrs(attributes)}>${value}</textarea>`, label, value, property, list);
	}

	attrs(attributes) {
		return Object.entries(attributes).map(([key, value]) => {
			if (value === '') return '';
			if (value === key) return key;
			return `${key}="${value}"`;
		}).join(' ');
	}

	setValProp(attributes, value, property) {
		if (value) attributes.value = value;
		if (property) attributes['data-property'] = property;
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
	--_w: 280px;

	background: #2c2c2c;
	color: #eee;
	font-family: ui-sans-serif, system-ui;
	font-size: small;
	inline-size: var(--_w);
	inset-block: 0 auto;
	inset-inline: auto 0;
	position: fixed;
	touch-action: none;
}
:host([position~="bottom"]) { inset-block: auto 0; }
:host([position~="left"]) { inset-inline: 0 auto; }

button {
	background: var(--_bg);
	border: 1px solid var(--_c);
	border-radius: 0;
	color: var(--_c);
	font-family: inherit;
	font-size: inherit;	
	grid-column: span 2;
}
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
	&:has([type=checkbox]) { --_bdc: #D67C2F; }
	&:has([type=color]) { --_bdc: #7C2FD6; }
	&:has([type=reset]) { --_bdc: #D62FA1; }
	&:has(select) { --_bdc: #2FD67C;}
	&:has(textarea) { --_bdc: orange; }
	&:has(details) {
		border-color: #fcf05c;
		padding: 0;
	}
	details {
		grid-column: span 3;
		&[open] summary::after { rotate: 135deg; }
	}
	summary {
		align-items: center;
		display: flex;
		justify-content: space-between;
		list-style: none;
		text-align: start;
		&::after {
			content: '';
			border-color: currentColor;
			border-style: solid;
			border-width: 1px 1px 0 0;
			display: block;
			height: .5em;
			rotate: 45deg;
			transition: rotate .2s;	
			width: .5em;
		}
	}
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
select, textarea {
	background: var(--_bg);
	border: 0;
	border-radius: 0;
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
textarea {
	font-size: x-small;
	min-height: 2em;
	resize: vertical;
}
ul {
	all: unset;
	display: grid;
	row-gap: 0.125em;
}

/* === CONTROLS === */
:is(button, input, select, summary, textarea):focus-visible {
	outline: 1px solid #FFF;
}
[type=checkbox] {
	all: unset;
	aspect-ratio: 1;
	background: var(--_bg);
	height: 100%;
	place-self: start;
	&:checked {
		--_bg: var(--_c) url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="white" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>') center / 80%;
	}
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
	border-radius: 0;
	cursor: ew-resize;
	font-size: inherit;
	height: 100%;
	margin: 0;
	overflow: hidden;
	touch-action: manipulation;
	&::-webkit-slider-runnable-track { height: 100%; }
	&::-webkit-slider-thumb {
		appearance: none;
		aspect-ratio: 1;
		background: var(--_c);
		border-radius: 0;
		box-shadow: 0 0 0 100% inset var(--_c);
		border-image: linear-gradient(90deg, var(--_c) 50%, var(--_bg) 0) 0 1 / calc(50% - 100% / 2) 100vw / 0 calc(100vw);
		height: 100%;
		width: .33em;
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
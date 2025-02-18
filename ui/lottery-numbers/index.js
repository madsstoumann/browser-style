const sheet = new CSSStyleSheet();
sheet.replaceSync(`
	:host, :host * { box-sizing: border-box;}
	:host {
		--lottery-number-bdw: .5cqi;
		--lottery-number-c: #DDA951;
		--lottery-number-gap: 1.5cqi;
		font-family: system-ui;
		font-variant-numeric: tabular-nums;
	}
	:host::part(numbers) {
		container-type: inline-size;
		display: grid;
		gap: var(--lottery-number-gap);
	}
	:host::part(bonus),
	:host::part(generate) {
		background-color: var(--lottery-number-c);
		color: Canvas;
		font-weight: bold;
	}
	:host::part(generate) {
		border: 0;
		border-radius: 3ch;
		font-size: 4cqi;
		justify-self: center;
		margin-block: 1ch;
		padding: 1ch 2ch;
	}
	:host::part(number) {
		aspect-ratio: 1;
		border: var(--lottery-number-bdw) solid var(--lottery-number-c);
		border-radius: 50%;
		display: inline grid;
		font-size: 4cqi;
		padding: 1ch;
		place-items: center;
	}
	:host::part(row) {
		all: unset;
		display: grid;
		gap: var(--lottery-number-gap);
		grid-template-columns: repeat(auto-fit, minmax(2ch, 1fr));
	}
}
`);

class LotteryNumbers extends HTMLElement {
	static observedAttributes = ['rows', 'cols', 'start', 'end', 'bonus', 'bonus-start', 'bonus-end'];
	
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = `
			<div part="numbers"></div>
			<button type="button" part="generate">${this.getAttribute('label') || 'Generate'}</button>
		`;
		this.shadowRoot.querySelector('button').addEventListener('click', () => this.render());
		this.render();
	}

	random(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min).toString().padStart(2, '0');
	}

	getNumbers() {
		return Array.from({ length: Number(this.getAttribute('rows') || 10) }, () => {
			const numbers = new Set();
			const bonus = new Set();
			while (numbers.size < Number(this.getAttribute('cols') || 5)) {
				numbers.add(this.random(
					Number(this.getAttribute('start') || 1),
					Number(this.getAttribute('end') || 50)
				));
			}
			while (bonus.size < Number(this.getAttribute('bonus') || 2)) {
				bonus.add(this.random(
					Number(this.getAttribute('bonus-start') || 1),
					Number(this.getAttribute('bonus-end') || 12)
				));
			}
			return `<ul part="row">
				${Array.from(numbers).sort().map(number => `<li part="number">${number}</li>`).join('')}
				${Array.from(bonus).sort().map(number => `<li part="number bonus">${number}</li>`).join('')}
			</ul>`;
		}).join('');
	}

	render() {
		this.shadowRoot.querySelector('[part="numbers"]').innerHTML = this.getNumbers();
	}
}

customElements.define('lottery-numbers', LotteryNumbers);

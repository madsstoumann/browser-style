const styles = new CSSStyleSheet();
styles.replaceSync(`
:host {
  display: block;
}
`);

class NumberSnapper extends HTMLElement {
	#attr;
  #root;
  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
		this.#attr = {
			currency: this.getAttribute('currency') || 'USD',
			decimals: this.hasAttribute('decimals') ? parseInt(this.getAttribute('decimals'), 10) : 0,
			format: this.getAttribute('format') || 'currency',
			label: this.getAttribute('label') || '',
			lang: this.getAttribute('lang') || 'en-US',
			max: this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100,
			min: this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0,
			points: this.hasAttribute('points') ? parseInt(this.getAttribute('points'), 10) : 10,
			snap: this.getAttribute('snap') || 'none',
			step: this.hasAttribute('step') ? parseFloat(this.getAttribute('step')) : 1,
			unit: this.getAttribute('unit') || null,
			value: this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : 0
		};
    this.#root.innerHTML = `
		<fieldset>
			<legend>${this.#attr.label}</legend>
			<output name="out"></output>
			<label aria-label="${this.#attr.label}">
				<input type="range" name="in" min="${this.#attr.min}" max="${this.#attr.max}" step="${this.#attr.stepl}" value="${this.#attr.value}">
				<span data-scroll tabindex="-1">
					<span data-scroll-bg>
						<i></i>
						<span data-scroll-snap>${ Array.from({ length: this.#attr.points + 1 }).map(() => `<b></b>`).join('')}</span>
						<i></i>
					</span>
				</span>
			</label>
		</fieldset>`;
  }
}

customElements.define('number-snapper', NumberSnapper);

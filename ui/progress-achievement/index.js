class ProgressAchievement extends HTMLElement {
	static get observedAttributes() {
		return ['value', 'max', 'duration'];
	}

	constructor() {
		super();
		this.uid = `prg${window.crypto.getRandomValues(new Uint32Array(1))[0]}`;
		const shadow = this.attachShadow({ mode: 'open' })
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `
		<progress id="${this.uid}"></progress>
		<output for="${this.uid}"></output>
		<fieldset>
			<slot></slot>
		</fieldset>`;

		this.progress = this.shadowRoot.querySelector('progress');
		this.output = this.shadowRoot.querySelector('output');
		this.checkboxes = null;
		this.startValue = 0;
		this.duration = 2000;
	}

	connectedCallback() {
		this.updateValues();
		this.animateProgress(this.startValue, parseFloat(this.value), this.duration);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			this.updateValues();
		}
	}

	updateValues() {
		this.value = this.getAttribute('value') || 0;
		this.max = this.getAttribute('max') || 100;
		this.duration = this.getAttribute('duration') || 2000;
		this.progress.max = this.max;
		this.checkboxes = this.querySelectorAll('input[type="checkbox"]');
	}

	animateProgress(start, end, duration) {
		const startTime = performance.now();
		const updateProgress = (currentTime) => {
			const elapsed = currentTime - startTime;
			const progressFraction = Math.min(elapsed / duration, 1);
			const currentValue = start + (end - start) * progressFraction;

			this.progress.value = currentValue;
			this.output.textContent = `${currentValue.toFixed(2)} kr.`;

			this.checkboxes.forEach(checkbox => {
				const achievementValue = parseFloat(checkbox.value);
				if (currentValue >= achievementValue) {
					checkbox.checked = true;
				} else {
					checkbox.checked = false;
				}
			});

			if (progressFraction < 1) {
				requestAnimationFrame(updateProgress);
			}
		};
		requestAnimationFrame(updateProgress);
	}
}
/* === STYLES === */

const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
:host {
	display: grid;
	font-family: sans-serif;
}
fieldset, progress {
	grid-area: 2 / 1 / 3 / 1;
	height: 2em;
	width: 100%;
}
fieldset {
	border: none;
	padding: 0;
	margin: 0;
}

::slotted(input) {
	appearance: none;
	aspect-ratio: 1;
	background: silver;
	border-radius: 50%;
	height: 100%;
	margin: 0;

}
::slotted(input:checked) { background: green; }

::slotted(label) {
	display: contents;
}
output {
	grid-area: 1 / 1;
}
`);
customElements.define('progress-achievement', ProgressAchievement);

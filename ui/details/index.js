export default class uiDetails extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		const label = this.getAttribute('label');
		const icon = this.getAttribute('icon');
		const open = this.hasAttribute('open');
		const content = this.innerHTML;

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
				ui-expand {
					display: grid;
					grid-template-rows: 0fr;
					transition: grid-template-rows 0.25s cubic-bezier(.2, 0, .2, 1);
				}
				ui-panel {
					overflow: hidden;
				}
				ui-summary {
					align-items: center;
					cursor: pointer;
					display: flex;
					gap: 1ch;
					text-box-trim: both;
					user-select: none;
				}
				ui-summary[aria-expanded="true"] + ui-expand {
					grid-template-rows: 1fr;
				}
			</style>
			<ui-summary role="button" aria-expanded="${open}" tabindex="0" aria-controls="expand" part="summary">
				<span part="label">${label}</span>
				<ui-icon type="${icon}" size="md" part="icon"></ui-icon>
			</ui-summary>
			<ui-expand id="expand" inert="${!open}">
				<ui-panel part="expand">
					${content}
				</ui-panel>
			</ui-expand>
		`;

		this.summary = this.shadowRoot.querySelector('ui-summary');
		this.expand = this.shadowRoot.querySelector('ui-expand');

		this.summary.addEventListener('click', () => this.toggle());
		this.summary.addEventListener('keydown', e => {
			if (e.code === 'Space' || e.code === 'Enter') {
				e.preventDefault();
				this.toggle();
			}
		});
		this.addEventListener('ui-details:open', event => {
			this.toggle(event.detail.open);
		});
	}

	toggle(force = null, dispatch = true) {
		const open = typeof force === 'boolean' ? force : "true" !== this.summary.getAttribute('aria-expanded');
		this.summary.setAttribute('aria-expanded', open);
		this.toggleAttribute('open', open);
		this.expand.inert = !open;
		if (this.hasAttribute('name') && open) {
			const name = this.getAttribute('name');
			this.parentNode.querySelectorAll(`ui-details[name="${name}"]`).forEach(group => 
				group !== this && group.toggle(false, false)
			);
		}
		if (dispatch) this.dispatchEvent(new CustomEvent('ui-details:toggle', { detail: { open }, bubbles: true }));
	}
}

customElements.define('ui-details', uiDetails);
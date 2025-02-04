const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--gui-panel-gap: .75rem;
		--gui-panel-m: 1rem;
		--gui-panel-w: 265px;

		background: var(--gui-panel-bg, Canvas);
		border: 0;
		border-radius: var(--gui-panel-bdrs, 10px);
		box-shadow: var(--gui-panel-bxsh, 0px 8px 56px 0px color-mix(in srgb, CanvasText, transparent 70%));
		color: var(--gui-panel-c, CanvasText);
		color-scheme:light dark;
		font-family: var(--gui-panel-ff, system-ui, sans-serif);
		font-size: var(--gui-panel-fs, 1rem);
		height: auto;
		inset-block: var(--gui-panel-y, var(--gui-panel-m)) auto;
		inset-inline: var(--gui-panel-x, calc(100% - var(--gui-panel-w) - var(--gui-panel-m))) auto;
		padding: var(--gui-panel-gap);
		max-height: calc(100dvh - (2 * var(--gui-panel-m)));
		row-gap: var(--gui-panel-gap);
		touch-action: none;
		width: var(--gui-panel-w);
	}
	:host(:popover-open) { display: grid }

	:host::part(close),
	:host::part(scheme) {
		all: unset;
		height: 1.5rem;
		width: 1.5rem;
	}
	:host::part(header) {
		align-items: center;
		display: flex;
		justify-content: space-between;
	}
	:host::part(icon) {
		fill: none;
		pointer-events: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	:host::part(title) {
		cursor: move;
		user-select: none;
	}

	@media (prefers-color-scheme: light) {
		:host(.cs) { color-scheme: dark; }
	}
	@media (prefers-color-scheme: dark) {
		:host(.cs) { color-scheme: light; }
	}
`);

const ICONS = {
	close : `<svg part="icon" viewBox="0 0 24 24"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>`,
	scheme: `<svg part="icon" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 3l0 18" /><path d="M12 9l4.65 -4.65" /><path d="M12 14.3l7.37 -7.37" /><path d="M12 19.6l8.85 -8.85" /></svg>`
}

export default class GuiPanel extends HTMLElement {
	#root;
	#parts = {};
	#dragState = null;

	constructor() {
		super();
		this.id = `gui-${Math.random().toString(36).slice(2, 7)}`;
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
		this.#root.innerHTML = `
			<header part="header">
				<button type="button" part="scheme"><slot name="scheme">${ICONS.scheme}</slot></button>
				<strong part="title">${this.getAttribute('title') || 'GUI Panel'}</strong>
				<button type="button" part="close"><slot name="close">${ICONS.close}</slot></button>
			</header>
			<div part="content" hidden><slot name="content"></slot></div>
			<footer part="footer" hidden><slot name="footer"></slot></footer>`;

		 ['close', 'content', 'footer', 'scheme', 'title'].forEach(part => {
			this.#parts[part] = this.#root.querySelector(`[part~="${part}"]`);
		});

		// Initialize
		this.addDraggable(this.#parts.title, this);
		this.#parts.scheme.addEventListener('click', () => this.classList.toggle('cs'));
		this.#parts.close.addEventListener('click', () => this.togglePopover(false));
		if (!this.hasAttribute('popover')) this.setAttribute('popover', '');
		if (this.hasAttribute('open')) this.togglePopover(true);
		['content', 'footer'].forEach(name => this.checkSlots(name));
	}

	addDraggable(handle, panel, propX = '--gui-panel-x', propY = '--gui-panel-y') {
		const move = ({ clientX, clientY }) => {
			if (!this.#dragState) return;

			const deltaX = this.#dragState.startX - clientX;
			const deltaY = this.#dragState.startY - clientY;
			
			const newX = Math.min(Math.max(panel.offsetLeft - deltaX, 0), 
				window.innerWidth - panel.offsetWidth);
			const newY = Math.min(Math.max(panel.offsetTop - deltaY, 0), 
				window.innerHeight - panel.offsetHeight);

			panel.style.setProperty(propX, `${newX}px`);
			panel.style.setProperty(propY, `${newY}px`);

			this.#dragState.startX = clientX;
			this.#dragState.startY = clientY;
		};

		handle.addEventListener('pointerdown', e => {
			this.#dragState = {
				startX: e.clientX,
				startY: e.clientY
			};
			handle.setPointerCapture(e.pointerId);
			handle.addEventListener('pointermove', move);
		});

		const endDrag = () => {
			handle.removeEventListener('pointermove', move);
			this.#dragState = null;
		};

		handle.addEventListener('pointerup', endDrag);
		handle.addEventListener('pointercancel', endDrag);
		handle.addEventListener('touchstart', e => e.preventDefault());
	}

	checkSlots(name) {
		const slot = this.#root.querySelector(`slot[name="${name}"]`);
		const update = () => this.#parts[name].hidden = !slot.assignedNodes().length;
		slot.addEventListener('slotchange', update);
		update();
	}
}

customElements.define('gui-panel', GuiPanel);
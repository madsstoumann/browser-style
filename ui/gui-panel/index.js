const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--gui-panel-gap: .5rem;
		--gui-panel-m: 1rem;
		--gui-panel-w: 265px;
		--gui-panel-rz-block: 12px;
		--gui-panel-rz-inline: 6px;

		background: var(--gui-panel-bg, Canvas);
		border: 0;
		border-radius: var(--gui-panel-bdrs, 10px);
		box-shadow: var(--gui-panel-bxsh, 0px 8px 56px 0px color-mix(in srgb, CanvasText, transparent 70%));
		color: var(--gui-panel-c, CanvasText);
		color-scheme:light dark;
		container-type: inline-size;
		font-family: var(--gui-panel-ff, system-ui, sans-serif);
		font-size: var(--gui-panel-fs, 1rem);
		grid-template-columns: var(--gui-panel-rz-inline) 1fr var(--gui-panel-rz-inline);
		grid-template-rows: var(--gui-panel-rz-block-start, var(--gui-panel-rz-inline)) min-content minmax(0, 1fr) var(--gui-panel-rz-block-end, 6px);
		height: var(--gui-panel-h, auto);
		inset-block: var(--gui-panel-y, var(--gui-panel-m)) auto;
		inset-inline: var(--gui-panel-x, calc(100% - var(--gui-panel-w) - var(--gui-panel-m))) auto;
		padding: 0;
		max-height: calc(100dvh - (2 * var(--gui-panel-m)));
		min-height: min-content;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		width: var(--gui-panel-w);
	}
	:host(:popover-open) { display: grid }

	:host::part(icon-button) {
		all: unset;
		border-radius: 50%;
		height: 1.25rem;
		padding: var(--gui-panel-rz-inline);
		width: 1.25rem;
	}
	:host::part(icon-group) {
		display: flex;
	}


	:host::part(content) {
		grid-area: 3 / 1 / 4 / 4;
		padding: 2ch;
		overflow: auto;
	}
	:host::part(header) {
		align-items: center;
		display: grid;
		grid-area: 2 / 2 / 3 / 3;
		grid-template-columns: 1fr 2fr 1fr;
		min-height: min-content;
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
		text-align: center;
	}

	/* position */
	:host([position~="bottom"]) { 
		inset-block: var(--gui-panel-y, calc(100dvh - var(--gui-panel-h) - var(--gui-panel-m))) auto;
	}
	:host([position~="center"]) {
		inset-inline: var(--gui-panel-x, calc(50vw - (var(--gui-panel-w) / 2))) auto;
	} 
	:host([position~="left"]) {
		inset-inline: var(--gui-panel-x, var(--gui-panel-m)) auto;
	}

	/* resize */
	:host::part(resize-block-start),
	:host::part(resize-block-end) {
		block-size: 0;
		cursor: ns-resize;
		display: grid;
		justify-items: center;
		overflow: clip;
	}
	:host::part(resize-block-start)::before {
		align-self: end;
	}
	:host::part(resize-block-start)::before,
	:host::part(resize-block-end)::before {
		background: #CCC8;
		border-radius: 40px;
		content: '';
		height: calc(var(--gui-panel-rz-block) / 2);
		width: 80px;
	}
	:host::part(resize-block-start) {
		grid-area: 1 / 1 / 2 / 4;
		place-self: start center;
	}
	:host::part(resize-block-end) {
		grid-area: 4 / 1 / 5 / 4;
		place-self: end center;
	}
	:host([resize~="block-end"]) { --gui-panel-rz-block-end: var(--gui-panel-rz-block); }
	:host([resize~="block-end"]):host::part(resize-block-end) { block-size: var(--gui-panel-rz-block); }
	:host([resize~="block-start"]) { --gui-panel-rz-block-start: var(--gui-panel-rz-block); }
	:host([resize~="block-start"]):host::part(resize-block-start) { block-size: var(--gui-panel-rz-block); }

	:host([resize~="inline-start"]):host::part(resize-inline-start),
	:host([resize~="inline-end"]):host::part(resize-inline-end) {
		cursor: ew-resize;
	}
	:host::part(resize-inline-start) { grid-area: 1 / 1 / 4 / 2; }
	:host::part(resize-inline-end) { grid-area: 1 / 3 / 4 / 4; }

	/* media */
	@media (prefers-color-scheme: light) {
		:host(.cs) { color-scheme: dark; }
	}
	@media (prefers-color-scheme: dark) {
		:host(.cs) { color-scheme: light; }
	}
	@media (hover:hover) {
		:host::part(icon-button):hover { background: #CCC4; }
	}
`);

const ICONS = {
	close : `<svg part="icon" viewBox="0 0 24 24"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>`,
	scheme: `<svg part="icon" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 3l0 18" /><path d="M12 9l4.65 -4.65" /><path d="M12 14.3l7.37 -7.37" /><path d="M12 19.6l8.85 -8.85" /></svg>`,
	sidebar: `<svg part="icon" viewBox="0 0 24 24"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M15 4l0 16" /></svg>`
}

export default class GuiPanel extends HTMLElement {
	#root;
	#parts = {};
	#dragState = null;
	#resizeState = null;

	constructor() {
		super();
		this.id = `gui-${Math.random().toString(36).slice(2, 7)}`;
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
		this.#root.innerHTML = `
			<header part="header">
				<nav part="icon-group">
					<button type="button" part="icon-button scheme">
						<slot name="scheme">${ICONS.scheme}</slot>
					</button>
				</nav>
				<strong part="title">${this.getAttribute('title') || 'GUI Panel'}</strong>
				<nav part="icon-group">
					<button type="button" part="icon-button sidebar">
						<slot name="sidebar">${ICONS.sidebar}</slot>
					</button>
					<button type="button" part="icon-button close">
						<slot name="close">${ICONS.close}</slot>
					</button>
				</nav>
			</header>
			<div part="content" hidden>
				<slot name="content"></slot>
			</div>
			<div part="resize-block-start"></div>
			<div part="resize-block-end"></div>
			<div part="resize-inline-start"></div>
			<div part="resize-inline-end"></div>
				`;

		 ['close', 'content', 'footer', 'scheme', 'title'].forEach(part => {
			this.#parts[part] = this.#root.querySelector(`[part~="${part}"]`);
		});

		// Initialize
		this.addDraggable(this.#parts.title, this);
		this.#parts.scheme.addEventListener('click', () => this.classList.toggle('cs'));
		this.#parts.close.addEventListener('click', () => this.togglePopover(false));
		if (!this.hasAttribute('popover')) this.setAttribute('popover', '');
		if (this.hasAttribute('open')) this.togglePopover(true);
		['content'].forEach(name => this.checkSlots(name));
	}

	connectedCallback() {
		// Set initial height once mounted
		requestAnimationFrame(() => {
			const height = this.offsetHeight;
			this.style.setProperty('--gui-panel-h', `${height}px`);
		});

		if (this.hasAttribute('resize')) {
			// Get enabled resize handlers from attribute
			const resizeAttr = this.getAttribute('resize').split(/\s+/);
			const enabledHandlers = new Set(resizeAttr.map(dir => `resize-${dir}`));

			// Only initialize specified handlers
			['resize-block-start', 'resize-block-end', 'resize-inline-start', 'resize-inline-end']
				.filter(part => enabledHandlers.has(part))
				.forEach(part => {
					const el = this.#root.querySelector(`[part="${part}"]`);
					this.addResizeHandler(el, part.includes('inline') ? 'inline' : 'block');
				});
		}
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

	/**
	 * Adds resize functionality to a handle element
	 * @param {HTMLElement} handle - The resize handle element
	 * @param {string} type - Either 'inline' (width) or 'block' (height)
	 */
	addResizeHandler(handle, type) {
		const move = ({ clientX, clientY }) => {
			if (!this.#resizeState) return;

			const isRTL = getComputedStyle(this).direction === 'rtl';
			const delta = type === 'inline' 
				? clientX - this.#resizeState.startX 
				: clientY - this.#resizeState.startY;

			let newSize;
			// For RTL, swap start/end behavior for inline resizing
			const isStart = this.#resizeState.edge === 'start';
			const effectiveIsStart = type === 'inline' && isRTL ? !isStart : isStart;

			if (effectiveIsStart) {
				newSize = this.#resizeState.startSize - delta;
				if (type === 'inline') {
					const currentRight = this.#resizeState.startRight;
					this.style.setProperty('--gui-panel-x', `${currentRight - newSize}px`);
				} else {
					const currentBottom = this.#resizeState.startBottom;
					this.style.setProperty('--gui-panel-y', `${currentBottom - newSize}px`);
				}
			} else {
				newSize = this.#resizeState.startSize + delta;
			}

			// Apply size constraints and update
			const prop = type === 'inline' ? '--gui-panel-w' : '--gui-panel-h';
			const minSize = type === 'inline' ? 200 : 100;
			const maxSize = type === 'inline' 
				? window.innerWidth - 40
				: window.innerHeight - 40;

			if (newSize >= minSize && newSize <= maxSize) {
				this.style.setProperty(prop, `${newSize}px`);
			}
		};

		handle.addEventListener('pointerdown', e => {
			// Store initial state when resize starts:
			// - Current size and pointer position
			// - Right/bottom positions for start-edge resizing
			const rect = this.getBoundingClientRect();
			this.#resizeState = {
				edge: handle.getAttribute('part').split('-').pop(),
				startX: e.clientX,
				startY: e.clientY,
				startSize: type === 'inline' ? rect.width : rect.height,
				startRight: rect.right,
				startBottom: rect.bottom
			};
			handle.setPointerCapture(e.pointerId);
			handle.addEventListener('pointermove', move);
		});

		const endResize = () => {
			handle.removeEventListener('pointermove', move);
			this.#resizeState = null;
		};

		handle.addEventListener('pointerup', endResize);
		handle.addEventListener('pointercancel', endResize);
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
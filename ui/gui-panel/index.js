const cssStyles = new CSSStyleSheet();
const response = await fetch('./index.css');
const cssText = await response.text();
cssStyles.replaceSync(cssText);

const icon = paths => `<svg part="icon" viewBox="0 0 24 24">${
	paths.map(d => `<path d="${d}" />`).join('')
}</svg>`;

const ICONS = {
	close: ['M18 6l-12 12', 'M6 6l12 12'],
	scheme: [
		'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
		'M12 3l0 18',
		'M12 9l4.65 -4.65',
		'M12 14.3l7.37 -7.37',
		'M12 19.6l8.85 -8.85'
	],
	sidebar: [
		'M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z',
		'M15 4l0 16'
	],
	external: ['M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6', 'M11 13l9 -9', 'M15 4h5v5']
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
		this.#root.adoptedStyleSheets = [cssStyles];
		this.#root.innerHTML = `
			<header part="header">
				<nav part="icon-group">
					<button type="button" part="icon-button scheme">
						<slot name="scheme">${icon(ICONS.scheme)}</slot>
					</button>
				</nav>
				<strong part="title">${this.getAttribute('title') || 'GUI Panel'}</strong>
				<nav part="icon-group">
					<button type="button" part="icon-button sidebar">
						<slot name="external">${icon(ICONS.external)}</slot>
						<slot name="sidebar">${icon(ICONS.sidebar)}</slot>
					</button>
					<button type="button" part="icon-button close">
						<slot name="close">${icon(ICONS.close)}</slot>
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

		 ['close', 'content', 'footer', 'scheme', 'sidebar', 'title'].forEach(part => {
			this.#parts[part] = this.#root.querySelector(`[part~="${part}"]`);
		});

		// Initialize
		this.addDraggable(this.#parts.title, this);
		this.#parts.scheme.addEventListener('click', () => this.classList.toggle('cs'));

		this.#parts.sidebar.addEventListener('click', () => {
			if (this.hasAttribute('popover')) {
				this.removeAttribute('popover');
			} else {
				const popoverType = this.hasAttribute('dismiss') ? 'auto' : 'manual';
				this.setAttribute('popover', popoverType);
				this.togglePopover(true);
			}
		});
		this.#parts.close.addEventListener('click', () => this.togglePopover(false));
		
		// Set initial popover type
		if (!this.hasAttribute('popover')) {
			this.setAttribute('popover', this.hasAttribute('dismiss') ? 'auto' : 'manual');
		}
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
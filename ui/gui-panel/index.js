const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());

const DOCKED_WIDTH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gui-panel-docked-w')) || 220;
const DOCKED_MAX_WIDTH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gui-panel-docked-mw')) || 500;
const POPOVER_WIDTH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gui-panel-popover-w')) || 265;
const MIN_PANEL_HEIGHT = 100;
const THROTTLE_DELAY = 100;

const icon = paths => `<svg part="icon" viewBox="0 0 24 24">${paths.map(d => `<path d="${d}" />`).join('')}</svg>`;
const throttle = (fn, delay) => {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
};

const ICONS = {
	close: ['M18 6l-12 12', 'M6 6l12 12'],
	externalend: ['M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6', 'M11 13l9 -9', 'M15 4h5v5'],
	externalstart: ['M12 6h6a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6', 'M13 13l-9 -9', 'M9 4h-5v5'],
	reset: ['M3.06 13a9 9 0 1 0 .49 -4.087','M3 4.001v5h5'],
	scheme: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 3l0 18', 'M12 9l4.65 -4.65', 'M12 14.3l7.37 -7.37', 'M12 19.6l8.85 -8.85'],
	sidebarend: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M15 4l0 16'],
	sidebarstart: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M9 4l0 16']
};

export default class GuiPanel extends HTMLElement {
	#root; #parts = {}; #dragState = null; #resizeState = null;

	get isDocked() {
		return !this.hasAttribute('popover');
	}

	constructor() {
		super();
		const useShadow = !this.hasAttribute('noshadow');
		this.#root = useShadow ? this.attachShadow({mode: 'open'}) : this;

		if (useShadow) {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(styles);
			this.#root.adoptedStyleSheets = [sheet];
		} else {
			document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);
		}

		const dock = this.getAttribute('dock') || '';
		const content = useShadow ? 
			`<slot></slot>` : 
			this.innerHTML && !this.querySelector('[slot]') ? this.innerHTML : '';

		this.id ||= `gui-${Math.random().toString(36).slice(2, 7)}`;
		const resetButton = `<button part="icon-button reset"${this.hasAttribute('reset') ? '': ' hidden'}><slot name="reset">${icon(ICONS.reset)}</slot></button>`;

		this.#root.innerHTML = `
			<header part="header ${dock}">
				<nav part="icon-group">
					<button part="icon-button scheme"${this.hasAttribute('scheme') ? '' : ' hidden'}>
						<slot name="scheme">${icon(ICONS.scheme)}</slot>
					</button>
						${(dock === 'end' || dock === '') ? resetButton : ''}
					<button part="icon-button sidebarstart"${dock === 'start' ? '' : ' hidden'}>
						<slot name="externalstart">${icon(ICONS.externalstart)}</slot>
						<slot name="sidebarstart">${icon(ICONS.sidebarstart)}</slot>
					</button>
				</nav>
				<strong part="heading">${this.getAttribute('heading') || '⋮⋮ GUI Panel ⋮⋮'}</strong>
				<nav part="icon-group">
					${dock === 'start' ? resetButton : ''}
					<button part="icon-button sidebarend"${dock === 'end' ? '' : ' hidden'}>
						<slot name="externalend">${icon(ICONS.externalend)}</slot>
						<slot name="sidebarend">${icon(ICONS.sidebarend)}</slot>
					</button>
					<button part="icon-button close">
						<slot name="close">${icon(ICONS.close)}</slot>
					</button>
				</nav>
			</header>
			<div part="content">${content}</div>
			<div part="resize-block-start"></div>
			<div part="resize-block-end"></div>
			<div part="resize-inline-start"></div>
			<div part="resize-inline-end"></div>`;

		['close', 'heading', 'scheme', 'reset', 'sidebarend', 'sidebarstart'].forEach(part => 
			this.#parts[part] = this.#root.querySelector(`[part~="${part}"]`)
		);

		this.addDraggable(this.#parts.heading, this);
		this.#parts.scheme.addEventListener('click', () => this.classList.toggle('cs'));

		const toggleSidebar = () => {
			if (this.hasAttribute('popover')) {
				this.removeAttribute('popover');
				this.style.setProperty('--gui-panel-w', `${DOCKED_WIDTH}px`);
			} else {
				this.setHeightBasedOnPosition('auto');
				this.setAttribute('popover', this.hasAttribute('dismiss') ? 'auto' : 'manual');
				this.offsetHeight; // Force reflow
				this.style.setProperty('--gui-panel-w', `${POPOVER_WIDTH}px`); // Reset width for popover mode
				this.handlePopoverToggle(true);
			}
		};

		this.#parts.reset.addEventListener('click', () => {
			const panelHeight = this.style.getPropertyValue('--gui-panel-h');
			this.removeAttribute('style');
			this.setHeightBasedOnPosition('auto', panelHeight);
		});

		this.#parts.sidebarend.addEventListener('click', toggleSidebar);
		this.#parts.sidebarstart.addEventListener('click', toggleSidebar);

		this.#parts.close.addEventListener('click', () => {
			if (this.hasAttribute('docked')) {
				if (this.hasAttribute('popover')) {
					this.removeAttribute('popover');
					this.style.setProperty('--gui-panel-w', `${DOCKED_WIDTH}px`);
				} else {
					this.setAttribute('popover', this.hasAttribute('dismiss') ? 'auto' : 'manual');
					this.offsetHeight; // Force reflow
					this.handlePopoverToggle(true);
				}
			} else {
				this.handlePopoverToggle(false);
			}
		});

		if (!this.hasAttribute('popover') && !this.hasAttribute('docked'))
			this.setAttribute('popover', this.hasAttribute('dismiss') ? 'auto' : 'manual');

		if (this.hasAttribute('docked')) {
			this.style.setProperty('--gui-panel-w', `${DOCKED_WIDTH}px`);
		}

		if (this.hasAttribute('open')) 
			this.handlePopoverToggle(true);

		this._constrainFn = () => this.constrainToViewport();
		this._resizeObserver = throttle(this._constrainFn, THROTTLE_DELAY);
		window.addEventListener('resize', this._resizeObserver);
	}

	connectedCallback() {
		requestAnimationFrame(() => {
			this.style.setProperty('--gui-panel-h', `${this.offsetHeight}px`);
			this.constrainToViewport();
		});

		if (this.hasAttribute('resize')) {
			const enabledHandlers = new Set(
				this.getAttribute('resize').split(/\s+/).map(dir => `resize-${dir}`)
			);

			['resize-block-start', 'resize-block-end', 'resize-inline-start', 'resize-inline-end']
				.filter(part => enabledHandlers.has(part))
				.forEach(part => this.addResizeHandler(
					this.#root.querySelector(`[part="${part}"]`),
					part.includes('inline') ? 'inline' : 'block'
				));
		}
	}

	disconnectedCallback() {
		if (this._resizeObserver) {
			window.removeEventListener('resize', this._resizeObserver);
		}
	}

	constrainToViewport() {
		if (!this.isConnected || this.getAttribute('popover') !== 'manual' || !this.matches(':popover-open')) {
			return;
		}

		const rect = this.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let width = parseInt(this.style.getPropertyValue('--gui-panel-w')) || rect.width;
		let height = parseInt(this.style.getPropertyValue('--gui-panel-h')) || rect.height;

		if (width > viewportWidth) {
			this.style.setProperty('--gui-panel-w', `${Math.max(DOCKED_WIDTH, viewportWidth)}px`);
		}
		
		if (height > viewportHeight) {
			this.style.setProperty('--gui-panel-h', `${Math.max(MIN_PANEL_HEIGHT, viewportHeight)}px`);
		}

		const hasCustomX = this.style.getPropertyValue('--gui-panel-x') !== '';
		const hasCustomY = this.style.getPropertyValue('--gui-panel-y') !== '';
		
		if (hasCustomX) {
			const x = parseInt(this.style.getPropertyValue('--gui-panel-x'));
			if (x < 0 || x + rect.width > viewportWidth) {
				const newX = Math.max(0, Math.min(x, viewportWidth - rect.width));
				this.style.setProperty('--gui-panel-x', `${newX}px`);
			}
		}
		
		if (hasCustomY) {
			const y = parseInt(this.style.getPropertyValue('--gui-panel-y'));
			if (y < 0 || y + rect.height > viewportHeight) {
				const newY = Math.max(0, Math.min(y, viewportHeight - rect.height));
				this.style.setProperty('--gui-panel-y', `${newY}px`);
			}
		}
	}

	addDraggable(handle, panel, propX = '--gui-panel-x', propY = '--gui-panel-y') {
		const move = e => {
			if (!this.#dragState) return;

			const {clientX, clientY} = e;
			const {startX, startY} = this.#dragState;

			panel.style.setProperty(propX, `${Math.max(0, Math.min(
				panel.offsetLeft - (startX - clientX),
				window.innerWidth - panel.offsetWidth
			))}px`);

			panel.style.setProperty(propY, `${Math.max(0, Math.min(
				panel.offsetTop - (startY - clientY),
				window.innerHeight - panel.offsetHeight
			))}px`);

			// Update start position for next move
			Object.assign(this.#dragState, {startX: clientX, startY: clientY});
		};

		handle.addEventListener('pointerdown', e => {
			this.#dragState = {startX: e.clientX, startY: e.clientY};
			handle.setPointerCapture(e.pointerId);
			handle.addEventListener('pointermove', move);

			const endDrag = () => {
				handle.removeEventListener('pointermove', move);
				this.#dragState = null;
			};

			handle.addEventListener('pointerup', endDrag, {once: true});
			handle.addEventListener('pointercancel', endDrag, {once: true});
		});

		handle.addEventListener('touchstart', e => {
			if (e.cancelable) { e.preventDefault() }
		}, { passive: false });
	}

	addResizeHandler(handle, type) {
		const move = e => {
			if (!this.#resizeState) return;

			const {clientX, clientY, startX, startY, edge, startSize, startRight, startBottom} = this.#resizeState;
			const delta = type === 'inline' ? e.clientX - startX : e.clientY - startY;
			const isStart = edge === 'start';
			let newSize = isStart ? startSize - delta : startSize + delta;

			const minSize = type === 'inline' ? DOCKED_WIDTH : MIN_PANEL_HEIGHT;
			const maxSize = type === 'inline' ? 
				(this.isDocked ? DOCKED_MAX_WIDTH : window.innerWidth) : 
				window.innerHeight;

			newSize = Math.max(minSize, Math.min(newSize, maxSize));

			if (isStart) {
				if (type === 'inline') {
					this.style.setProperty('--gui-panel-x', `${startRight - newSize}px`);
				} else {
					const newY = startBottom - newSize;
					this.style.setProperty('--gui-panel-y', `${Math.max(0, newY)}px`);
				}
			} else if (type === 'block') {
				const currentTop = this.getBoundingClientRect().top;
				const maxHeight = window.innerHeight - currentTop;
				newSize = Math.min(newSize, maxHeight);
			}

			this.style.setProperty(`--gui-panel-${type === 'inline' ? 'w' : 'h'}`, `${newSize}px`);
		};

		handle.addEventListener('pointerdown', e => {
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

			const endResize = () => {
				handle.removeEventListener('pointermove', move);
				this.#resizeState = null;
				this.constrainToViewport();
			};

			handle.addEventListener('pointerup', endResize, {once: true});
			handle.addEventListener('pointercancel', endResize, {once: true});
		});

		handle.addEventListener('touchstart', e => {
			if (e.cancelable) { e.preventDefault(); }
		}, { passive: false });
	}

	handlePopoverToggle(force) {
		const wasOpen = this.matches(':popover-open');
		if (force === true) {
			this.showPopover();
		} else if (force === false) {
			this.hidePopover();
		} else {
			if (wasOpen) {
				this.hidePopover();
			} else {
				this.showPopover();
			}
		}

		if (!wasOpen && force !== false) {
			requestAnimationFrame(() => this.constrainToViewport());
		}
	}

	// Helper method to set height based on position attribute
	setHeightBasedOnPosition(defaultHeight = 'auto', preservedHeight = null) {
		const position = this.getAttribute('position') || '';
		if (position.includes('bottom') && preservedHeight) {
			// For bottom-positioned panels, preserve specific height if available
			this.style.setProperty('--gui-panel-h', preservedHeight);
		} else if (!position.includes('bottom')) {
			// For non-bottom panels, use default height (typically 'auto')
			this.style.setProperty('--gui-panel-h', defaultHeight);
		}
	}
}

customElements.define('gui-panel', GuiPanel);
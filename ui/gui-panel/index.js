const styles = await fetch('./index.css').then(r => r.text());
const icon = paths => `<svg part="icon" viewBox="0 0 24 24">${paths.map(d => `<path d="${d}" />`).join('')}</svg>`;

const ICONS = {
	close: ['M18 6l-12 12', 'M6 6l12 12'],
	externalend: ['M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6', 'M11 13l9 -9', 'M15 4h5v5'],
	externalstart: ['M12 6h6a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6', 'M13 13l-9 -9', 'M9 4h-5v5'],
	scheme: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 3l0 18', 'M12 9l4.65 -4.65', 'M12 14.3l7.37 -7.37', 'M12 19.6l8.85 -8.85'],
	sidebarend: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M15 4l0 16'],
	sidebarstart: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M9 4l0 16']
};

export default class GuiPanel extends HTMLElement {
	#root; #parts = {}; #dragState = null; #resizeState = null;

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
			`<slot name="content"></slot>` : 
			this.querySelector('[slot="content"]')?.innerHTML || '';

		this.id ||= `gui-${Math.random().toString(36).slice(2, 7)}`;

		this.#root.innerHTML = `
			<header part="header">
				<nav part="icon-group">
					<button part="icon-button scheme"${this.hasAttribute('noscheme') ? ' hidden' : ''}>
						<slot name="scheme">${icon(ICONS.scheme)}</slot>
					</button>
					<button part="icon-button sidebarstart"${dock === 'start' ? '' : ' hidden'}>
						<slot name="externalstart">${icon(ICONS.externalstart)}</slot>
						<slot name="sidebarstart">${icon(ICONS.sidebarstart)}</slot>
					</button>
				</nav>
				<strong part="title">${this.getAttribute('title') || 'GUI Panel'}</strong>
				<nav part="icon-group jc-end">
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

		['close', 'scheme', 'sidebarend', 'sidebarstart', 'title'].forEach(part => 
			this.#parts[part] = this.#root.querySelector(`[part~="${part}"]`)
		);

		this.addDraggable(this.#parts.title, this);
		this.#parts.scheme.addEventListener('click', () => this.classList.toggle('cs'));

		const toggleSidebar = () => {
			if (this.hasAttribute('popover')) {
				this.removeAttribute('popover');
			} else {
				this.setAttribute('popover', this.hasAttribute('dismiss') ? 'auto' : 'manual');
				this.offsetHeight; // Force reflow
				this.togglePopover(true);
			}
		};

		this.#parts.sidebarend.addEventListener('click', toggleSidebar);
		this.#parts.sidebarstart.addEventListener('click', toggleSidebar);
		this.#parts.close.addEventListener('click', () => this.togglePopover(false));

		if (!this.hasAttribute('popover'))
			this.setAttribute('popover', this.hasAttribute('dismiss') ? 'auto' : 'manual');
		
		if (this.hasAttribute('open')) 
			this.togglePopover(true);
	}

	connectedCallback() {
		requestAnimationFrame(() => 
			this.style.setProperty('--gui-panel-h', `${this.offsetHeight}px`)
		);

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

		handle.addEventListener('touchstart', e => e.preventDefault());
	}

	addResizeHandler(handle, type) {
		const move = e => {
			if (!this.#resizeState) return;

			const {clientX, clientY, startX, startY, edge, startSize, startRight, startBottom} = this.#resizeState;
			const delta = type === 'inline' ? e.clientX - startX : e.clientY - startY;
			const isStart = edge === 'start';
			let newSize = isStart ? startSize - delta : startSize + delta;

			const minSize = type === 'inline' ? 200 : 100;
			const maxSize = type === 'inline' ? window.innerWidth : window.innerHeight;
			newSize = Math.max(minSize, Math.min(newSize, maxSize));

			if (isStart) {
				if (type === 'inline') {
					this.style.setProperty('--gui-panel-x', `${startRight - newSize}px`);
				} else {
					this.style.setProperty('--gui-panel-y', `${startBottom - newSize}px`);
				}
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
			};

			handle.addEventListener('pointerup', endResize, {once: true});
			handle.addEventListener('pointercancel', endResize, {once: true});
		});

		handle.addEventListener('touchstart', e => e.preventDefault());
	}
}

customElements.define('gui-panel', GuiPanel);
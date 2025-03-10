/**
 * @module gui-panel
 * @description A customizable, resizable panel component that can be used as a sidebar or popover.
 * Supports docking, dragging, resizing, and theme switching functionality.
 * @version 1.0.3
 * @date 2025-03-10
 * @author Mads Stoumann
 * @license MIT
 */
import { renderIconButton, iconStyles, icoArrowsLeftRight, icoBrightness, icoClose, icoExternalLink, icoInternalLink, icoReset } from '../gui-icon/index.js';
const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());
const MIN_PANEL_HEIGHT = 100;
const SCHEME_CLASS = 'cs';
const THROTTLE_DELAY = 100;

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

export default class GuiPanel extends HTMLElement {
	#root; #parts = {}; #dragState = null; #resizeState = null; 
	#DOCKED_WIDTH; #DOCKED_MIN_WIDTH; #DOCKED_MAX_WIDTH; #POPOVER_WIDTH;
	#CURRENT_DOCKED_WIDTH; #CURRENT_POPOVER_WIDTH;
	#i18n = {
		en: {
			close: 'Close',
			closeDock: 'Redock panel',
			detachPanel: 'Detach panel',
			heading: '⋮⋮ GUI Panel ⋮⋮',
			resetPosition: 'Reset position',
			toggleColorScheme: 'Toggle Color Scheme',
			toggleExpand: 'Toggle between min/max width',
		}
	};
	
	#has(name) { return this.hasAttribute(name); }
	#t(key, lang = 'en') {
		return (this.#i18n[lang] && this.#i18n[lang][key]) || this.#i18n.en[key] || key;
	}

	get dockPosition() { return this.getAttribute('dock')?.replace('fixed-', '') || ''; }
	get hasDismiss() { return this.#has('dismiss'); }
	get hasExpand() { return this.#has('expand'); }
	get hasOpen() { return this.#has('open'); }
	get hasReset() { return this.#has('reset'); }
	get isDockable() { return this.#has('dock'); }
	get isDocked() { return !this.isUndocked; }
	get isFixed() { return this.getAttribute('dock')?.startsWith('fixed-') || false; }
	get isUndocked() { return this.#has('popover'); }
	get showScheme() { return this.#has('scheme'); }

	constructor() {
		super();
		this.#root = this.attachShadow({mode: 'open'});
		const iconSheet = new CSSStyleSheet();
		iconSheet.replaceSync(iconStyles);

		const panelSheet = new CSSStyleSheet();
		panelSheet.replaceSync(styles);
		this.#root.adoptedStyleSheets = [panelSheet, iconSheet];

		this.id ||= `gui-panel-${Math.random().toString(36).slice(2, 7)}`;

		this.#DOCKED_WIDTH = parseInt(getComputedStyle(this).getPropertyValue('--gui-panel-docked-w')) || 220;
		this.#DOCKED_MAX_WIDTH = parseInt(getComputedStyle(this).getPropertyValue('--gui-panel-docked-maw')) || 500;
		this.#DOCKED_MIN_WIDTH = parseInt(getComputedStyle(this).getPropertyValue('--gui-panel-docked-miw')) || 75;
		this.#POPOVER_WIDTH = parseInt(getComputedStyle(this).getPropertyValue('--gui-panel-popover-w')) || 265;
		this.#CURRENT_DOCKED_WIDTH = this.#DOCKED_WIDTH;
		this.#CURRENT_POPOVER_WIDTH = this.#POPOVER_WIDTH;

		const dockPos = this.dockPosition;
		const undockIcon = dockPos === 'start' ? icoInternalLink : icoExternalLink;

		this.#root.innerHTML = `
			<header part="header ${dockPos}">
				<nav part="icon-group">
					${renderIconButton(icoBrightness, this.#t('toggleColorScheme'), 'scheme', !(this.showScheme && this.isUndocked))}
					${renderIconButton(icoReset, this.#t('resetPosition'), 'reset', !this.hasReset)}
					${dockPos === 'start' && !this.isFixed ? renderIconButton(undockIcon, this.#t('detachPanel'), 'undock', !this.isDockable) : ''}
					${dockPos === 'start' && !this.isFixed ? renderIconButton(icoArrowsLeftRight, this.#t('toggleExpand'), 'expand', !(this.isDockable && this.hasExpand)) : ''}
				</nav>
				<strong part="heading">${this.getAttribute('heading') || this.#t('heading')}</strong>
				<nav part="icon-group">
					${dockPos === 'end' && !this.isFixed ? renderIconButton(icoArrowsLeftRight, this.#t('toggleExpand'), 'expand', !(this.isDockable && this.hasExpand)) : ''}
					${dockPos === 'end' && !this.isFixed ? renderIconButton(undockIcon, this.#t('detachPanel'), 'undock', !this.isDockable) : ''}
					${renderIconButton(icoClose, this.#t(this.isDockable ? 'closeDock' : 'close'), 'close')}
				</nav>
			</header>
			<div part="content"><slot></slot></div>
			<div part="resize-block-start"></div>
			<div part="resize-block-end"></div>
			<div part="resize-inline-start"></div>
			<div part="resize-inline-end"></div>`;

		['close', 'expand', 'heading', 'reset', 'scheme', 'undock'].forEach(part => 
			this.#parts[part] = this.#root.querySelector(`[part~="${part}"]`)
		);

		/* Event listeners */
		if (this.hasAttribute('draggable')) {
			this.addDraggable(this.#parts.heading, this);
		}

		this.#parts.scheme.addEventListener('click', () => this.classList.toggle(SCHEME_CLASS));

		const toggleSidebar = () => {
			this.switchPanelMode(this.isUndocked);
		};

		this.#parts.reset.addEventListener('click', () => {
			const panelHeight = this.style.getPropertyValue('--gui-panel-h');
			this.removeAttribute('style');
			this.setHeightBasedOnPosition('auto', panelHeight);
		});

		if (this.#parts.expand) {
			this.#parts.expand.addEventListener('click', () => {
				let currentWidth = parseInt(this.style.getPropertyValue('--gui-panel-w')) || this.#CURRENT_DOCKED_WIDTH;
				if (currentWidth >= this.#DOCKED_MAX_WIDTH) {
					currentWidth = this.#DOCKED_MIN_WIDTH;
				} else if (currentWidth <= this.#DOCKED_MIN_WIDTH) {
					currentWidth = this.#CURRENT_DOCKED_WIDTH;
				} else {
					currentWidth = this.#DOCKED_MAX_WIDTH;
				}
				this.style.setProperty('--gui-panel-w', `${currentWidth}px`);
			});
		}

		if (this.#parts.undock) {
			this.#parts.undock.addEventListener('click', toggleSidebar);
		}

		this.#parts.close.addEventListener('click', () => {
			if (this.isDockable) {
				if (this.isUndocked) {
					this.switchPanelMode(true, { hideScheme: true });
				} else {
					this.switchPanelMode(false);
				}
			} else {
				this.handlePopoverToggle(false);
			}
		});

		if (!this.isUndocked && !this.isDockable) {
			this.setAttribute('popover', this.hasDismiss ? 'auto' : 'manual');
		} else if (!this.isFixed && this.hasOpen) {
			this.setAttribute('popover', this.hasDismiss ? 'auto' : 'manual');
		}

		if (this.isDocked) {
			this.style.setProperty('--gui-panel-w', `${this.#DOCKED_WIDTH}px`);
		}

		if (this.hasOpen) {
			this.handlePopoverToggle(true);
			if (this.showScheme) this.#parts.scheme.hidden = false;
		}

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
			this.style.setProperty('--gui-panel-w', `${Math.max(this.#DOCKED_WIDTH, viewportWidth)}px`);
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

			const minSize = type === 'inline' ? this.#DOCKED_MIN_WIDTH : MIN_PANEL_HEIGHT;
			const maxSize = type === 'inline' ? 
				(this.isDocked ? this.#DOCKED_MAX_WIDTH : window.innerWidth) : 
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

			if (type === 'inline') {
				if (this.isDocked) {
					this.#CURRENT_DOCKED_WIDTH = newSize;
				} else {
					this.#CURRENT_POPOVER_WIDTH = newSize;
				}
			}
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
				this.style.removeProperty('transition');
				this.constrainToViewport();
			};

			handle.addEventListener('pointerup', endResize, {once: true});
			handle.addEventListener('pointercancel', endResize, {once: true});
			this.style.transition = 'none';
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

	setHeightBasedOnPosition(defaultHeight = 'auto', preservedHeight = null) {
		const position = this.getAttribute('position') || '';
		if (position.includes('bottom') && preservedHeight) {
			this.style.setProperty('--gui-panel-h', preservedHeight);
		} else if (!position.includes('bottom')) {
			this.style.setProperty('--gui-panel-h', defaultHeight);
		}
	}

	switchPanelMode(toDocked, options = {}) {
		const { hideScheme = false } = options;

		if (toDocked) {
			if (hideScheme) this.#parts.scheme.hidden = true;
			this.classList.remove(SCHEME_CLASS);
			this.removeAttribute('popover');
			this.style.setProperty('--gui-panel-w', `${this.#CURRENT_DOCKED_WIDTH}px`);
		} else {
			if (!hideScheme) this.#parts.scheme.hidden = !this.showScheme;
			this.setHeightBasedOnPosition('auto');
			this.setAttribute('popover', this.hasDismiss ? 'auto' : 'manual');
			this.offsetHeight;
			this.style.setProperty('--gui-panel-w', `${this.#CURRENT_POPOVER_WIDTH}px`);
			this.handlePopoverToggle(true);
		}
		this.dispatchEvent(new CustomEvent('gui-panel-mode', { 
			detail: { docked: toDocked, position: this.dockPosition },
			bubbles: true,
			composed: true
		}));
	}
}

customElements.define('gui-panel', GuiPanel);
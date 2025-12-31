/**
 * xy
 * @version 1.0.15
 * @summary 24-04-2024
 * @author Mads Stoumann
 * @description XY Controller
 */
export default class xyController extends HTMLElement {
	static observedAttributes = ['x', 'y'];
	constructor() {
		super();
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' })
		shadow.adoptedStyleSheets = [stylesheet];
		this.point = document.createElement('button');
		this.point.inert = true;
		this.point.part = 'xypoint';
		shadow.appendChild(this.point);
		this.tabIndex = 0;

		this.active = false;
		this.settings = {
			gridX: parseInt(this.getAttribute('grid-x')) || 0,
			gridY: parseInt(this.getAttribute('grid-y')) || 0,
			leave: this.getAttribute('leave') !== null ? this.getAttribute('leave') === 'true' : true,
			minX: parseInt(this.getAttribute('min-x')) || 0,
			maxX: parseInt(this.getAttribute('max-x')) || 100,
			minY: parseInt(this.getAttribute('min-y')) || 0,
			maxY: parseInt(this.getAttribute('max-y')) || 100,
			shift: parseInt(this.getAttribute('shift')) || 10,
			x: parseInt(this.getAttribute('x')) || 0,
			y: parseInt(this.getAttribute('y')) || 100
		};

		this.style.setProperty('--xy-grid-x', this.settings.gridX);
		this.style.setProperty('--xy-grid-y', this.settings.gridY);
		this.difX = this.settings.maxX - this.settings.minX;
		this.difY = this.settings.maxY - this.settings.minY;
		this.x = this.settings.x;
		this.y = this.settings.y;

		this.addEventListener('keydown', this.keymove.bind(this));
		this.addEventListener('pointerdown', this.down.bind(this));
		if (this.settings.leave) this.addEventListener('pointerleave', () => this.dispatchEvent(new Event('pointerup')));
		this.addEventListener('pointermove', this.move.bind(this));
		this.addEventListener('pointerup', this.up.bind(this));

		this.ro = new ResizeObserver(() => {
			this.refresh();
			this.xyset(this.x, this.y);
			this.update();
		});
		this.ro.observe(this);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'x') { this.x = newValue; }
		if (name === 'y') { this.y = newValue; }
	}

	keymove(e) {
		let valX = e.shiftKey ? e.altKey ? 1 : this.settings.shift * this.ratioX : this.ratioX;
		const valY = e.shiftKey ? e.altKey ? 1 : this.settings.shift * this.ratioY : this.ratioY;
		let x = this.style.getPropertyValue('--tx') - 0;
		let y = this.style.getPropertyValue('--ty') - 0;
		if (e.key !== 'Tab') e.preventDefault();

		switch (e.key) {
			case 'ArrowDown': y += this.snapY ? this.snapY : valY; break;
			case 'ArrowLeft': x -= this.snapX ? this.snapX : valX; break;
			case 'ArrowRight': x += this.snapX ? this.snapX : valX; break;
			case 'ArrowUp': y -= this.snapY ? this.snapY : valY; break;
			case 'End': if (e.ctrlKey) { y = this.maxY } else { x = this.maxX }; break;
			case 'Home': if (e.ctrlKey) { y = 0 } else { x = 0 }; break;
			case ' ': this.customEvent('xytoggle'); break;
			default: break;
		}
		this.xCurrent = x;
		this.yCurrent = y;
		this.update();
	}

	customEvent(name, obj = {}) {
		this.dispatchEvent(new CustomEvent(name, obj));
	}

	down(e) {
		this.active = true;
		this.dataset.active = 1;
		this.customEvent('xydown');
		this.update(e);
	}

	move(e) {
		if (this.active) this.update(e);
	}

	refresh() {
		this.pointsize = this.point.offsetWidth;
		this.areaX = this.offsetWidth;
		this.areaY = this.offsetHeight;
		this.ratioX = ((this.areaX - this.pointsize) / (this.settings.maxX - this.settings.minX));
		this.ratioY = ((this.areaY - this.pointsize) / (this.settings.maxY - this.settings.minY));
		this.maxX = this.areaX - this.pointsize;
		this.maxY = this.areaY - this.pointsize;
		this.snapX = this.settings.gridX ? this.areaX / this.settings.gridX : 0;
		this.snapY = this.settings.gridY ? this.areaY / this.settings.gridY : 0;
	}

	up() {
		this.active = false;
		this.dataset.active = 0;
		this.customEvent('xyup');
	}

	update(e) {
		if (e) {
			this.xCurrent = e.offsetX - (this.pointsize / 2);
			this.yCurrent = e.offsetY - (this.pointsize / 2);
		}

		if (this.snapX) this.xCurrent = Math.round(this.xCurrent / this.snapX) * this.snapX;
		if (this.snapY) this.yCurrent = Math.round(this.yCurrent / this.snapY) * this.snapY;

		if (this.yCurrent < 0) this.yCurrent = 0;
		if (this.xCurrent > this.maxX) this.xCurrent = this.maxX;
		if (this.yCurrent > this.maxY) this.yCurrent = this.maxY;
		if (this.xCurrent < 0) this.xCurrent = 0;

		this.updateXY(this.xCurrent, this.yCurrent);
	}

	updateXY(tx, ty) {
		this.x = tx * (this.difX / (this.areaX - this.pointsize)) + this.settings.minX;
		this.y = this.difY - ty * (this.difY / (this.areaY - this.pointsize)) + this.settings.minY;
		this.style.setProperty('--tx', tx || 0);
		this.style.setProperty('--ty', ty || 0);

		const gx = this.snapX ? (tx / this.snapX) + 1 : 1;
		const gy = this.snapY ? (ty / this.snapY) + 1 : 1;
		this.customEvent('xymove', { detail: { x: this.x, y: this.y, tx, ty, gx, gy } });
	}

	xyset(x, y) {
		this.xCurrent = (x - this.settings.minX) * this.ratioX;
		this.yCurrent = ((this.settings.maxY - y) + this.settings.minY) * this.ratioY;
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
:host {
	all: unset;
	aspect-ratio: 1 / 1;
	background-color: var(--ui-xy-bg, var(--CanvasGray));
	border-radius: var(--input-bdrs);
	direction: ltr;
	display: block;
	position: relative;
	touch-action: none;
	width: 100%;
}
:host([grid-x][grid-y]) {
	--ui-xy-grid-bdw: 2px;
	--ui-xy-point-bdrs: 0;
	--ui-xy-point-sz: calc(100% / var(--xy-grid-x));

	--_wx: calc( (100% - var(--ui-xy-grid-bdw) + (var(--ui-xy-grid-bdw) / var(--xy-grid-x, 1)) ) / var(--xy-grid-x, 1) );
	--_wy: calc( (100% - var(--ui-xy-grid-bdw) + (var(--ui-xy-grid-bdw) / var(--xy-grid-y, 1)) ) / var(--xy-grid-y, 1) );
  background: conic-gradient(from 90deg at var(--ui-xy-grid-bdw) var(--ui-xy-grid-bdw),#0000 25%,var(--ButtonFace) 0) 0 0/var(--_wx) var(--_wy);
}
:host::part(xypoint) {
	aspect-ratio: 1 / 1;
	background-color: var(--ui-xy-point-bg, var(--ButtonFace));
	border: var(--ui-xy-point-bdw, 0.5rem) solid var(--ui-xy-point-bdc, var(--ButtonBorder));
	border-radius: var(--ui-xy-point-bdrs, 50%);
	inline-size: var(--ui-xy-point-sz, 4rem);
	outline: none;
	pointer-events: none;
	touch-action: none;
	transform: translate3d(calc(1px * var(--tx)), calc(1px * var(--ty)), 0);
	transition: none;
	user-select: none;
}
:host(:focus-visible)::part(xypoint) {
	background: var(--ui-xy-point--focus, var(--Highlight));
	border-color: var(--AccentColor);
}
`)
customElements.define('x-y', xyController);
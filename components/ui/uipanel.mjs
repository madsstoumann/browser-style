class uiPanel {
  constructor(panel, settings) {
		this.settings = Object.assign({
			minHeight: '140px'
		}, settings)
    this.panel = panel
		this.dragArea = panel.querySelector("ui-panel-header")
		this.resizeHandle = panel.querySelector("ui-resize-handle")
		this.init()
  }

	init() {
		this.bindings = {
			dragDown: this.dragDown.bind(this),
			dragUp: this.dragUp.bind(this),
			dragMove: this.dragMove.bind(this),
			resizeUp: this.resizeUp.bind(this),
			resizeMove: this.resizeMove.bind(this),
		}
		this?.dragArea.addEventListener('pointerdown', (e) => this.dragDown(e))
		this?.dragArea.addEventListener('dblclick', () => this.expandCollapse())
		this?.resizeHandle.addEventListener('pointerdown', (e) => this.resizeDown(e))
	}

	dragDown(e) {
		e.preventDefault()
		this.x = 0
		this.y = 0
		this.cx = e.clientX
		this.cy = e.clientY
		document.addEventListener('pointerup', this.bindings.dragUp)
		document.addEventListener('pointermove', this.bindings.dragMove)
	}

	dragMove(e) {
		e.preventDefault()
		this.x = this.cx - e.clientX
		this.y = this.cy - e.clientY
		this.cx = e.clientX
		this.cy = e.clientY
		this.panel.style.top = (this.panel.offsetTop - this.y) + "px"
		this.panel.style.left = (this.panel.offsetLeft - this.x) + "px"
	}

	dragUp() {
		document.removeEventListener('pointerup', this.bindings.dragUp)
		document.removeEventListener('pointermove', this.bindings.dragMove)
	}

	expandCollapse() {
		const BS = this.panel.style.getPropertyValue('--ui-panel-bs')
		this.panel.style.setProperty('--ui-panel-bs', BS === 'auto' ? this.settings.minHeight : 'auto')
	}

	resizeDown(e) {
		e.preventDefault();
		this.RY = 0;
		this.ry = e.clientY;
		document.addEventListener('pointerup', this.bindings.resizeUp)
		document.addEventListener('pointermove', this.bindings.resizeMove)
	}

	resizeMove(e) {
		e.preventDefault();
		this.RY = this.ry - e.clientY
		this.ry = e.clientY
		this.panel.style.setProperty('--ui-panel-bs', (this.panel.offsetHeight - this.RY) + "px")
	}

	resizeUp() {
		document.removeEventListener('pointerup', this.bindings.resizeUp)
		document.removeEventListener('pointermove', this.bindings.resizeMove)
	}
}

// new uiPanel(document.querySelector("[data-ui='draggable']"))
import modelDefaults from './model.json' with { type: 'json' }
import layoutConfig from '../../../layout.config.json' with { type: 'json' }

export class LayoutComposer extends HTMLElement {
	constructor() {
		super()
		this.model = { ...modelDefaults }
		this.config = layoutConfig
		this.layouts = new Map()
		this.currentLayout = null
		this.activeTab = 'breakpoints'
	}

	async connectedCallback() {
		await this.loadLayouts()
		this.render()
		this.attachEventListeners()
	}

	async loadLayouts() {
		const layoutTypes = ['asymmetrical', 'autofit', 'bento', 'columns', 'grid', 'mosaic', 'ratios']

		for (const type of layoutTypes) {
			try {
				const module = await import(`../../../layouts/${type}.json`, { with: { type: 'json' } })
				this.layouts.set(type, module.default)
			} catch (e) {
				console.warn(`Could not load ${type} layouts:`, e)
			}
		}
	}

	getAvailableLayoutsForBreakpoint(breakpoint) {
		const bpConfig = this.config.breakpoints[breakpoint]
		if (!bpConfig?.layouts) return []

		const available = []

		for (const item of bpConfig.layouts) {
			if (typeof item === 'string') {
				const layoutData = this.layouts.get(item)
				if (layoutData) {
					available.push({
						type: item,
						layouts: layoutData.layouts,
						prefix: layoutData.prefix
					})
				}
			} else if (typeof item === 'object') {
				for (const [type, patterns] of Object.entries(item)) {
					const layoutData = this.layouts.get(type)
					if (layoutData) {
						available.push({
							type,
							layouts: layoutData.layouts.filter(l =>
								patterns.includes(`${layoutData.prefix}(${l.id})`)
							),
							prefix: layoutData.prefix
						})
					}
				}
			}
		}

		return available
	}

	attachEventListeners() {
		const selects = this.querySelectorAll('select[data-breakpoint]')
		selects.forEach(select => {
			select.addEventListener('change', (e) => {
				this.handleBreakpointChange(e.target)
			})
		})

		const tabs = this.querySelectorAll('[data-tab]')
		tabs.forEach(tab => {
			tab.addEventListener('click', (e) => {
				e.preventDefault()
				this.activeTab = tab.dataset.tab
				this.updateTabs()
			})
		})

		const formInputs = this.querySelectorAll('input, select')
		formInputs.forEach(input => {
			input.addEventListener('change', () => {
				this.updatePreview()
			})
		})
	}

	async handleBreakpointChange(select) {
		const breakpoint = select.dataset.breakpoint
		const value = select.value
		const iconContainer = this.querySelector(`.layout-icon[data-breakpoint="${breakpoint}"]`)

		if (!value || !iconContainer) {
			if (iconContainer) iconContainer.innerHTML = ''
			this.currentLayout = null
			this.updatePreview()
			return
		}

		await this.loadIcon(value, iconContainer)
		this.findLayoutData(value)
		this.updatePreview()
	}

	findLayoutData(layoutPattern) {
		for (const [type, layoutData] of this.layouts.entries()) {
			const layout = layoutData.layouts.find(l =>
				`${layoutData.prefix}(${l.id})` === layoutPattern
			)
			if (layout) {
				this.currentLayout = { ...layout, type }
				return
			}
		}
		this.currentLayout = null
	}

	async loadIcon(layoutPattern, container) {
		try {
			const iconPath = `../../../dist/icons/${layoutPattern}.svg`
			const response = await fetch(iconPath)
			if (!response.ok) throw new Error(`Icon not found: ${iconPath}`)
			const svgContent = await response.text()
			container.innerHTML = svgContent
		} catch (e) {
			container.innerHTML = ''
		}
	}

	updateTabs() {
		const tabs = this.querySelectorAll('[data-tab]')
		const panels = this.querySelectorAll('[data-panel]')

		tabs.forEach(tab => {
			tab.classList.toggle('active', tab.dataset.tab === this.activeTab)
		})

		panels.forEach(panel => {
			panel.hidden = panel.dataset.panel !== this.activeTab
		})
	}

	updatePreview() {
		const preview = this.querySelector('.preview-container')
		if (!preview) return

		const formData = new FormData(this.querySelector('form'))
		const attributes = []

		const selectedBreakpoint = Array.from(formData.entries())
			.find(([key, value]) => key.startsWith('breakpoint-') && value)

		if (selectedBreakpoint) {
			const [, bp] = selectedBreakpoint[0].split('-')
			attributes.push(`${bp}="${selectedBreakpoint[1]}"`)
		}

		if (formData.get('colGap')) attributes.push(`col-gap="${formData.get('colGap')}"`)
		if (formData.get('rowGap')) attributes.push(`row-gap="${formData.get('rowGap')}"`)
		if (formData.get('spaceTop')) attributes.push(`space-top="${formData.get('spaceTop')}"`)
		if (formData.get('spaceBottom')) attributes.push(`space-bottom="${formData.get('spaceBottom')}"`)
		if (formData.get('padTop')) attributes.push(`pad-top="${formData.get('padTop')}"`)
		if (formData.get('padBottom')) attributes.push(`pad-bottom="${formData.get('padBottom')}"`)
		if (formData.get('padInline')) attributes.push(`pad-inline="${formData.get('padInline')}"`)
		if (formData.get('maxWidth')) attributes.push(`max-width="${formData.get('maxWidth')}"`)
		if (formData.get('width')) attributes.push(`width="${formData.get('width')}"`)
		if (formData.get('bleed')) attributes.push(`bleed="${formData.get('bleed')}"`)
		if (formData.get('overflow')) attributes.push(`overflow="${formData.get('overflow')}"`)
		if (formData.get('columns')) attributes.push(`columns="${formData.get('columns')}"`)
		if (formData.get('rows')) attributes.push(`rows="${formData.get('rows')}"`)
		if (formData.get('animationName')) {
			attributes.push(`animation="${formData.get('animationName')}"`)
			if (formData.get('animationRange')) {
				attributes.push(`range="${formData.get('animationRange')}"`)
			}
		}
		if (formData.get('decorations')) attributes.push('decorations')
		if (formData.get('theme')) attributes.push(`theme="${formData.get('theme')}"`)
		if (formData.get('self')) attributes.push(`self="${formData.get('self')}"`)
		if (formData.get('size')) attributes.push(`size="${formData.get('size')}"`)
		if (formData.get('ariaLabel')) attributes.push(`aria-label="${formData.get('ariaLabel')}"`)

		const itemCount = this.currentLayout?.items || 4
		const children = Array.from({ length: itemCount }, () => '<item-card></item-card>').join('\n\t\t\t')

		preview.innerHTML = `
			<h3>Preview</h3>
			<lay-out ${attributes.join(' ')}>
				${children}
			</lay-out>
			<details style="margin-block-start: 1rem;">
				<summary>Generated HTML</summary>
				<pre><code>&lt;lay-out ${attributes.join(' ')}&gt;\n\t${children.replace(/\n\t\t\t/g, '\n\t')}\n&lt;/lay-out&gt;</code></pre>
			</details>
		`
	}

	render() {
		this.innerHTML = `
			<div class="composer-container">
				<div class="editor-section">
					<nav class="tabs">
						<button type="button" data-tab="breakpoints" class="active">Breakpoints</button>
						<button type="button" data-tab="spacing">Spacing</button>
						<button type="button" data-tab="gaps">Gaps</button>
						<button type="button" data-tab="layout">Layout</button>
						<button type="button" data-tab="animation">Animation</button>
						<button type="button" data-tab="advanced">Advanced</button>
					</nav>

					<form>
						<div data-panel="breakpoints">
							<fieldset>
								<legend>Breakpoints</legend>
								${this.renderBreakpoints()}
							</fieldset>
						</div>

						<div data-panel="spacing" hidden>
							<fieldset>
								<legend>Spacing</legend>
								${this.renderSpacing()}
							</fieldset>
						</div>

						<div data-panel="gaps" hidden>
							<fieldset>
								<legend>Gaps</legend>
								${this.renderGaps()}
							</fieldset>
						</div>

						<div data-panel="layout" hidden>
							<fieldset>
								<legend>Layout</legend>
								${this.renderLayout()}
							</fieldset>
						</div>

						<div data-panel="animation" hidden>
							<fieldset>
								<legend>Animation</legend>
								${this.renderAnimation()}
							</fieldset>
						</div>

						<div data-panel="advanced" hidden>
							<fieldset>
								<legend>Advanced</legend>
								${this.renderAdvanced()}
							</fieldset>
						</div>
					</form>
				</div>

				<div class="preview-section">
					<div class="preview-container"></div>
				</div>
			</div>
		`
	}

	renderBreakpoints() {
		const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

		return breakpoints.map(bp => {
			const bpConfig = this.config.breakpoints[bp]
			const available = this.getAvailableLayoutsForBreakpoint(bp)

			return `
				<div class="breakpoint-group">
					<label>
						<strong>${bp}</strong>
						${bpConfig ? `(${bpConfig.min}+)` : ''}
					</label>
					<select name="breakpoint-${bp}" data-breakpoint="${bp}">
						<option value="">None</option>
						${available.map(group => `
							<optgroup label="${group.type}">
								${group.layouts.map(layout => {
									const layoutId = `${group.prefix}(${layout.id})`
									return `<option value="${layoutId}">${layout.id}${layout.description ? ` - ${layout.description}` : ''}</option>`
								}).join('')}
							</optgroup>
						`).join('')}
					</select>
					<div class="layout-icon" data-breakpoint="${bp}"></div>
				</div>
			`
		}).join('')
	}

	renderSpacing() {
		return `
			<label>
				Space Top
				<input type="number" name="spaceTop" value="${this.model.spaceTop}" min="0">
			</label>
			<label>
				Space Bottom
				<input type="number" name="spaceBottom" value="${this.model.spaceBottom}" min="0">
			</label>
			<label>
				Pad Top
				<input type="number" name="padTop" value="${this.model.padTop}" min="0">
			</label>
			<label>
				Pad Bottom
				<input type="number" name="padBottom" value="${this.model.padBottom}" min="0">
			</label>
			<label>
				Pad Inline
				<input type="number" name="padInline" value="${this.model.padInline}" min="0">
			</label>
		`
	}

	renderGaps() {
		return `
			<label>
				Column Gap
				<input type="number" name="colGap" value="${this.model.colGap}" min="0" step="0.5">
			</label>
			<label>
				Row Gap
				<input type="number" name="rowGap" value="${this.model.rowGap}" min="0" step="0.5">
			</label>
		`
	}

	renderLayout() {
		return `
			<label>
				Columns
				<input type="text" name="columns" value="${this.model.columns}">
			</label>
			<label>
				Rows
				<input type="text" name="rows" value="${this.model.rows}">
			</label>
			<label>
				Max Width
				<input type="text" name="maxWidth" value="${this.model.maxWidth}">
			</label>
			<label>
				Width Preset
				<select name="width">
					<option value="">None</option>
					<option value="xs">XS (20rem)</option>
					<option value="sm">SM (30rem)</option>
					<option value="md">MD (48rem)</option>
					<option value="lg">LG (64rem)</option>
					<option value="xl">XL (80rem)</option>
					<option value="xxl">XXL (96rem)</option>
				</select>
			</label>
			<label>
				Bleed
				<input type="number" name="bleed" value="${this.model.bleed}" min="0" max="100">
			</label>
			<label>
				Overflow
				<select name="overflow">
					<option value="">None</option>
					<option value="none">Hidden</option>
					<option value="preview">Preview</option>
					<option value="dynamic">Dynamic</option>
				</select>
			</label>
			<label>
				<input type="checkbox" name="decorations" ${this.model.decorations ? 'checked' : ''}>
				Decorations
			</label>
		`
	}

	renderAnimation() {
		const animationNames = [
			{ group: 'Fade', values: ['fade-in', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'fade-in-scale', 'fade-out', 'fade-out-scale'] },
			{ group: 'Bounce', values: ['bounce', 'bounce-in-up', 'bounce-in-down', 'bounce-in-left', 'bounce-in-right'] },
			{ group: 'Zoom', values: ['zoom-in', 'zoom-out', 'zoom-in-rotate', 'zoom-out-rotate'] },
			{ group: 'Slide', values: ['slide-in', 'slide-out', 'slide-up', 'slide-down'] },
			{ group: 'Flip', values: ['flip-up', 'flip-down', 'flip-left', 'flip-right', 'flip-diagonal'] },
			{ group: 'Reveal', values: ['reveal', 'reveal-circle', 'reveal-polygon'] },
			{ group: 'Other', values: ['opacity'] }
		]

		return `
			<label>
				Animation Name
				<select name="animationName">
					<option value="">None</option>
					${animationNames.map(group => `
						<optgroup label="${group.group}">
							${group.values.map(name => `<option value="${name}">${name}</option>`).join('')}
						</optgroup>
					`).join('')}
				</select>
			</label>
			<label>
				Animation Range
				<select name="animationRange">
					<option value="">Default</option>
					<option value="contain">Contain</option>
					<option value="cover">Cover</option>
					<option value="exit">Exit</option>
				</select>
			</label>
		`
	}

	renderAdvanced() {
		return `
			<label>
				ARIA Label
				<input type="text" name="ariaLabel" value="${this.model.ariaLabel}">
			</label>
			<label>
				Theme
				<select name="theme">
					<option value="">None</option>
					<option value="primary">Primary</option>
					<option value="secondary">Secondary</option>
					<option value="tertiary">Tertiary</option>
				</select>
			</label>
			<label>
				Self Alignment
				<input type="text" name="self" value="${this.model.self}">
			</label>
			<label>
				Size
				<input type="text" name="size" value="${this.model.size}">
			</label>
		`
	}
}

customElements.define('layout-composer', LayoutComposer)

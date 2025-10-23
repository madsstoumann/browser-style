import { observe } from './observe.mjs';
import { uuid } from './uuid.mjs';

/**
 * appEditor for OneBlock
 * @class
 * @classdesc appEditor for OneBlock
 * @version 2.0.28
 * @summary 29-06-2021
 * @author Mads Stoumann
 * @param {Node} app
 * @param {Node} devices
 * @param {Object} settings
 */
export default class appEditor {
	constructor(app, devices, settings) {
		this.settings = Object.assign({
			clsBreakPoint: 'app-editor-bp-',
			clsGroup: 'app-editor-grouppanel',
			clsSubGroup: 'app-editor-subgroup',
			defaultPreset: [
				{ bp: 400, props: {}},
				{ bp: 768, props: {}},
				{ bp: 1200, props: {}},
				{ bp: 1448, props: {}}
			],
			eventPresetChange: 'appPresetChange',
			gridsize: 16
		}, settings);
		this.init(app, devices);
	}
	/**
	 * @function add
	 * @description Adds/updates CSS Custom Property, updates preset-object
	 * @param {Node} N
	 */
	add(N) {
		let remval = false;
		let value = `${N.value}${N.dataset.suffix || ''}`;
		if (N.type === 'range' && (N.value === N.defaultValue)) { remval = true }
		if (remval) { return this.rem(N) }

		this.preset.values[this.bp].props[N.name] = {
			raw: N.type === 'textarea',
			suffix: N.dataset.suffix || '',
			value: N.valueAsNumber || N.value
		};

		N.parentNode.dataset.value = value;
		this.elements.template.style.setProperty(N.name, value);
		this.group(this.getGroup(N)?.previousElementSibling, this.bp, true);
		this.rules();
	}

	/**
	 * @function breakpoint
	 * @description Update/Set current breakpoint, resize wysiwyg-area (if a device-icon is clicked)
	 * @param {Boolean} setWidth [false]
	 * @param {Boolean} reset [false]
	 */
	breakpoint(setWidth = false, reset = false) {
		if (setWidth) {
			const width = this.preset.values[this.bp].bp;
			this.elements.wysiwyg.style.width = `${width + (3 * this.gridsize)}px`;
		}
		this.ui(this.bp, reset);
	}

	/**
	 * @function change
	 * @description When preset-data change, trigger event
	 * @param {Object} preset
	 */
	change(preset) {
		this.elements.app.dispatchEvent(new CustomEvent(this.settings.eventPresetChange, { detail: JSON.stringify(preset) }));
	}

	/**
	 * @function css
	 * @description Returns generated CSS for current preset
	 */
	css() {
		let preset = JSON.parse(JSON.stringify(this.preset)); /* clone this.preset, as map() cannot run on a locked object */
		return `${preset.values.map((entry,index) => { 
			if (Object.keys(entry.props).length)	{
				return `${index > 0 ? `\n${this.preset.type}(min-width:${entry.bp}px){`:''}.${preset.name}{${Object.entries(entry.props).map(props => { const [key, prop] = props; return `${key}:${prop.value}${prop.suffix||''};`}).join('')}${index > 0 ? `}`:''}}`
			}
		}).join('')}`
	}

	/**
	 * @function device
	 * @description Sets a device-width
	 * @param {Number} bp
	 * @param {Number} value
	 */
	device(bp, value) {
		this.preset.values[bp].bp = value;
		this.elements.app.style.setProperty(`--bp${bp+1}`, `${value}px`)
	}

	/**
	 * @function getGroup
	 * @description Returns nearest group-panel
	 * @param {Node} N
	 */
	getGroup(N) {
		return N?.parentNode.closest(`.${this.settings.clsGroup}`);
	}

	/**
	 * @function group
	 * @description Updates group for a value (colored dots next to group-header)
	 * @param {Node} group
	 */
	group(group, bp = this.breakpoint, add = true) {
		if (group) {
			group.classList[add ? 'add' : 'remove'](`${this.settings.clsBreakPoint}${bp}`);
			/* The following logic should be replaced with CSS :has when available */
			if (group.classList.contains(this.settings.clsSubGroup)) {
				const parentgroup = this.getGroup(group); 
				if (add) {
					parentgroup?.previousElementSibling.classList.add(`${this.settings.clsBreakPoint}${bp}`);
				}
				else {
					const groups = parentgroup.querySelectorAll(`.${this.settings.clsBreakPoint}${bp}`);
					if (groups.length === 0) {
						parentgroup?.previousElementSibling.classList.remove(`${this.settings.clsBreakPoint}${bp}`);
					}
				}
			}
		}
	}

	/**
	 * @function init
	 * @description Initializes app, adds event-listeners, create state/store
	 * @param {Node} app
	 * @param {Node} devices
	 */
	init(app, devices) {
		this.bp = 0; /* Current breakpoint */
		this.elements = { app, devices };
		this.gridsize = this.settings.gridsize || 16;
		this.panel = 0; /* Current panel */

		app.querySelectorAll('[data-app]').forEach(N => this.elements[N.dataset.app] = N);

		let preset = {
			id: uuid(),
			name: 'new-preset',
			type: '@media',
			values: this.settings.defaultPreset
		}
		/* observe changes to preset */
		this.preset = observe(preset, () => this.change(preset));

		/* main app, listen for changes on app inputs */
		app.addEventListener('input', (e) => this.update(e.target));

		this.elements.search.addEventListener('search', (e) => {
			const option = [...this.elements.presets.options].filter(option => option.value === this.elements.search.value);
			if (option.length === 1) {
				const preset = this.settings.presets.filter(entry => entry.id === option[0].dataset.id)
				this.load(preset[0]);
			}
		});

		/* select corresponding editor-group, when clicking on wysiwyg-area */
		this.elements.wysiwyg.addEventListener('click', (e) => {
			const group = e.target.dataset.appGroup;
			if (this.elements.app[group]) this.elements.app[group].checked = true;
		});
		/* open/close code-preview */
		window.addEventListener('hashchange', () => {
			if (location.hash.length) {
				this.elements.codecss.innerText = this.css();
				this.elements.codepreset.innerHTML = JSON.stringify(this.preset, null, '\t');
			}
		})

		/* change breakpoint dynamically */
		let init = true;
		const RO = new ResizeObserver(entries => {
			if (init) { this.breakpoint(true); init = false; }
			const curr = this.preset.values[this.bp].bp;
			const prev = this.preset.values[this.bp - 1]?.bp || 0;
			const w = entries[0].target.offsetWidth;
			this.elements.appwidth.innerText = `${w}px`;
			let bp = this.bp;
			let reset = false;

			if (w < prev) { 
				reset = true;
				bp--; if (bp < 0) bp = 0;
			}
			else if (w > curr) {
				bp++; if (bp > 3) bp = 3;
			}
			if (bp !== this.bp) {
				this.bp = bp;
				devices.elements.devices.value = this.bp;
				this.breakpoint(false, reset);
			}
		});
		RO.observe(this.elements.template);
		console.log(this);
	}

	/**
	 * @function load
	 * @description Load a preset
	 * @param {Object|Node} obj
	 */
	load(obj) {
		if (!obj) return;
		this.preset = obj;
		this.bp = 0;
		this.breakpoint(true, true);
		this.elements.devices.reset();
		this.elements.presetName.value = this.preset.name;

		/* Remove colored-dots from editor-groups */
		const dots = this.elements.editor.querySelectorAll(`[class*=app-editor-bp-]`);
		dots.forEach(group => {
			group.classList.forEach(cls => {
				if (cls.startsWith('app-editor-bp-')) group.classList.remove(cls);
			})
		});
		/* Reset rule-counters from device/breakpoints */
		const rules = this.elements.app.querySelectorAll(`[data-bp-rules]`);
		rules.forEach(rule => rule.dataset.bpRules = 0);

		for (let i = 0; i < this.preset.values.length; i++) {
			this.elements.devices.elements.breakpoints[i].value = this.preset.values[i].bp;
			for (const key of Object.keys(this.preset.values[i].props)) {
				const group = this.getGroup(this.elements.app.elements[key][0])?.previousElementSibling;
				this.group(group, i, true);
				this.rules(i);
			}
		}
	}

	/**
	 * @function rem
	 * @description Removes value from preset [current breakpoint]
	 * @param {Node} N
	 */
	rem(N) {
		this.elements.template.style.removeProperty(N.dataset.prop || N.name);
		delete this.preset.values[this.bp].props[N.dataset.prop || N.name];
		const input = N.dataset.type === 'remval' ? this.elements.app.querySelector(`[name="${N.dataset.prop}"]:not(textarea)`) : N;

		if (input.type === 'radio') {
			/* Find elements with same `name`, filter out `textarea`, so it's only `radio` */
			const group = [...this.elements.app.elements[input.name]].filter(r => r.type === 'radio');
			/* Iterate group, set `checked` to `false`, unless it's the default checked */
			group.forEach(r => r.checked = r === r.defaultChecked);
		}
		/* `select-multiple` is *not* supported, as it would require multiple CSS props to be updated at once */
		if (input.type === 'select-one') {
			const selected = [...input.options].filter(option => option.defaultSelected)[0] || input.options[0];
			selected.selected = 'selected';
		}
		else {
			input.value = input.defaultValue;
			input.parentNode.dataset.value = `${input.defaultValue}${input.dataset.suffix}`;
		}
		this.rules();
		this.group(this.getGroup(N)?.previousElementSibling, this.bp, false);
	}

	/**
	 * @function reset
	 * @description Resets app-form to default state, removes custom styles from template, re-sets selected editor-panel to previously selected.
	 */
	reset() {
		this.elements.app.reset();
		this.elements.template.removeAttribute('style');
		this.elements.app.elements.layer.value = this.panel;
	}

	/**
	 * @function rules
	 * @description Updates counter for number of rules, for a given breakpoint
	 * @param {Number} bp [0]
	 */
	rules(bp = this.bp) {
		const rules = Object.keys(this.preset.values[bp].props).length;
		const N = this.elements.devicebar.querySelector(`[value="${bp}"]`);
		N.nextElementSibling.dataset.bpRules = rules
	}

		/**
	 * @function search
	 * @description Search presets, autosuggest
	 * @param {Node} N
	 */
		search(N) {
			const list = this.settings.presets.filter(entry => entry.name.startsWith(N.value))
			if (list.length) { this.elements.presets.innerHTML = list.map(preset => `<option data-id="${preset.id}" value="${preset.name}">`).join(''); }
		}

	/**
	 * @function setting
	 * @description Updates app-related settings
	 * @param {Node} N
	 */
	setting(N) {
		let value = `${N.value}${N.dataset.suffix || ''}`;
		if (N.type === 'checkbox' && !N.checked) value = N.dataset.value;
		N.parentNode.dataset.value = value;
		this.elements.app.style.setProperty(N.name, value);
		if (N.dataset.property) this[N.dataset.property] = N.value;
	}

	/**
	 * @function ui
	 * @description Updates UI-controls to the settings of breakpoint: `bp`
	 * @param {Number} bp [0]
	 * @param {Boolean} reset [false]
	 */
	ui(bp = 0, reset = false) {
		/* Breakpoint is smaller than previous: Reset controls, remove CSS Custom properties */
		if (reset) {
			this.reset();
			/* Breakpoint is larger than first (0): Update CSS Custom properties for breakpoints smaller than current, but only update UI for current breakpoint */
			if (bp > 0) {
				for (let i = 0; i < this.bp; i++) {
					for (const [key, obj] of Object.entries(this.preset.values[i].props)) {
						this.elements.template.style.setProperty(key, obj.value);
					}
				}
			}
		}
		for (const [key, prop] of Object.entries(this.preset.values[bp].props)) {
			const inputs = this.elements.app.elements[key];
			const isList = Object.isPrototypeOf.call(NodeList.prototype, inputs);
			const [textarea, input] = isList ? [...inputs] : ['', inputs];
			const toggle = this.getGroup(input).querySelector('[data-type="raw"]');
			if (textarea && prop.raw) { textarea.value = `${prop.value}${prop.suffix||''}`; }
			if (toggle) toggle.checked = prop.raw;
			if (input.type === 'radio') this.elements.app.elements[input.name].value = prop.value;
			if (input.type === 'range') input.value = prop.value;
			if (input.type === 'select-one') { input.value = `${prop.value}${prop.suffix||''}` }
			input.parentNode.dataset.value = `${prop.value}${prop.suffix||''}`;
			this.elements.template.style.setProperty(key, `${prop.value}${prop.suffix||''}`)
		}
	}

	/**
	 * @function update
	 * @description Main method for handling form-input
	 * @param {Node} N
	 */
	update(N) {
		if (N.dataset.type === 'animation') {
			const name = getComputedStyle(this.elements.template).getPropertyValue(N.dataset.prop);
			if (name) {
				this.elements.template.style.removeProperty(N.dataset.prop);
				setTimeout(() => this.elements.template.style.setProperty(N.dataset.prop, name), 100);
			}
		}
		if (N.dataset.type === 'breakpoint') { this.device(N.dataset.breakpoint-0, N.valueAsNumber); }
		if (N.dataset.type === 'device') { const val = N.value-0; const reset = val < this.bp; this.bp = val; this.breakpoint(true, reset); }
		if (N.dataset.type === 'layer') { this.panel = this.elements.app.elements.layer.value; }
		if (N.dataset.type === 'preset') { this.load(JSON.parse(N.dataset.preset)); }
		if (N.dataset.type === 'presetname') { this.preset.name = N.value }
		if (N.dataset.type === 'presettype') { this.preset.type = N.checked ? '@container' : '@media' }
		if (N.dataset.type === 'property') { this.add(N) }
		if (N.dataset.type === 'remval') { this.rem(N) }
		if (N.dataset.type === 'rtl') { this.elements.template.setAttribute('dir', N.checked ? 'rtl' : 'ltr'); }
		if (N.dataset.type === 'search') { this.search(N) }
		if (N.dataset.type === 'setting') { this.setting(N) }
		/* toggle is not implemented in preset-model, see documentation */
		if (N.dataset.type === 'toggle') { this.elements.template.classList.toggle(N.name, N.checked) }
	}
}
// const stylesheet = new CSSStyleSheet()
// stylesheet.replaceSync(``)

import stylesheet from './index.css' assert { type: 'css' };
/**
 * uiEditor
 * Web Component for inspecting and editing HTML elements, toggle classes etc.
 * @author Mads Stoumann
 * @version 1.0.04
 * @summary 06-02-2024
 * @class
 * @extends {HTMLElement}
 */
class uiEditor extends HTMLElement {
	static observedAttributes = ['open'];
	constructor() {
		super();

		/**
		* * Object containing SVG path data for icons.
		* @type {Object.<string, string[]>}
		*/
		this.icons = {
			close: ['M18 6l-12 12', 'M6 6l12 12'],
			colorscheme: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 3l0 18', 'M12 9l4.65 -4.65', 'M12 14.3l7.37 -7.37', 'M12 19.6l8.85 -8.85'],
			components: ['M3 12l3 3l3 -3l-3 -3z', 'M15 12l3 3l3 -3l-3 -3z', 'M9 6l3 3l3 -3l-3 -3z', 'M9 18l3 3l3 -3l-3 -3z'],
			copy: ['M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z', 'M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1'],
			cut: ['M7 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M9.15 14.85l8.85 -10.85', 'M6 4l8.85 10.85'],
			deviceLG: ['M3 19l18 0', 'M5 6m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z'],
			deviceMD: ['M5 4a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1v-16z', 'M11 17a1 1 0 1 0 2 0a1 1 0 0 0 -2 0'],
			deviceOff: ['M13 9a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v8m-1 3h-6a1 1 0 0 1 -1 -1v-6', 'M18 8v-3a1 1 0 0 0 -1 -1h-9m-4 0a1 1 0 0 0 -1 1v12a1 1 0 0 0 1 1h9', 'M16 9h2', 'M3 3l18 18'],
			deviceSM: ['M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14z', 'M11 4h2', 'M12 17v.01'],
			deviceXL: ['M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-12z', 'M3 13h18', 'M8 21h8', 'M10 17l-.5 4', 'M14 17l.5 4'],
			deviceXXL: ['M11.5 17h-7.5a1 1 0 0 1 -1 -1v-12a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v9', 'M3 13h18', 'M8 21h3.5', 'M10 17l-.5 4', 'M20 21l2 -2l-2 -2', 'M17 17l-2 2l2 2'],
			down: ['M6 6h6a3 3 0 0 1 3 3v10l-4 -4m8 0l-4 4'],
			edit: ['M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4', 'M13.5 6.5l4 4'],
			first: ['M10 12l10 0', 'M10 12l4 4', 'M10 12l4 -4', 'M4 4l0 16'],
			last: ['M14 12l-10 0', 'M14 12l-4 4', 'M14 12l-4 -4', 'M20 4l0 16'],
			left: ['M5 12l14 0', 'M5 12l6 6', 'M5 12l6 -6'],
			leftbar: ['M4 12l10 0', 'M4 12l4 4', 'M4 12l4 -4', 'M20 4l0 16'],
			listadd: ['M19 8h-14', 'M5 12h9', 'M11 16h-6', 'M15 16h6', 'M18 13v6'],
			paste: ['M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2', 'M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z'],
			plus: ['M12 5l0 14', 'M5 12l14 0'],
			redo: ['M15 14l4 -4l-4 -4', 'M19 10h-11a4 4 0 1 0 0 8h1'],
			refresh: ['M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4', 'M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4'],
			replace: ['M3 3m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z', 'M15 15m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z', 'M21 11v-3a2 2 0 0 0 -2 -2h-6l3 3m0 -6l-3 3', 'M3 13v3a2 2 0 0 0 2 2h6l-3 -3m0 6l3 -3'],
			right: ['M5 12l14 0', 'M13 18l6 -6', 'M13 6l6 6'],
			rightbar: ['M20 12l-10 0', 'M20 12l-4 4', 'M20 12l-4 -4', 'M4 4l0 16'],
			save: ['M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2', 'M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M14 4l0 4l-6 0l0 -4'],
			settings: ['M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z', 'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0'],
			style: ['M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25', 'M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0'],
			undo: ['M9 14l-4 -4l4 -4', 'M5 10h11a4 4 0 1 1 0 8h-1'],
			up: ['M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4'],
		}

		/**
		* * Object containing predefined groups for the editor.
		* @type {Object.<string, string[]>}
		*/
		this.groups = {
			breakpoints: [
				{ icon: 'deviceOff', label: { title:'off' }, input: { 'data-sr':'', name:'breakpoint', type:'radio', value: '', checked: true }},
				{ icon: 'deviceSM', label: { title:'sm' }, input: { 'data-sr':'', name:'breakpoint', type:'radio', value: 'sm:' }},
				{ icon: 'deviceMD', label: { title:'md' }, input: {'data-sr':'', name:'breakpoint', type:'radio', value: 'md:' }},
				{ icon: 'deviceLG', label: { title:'lg' }, input: { 'data-sr':'', name:'breakpoint', type:'radio',  value: 'lg:' }},
				{ icon: 'deviceXL', label: { title:'xl' }, input: { 'data-sr':'', name:'breakpoint', type:'radio', value: 'xl:' }},
				{ icon: 'deviceXXL', label: { title:'xxl' }, input: { 'data-sr':'', name:'breakpoint', type:'radio', value: '2xl:' }},
			],
			dom: [
				{ click: 'dom-copy', icon: 'copy', title: 'Copy  ⌘C' },
				{ click: 'dom-cut', icon: 'cut', title: 'Cut ⌘X' },
				{ click: 'dom-paste', icon: 'paste', title: 'Paste into ⌘V'},
				{ click: 'dom-replace', icon: 'replace', title: 'Replace with ⇧⌘V' },
				{ click: 'dom-first', icon: 'first', title: 'Move first ⌘↖' },
				{ click: 'dom-prev', icon: 'leftbar', title: 'Move previous ⌘⇞' },
				{ click: 'dom-next', icon: 'rightbar', title: 'Move next ⌘⇟' },
				{ click: 'dom-last', icon: 'last', title: 'Move last ⌘↘' },
			],
			frame: [
				{ name: 'x', label: 'X', value: 0 },
				{ name: 'y', label: 'Y', value: 0 },
				{ name: 'w', label: 'W', value: 0 },
				{ name: 'h', label: 'H', value: 0 },
				{ name: 'tag', label: 'E' },
				{ name: 'parent', label: 'P' },
			],
			navigation: [
				{ click: 'nav-up', icon: 'up', title: 'Parent ⌘↑' },
				{ click: 'nav-down', icon: 'down', title: 'Child ⌘↓' },
				{ click: 'nav-left', icon: 'left', title: 'Previous Sibling ⌘←' },
				{ click: 'nav-right', icon: 'right', title: 'Next Sibling ⌘→' },
				{ click: 'nav-first', icon: 'first', title: 'First Child ⇧⌘←' },
				{ click: 'nav-last', icon: 'last', title: 'Last Child ⇧⌘→' },
				{ click: 'dom-undo', icon: 'undo', title: 'Undo  ⌘Z', class: 'uie-secondary'},
				{ click: 'dom-redo', icon: 'redo', title: 'Redo ⇧⌘Z', class: 'uie-secondary'},
			],
			settings: [
				{ textAfter:'Show grid', label: { class:'uie-switch' }, input: { name:'grid-toggle', type:'checkbox', 'data-property': '--uie-grid-visible' } },
				{ textAfter:'Grid color', label: { class:'uie-color' }, input: { name:'grid-color', type:'color', value: '#C4C4C4', 'data-property': '--uie-grid-dot-c'} },
				{ text:'Grid size', label: { class:'uie-range' }, input: { name:'grid-size', type:'range', min:10, max:100, step:10, value:20, 'data-property': '--uie-grid-sz', 'data-unit': 'px' } }
			],
			tabs: [
				{ icon: 'style', label: { title:'Styles' }, input: { 'data-sr':'', name:'tool', type:'radio', value: 1, checked: true }},
				{ icon: 'edit', label: { title:'Content' },  input: { 'data-sr':'', name:'tool', type:'radio', value: 2 }},
				{ icon: 'components', label: { title:'Elements' },  input: {'data-sr':'', name:'tool', type:'radio', value: 3 }},
				{ icon: 'settings', label: { title:'Settings' }, input: { 'data-sr':'', name:'tool', type:'radio',  value: 4 }},
			]
		}

		this.undoStack = [];
		this.redoStack = [];
	}

	/**
	* Invoked when the custom element is connected to the document's DOM.
	* Initializes the shadow DOM, sets up event listeners, and performs necessary setup.
	*/
	async connectedCallback() {
		if (this.getAttribute('config')) {
			try {
				const response = await fetch(this.getAttribute('config'));
				this.config = await response.json();
			}
			catch (error) { console.error(`Error fetching config: ${error}`); }
		}
		this.id = crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

		const shadow = this.attachShadow({ mode: 'open' })
		const template = document.createElement('template');
		template.innerHTML = this.renderTemplate(this.id);
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.appendChild(template.content.cloneNode(true));

		// Initialize references to important elements within the shadow DOM.
		this.componentConfig = shadow.querySelector(`[part=form-config]`);
		this.componentConfigure = shadow.querySelector(`[name=configure-component]`);
		this.componentSearch = shadow.querySelector(`[part=component-search]`);
		this.draghandle = shadow.querySelector(`[part=title]`);
		this.editor = shadow.querySelector(`[part=editor]`);
		this.formStyles = shadow.querySelector(`[part=form-styles]`);
		this.outline = shadow.querySelector(`[part=outline]`);
		this.toggle = shadow.querySelector(`[part=toggle] input`);
		this.tool = shadow.querySelector(`[part=tool]`);

		if (this.componentConfigure ) this.componentConfigure.hidden = true;

		/* Events */
		this.addAccessKeys();
		this.addDocumentScroll();
		this.addEventListener('click', this.onClick);
		this.addEventListener('keydown', this.onKeyDown)
		this.addEventListener('pointermove', this.onMove);
		this.addDraggable(this.draghandle, this.editor);
		this.editor.addEventListener('beforetoggle', this.onToggle)
		this.editor.addEventListener('input', this.onInput);
		if (this.componentSearch) {
			this.componentSearch.addEventListener('input', this.onSearch);
			this.componentSearch.addEventListener('search', () => this.setComponentInfo({}));
		}

		/* Observe changes to the active element's dimensions. Element is added/removed in `setActive` */
		this.resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentBoxSize) {
					const rect = entry.target.getBoundingClientRect();
					this.setOutline(rect);
					this.setFrameValues(entry.target, rect);
				}}
		});
	}

	/**
	* Invoked when one of the observed attributes of the custom element is changed.
	* @param {string} name - The name of the changed attribute.
	* @param {*} oldValue - The previous value of the attribute.
	* @param {*} newValue - The new value of the attribute.
	*/
	attributeChangedCallback(name, oldValue, newValue) {
		if (!newValue || oldValue === newValue) return;
		switch(name) {
			case 'open':
				if (newValue === 'false') { this.editor.hidePopover(); }
				break;
		}
	}

	/**
	* Adds keyboard access keys to toggle and open features based on attributes.
	* If 'togglekey' attribute is present, toggles the visibility of the outline/enabler.
	* If 'openkey' attribute is present, toggles visibility, sets active element, and shows popover/editor.
	*/
	addAccessKeys() {
		const openKey = this.getAttribute('openkey');
		const toggleKey = this.getAttribute('togglekey');
		if (openKey || toggleKey) {
			document.addEventListener('keydown', (e) => {
				if (e.altKey && e.ctrlKey) {
					if (e.key === openKey) {
						const open = this.editor.togglePopover();
						this.toggle.checked = open;
						this.setAttribute('open', open);
						this.setActive(document.activeElement);
					}
					if (e.key === toggleKey) {
						this.toggle.checked = !this.toggle.checked;
						this.setAttribute('open', this.toggle.checked);
					}
				}
			});
		}
	}

	/**
	* Adds a class to the active HTML element's classList and updates the class list display.
	* @throws {TypeError} - Throws an error if the active element is not an HTML element.
	* @throws {Error} - Throws an error if the class to be added is already present in the removed classes.
	*/
	addClass() {
		try {
			if (!(this.active instanceof HTMLElement)) {
				throw new TypeError('Active element must be an HTML element.');
			}
	
			const addClassElement = this.editor.elements.addclass;
			const addClassValue = addClassElement.value.trim();
	
			if (addClassValue && this.active) {
				const { classes, removed } = this.getClasses(this.active);
	
				const classesToAdd = addClassValue.split(/\s+/);
	
				for (const classToAdd of classesToAdd) {
					if (removed.includes(classToAdd)) {
						throw new Error(`Class "${classToAdd}" is already present in the removed classes.`);
					}
				}
	
				this.active.classList.add(...classesToAdd);
				this.updateClassList();
				addClassElement.value = '';
			}
		} catch (error) {
			console.error('An error occurred while adding a class:', error.message);
			throw error;
		}
	}

	/**
	* Adds a scroll listener to the window and updates a CSS variable: `--scroll-y`
	* on the specified node to reflect the current scroll position.
	* @param {HTMLElement} node - The HTML element to update with scroll position. Defaults to document.body if not provided.
	*/
	addDocumentScroll(node = document.body) {
		let ticking = false;
		let scrollYcur = 0;
		let scrollY = 0;
		window.addEventListener('scroll', () => {
			scrollY = window.scrollY;
			if (scrollY < 0) { scrollY = 0; }
			if (!ticking) {
				window.requestAnimationFrame(() => {
					node.style.setProperty('--scroll-y', scrollY);
					scrollYcur = scrollY;
					ticking = false;
				});
				ticking = true;
			}
		})
	}

	/**
 	* Makes an HTML element draggable using pointer events.
 	* @param {HTMLElement} handle - The element that serves as the draggable handle.
 	* @param {HTMLElement} panel - The element to be dragged.
 	*/
	addDraggable(handle, panel, propX = '--uie-x', propY = '--uie-y') {
		let startX, startY;

		function start(e) {
			startX = e.clientX;
			startY = e.clientY;
			handle.setPointerCapture(e.pointerId);
			handle.addEventListener('pointermove', move);
		}

		function end() {
			handle.removeEventListener('pointermove', move);
		}

		function move(e) {
				e.preventDefault();

				const deltaX = startX - e.clientX;
				const deltaY = startY - e.clientY;
				startX = e.clientX;
				startY = e.clientY;

				let newX = panel.offsetLeft - deltaX;
				let newY = panel.offsetTop - deltaY;

				newX = Math.max(0, Math.min(newX, window.innerWidth - panel.offsetWidth));
				newY = Math.max(0, Math.min(newY, window.innerHeight - panel.offsetHeight));

				panel.style.setProperty(propX, newX + 'px');
				panel.style.setProperty(propY, newY + 'px');
		}

		handle.addEventListener('pointerdown', start);
		handle.addEventListener('pointerup', end);
		handle.addEventListener('pointercancel', end);
		// Prevents default touchstart behavior to avoid conflicts with pointer events.
		handle.addEventListener('touchstart', (e) => e.preventDefault());
	}

	/**
	 * Applies an action to the editor based on the specified action and target element.
	 * @param {string} action - The action to perform ('copy', 'cut', 'first', 'insert', 'last', 'next', 'paste', 'prev', 'replace').
	 * @param {HTMLElement} element - The target element for the action.
	 * @throws {Error} - Throws an error if the action is not supported.
	 */
	applyAction(action, element) {
		switch (action) {
			case 'copy':
				this.copy = element;
				this.outline.classList.add('uie-copy');
				break;
			case 'cut':
				this.copy = element;
				const parent = element.parentNode;
				element.remove();
				this.setActive(parent);
				break;
			case 'first':
				const firstElement = element.parentNode.firstElementChild;
				if (firstElement) {
					firstElement.insertAdjacentElement('beforebegin', element);
					this.setActive(element);
				}
				break;
			case 'insert':
				if (element) {
					const component = this.config.elements.flatMap(group => group.items).find(obj => obj.key === element);
					if (component && component.template) {
						const template = this.renderTemplateFromString(component.template, component.config ? component.config : {});
						this.active.insertAdjacentHTML('beforeend', template);
						this.setActive(this.active);
					}
				}
				break;
			case 'last':
				const lastElement = element.parentNode.lastElementChild;
				if (lastElement) {
					lastElement.insertAdjacentElement('afterend', element);
					this.setActive(element);
				}
				break;
			case 'next':
				const nextElement = element.nextElementSibling;
				if (nextElement) {
					nextElement.insertAdjacentElement('afterend', element);
					this.setActive(element);
				}
				break;
			case 'paste':
				if (this.copy) {
					const newNode = this.copy.cloneNode(true);
					element.insertAdjacentElement('beforeend', newNode);
					this.setActive(newNode);
				}
				break;
			case 'prev':
				const previousElement = element.previousElementSibling;
				if (previousElement) {
					previousElement.insertAdjacentElement('beforebegin', element);
					this.setActive(element);
				}
				break;
			case 'replace':
				if (!this.copy) return;
				const newNode = this.copy.cloneNode(true);
				element.replaceWith(newNode);
				this.setActive(newNode);
				break;
			default:
				throw new Error(`Unsupported action: ${action}`);
		}
	}

	/**
	* Dispatches a custom event with the specified name and detail.
	*
	* @param {string} name - The name of the custom event.
	* @param {any} detail - The data to be associated with the custom event.
	* @throws {Error} Will throw an error if the event could not be dispatched.
	*/
	dispatch(name, detail) {
		this.dispatchEvent(new CustomEvent(name, { detail }));
		console.log(name, detail)
	}

	/**
	* Performs a specified action on a DOM element.
	* @param {string} action - The action to perform. Can be 'copy', 'cut', 'paste', 'replace', 'first', 'last', 'next', or 'prev'.
	* @param {HTMLElement} [element=this.active] - The element to perform the action on. Defaults to the currently active element.
	* @throws {Error} Will throw an error if an unsupported action is provided.
	*/
	domAction(action, element = this.active) {
		try {
			const storeAction = (stack, reverseStack, action, element) => {
				stack.push({ action, element: element.cloneNode(true) });
				// Clear the redo stack when a new action is performed
				reverseStack.length = 0;
			};
	
			const undo = (stack, reverseStack) => {
				const lastAction = stack.pop();
				if (lastAction) {
					const obj = { action: lastAction.action, element: element.cloneNode(true) }
					reverseStack.push(obj);
					this.dispatch('undo', obj);
// TODO: Apply action
// this.applyAction(lastAction.action, lastAction.element);
				}
			};
	
			const redo = (stack, reverseStack) => {
				const lastUndoneAction = reverseStack.pop();
				if (lastUndoneAction) {
					const obj = { action: lastUndoneAction.action, element: element.cloneNode(true) }
					stack.push(obj);
					this.dispatch('redo', obj);
// TODO: Apply action
// this.applyAction(lastUndoneAction.action, lastUndoneAction.element);
				}
			};

			switch (action) {
				case 'cut':
				case 'first':
				case 'last':
				case 'next':
				case 'paste':
				case 'prev':
				case 'replace':
					storeAction(this.undoStack, this.redoStack, action, element);
					this.applyAction(action, element);
					break;
				case 'copy':
				case 'insert':
					this.applyAction(action, element);
					break;
				case 'undo':
					undo(this.undoStack, this.redoStack);
					break;
				case 'redo':
					redo(this.undoStack, this.redoStack);
					break;
				default:
					throw new Error(`Unsupported action: ${action}`);
			}
		} catch (error) {
			console.error('An error occurred in domAction:', error);
		}
	}

	/**
	* Finds a component by its key from the configuration.
	* @param {string} key - The key of the component to find.
	* @returns {Object} - The found component object.
	*/
	findComponentByKey(key) {
		return this.config.elements.flatMap(group => group.items).find(obj => obj.key === key);
	}

	/**
	 * Returns the classList of an HTML element and its optional `data-removed` attribute.
	 * @param {HTMLElement} node - The HTML element.
	 * @returns {Object} - Object containing the classList and removed classes of the specified element.
	 * @throws {TypeError} - Throws an error if the provided node is not an HTML element.
	 */
	getClasses(node) {
		if (!(node instanceof HTMLElement)) {
			throw new TypeError('Parameter "node" must be an HTML element.');
		}
		try {
			const classes = Array.from(node.classList).filter(className => className.trim() !== '');
			const removed = Array.from(node.dataset?.removed?.trim().split(/\s+/) || []).filter(className => className.trim() !== '');
			return { classes, removed };
		} catch (error) {
			console.error('An error occurred while getting classes:', error.message);
			throw error;
		}
	}

	/**
	 * Generates an SVG icon with paths from icon{object}[name].
	 * @param {string} name - The name of the icon.
	 * @returns {string} - SVG markup for the specified icon.
	 */
	icon = (name) => {
		return this.icons[name] ? `<svg viewBox="0 0 24 24">${this.icons[name].map(path => `<path d="${path}"/>`).join('')}</svg>` : '';
	}

	/**
	* Navigates to a sibling or parent element based on the specified property.
	* Updates the active element accordingly.
	* @param {string} property - The property indicating the type of navigation ('firstElementChild', 'previousElementSibling', 'nextElementSibling', 'parentNode').
	*/
	navigate(property) {
		if (this.active[property]) {
			this.setActive(this.active[property]);
		}
	}

	/**
	* Handles the click event for the editor and its buttons/actions.
	* @param {PointerEvent} e - The click event.
 	*/
	onClick = (e) => {
		try {
			const target = e.composedPath().shift();
			if (target === this) {
				/* Target is the editor, thus grab element below */
				this.setActive(document.elementsFromPoint(e.clientX, e.clientY)[1]);
				this.editor.showPopover();
			}
			else {
				/* Target is a button/action in the editor */
				const cmd = target.dataset.click;
				if (!cmd) return;
				switch (cmd) {
					case 'add-class': this.addClass(); break;
					case 'close': this.editor.hidePopover(); break;
					case 'colorscheme': this.editor.classList.toggle('uie-colorscheme'); break;
					case 'dom-copy': this.domAction('copy'); break;
					case 'dom-cut': this.domAction('cut'); break;
					case 'dom-first': this.domAction('first'); break;
					case 'dom-insert': this.domAction('insert', target.value); break;
					case 'dom-last': this.domAction('last'); break;
					case 'dom-next': this.domAction('next'); break;
					case 'dom-paste': this.domAction('paste'); break;
					case 'dom-prev': this.domAction('prev'); break;
					case 'dom-redo': this.domAction('redo'); break;
					case 'dom-replace': this.domAction('replace'); break;
					case 'dom-undo': this.domAction('undo'); break;
					case 'nav-down':
					case 'nav-first': this.navigate('firstElementChild'); break;
					case 'nav-last': this.navigate('lastElementChild'); break;
					case 'nav-left': this.navigate('previousElementSibling'); break;
					case 'nav-right': this.navigate('nextElementSibling'); break;
					case 'nav-up': this.navigate('parentNode'); break;
					case 'sync': this.active.innerHTML = this.editor.elements['uie-html'].value; break;
					case 'toggle': this.setAttribute('open', target.checked); break;
					default: break;
				}
			}
		} catch (error) {
			console.error('Error:', error);
		}
	}

	/**
	* Handles the input event, updating properties based on user input.
	* @param {InputEvent} e - The input event.
	*/
	onInput = (event) => {
		const node = event.target;
		let value = node.value;

		/* Handle component configuration-updates */
		if (node.form === this.componentConfig) {
			const key = node.dataset.key;
			if (!key) return;
			const component = this.findComponentByKey(key);
			if (component) {
				const property = component.config.find(obj => obj.key === node.dataset.prop);
				if (property) property.value = value;
			}
			return;
		}

		/* Handle style-updates */
		if (node.form === this.formStyles) {
			const breakpoint = this.editor.elements.breakpoint.value || '';

			if (node.hasAttribute('data-values')) value = node.dataset.values.split(',')[node.valueAsNumber];

			if (node.hasAttribute('data-prefix')) {
				/* Remove any classes matching the prefix */
				value = breakpoint + node.dataset.prefix + value;

				const { classes, removed } = this.getClasses(this.active);

				classes.forEach(className => {
					if (className.startsWith(breakpoint + node.dataset.prefix)) {
						this.active.classList.remove(className);
					}
				})
				removed.forEach(className => {
					if (className.startsWith(breakpoint + node.dataset.prefix)) {
						this.active.dataset.removed = this.active.dataset.removed.replace(className, '');
					}
				})

				this.active.classList.add(value);
				this.updateClassList();
			}
		}

		if (node.type === 'range' && node.previousElementSibling) {
			node.previousElementSibling.dataset.value = value;
		}

		if (node.dataset.property) {
			if (node.type === 'checkbox') {
				this.style.setProperty(node.dataset.property, node.checked ? 1 : 0);
			} else {
				this.style.setProperty(node.dataset.property, value + (node.dataset.unit || ''));
			}
			return;
		}

		switch(node.name) {
			/* Update the selected styles in the editor when breakpoint change */
			case 'breakpoint': this.updateStyles(); break;
			/* Enable/Disable CSS class for `this.active` */
			case 'classname':
				if (!node.checked) {
					this.active.classList.remove(value);
					this.active.dataset.removed = `${this.active.dataset.removed || ''} ${value}`;
				}
				else {
					this.active.classList.add(value);
					this.active.dataset.removed = this.active.dataset.removed.replace(value, '');
				}
				break;
			/* Active Tool */
			case 'tool':
				[...this.tool.children].forEach((child, index) => child.hidden = index !== value - 1);
				break;
		}
	}

	/**
	 * Handles the keydown event, updating properties based on user input.
	 * @param {KeyboardEvent} e - The keydown event.
	 * @returns {void}
	 */
	onKeyDown = (event) => {
		const isCtrlPressed = event.ctrlKey || event.metaKey;
		const keyBindings = {
			'c': () => this.domAction('copy'),
			'v': () => {
				if (this.copy) {
					event.shiftKey ? this.domAction('replace') : this.domAction('paste');
				}
			},
			'arrowup': () => this.navigate('parentNode'),
			'arrowdown': () => this.navigate('firstElementChild'),
			'arrowleft': () => this.navigate('previousElementSibling'),
			'arrowright': () => this.navigate('nextElementSibling'),
			'end': () => this.domAction('last'),
			'home': () => this.domAction('first'),
			'pageup': () => this.domAction('prev'),
			'pagedown': () => this.domAction('next'),
			'x': () => this.domAction('cut'),
			'z': () => event.shiftKey ? this.domAction('redo') : this.domAction('undo'),
		};

		const actionFunction = keyBindings[event.key.toLowerCase()];
		if (actionFunction && isCtrlPressed) {
			event.preventDefault();
			actionFunction();
		}
	}

	/**
	 * Handle the 'pointermove' event: hover elements behind editor-overlay
	 * @param {PointerEvent} e - The pointer event.
	 */
	onMove = (event) => {
		if (this.getAttribute('editor') === 'true') return;
		try {
			const element = document.elementsFromPoint(event.clientX, event.clientY)[1];
			if (element !== this.hovered) {
				if (this.hovered) delete this.hovered.dataset.hover;
				this.hovered = element;
				this.hovered.dataset.hover = '';
			}
		} catch (error) {}
	}

	/**
	 * Handles the 'input' event on the component search input.
	 * @param {Event} event - The input event.
	 */
	onSearch = (event) => { 
		if (event.inputType == "insertReplacementText" || event.inputType == null) {
			const value = event.target.value;
			if (value) {
				const options = Array.from(event.target.list.options);
				const match = options.find(option => option.value === value);
				if (match) {
					const component = this.findComponentByKey(match.dataset.componentKey);
					this.setComponentInfo(component);
				}
			}
			return;
		}
	}

	/**
	* Event handler for the "beforetoggle" event of the popover API.
	* Handles actions before the popover is toggled open or closed.
	* @param {CustomEvent} e - The "beforetoggle" event.
	*/
	onToggle = (event) => {
		if (event.newState === 'open') {
			if (!this.active) return;
			this.setAttribute('editor', 'true');
			if (this.hovered) delete this.hovered.dataset.hover;
			setTimeout(() => this.editor.elements.close.focus(), 0);
		} else {
			this.setAttribute('editor', 'false');
			this.setOutline({ height:0, width:0, x:-9999, y:-9999 });
			setTimeout(() => this.active.focus(), 0);
		}
	}

	/**
	* Renders content from `this.config.elements` into the editor.
	*/
	renderUIConfigElements() {
		if (!this.config?.elements) return '';
		return this.renderUIGroup('Components', 
			this.renderUIFieldset('components', `${this.renderUIInput({ input: { type:'search', list:`components${this.id}`, part:'component-search', placeholder:"Search" }})}
			<datalist id="components${this.id}">${
				this.config.elements.map(
					group => `<optgroup label="${group.name}">${group.items.map(
						component => `<option value="${component.name}" data-component-key="${component.key}">${group.name}</option>`
					).join('')}</optgroup>`
				).join('')}</datalist>
				<output name="component-info"></output>
				<button type="button" data-click="dom-insert" name="component-insert" value="">Insert component</button>`
			), true) +
		this.renderUIGroup('Configure Component', this.renderUIFieldset('component-configure', ''), true, 'configure-component');
	}

	/**
	* Renders the UI configuration styles recursively.
	* @param {Object} obj - The object representing a style configuration.
	* @param {number} [level=0] - The nesting level.
	* @param {string} [group=''] - The group identifier.
	* @returns {string} - The rendered HTML string.
	*/
	renderUIConfigStyles(obj, level = 0, group = '') {
		if (obj.items && Array.isArray(obj.items) && obj.items.every(item => !item.items)) {
			// If none of the objects within "items" have a key called "items", render a fieldset
			const fieldsetItems = obj.items.map(item => this.renderUIItem(item)).join('');
			return this.renderUIGroup(obj.name, this.renderUIFieldset(obj.name, fieldsetItems, group + level, level), false, group + level, level);
		} else if (obj.items) {
			// If there are "items" and at least one of them has a key called "items", render a group
			return this.renderUIGroup(obj.name, obj.items.map(item => this.renderUIConfigStyles(item, level + 1, group)).join(''), false, group + level, level);
		} else {
			// If it's not a group, render a fieldset
			return this.renderUIFieldset(obj.name, this.renderUIItem(obj), group + level, level);
		}
	}

	/**
	* Helper-method for configuration styles: Renders a UI input item
	* @param {Object} item - The object representing the label/input.
	* @returns {string} - The rendered HTML string for the item.
	*/
	renderUIItem(item) {
		/* TODO!  */
		const obj = {
			input: {
				form: 'styles' + this.id
			},
			label: {},
			text: item.name,
		}
		if (item.color) {
			obj.input.type = 'radio';
			obj.input.style = `--_bg:${item.color}`;
			obj.input.value = item.value || '#000000';
			obj.label.class = 'uie-swatch';
			obj.text = '';
			obj.textAfter = item.name
		}
		if (item.range) {
			obj.input.type = 'range';
			obj.input.min = item.range.at(0);
			obj.input.max = item.range.at(1);
			obj.input.step = 1;
			obj.input.value = item.value || 0;
			obj.input['data-prefix'] = item.prefix;
			obj.label.class = 'uie-range';
		}
		if (item.values) {
			obj.input.type = 'range';
			obj.input.min = item.values.at(0);
			obj.input.max = item.values.length-1;
			obj.input.step = 1;
			obj.input.value = item.value || 0;
			obj.input['data-prefix'] = item.prefix;
			obj.input['data-values'] = item.values.join(',');
			obj.label.class = 'uie-range';
		}
		return this.renderUIInput(obj);
	}

	/**
	* Renders the template for the editor, added to the shadowDOM
	* @returns {string} - The generated markup.
	*/
	renderTemplate() {
		return `
		<div part="outline" style="left:-9999px;top:-9999px"></div>
		<form id="e${this.id}" part="editor" popover>
			<header part="header">
				${this.renderUIButton({ click:'colorscheme', icon:'colorscheme', part:'colorscheme', title:'Toggle Color Scheme' })}
				<h1 part="title">Editor</h1>
				${this.renderUIButton({ click:'close', icon:'close', name:'close', part:'close', title:'Close Editor' })}
			</header>

			${this.renderUIFieldset('tools', this.groups.tabs.map(obj => this.renderUIInput(obj)).join(''), 'tabgroup')}

			<div class="uie-tabs" part="tool">
				<div class="uie-tab">
				${this.renderUIFieldset('breakpoints', this.groups.breakpoints.map(obj => this.renderUIInput(obj)).join(''), 'tabgroup')}
					${this.renderUIGroup('Classlist',
						this.renderUIFieldset('classlist','') +
						this.renderUIFieldset('classname', 
							this.renderUIInput({ input: { type:'text', name:'addclass', placeholder:'Add class(es)' }}) +
							this.renderUIButton({ click:'add-class', icon:'listadd' })
						), true, 'styles0')}
					${this.config?.styles ? this.config.styles.map(obj => this.renderUIConfigStyles(obj, 0, 'styles')).join('') : ''}
				</div>
				<div class="uie-tab" hidden>
					${this.renderUIGroup('Code',
						this.renderUIFieldset('HTML',
							this.renderUITextArea({ text:'HTML', label: { class:'uie-textarea' }, textarea: { name:'uie-html' }}) +
							this.renderUIButton({ click:'sync', icon:'refresh', name:'uie-sync', title:'Sync content' })
						,'actions'), false)}
				</div>
				<div class="uie-tab" hidden>
					${this.renderUIGroup('Selected Element', this.renderUIFieldset('selected_element', this.groups.dom.map(obj => this.renderUIButton(obj)).join('')), true, 'selected_element')}
					${this.renderUIConfigElements()}
				</div>
				<div class="uie-tab" hidden>
					${this.renderUIGroup('Settings', this.renderUIFieldset('settings', this.groups.settings.map(obj => this.renderUIInput(obj)).join('')), true, 'settings')}
				</div>
			</div>

			${this.renderUIGroup('Frame', 
				this.renderUIFieldset('frame', this.groups.frame.map(obj => this.renderUIOutput(obj)).join('')) +
				this.renderUIFieldset('navigation', this.groups.navigation.map(obj => this.renderUIButton(obj)).join('')), 
				false)
			}

		</form>
		<form id="styles${this.id}" part="form-styles"></form>
		<form id="config${this.id}" part="form-config"></form>
		${this.renderUIInput({ label: { part:'toggle' }, input: { checked:this.getAttribute('open') === 'true' ? '' : '_REMOVE_', 'data-click':'toggle', type:'checkbox' }})}`;
	}

	renderTemplateFromString(template, config = {}) {
		if (!template) return '';
		return decodeURIComponent(template).replace(/\{\{(\w+)\}\}/g, (match, key) => {
			const configItem = config.find(item => item.key === key);
			return configItem !== undefined ? configItem.value : match;
		});
	}

	/**
	* Renders a UI button element based on the provided object.
	* @param {Object} obj - The object containing button details.
	* @returns {string} - The rendered HTML for the button element.
	*/
	renderUIButton(obj) {
		return `
		<button type="button"${
			obj.class ? ` class="${obj.class}"`:''}${
			obj.click ? ` data-click="${obj.click}"`:''}${
			obj.name ? ` name="${obj.name}"`:''}${
			obj.part ? ` part="${obj.part}"`:''}${
			obj.title ? ` title="${obj.title}"`:''}${
			obj.value ? ` value="${obj.value}"`:''}>${
			obj.icon ? this.icon(obj.icon) : obj.title}
		</button>`;
	}

	/**
	 * Renders a UI fieldset element based on the provided name.
	 * @param {string} name 
	 * @param {string} content
	 * @returns {string}
	 */
	renderUIFieldset(name, content, part = name) {
		const lower = name.toLowerCase().replace(/\s+/g, '_');
		return `<fieldset name="${lower}" part="${part}">${content}</fieldset>`;
	}

	/**
	* Renders a UI group element based on the provided details.
	* @param {string} name - The name of the group.
	* @param {string} content - The content to be included in the group.
	* @param {boolean} [open=false] - Indicates whether the group should be initially open.
	* @param {string} [group=''] - The name of the group to which this group belongs.
	* @param {number} [level=0] - The level of the group in the hierarchy.
	* @returns {string} - The rendered HTML for the group element.
	*/
	renderUIGroup(name, content, open = false, group = '', level = 0) {
		const lower = name.toLowerCase().replace(/\s+/g, '_');
		return `
		<details${open ? ' open':''}${group ? ` name="${group}"`:''} data-level="${level}">
			<summary>${name}<div part="button">${this.icon('plus')}</div></summary>
			${content}
		</details>`;
	}

	/**
	* Renders a UI input element based on the provided object.
	* @param {Object} obj - The object containing input details.
	* @returns {string} - The rendered HTML for the input element.
	*/
	renderUIInput(obj) {
		return `
		<label ${obj.label && Object.entries(obj.label).map(property => {
			const [key, value] = property;
			return value ? `${key}="${value}"`: key }).join(' ') || ''}>
			${obj.text ? `<span>${obj.text}</span>` : ''}
			<input ${obj.input && Object.entries(obj.input).map(property => {
				const [key, value] = property;
				return value === '_REMOVE_' ? '' : value || value === 0 ? `${key}="${value}"`: key }).join(' ')
			}>${
			obj.icon ? this.icon(obj.icon) : ''}
			${obj.textAfter ? `<span>${obj.textAfter}</span>` : ''}
		</label>`;
	}

	/**
	* Renders a UI output element based on the provided details.
	* @param {Object} obj - The object containing output details.
	* @returns {string} - The rendered HTML for the output element.
	*/
	renderUIOutput(obj) {
		return `
		<label>
			${obj.label ? `<strong>${obj.label}:</strong>`:''}
			<output name="${obj.name||''}">${obj.value||''}</output>
		</label>`;
	}

	renderUITextArea(obj) {
		return `
		<label ${obj.label && Object.entries(obj.label).map(property => {
			const [key, value] = property;
			return value ? `${key}="${value}"`: key }).join(' ')}>
			${obj.text ? `<span>${obj.text}</span>` : ''}
			<textarea ${obj.textarea && Object.entries(obj.textarea).map(property => {
				const [key, value] = property;
				return value ? `${key}="${value}"`: key }).join(' ')
			}></textarea>
		</label>`;
	}

	/**
	* Sets the active HTML element, updating associated values and visual indicators.
	* @param {HTMLElement} node - The HTML element to set as active.
	*/
	setActive(node) {
		if (!node) return;
		if (this.contains(node)) return;
		try {
			if (this.active) {
				this.resizeObserver.unobserve(this.active);
			}
			this.active = node;
			this.resizeObserver.observe(node);
			this.updateClassList();

			// TODO:
			this.editor.elements['uie-html'].value = node.innerHTML;
			if (this.config && this.config.hasOwnProperty('styles')) { this.updateStyles(); }
		}
		catch (error) {
			console.error(error);
		}
	}

	/**
	 * Resets the component info in the editor.
	 * @param {Object} obj - The object containing the component details.
	 */
	setComponentInfo(obj) {
		this.editor.elements['component-info'].value = obj.description || '';
		this.editor.elements['component-insert'].value = obj.key || '';
		this.componentConfigure.hidden = !obj.config;

		if (obj.config) {
			this.editor.elements['component-configure'].innerHTML = obj.config.map(prop => {
				const { key, label, ...input} = prop;
				const config = { text: label, input: { ...input, 'data-key': obj.key, 'data-prop': key, form: `config${this.id}` } };
				return this.renderUIInput(config);
			}).join('');
		}
	}

	/**
	 * Sets the dimensions and tag information of an HTML element in the editor.
	 * If dimensions are not provided, retrieves the dimensions using getBoundingClientRect.
	 * @param {HTMLElement} node - The HTML element.
	 * @param {DOMRect} [dimensions] - The dimensions of the element (optional).
	 * @throws {TypeError} - Throws an error if the provided node is not an HTML element.
	 */
	setFrameValues(node, dimensions) {
		try {
			if (!(node instanceof HTMLElement)) {
				throw new TypeError('Parameter "node" must be an HTML element.');
			}
			const E = this.editor.elements;
			const rect = dimensions ? dimensions : node.getBoundingClientRect();
			E.h.value = rect.height.toFixed(2);
			E.w.value = rect.width.toFixed(2);
			E.x.value = rect.x.toFixed(2);
			E.y.value = rect.y.toFixed(2);
			E.tag.value = node.tagName;
			E.parent.value = node.parentNode.tagName || 'ROOT';
		} catch (error) {
			console.error('An error occurred while setting frame values:', error.message);
			throw error;
		}
	}

	/**
	 * Sets the dimensions and CSS styles of the outline-element.
	 * @param {DOMRect} rect - The dimensions of the active element.
	 * @throws {TypeError} - Throws an error if the provided rect object is not valid.
	 */
	setOutline(rect) {
		try {
			this.outline.classList.remove('uie-copy');
			this.outline.style.cssText = `height: ${
				rect.height}px; width: ${rect.width}px; top: ${
				rect.y + window.scrollY}px; left: ${rect.x}px;`;
		} catch (error) {
			console.error('An error occurred while setting outline:', error.message);
			throw error;
		}
	}

	/**
	 * Updates the classlist in the editor based on the active element.
	 */
	updateClassList() {
		const { classes, removed } = this.getClasses(this.active);
		this.editor.elements.classlist.innerHTML = 
			classes.map(value => this.renderUIInput({ textAfter:value, label: { class:'uie-switch' }, input: { name:'classname', value, checked:'', type:'checkbox' }})).join('\n') +
			removed.map(value => this.renderUIInput({ textAfter:value, label: { class:'uie-switch' }, input: { name:'classname', value, type:'checkbox' }})).join('\n');
	}


	updateStyles() {
		// const { classes, _removed } = this.getClasses(this.active);
		// if (!classes.length) return;
		this.formStyles.reset();
		// const outputs = this.editor.querySelectorAll('[data-value]');
		// if (outputs) {
		// 	outputs.forEach(output => {
		// 		const value = output.nextElementSibling.value;
		// 		output.dataset.value = value;
		// 	});
		// }
		// console.log(outputs)
		// console.log('updateStyles', classes);
	}
}

customElements.define('ui-editor', uiEditor);

/* DEMO */
const editor = document.createElement('ui-editor');
editor.setAttribute('open', 'true')
editor.setAttribute('togglekey', ',')
editor.setAttribute('openkey', '.')
editor.setAttribute('config', 'config.json')
document.body.appendChild(editor);
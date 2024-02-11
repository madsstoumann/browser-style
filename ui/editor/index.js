// const stylesheet = new CSSStyleSheet()
// stylesheet.replaceSync(``)

import stylesheet from './index.css' assert { type: 'css' };
import { renderAttributes, renderButton, renderElement, renderFieldset, renderGroup, renderIcon, renderInput, setBreakpoints, setForm, setIconObject } from './render.js';
import icons from './icons.js';
import tools from './tools.json' assert { type: 'json' };
/**
 * uiEditor
 * Web Component for inspecting and editing HTML elements, toggle classes etc.
 * @author Mads Stoumann
 * @version 1.0.01
 * @summary 11-02-2024
 * @class
 * @extends {HTMLElement}
 */
class uiEditor extends HTMLElement {
	static observedAttributes = ['open'];
	constructor() {
		super();

		this.settings = {
			responsive: this.hasAttribute('responsive'),
		}

		this.undoStack = [];
		this.redoStack = [];
	}

	/**
	* Invoked when the custom element is connected to the document's DOM.
	* Initializes the shadow DOM, sets up event listeners, and performs necessary setup.
	*/
	async connectedCallback() {
		if (window.location !== window.parent.location) {
			console.log("The page is in an iFrame");
			// this.style.cssText = 'background: rgba(0,0,0,.25);inset: 0;position: fixed;';
			return;
		}

		if (this.getAttribute('config')) {
			try {
				const response = await fetch(this.getAttribute('config'));
				this.config = await response.json();
			}
			catch (error) { console.error(`Error fetching config: ${error}`); }
		}

		this.id = `uie${this.uuid()}`;
		setIconObject(icons);
		// this.breakpoints = this.groups.breakpoints.map(breakpoint => breakpoint.input.value);

		const shadow = this.attachShadow({ mode: 'open' })
		const template = document.createElement('template');
		template.innerHTML = this.renderTemplate(tools);
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.appendChild(template.content.cloneNode(true));

		// Initialize references to important elements within the shadow DOM.
		// this.componentConfig = shadow.querySelector(`[part=form-config]`);
		// this.componentConfigure = shadow.querySelector(`[name=configure-component]`);
		// this.componentSearch = shadow.querySelector(`[part=component-search]`);
		// this.draghandle = shadow.querySelector(`[part=title]`);
		// this.editor = shadow.querySelector(`[part=editor]`);
		// this.iframe = this.settings.framed ? shadow.querySelector(`[part=iframe]`) : null;
		// this.formFrame = this.settings.framed ? shadow.querySelector(`[part=form-frame]`) : null;
		// this.formStyles = shadow.querySelector(`[part=form-styles]`);
		// this.outline = shadow.querySelector(`[part=outline]`);
		// this.toggle = shadow.querySelector(`[part=toggle] input`);
		// this.tool = shadow.querySelector(`[part=tool]`);

		// if (this.componentConfigure ) this.componentConfigure.hidden = true;
		// this.breakpoints.shift();

		/* Events */
		// this.addAccessKeys();
		// this.addDocumentScroll();
		// this.addEventListener('click', this.onClick);
		// this.addEventListener('keydown', this.onKeyDown)

		// if (this.settings.framed) {
		// 	this.formFrame.addEventListener('input', this.onFrameInput);
		// 	this.iframe.contentWindow.addEventListener('click', event => {
		// 		const node = event.composedPath().shift();
		// 		console.log(node, node.getBoundingClientRect());
		// 	})
		// }
		// else {
		// 	this.addEventListener('pointermove', this.onMove);
		// 	this.addDraggable(this.draghandle, this.editor);
		// 	this.editor.addEventListener('beforetoggle', this.onToggle)
		// }

		// this.editor.addEventListener('input', this.onInput);
		// if (this.componentSearch) {
		// 	this.componentSearch.addEventListener('input', this.onSearch);
		// 	this.componentSearch.addEventListener('search', () => this.setComponentInfo({}));
		// }

		// this.resizeObserver = new ResizeObserver((entries) => {
		// 	for (const entry of entries) {
		// 		if (entry.contentBoxSize) {
		// 			const rect = entry.target.getBoundingClientRect();
		// 			this.setOutline(rect);
		// 			this.setFrameValues(entry.target, rect);
		// 		}}
		// });
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
	 * Copies the classList of the active element as a string to the clipboard.
	 * @throws {Error} Throws an error if the Clipboard API is not supported or if there is an issue copying to the clipboard.
	 */
	copyClasses() {
		try {
			if (!navigator.clipboard) {
				throw new Error('Clipboard API is not supported in this browser.');
			}
			navigator.clipboard.writeText(this.active.className);
		} catch (error) {
			console.error('Error in copyClasses:', error.message);
			throw error;
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
	 * Filters an array of class names based on the specified breakpoint.
	 * @param {string[]} classList - Array of class names.
	 * @param {string} breakpoint - The breakpoint to filter classes by.
	 * @returns {string[]} - Filtered array of class names.
	 * @throws {Error} Throws an error if an invalid breakpoint is specified.
	 */
	filterClassesByBreakpoint(classList, breakpoint) {
		try {
			if (!breakpoint) {
				// Return classes without any of the specified prefixes
				return classList.filter(className => !this.breakpoints.some(prefix => className.startsWith(prefix)));
			} else if (this.breakpoints.includes(breakpoint)) {
				// Filter classes based on the selected breakpoint
				return classList.filter(className => className === breakpoint || className.startsWith(breakpoint));
			} else {
				throw new Error('Invalid breakpoint specified');
			}
		} catch (error) {
				console.error(`Error in filterClassesByBreakpoint: ${error.message}`);
				// If an error occurs, return the original class list
				return classList;
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
					case 'cls-add': this.addClass(); this.updateFormFromClasses(); break;
					case 'cls-copy': this.copyClasses(); break;
					case 'cls-rem': this.remClasses(); break;
					case 'cls-revert': this.revertClasses(); this.updateFormFromClasses(); break;
					case 'close': this.editor.hidePopover(); break;
					case 'colorscheme': {
						this.editor.classList.toggle('uie-colorscheme');
						if (this.formFrame) this.formFrame.classList.toggle('uie-colorscheme');
					}
					break;
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
	* Handles the input event for formFrame, updating properties based on user input.
	* @param {InputEvent} e - The input event.
	*/
	onFrameInput = (event) => {
		const node = event.target;
		this.iframe.removeAttribute('style');

		/* === SET FRAME DIMENSIONS === */
		if (node.dataset.dimensions) {
			const [width, height] = node.dataset.dimensions.split('x');
			this.iframe.style.width = `${width}px`;
			this.iframe.style.height = `${height}px`;
			this.iframe.style.placeSelf = 'center';
			this.iframe.style.resize = 'none';
		}
	}

	/**
	* Handles the input event, updating properties based on user input.
	* @param {InputEvent} e - The input event.
	*/
	onInput = (event) => {
		const node = event.target;
		let value = node.value;

		/* === COMPONENT CONFIGURATION === */
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

		/* === STYLE UPDATES === */
		if (node.form === this.formStyles) {
			const breakpoint = this.editor.elements.breakpoint.value || '';

			if (node.hasAttribute('data-values')) value = node.dataset.values.split(',')[node.valueAsNumber];

			/* Remove any classes matching the prefix */
			if (node.hasAttribute('data-prefix')) {
				this.setBreakpointLabel(node, breakpoint, value);

				/* Update value to set */
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
			return;
		}

		/* === APP LOGIC === */
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
			case 'breakpoint': this.updateBreakpoint(); break;
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
				this.updateFormFromClasses();
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
		const select = (index) => {
			const name = event.shiftKey ? 'breakpoint' : 'tool';
			const group = this.editor.elements[name][index];
			if (group) {
				group.click();
				group.focus();
			}
		};

		const isCtrlPressed = event.ctrlKey || event.metaKey;
		const keyBindings = {
			'c': () => event.shiftKey && this.domAction('copy'),
			'v': () => {
				if (this.copy && (event.shiftKey ? this.domAction('paste') : (event.altKey ? this.domAction('replace') : null))) {
					return; // Skip preventDefault for Ctrl+V
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
			'1': () => select(0),
			'2': () => select(1),
			'3': () => select(2),
			'4': () => select(3),
			'5': () => select(4),
			'6': () => select(5),
		};

		const actionFunction = keyBindings[event.key.toLowerCase()];
		if (actionFunction && isCtrlPressed) {
			if (!(event.key.toLowerCase() === 'c' || event.key.toLowerCase() === 'v')) {
				event.preventDefault();
			}
			actionFunction();
		}
	};

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
	* Removes the element's data-removed attribute and updates the class list display.
	*/
	remClasses() {
		try {
			delete this.active.dataset.removed;
			this.updateClassList();
		}
		catch (error) { console.error('An error occurred while removing classes:', error.message); }
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
	* Renders the template for the editor, added to the shadowDOM
	* @returns {string} - The generated markup.
	*/
	renderTemplate(tools, config = []) {
		const findObjectByKey = (key, array) => array.find(item => item.key === key) || null;
		const toolbar = renderFieldset({
			name: 'tools',
			part: 'tabgroup',
			fields: tools.map(tool => ({
				ui: 'input',
				obj: {
					icon: tool.icon,
					input: { type: 'radio', name: 'tool', value: tool.name, 'data-sr': '' },
					label: { title: tool.title }
				}
			}))
		});
		const output = tools.map(tool => {
			const configItem = findObjectByKey(tool.key, config) || {};
			setForm(tool.key);
			return `
			<div part="tool">
				${tool.fieldsets ? tool.fieldsets.map(renderFieldset).join('') : ''}
				${tool.groups ? tool.groups.map(renderGroup).join('') : ''}
				${configItem.groups ? configItem.groups.map(renderGroup).join('') : ''}
			</div>
		`}).join('');
		return `
		<div part="outline" style="left:-9999px;top:-9999px"></div>
		<form id="e${this.id}" part="editor"${this.settings.responsive ? '': ``}>
			<header part="header">
				
				<h1 part="title">Editor</h1>
				
			</header>
			${toolbar}<div part="tools">${output}</div>

		</form>

		${renderInput({ label: { part: 'toggle' }, input: { 'data-click': 'toggle', type: 'checkbox', ...(this.getAttribute('open') === 'true' && { checked: '' }) }})}
		`;
	}

	/**
 	* Renders a template string by replacing placeholders with values from the provided configuration.
	* @param {string} template - The template string with placeholders in the format {{key}}.
	* @param {Array} config - An array of objects with key-value pairs to replace the placeholders in the template.
	* @returns {string} The rendered template string.
	*/
	renderTemplateFromString(template, config = {}) {
		if (!template) return '';
		/* Replaces placeholders in the template with values from the configuration. */
		return decodeURIComponent(template).replace(/\{\{(\w+)\}\}/g, (match, key) => {
			const configItem = config.find(item => item.key === key);
			return configItem !== undefined ? configItem.value : match;
		});
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

	/**
	* Renders a textarea element based on the provided details.
	* @param {Object} obj - The object containing output details.
	* @returns {string} - The rendered HTML for the output element.
	*/
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
	* Reverts the active element's classList to its original state.
	*/
	revertClasses() {
		try {
			this.active.className = this.active.dataset.classes;
			this.updateClassList();
		}
		catch (error) { console.error('An error occurred while reverting classes:', error.message); }
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
			if (!this.active.dataset.classes) this.active.dataset.classes = this.active.className;
			this.resizeObserver.observe(node);

			this.updateClassList();
			if (this.config && this.config.hasOwnProperty('styles')) { this.updateFormFromClasses(); }

			// TODO: EDITING
			this.editor.elements['uie-html'].value = node.innerHTML;
		}
		catch (error) {
			console.error(error);
		}
	}

	setBreakpointLabel(node, breakpoint, value) {
		const bp = node.parentNode.querySelector(`var[data-bp="${breakpoint}"]`);
		if (bp) {
			if (node.type === 'radio') {
				const fieldset = node.closest('fieldset');
				if (fieldset) {
					const vars = fieldset.querySelectorAll(`var[data-bp="${breakpoint}"]:not(:empty)`);
					vars.forEach(label => label.textContent = '');
				}
			}
			bp.textContent = node.type === 'radio' ? breakpoint.replace(/[^a-zA-Z0-9]/g, '') : value;
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
	 * Updates the form based on the current breakpoint value and filtered classes.
	 * Uses the provided breakpoint value to filter and update relevant elements.
	 */
	updateBreakpoint() {
		try {
			const classes = this.active.className.split(' ');
			if (!classes.length) return;

			this.formStyles.reset();
			const breakpoint = this.editor.elements.breakpoint.value || '';
			const filteredClasses = this.filterClassesByBreakpoint(classes, breakpoint);

			if (filteredClasses.length) {
				filteredClasses.forEach(cls => {
					const [prefix, value] = cls.replace(breakpoint, '').split('-');
					const input = Array.from(this.formStyles.elements).find(element => element.dataset.prefix === `${prefix}-`) || null;
					this.updateInputElement(input, breakpoint, value);
				});
			}
		} catch (error) {
			console.error(`Error in updateStyles: ${error.message}`);
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

	/**
	 * Updates the form based on the current classes of the active element.
	 * Uses the current breakpoint value to filter and update relevant elements.
	 */
	updateFormFromClasses() {
		if (!this.active) return;

		this.formStyles.reset();
		const vars = this.editor.querySelectorAll('var[data-bp]');
		vars.forEach(varElement => varElement.textContent = '');

		const classes = this.active.className.split(' ');
		const current = this.editor.elements.breakpoint.value || '';

		classes.forEach(cls => {
			const match = cls.match(/^(?:(?<breakpoint>[^:\s]+):)?(?<prefix>[^-]+)-(?<value>.+)/);

			if (match) {
				const breakpoint = match.groups.breakpoint && `${match.groups.breakpoint}:` || '';
				const prefix = match.groups.prefix || null;
				const value = match.groups.value || null;

				const input = this.formStyles.elements[prefix] || null;
				this.updateInputElement(input, breakpoint, value);
			}
		});
	}

	/**
	 * Updates an individual input element based on the provided parameters.
	 *
	 * @param {HTMLElement} input - The input element to be updated.
	 * @param {string} breakpoint - The breakpoint value.
	 * @param {string} value - The value to set for the input element.
	 */
	updateInputElement(input, breakpoint, value) {
		if (input) {
			const bp = input.parentNode?.querySelector(`var[data-bp="${breakpoint}"]`);
			if (bp) bp.textContent = value;

			if (!breakpoint || breakpoint === this.editor.elements.breakpoint.value) {
				if (input.dataset?.values) {
					const selected = input.dataset.values.split(',').findIndex(item => item === value);
					input.value = selected;
				} else if (input.type === 'radio') {
					this.formStyles.elements[input.name].value = value;
				} else {
					input.value = value;
				}
			}
		}
	}

	/**
	 * Generates a random identifier.
	 */
	uuid() {
		return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
	}
}

customElements.define('ui-editor', uiEditor);
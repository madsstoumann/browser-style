import stylesheet from './styles.css' assert { type: 'css' };
import { renderDatalist, renderElement, renderFieldset, renderGroup, renderInput, setBreakpoints, setForm, setIconObject } from './render.js';
import { addDocumentScroll, addDraggable, debounce, findObjectByProperty, uuid } from './utils.js';
import icons from './icons.js';
/**
 * uiEditor
 * Web Component for inspecting and editing HTML elements, toggle classes etc.
 * @author Mads Stoumann
 * @version 1.0.05
 * @summary 15-02-2024
 * @class
 * @extends {HTMLElement}
 */
class uiEditor extends HTMLElement {
	static observedAttributes = ['open'];
	constructor() {
		super();
		this.logo = this.getAttribute('logo') || '';
		this.responsive = this.hasAttribute('responsive'),
		this.undoStack = [];
		this.redoStack = [];
	}

	/**
	* Invoked when the custom element is connected to the document's DOM.
	* Initializes the shadow DOM, sets up event listeners, and performs necessary setup.
	*/
	async connectedCallback() {
		/* App is loaded from within an `<iframe>` */
		if (window.location !== window.parent.location) {
			this.style.cssText = 'background:rgba(0,0,0,0);inset:0;position:fixed;';
			this.addEventListener('pointermove', this.onMove);
			this.addEventListener('click', (event) => {
				const element = document.elementsFromPoint(event.clientX, event.clientY)[1];
				if (!element.dataset.uieId) element.dataset.uid = uuid();
				window.parent.postMessage({ type: 'iframeClick', targetNode: element.dataset.uid }, '*');
			});
			addDocumentScroll();
			return;
		}

		const files = this.getAttribute('files');
		if (files) {
			const filenames = files.split(',').map(name => name.trim());
			this.config = await this.fetchFiles(filenames)
		}
		if (!this.config || !this.config.global) return;

		this.uid = uuid();
		setBreakpoints(this.config.global.breakpoints);
		setIconObject(icons);

		const shadow = this.attachShadow({ mode: 'open' })
		const template = document.createElement('template');
		template.innerHTML = this.renderTemplate();
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.appendChild(template.content.cloneNode(true));

		// Initialize references to important elements within the shadow DOM.
		this.draghandle = shadow.querySelector(`[part~=draghandle]`);
		this.editor = shadow.querySelector(`[part=editor]`);
		this.iframe = this.responsive ? shadow.querySelector(`[part=iframe]`) : null;
		this.formFrame = this.responsive ? shadow.querySelector(`[part=form-frames]`) : null;
		this.formStyles = shadow.querySelector(`[part=form-styles]`);
		this.outline = shadow.querySelector(`[part=outline]`);
		this.search = shadow.querySelector(`[part=component-search]`);
		this.toggle = shadow.querySelector(`[part=toggle]`);
		this.tools = shadow.querySelector(`[part=tools]`);

		// this.componentConfig = shadow.querySelector(`[part=form-config]`);
		// this.componentConfigure = shadow.querySelector(`[name=configure-component]`);
		// if (this.componentConfigure ) this.componentConfigure.hidden = true;

		/* Events */
		this.addAccessKeys();
		addDocumentScroll();
		this.addEventListener('click', this.onClick);
		this.addEventListener('keydown', this.onKeyDown)

		/* Handle iframe */
		if (this.responsive) {
			this.formFrame.addEventListener('input', this.onFrameInput);
			window.addEventListener('message', event => {
				if (event.data && event.data.type === 'scroll') {
					const iframeScrollY = event.data.scrollY;
					document.documentElement.style.setProperty('--iframe-scroll-y', iframeScrollY);
				}
				if (event.data && event.data.type === 'iframeClick') {
					const node = this.iframe.contentDocument.querySelector(`[data-uid="${event.data.targetNode}"]`);
					if (node) this.setActive(node);
				}
			});
		}
		else {
			this.addEventListener('pointermove', this.onMove);
			addDraggable(this.draghandle, this.editor);
			this.editor.addEventListener('beforetoggle', this.onToggle)
		}

		this.editor.addEventListener('input', this.onInput);
		
		/* Component search */
		if (this.search) {
			this.search.addEventListener('input', this.onSearch);
			this.search.addEventListener('search', () => this.setComponentInfo({}));
		}

		/* Detect if active element's contentBoxSize changed */
		this.resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentBoxSize) {
					const rect = entry.target.getBoundingClientRect();
					this.setOutline(rect);
					this.setFrameValues(entry.target, rect);
				}}
		});

		/* Reposition active outline when window resizes */
		window.addEventListener('resize', debounce(() => {
			if (this.active) {
				const rect = this.active.getBoundingClientRect();
				this.setOutline(rect);
				this.setFrameValues(this.active, rect);
			}
		}, 300)); 
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
				if (this.iframe) { /* remove pointer events on body (behind app), when iframe exists */
					document.body.style.pointerEvents = (newValue === 'true') ? 'none' : 'auto';
					return;
				}
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
	*/
	addClass() {
		try {
			const addClassElement = this.formStyles.elements.addclass;
			const addClassValue = addClassElement.value.trim();

			if (addClassValue && this.active) {
				const { classes, removed } = this.getClasses(this.active);
				const classesToAdd = addClassValue.split(/\s+/);
				this.active.classList.add(...classesToAdd);
				this.updateClassList();
				addClassElement.value = '';
			}
		} catch (error) {
			console.error('An error occurred while adding a class:', error.message);
		}
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
					const component = this.config.components.flatMap(group => group.items).find(obj => obj.key === element);
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
		}
	}

	/**
	* Dispatches a custom event with the specified name and detail.
	*
	* @param {string} name - The name of the custom event.
	* @param {any} detail - The data to be associated with the custom event.
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
	 * Fetches configuration files asynchronously.
	 *
	 * @param {string[]} files - An array of file URLs to fetch.
	 * @returns {Promise<Object>} A promise that resolves to an object containing configuration data.
	 * @throws {Error} If an error occurs during the fetch operation for any file.
	 */
	async fetchFiles(files) {
		/**
		 * Object to store configuration data with clean file names.
		 * @type {Object.<string, Object>}
		 */
		const configs = {};

		for (const fileName of files) {
			// Extracts the clean file name without the file extension.
			const cleanFileName = fileName.replace(/^.*\/([^/]+)\.[^/.]+$/, '$1');

			try {
				const response = await fetch(fileName);
				const config = await response.json();
				configs[cleanFileName] = config;
			} catch (error) {
				console.error(`Error fetching ${fileName}: ${error}`);
			}
		}
		return configs;
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
				return classList.filter(className => !this.config.global.breakpoints.slice(1).some(prefix => className.startsWith(prefix)));
			} else if (this.config.global.breakpoints.includes(breakpoint)) {
				return classList.filter(className => className === breakpoint || className.startsWith(breakpoint));
			} else {
				throw new Error('Invalid breakpoint specified');
			}
		} catch (error) {
			console.error(`Error in filterClassesByBreakpoint: ${error.message}`);
			return classList;
		}
	}

	/**
	* Finds a component by its key from the configuration.
	* @param {string} key - The key of the component to find.
	* @returns {Object} - The found component object.
	*/
	findComponentByKey(key) {
		return this.config.components.flatMap(group => group.items).find(obj => obj.key === key);
	}

	/**
	 * Returns the classList of an HTML element and its optional `data-removed` attribute.
	 * @param {HTMLElement} node - The HTML element.
	 * @returns {Object} - Object containing the classList and removed classes of the specified element.
	 */
	getClasses(node) {
		if (!node) return;
		try {
			const classes = Array.from(node.classList).filter(className => className.trim() !== '');
			const removed = Array.from(node.dataset?.removed?.trim().split(/\s+/) || []).filter(className => className.trim() !== '');
			return { classes, removed };
		} catch (error) {
			console.error('An error occurred while getting classes:', error.message);
		}
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
				if (!this.responsive) this.editor.showPopover();
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
					case 'colorscheme': this.classList.toggle('colorscheme'); break;
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
		/*Set frame dimensions */
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
				const breakpointPrefix = breakpoint ? `${breakpoint}${this.config.global.breakpointsDelimiter}` : '';
				value = `${breakpointPrefix}${node.dataset.prefix}${this.config.global.prefixDelimiter}${value}`;
				const { classes, removed } = this.getClasses(this.active);

				classes.forEach(className => {
					if (className.startsWith(breakpointPrefix + node.dataset.prefix)) {
						this.active.classList.remove(className);
					}
				})
				removed.forEach(className => {
					if (className.startsWith(breakpointPrefix + node.dataset.prefix)) {
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
				[...this.tools.children].forEach((child, index) => child.hidden = index !== value - 1);
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
		if (!this.responsive && this.getAttribute('editor') === 'true') return;
		try {
			if (this.responsive) this.style.pointerEvents = 'none';
			const elements = document.elementsFromPoint(event.clientX, event.clientY);
			const element = this.responsive ? elements[0] : elements[1];
			if (element !== this.hovered) {
				if (this.hovered) delete this.hovered.dataset.hover;
				this.hovered = element;
				this.hovered.dataset.hover = '';
			}
			if (this.responsive) this.style.pointerEvents = 'auto';
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
	* Renders the template for the app.
	* @returns {string} - The generated markup.
	*/
	renderTemplate() {
		let forms = '';
		let output = '';
		let toolbarFields = [];

		const tools = this.config.tools || [];
		const plugins = this.config.plugins || [];

		tools.forEach((tool, index) => {
			const configItem = plugins.length && findObjectByProperty(plugins, 'key', tool.key) || {};
			setForm(tool.key, this.uid);
			forms += `<form id="${tool.key}${this.uid}" part="form-${tool.key}"></form>`;
			output += `
			<div part="tool"${index > 0 ? ` hidden`:''}>
				${tool.fieldsets ? tool.fieldsets.map(renderFieldset).join('') : ''}
				${tool.groups ? tool.groups.map(renderGroup).join('') : ''}
				${configItem.groups ? configItem.groups.map(renderGroup).join('') : ''}
			</div>
			`;
			toolbarFields.push({
				obj: {
					icon: tool.icon,
					input: { type: 'radio', name: 'tool', value: index + 1, 'data-sr': '', ...(index === 0 && { checked: '' }) },
					label: { title: tool.title }
				}
			});
		});

		setForm('editor', this.uid);
		const toolbar = renderFieldset({
			name: 'tools',
			part: 'tabgroup',
			fields: toolbarFields
		});

		return `
			<div part="outline" style="left:-9999px;top:-9999px"></div>
			<form id="editor${this.uid}" part="editor"${this.responsive ? '' : ' popover'}>
				<header part="header">
					${this.config.global.header.map(item => renderElement(item)).join('')}
				</header>
				${toolbar}
				<div part="tools">${output}</div>
				${renderGroup(this.config.global.footer)}
				${this.config.components ? renderDatalist(this.config.components, this.uid) : ''}
			</form>
			${forms}
			${this.responsive ? `<form id="frames${this.uid}" part="form-frames">
				${renderFieldset(this.config.global.frames)}
				<iframe src="${window.location.href}" part="iframe" sandbox="allow-scripts allow-forms allow-same-origin allow-pointer-lock allow-presentation allow-popups allow-popups-to-escape-sandbox"></iframe>
			</form>` : ''}
			<label part="toggle">${this.logo ? `<img src="${this.logo}">`:'UI'}
				<input type="checkbox" data-sr data-click="toggle"${this.getAttribute('open') === 'true' ? ' checked' : ''}>
			</label>
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

			if (this.formStyles) {
				this.updateClassList();
				this.updateFormFromClasses();
			}

// TODO: EDITING
// this.editor.elements['uie-html'].value = node.innerHTML;
		}
		catch (error) {
			console.error(error);
		}
	}

	/**
	 * Sets the label for a breakpoint on a specified node.*
	 * @param {HTMLElement} node - The HTML element for which the breakpoint label is set.
	 * @param {string} breakpoint - The breakpoint identifier.
	 * @param {string} value - The value to set for the breakpoint label.
	 */
	setBreakpointLabel(node, breakpoint, value) {
		const bp = node.parentNode.querySelector(`var[data-bp="${breakpoint}"]`);
		const isRadio =  node.type === 'radio';
		if (bp) {
			if (isRadio) {
				const fieldset = node.closest('fieldset');
				if (fieldset) {
					const vars = fieldset.querySelectorAll(`var[data-bp="${breakpoint}"]:not(:empty)`);
					vars.forEach(label => label.textContent = '');
				}
			}
			bp.textContent = isRadio ? breakpoint.replace(/[^a-zA-Z0-9]/g, '') : value;
		}
	}

	/**
	 * Resets the component info in the editor.
	 * @param {Object} obj - The object containing the component details.
	 */
	setComponentInfo(obj) {
		this.editor.elements['component-info'].value = obj.description || '';
		this.editor.elements['component-insert'].value = obj.key || '';
		this.editor.elements['component-configure'].hidden = !obj.config;

		if (obj.config) {
			this.editor.elements['component-configure'].innerHTML = obj.config.map(prop => {
				const { key, label, ...input} = prop;
				const config = { text: label, input: { ...input, 'data-key': obj.key, 'data-prop': key, form: `config${this.uid}` } };
				return renderInput(config);
			}).join('');
		}
	}

	/**
	 * Sets the dimensions and tag information of an HTML element in the editor.
	 * If dimensions are not provided, retrieves the dimensions using getBoundingClientRect.
	 * @param {HTMLElement} node - The HTML element.
	 * @param {DOMRect} [dimensions] - The dimensions of the element (optional).
	 */
	setFrameValues(node, dimensions) {
		try {
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
		}
	}

	/**
	 * Sets the dimensions and CSS styles of the outline-element.
	 * @param {DOMRect} rect - The dimensions of the active element.
	 */
	setOutline(rect) {
		const iframeScrollY = this?.iframe?.contentWindow.scrollY || 0;
		if (this.iframe) {
			const iframeRect = this.iframe.getBoundingClientRect();
			rect.x += iframeRect.x;
			rect.y += iframeRect.y;
		}
		try {
			this.outline.classList.remove('uie-copy');
			this.outline.style.cssText = `height: ${
				rect.height}px; width: ${rect.width}px; top: ${
				rect.y + window.scrollY + iframeScrollY}px; left: ${rect.x}px;`;
		} catch (error) {
			console.error('An error occurred while setting outline:', error.message);
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
					const [prefix, value] = cls.replace(breakpoint+this.config.global.breakpointsDelimiter, '').split(this.config.global.prefixDelimiter);
					const input = Array.from(this.formStyles.elements).find(element => element.dataset.prefix === `${prefix}`) || null;
					this.updateInputElement(input, breakpoint, value);
				});
			}
			/* disable breakpoint specific inputs */
			[...this.formStyles.elements].forEach(input => {
				if (input.hasAttribute('data-breakpoints')) {
					input.disabled = input.dataset.breakpoints.split(',').includes(breakpoint) || breakpoint === '' ? false : true;
					// TODO: To refresh the value of the input if it's disabled, fix for radio inputs
					if (input.disabled) input.value = 0;
				}
		});
		
		} catch (error) {
			console.error(`Error in updateStyles: ${error.message}`);
		}
	}

	/**
	 * Updates the classlist in the editor based on the active element.
	 */
	updateClassList() {
		if (!this.formStyles || !this.active) return;
		const { classes, removed } = this.getClasses(this.active);
		this.editor.elements.classlist.innerHTML = 
			classes.map(value => renderInput({ textAfter:value, input: { name:'classname', value, checked:'', role: 'switch', type:'checkbox' }})).join('\n') +
			removed.map(value => renderInput({ textAfter:value, input: { name:'classname', value, role: 'switch', type:'checkbox' }})).join('\n');
	}

	/**
	 * Updates the form based on the current classes of the active element.
	 * Uses the current breakpoint value to filter and update relevant elements.
	 */
	updateFormFromClasses() {
		if (!this.formStyles || !this.active) return;

		this.formStyles.reset();
		const classes = this.active.className.split(' ');
		const vars = this.editor.querySelectorAll('var[data-bp]');
		vars.forEach(varElement => varElement.textContent = '');

		classes.forEach(cls => {
			const match = cls.match(
				new RegExp(`^(?:(?<breakpoint>[^${this.config.global.breakpointsDelimiter}\\s]+):)?(?<prefix>[^${this.config.global.prefixDelimiter}]+)-(?<value>.+)`)
			);
			if (match) {
				const breakpoint = match.groups.breakpoint && `${match.groups.breakpoint}` || '';
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
}
customElements.define('ui-editor', uiEditor);
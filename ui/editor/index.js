import stylesheet from './styles.css' assert { type: 'css' };

import { findComponentByKey, getConnectedParts, mountComponent, onComponentSearch, setComponentInfo } from './js/components.js';
import { aiPrompt, onSave, onTextEdit } from './js/content.js';
import { addClass, copyClasses, getClasses, parseClassString, remClasses, revertClasses, setUnitClass, updateClassList } from './js/styles.js';
import { renderChat, renderComponentList, renderElement, renderFieldset, renderGroup, renderIcon, renderInput, renderTemplateFromString, setBreakpoints, setForm, setIconObject } from './js/render.js';
import { addDocumentScroll, addDraggable, debounce, findObjectByProperty, getDaysUntilDue, uuid } from './js/utils.js';
import { getXPath, getElementByXPath }	from './js/xpath.js';
import icons from './js/icons.js';

/**
 * uiEditor
 * Highly customizable Web Component for CMS and UI development.
 * @author Mads Stoumann
 * @version 1.0.30
 * @summary 17-03-2024
 * @class
 * @extends {HTMLElement}
 */
class uiEditor extends HTMLElement {
	static observedAttributes = ['open'];
	constructor() {
		super();
		this.logo = this.getAttribute('logo') || '';
		this.responsive = this.hasAttribute('responsive'),
		this.selectable = (this.getAttribute('selectable') || '').split(',').filter(Boolean);
		this.undoStack = [];
		this.redoStack = [];
	}

	/**
	* Invoked when the custom element is connected to the document's DOM.
	* Initializes the shadow DOM, sets up event listeners, and performs necessary setup.
	*/
	async connectedCallback() {
		/* App is loaded from within an `<iframe>`. Set up necessary eventListeners etc., and exit early */
		if (window.location !== window.parent.location) {
			this.style.cssText = '--_sz:calc(var(--uie-grid-sz,20px)*var(--uie-grid-visible,0));inset:0;position:fixed;background:#0000 conic-gradient(from 90deg at 1px 1px,#0000 90deg,rgba(255,0,0,.25) 0);background-size:var(--_sz) var(--_sz);';
			this.addEventListener('pointermove', this.onMove);
			this.addEventListener('click', (event) => {
				const element = document.elementsFromPoint(event.clientX, event.clientY)[1];
				if (!element.dataset.uieId) element.dataset.uid = uuid();
				window.parent.postMessage({ type: 'iframeClick', targetNode: element.dataset.uid }, '*');
			});
			addDocumentScroll();
			return;
		}

		/* Fetch config from `files`or endpoints */
		this.config = {};
		const acceptedEndpoints = ['app', 'assets', 'clientdata', 'elements', 'components', 'content', 'styles'];
		const files = this.getAttribute('files').split(',').map(name => {
			const cleanFileName = name.replace(/^.*\/([^/]+)\.[^/.]+$/, '$1');
			return { name: cleanFileName, value: name };
		});

		const endpoints = Array.from(this.attributes)
			.filter(attr => acceptedEndpoints.includes(attr.name))
			.map(attr => ({ name: attr.name, value: attr.value }));

		const configs = [...endpoints, ...files];
		for (const entry of configs) {
			try {
				const response = await fetch(entry.value);
				const config = await response.json();
				this.config[entry.name] = config;
			} catch (error) {
				console.error(`Error fetching ${entry.name}: ${error}`);
			}
		}
		if (!this.config || !this.config.app) return;

console.log(this.config);

		this.uid = uuid();
		setBreakpoints(this.config.app.breakpoints); /* Set global breakpoints in external file: render.js */
		setIconObject(icons);

		const shadow = this.attachShadow({ mode: 'open' })
		const template = document.createElement('template');
		template.innerHTML = this.renderTemplate();
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.appendChild(template.content.cloneNode(true));

		// Initialize references to important elements within the shadow DOM.
		this.aiResult = shadow.querySelector(`[name=airesult]`);
		this.assetImage = shadow.querySelector(`[part=asset-image]`);
		this.breakpointsFieldset = shadow.querySelector(`[name=breakpoints]`);
		this.compConfig = shadow.querySelector(`[name=component-configure]`);
		this.compSearch = shadow.querySelector(`[part=component-search]`);
		this.draghandle = shadow.querySelector(`[part~=draghandle]`);
		this.editor = shadow.querySelector(`[part=editor]`);
		this.iframe = this.responsive ? shadow.querySelector(`[part=iframe]`) : null;
		this.formAssets = shadow.querySelector(`[part=form-assets]`);
		this.formCollaboration = shadow.querySelector(`[part=form-collaboration]`);
		this.formContent = shadow.querySelector(`[part=form-content]`);
		this.formElements = shadow.querySelector(`[part=form-elements]`);
		this.formFrame = this.responsive ? shadow.querySelector(`[part=form-frames]`) : null;
		this.formStyles = shadow.querySelector(`[part=form-styles]`);
		this.messages = shadow.querySelector(`[name=messages]`);
		this.outline = shadow.querySelector(`[part=outline]`);
		this.partUnit = shadow.querySelectorAll(`[part*=unit-]`);
		this.partUtility = shadow.querySelectorAll(`[part*=utility-]`);
		this.tasklist = shadow.querySelector(`[name=tasklist]`);
		this.texteditor = shadow.querySelector(`[part=texteditor]`);
		this.toggle = shadow.querySelector(`[part=toggle]`);
		this.tools = shadow.querySelector(`[part=tools]`);

		/* References to the different tools of the editor */
		[this.STYLES, this.CONTENT, this.ELEMENTS, this.ASSETS, this.COLLABORATION] = this.editor.elements.tool;
		if (this.compConfig ) this.compConfig.hidden = true;

		/* Events */
		addDocumentScroll();
		this.addAccessKeys();
		this.addEventListener('click', this.onClick);
		this.addEventListener('keydown', this.onKeyDown)

		/* Handle iframe, if `responsive`-attribute is set */
		if (this.responsive) {
			this.iframe.onload = () => { /* Load components within iframe */
				const components = this.iframe.contentWindow.document.querySelectorAll('ui-component');
				components.forEach(component => mountComponent(component, this.config.components));
				this.removeAttribute('loader');
			}
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
			addDraggable(this.draghandle, this.editor);
			this.addEventListener('pointermove', this.onMove);
			this.editor.addEventListener('beforetoggle', this.onToggle)
		}

		this.editor.addEventListener('input', this.onInput);

		/* Components */
		if (this.config.components) {
			this.compInfo = this.editor.elements['component-info'];
			this.compInsert = this.editor.elements['component-insert'];

			/* Search for components */
			if (this.compSearch) {
				this.compSearch.addEventListener('input', event => onComponentSearch(event, this.config, this.compConfig, this.compInfo, this.compInsert, this.uid));
				this.compSearch.addEventListener('search', () => setComponentInfo({}, this.compConfig, this.compInfo, this.compInsert, this.uid));
			}

			/* Listen for new components */
			document.body.addEventListener('uiComponentConnected', (event) => {
				const component = event.detail.component;
				if (component) {
					mountComponent(component, this.config.components);
				}
			});

			/* Init Existing components */
			const components = document.querySelectorAll('ui-component');
			components.forEach(component => mountComponent(component, this.config.components));
		}

		/* Set up texteditor */
		if (this.texteditor) {
			this.texteditor.addEventListener('ui-richtext-content', event => onTextEdit(event, this.active));
			this.texteditor.addEventListener('ui-richtext-save', () => onSave(this.active, this.config.components, this));
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
		}, 10));

		/* Add message-icons for collaboration */
		if (this.config.clientdata?.messages) {
			this.renderMessageIcons();
		}

		/* Set initial active element, if in responsive mode */
		if (this.responsive) {
			this.setActive(this.iframe.contentDocument.body);
		}
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
				if (e.shiftKey && e.ctrlKey) {
					/* open editor with last selected element */
					if (e.key === openKey) {
						if (!this.isSelectable(document.activeElement)) return;
						const open = this.editor.togglePopover();
						this.toggle.checked = open;
						this.setAttribute('open', open);
						this.setActive(document.activeElement);
					}
					/* toggle editor */
					if (e.key === toggleKey) {
						this.toggle.checked = !this.toggle.checked;
						this.setAttribute('open', this.toggle.checked);
					}
				}
			});
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
						const template = renderTemplateFromString(component.template, component.config ? component.config : {});
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
 	* Checks if connected parts exist and the editor's connected value is 'true'.
	* @returns {boolean} - Returns true if connected parts exist and the editor's connected value is 'true', otherwise false.
	*/
	connectedPartsExists() {
		return (this.connectedParts.length > 0) && (this.editor.elements.connected.value === 'true');
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
	* Navigates to a sibling or parent element based on the specified property.
	* Updates the active element accordingly. Skips elements with tagName 'UI-COMPONENT'.
	* @param {string} property - The property indicating the type of navigation ('firstElementChild', 'previousElementSibling', 'nextElementSibling', 'parentNode').
	*/
	domNavigate(property) {
		const component = 'UI-COMPONENT';
		const element = this.active[property];
		try {
			if (element && element.tagName === component) {
				let nextElement = element[property] || element.firstElementChild;
				while (nextElement && nextElement.tagName === component) {
					nextElement = nextElement[property] || nextElement.firstElementChild;
				}
				this.setActive(nextElement);
			}
			else {
				if (!element) {
					const parent = this.active.parentNode;
					const parentIsComponent = parent.tagName === component;

					if (parentIsComponent && property === 'nextElementSibling') {
						this.setActive(parent.nextElementSibling);
					}
					else if (parentIsComponent && property === 'previousElementSibling') {
						this.setActive(parent.previousElementSibling);
					}
				}
				else {
					this.setActive(element);
				}
			}
		}
		catch (error) {
			console.error('An error occurred in domNavigate:', error);
		}
	}

	/**
	 * Checks if a given DOM node is selectable based on the defined criteria.
	 * @param {HTMLElement} node - The DOM node to check for selectability.
	 * @returns {boolean} - True if the node is selectable, false otherwise.
	 */
	isSelectable(node) {
		return this.selectable.length === 0 || Object.keys(node.dataset).some(key => this.selectable.includes(key));
	}

	/**
	* Handles the click event for the editor and its buttons/actions.
	* @param {PointerEvent} e - The click event.
 	*/
	onClick = (e) => {
		try {
			const target = e.composedPath().shift();
			if (target === this) {
				if (this.responsive) { return; }
				/* Target is the editor, thus grab element below */
				const elements = document.elementsFromPoint(e.clientX, e.clientY);
				const element = elements.length > 1 ? elements[1] : null;
				if (element) {
					if (this.isSelectable(element)) {
						this.setActive(element);
						this.editor.showPopover();
					}
				}
			}
			else {
				/* Target is a button/action in the editor */
				const cmd = target.dataset.click;
				if (!cmd) return;
				switch (cmd) {
					case 'ai': aiPrompt(
						{ app : this,
							content: this.active, 
							input: this.formContent.elements.aiprompt, 
							node: target, 
							result: this.aiResult,
							services: this.config.app.ai
						}); break;
					case 'cls-add': addClass(this.active, this.editor.elements.addclass, this.editor.elements.classlist); this.updateFormStyles(); break;
					case 'cls-copy': copyClasses(this.active.className); break;
					case 'cls-rem': remClasses(this.active, this.editor.elements.classlist); break;
					case 'cls-revert': revertClasses(this.active, this.editor.elements.classlist); this.updateFormStyles(); break;
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
					case 'nav-down': this.domNavigate('firstElementChild'); break;
					case 'nav-left': this.domNavigate('previousElementSibling'); break;
					case 'nav-right': this.domNavigate('nextElementSibling'); break;
					case 'nav-up': this.domNavigate('parentNode'); break;
					case 'reset-utility': this.resetUtility(); break;
					case 'toggle': this.setAttribute('open', target.checked); break;
					case 'ui-reset': this.uiReset(); break;
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

		if (node.form !== this.editor) {
			this.dispatch('uie-input', { node });
		}

		/* === ELEMENTS === */
		if (node.form === this.formElements) {
			const key = node.dataset.key;
			if (!key) return;
			const component = findComponentByKey(key, this.config.components);
			if (component) {
				const property = component.config.find(obj => obj.key === node.dataset.prop);
				if (property) property.value = value;
			}
			return;
		}

		/* === STYLE UPDATES === */
		if (node.form === this.formStyles) {
			if (node.hasAttribute('data-values')) value = node.dataset.values.split(',')[node.valueAsNumber];

			/* node has `data-prefix`, use utility-based styling */
			if (node.hasAttribute('data-prefix')) {
				const utilityObj = {
					breakpoint: this.editor.elements.breakpoint.value || '',
					colorscheme: this.editor.elements.colorschemes.value || '',
					dynamic: this.editor.elements.dynamics.value || '',
					structural: this.editor.elements.structurals.value || ''
				};

				const colorscheme = utilityObj.colorscheme ? `${utilityObj.colorscheme}${this.config.app.stateDelimiter}` : '';
				const breakpoint = utilityObj.breakpoint ? `${utilityObj.breakpoint}${this.config.app.stateDelimiter}` : '';
				const dynamic = utilityObj.dynamic ? `${utilityObj.dynamic}${this.config.app.stateDelimiter}` : '';
				const structural = utilityObj.structural ? `${utilityObj.structural}${this.config.app.stateDelimiter}` : '';

				this.setUtilityClass(this.active, `${colorscheme}${breakpoint}${structural}${dynamic}${node.dataset.prefix}${this.config.app.prefixDelimiter}${value}`)
				this.setBreakpointLabel(node, utilityObj.breakpoint, value);
			}
			else {
				setUnitClass(this.active, this.formStyles.elements[node.name], value);
			}

			updateClassList(this.active, this.editor.elements.classlist);
			this.updateConnectedParts();
			return;
		}

		/* === ASSETS === */
		if (node.form === this.formAssets) {
			this.assetImage.style.setProperty(node.name, value);
		}

		/* === APP LOGIC === */
		if (node.dataset.property) {
			const elm = this.iframe ? this.iframe.contentDocument.body : this;
			if (node.type === 'checkbox') {
				elm.style.setProperty(node.dataset.property, node.checked ? 1 : 0);
			} else {
				elm.style.setProperty(node.dataset.property, value + (node.dataset.unit || ''));
			}
			return;
		}

		switch(node.name) {
			/* Update the selected styles in the editor when breakpoint change */
			case 'breakpoint':
			case 'colorschemes':
			case 'dynamics':
			case 'structurals': this.updateFormStyles(true); break;
			case 'classname':
				if (!node.checked) {
					this.active.classList.remove(value);
					this.active.dataset.removed = `${this.active.dataset.removed || ''} ${value}`;
				}
				else {
					this.active.classList.add(value);
					this.active.dataset.removed = this.active.dataset.removed.replace(value, '');
				}
				this.updateConnectedParts()
				this.updateFormStyles();
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
			const group = this.editor.elements['tool'][index];
			if (group) {
				group.click();
				group.focus();
			}
		};
		const keyBindings = {
			'arrowup': () => this.domNavigate('parentNode'),
			'arrowdown': () => this.domNavigate('firstElementChild'),
			'arrowleft': () => this.domNavigate('previousElementSibling'),
			'arrowright': () => this.domNavigate('nextElementSibling'),
			'backspace': () => this.domAction('cut'),
			'end': () => this.domAction('last'),
			'home': () => this.domAction('first'),
			'pageup': () => this.domAction('prev'),
			'pagedown': () => this.domAction('next'),
			'c': () => this.domAction('copy'),
			'r': () => this.domAction('replace'),
			'v': () => this.domAction('paste'),
			'x': () => this.domAction('cut'),
			'y': () => this.domAction('redo'),
			'z': () => this.domAction('undo'),
			'1': () => select(0)
		};

		const actionFunction = keyBindings[event.key.toLowerCase()];
		if (actionFunction && event.ctrlKey && event.shiftKey) {
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
				if (this.isSelectable(element)) {
					this.hovered = element;
					this.hovered.dataset.hover = '';
				}
			}
		} catch (error) {
		} finally {
			if (this.responsive) this.style.pointerEvents = 'auto';
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
	 * Renders the messages and renders them in the UI.
	 */
	renderMessages(xPath) {
		const messages = this.config?.clientdata?.messages;
		if (this.messages && messages) {
			const items = messages.find(msg => msg.xpath === xPath)?.items || [];
			this.messages.innerHTML = items.length ? renderChat(Object.assign({ users: this.config.clientdata.users }, { items })) : '';
		}
	}

	renderMessageIcons() {
		if (!this.formCollaboration) return;
		const messages = this.config?.clientdata?.messages;
		if (messages) {
			messages.forEach(msg => {
				const node = getElementByXPath(msg.xpath, this.responsive ? this.iframe.contentDocument: document);
				if (node) {
					const rect = node.getBoundingClientRect();
					const pin = `<div data-xpath="${msg.xpath}" style="--x:${rect.left};--y:${rect.top};">${renderIcon('message', icons)}</div>`;
					this.formCollaboration.insertAdjacentHTML('afterbegin', pin)
				}
			});
		}
	}

	/**
	 * Renders the tasks and updates the tasklist element based on the activeInfo and config.
	 */
	renderTasks(xPath) {
		const tasks = this.config?.clientdata?.tasks;
		if (this.tasklist && tasks) {
			const taskItems = tasks.find(msg => msg.xpath === xPath)?.items || [];
			this.tasklist.innerHTML = taskItems.map(item => {
				const { completed, dueDate, text } = item.task;
				const input = { "part": "checkbox", "type": "checkbox" };
				const label = { "data-days-due": getDaysUntilDue(dueDate) };
				if (completed) input.checked = true;
				return renderInput({ "textAfter": text, input, label });
			}).join('');
		}
	}

	/**
	 * Resets the utility values in the editor.
	 */
	resetUtility() {
		this.editor.elements.colorschemes.value = '';
		this.editor.elements.dynamics.value = '';
		this.editor.elements.structurals.value = '';
		this.updateFormStyles();
	}

	/**
	 * Renders the template for the app.
	 * @returns {string} - The generated markup.
	 */
	renderTemplate() {
		let forms = '';
		let output = '';
		let toolbarFields = [];

		const tools = this.config.app.tools || [];
		const plugins = [
			...(this.config.styles || []),
			...(this.config.content || []),
			...(this.config.elements || []),
			...(this.config.assets || []),
			...(this.config.collaboration || [])
		];

		tools.forEach((tool, index) => {
			const configItem = plugins.length && findObjectByProperty(plugins, 'key', tool.key) || {};
			setForm(tool.key, this.uid);
			forms += `<form id="${tool.key}${this.uid}" part="form-${tool.key}"></form>`;
			output += `
			<div part="tool"${index > 0 ? ` hidden`:''}>
				${tool.fieldsets ? tool.fieldsets.map(renderFieldset).join('') : ''}
				${tool.groups ? tool.groups.map(renderGroup).join('') : ''}
				${configItem.fieldsets ? configItem.fieldsets.map(renderFieldset).join('') : ''}
				${configItem.groups ? configItem.groups.map(renderGroup).join('') : ''}
				${tool?.footer?.fieldsets ? tool.footer.fieldsets.map(renderFieldset).join('') : ''}
				${tool?.footer?.groups ? tool.footer.groups.map(renderGroup).join('') : ''}
			</div>
			`;
			toolbarFields.push({
				icon: tool.icon,
				input: { type: 'radio', name: 'tool', value: index + 1, 'data-sr': '', ...(index === 0 && { checked: '' }) },
				label: { title: tool.title }
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
					${this.config.app.header.map(item => renderElement(item)).join('')}
				</header>
				${toolbar}
				<div part="tools">${output}</div>
				${this.config.app?.footer?.fieldsets ? this.config.app.footer.fieldsets.map(renderFieldset).join(''):''}
				${this.config.app?.footer?.groups ? this.config.app.footer.groups.map(renderGroup).join(''):''}
				${this.config.components ? renderComponentList(this.config.components, this.uid) : ''}
			</form>
			${forms}
			${this.responsive ? `<form id="frames${this.uid}" part="form-frames">
				${renderFieldset(this.config.app.frames)}
				<iframe src="${window.location.href}" part="iframe" sandbox="allow-scripts allow-forms allow-same-origin allow-pointer-lock allow-presentation allow-popups allow-popups-to-escape-sandbox"></iframe>
			</form>` : ''}
			<div part="loader"></div>
			<label part="toggle">${this.logo ? `<img src="${this.logo}">`:'UI'}
				<input type="checkbox" data-sr data-click="toggle"${this.getAttribute('open') === 'true' ? ' checked' : ''}>
			</label>
		`;
	}

	/**
	* Sets the active HTML element, updating associated values and visual indicators.
	* @param {HTMLElement} node - The HTML element to set as active.
	*/
	setActive(node) {
		if (!node || this.contains(node)) return;

		const selectStyles = () => {
			this.STYLES.checked = true;
			this.STYLES.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
		}

		try {
			if (this.active) {
				this.resizeObserver.unobserve(this.active);
				this.activeInfo.classes = this.active.className;
				this.dispatch('uie-inactive', { info: this.activeInfo });
			}

			this.active = node;

			// Observe new node
			if (!node.dataset.classes) node.dataset.classes = node.className;
			this.resizeObserver.observe(node);

			// Update activeInfo
			const { className, dataset: { classes, part, modelKey, content } } = node;
			this.activeInfo = {
				classes: className,
				orgClasses: classes,
				xPath: getXPath(node),
				component: part ? {
					...Object.fromEntries([...node.closest('[data-component]').parentNode.attributes].map(({ name, value }) => [name, value])),
					part,
					modelKey,
					content
				} : null
			};

			// Handle content
			this.CONTENT.parentNode.hidden = !content;
			if (!content && this.CONTENT.checked) selectStyles();
			if (this.formContent && content) {
				const textEditor = this.texteditor && (content === 'text' || content === 'richtext');
				this.texteditor?.setContent(node.innerHTML, content === 'text');
				this.texteditor?.toggleAttribute('hidden', !textEditor);
			}

			// Update connected parts
			this.connectedParts = getConnectedParts(this.editor.elements.connectedgroup, this.activeInfo?.component?.key, part);

			// Filter styles-options in the editor, if `data-styles` is set
			this.styleParts(node);

			// Update styles
			if (this.formStyles) {
				updateClassList(this.active, this.editor.elements.classlist);
				this.updateFormStyles();
			}

			// Handle elements and assets
			const isAsset = ['IMG', 'VIDEO'].includes(node.tagName);
			this.ELEMENTS.parentNode.hidden = isAsset;
			if (isAsset && this.ELEMENTS.checked) selectStyles();
			this.ASSETS.parentNode.hidden = !isAsset;
			if (!isAsset && this.ASSETS.checked) selectStyles();
			if (isAsset) this.assetImage.src = node.src;

			// Render tasks and messages
			this.renderTasks(this.activeInfo.xPath);
			this.renderMessages(this.activeInfo.xPath);

			this.dispatch('uie-active', { info: this.activeInfo })
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
		const bpLabel = node.parentNode.querySelector(`var[data-bp="${breakpoint}"]`);
		const isRadio = node.type === 'radio';
		if (bpLabel) {
			if (isRadio) {
				const fieldset = node.closest('fieldset');
				if (fieldset) {
					const vars = fieldset.querySelectorAll(`var[data-bp="${breakpoint}"]:not(:empty)`);
					vars.forEach(label => label.textContent = '');
				}
			}
			bpLabel.textContent = value;
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
	 * Sets the utility class for a given node.
	 *
	 * @param {HTMLElement} node - The HTML element to set the utility class on.
	 * @param {string} value - The utility class value to set.
	 * @returns {void}
	 */
	setUtilityClass(node, value) {
		const utilityObj = parseClassString(value, this.config.app);
		try {
			const { classes, removed } = getClasses(node);
			classes.forEach(className => {
				const classParsed = parseClassString(className, this.config.app);
				if (
					classParsed.breakpoint === utilityObj.breakpoint &&
					classParsed.colorscheme === utilityObj.colorscheme &&
					classParsed.dynamic === utilityObj.dynamic &&
					classParsed.structural === utilityObj.structural &&
					classParsed.prefix === utilityObj.prefix &&
					classParsed.value !== utilityObj.value
				) {
					node.classList.remove(className);
				}
			});

			if (!classes.includes(value)) {
				node.classList.add(value);
			}

			removed.forEach(className => {
				if (className === value) {
					node.dataset.removed = node.dataset.removed.replace(className, '');
				}
			});

		} catch (error) {
			console.error('An error occurred while setting utility class:', error.message);
		}
	}

	/**
	 * Sets the visibility of style parts based on the provided node.
	 * @param {HTMLElement} node - The node to determine the style parts from.
	 * @returns {void}
	 */
	styleParts(node) {
		try {
			const parts = node.dataset.styles ? node.dataset.styles.split(',') : [];
			const setHiddenProperty = (element, isPartUnit) => {
				const partAttribute = element.getAttribute('part');
				element.hidden = parts.length === 0 ? isPartUnit : !parts.includes(partAttribute);
			};
			this.breakpointsFieldset.hidden = parts.length > 0 && !parts.some(part => part.includes('utility'));
			this.partUtility.forEach(element => setHiddenProperty(element, false));
			this.partUnit.forEach(element => setHiddenProperty(element, true));
		} catch {}
	}

	/**
	 * Collapses all panels in the editor, removes position coordinates.
	 */
	uiReset() {
		this.editor.removeAttribute('style');
		const panels = this.editor.querySelectorAll('details[open]');
		panels.forEach(panel => panel.open = false);
	}

	/**
	 * Updates the connected parts by setting their className to the same value as the active part's className.
 	*/
	 updateConnectedParts() {
		if (this.connectedPartsExists()) {
			this.connectedParts.forEach(part => {
				part.className = this.active.className;
			});
		}
	}

	/**
	 * Updates the value of a form field based on the provided node and value.
	 * @param {HTMLElement} node - The form field element to update.
	 * @param {string} value - The new value for the form field.
	 */
	updateFormField(node, value) {
		if (!node) return;
		let parent = node.parentNode;
		if (node.dataset?.values) {
			node.value = node.dataset.values.split(',').findIndex(item => item === value);
		} else if (node.type === 'radio') {
			this.formStyles.elements[node.name].value = value;
			const checked = Array.from(this.formStyles.elements[node.name]).find(radio => radio.value === value);
			if (checked) parent = checked.parentNode;
		} else {
			node.value = value;
		}
	}

	/**
	 * Updates the form styles based on the active class name and utility select option.
	 * @param {boolean} [utilitySelect=false] - Indicates whether the method was invoked from a utility-select-option (breakpoint, colorscheme etc.) or not.
	 */
	updateFormStyles(utilitySelect = false) {
		try {
			const classes = this.active.className.split(' ');
			if (!utilitySelect) {
				/* Clear all breakpoint labels */
				this.editor.querySelectorAll('var[data-bp]').forEach(varElement => varElement.textContent = '');
			}
			if (!classes.length) return;

			const utilityObj = {
				breakpoint: this.editor.elements.breakpoint.value || '',
				colorscheme: this.editor.elements.colorschemes.value || '',
				dynamic: this.editor.elements.dynamics.value || '',
				structural: this.editor.elements.structurals.value || ''
			};

			this.formStyles.reset();
			const classObjs = classes.map(className => parseClassString(className, this.config.app));
			const elements = Array.from(this.formStyles.elements);

			// Iterate through classObjs and group by prefix
			const classObjsByPrefix = {};
			classObjs.forEach(classObj => {
				if (classObj.prefix) {
					classObjsByPrefix[classObj.prefix] = classObjsByPrefix[classObj.prefix] || [];
					classObjsByPrefix[classObj.prefix].push(classObj);
				}
			});

			// Iterate through groups of class objects with the same prefix
			Object.entries(classObjsByPrefix).forEach(([prefix, classObjsGroup]) => {
				const obj = classObjsGroup.find(obj =>
					obj.breakpoint === utilityObj.breakpoint &&
					obj.colorscheme === utilityObj.colorscheme &&
					obj.dynamic === utilityObj.dynamic &&
					obj.structural === utilityObj.structural
				);

				const input = elements.find(element => element.dataset.prefix === prefix);
				if (input) {
					if (obj) this.updateFormField(input, obj.value);
					if (!utilitySelect) {
						/* Update all breakpoint-labels for input */
						classObjsGroup.forEach(obj => {
							this.setBreakpointLabel(input, obj.breakpoint, obj.value);
						});
					}
				}
			});

			// Handle updateFormField for class objects without a prefix
			classObjs.filter(classObj => !classObj.prefix).forEach(classObj => {
				const input = elements.find(element => element.value === classObj.value);
				if (input) {
					this.updateFormField(input, classObj.value);
				}
			});

			// Disable breakpoint-specific inputs
			[...this.formStyles.elements].forEach(input => {
				if (input.hasAttribute('data-breakpoints')) {
					input.disabled = input.dataset.breakpoints.split(',').includes(utilityObj.breakpoint) || utilityObj.breakpoint === '' ? false : true;
					setTimeout(() => {
						input.style.display = 'none';
						input.offsetHeight;
						input.style.display = '';
					}, 0);
				}
			});
		} catch (error) {
			console.error(`Error in updateStyles: ${error.message}`);
		}
	}
}
customElements.define('ui-editor', uiEditor);
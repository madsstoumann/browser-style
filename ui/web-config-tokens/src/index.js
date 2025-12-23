import '/ui/design-token/index.js';
import { buildRegistry, exportTokensToCSS, toCssValue } from '/ui/design-token-utils/index.js';

const ICONS = {
	up: {
		paths: [
			'M11.293 7.293a1 1 0 0 1 1.32 -.083l.094 .083l6 6l.083 .094l.054 .077l.054 .096l.017 .036l.027 .067l.032 .108l.01 .053l.01 .06l.004 .057l.002 .059l-.002 .059l-.005 .058l-.009 .06l-.01 .052l-.032 .108l-.027 .067l-.07 .132l-.065 .09l-.073 .081l-.094 .083l-.077 .054l-.096 .054l-.036 .017l-.067 .027l-.108 .032l-.053 .01l-.06 .01l-.057 .004l-.059 .002h-12c-.852 0 -1.297 -.986 -.783 -1.623l.076 -.084l6 -6z'
		],
		filled: true
	},
	down: {
		paths: [
			'M18 9c.852 0 1.297 .986 .783 1.623l-.076 .084l-6 6a1 1 0 0 1 -1.32 .083l-.094 -.083l-6 -6l-.083 -.094l-.054 -.077l-.054 -.096l-.017 -.036l-.027 -.067l-.032 -.108l-.01 -.053l-.01 -.06l-.004 -.057v-.118l.005 -.058l.009 -.06l.01 -.052l.032 -.108l.027 -.067l.07 -.132l.065 -.09l.073 -.081l.094 -.083l.077 -.054l.096 -.054l.036 -.017l.067 -.027l.108 -.032l.053 -.01l.06 -.01l.057 -.004l12.059 -.002z'
		],
		filled: true
	},
	edit: {
		paths: [
			'M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4',
			'M13.5 6.5l4 4'
		]
	},
	groupAdd: {
		paths: [
			'M12 19h-7a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v3.5',
			'M16 19h6',
			'M19 16v6'
		]
	},
	groupRemove: {
		paths: [
			'M12 19h-7a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v6',
			'M16 19h6'
		]
	},
	tokenAdd: {
		paths: [
			'M14 3v4a1 1 0 0 0 1 1h4',
			'M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z',
			'M12 11l0 6',
			'M9 14l6 0'
		]
	},
	deleteToken: {
		paths: [
			'M19 2h-14a3 3 0 0 0 -3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3 -3v-14a3 3 0 0 0 -3 -3zm-9.387 6.21l.094 .083l2.293 2.292l2.293 -2.292a1 1 0 0 1 1.497 1.32l-.083 .094l-2.292 2.293l2.292 2.293a1 1 0 0 1 -1.32 1.497l-.094 -.083l-2.293 -2.292l-2.293 2.292a1 1 0 0 1 -1.497 -1.32l.083 -.094l2.292 -2.293l-2.292 -2.293a1 1 0 0 1 1.32 -1.497z'
		],
		filled: true
	}
};

const renderIcon = (icon) => {
	const { paths, filled } = icon;
	const className = filled ? 'icon-filled' : 'icon-outline';
	return `<svg viewBox="0 0 24 24" class="${className}">${paths.map(d => `<path d="${d}" />`).join('')}</svg>`;
};

// Convert camelCase to Title Case
const toTitleCase = (str) => {
	return str
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (s) => s.toUpperCase())
		.trim();
};

// W3C Design Token Types (standard + custom)
const TOKEN_TYPES = [
	// Standard Basic Types
	'color',
	'dimension',
	'fontFamily',
	'fontWeight',
	'fontStyle',
	'duration',
	'cubicBezier',
	'number',
	// Composite Types
	'border',
	'shadow',
	'gradient',
	'typography',
	'transition',
	// Custom Types
	'aspectRatio',
	'cornerShape',
	'customPath'
];

// Get default value for token type
const getDefaultValue = (type) => {
	switch (type) {
		case 'color': return '#000000';
		case 'dimension': return '1rem';
		case 'fontFamily': return ['system-ui', 'sans-serif'];
		case 'fontWeight': return 400;
		case 'fontStyle': return 'normal';
		case 'duration': return '200ms';
		case 'cubicBezier': return [0.4, 0, 0.2, 1];
		case 'number': return 1;
		case 'aspectRatio': return '16/9';
		case 'border': return { color: '#000000', width: '1px', style: 'solid' };
		case 'shadow': return { color: '#00000033', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px' };
		case 'gradient': return [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }];
		case 'typography': return { fontFamily: ['system-ui', 'sans-serif'], fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 };
		case 'transition': return { duration: '200ms', delay: '0ms', timingFunction: [0.4, 0, 0.2, 1] };
		case 'cornerShape': return 'round';
		case 'customPath': return '';
		default: return '';
	}
};

const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--web-config-tokens-gap: .75rem;
		display: block;
		font-family: system-ui, sans-serif;
	}
	details {
		padding-inline-start: calc(attr(data-level type(<number>)) * var(--web-config-tokens-gap));
	}
	[data-token-group] {
		display: grid;
		gap: var(--web-config-tokens-gap);
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		margin-block-start: var(--web-config-tokens-gap);
	}
	[data-level="0"] {
		& > summary {
			font-size: 1.5rem;
			font-weight: 500;
		}
	}
	fieldset { border: 0; margin: 0; padding: 0; min-inline-size: 0; }
	.token-wrapper { position: relative; }
	.token-delete-btn { position: absolute; top: 0; right: 0; z-index: 1; }
	.hidden { display: none; }
	.dialog-actions { margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end; }
	.add-actions { margin-top: 0.5rem; }
	summary {
	border-block-end: 1px solid #CCC;
	padding-block: var(--web-config-tokens-gap);
	display: flex; align-items: center; gap: 0.5rem; justify-content: space-between; cursor: pointer; }
	summary input { font: inherit; border: 1px solid transparent; background: transparent; }
	summary input:focus { border-color: currentColor; background: white; }
	summary > span { font-weight: 500; }
	.actions { display: none; gap: 0.25rem; opacity: 0.4; transition: opacity 0.2s; }
	details[open] > summary .actions { display: flex; }
	summary:hover .actions, .actions:focus-within { opacity: 1; }
	button { cursor: pointer; padding: 0.25rem 0.5rem; border: 1px solid #ccc; background: #eee; border-radius: 3px; font-size: 0.8em; }
	button:hover { background: #ddd; }
	
	button svg {
		width: 1.25rem;
		height: 1.25rem;
		vertical-align: middle;
	}
	button svg.icon-filled { fill: currentColor; stroke: none; }
	button svg.icon-outline { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
	
	input[name="key"] { font-weight: bold; color: #333; }
	design-token { display: block; margin-block: 0.25rem; }
	.token-wrapper button[value="delete"] { opacity: 0; transition: opacity 0.2s; }
	.token-wrapper:hover button[value="delete"], .token-wrapper button[value="delete"]:focus { opacity: 1; }
	dialog { padding: 1rem; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
	dialog::backdrop { background: rgba(0,0,0,0.5); }
	dialog label { display: block; margin-bottom: 0.5rem; }
	dialog input, dialog select { width: 100%; box-sizing: border-box; padding: 0.25rem; margin-top: 0.25rem; }
`);

export default class WebConfigTokens extends HTMLElement {
	#fullTokens = null;
	#registry = null;
	#tokenStyles = null;
	#form = null;
	#dialogElements = null;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [styles];

		// Listen for token changes and update CSS variables
		this.addEventListener('token-changed', (e) => {
			this.handleTokenChange(e.detail);
		});
	}

	async connectedCallback() {
		const src = this.getAttribute('src');
		if (!src) return;
		try {
			const data = await (await fetch(src)).json();
			this.#fullTokens = data;
			this.#registry = buildRegistry(data);

			// Generate CSS custom properties from all tokens
			const config = data.$extensions?.export || {};
			const tokenCSS = exportTokensToCSS(data, {
				layer: config.layer ?? 'design-tokens',
				selector: config.selector ?? ':host'
			});

			// Create and adopt stylesheet with token CSS
			this.#tokenStyles = new CSSStyleSheet();
			this.#tokenStyles.replaceSync(tokenCSS);
			this.shadowRoot.adoptedStyleSheets = [styles, this.#tokenStyles];

			this.#form = document.createElement('form');
			this.#form.id = 'token-editor';
			// Optimized event delegation with early exit for better performance
			this.#form.addEventListener('click', this.handleClick.bind(this));

			// Add dialog for creating groups/tokens
			const dialog = document.createElement('dialog');
			dialog.id = 'create-dialog';
			dialog.innerHTML = `
				<form method="dialog">
					<h3>Create New Item</h3>
					<label>
						Key (Property Name):
						<input name="key" required pattern="[a-zA-Z0-9_\\-]+" title="Alphanumeric, dashes, or underscores">
					</label>
					<label>
						Title (Display Name):
						<input name="title">
					</label>
					<label id="type-field" class="hidden">
						Type:
						<select name="type">
							${TOKEN_TYPES.map(type => `<option value="${type}">${toTitleCase(type)}</option>`).join('')}
						</select>
					</label>
					<div class="dialog-actions">
						<button value="cancel" formnovalidate>Cancel</button>
						<button value="confirm">Create</button>
					</div>
				</form>
			`;
			this.shadowRoot.append(dialog);

			// Cache dialog elements to avoid repeated queries
			this.#dialogElements = {
				dialog,
				form: dialog.querySelector('form'),
				typeField: dialog.querySelector('#type-field'),
				titleEl: dialog.querySelector('h3'),
				confirmBtn: dialog.querySelector('button[value="confirm"]')
			};

			this.#form.append(this.render(data));
			this.shadowRoot.replaceChildren(this.#form, dialog);
		} catch (e) {
			this.shadowRoot.innerHTML = `<p>Error loading tokens: ${e.message}</p>`;
		}
	}

	render(data, path = []) {
		// Leaf node (Token)
		if (data.$value !== undefined) {
			const name = path.join('.');
			const container = document.createElement('div');
			container.className = 'token-wrapper';
			container.innerHTML = `
				<design-token name="${name}" data-path="${name}"></design-token>
				<button name="action" value="delete" title="Delete Token" class="token-delete-btn">
					${renderIcon(ICONS.deleteToken)}
				</button>
			`;

			// Set token data and registry programmatically (can't do via HTML)
			const el = container.querySelector('design-token');
			el.registry = this.#registry;
			el.src = data;

			return container;
		}

		const entries = Object.entries(data).filter(([k]) => !k.startsWith('$'));
		const isRoot = path.length === 0;

		// Root container
		if (isRoot) {
			const fieldset = document.createElement('fieldset');
			entries.forEach(([k, v]) => {
				path.push(k);
				fieldset.append(this.render(v, path));
				path.pop();
			});

			const addBtn = document.createElement('button');
			addBtn.innerHTML = `${renderIcon(ICONS.groupAdd)} Add Group`;
			addBtn.name = 'action';
			addBtn.value = 'add-group';
			addBtn.dataset.path = '';
			fieldset.append(addBtn);

			return fieldset;
		}

		// Group (Details/Summary)
		const details = document.createElement('details');
		const level = path.length - 1;
		const currentPath = path.join('.');
		
		details.setAttribute('data-level', level);
		details.setAttribute('data-path', currentPath);
		
		// Restore accordion behavior:
		// Level 0 groups share the name "token-group" to be exclusive
		// Deeper levels share a name based on their parent path
		details.setAttribute('name', level === 0 ? 'token-group' : path.slice(0, -1).join('-'));
		
		// Only open the first one by default if needed, or let the browser handle it
		// details.open = true; // Removed to allow accordion behavior

		const titleText = data.$extensions?.ui?.title || path[path.length - 1];
		const key = path[path.length - 1];
		const title = data.$extensions?.ui?.title || '';

		const summary = document.createElement('summary');
		summary.innerHTML = `
			<span>${titleText}</span>
			<input type="hidden" name="key" value="${key}" data-path="${currentPath}">
			<input type="hidden" name="title" value="${title}">
			<fieldset class="actions">
				<button name="action" value="edit-group" title="Edit Group" data-path="${currentPath}">${renderIcon(ICONS.edit)}</button>
				<button name="action" value="move-up" title="Move Up">${renderIcon(ICONS.up)}</button>
				<button name="action" value="move-down" title="Move Down">${renderIcon(ICONS.down)}</button>
				<button name="action" value="delete" title="Delete Group">${renderIcon(ICONS.groupRemove)}</button>
			</fieldset>
		`;

		details.append(summary);

		const fieldset = document.createElement('fieldset');

		// Separate tokens and groups for visual organization
		const tokensDiv = document.createElement('div');
		tokensDiv.setAttribute('data-token-group', '');

		const groupsDiv = document.createElement('div');

		let firstGroup = true;
		for (const [k, v] of entries) {
			path.push(k);
			const node = this.render(v, path);
			path.pop();
			if (v.$value !== undefined) {
				tokensDiv.append(node);
			} else {
				if (firstGroup && node.tagName === 'DETAILS') {
					node.open = true;
					firstGroup = false;
				}
				groupsDiv.append(node);
			}
		}

		if (tokensDiv.hasChildNodes()) fieldset.append(tokensDiv);
		fieldset.append(groupsDiv);

		// Add buttons
		const addActions = document.createElement('div');
		addActions.className = 'add-actions';
		addActions.innerHTML = `
			<button name="action" value="add-token" data-path="${currentPath}">${renderIcon(ICONS.tokenAdd)} Token</button>
			<button name="action" value="add-group" data-path="${currentPath}">${renderIcon(ICONS.groupAdd)} Group</button>
		`;
		fieldset.append(addActions);

		details.append(fieldset);

		return details;
	}

	handleClick(e) {
		// Early exit for non-button clicks - major performance improvement
		if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) return;

		const btn = e.target.closest('button');
		if (!btn || btn.name !== 'action') return;

		e.preventDefault();
		const action = btn.value;
		const container = btn.closest('.token-wrapper') || btn.closest('details');
		const path = btn.dataset.path;

		let sibling;
		// Use switch for better performance and readability
		switch (action) {
			case 'delete':
				if (confirm('Are you sure you want to delete this item?')) {
					container.remove();
				}
				break;

			case 'move-up':
				sibling = container.previousElementSibling;
				if (sibling) sibling.before(container);
				break;

			case 'move-down':
				sibling = container.nextElementSibling;
				if (sibling) sibling.after(container);
				break;

			case 'add-group':
			case 'add-token':
			case 'edit-group':
				// Use cached dialog elements
				const { dialog, form, typeField, titleEl, confirmBtn } = this.#dialogElements;

				// Reset form
				form.reset();

				// Configure dialog based on action
				if (action === 'add-token') {
					typeField.classList.remove('hidden');
					titleEl.textContent = 'Add New Token';
					confirmBtn.textContent = 'Create';
				} else if (action === 'add-group') {
					typeField.classList.add('hidden');
					titleEl.textContent = 'Add New Group';
					confirmBtn.textContent = 'Create';
				} else if (action === 'edit-group') {
					typeField.classList.add('hidden');
					titleEl.textContent = 'Edit Group';
					confirmBtn.textContent = 'Save';

					// Pre-fill values
					const summary = container.querySelector('summary');
					const currentKey = summary.querySelector('input[name="key"]').value;
					const currentTitle = summary.querySelector('input[name="title"]').value;

					form.querySelector('input[name="key"]').value = currentKey;
					form.querySelector('input[name="title"]').value = currentTitle;
				}

				// Handle close
				dialog.onclose = () => {
					if (dialog.returnValue === 'confirm') {
						const formData = new FormData(form);
						const key = formData.get('key');
						const title = formData.get('title');
						const type = formData.get('type');

						if (key) {
								if (action === 'edit-group') {
									// Handle Edit
									const summary = container.querySelector('summary');
									const keyInput = summary.querySelector('input[name="key"]');
									const titleInput = summary.querySelector('input[name="title"]');
									const titleSpan = summary.querySelector('span');
									const oldKey = keyInput.value;

									// Update visual title
									titleSpan.textContent = title || key;
									titleInput.value = title;

									// Handle key change (renaming)
									if (oldKey !== key) {
										const parts = path.split('.');
										parts.pop(); // remove old key
										parts.push(key); // add new key
										const newPath = parts.join('.');

										keyInput.value = key;
										keyInput.dataset.path = newPath;
										container.dataset.path = newPath;

										// Update all children paths
										this.updateChildPaths(container, path, newPath);
									}
								} else {
									// Handle Add (Group or Token)
									const parentPath = path ? path.split('.') : [];
									const newPath = [...parentPath, key];
									let node;

									if (action === 'add-group') {
										const newGroup = { $extensions: { ui: { title: title || key } } };
										node = this.render(newGroup, newPath);
										// Insert before the add buttons
										btn.parentElement.before(node);
									} else {
										// Create new token with default value based on type
										const newToken = {
											$type: type,
											$value: getDefaultValue(type),
											$extensions: { ui: { title: title || key } }
										};
										node = this.render(newToken, newPath);

										// Find or create token container
										let tokenGroup = container.querySelector('[data-token-group]');
										if (!tokenGroup) {
											tokenGroup = document.createElement('div');
											tokenGroup.setAttribute('data-token-group', '');
											container.querySelector('fieldset').prepend(tokenGroup);
										}
										tokenGroup.append(node);
									}
								}
							}
						}
					};

					dialog.showModal();
					break;
		}
	}

	updateChildPaths(element, oldPathPrefix, newPathPrefix) {
		// Update all nested inputs and details
		const elements = element.querySelectorAll('[data-path]');
		elements.forEach(el => {
			const currentPath = el.dataset.path;
			if (currentPath.startsWith(oldPathPrefix)) {
				const newPath = newPathPrefix + currentPath.substring(oldPathPrefix.length);
				el.dataset.path = newPath;
				
				if (el.name && el.name !== 'key' && el.name !== 'action') {
					el.name = newPath;
				}
				
				// Update buttons with data-path
				if (el.tagName === 'BUTTON') {
					el.dataset.path = newPath;
				}
			}
		});
	}

	toJSON() {
		if (!this.#form) return null;
		const formData = new FormData(this.#form);
		const obj = {};

		// Helper to set value at path
		const set = (path, value) => {
			const keys = path.split('.');
			let current = obj;
			for (let i = 0; i < keys.length - 1; i++) {
				const key = keys[i];
				if (!current[key]) current[key] = {};
				current = current[key];
			}
			current[keys[keys.length - 1]] = value;
		};

		// Reconstruct object from form data
		// Note: We need to iterate the DOM to respect order, as FormData order is browser-dependent
		// but usually follows DOM order.
		
		// However, our form structure is complex. A better approach for full reconstruction
		// including $extensions and $value is to traverse the DOM structure we built.
		
		const traverse = (element) => {
			const result = {};
			
			// Handle root
			if (element.tagName === 'FORM' || element.tagName === 'FIELDSET') {
				const children = element.children;
				for (const child of children) {
					if (child.tagName === 'DETAILS') {
						const keyInput = child.querySelector('summary > input[name="key"]');
						const key = keyInput ? keyInput.value : null;
						if (key) {
							result[key] = traverse(child.querySelector('fieldset'));
							
							// Add extensions if title exists
							const titleSpan = child.querySelector('summary > span');
							if (titleSpan && titleSpan.textContent) {
								result[key].$extensions = { ui: { title: titleSpan.textContent } };
							}
						}
					} else if (child.tagName === 'DIV' && child.hasAttribute('data-token-group')) {
						// Token group container
						Object.assign(result, traverse(child));
					} else if (child.tagName === 'DIV' && child.querySelector('design-token')) {
						// Token container
						const tokenEl = child.querySelector('design-token');
						const path = tokenEl.dataset.path;
						const key = path.split('.').pop();
						result[key] = tokenEl.src; // Get the token object from the element
					}
				}
				return result;
			}
			
			// Handle token group div
			if (element.tagName === 'DIV' && element.hasAttribute('data-token-group')) {
				for (const child of element.children) {
					if (child.tagName === 'DIV' && child.querySelector('design-token')) {
						const tokenEl = child.querySelector('design-token');
						const path = tokenEl.dataset.path;
						const key = path.split('.').pop();
						result[key] = tokenEl.src;
					}
				}
				return result;
			}
			
			return result;
		};

		return traverse(this.#form);
	}

	handleTokenChange({ token, cssVar }) {
		if (!cssVar || !this.#tokenStyles) return;

		// Regenerate CSS value for this token
		const cssValue = toCssValue(token, this.#registry);

		// Update the CSS variable in the host
		this.style.setProperty(cssVar, cssValue);
	}
}

customElements.define('web-config-tokens', WebConfigTokens);

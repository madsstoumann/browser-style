import { FormElement } from '../common/form.element.js';

/**
 * AutoSuggest
 * @description <auto-suggest> is a custom element that provides a search input field with auto-suggest functionality.
 * @author Mads Stoumann
 * @version 1.0.25
 * @summary 05-11-2025
 * @class AutoSuggest
 * @extends {FormElement}
 */
export class AutoSuggest extends FormElement {

	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	constructor() {
		super();
		this.data = [];
		this.fullDataset = null;
	}

	initializeComponent() {
		this.displayValue = this.getAttribute('display') || '';

		this.defaultValues = {
			input: this.getAttribute('display') || '',
			value: this.getAttribute('value') || ''
		};

		this.initialObject = JSON.parse(this.getAttribute('initial-object') || 'null');
		this.listId = `list${this.uuid()}`;

		this.settings = ['api', 'api-array-path', 'api-display-path', 'api-text-path', 'api-value-path', 'cache', 'debounce', 'info-template', 'status-template', 'invalid', 'label', 'list-mode', 'search-mode', 'search-fields', 'search-operator', 'search-transform'].reduce((s, attr) => {
			s[attr.replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = this.getAttribute(attr) ?? null;
			return s;
		}, {});

		if (!this.settings.api) {
			console.error('API endpoint is not defined.');
			return;
		}

		this.settings.cache = this.settings.cache === 'true';
		this.settings.listMode = this.settings.listMode || 'datalist';
		this.settings.nolimit = this.hasAttribute('nolimit');
		this.settings.debounceTime = parseInt(this.settings.debounce) || 300;

		// Search mode settings
		this.settings.searchMode = this.settings.searchMode || 'api';
		this.settings.searchFields = this.settings.searchFields ?
			this.settings.searchFields.split(',').map(f => f.trim()) :
			[this.settings.apiDisplayPath || 'name'];
		this.settings.searchOperator = (this.settings.searchOperator || 'AND').toUpperCase();
		this.settings.searchTransform = this.settings.searchTransform || 'lowercase';

		// Preserve slot elements before replacing innerHTML (for noshadow mode)
		// Use array to maintain original DOM order
		const preservedSlots = this.hasAttribute('noshadow') ?
			Array.from(this.querySelectorAll('[slot="info"], [slot="status"]'))
			: null;

		this.root.innerHTML = this.template();
		this.input = this.root.querySelector('input');
		this.list = this.root.querySelector(`#${this.listId}`);

		// Restore or get slot references for status updates
		if (preservedSlots) {
			// Re-append preserved slots to the nav element in original order
			const nav = this.root.querySelector('nav[part="slots"]');
			if (nav) {
				preservedSlots.forEach(slot => nav.appendChild(slot));
			}
			// Set references based on slot name
			this.infoSlot = preservedSlots.find(el => el.getAttribute('slot') === 'info');
			this.statusSlot = preservedSlots.find(el => el.getAttribute('slot') === 'status');
		} else {
			// Shadow DOM: get slot references
			this.infoSlot = this.querySelector('[slot="info"]');
			this.statusSlot = this.querySelector('[slot="status"]');
		}

		if (this.isFormElement) {
			this.input.value = this.displayValue;
			const initialValue = this.getAttribute('value') || '';
			this.value = initialValue;
		}

		this.debouncedFetch = this.debounced(this.settings.debounceTime, this.fetchData.bind(this));
		this.addEvents();

		// Pre-load data for local search modes
		if (this.settings.searchMode.startsWith('local')) {
			this.fetchLocalData('').catch(err => {
				console.error('Failed to pre-load data:', err);
			});
		}
	}

	get displayValue() {
		return this.isFormElement ? 
			(this.getAttribute('display') || this.input?.value || '') :
			null;
	}

	set displayValue(v) {
		if (!this.isFormElement) return;
		this.setAttribute('display', v);
		if (this.input) {
			this.input.value = v;
		}
	}

	addEvents() {
		const selected = () => this.settings.listMode === 'ul' ? null : 
			[...this.list.options].find(entry => entry.value === this.input.value);

		this.input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				if (this.settings.nolimit) {
					this.dispatchEvent(new CustomEvent('autoSuggestNoSelection', { bubbles: true }));
					this.reset();
				}
			}
			if (this.settings.listMode === 'ul' && e.key === 'ArrowDown' && this.list.children.length) {
				e.preventDefault();
				this.list.togglePopover(true);
				this.list.children[0].focus();
			}
			if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
				this.resetToDefault();
				if (this.initialObject) this.dispatch(JSON.stringify(this.initialObject), true);
			}
		});

		this.input.addEventListener('input', (e) => {
			const value = this.input.value.length >= this.input.minLength ? this.input.value.toLowerCase() : '';
			if (!value) return;

			const option = selected();
			if (option && (e.inputType === "insertReplacementText" || e.inputType == null)) {
				this.value = option.dataset.value;
				this.reset(false);
				this.dispatch(option.dataset.obj);
				return;
			}
			this.debouncedFetch(value);
		});

		this.input.addEventListener('search', () => {
			if (this.input.value.length === 0) this.reset(true);
			else if (!this.settings.nolimit) {
				const option = selected();
				this.input.setCustomValidity(option ? '' : this.settings.invalid);
				this.input.reportValidity();
			}
		});

		if (this.settings.listMode === 'ul') this.setupULListeners();
	}

	dispatch(dataObj = null, isInitial = false) {
		if (!dataObj) return;
		
		const detail = typeof dataObj === 'string' ?
			JSON.parse(dataObj) :
			dataObj;
			
		if (isInitial) detail.isInitial = true;
		this.dispatchEvent(new CustomEvent('autoSuggestSelect', { detail, bubbles: true }));
	}

	formReset() {
		this.resetToDefault();
		this.updateStatus('');
		this.dispatchEvent(new CustomEvent('autoSuggestClear', { bubbles: true }));
	}

	async fetchData(value) {
		// Handle different search modes
		if (this.settings.searchMode.startsWith('local')) {
			await this.fetchLocalData(value);
		} else {
			// Default API mode
			await this.fetchApiData(value);
		}
	}

	async fetchApiData(value) {
		if (!this.settings.cache || !this.data.length) {
			this.dispatchEvent(new CustomEvent('autoSuggestFetchStart', { bubbles: true }));
			try {
				const response = await fetch(this.settings.api + encodeURIComponent(value));
				const data = await response.json();
				this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd', { bubbles: true }));

				this.data = this.settings.apiArrayPath ?
					this.getNestedValue(data, this.settings.apiArrayPath) || [] :
					Array.isArray(data) ? data : [];

				if (!this.data.length) {
					this.dispatchEvent(new CustomEvent('autoSuggestNoResults', { bubbles: true }));
				}

				this.list.innerHTML = this.render(this.data);

				if (this.settings.listMode === 'ul' && this.data.length) {
					this.list.togglePopover(true);
					this.setAttribute('open', '');
				}
			} catch (error) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error, bubbles: true }));
			}
		}
	}

	async fetchLocalData(value) {
		// Load data once if not already loaded (or if it was externally injected)
		if (!this.fullDataset || !this.fullDataset.length) {
			this.dispatchEvent(new CustomEvent('autoSuggestFetchStart', { bubbles: true }));
			try {
				const response = await fetch(this.settings.api);
				const data = await response.json();
				this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd', { bubbles: true }));

				this.fullDataset = this.settings.apiArrayPath ?
					this.getNestedValue(data, this.settings.apiArrayPath) || [] :
					Array.isArray(data) ? data : [];

				// Pre-process data for search optimization (only if not already pre-processed)
				if (this.fullDataset.length > 0 && !this.fullDataset[0]._searchText) {
					this.fullDataset = this.fullDataset.map(item => {
						const searchText = this.settings.searchFields
							.map(field => this.getNestedValue(item, field))
							.filter(Boolean)
							.join(' ');
						return {
							...item,
							_searchText: this.transformSearchText(searchText)
						};
					});
				}

				// Update info slot with dataset size (only once on load)
				if (this.infoSlot) {
					const template = this.settings.infoTemplate || '{count} items loaded';
					this.updateInfo(template.replace('{count}', this.fullDataset.length));
				}
			} catch (error) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error, bubbles: true }));
				return;
			}
		}

		// Skip filtering if no search query (pre-loading scenario)
		if (!value || value.length < this.settings.minLength) {
			return;
		}

		// Filter data locally
		const filtered = this.filterLocalData(value);
		this.data = filtered;

		if (!filtered.length) {
			this.dispatchEvent(new CustomEvent('autoSuggestNoResults', { bubbles: true }));
		}

		this.list.innerHTML = this.render(filtered);

		if (this.settings.listMode === 'ul' && filtered.length) {
			this.list.togglePopover(true);
			this.setAttribute('open', '');
		}
	}

	transformSearchText(text) {
		if (this.settings.searchTransform === 'lowercase') {
			return text.toLowerCase();
		} else if (this.settings.searchTransform === 'uppercase') {
			return text.toUpperCase();
		}
		return text;
	}

	filterLocalData(query) {
		const transformedQuery = this.transformSearchText(query);

		if (this.settings.searchMode === 'local-keywords') {
			return this.filterByKeywords(transformedQuery);
		} else if (this.settings.searchMode === 'local-fuzzy') {
			return this.filterByFuzzy(transformedQuery);
		} else {
			// Default local mode - simple includes
			return this.fullDataset.filter(item =>
				item._searchText.includes(transformedQuery)
			);
		}
	}

	filterByKeywords(query) {
		const searchTerms = query.split(' ').filter(Boolean);

		return this.fullDataset.filter(item => {
			if (this.settings.searchOperator === 'AND') {
				// All terms must match
				return searchTerms.every(term => item._searchText.includes(term));
			} else {
				// Any term can match (OR)
				return searchTerms.some(term => item._searchText.includes(term));
			}
		});
	}

	/**
	 * Calculates Levenshtein distance between two strings
	 * @param {string} a - First string
	 * @param {string} b - Second string
	 * @returns {number} - Edit distance between strings
	 */
	levenshteinDistance(a, b) {
		const matrix = [];

		// Initialize first column
		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		// Initialize first row
		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		// Fill in the rest of the matrix
		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1, // substitution
						matrix[i][j - 1] + 1,     // insertion
						matrix[i - 1][j] + 1      // deletion
					);
				}
			}
		}

		return matrix[b.length][a.length];
	}

	/**
	 * Calculates similarity score between two strings (0-1)
	 * @param {string} query - Search query
	 * @param {string} target - Target string
	 * @returns {number} - Similarity score (0 = no match, 1 = exact match)
	 */
	calculateSimilarity(query, target) {
		const distance = this.levenshteinDistance(query, target);
		const maxLength = Math.max(query.length, target.length);
		return 1 - (distance / maxLength);
	}

	/**
	 * Fuzzy search implementation
	 * @param {string} query - Search query
	 * @returns {Array} - Filtered and scored results
	 */
	filterByFuzzy(query) {
		const searchTerms = query.split(' ').filter(Boolean);
		const minScore = parseFloat(this.getAttribute('min-score') || '0.6');
		const maxResults = parseInt(this.getAttribute('max-results') || '50');

		// Score each item
		const scoredResults = this.fullDataset.map(item => {
			let totalScore = 0;

			// Check each search term
			for (const term of searchTerms) {
				let bestScore = 0;

				// Split the target text into words
				const targetWords = item._searchText.split(/\s+/);

				// Find best matching word for this term
				for (const word of targetWords) {
					// Exact substring match gets highest score
					if (word.includes(term)) {
						bestScore = Math.max(bestScore, 1.0);
					}
					// Otherwise use fuzzy matching
					else {
						const similarity = this.calculateSimilarity(term, word);
						bestScore = Math.max(bestScore, similarity);
					}
				}

				totalScore += bestScore;
			}

			// Average score across all terms
			const avgScore = totalScore / searchTerms.length;

			return { item, score: avgScore };
		});

		// Filter by minimum score and sort by relevance
		return scoredResults
			.filter(result => result.score >= minScore)
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults)
			.map(result => result.item);
	}

	getNestedValue(obj, key) {
		return key ? key.split('.').reduce((acc, part) => 
			acc && typeof acc === 'object' ? acc[part] : undefined, obj) : undefined;
	}

	render(data) {
		return data.map(obj => {
			const value = this.getNestedValue(obj, this.settings.apiValuePath);
			const display = this.getNestedValue(obj, this.settings.apiDisplayPath);
			const text = this.settings.apiTextPath ? this.getNestedValue(obj, this.settings.apiTextPath) : '';
			const dataObj = this.escapeJsonForHtml(obj);
			return this.settings.listMode === 'ul' 
				? `<li role="option" tabindex="0" data-display="${display}" data-text="${text}" data-value="${value}" data-obj='${dataObj}'>${display}</li>`
				: `<option value="${display}" data-display="${display}" data-text="${text}" data-value="${value}" data-obj='${dataObj}'>${text || ''}</option>`;
		}).join('');
	}

	reset(fullReset = true) {
		if (fullReset) {
			this.resetToDefault();
			this.updateStatus('');
		}
		this.data = [];
		this.list.innerHTML = this.settings.listMode === 'ul' ? '' : '<option value="">';

		if (this.settings.listMode === 'ul') {
			this.list.scrollTo(0, 0);
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}

		this.input.setCustomValidity('');
		this.dispatchEvent(new CustomEvent('autoSuggestClear', { bubbles: true }));
	}

	resetToDefault() {
		const display = this.getNestedValue(this.initialObject, this.settings.apiDisplayPath) || this.defaultValues.input;
		const value = this.getNestedValue(this.initialObject, this.settings.apiValuePath) || this.defaultValues.value;

		if (this.isFormElement) {
			this.displayValue = display;
			this.input.value = display;
			this.value = value;
		} else {
			this.input.value = display;
			this.value = value;
		}

		this.input.setCustomValidity('');
		if (this.settings.listMode === 'ul') {
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
	}

	selectItem(target) {
		const { obj, value } = target.dataset;
		const displayText = target.textContent.trim();

		if (this.isFormElement) {
			super.value = value;
			this.displayValue = displayText;
			this.input.value = displayText;
		} else {
			this.input.value = displayText;
		}

		// Update status slot with template if provided
		if (this.statusSlot && this.settings.statusTemplate) {
			const statusText = this.settings.statusTemplate
				.replace('{display}', displayText)
				.replace('{value}', value);
			this.updateStatus(statusText);
		}

		this.reset(false);
		this.dispatch(obj);
		setTimeout(() => this.input.focus(), 0);
	}

	setupULListeners() {
		this.list.addEventListener('click', (e) => {
			if (e.target?.tagName === 'LI') this.selectItem(e.target);
		});

		this.list.addEventListener('beforetoggle', (e) => {
			if (e.newState === 'closed') this.removeAttribute('open');
		});

		this.list.addEventListener('keydown', (e) => {
			if (e.target?.tagName === 'LI') {
				if (e.key === 'ArrowDown') {
					e.preventDefault();
					const next = e.target.nextElementSibling;
					if (next) next.focus();
				} else if (e.key === 'ArrowUp') {
					e.preventDefault();
					const prev = e.target.previousElementSibling;
					if (prev) prev.focus();
					else this.input.focus();
				} else if (e.key === 'Enter') {
					this.selectItem(e.target);
				}
			}
		});
	}

	updateInfo(message) {
		if (this.infoSlot) {
			this.infoSlot.textContent = message;
		}
	}

	updateStatus(message) {
		if (this.statusSlot) {
			this.statusSlot.textContent = message;
		}
	}

	template() {
		const list = this.settings.listMode === 'ul'
			? `<ul popover id="${this.listId}" part="list" role="listbox" style="position-anchor:--${this.listId}"></ul>`
			: `<datalist id="${this.listId}" part="list"></datalist>`;
		return `
			${this.settings.label ? `<label part="row"><span part="label">
				${this.getAttribute('required') === 'true' ? `<abbr title="required">*</abbr>`:''}${this.settings.label}</span>` : ''}
				<input
					autocomplete="${this.getAttribute('autocomplete') || 'off'}"
					enterkeyhint="search"
					inputmode="search"
					${this.settings.listMode === 'ul' ? '' : `list="${this.listId}"`}
					minlength="${this.getAttribute('minlength') || 3}"
					part="input"
					placeholder="${this.getAttribute('placeholder') || ''}"
					spellcheck="${this.getAttribute('spellcheck') || false}"
					style="anchor-name:--${this.listId}"
					type="${this.getAttribute('type') || 'search'}"
					value="${this.defaultValues.input}">
			${this.settings.label ? '</label>' : ''}
			${list}
			<nav part="slots">
				<slot name="info" part="info"></slot>
				<slot name="status" part="status"></slot>
			</nav>`;
	}
}

AutoSuggest.register();
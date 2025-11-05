import { FormElement } from '../common/form.element.js';

/**
 * @description <auto-suggest> is a custom element that provides a search input field with auto-suggest functionality.
 * @author Mads Stoumann
 * @version 1.1.0
 * @summary 05-11-2025
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

	#initializeSlots(preservedSlots) {
		const findSlot = (name) => preservedSlots ?
			preservedSlots.find(el => el.slot === name) :
			this.querySelector(`[slot="${name}"]`);

		if (preservedSlots) {
			const nav = this.root.querySelector('nav[part="slots"]');
			if (nav) preservedSlots.forEach(slot => nav.appendChild(slot));
		}
		return { info: findSlot('info'), status: findSlot('status') };
	}

	initializeComponent() {
		this.defaultValues = {
			input: this.getAttribute('display') || '',
			value: this.getAttribute('value') || ''
		};
		this.initialObject = JSON.parse(this.getAttribute('initial-object') || 'null');
		this.listId = `list-${this.uuid()}`;

		this.#setupSettings();
		if (!this.settings.api && !this.settings.searchMode.startsWith('local')) {
			console.error('API endpoint is not defined for <auto-suggest>.');
			return;
		}

		const preservedSlots = this.hasAttribute('noshadow') ? [...this.querySelectorAll('[slot="info"], [slot="status"]')] : null;
		this.root.innerHTML = this.template();

		this.input = this.root.querySelector('input');
		this.list = this.root.querySelector(`#${this.listId}`);
		const slots = this.#initializeSlots(preservedSlots);
		this.infoSlot = slots.info;
		this.statusSlot = slots.status;

		if (this.isFormElement) {
			this.displayValue = this.getAttribute('display') || '';
			this.value = this.getAttribute('value') || '';
		}

		this.debouncedFetch = this.debounced(this.settings.debounceTime, this.fetchData.bind(this));
		this.#addEventListeners();

		if (this.settings.searchMode.startsWith('local') && this.settings.api) {
			this.fetchLocalData('').catch(err => console.error('Failed to pre-load data:', err));
		}
	}

	#setupSettings() {
		const attributes = {
			api: null,
			apiArrayPath: null,
			apiDisplayPath: null,
			apiTextPath: null,
			apiValuePath: null,
			cache: 'false',
			debounce: '300',
			infoTemplate: '{count} items loaded',
			statusTemplate: null,
			invalid: 'Please select a valid option.',
			label: null,
			listMode: 'datalist',
			searchMode: 'api',
			searchFields: null,
			searchOperator: 'AND',
			searchTransform: 'lowercase',
			minScore: '0.6',
			maxResults: '50',
			minLength: '3',
			nolimit: false
		};

		this.settings = Object.entries(attributes).reduce((acc, [key, defaultValue]) => {
			const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			const attrValue = this.getAttribute(attrName);
			if (typeof defaultValue === 'boolean') {
				acc[key] = this.hasAttribute(attrName);
			} else if (attrValue !== null) {
				acc[key] = attrValue;
			} else {
				acc[key] = defaultValue;
			}
			return acc;
		}, {});

		// Type conversions and specific logic
		this.settings.cache = this.settings.cache === 'true';
		this.settings.debounceTime = parseInt(this.settings.debounce, 10);
		this.settings.minScore = parseFloat(this.settings.minScore);
		this.settings.maxResults = parseInt(this.settings.maxResults, 10);
		this.settings.minLength = parseInt(this.settings.minLength, 10);
		this.settings.searchFields = this.settings.searchFields ?
			this.settings.searchFields.split(',').map(f => f.trim()) :
			[this.settings.apiDisplayPath || 'name'];
		this.settings.searchOperator = this.settings.searchOperator.toUpperCase();
	}

	get displayValue() {
		return this.isFormElement ? (this.getAttribute('display') || this.input?.value || '') : null;
	}

	set displayValue(v) {
		if (!this.isFormElement) return;
		this.setAttribute('display', v);
		if (this.input) this.input.value = v;
	}

	#addEventListeners() {
		this.input.addEventListener('keydown', this.#handleKeydown.bind(this));
		this.input.addEventListener('input', this.#handleInput.bind(this));
		this.input.addEventListener('search', this.#handleSearch.bind(this));
		if (this.settings.listMode === 'ul') this.#setupULListeners();
	}

	#handleKeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (this.settings.nolimit) {
				this.dispatchEvent(new CustomEvent('autoSuggestNoSelection', { bubbles: true }));
				this.reset();
			}
		} else if (e.key === 'ArrowDown' && this.settings.listMode === 'ul' && this.list.children.length) {
			e.preventDefault();
			this.list.togglePopover(true);
			this.list.children[0]?.focus();
		} else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
			this.resetToDefault();
			if (this.initialObject) this.dispatch(this.initialObject, true);
		}
	}

	#handleInput(e) {
		const value = this.input.value;
		if (value.length < this.settings.minLength) {
			this.reset(false); // Clear suggestions if below minLength
			return;
		}

		const option = this.settings.listMode === 'datalist' ?
			[...this.list.options].find(opt => opt.value === value) : null;

		if (option && (e.inputType === "insertReplacementText" || e.inputType == null)) {
			this.value = option.dataset.value;
			this.reset(false);
			this.dispatch(option.dataset.obj);
			return;
		} else {
			this.debouncedFetch(this.transformSearchText(value));
		}
	}

	#handleSearch() {
		if (this.input.value.length === 0) {
			this.reset(true);
		} else if (!this.settings.nolimit) {
			const option = this.settings.listMode === 'datalist' ?
				[...this.list.options].find(opt => opt.value === this.input.value) : true;
			this.input.setCustomValidity(option ? '' : this.settings.invalid);
			this.input.reportValidity();
		}
	}

	dispatch(dataObj = null, isInitial = false) {
		if (!dataObj) return;
		const detail = typeof dataObj === 'string' ? JSON.parse(dataObj) : dataObj;
		if (isInitial) detail.isInitial = true;
		this.dispatchEvent(new CustomEvent('autoSuggestSelect', { detail, bubbles: true }));
	}

	formReset() {
		this.resetToDefault();
		this.updateStatus('');
		this.dispatchEvent(new CustomEvent('autoSuggestClear', { bubbles: true }));
	}

	async fetchData(value) {
		if (this.settings.searchMode.startsWith('local')) {
			await this.fetchLocalData(value);
		} else {
			await this.fetchApiData(value);
		}
	}

	async fetchApiData(value) {
		if (!this.settings.cache || !this.data.length) {
			this.dispatchEvent(new CustomEvent('autoSuggestFetchStart', { bubbles: true }));
			try {
				const response = await fetch(`${this.settings.api}${encodeURIComponent(value)}`);
				const data = await response.json();
				this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd', { bubbles: true }));

				this.data = this.getNestedValue(data, this.settings.apiArrayPath) || (Array.isArray(data) ? data : []);
				this.#renderResults(this.data);
			} catch (error) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error, bubbles: true }));
			}
		}
	}

	async fetchLocalData(value) {
		if (!this.fullDataset) {
			this.dispatchEvent(new CustomEvent('autoSuggestFetchStart', { bubbles: true }));
			try {
				const response = await fetch(this.settings.api);
				const data = await response.json();
				this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd', { bubbles: true }));

				const rawData = this.getNestedValue(data, this.settings.apiArrayPath) || (Array.isArray(data) ? data : []);
				this.fullDataset = rawData.map(item => ({
					...item,
					_searchText: this.transformSearchText(
						this.settings.searchFields
						.map(field => this.getNestedValue(item, field))
						.filter(Boolean)
						.join(' ')
					)
				}));

				if (this.infoSlot) {
					this.updateInfo(this.settings.infoTemplate.replace('{count}', this.fullDataset.length));
				}
			} catch (error) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error, bubbles: true }));
				return;
			}
		}

		if (!value || value.length < this.settings.minLength) {
			this.#renderResults([]);
			return;
		}

		const filtered = this.filterLocalData(value);
		this.data = filtered;
		this.#renderResults(filtered);
	}

	#renderResults(results) {
		if (!results.length) {
			this.dispatchEvent(new CustomEvent('autoSuggestNoResults', { bubbles: true }));
		}
		this.list.innerHTML = this.render(results);
		if (this.settings.listMode === 'ul') {
			const shouldShow = results.length > 0;
			this.list.togglePopover(shouldShow);
			this.toggleAttribute('open', shouldShow);
		}
	}

	transformSearchText(text) {
		const transform = this.settings.searchTransform;
		if (transform === 'lowercase') return text.toLowerCase();
		if (transform === 'uppercase') return text.toUpperCase();
		return text;
	}

	filterLocalData(query) {
		const transformedQuery = this.transformSearchText(query);
		switch (this.settings.searchMode) {
			case 'local-keywords':
				return this.filterByKeywords(transformedQuery);
			case 'local-fuzzy':
				return this.filterByFuzzy(transformedQuery);
			default:
				return this.fullDataset.filter(item => item._searchText.includes(transformedQuery));
		}
	}

	filterByKeywords(query) {
		const searchTerms = query.split(' ').filter(Boolean);
		const op = this.settings.searchOperator;
		return this.fullDataset.filter(item =>
			op === 'AND' ?
			searchTerms.every(term => item._searchText.includes(term)) :
			searchTerms.some(term => item._searchText.includes(term))
		);
	}

	levenshteinDistance(a, b) {
		if (a.length < b.length) [a, b] = [b, a];
		let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
		let currRow = new Array(b.length + 1);

		for (let i = 1; i <= a.length; i++) {
			currRow[0] = i;
			for (let j = 1; j <= b.length; j++) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1;
				currRow[j] = Math.min(
					prevRow[j - 1] + cost, // substitution
					currRow[j - 1] + 1, // insertion
					prevRow[j] + 1 // deletion
				);
			}
			[prevRow, currRow] = [currRow, prevRow];
		}
		return prevRow[b.length];
	}

	calculateSimilarity(query, target) {
		const distance = this.levenshteinDistance(query, target);
		const maxLength = Math.max(query.length, target.length);
		return maxLength === 0 ? 1 : 1 - (distance / maxLength);
	}

	filterByFuzzy(query) {
		const searchTerms = query.split(' ').filter(Boolean);
		const { minScore, maxResults } = this.settings;

		const scoredResults = this.fullDataset.map(item => {
			const targetWords = item._searchText.split(/\s+/);
			let totalScore = 0;

			for (const term of searchTerms) {
				let bestScore = 0;
				for (const word of targetWords) {
					if (word.includes(term)) {
						bestScore = 1.0;
						break;
					}
					bestScore = Math.max(bestScore, this.calculateSimilarity(term, word));
				}
				totalScore += bestScore;
			}
			const avgScore = searchTerms.length > 0 ? totalScore / searchTerms.length : 0;
			return { item, score: avgScore };
		});

		return scoredResults
			.filter(result => result.score >= minScore)
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults)
			.map(result => result.item);
	}

	getNestedValue(obj, key) {
		return key ? key.split('.').reduce((acc, part) => acc?.[part], obj) : undefined;
	}

	render(data) {
		return data.map(obj => {
			const value = this.getNestedValue(obj, this.settings.apiValuePath) || '';
			const display = this.getNestedValue(obj, this.settings.apiDisplayPath) || '';
			const text = this.getNestedValue(obj, this.settings.apiTextPath) || '';
			const dataObj = this.escapeJsonForHtml(obj);

			return this.settings.listMode === 'ul' ?
				`<li role="option" tabindex="0" data-display="${display}" data-text="${text}" data-value="${value}" data-obj='${dataObj}'>${display}</li>` :
				`<option value="${display}" data-display="${display}" data-text="${text}" data-value="${value}" data-obj='${dataObj}'>${text}</option>`;
		}).join('');
	}

	reset(fullReset = true) {
		if (fullReset) {
			this.resetToDefault();
			this.updateStatus('');
			this.dispatchEvent(new CustomEvent('autoSuggestClear', { bubbles: true }));
		}
		this.data = [];
		this.list.innerHTML = this.settings.listMode === 'ul' ? '' : '<option value=""></option>';

		if (this.settings.listMode === 'ul') {
			this.list.scrollTo(0, 0);
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
		this.input.setCustomValidity('');
	}

	resetToDefault() {
		const display = this.getNestedValue(this.initialObject, this.settings.apiDisplayPath) || this.defaultValues.input;
		const value = this.getNestedValue(this.initialObject, this.settings.apiValuePath) || this.defaultValues.value;

		this.displayValue = display;
		this.value = value;
		this.input.setCustomValidity('');

		if (this.settings.listMode === 'ul') {
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
	}

	selectItem(target) {
		const { obj, value, display } = target.dataset;
		const displayText = display || target.textContent.trim();

		this.value = value;
		this.displayValue = displayText;

		if (this.statusSlot && this.settings.statusTemplate) {
			const statusText = this.settings.statusTemplate
				.replace('{display}', displayText)
				.replace('{value}', value);
			this.updateStatus(statusText);
		}

		this.reset(false);
		this.dispatch(obj);
		this.input.focus();
	}

	#setupULListeners() {
		this.list.addEventListener('click', e => {
			if (e.target?.tagName === 'LI') this.selectItem(e.target);
		});
		this.list.addEventListener('beforetoggle', e => {
			if (e.newState === 'closed') this.removeAttribute('open');
		});
		this.list.addEventListener('keydown', e => {
			const target = e.target;
			if (target?.tagName !== 'LI') return;

			const { key } = e;
			if (key === 'ArrowDown' || key === 'ArrowUp') {
				e.preventDefault();
				const nextEl = key === 'ArrowDown' ? target.nextElementSibling : target.previousElementSibling;
				if (nextEl) nextEl.focus();
				else if (key === 'ArrowUp') this.input.focus();
			} else if (key === 'Enter') {
				this.selectItem(target);
			}
		});
	}

	updateInfo(message) {
		if (this.infoSlot) this.infoSlot.textContent = message;
	}

	updateStatus(message) {
		if (this.statusSlot) this.statusSlot.textContent = message;
	}

	template() {
		const { label, listMode, minLength } = this.settings;
		const list = listMode === 'ul' ?
			`<ul popover id="${this.listId}" part="list" role="listbox" style="position-anchor:--${this.listId}"></ul>` :
			`<datalist id="${this.listId}" part="list"><option value=""></option></datalist>`;

		const requiredIndicator = this.hasAttribute('required') ? `<abbr title="required">*</abbr>` : '';

		return `
			${label ? `<label part="row"><span part="label">${requiredIndicator}${label}</span>` : ''}
				<input
					autocomplete="${this.getAttribute('autocomplete') || 'off'}"
					enterkeyhint="search"
					inputmode="search"
					${listMode === 'datalist' ? `list="${this.listId}"` : ''}
					minlength="${minLength}"
					part="input"
					placeholder="${this.getAttribute('placeholder') || ''}"
					spellcheck="${this.getAttribute('spellcheck') || 'false'}"
					style="anchor-name:--${this.listId}"
					type="${this.getAttribute('type') || 'search'}"
					value="${this.defaultValues.input}">
			${label ? '</label>' : ''}
			${list}
			<nav part="slots">
				<slot name="info" part="info"></slot>
				<slot name="status" part="status"></slot>
			</nav>`;
	}
}

AutoSuggest.register();
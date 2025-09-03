const styles = `
:host {
	--anchor-inset-block-start: anchor(bottom);
	--anchor-inset-inline-start: anchor(left);
	--anchor-inset-block-end: auto;
	--anchor-inset-inline-end: auto;

	position: relative;
	display: inline-block;
}

:host([anchor*="top"]) {
	--anchor-inset-block-start: auto;
	--anchor-inset-block-end: anchor(top);
}

button {
	cursor: pointer;
	background: #fff;
	border: 1px solid #ccc;
	padding: 8px 12px;
	border-radius: 4px;
	min-width: 120px;
	text-align: left;
	anchor-name: var(--anchor-name);
}
fieldset[data-open=false] {
	display: none;
}

fieldset[data-open=true] {
	background: Canvas;
	position: absolute;
	z-index: 1000;
	border: 1px solid ButtonBorder;
	border-radius: 4px;
	display: block;
	padding: 8px;
	min-width: 200px;
	max-width: 300px;
	position-anchor: var(--anchor-name);
	inset-block-start: var(--anchor-inset-block-start);
	inset-inline-start: var(--anchor-inset-inline-start);
	inset-block-end: var(--anchor-inset-block-end);
	inset-inline-end: var(--anchor-inset-inline-end);
	position-try-options: flip-block;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

details.option-group {
	margin: 0;
}

details.option-group summary {
	cursor: pointer;
	padding: 8px;
	font-weight: 500;
	user-select: none;
}

details.option-group summary:hover {
	background: #f5f5f5;
}

fieldset {
	border: none;
	margin: 0;
	padding: 0;
}

label {
	display: block;
	padding: 6px 8px;
	cursor: pointer;
	border-radius: 3px;
	margin: 2px 0;
}

label:hover {
	background: #f0f0f0;
}

input[type="radio"],
input[type="checkbox"] {
	margin-right: 8px;
}

input[type="radio"]:checked,
input[type="checkbox"]:checked {
	accent-color: #007acc;
}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class NestedSelect extends HTMLElement {

	static formAssociated = true;

  #fieldset = null;
  #button = null;
  #boundOutsideClickHandler = null;
  #originalValue = null;

  constructor() {
    super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [sheet];
    this._internals = this.attachInternals();

    this._data = null;
    this._value = '';
    this._name = '';
		this._id = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    this._anchorName = `--anchor-${this._id}`;
    this._ariaLabel = '';
    this.#boundOutsideClickHandler = this.outsideClickHandler.bind(this);

    this.shadowRoot.innerHTML = `
      <button type="button" 
				aria-expanded="false" 
				aria-haspopup="listbox"
				aria-controls="fieldset-${this._id}"></button>
      <fieldset data-open="false" 
				id="fieldset-${this._id}" 
				role="listbox"></fieldset>
    `;

    this.#button = this.shadowRoot.querySelector('button');
    this.#fieldset = this.shadowRoot.querySelector('fieldset');
    this.setupEventListeners();
  }

	get name() {
    return this.getAttribute('name');
  }

  set name(val) {
    this.setAttribute('name', val);
  }

	get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this._internals.setFormValue(this._value);
    this.updateCheckedState();
    this.updateButtonText();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  get data() {
    return this._data;
  }

  set data(val) {
    this._data = val;
    this.render();
  }

  connectedCallback() {
    this._name = this.getAttribute('name') || '';
    this.value = this.getAttribute('value') || '';
    this._ariaLabel = this.getAttribute('aria-label') || '';
    
    const dataAttr = this.getAttribute('data');
    if (dataAttr) this.loadData(dataAttr);
  }

  async loadData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      this.data = await response.json();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  render() {
    if (!this._data) return;
    this.style.setProperty('--anchor-name', this._anchorName);
    this.#button.setAttribute('aria-label', this._ariaLabel || this._data.name);
    this.#fieldset.innerHTML = this.renderGroups(this._data.groups);
    this.updateCheckedState();
    this.updateButtonText();
  }

  getSelectedLabel() {
    if (!this._value || !this._data || !this.#fieldset) return null;

    const radioGroup = this.#fieldset.elements[this._data.name];
    if (radioGroup?.length !== undefined) {
      const checkedRadio = Array.from(radioGroup).find(radio => radio.checked);
      if (checkedRadio) return checkedRadio.parentNode.textContent.trim();
    } else if (radioGroup?.checked) {
      return radioGroup.parentNode.textContent.trim();
    }

    // Fallback: find by value
    const radio = this.shadowRoot.querySelector(`input[name="${this._data.name}"][value="${this._value}"]`);
    return radio ? radio.parentNode.textContent.trim() : null;
  }

  renderGroups(groups, isSubgroup = false) {
    return groups.map(group => `
      <details ${!isSubgroup ? `name="name_${this._id}"` : ''}>
        <summary>${group.name}</summary>
        <div>
          ${group.options?.map(option => `
            <label role="option" aria-selected="${option.value === this._value}">
              <input type="${this._data.type || 'radio'}"
                     name="${this._data.name}"
                     value="${option.value}"
                     ${option.value === this._value ? 'checked' : ''}>
              ${option.label}
            </label>
          `).join('') || ''}
          ${group.subgroups ? this.renderGroups(group.subgroups, true) : ''}
        </div>
      </details>
    `).join('');
  }

  setupEventListeners() {
    this.#button.addEventListener('click', () => {
      const isOpen = this.#fieldset.dataset.open === 'true';
      this.setOpenState(!isOpen);
    });

    this.#fieldset.addEventListener('change', (e) => {
      if (e.target.matches('input[type="radio"], input[type="checkbox"]')) {
        this.value = e.target.value;
        this.setOpenState(false, true);
      }
    });

    this.addEventListener('keydown', (e) => {
      const isOpen = this.#fieldset.dataset.open === 'true';
      const activeEl = this.shadowRoot.activeElement;

      if (e.key === 'Escape' && isOpen) {
        this.setOpenState(false);
      } else if (e.key === 'Enter' && activeEl && activeEl.matches('input[type="radio"]')) {
        e.preventDefault();
        this.setOpenState(false, true);
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && isOpen) {
        e.preventDefault();
        const currentDetails = activeEl.closest('details');
        if (!currentDetails) return;

        const options = Array.from(currentDetails.querySelectorAll('label[role="option"]'))
          .filter(label => label.parentElement.parentElement === currentDetails);
        if (options.length === 0) return;

        const currentOption = activeEl.closest('label[role="option"]');
        let currentIndex = options.indexOf(currentOption);

        if (e.key === 'ArrowDown') {
          currentIndex = (currentIndex + 1) % options.length;
        } else {
          currentIndex = (currentIndex - 1 + options.length) % options.length;
        }

        const nextRadio = options[currentIndex].querySelector('input');
        nextRadio.focus();
        if (nextRadio.type === 'radio') {
          nextRadio.checked = true;
          this.value = nextRadio.value;
        }
      }
    });
  }

  updateCheckedState() {
    if (!this._data?.name || !this.#fieldset) return;
    
    const radioGroup = this.#fieldset.elements[this._data.name];
    if (!radioGroup) return;

    if (Array.isArray(radioGroup)) {
      radioGroup.forEach(radio => radio.checked = radio.value === this._value);
    } else {
      radioGroup.checked = radioGroup.value === this._value;
    }
  }

  updateButtonText() {
    if (!this.#button || !this._data) return;
    
    const selectedLabel = this.getSelectedLabel();
    this.#button.textContent = selectedLabel || this._ariaLabel || this._data.name;
  }

  outsideClickHandler(e) {
    if (!this.contains(e.target)) {
      this.setOpenState(false);
    }
  }

  setOpenState(isOpen, commit = false) {
    const currentlyOpen = this.#fieldset.dataset.open === 'true';
    if (isOpen === currentlyOpen) return;

    if (isOpen) {
      this.#originalValue = this.value;
    }

    this.#fieldset.dataset.open = isOpen;
    this.#button.setAttribute('aria-expanded', isOpen);

    if (isOpen) {
      document.addEventListener('click', this.#boundOutsideClickHandler);
    } else {
      document.removeEventListener('click', this.#boundOutsideClickHandler);
      if (!commit) {
        this.value = this.#originalValue;
      }
      if (this.shadowRoot.activeElement && this.#fieldset.contains(this.shadowRoot.activeElement)) {
        this.#button.focus();
      }
    }
  }
}

customElements.define('nested-select', NestedSelect);
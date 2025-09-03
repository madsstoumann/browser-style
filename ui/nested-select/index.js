class NestedSelect extends HTMLElement {

  static get styles() {
    return `
      nested-select {
				--anchor-inset-block-start: anchor(bottom);
				--anchor-inset-inline-start: anchor(left);
				--anchor-inset-block-end: auto;
				--anchor-inset-inline-end: auto;

      	position: relative;
        display: inline-block;
				&[anchor*="top"] {
					--anchor-inset-block-start: auto;
					--anchor-inset-block-end: anchor(top);
				}
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

	fieldset:not(:popover-open) {
		display: none;
	}
		fieldset:popover-open {
			background: Canvas;
        position: absolute;

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
  }

  #fieldset = null;
  #button = null;

  constructor() {
    super();
    this._data = null;
    this._value = '';
    this._name = '';
    this._popoverId = `ns-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
    this._anchorName = `--nested-select-${this._popoverId}`;
    this._ariaLabel = '';

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(NestedSelect.styles);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
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
    this._value = this.getAttribute('value') || '';
    this._anchorPosition = this.getAttribute('anchor') || 'bottom left';
    this._ariaLabel = this.getAttribute('aria-label') || '';
    const dataAttr = this.getAttribute('data');

    if (dataAttr) {
      this.loadData(dataAttr);
    }

    this.render();
  }

  async loadData(dataSource) {
    try {
      // Check if it's a URL (starts with http or relative path with .json)
      if (dataSource.startsWith('http') || dataSource.includes('.json')) {
        const response = await fetch(dataSource);
        this._data = await response.json();
      } else {
        // Assume it's a stringified JSON object
        this._data = JSON.parse(dataSource);
      }
      this.render();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  render() {
    if (!this._data) return;
    this.style.setProperty('--anchor-name', this._anchorName);

    const html = `
      <button type="button" popovertarget="${this._popoverId}" ${this._ariaLabel ? `aria-label="${this._ariaLabel}"` : ''}></button>
      <fieldset popover id="${this._popoverId}">
        ${this.renderGroups(this._data.groups)}
      </fieldset>
    `;

    this.innerHTML = html;
    this.#button = this.querySelector('button');
    this.#fieldset = this.querySelector('fieldset');
    this.setupEventListeners();
    this.updateCheckedState();
    this.updateButtonText();
  }

  getSelectedLabel() {
    if (!this._value || !this._data || !this.#fieldset) return null;
    const selectedInput = this.#fieldset.querySelector(`input[name="${this._data.name}"][value="${this._value}"]`);
    if (selectedInput && selectedInput.checked) {
      const label = selectedInput.closest('label');
      return label ? label.textContent.trim() : null;
    }

    return null;
  }

  renderGroups(groups) {
    return groups.map(group => `
      <details class="option-group">
        <summary>${group.name}</summary>
        <div>
          ${group.options ? group.options.map(option => `
            <label>
              <input type="${this._data.type || 'radio'}"
                     name="${this._data.name}"
                     value="${option.value}"
                     ${option.value === this._value ? 'checked' : ''}>
              ${option.label}
            </label>
          `).join('') : ''}
          ${group.subgroups ? this.renderGroups(group.subgroups) : ''}
        </div>
      </details>
    `).join('');
  }

  setupEventListeners() {
    if (!this.#fieldset) return;
    this.#fieldset.addEventListener('change', (e) => {
      if (e.target.type === 'radio' || e.target.type === 'checkbox') {
        this._value = e.target.value;
        this.updateButtonText();
				this.#fieldset.hidePopover();
      }
    });
  }

  updateCheckedState() {
    if (!this._data || !this.#fieldset) return;

    // For radio buttons, setting the value on the RadioNodeList checks the right radio
    const radioGroup = this.#fieldset.elements[this._data.name];
    if (radioGroup && radioGroup.length !== undefined) { // RadioNodeList
      radioGroup.value = this._value;
    } else if (radioGroup) { // Single element
      radioGroup.checked = radioGroup.value === this._value;
    }
  }

  updateButtonText() {
    if (this.#button && this._data) {
      const selectedLabel = this.getSelectedLabel();
      this.#button.textContent = selectedLabel || this._ariaLabel || this._data.name;
    }
  }
}

customElements.define('nested-select', NestedSelect);
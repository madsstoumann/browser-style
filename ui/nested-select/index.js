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

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class NestedSelect extends HTMLElement {

	static formAssociated = true;

  #fieldset = null;
  #button = null;

  constructor() {
    super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [sheet];
    this._internals = this.attachInternals();

    this._data = null;
    this._value = '';
    this._name = '';
		this._id = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    this._popoverId = `pi-${this._id}`;
    this._anchorName = `--anchor-${this._id}`;
    this._ariaLabel = '';

    this.shadowRoot.innerHTML = `
      <button type="button" popovertarget="${this._popoverId}"></button>
      <fieldset popover id="${this._popoverId}"></fieldset>
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
    this._anchorPosition = this.getAttribute('anchor') || 'bottom left';
    this._ariaLabel = this.getAttribute('aria-label') || '';
    const dataAttr = this.getAttribute('data');

    if (dataAttr) {
      this.loadData(dataAttr);
    }
  }

  async loadData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok for ${url}`);
      }
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
    if (!radioGroup) return null;

    if (radioGroup.length !== undefined) {
      for (const radio of radioGroup) {
        if (radio.checked) {
          return radio.parentNode.textContent.trim();
        }
      }
    } else if (radioGroup.checked) {
      return radioGroup.parentNode.textContent.trim();
    }

    if (this._value) {
      const allRadios = this.shadowRoot.querySelectorAll(`input[name="${this._data.name}"]`);
      for (const radio of allRadios) {
        if (radio.value === this._value) {
          return radio.parentNode.textContent.trim();
        }
      }
    }


    return null;
  }

  renderGroups(groups, isSubgroup = false) {
    return groups.map(group => `
      <details ${!isSubgroup ? `name="name_${this._id}"` : ''}>
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
          ${group.subgroups ? this.renderGroups(group.subgroups, true) : ''}
        </div>
      </details>
    `).join('');
  }

  setupEventListeners() {
    if (!this.#fieldset) return;
    this.#fieldset.addEventListener('change', (e) => {
      if (e.target.type === 'radio' || e.target.type === 'checkbox') {
        this.value = e.target.value;
        this.updateButtonText();
				this.#fieldset.hidePopover();
      }
    });
  }

  updateCheckedState() {
    if (!this._data || !this.#fieldset) return;
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
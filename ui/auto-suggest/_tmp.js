export class AutoSuggest extends HTMLElement {
  constructor() {
    super();

    this.data = [];
    this.defaultValues = {
      input: this.getAttribute('display') || '',
      inputHidden: this.getAttribute('value') || ''
    };
    this.eventMode = this.getAttribute('event-mode') || 'custom'; // custom, input, both
    this.initialObject = this.getAttribute('initial-object') ? JSON.parse(this.getAttribute('initial-object')) : null;
    this.listId = `list${this.uuid()}`;

    /* Settings */
    this.settings = ['api', 'api-array-path', 'api-display-path', 'api-text-path', 'api-value-path', 'cache', 'invalid', 'label', 'limit', 'list-mode'].reduce((settings, attr) => {
      let value = this.getAttribute(attr);
      const key = attr.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (key === 'cache' || key === 'limit') {
        value = value !== null ? value === 'true' : key === 'cache' ? false : true; // default cache: false, limit: true
      }
      settings[key] = value ?? null;
      return settings;
    }, {});

    this.settings.listMode = this.settings.listMode || 'datalist';

    /* Elements */
    const root = this.hasAttribute('shadow') ? this.attachShadow({ mode: 'open' }) : this;
    root.innerHTML = this.template();
    this.form = this.getAttribute('form') ? document.forms[this.getAttribute('form')] : this.closest('form');
    this.input = root.querySelector(`#${this.listId}-input`);
    this.inputHidden = root.querySelector('input[type="hidden"]');
    this.list = root.querySelector(`#${this.listId}`);
  }

  connectedCallback() {
    const limitToSelection = () => {
      const option = selected();
      this.input.setCustomValidity(option ? '' : this.settings.invalid);
      this.input.reportValidity();
    };

    const onentry = async (event) => {
      const minLength = parseInt(this.input.getAttribute('minlength'), 10) || 0;
      const value = this.input.value.length >= minLength ? this.input.value.toLowerCase() : '';
      if (!value) return;

      if (this.settings.listMode !== 'ul') {
        const option = selected();
        if (option && (event.inputType === "insertReplacementText" || event.inputType == null)) {
          this.inputHidden.value = option.dataset.value;
          this.reset(false);
          this.dispatchEventMode(option.dataset.obj);
          return;
        }
      }

      if (!this.settings.cache || !this.data.length) {
        if (!this.settings.api) {
          console.error('API endpoint is not defined.');
          return;
        }
        this.dispatchEvent(new CustomEvent('auto-suggest-fetch-start'));

        try {
          const response = await fetch(this.settings.api + encodeURIComponent(value));
          const fetchedData = await response.json();
          this.dispatchEvent(new CustomEvent('auto-suggest-fetch-end'));

          if (this.settings.apiArrayPath) {
            this.data = this.getNestedValue(fetchedData, this.settings.apiArrayPath) || [];
          } else {
            this.data = Array.isArray(fetchedData) ? fetchedData : [];
          }

          if (!this.data.length) {
            this.dispatchEvent(new CustomEvent('auto-suggest-no-results'));
          }

          this.list.innerHTML = this.render(this.data);

          if (this.settings.listMode === 'ul') this.list.togglePopover(true);

        } catch (error) {
          this.dispatchEvent(new CustomEvent('auto-suggest-fetch-error', { detail: error }));
        }
      }
    };

    const selected = () => {
      if (this.settings.listMode === 'ul') return null;
      const option = [...this.list.options].find(entry => entry.value === this.input.value);
      return option || null;
    };

    /* Events */
    this.input.addEventListener('keydown', (event) => {
      if (this.settings.listMode === 'ul') {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (this.list.children.length) {
            this.list.togglePopover(true);
            this.list.children[0].focus();
          }
        }
      }
      if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        this.resetToDefault();
        if (this.initialObject) {
          this.dispatchEventMode(JSON.stringify(this.initialObject), true);
        }
      }
    });

    this.input.addEventListener('input', this.debounced(200, onentry));
    this.input.addEventListener('search', () => this.input.value.length === 0 ? this.reset(false) : this.settings.limit ? limitToSelection() : '');

    if (this.settings.listMode === 'ul') {
      this.list.addEventListener('click', (event) => {
        let target = event.target;
        while (target && target !== this.list && target.tagName !== 'LI') {
          target = target.parentNode;
        }
        if (target && target.tagName === 'LI') {
          this.selectItem(target);
        }
      });

      this.list.addEventListener('keydown', (event) => {
        if (event.target && event.target.tagName === 'LI') {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            const nextItem = event.target.nextElementSibling;
            if (nextItem) {
              nextItem.focus();
            }
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const prevItem = event.target.previousElementSibling;
            if (prevItem) {
              prevItem.focus();
            } else {
              this.input.focus();
            }
          } else if (event.key === 'Enter') {
            this.selectItem(event.target);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            this.list.togglePopover(false);
            this.input.focus();
          }
        }
      });

      this.input.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement !== this.input && !this.list.contains(document.activeElement)) {
            this.list.togglePopover(false);
          }
        }, 0);
      });
    }

    if (this.form) {
      this.form.addEventListener('reset', () => this.reset());
    }
  }

  dispatchEventMode(dataObj = null, isInitial = false) {
    const detail = dataObj ? JSON.parse(dataObj) : {};
    if (isInitial) {
      detail.isInitial = true;
    }
    if (['custom', 'both'].includes(this.eventMode)) {
      this.dispatchEvent(new CustomEvent('auto-suggest-select', { detail }));
    }
    if (['input', 'both'].includes(this.eventMode)) {
      this.inputHidden.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  debounced(delay, fn) {
    let timerId;
    return (...args) => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => { fn(...args); timerId = null; }, delay);
    };
  }

  getNestedValue(obj, key) {
    if (!key) return undefined;
    return key.split('.').reduce((acc, part) => acc && typeof acc === 'object' ? acc[part] : undefined, obj);
  }

  render(data) {
    return data.map(obj => {
      const dataValue = this.getNestedValue(obj, this.settings.apiValuePath);
      const displayValue = this.getNestedValue(obj, this.settings.apiDisplayPath);
      const textValue = this.settings.apiTextPath ? this.getNestedValue(obj, this.settings.apiTextPath) : '';
      const dataObject = JSON.stringify(obj)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      return this.settings.listMode === 'ul' ?
        `<li role="option" tabindex="0" data-display="${displayValue}" data-text="${textValue || ''}" data-value="${dataValue}" data-obj='${dataObject}'>${displayValue}</li>`
        :
        `<option value="${displayValue}" data-value="${dataValue}" data-obj='${dataObject}'>${textValue ? textValue : ''}</option>`;
    }).join('');
  }

  reset(fullReset = true) {
    if (fullReset) {
      this.resetToDefault();
    }
    this.data = [];
    this.list.innerHTML = this.settings.listMode === 'ul' ? '' : `<option value="">`;
    this.input.setCustomValidity('');
    this.dispatchEvent(new CustomEvent('auto-suggest-clear'));
  }

  resetToDefault() {
    if (this.initialObject) {
      const display = this.getNestedValue(this.initialObject, this.settings.apiDisplayPath);
      const value = this.getNestedValue(this.initialObject, this.settings.apiValuePath);
      this.input.value = display || this.defaultValues.input;
      this.inputHidden.value = value || this.defaultValues.inputHidden;
      this.inputHidden.setAttribute('value', value || this.defaultValues.inputHidden);
    } else {
      this.input.value = this.defaultValues.input;
      this.inputHidden.value = this.defaultValues.inputHidden;
      this.inputHidden.setAttribute('value', this.defaultValues.inputHidden);
    }
    this.input.setCustomValidity('');
  }

  selectItem(target) {
    const { obj, value } = target.dataset;
    this.input.value = target.textContent.trim();
    this.inputHidden.value = value;
    this.input.setCustomValidity('');
    this.input.reportValidity();
    this.reset(false);
    this.dispatchEventMode(obj);
    this.list.togglePopover(false);
    setTimeout(() => this.input.focus(), 0);
  }

  template() {
    const list = this.settings.listMode === 'ul' ? `<ul popover id="${this.listId}" part="list" role="listbox" style="position-anchor:--${this.listId}"></ul>` : `<datalist id="${this.listId}" part="list"></datalist>`;
    return `
    <input type="hidden" name="${this.getAttribute('name') || 'key'}" value="${this.defaultValues.inputHidden}">
    ${this.settings.label ? `<label part="row"><span part="label">${this.settings.label}</span>` : ''}
      <input
        id="${this.listId}-input"
        autocomplete="${this.getAttribute('autocomplete') || 'off'}"
        list="${this.listId}"
        minlength="${this.getAttribute('minlength') || 3}"
        part="input"
        placeholder="${this.getAttribute('placeholder') || ''}"
        spellcheck="${this.getAttribute('spellcheck') || false}"
        style="anchor-name:--${this.listId}"
        type="${this.getAttribute('type') || 'search'}"
        value="${this.defaultValues.input}">
    ${this.settings.label ? `</label>` : ''}
    ${list}`;
  }

  uuid() {
    return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  static mount() {
    if (!customElements.get('auto-suggest')) {
      customElements.define('auto-suggest', this);
    }
  }
}

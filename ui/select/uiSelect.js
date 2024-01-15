import uiAnchor from './../anchor/uiAnchor.js';
/**
 * uiSelect
 * Custom <select>-element, until stylable selects are implemented in browsers.
 * @author Mads Stoumann
 * @version 1.0.00
 * @summary 14-01-2024
 * @class
 * @extends {HTMLElement}
 */
export default class uiSelect extends HTMLElement {
  /**
   * Creates an instance of uiSelect.
   * @memberof uiSelect
   */
  constructor() {
    super();
  }

  /**
   * Called when the element is added to the document.
   * @memberof uiSelect
   */
  connectedCallback() {
    this.initializeElements();
    this.addEventListeners();
    this.setDefaultOption();
		uiAnchor()
  }

  /**
   * Initializes the button and list elements.
   * @private
   * @memberof uiSelect
   */
  initializeElements() {
    this.button = this.querySelector('button');
    const id = this.button.id || `b${this.generateRandomId()}`;
    this.button.id = id;
    this.button.setAttribute('popovertarget', `p${id}`);

    const list = this.querySelector('ui-datalist');
    list.id = `p${id}`;
    list.setAttribute('popover', '');
    list.setAttribute('anchor', id);
		list.dataset.anchor = `top:bottom left:left`;
    this.list = list;
  }

  /**
   * Adds event listeners for the list.
   * @private
   * @memberof uiSelect
   */
  addEventListeners() {
    this.list.addEventListener('click', (e) => {
      const option = e.target.closest('ui-option');
      if (option) {
        this.setOption(option);
        this.list.hidePopover();
      }
    });
  }

  /**
   * Sets the default selected option.
   * @private
   * @memberof uiSelect
   */
  setDefaultOption() {
    this.selected =
      this.list.querySelector('ui-option[selected]') ||
      this.list.querySelector('ui-option');
    this.setOption(this.selected);
  }

  /**
   * Sets the selected option in the button.
   * @param {HTMLElement} option - The selected option.
   * @memberof uiSelect
   */
  setOption(option) {
    if (option) {
      this.button.innerHTML = option.innerHTML;
      this.button.value = option.value;
    }
  }

  /**
   * Generates a random id using crypto API.
   * @private
   * @returns {number} - The generated random id.
   * @memberof uiSelect
   */
  generateRandomId() {
    try {
      const idArray = new Uint32Array(1);
      window.crypto.getRandomValues(idArray);
      return idArray[0];
    } catch (error) {
      console.error('Error generating random id:', error.message);
      return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
  }
}

customElements.define('ui-select', uiSelect);
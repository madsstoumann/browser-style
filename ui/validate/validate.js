/**
 * @class Validate
 * @param {Node} form
 * @param {Object} settings
 * @description Adds custom validation to a form (novalidate), calling validateGroup, submits form if all validation pass.
 */
export class Validate {
  constructor(form, settings) {
    this.settings = Object.assign(
      {
        err: {},
        errClass: 'c-field__error',
        errCreate: true,
        fnErr: this.setErrorLabel.bind(this),
        fnRequired: () => true,
        lang: (form.getAttribute('lang') || document.documentElement.getAttribute('lang') || 'en-US'),
        validateOnBlur: false,
        validateOnBlurOnError: false
      },
      settings
    );

    this.form = form;
    this.init();
  }

  /**
   * @function createErrNode
   * @param {Node} field
   * @param {String} errClass
   * @description Creates an error-node, insterted as last node in parentNode
   */
  createErrNode(element) {
    const errNode = h('span', {
      'aria-live': 'polite',
      class: this.settings.errClass,
      role: 'alert'
    });
    element.parentNode.appendChild(errNode);
    return errNode;
  }

  /**
   * @function getCustomText
   * @param {Object} obj Custom Error Object
   * @description Returns custom errText from obj-as-string and settings.lang
   * @returns String
   */
  getCustomText(obj) {
    let text = obj;
    if (obj && obj.includes('{')) {
      try {
        text = JSON.parse(text.replace(/'/g, '"'));
        text = text[this.settings.lang];
      } catch (err) {
        text = obj;
      }
    }
    return text;
  }

  /**
   * @function getErrorText
   * @param {Node} field
   * @param {Object} err Custom error-object
   * @param {String} key Lookup-key in Custom error-object
   * @description Returns errText if found
   * @returns String
   */
  getErrorText(field, key) {
    const err = this.settings.err[this.settings.lang];
    /* Check if [key] is in [err]-object, then check subkey [field.type], fallback to [all] or empty string */
    let errText = err[key] ? err[key][field.type] || err[key].all : '';
    /* Check if errText contains curly braces - replace inner value with corresponding attribute */
    const errParams = errText.match(/[^{}]+(?=})/g) || [];
    errParams.forEach(attribute => {
      const value = field.getAttribute(attribute);
      if (value) {
        errText = errText.replace(`{${attribute}}`, value);
      }
    });
    return errText;
  }

  /**
   * @function  getValidityKey
   * @param {Object} Validity Object
   * @description Iterates validity-object, returns key which is === true
   * @returns String
   */
  getValidityKey(validity) {
    for (let key in validity) {
      if (validity[key]) {
        return key;
      }
    }
  }

  /**
   * @function init
   * @description Adds custom validation to a form (novalidate), calling validateGroup, submits form if all validation pass.
   */
  init() {
    this.form.noValidate = true;
    // if (this.settings.errCreate) {
    //   [...this.form].forEach(field => {
    //     if (field.required || field.dataset.ruleRequired) {
    //       field.errorNode = this.createErrNode(field);
    //     }
    //   });
    // }
    // this.form.addEventListener('submit', event => {
    //   event.preventDefault();
    //   if (this.validateGroup([...this.form])) {
    //     this.form.submit();
    //   }
    // });
  }

  /**
   * @function setCustomError
   * @param {String} selector
   * @param {String} errText
   * @description Set custom error from a selector (usually Backend)
   */
  setCustomError(selector, errText) {
    const field = this.form.elements[selector];
    field.setCustomValidity(errText);
    this.setErrorLabel(field, false);
  }

  /**
   * @function setErrorLabel
   * @param {Element} field
   * @param {Boolean} valid
   * @description Set error element
   */
  setErrorLabel(field, valid) {
    console.log(field, valid)
    const errNode =
      field.errNode ||
      field.parentNode.querySelector(`.${this.settings.errClass}`);

    if (errNode) {
      errNode.textContent =
        field.validationMessage ||
        this.getCustomText(field.dataset.errText) ||
        ':-(';
      errNode.hidden = valid;

      if (!valid) {
        /* TODO: Add or remove live eventListener. Only added if not valid */
        //field.addEventListener('change', this.bindLiveValidate(field));
      }
    }

    /* Reset custom validity */
    field.setCustomValidity('');
  }

  /**
   * @function validateField
   * @param {Element} field
   * @description Validate a single field. Sets custom validity, if error-object or data-err-text exists. Returns Boolean with validaton status.
   * @return {Boolean}
   */
  validateField(field) {
    const validity = field.validity;
    if (!validity.valid) {
      /* Get type of error, only one key in the validity-object will be `true` */
      const key = this.getValidityKey(validity);
      let errText =
        this.getCustomText(field.dataset.errText) ||
        this.getErrorText(field, key);

      if (errText) {
        field.setCustomValidity(errText);
      }
    }
    field.dataset.valid = validity.valid;
    return validity.valid;
  }

  /**
   * @function validateFieldOrGroup
   * @param {Element} field
   * @description Returns validity for a single field or a group
   * @return {Boolean}
   */
  validateFieldOrGroup(field) {
    let valid = true;
    if (field.required) {
      valid = this.validateField(field);
    }
    if (field.dataset.ruleRequired) {
      valid = this.settings.fnRequired(field.dataset.ruleRequired, field);
    }
    
    this.settings.fnErr(field, valid);
    return valid;
  }

  /**
   * @function validateGroup
   * @param {String|Array|NodeList} selector querySelectorAll-string, Array or a NodeList
   * @description Validates a group of elements
   * @return {Boolean}
   */
  validateGroup(selector) {
    const group = arraySelector(selector);
    let groupValid = true;
    group.forEach(field => {
      if (!this.validateFieldOrGroup(field)) {
        groupValid = false;
      }
    });
    return groupValid;
  }
}
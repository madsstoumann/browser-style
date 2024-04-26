import uiAnchor from './../anchor/uiAnchor.js';
/**
 * uiSelect
 * Custom <select>-element, until stylable selects are implemented in browsers.
 * @author Mads Stoumann
 * @version 1.0.00
 * @summary 17-01-2024
 * @class
 * @extends {HTMLElement}
 */
export default class uiSelect extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() {
		try {
			const id =
				crypto.getRandomValues(new Uint32Array(1))[0] ||
				Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
			const selected = this.querySelector('option[selected]') || this.querySelector('option');

			const str = this.innerHTML
				.replace(
					/<datalist/g,
					`<ui-datalist id="l${id}" popover anchor="b${id}" data-anchor="top:bottom left:left"`
				)
				.replace(/<\/datalist/g, `</ui-datalist`)
				.replace(/type="select"/g, `type="button" id="b${id}" popovertarget="l${id}"`)
				.replace(/<selectedoption>/g, `<selectedoption>${selected && selected.innerHTML}`)
				.replace(/<option/g, `<ui-option tabindex="0"`)
				.replace(/<\/option/g, '</ui-option');
			this.innerHTML = str;

			this.button = this.querySelector('button[popovertarget]');
			this.list = this.querySelector('ui-datalist');

			if (!this.button || !this.list) {
				throw new Error('Button or Datalist not found.');
			}

			uiAnchor();

			this.list.addEventListener('click', (e) => this.setOption(e.target));
			this.addEventListener('keydown', (e) => {
				const focusedElement = document.activeElement;
				const optionHasFocus = focusedElement && focusedElement.parentNode === this.list;

				if (e.key === 'Enter' && optionHasFocus) this.setOption(focusedElement);
				if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
					this.list.showPopover();
					if (optionHasFocus) {
						const currentIndex = Array.from(this.list.children).indexOf(focusedElement);
						const nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
						if (nextIndex >= 0 && nextIndex < this.list.children.length) {
							this.list.children[nextIndex].focus();
						}
					} else {
						this.list.children[0].focus();
					}
				}
			});
		} catch (error) {
			console.error('Error in uiSelect:', error.message);
		}
	}

	setOption = (option) => {
		try {
			if (option) {
				this.button.firstElementChild.innerHTML = option.innerHTML;
				this.button.value = option.getAttribute('value');
				setTimeout(() => {
					this.list.hidePopover();
				}, 10);
			}
		} catch (error) {
			console.error('Error in setOption:', error.message);
		}
	};
}
customElements.define('ui-select', uiSelect);
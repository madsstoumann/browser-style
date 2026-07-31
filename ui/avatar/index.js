/**
 * <ui-avatar> and <ui-avatar-group>
 * Light DOM web component wrappers for the CSS-first avatar.
 * CSS handles all visual behavior, `max` overflow counting included.
 * @version 4.1.0
 */

/**
 * `max` is owned by ui-avatar.css: sibling-index()/sibling-count() hide the
 * overflow and a style query paints the +N face. The JS below is ONLY a polyfill
 * for engines without those functions — the two must never both run, because
 * this one injects an extra <ui-avatar overflow> child, which shifts
 * sibling-count() and makes the CSS undercount by one.
 */
const CSS_OWNS_MAX =
	CSS.supports('width', 'calc(sibling-index() * 1px)') &&
	CSS.supports('width', 'calc(sibling-count() * 1px)');

class UiAvatar extends HTMLElement {}

class UiAvatarGroup extends HTMLElement {
	static observedAttributes = ['max'];

	connectedCallback() {
		this.applyMax();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		if (name === 'max') this.applyMax();
	}

	applyMax() {
		if (CSS_OWNS_MAX) return;

		const max = parseInt(this.getAttribute('max'));
		if (!max || max < 1) return;

		const existing = this.querySelector(':scope > ui-avatar[overflow]');
		if (existing) existing.remove();

		const avatars = Array.from(this.children).filter(c => c.matches('ui-avatar:not([overflow])'));
		for (const avatar of avatars) avatar.hidden = false;

		if (avatars.length <= max) return;

		for (let i = max; i < avatars.length; i++) {
			avatars[i].hidden = true;
		}

		const counter = document.createElement('ui-avatar');
		counter.setAttribute('overflow', '');
		const abbr = document.createElement('abbr');
		abbr.textContent = `+${avatars.length - max}`;
		counter.appendChild(abbr);
		avatars[max - 1].after(counter);
	}
}

customElements.define('ui-avatar', UiAvatar);
customElements.define('ui-avatar-group', UiAvatarGroup);

export { UiAvatar, UiAvatarGroup };

/**
 * <ui-avatar> and <ui-avatar-group>
 * Light DOM web component wrappers for the CSS-first avatar.
 * All visual behavior is handled by CSS — JS provides custom element registration.
 * @version 4.0.0
 */

class UiAvatar extends HTMLElement {}

class UiAvatarGroup extends HTMLElement {
	static observedAttributes = ['variant'];
}

customElements.define('ui-avatar', UiAvatar);
customElements.define('ui-avatar-group', UiAvatarGroup);

export { UiAvatar, UiAvatarGroup };

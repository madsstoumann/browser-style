/**
 * <ui-play>
 * Light DOM web component: a generic, target-agnostic play/pause button.
 *
 * Wraps a single <button>. It is an INVOKER + REFLECTOR — it never learns what it
 * controls:
 *   - Invoker: if the inner <button> carries native `command` + `commandfor`, the
 *     platform dispatches a CommandEvent on the target (a <video>, a CSS-animation
 *     element, a <ui-video-embed>, …). A whatever target handles it and reflects the
 *     real state back via `uiPlay.playing = bool`. On browsers without custom-command
 *     support, <ui-play> dispatches the CommandEvent itself (fallback).
 *   - Reflector: the `playing` property is the single source of visual truth — it sets
 *     `aria-pressed` on the button and toggles `open` on the host (which morphs a
 *     <ui-icon type="play-pause"> glyph via CSS). Legacy static `type="play|pause"`
 *     glyphs are swapped too, for backward compatibility.
 *
 * With NO `commandfor`, it emits a bubbling/composed `ui-play-toggle {playing}` event
 * instead — the loose contract the carousel (ui-media.js) auto-discovery relies on.
 *
 * `for="<video-id>"` remains a built-in shorthand that drives a <video> directly and
 * mirrors its real playback state. No Shadow DOM.
 * @version 4.1.0
 */

// Native Invoker Commands custom-command support (Chrome/Edge 135+, Safari 26+).
const COMMAND_SUPPORTED = typeof HTMLButtonElement !== 'undefined'
	&& 'command' in HTMLButtonElement.prototype;

// Dispatch a `command` event on a target — a real CommandEvent where available,
// else a CustomEvent carrying the same shape in `detail` (controllers read both).
function dispatchCommand(target, command, source) {
	let event;
	if (typeof CommandEvent === 'function') {
		try {
			event = new CommandEvent('command', { command, source, bubbles: true, cancelable: true });
		} catch { /* older impl without settable init — fall through */ }
	}
	if (!event) {
		event = new CustomEvent('command', { bubbles: true, cancelable: true, detail: { command, source } });
	}
	target.dispatchEvent(event);
}

class UiPlay extends HTMLElement {
	#button = null;
	#icon = null;
	#video = null;
	#onClick = null;
	#onVideoPlay = null;
	#onVideoPause = null;

	connectedCallback() {
		this.#button = this.querySelector(':scope > button') || this.querySelector('button');
		if (!this.#button) return;
		this.#icon = this.#button.querySelector('ui-icon');

		if (!this.#button.hasAttribute('aria-pressed')) {
			this.#button.setAttribute('aria-pressed', 'false');
		}
		// Sync host `open` + glyph to the authored aria-pressed state.
		this.#setPressed(this.playing);

		this.#onClick = () => this.#onButtonClick();
		this.#button.addEventListener('click', this.#onClick);

		this.#bindVideo();
	}

	disconnectedCallback() {
		if (this.#button && this.#onClick) {
			this.#button.removeEventListener('click', this.#onClick);
		}
		this.#unbindVideo();
	}

	get playing() {
		return this.#button?.getAttribute('aria-pressed') === 'true';
	}

	set playing(value) {
		this.#setPressed(!!value);
	}

	// `for="<video-id>"` — built-in shorthand: drive a <video> and mirror its real state.
	#bindVideo() {
		const id = this.getAttribute('for');
		if (!id) return;
		const el = document.getElementById(id);
		if (!el || el.tagName !== 'VIDEO') return;

		this.#video = el;
		this.#onVideoPlay = () => this.#setPressed(true);
		this.#onVideoPause = () => this.#setPressed(false);
		this.#video.addEventListener('play', this.#onVideoPlay);
		this.#video.addEventListener('pause', this.#onVideoPause);
		this.#video.addEventListener('ended', this.#onVideoPause);

		this.#setPressed(!this.#video.paused);
	}

	#unbindVideo() {
		if (!this.#video) return;
		if (this.#onVideoPlay) this.#video.removeEventListener('play', this.#onVideoPlay);
		if (this.#onVideoPause) {
			this.#video.removeEventListener('pause', this.#onVideoPause);
			this.#video.removeEventListener('ended', this.#onVideoPause);
		}
		this.#video = null;
	}

	// Reflect state — the single source of visual truth.
	#setPressed(playing) {
		if (!this.#button) return;
		this.#button.setAttribute('aria-pressed', playing ? 'true' : 'false');
		// Morphing glyph: <ui-icon type="play-pause"> reacts to `open` via CSS.
		this.toggleAttribute('open', playing);
		// Legacy: a static play/pause glyph is swapped so old markup keeps working.
		const type = this.#icon?.getAttribute('type');
		if (type === 'play' || type === 'pause') {
			this.#icon.setAttribute('type', playing ? 'pause' : 'play');
		}
	}

	#onButtonClick() {
		const command = this.#button.getAttribute('command');
		const commandFor = this.#button.getAttribute('commandfor');

		// Desired next state — explicit for --play/--pause, otherwise a toggle.
		const next = command === '--play' ? true
			: command === '--pause' ? false
			: !this.playing;

		// Optimistic reflect; authoritative targets correct it via `playing = …`.
		this.#setPressed(next);

		// Built-in <video> shorthand.
		if (this.#video) {
			if (next) {
				const p = this.#video.play();
				if (p && typeof p.catch === 'function') p.catch(() => {});
			} else {
				this.#video.pause();
			}
		}

		if (commandFor) {
			// Native invoker already dispatched the CommandEvent on click; only step in
			// as a fallback where custom commands aren't supported.
			if (!COMMAND_SUPPORTED) {
				const target = document.getElementById(commandFor);
				if (target) dispatchCommand(target, command || '--toggle-play', this.#button);
			}
		} else {
			// No target id → the auto-discovery contract (carousel).
			this.dispatchEvent(new CustomEvent('ui-play-toggle', {
				bubbles: true,
				composed: true,
				detail: { playing: next }
			}));
		}
	}
}

customElements.define('ui-play', UiPlay);
export { UiPlay };

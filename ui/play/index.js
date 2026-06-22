/**
 * <ui-play>
 * Light DOM web component for the CSS-first media play affordance.
 * Wraps a single <button>. Manages an "is-playing" state via aria-pressed,
 * dispatches a `ui-play-toggle` event, and can optionally drive a <video>
 * referenced by the `for` attribute. No Shadow DOM.
 * @version 4.0.0
 */

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

		this.#onClick = () => this.#toggle();
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

	#setPressed(playing) {
		if (!this.#button) return;
		this.#button.setAttribute('aria-pressed', playing ? 'true' : 'false');
		if (this.#icon) this.#icon.setAttribute('type', playing ? 'pause' : 'play');
	}

	#toggle() {
		const playing = !this.playing;
		this.#setPressed(playing);

		if (this.#video) {
			if (playing) {
				const p = this.#video.play();
				if (p && typeof p.catch === 'function') p.catch(() => {});
			} else {
				this.#video.pause();
			}
		}

		this.dispatchEvent(new CustomEvent('ui-play-toggle', {
			bubbles: true,
			composed: true,
			detail: { playing }
		}));
	}
}

customElements.define('ui-play', UiPlay);
export { UiPlay };

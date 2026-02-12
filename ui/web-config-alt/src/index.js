import { adoptSharedStyles } from '@browser.style/web-config-shared';

const MAX_DIMENSION = 768;
const JPEG_QUALITY = 0.8;
const DETAIL_LEVELS = ['brief', 'standard', 'detailed'];

function resizeImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const w = img.naturalWidth;
			const h = img.naturalHeight;
			const longest = Math.max(w, h);
			const needsResize = longest > MAX_DIMENSION;

			if (!needsResize) {
				fetch(src)
					.then(r => r.blob())
					.then(blob => {
						const type = blob.type;
						if (type === 'image/webp' || type === 'image/jpeg' || type === 'image/png' || type === 'image/gif') {
							resolve(new File([blob], 'image.jpg', { type }));
						} else {
							drawToCanvas(img, w, h, resolve, reject);
						}
					})
					.catch(() => drawToCanvas(img, w, h, resolve, reject));
				return;
			}

			const scale = MAX_DIMENSION / longest;
			const newW = Math.round(w * scale);
			const newH = Math.round(h * scale);
			drawToCanvas(img, newW, newH, resolve, reject);
		};
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = src;
	});
}

function drawToCanvas(img, w, h, resolve, reject) {
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0, w, h);
	canvas.toBlob(
		blob => {
			if (!blob) { reject(new Error('Canvas conversion failed')); return; }
			resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' }));
		},
		'image/jpeg',
		JPEG_QUALITY
	);
}

class WebConfigAlt extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['value', 'detail'];

	#workerUrl = '';
	#apiKey = '';
	#src = '';
	#detail = 'standard';
	#isGenerating = false;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
	}

	get workerUrl() { return this.#workerUrl; }
	set workerUrl(v) { this.#workerUrl = v; }

	get apiKey() { return this.#apiKey; }
	set apiKey(v) { this.#apiKey = v; }

	get src() { return this.#src; }
	set src(v) {
		this.#src = v;
		this.#updateGenerateButton();
	}

	get detail() { return this.#detail; }
	set detail(v) {
		this.#detail = DETAIL_LEVELS.includes(v) ? v : 'standard';
	}

	get value() {
		const textarea = this.shadowRoot.querySelector('[data-alt-text]');
		return textarea ? textarea.value : '';
	}
	set value(v) {
		const text = v || '';
		this._internals.setFormValue(text);
		const textarea = this.shadowRoot.querySelector('[data-alt-text]');
		if (textarea) textarea.value = text;
	}

	async connectedCallback() {
		await adoptSharedStyles(this.shadowRoot);

		const localCss = new CSSStyleSheet();
		await localCss.replace(`
			.alt-controls {
				display: flex;
				gap: var(--web-config-gap);
				align-items: end;
			}
			textarea[data-alt-text] {
				field-sizing: content;
				font: inherit;
				min-height: 2lh;
				padding: var(--web-config-gap);
				resize: vertical;
				width: 100%;
			}
			.alt-error {
				display: none;
				background: var(--web-config-status-danger-bg);
				border: 1px solid var(--web-config-status-danger);
				border-radius: var(--web-config-bdrs);
				color: var(--web-config-status-danger);
				padding: var(--web-config-gap);
				font-size: small;
			}
			.alt-error[data-visible] {
				display: block;
			}
			.spinner {
				display: none;
				text-align: center;
				padding: var(--web-config-gap) 0;
			}
			.spinner[data-visible]::after {
				content: '';
				display: inline-block;
				width: 20px;
				height: 20px;
				border: 2px solid var(--web-config-bdc);
				border-top-color: var(--web-config-accent-dark);
				border-radius: 50%;
				animation: wca-spin 0.7s linear infinite;
			}
			@keyframes wca-spin {
				to { transform: rotate(360deg); }
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, localCss];

		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'value') {
			this.value = newValue;
		}
		if (name === 'detail') {
			this.#detail = DETAIL_LEVELS.includes(newValue) ? newValue : 'standard';
		}
	}

	render() {
		const attrDetail = this.getAttribute('detail');
		if (attrDetail && DETAIL_LEVELS.includes(attrDetail)) {
			this.#detail = attrDetail;
		}

		const btn = document.createElement('button');
		btn.type = 'button';
		btn.setAttribute('data-generate', '');
		btn.disabled = true;
		btn.textContent = 'Generate';

		const textarea = document.createElement('textarea');
		textarea.setAttribute('data-alt-text', '');
		textarea.placeholder = 'Alt text will appear here...';

		const spinner = document.createElement('div');
		spinner.className = 'spinner';

		const errorEl = document.createElement('div');
		errorEl.className = 'alt-error';

		this.shadowRoot.replaceChildren(btn, textarea, spinner, errorEl);

		this.#updateGenerateButton();

		btn.addEventListener('click', () => this.#generate());
		textarea.addEventListener('input', () => {
			const text = textarea.value;
			this._internals.setFormValue(text);
			this.#dispatchChange(text);
		});
	}

	#updateGenerateButton() {
		const btn = this.shadowRoot.querySelector('[data-generate]');
		if (btn) btn.disabled = !this.#src || this.#isGenerating;
	}

	#dispatchChange(alt) {
		this.dispatchEvent(new CustomEvent('change', {
			bubbles: true,
			composed: true,
			detail: { alt }
		}));
	}

	async #generate() {
		if (!this.#src || !this.#workerUrl || this.#isGenerating) return;

		this.#isGenerating = true;
		this.#updateGenerateButton();

		const spinner = this.shadowRoot.querySelector('.spinner');
		const errorEl = this.shadowRoot.querySelector('.alt-error');

		spinner.setAttribute('data-visible', '');
		errorEl.removeAttribute('data-visible');

		try {
			const file = await resizeImage(this.#src);
			const formData = new FormData();
			formData.append('image', file);
			formData.append('detail', this.#detail);

			const headers = {};
			if (this.#apiKey) headers['X-API-Key'] = this.#apiKey;

			const response = await fetch(`${this.#workerUrl.replace(/\/+$/, '')}/analyze`, {
				method: 'POST',
				headers,
				body: formData,
			});

			const data = await response.json();

			if (data.error) {
				this.#showError(data.error);
				return;
			}

			this.value = data.alt;
			this.#dispatchChange(data.alt);
		} catch (err) {
			this.#showError(`Request failed: ${err.message}`);
		} finally {
			spinner.removeAttribute('data-visible');
			this.#isGenerating = false;
			this.#updateGenerateButton();
		}
	}

	#showError(msg) {
		const errorEl = this.shadowRoot.querySelector('.alt-error');
		if (errorEl) {
			errorEl.textContent = msg;
			errorEl.setAttribute('data-visible', '');
		}
	}
}

customElements.define('web-config-alt', WebConfigAlt);

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

function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag);
	for (const [key, val] of Object.entries(attrs)) {
		if (key.startsWith('data-')) node.setAttribute(key, val);
		else if (key === 'className') node.className = val;
		else if (key === 'textContent') node.textContent = val;
		else if (key === 'type') node.type = val;
		else if (key === 'disabled') node.disabled = val;
		else if (key === 'selected') node.selected = val;
		else if (key === 'value') node.value = val;
		else node.setAttribute(key, val);
	}
	for (const child of children) {
		if (typeof child === 'string') node.appendChild(document.createTextNode(child));
		else node.appendChild(child);
	}
	return node;
}

class WebConfigAlt extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['value', 'detail'];

	#workerUrl = '';
	#apiKey = '';
	#src = '';
	#isGenerating = false;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
		this.state = { alt: '', detail: 'standard', charCount: 0, maxLength: 0 };
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

	get value() { return this.state.alt; }
	set value(v) {
		this.state.alt = v || '';
		this._internals.setFormValue(this.state.alt);
		this.#updateResult();
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
			.alt-controls label {
				flex: 1;
			}
			.alt-result {
				display: none;
				background: var(--web-config-accent);
				border: 1px solid var(--web-config-bdc);
				border-radius: var(--web-config-bdrs);
				padding: var(--web-config-gap);
				font-size: inherit;
				line-height: 1.6;
			}
			.alt-result[data-visible] {
				display: block;
			}
			.alt-meta {
				display: flex;
				gap: 1ch;
				font-size: small;
				color: GrayText;
				margin-block-start: 0.5ch;
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
			this.state.alt = newValue || '';
			this._internals.setFormValue(this.state.alt);
			this.#updateResult();
		}
		if (name === 'detail') {
			const detail = DETAIL_LEVELS.includes(newValue) ? newValue : 'standard';
			this.state.detail = detail;
			const select = this.shadowRoot.querySelector('[data-detail]');
			if (select) select.value = detail;
		}
	}

	render() {
		const detail = this.getAttribute('detail') || 'standard';
		this.state.detail = DETAIL_LEVELS.includes(detail) ? detail : 'standard';

		const select = el('select', { 'data-detail': '' },
			DETAIL_LEVELS.map(d =>
				el('option', { value: d, selected: d === this.state.detail, textContent: d.charAt(0).toUpperCase() + d.slice(1) })
			)
		);

		const btn = el('button', { type: 'button', 'data-generate': '', disabled: true, textContent: 'Generate' });
		const controls = el('div', { className: 'alt-controls' }, [
			el('label', {}, [
				el('small', { textContent: 'Detail' }),
				select
			]),
			btn
		]);

		const spinner = el('div', { className: 'spinner' });
		const errorEl = el('div', { className: 'alt-error' });
		const altText = el('span', { 'data-alt-text': '' });
		const metaDetail = el('span', { 'data-meta-detail': '' });
		const metaChars = el('span', { 'data-meta-chars': '' });
		const meta = el('div', { className: 'alt-meta' }, [metaDetail, metaChars]);
		const resultEl = el('div', { className: 'alt-result' }, [altText, meta]);

		this.shadowRoot.replaceChildren(controls, spinner, errorEl, resultEl);

		this.#updateGenerateButton();
		if (this.state.alt) this.#updateResult();

		btn.addEventListener('click', () => this.#generate());
		select.addEventListener('change', (e) => {
			this.state.detail = e.target.value;
		});
	}

	#updateGenerateButton() {
		const btn = this.shadowRoot.querySelector('[data-generate]');
		if (btn) btn.disabled = !this.#src || this.#isGenerating;
	}

	#updateResult() {
		const resultEl = this.shadowRoot.querySelector('.alt-result');
		const textEl = this.shadowRoot.querySelector('[data-alt-text]');
		const metaDetail = this.shadowRoot.querySelector('[data-meta-detail]');
		const metaChars = this.shadowRoot.querySelector('[data-meta-chars]');
		if (!resultEl || !textEl) return;

		if (this.state.alt) {
			textEl.textContent = this.state.alt;
			if (metaDetail) metaDetail.textContent = this.state.detail;
			if (metaChars) metaChars.textContent = `${this.state.charCount} / ${this.state.maxLength} chars`;
			resultEl.setAttribute('data-visible', '');
		} else {
			resultEl.removeAttribute('data-visible');
		}
	}

	async #generate() {
		if (!this.#src || !this.#workerUrl || this.#isGenerating) return;

		this.#isGenerating = true;
		this.#updateGenerateButton();

		const spinner = this.shadowRoot.querySelector('.spinner');
		const errorEl = this.shadowRoot.querySelector('.alt-error');
		const resultEl = this.shadowRoot.querySelector('.alt-result');

		spinner.setAttribute('data-visible', '');
		errorEl.removeAttribute('data-visible');
		resultEl.removeAttribute('data-visible');

		try {
			const file = await resizeImage(this.#src);
			const formData = new FormData();
			formData.append('image', file);
			formData.append('detail', this.state.detail);

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

			this.state.alt = data.alt;
			this.state.detail = data.detail;
			this.state.charCount = data.charCount;
			this.state.maxLength = data.maxLength;
			this._internals.setFormValue(this.state.alt);
			this.#updateResult();

			this.dispatchEvent(new CustomEvent('change', {
				bubbles: true,
				composed: true,
				detail: {
					alt: data.alt,
					detail: data.detail,
					charCount: data.charCount,
					maxLength: data.maxLength,
				}
			}));
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

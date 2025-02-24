const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--AccentColor: light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%));
		--AccentColorText: hsl(211, 100%, 95%);
	}
	:host::part(cancel) {
		background: #0000;
		color: var(--AccentColor);
	}
	:host::part(cancel):focus-visible {
		background: color-mix(in oklab, Canvas, CanvasText 5%);
	}
	:host::part(ok) {
		background: var(--AccentColor);
		color: var(--AccentColorText);
	}
	:host::part(ok):focus-visible {
		background: color-mix(in oklab, var(--AccentColor), CanvasText 20%);
	}

	button {
		border: 0;
		border-radius: 3ch;
		font-weight: 500;
		outline: 0;
	}
	button, input {
		font-family: inherit;
		font-size: 0.875rem;
		padding: 1.5ch 3ch;
	}
	dialog {
		background: Canvas;
		border: 0;
		border-radius: var(--msgbox-bdrs, 1.75rem);
		box-shadow: var(--msgbox-bxsh, none);
		font-family: var(--msgbox-ff, ui-sans-serif, system-ui);
		font-size: 1rem;
		max-inline-size: min(90vw, 32rem);
		min-inline-size: 25rem;
		padding: var(--msgbox-p, 1.5rem);
	}
	dialog::backdrop {
		background: var(--msgbox-backdrop, rgb(0 0 0 / 0.25));
	}
	footer {
		display: flex;
		gap: 1ch;
		justify-content: flex-end;
	}
	form {
		display: grid;
		gap: 1rem;
	}
	h2 {
		font-size: 1.5rem;
		font-weight: 500;
		margin: 0;
		text-box: trim-both cap;
	}
	input {
		border: 1px solid GrayText;
		border-radius: 1em;
	}
	input:focus-visible {
		outline: 2px solid var(--AccentColor);
	}
	label {
		display: contents;
	}
	@media (hover: hover) {
		:host::part(cancel):hover {
			background: color-mix(in oklab, Canvas, CanvasText 5%);
		}
		:host::part(ok):hover {
			background: color-mix(in oklab, var(--AccentColor), CanvasText 20%);
		}
	}
`);

export default class MsgBox extends HTMLElement {
	#elements = {};

	#i18n = {
		de: { ok: 'OK', cancel: 'Abbrechen' },
		en: { ok: 'OK', cancel: 'Cancel' },
		es: { ok: 'Aceptar', cancel: 'Cancelar' },
		ja: { ok: 'OK', cancel: 'キャンセル' },
		ru: { ok: 'ОК', cancel: 'Отмена' },
		zh: { ok: '确定', cancel: '取消' }
	};

	set i18n(translations) {
		Object.assign(this.#i18n, translations);
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' });
		shadow.adoptedStyleSheets = [styles];
		shadow.innerHTML = `
			<dialog part="dialog" closedby="${this.hasAttribute('dismiss') ? 'any' : 'closerequest'}">
				<form part="form">
					<h2 part="headline"></h2>
					<span part="message"></span>
					<input type="text" part="input">
					<footer part="footer">
						<button type="button" formmethod="dialog" part="cancel">${this.#t('cancel')}</button>
						<button type="submit" value="true" autofocus part="ok">${this.#t('ok')}</button>
					</footer>
				</form>
			</dialog>`;

		['cancel', 'dialog', 'form', 'headline', 'input', 'message'].forEach(id => 
			this.#elements[id] = shadow.querySelector(`[part="${id}"]`)
		);

		this.#elements.cancel.onclick = () => this.#elements.dialog.close(false);
		this.#elements.form.onsubmit = e => {
			e.preventDefault();
			const value = this.#elements.input.hidden ? e.submitter.value : this.#elements.input.value;
			this.#elements.dialog.close(value);
		};
	}

	alert(message, headline = '') { return this.#show(message, headline, 1); }
	confirm(message, headline = '') { return this.#show(message, headline, 2); }
	prompt(message, value = '', headline = '') { return this.#show(message, headline, 3, value); }

	#show(message, headline, type = 1, value = '') {
		const { cancel, dialog, headline: head, input, message: msg } = this.#elements;
		cancel.hidden = type === 1;
		head.hidden = !headline;
		head.textContent = headline;
		input.hidden = type !== 3;
		input.required = input.autofocus = type === 3;
		input.value = value;
		msg.textContent = message;

		dialog.showModal();
		return new Promise(resolve => {
			dialog.onclose = () => {
				const result = dialog.returnValue === 'true' ? true : dialog.returnValue || false;
				resolve(result);
			};
		});
	}

	#t(text) {
		const lang = this.getAttribute('lang') || navigator.language.split('-')[0];
		return this.#i18n[lang]?.[text] || this.#i18n.en[text] || text;
	}
}

customElements.define('msg-box', MsgBox);

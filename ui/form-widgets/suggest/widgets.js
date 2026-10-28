/**
 * A type-ahead widget for <form-flow>: ui.widget "auto-suggest" on a string field with options.source, drawn with
 * <auto-suggest> (ui/auto-suggest). The service gets the answers it sends plus q, the typed text. Docs: readme.md
 */
const COMPONENT = new URL('../../auto-suggest/index.js', import.meta.url).href;
const SHEET = new URL('./auto-suggest.css', import.meta.url).href;
/* <auto-suggest> writes label, placeholder and display into its template as HTML, so they are escaped here. */
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

/* The address <auto-suggest> appends the typed text to. */
function apiOf(service, values = {}) {
	if (!service?.url) return '';
	const url = new URL(service.url, document.baseURI);
	(service.send ?? []).forEach(field => url.searchParams.set(field, values[field] ?? ''));
	url.searchParams.set('q', '');
	return url.href;
}

const ready = element => new Promise(resolve => {
	const wait = () => (element.input ? resolve(element) : requestAnimationFrame(wait));
	customElements.whenDefined('auto-suggest').then(wait);
});

export const widgets = {
	'auto-suggest': {
		ownLabel: true,
		load: () => import(COMPONENT),
		render({ id, property, value, flow, service }) {
			const element = document.createElement('auto-suggest');
			const suggest = property.ui?.suggest ?? {};
			element.setAttribute('name', id);
			element.setAttribute('styles', SHEET);
			element.setAttribute('label', escape(property.title ?? id));
			element.setAttribute('api', apiOf(service, flow.values));
			element.setAttribute('api-value-path', suggest.valuePath ?? 'value');
			element.setAttribute('api-display-path', suggest.displayPath ?? 'label');
			element.setAttribute('min-length', String(property.options?.minLength ?? 2));
			element.setAttribute('nolimit', '');
			if (property.ui?.placeholder) element.setAttribute('placeholder', escape(property.ui.placeholder));
			if (value) ready(element).then(() => { element.displayValue = value; });
			/* The answers a service is sent can change; the next search uses the new ones. */
			element.addEventListener('focusin', () => { if (element.settings) element.settings.api = apiOf(service, flow.values); });
			element.addEventListener('autoSuggestSelect', () => element.dispatchEvent(new Event('change', { bubbles: true })));
			return element;
		},
		read(element) {
			return element?.input?.value?.trim() || undefined;
		},
		write(element, value) {
			ready(element).then(() => { element.displayValue = value ?? ''; });
		}
	}
};

export default widgets;

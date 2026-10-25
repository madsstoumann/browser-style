/**
 * Consent records: what a person agreed to, for the submit payload and the CMS's consent log.
 * A consent field is a boolean with `ui.widget: "consent"` and `consent: { text, notice: { label, url, version } }`.
 */
import { normalizeForm } from './form.js';
import { formInfo } from './session.js';

/* One record per ticked consent field in the submitted values: { field, text, notice, form }. The host adds the time. */
export function consentRecords(definition, values = {}) {
	const { id, version } = formInfo(definition);
	return Object.entries(normalizeForm(definition).properties)
		.filter(([field, property]) => property?.ui?.widget === 'consent' && values[field] === true)
		.map(([field, property]) => ({
			field,
			text: property.consent?.text ?? property.title ?? field,
			notice: property.consent?.notice ?? null,
			form: { id: id ?? null, version: version ?? null }
		}));
}

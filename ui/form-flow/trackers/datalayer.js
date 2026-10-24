/**
 * dataLayer tracker: pushes each ff:track event to window.dataLayer for Google Tag Manager / GA4.
 * Event names become form_<type> (form_step_view, form_submit); parameters are flat snake_case, at most 25.
 * Docs: ../readme.md § Tracking
 */
const MAX_PARAMS = 25;
const snake = key => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/[^a-z0-9_]/g, '_');
const text = value => Array.isArray(value)
	? value.map(item => (item && typeof item === 'object' ? Object.values(item).join('>') : item)).join(',')
	: value;

export function toDataLayer(event, prefix = 'form_') {
	const params = {
		event: `${prefix}${snake(event.type.replace(/^form\./, ''))}`,
		form_id: event.form,
		form_rules: event.rules,
		form_version: event.version,
		form_session: event.session,
		form_seq: event.seq,
		form_step: event.step,
		form_step_index: event.index,
		form_path: event.path.join('>')
	};
	for (const [key, value] of Object.entries(event.data ?? {})) {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			Object.entries(value).forEach(([inner, innerValue]) => { params[`${snake(key)}_${snake(inner)}`] = text(innerValue); });
		} else params[snake(key) === 'event' ? 'form_event' : snake(key)] = text(value);
	}
	return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null).slice(0, MAX_PARAMS + 1));
}

export function dataLayer({ name = 'dataLayer', prefix = 'form_' } = {}) {
	return Object.assign(event => {
		const layer = (globalThis[name] ??= []);
		layer.push(toDataLayer(event, prefix));
	}, { flush() {} });
}

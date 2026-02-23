function normalizeResult(item) {
	const schema = item.schema_object || {};
	return {
		description: schema.description,
		image: schema.image,
		name: schema.name || item.name,
		url: item.url,
	};
}

export function buildRequest(api, query, context, options = {}) {
	const params = new URLSearchParams({ query });
	if (context.prev.length > 1) params.set('prev', JSON.stringify(context.prev.slice(0, -1)));
	if (options.maxResults) params.set('max_results', String(options.maxResults));
	if (options.rewrite != null) params.set('rewrite', String(options.rewrite));
	return { url: `${api}/stream?${params}` };
}

export function parseEvent(eventData) {
	try {
		const data = JSON.parse(eventData);
		switch (data.type) {
			case 'chunk':
				return { type: 'chunk', text: data.text };
			case 'results':
				return { type: 'results', items: data.items.map(normalizeResult) };
			case 'done':
				return { type: 'done' };
			case 'error':
				return { type: 'error', message: data.message };
			default:
				return null;
		}
	} catch {
		return null;
	}
}

function normalizeResult(item) {
	const schema = item.schema_object || {};
	return {
		description: schema.description,
		image: schema.image,
		name: schema.name || item.name,
		url: item.url,
	};
}

export function buildRequest(api, query, context) {
	const params = new URLSearchParams({
		query,
		display_mode: 'full',
		generate_mode: 'summarize',
	});
	if (context.prev.length > 1) params.set('prev', JSON.stringify(context.prev.slice(0, -1)));
	if (context.last.length) params.set('last_ans', JSON.stringify(context.last));
	return { url: `${api}/ask?${params}` };
}

export function parseEvent(eventData) {
	try {
		const data = JSON.parse(eventData);
		switch (data.message_type) {
			case 'summary':
				return { type: 'chunk', text: data.message };
			case 'result_batch':
				return { type: 'results', items: data.results.map(normalizeResult) };
			case 'complete':
				return { type: 'done' };
			default:
				return null;
		}
	} catch {
		return null;
	}
}

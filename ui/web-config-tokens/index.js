export default class WebConfigTokens extends HTMLElement {
	async connectedCallback() {
		const src = this.getAttribute('src');
		if (!src) return;
		try {
			const data = await (await fetch(src)).json();
			this.replaceChildren(this.render(data));
		} catch (e) {
			this.innerHTML = `<p>Error loading tokens: ${e.message}</p>`;
		}
	}

	render(data, path = []) {
		if (data.$value !== undefined) {
			const el = document.createElement('design-token');
			const name = data.$extensions?.css?.name || path.join('-');
			el.setAttribute('name', name);
			el.textContent = name;
			el.src = data;
			console.log(el.src);
			return el;
		}

		const entries = Object.entries(data).filter(([k]) => !k.startsWith('$'));

		if (!path.length) {
			const frag = document.createDocumentFragment();
			entries.forEach(([k, v]) => frag.append(this.render(v, [k])));
			return frag;
		}

		const details = document.createElement('details');
		if (path.length === 1) details.setAttribute('name', 'token-group');

		const summary = document.createElement('summary');
		summary.textContent = data.$extensions?.ui?.title || path.at(-1);
		details.append(summary);

		const tokens = document.createElement('div');
		tokens.toggleAttribute('data-token-group', true);

		const groups = document.createDocumentFragment();

		for (const [k, v] of entries) {
			const node = this.render(v, [...path, k]);
			(v.$value !== undefined ? tokens : groups).append(node);
		}

		if (tokens.hasChildNodes()) details.append(tokens);
		details.append(groups);

		return details;
	}
}

customElements.define('web-config-tokens', WebConfigTokens);

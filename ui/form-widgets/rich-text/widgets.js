/**
 * A rich-text widget for <form-flow>: ui.widget "rich-text" on a string field, drawn with <rich-text> (ui/rich-text).
 * The component is imported the first time a field uses it. The value is HTML, cut down to an allowlist both ways.
 * Docs: readme.md
 */
const COMPONENT = new URL('../../rich-text/index.js', import.meta.url).href;
const TAGS = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'HR']);

/* Keeps allowlisted tags, and only http(s) and mailto links; everything else is unwrapped to its text. Parsed inert. */
export function cleanHTML(html) {
	const doc = new DOMParser().parseFromString(`<body>${String(html ?? '')}</body>`, 'text/html');
	const walk = node => {
		for (const child of [...node.childNodes]) {
			if (child.nodeType === Node.COMMENT_NODE) { child.remove(); continue; }
			if (child.nodeType !== Node.ELEMENT_NODE) continue;
			walk(child);
			if (!TAGS.has(child.tagName)) {
				if (['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT'].includes(child.tagName)) child.remove();
				else child.replaceWith(...child.childNodes);
				continue;
			}
			const href = child.tagName === 'A' ? child.getAttribute('href') : null;
			[...child.attributes].forEach(attribute => child.removeAttribute(attribute.name));
			if (href && /^(https?:|mailto:)/i.test(href.trim())) {
				child.setAttribute('href', href.trim());
				child.setAttribute('rel', 'noopener');
			}
		}
	};
	walk(doc.body);
	return doc.body.innerHTML;
}

const ready = element => new Promise(resolve => {
	const wait = () => (element.content ? resolve(element) : requestAnimationFrame(wait));
	customElements.whenDefined('rich-text').then(wait);
});

export const widgets = {
	'rich-text': {
		load: () => import(COMPONENT),
		render({ id, property, value }) {
			const element = document.createElement('rich-text');
			element.setAttribute('name', id);
			element.setAttribute('styles', '');
			element.setAttribute('toolbar', property.ui?.toolbar ?? 'b,i,u|ol,ul|link,unlink');
			if (value) ready(element).then(() => element.setContent(cleanHTML(value)));
			return element;
		},
		read(element) {
			if (!element?.content) return undefined;
			const html = cleanHTML(element.content.innerHTML);
			return element.content.textContent.trim() ? html : undefined;
		},
		write(element, value) {
			ready(element).then(() => element.setContent(cleanHTML(value ?? '')));
		}
	}
};

export default widgets;

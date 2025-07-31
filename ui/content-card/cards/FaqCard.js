import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderHeader, renderLinks, renderMedia } from '../base/utils.js';

export class FaqCard extends BaseCard {
	constructor() {
		super();
	}

	render() {
		if (!this.data) return '';
		
		const settings = this.settings;
		const useSchema = settings.useSchema;
		const { content = {} } = this.data;
		const headlineTag = content.headlineTag || 'h2';
		
		// Generate a unique name for this FAQ instance (Math.random() is fine for DOM IDs)
		const faqName = `faq-${this.data.id || Math.random().toString(36).slice(2)}`;

		// Set schema on the card element itself
		if (useSchema) {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', 'https://schema.org/FAQPage');
		}

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : (useSchema ? '<meta itemprop="name" content="Frequently Asked Questions">' : '')}
				<div ${getStyle('cc-faq', settings)}>
					${content.text?.map((item, idx) => `
						<details ${getStyle('cc-faq-item', settings)} name="${faqName}" ${useSchema ? 'itemscope itemtype="https://schema.org/Question" itemprop="mainEntity"' : ''}>
							<summary ${getStyle('cc-faq-title', settings)} ${useSchema ? 'itemprop="name"' : ''}>${item.headline}</summary>
							<div ${getStyle('cc-faq-panel', settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/Answer" itemprop="acceptedAnswer"' : ''}>
								<div ${useSchema ? 'itemprop="text"' : ''}>${item.text}</div>
							</div>
						</details>
					`).join('') || ''}
				</div>
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, settings)}
			</div>
		`;
	}
}

customElements.define('faq-card', FaqCard);
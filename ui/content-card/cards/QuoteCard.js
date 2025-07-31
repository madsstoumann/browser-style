import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderAuthors, renderLinks, renderMedia } from '../base/utils.js';

export class QuoteCard extends BaseCard {
	constructor() {
		super();
	}

	render() {
		if (!this.data) return '';
		
		const settings = this.settings;
		const useSchema = settings.useSchema;
		const { content = {} } = this.data;

		// Set schema on the card element itself
		if (useSchema) {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', 'https://schema.org/Quotation');
		}

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.summary ? `
					<blockquote ${getStyle('cc-quote', settings)}>
						<p ${getStyle('cc-quote-text', settings)} ${useSchema ? 'itemprop="text"' : ''}>${content.summary}</p>
						${this.data.authors?.length ? `
							<cite ${getStyle('cc-quote-citation', settings)} ${useSchema ? 'itemprop="citation"' : ''}>
								${renderAuthors(this.data.authors, useSchema, settings)}								
							</cite>
						` : ''}
					</blockquote>
				` : ''}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, settings)}
			</div>
		`;
	}
}

// Define the custom element
customElements.define('quote-card', QuoteCard);
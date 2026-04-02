import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderAuthors, renderEngagement, renderHeader, renderLinks, renderMedia, renderTags } from '../base/utils.js';

/**
 * ContentCard - A generic card component that renders all common fields
 * without any type-specific data properties.
 *
 * Use this for simple content that doesn't fit a specific card type,
 * or as a base template for custom content displays.
 *
 * Renders: media, content (headline, subheadline, summary, text),
 * authors, engagement, tags, links, and actions.
 */
export class ContentCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-content-card');
	}

	render() {
		const renderContext = this._setSchema('CreativeWork');
		if (!renderContext) return '';

		const { settings, useSchema, content, headlineTag } = renderContext;

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.published?.datetime && useSchema ? `<meta itemprop="datePublished" content="${content.published.datetime}">` : ''}
				${content.modified?.datetime && useSchema ? `<meta itemprop="dateModified" content="${content.modified.datetime}">` : ''}

				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="headline"' : ''}>${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}

				${this.data.authors?.length ? renderAuthors(this.data.authors, useSchema, settings) : ''}

				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				${content.text ? `<div ${getStyle('cc-text', settings)} ${useSchema ? 'itemprop="text"' : ''}>${content.text}</div>` : ''}

				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('content-card', ContentCard);

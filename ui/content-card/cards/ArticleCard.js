import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderAuthors, renderEngagement, renderHeader, renderLinks, renderMedia, renderTags } from '../base/utils.js';

export class ArticleCard extends BaseCard {
	constructor() {
		super();
	}

	render() {
		if (!this.data) return '';
		
		const settings = this.settings;
		const useSchema = settings.useSchema;
		const { content = {} } = this.data;
		const headlineTag = content.headlineTag || 'h2';

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/Article"' : ''}>
				${content.category && useSchema ? `<meta itemprop="articleSection" content="${content.category}">` : ''}
				${content.published?.datetime && useSchema ? `<meta itemprop="datePublished" content="${content.published.datetime}">` : ''}
				${content.modified?.datetime && useSchema ? `<meta itemprop="dateModified" content="${content.modified.datetime}">` : ''}
				
				${renderHeader(content, settings)}				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="headline"' : ''}>${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				
				${this.data.authors?.length ? renderAuthors(this.data.authors, useSchema, settings) : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}			
				${content.text ? `<div ${getStyle('cc-text', settings)} ${useSchema ? 'itemprop="articleBody"' : ''}>${content.text}</div>` : ''}
				
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, settings)}
			</div>
		`;
	}
}

customElements.define('article-card', ArticleCard);
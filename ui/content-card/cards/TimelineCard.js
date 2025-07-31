import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderHeader, renderLinks, renderMedia } from '../base/utils.js';

export class TimelineCard extends BaseCard {
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
			<div ${getStyle('cc-content', settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/EventSeries"' : ''}>
				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : (useSchema ? '<meta itemprop="name" content="Timeline">' : '')}
				<ol ${getStyle('cc-timeline', settings)}>
					${content.text?.map(item => `
						<li ${getStyle('cc-timeline-item', settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/Event" itemprop="subEvent"' : ''}>
							<div ${getStyle('cc-timeline-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${item.headline}</div>
							<div ${getStyle('cc-timeline-text', settings)} ${useSchema ? 'itemprop="description"' : ''}>${item.text}</div>
							${useSchema ? `<meta itemprop="startDate" content="${item.startDate || new Date().toISOString().split('T')[0]}">` : ''}
							${item.endDate && useSchema ? `<meta itemprop="endDate" content="${item.endDate}">` : ''}
							${useSchema ? `<meta itemprop="location" content="${item.location || 'Timeline Event'}">` : ''}
						</li>
					`).join('') || ''}
				</ol>
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, settings)}
			</div>
		`;
	}
}

customElements.define('timeline-card', TimelineCard);
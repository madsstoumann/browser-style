import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderEngagement, renderHeader, renderLinks, renderMedia, renderTags } from '../base/utils.js';

export class EventCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-event');
	}

	render() {
		const renderContext = this._setupRender();
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { event: eventData = {} } = this.data;
		
		if (useSchema) {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', `https://schema.org/${content.category || 'Event'}`);
		}

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${eventData.status && useSchema ? `<meta itemprop="eventStatus" content="https://schema.org/EventStatus${eventData.status}">` : ''}
				${eventData.attendanceMode && useSchema ? `<meta itemprop="eventAttendanceMode" content="https://schema.org/${eventData.attendanceMode}">` : ''}
				
				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				${content.text ? `<div ${getStyle('cc-text', settings)}>${content.text}</div>` : ''}
				${eventData.startDate && useSchema ? `<meta itemprop="startDate" content="${eventData.startDate}">` : ''}
				${eventData.endDate && useSchema ? `<meta itemprop="endDate" content="${eventData.endDate}">` : ''}
				
				${eventData.location ? `
					<div ${getStyle('cc-event-location', settings)} ${useSchema ? 'itemprop="location" itemscope itemtype="https://schema.org/Place"' : ''}>
						<span ${useSchema ? 'itemprop="name"' : ''}>${eventData.location.name}</span>
						${eventData.location.address ? `
							<span ${useSchema ? 'itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"' : ''}>
								<span ${useSchema ? 'itemprop="streetAddress"' : ''}>${eventData.location.address}</span>
							</span>
						` : ''}
					</div>
				` : ''}
				
				${eventData.organizer ? `
					<div ${getStyle('cc-event-organizer', settings)} ${useSchema ? 'itemprop="organizer" itemscope itemtype="https://schema.org/Organization"' : ''}>
						<span ${useSchema ? 'itemprop="name"' : ''}>${eventData.organizer.name}</span>
					</div>
				` : ''}
				
				${eventData.offers && eventData.offers.length ? `
					${eventData.offers.map(offer => `
						<div ${getStyle('cc-event-offer', settings)} ${useSchema ? 'itemprop="offers" itemscope itemtype="https://schema.org/Offer"' : ''}>
							<span ${useSchema ? 'itemprop="name"' : ''}>${offer.name}</span>
							${offer.price ? `<span ${useSchema ? `itemprop="price" content="${offer.price}"` : ''}>${offer.currency || '$'}${offer.price}</span>` : ''}
							${offer.price && useSchema ? `<meta itemprop="priceCurrency" content="${offer.currency || 'USD'}">` : ''}
							${useSchema ? '<meta itemprop="availability" content="https://schema.org/InStock">' : ''}
						</div>
					`).join('')}
				` : ''}
				
				${renderEngagement(this.data.engagement, false, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('event-card', EventCard);
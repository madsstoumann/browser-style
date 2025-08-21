import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class LocationCard extends BaseCard {
	constructor() {
		super();
	}

	renderAddress(address, useSchema, settings) {
		if (!address) return '';
		
		const { streetAddress, addressLocality, addressRegion, addressCountry } = address;
		
		return `
			<div ${getStyle('cc-location-address', settings)} ${useSchema ? 'itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"' : ''}>
				<span class="material-icons">location_on</span>
				<div ${getStyle('cc-location-address-text', settings)}>
					${streetAddress ? `<div ${useSchema ? 'itemprop="streetAddress"' : ''}>${streetAddress}</div>` : ''}
					<div>
						${addressLocality ? `<span ${useSchema ? 'itemprop="addressLocality"' : ''}>${addressLocality}</span>` : ''}${addressRegion ? `, <span ${useSchema ? 'itemprop="addressRegion"' : ''}>${addressRegion}</span>` : ''}
					</div>
					${useSchema && addressCountry ? `<meta itemprop="addressCountry" content="${addressCountry}">` : ''}
				</div>
			</div>
		`;
	}

	renderGeoData(geo, useSchema, settings) {
		if (!geo) return '';
		
		return `
			<div ${getStyle('cc-location-geo', settings)} ${useSchema ? 'itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates"' : ''}>
				${useSchema ? `<meta itemprop="latitude" content="${geo.latitude}">` : ''}
				${useSchema ? `<meta itemprop="longitude" content="${geo.longitude}">` : ''}
			</div>
		`;
	}

	renderContactInfo(locationData, settings) {
		const contacts = [];
		
		if (locationData.contact) {
			contacts.push(`
				<div ${getStyle('cc-location-contact-item', settings)}>
					<span class="material-icons">phone</span>
					<a href="tel:${locationData.contact}">${locationData.contact}</a>
				</div>
			`);
		}
		
		if (locationData.hours) {
			contacts.push(`
				<div ${getStyle('cc-location-contact-item', settings)}>
					<span class="material-icons">schedule</span>
					<span>${locationData.hours}</span>
				</div>
			`);
		}
		
		if (!contacts.length) return '';
		
		return `
			<div ${getStyle('cc-location-contact', settings)}>
				${contacts.join('')}
			</div>
		`;
	}

	renderAmenities(amenities, settings) {
		if (!amenities?.length) return '';
		
		return `
			<div ${getStyle('cc-location-amenities', settings)}>
				<h4 ${getStyle('cc-location-amenities-title', settings)}>Amenities</h4>
				<div ${getStyle('cc-location-amenities-list', settings)}>
					${amenities.map(amenity => `<span ${getStyle('cc-location-amenity', settings)}>${amenity}</span>`).join('')}
				</div>
			</div>
		`;
	}

	renderRating(rating, useSchema, settings) {
		if (!rating) return '';
		
		const { value, count, max = 5 } = rating;
		const filledStars = Math.round(value);
		const emptyStars = max - filledStars;
		
		return `
			<div ${getStyle('cc-location-rating', settings)} ${useSchema ? 'itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating"' : ''}>
				${useSchema ? `<meta itemprop="ratingValue" content="${value}">` : ''}
				${useSchema ? `<meta itemprop="ratingCount" content="${count}">` : ''}
				${useSchema ? `<meta itemprop="bestRating" content="${max}">` : ''}
				${useSchema ? `<meta itemprop="worstRating" content="1">` : ''}
				<div ${getStyle('cc-location-stars', settings)} role="img" aria-label="Rating: ${value} out of ${max} stars">
					<span aria-hidden="true">
						${'★'.repeat(filledStars)}${'☆'.repeat(emptyStars)}
					</span>
					<span ${getStyle('cc-location-rating-text', settings)}>${value} (${count?.toLocaleString()} reviews)</span>
				</div>
			</div>
		`;
	}

	render() {
		// Use TouristDestination for tourist locations, otherwise Place
		const schemaType = this.data.content?.category === 'Tourist Destination' ? 'TouristDestination' : 'Place';
		const renderContext = this._setSchema(schemaType);
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { location: locationData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderAddress(locationData.address, useSchema, settings)}
				${this.renderGeoData(locationData.geo, useSchema, settings)}
				${this.renderContactInfo(locationData, settings)}
				${this.renderRating(locationData.rating, useSchema, settings)}
				${this.renderAmenities(locationData.amenities, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('location-card', LocationCard);
import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderHeader, renderLinks, renderMedia } from '../base/utils.js';

export class BusinessCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-business');
	}

	renderMap(geoData, businessName = 'business location') {
		const settings = this.settings;
		const { latitude, longitude, mapProvider } = geoData;
		
		if (!mapProvider || !mapProvider.url) {
			console.warn('BusinessCard: mapProvider.url is required for map display');
			return '';
		}
		
		// Calculate bounding box (small area around the point)
		const lat = parseFloat(latitude);
		const lng = parseFloat(longitude);
		const latOffset = mapProvider.latOffset || 0.003; // Default ~300m north/south
		const lngOffset = mapProvider.lngOffset || 0.005; // Default ~400m east/west
		
		// Replace placeholders in URL template
		let mapUrl = mapProvider.url
			.replace('{lat}', lat)
			.replace('{lng}', lng)
			.replace('{lat1}', lat - latOffset)
			.replace('{lat2}', lat + latOffset)
			.replace('{lng1}', lng - lngOffset)
			.replace('{lng2}', lng + lngOffset)
			.replace('{zoom}', mapProvider.zoom || 15);
		
		// Use provider name from data or fallback
		const providerName = mapProvider.name || mapProvider.type || 'Map';
		
		return `
			<iframe ${getStyle('cc-business-map', settings)}
				src="${mapUrl}"
				loading="lazy"
				title="${providerName} showing ${businessName}">
			</iframe>
		`;
	}

	render() {
		// Use BaseCard helper for common setup and schema
		const renderContext = this._setSchema('LocalBusiness');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const useMap = settings.useMap !== false; // Default to true, can be disabled
		const { business: businessData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${businessData.address ? `
					<div ${getStyle('cc-business-address', settings)} ${useSchema ? 'itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"' : ''}>
						<div ${useSchema ? 'itemprop="streetAddress"' : ''}>${businessData.address.streetAddress}</div>
						<div>
							<span ${useSchema ? 'itemprop="addressLocality"' : ''}>${businessData.address.addressLocality}</span>,
							<span ${useSchema ? 'itemprop="addressRegion"' : ''}>${businessData.address.addressRegion}</span>
							<span ${useSchema ? 'itemprop="postalCode"' : ''}>${businessData.address.postalCode}</span>
						</div>
						${useSchema ? `<meta itemprop="addressCountry" content="${businessData.address.addressCountry}">` : ''}
					</div>
				` : ''}
				
				${businessData.geo ? `
					<div ${getStyle('cc-business-location', settings)} ${useSchema ? 'itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates"' : ''}>
						${useSchema ? `<meta itemprop="latitude" content="${businessData.geo.latitude}">` : ''}
						${useSchema ? `<meta itemprop="longitude" content="${businessData.geo.longitude}">` : ''}
						${useMap ? this.renderMap(businessData.geo, content.headline) : ''}
					</div>
				` : ''}
				
				${businessData.telephone ? `
					<div ${getStyle('cc-business-contact', settings)}>
						<a href="tel:${businessData.telephone}" ${useSchema ? 'itemprop="telephone"' : ''}>${businessData.telephone}</a>
					</div>
				` : ''}
				
				${businessData.email ? `
					<div ${getStyle('cc-business-contact', settings)}>
						<a href="mailto:${businessData.email}" ${useSchema ? 'itemprop="email"' : ''}>${businessData.email}</a>
					</div>
				` : ''}
				
				${businessData.website && useSchema ? `<meta itemprop="url" content="${businessData.website}">` : ''}
				${businessData.foundingDate && useSchema ? `<meta itemprop="foundingDate" content="${businessData.foundingDate}">` : ''}
				
				${businessData.sameAs?.length && useSchema ? `
					${businessData.sameAs.map(url => `<link itemprop="sameAs" href="${url}">`).join('')}
				` : ''}
				
				${businessData.openingHours?.length ? `
					<div ${getStyle('cc-business-hours', settings)}>
						<h3 ${getStyle('cc-business-hours-title', settings)}>Opening Hours</h3>
						${useSchema ? businessData.openingHours.map(hours => {
							// Support both new object format and legacy string format
							const schemaValue = typeof hours === 'object' ? hours.schema : hours;
							return `<meta itemprop="openingHours" content="${schemaValue}">`;
						}).join('') : ''}
						<div ${getStyle('cc-business-hours-display', settings)}>
							${businessData.openingHours.map(hours => {
								// Use display field if available, otherwise fall back to schema value
								const displayText = typeof hours === 'object' ? hours.display : hours;
								return `<div ${getStyle('cc-business-hour', settings)}>${displayText}</div>`;
							}).join('')}
						</div>
					</div>
				` : ''}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('business-card', BusinessCard);
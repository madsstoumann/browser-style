import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderEngagement, renderLinks, renderMedia, renderTags } from '../base/utils.js';

export class ProductCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-product');
	}

	render() {
		const renderContext = this._setSchema('Product');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { product: productData = {} } = this.data;
		const price = productData.price || {};
		const rating = productData.rating || {};

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${productData.sku && useSchema ? `<meta itemprop="sku" content="${productData.sku}">` : ''}
				${content.category && useSchema ? `<meta itemprop="category" content="${content.category}">` : ''}
				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				${content.text ? `<div ${getStyle('cc-text', settings)}>${content.text}</div>` : ''}
				
				${price.current ? `
					<div ${getStyle('cc-product-price', settings)} ${useSchema ? 'itemprop="offers" itemscope itemtype="https://schema.org/Offer"' : ''}>
						${useSchema ? `<meta itemprop="priceCurrency" content="${price.currency || 'USD'}">` : ''}
						<span ${useSchema ? `itemprop="price" content="${price.current}"` : ''}>${price.currency || '$'} ${price.current}</span>
						${price.original && price.original > price.current ? `<del ${getStyle('cc-product-price-original', settings)}>${price.currency || '$'} ${price.original}</del>` : ''}
						${price.discountText ? `<span ${getStyle('cc-product-discount', settings)}>${price.discountText}</span>` : ''}
						${useSchema ? `<meta itemprop="availability" content="https://schema.org/${productData.availability && productData.availability.toLowerCase().includes('out of stock') ? 'OutOfStock' : 'InStock'}">` : ''}
						${useSchema ? `<meta itemprop="itemCondition" content="https://schema.org/NewCondition">` : ''}
					</div>
				` : ''}
				
				${productData.availability ? `<div ${getStyle('cc-product-availability', settings)}>${productData.availability}</div>` : ''}				
				${productData.validUntil ? `<div ${getStyle('cc-product-validity', settings)}>Offer valid until ${productData.validUntil}</div>` : ''}
				
				${rating.value ? `
					<div ${getStyle('cc-product-rating', settings)} ${useSchema ? 'itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating"' : ''}>
						${useSchema ? `<meta itemprop="ratingValue" content="${rating.value}">` : ''}
						${useSchema ? `<meta itemprop="ratingCount" content="${rating.count || 0}">` : ''}
						${useSchema ? `<meta itemprop="reviewCount" content="${rating.count || 0}">` : ''}
						${useSchema ? `<meta itemprop="bestRating" content="${rating.max || 5}">` : ''}
						${useSchema ? `<meta itemprop="worstRating" content="${rating.min || 0}">` : ''}
						<span>${'★'.repeat(Math.round(rating.value))}${'☆'.repeat((rating.max || 5) - Math.round(rating.value))}
						(${rating.value} / ${rating.max || 5}, ${rating.count} ratings)</span>
					</div>
				` : ''}
				
				${renderEngagement(this.data.engagement, false, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('product-card', ProductCard);
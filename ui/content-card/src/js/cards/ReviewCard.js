import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderEngagement, renderLinks, renderMedia } from '../base/utils.js';

export class ReviewCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-review');
	}

	renderRating(rating, useSchema, settings) {
		if (!rating) return '';
		
		const { value, max = 5 } = rating;
		const filledStars = Math.round(value);
		const emptyStars = max - filledStars;
		
		return `
			<div ${getStyle('cc-review-rating', settings)} ${useSchema ? 'itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating"' : ''}>
				${useSchema ? `<meta itemprop="ratingValue" content="${value}">` : ''}
				${useSchema ? `<meta itemprop="bestRating" content="${max}">` : ''}
				${useSchema ? `<meta itemprop="worstRating" content="1">` : ''}
				<div ${getStyle('cc-review-stars', settings)} role="img" aria-label="Rating: ${value} out of ${max} stars">
					<span aria-hidden="true">
						${'★'.repeat(filledStars)}${'☆'.repeat(emptyStars)}
					</span>
					<span ${getStyle('cc-review-rating-text', settings)}>(${value}/${max})</span>
				</div>
			</div>
		`;
	}

	renderReviewer(reviewer, useSchema, settings) {
		if (!reviewer) return '';
		
		return `
			<div ${getStyle('cc-review-reviewer', settings)} ${useSchema ? 'itemprop="author" itemscope itemtype="https://schema.org/Person"' : ''}>
				<div ${getStyle('cc-review-reviewer-info', settings)}>
					<span ${getStyle('cc-review-reviewer-name', settings)} ${useSchema ? 'itemprop="name"' : ''}>${reviewer.name}</span>
					${reviewer.verified ? `<span ${getStyle('cc-review-verified', settings)} title="Verified Purchase">✓ Verified</span>` : ''}
				</div>
				${reviewer.purchaseDate ? `
					<div ${getStyle('cc-review-purchase-date', settings)}>
						Purchased ${new Date(reviewer.purchaseDate).toLocaleDateString()}
					</div>
				` : ''}
			</div>
		`;
	}

	renderReviewMeta(reviewData, useSchema, settings) {
		const meta = [];
		
		if (reviewData.reviewDate) {
			const reviewDate = new Date(reviewData.reviewDate);
			meta.push(`
				<div ${getStyle('cc-review-meta-item', settings)}>
					<time ${useSchema ? `itemprop="datePublished" datetime="${reviewData.reviewDate}"` : ''}>${reviewDate.toLocaleDateString()}</time>
				</div>
			`);
		}
		
		if (reviewData.productReviewed) {
			const itemType = reviewData.itemType || 'Thing';
			meta.push(`
				<div ${getStyle('cc-review-meta-item', settings)} ${useSchema ? `itemprop="itemReviewed" itemscope itemtype="https://schema.org/${itemType}"` : ''}>
					<span ${useSchema ? 'itemprop="name"' : ''}>${reviewData.productReviewed}</span>
					${reviewData.productImage && useSchema ? `<meta itemprop="image" content="${reviewData.productImage}">` : ''}
					${reviewData.aggregateRating && useSchema ? `
						<div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating" style="display:none;">
							<meta itemprop="ratingValue" content="${reviewData.aggregateRating.ratingValue}">
							<meta itemprop="ratingCount" content="${reviewData.aggregateRating.ratingCount}">
							<meta itemprop="bestRating" content="${reviewData.aggregateRating.bestRating}">
							<meta itemprop="worstRating" content="${reviewData.aggregateRating.worstRating}">
						</div>
					` : ''}
					${reviewData.productPrice && useSchema ? `
						<div itemprop="offers" itemscope itemtype="https://schema.org/Offer" style="display:none;">
							<meta itemprop="price" content="${reviewData.productPrice.amount}">
							<meta itemprop="priceCurrency" content="${reviewData.productPrice.currency}">
							<meta itemprop="availability" content="https://schema.org/InStock">
						</div>
					` : ''}
				</div>
			`);
		}
		
		if (reviewData.helpfulVotes && reviewData.helpfulVotes > 0) {
			meta.push(`
				<div ${getStyle('cc-review-meta-item', settings)}>
					<span>${reviewData.helpfulVotes} people found this helpful</span>
				</div>
			`);
		}
		
		if (!meta.length) return '';
		
		return `
			<div ${getStyle('cc-review-meta', settings)}>
				${meta.join('')}
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('Review');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { review: reviewData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${this.renderRating(reviewData.rating, useSchema, settings)}
				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${this.renderReviewer(reviewData.reviewer, useSchema, settings)}
				
				${content.summary ? `
					<div ${getStyle('cc-review-text', settings)} ${useSchema ? 'itemprop="reviewBody"' : ''}>
						${content.summary}
					</div>
				` : ''}
				
				${this.renderReviewMeta(reviewData, useSchema, settings)}
				
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('review-card', ReviewCard);
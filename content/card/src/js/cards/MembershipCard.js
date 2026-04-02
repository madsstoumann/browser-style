import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class MembershipCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-membership');
	}

	renderPricing(price, useSchema, settings) {
		if (!price) return '';
		
		const { monthly, yearly, currency, savings } = price;
		const currencySymbol = currency === 'USD' ? '$' : currency;
		
		return `
			<div ${getStyle('cc-membership-pricing', settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/PriceSpecification"' : ''}>
				${useSchema ? `<meta itemprop="priceCurrency" content="${currency || 'USD'}">` : ''}
				${useSchema ? `<meta itemprop="price" content="${monthly || yearly}">` : ''}
				
				<div ${getStyle('cc-membership-price-options', settings)}>
					${monthly ? `
						<div ${getStyle('cc-membership-price-option', settings)}>
							<span ${getStyle('cc-membership-price-amount', settings)}>
								${currencySymbol}${monthly}
							</span>
							<span ${getStyle('cc-membership-price-period', settings)}>/month</span>
						</div>
					` : ''}
					
					${yearly ? `
						<div ${getStyle('cc-membership-price-option', settings)}>
							<span ${getStyle('cc-membership-price-amount', settings)}>
								${currencySymbol}${yearly}
							</span>
							<span ${getStyle('cc-membership-price-period', settings)}>/year</span>
							${savings ? `<span ${getStyle('cc-membership-savings', settings)}>${savings}</span>` : ''}
						</div>
					` : ''}
				</div>
			</div>
		`;
	}

	renderFeatures(features, useSchema, settings) {
		if (!features?.length) return '';
		
		return `
			<div ${getStyle('cc-membership-features', settings)}>
				<h4 ${getStyle('cc-membership-features-title', settings)}>What's included</h4>
				<ul ${getStyle('cc-membership-features-list', settings)} ${useSchema ? 'itemprop="includesObject"' : ''}>
					${features.map(feature => `
						<li ${getStyle('cc-membership-feature', settings)}>
							<span class="material-icons">check</span>
							<span>${feature}</span>
						</li>
					`).join('')}
				</ul>
			</div>
		`;
	}

	renderLimitations(limitations, settings) {
		if (!limitations?.length) return '';
		
		return `
			<div ${getStyle('cc-membership-limitations', settings)}>
				<h4 ${getStyle('cc-membership-limitations-title', settings)}>Limitations</h4>
				<ul ${getStyle('cc-membership-limitations-list', settings)}>
					${limitations.map(limitation => `
						<li ${getStyle('cc-membership-limitation', settings)}>
							<span class="material-icons">info</span>
							<span>${limitation}</span>
						</li>
					`).join('')}
				</ul>
			</div>
		`;
	}

	renderTrialPeriod(trialPeriod, useSchema, settings) {
		if (!trialPeriod) return '';
		
		return `
			<div ${getStyle('cc-membership-trial', settings)}>
				<span class="material-icons">schedule</span>
				<span ${getStyle('cc-membership-trial-text', settings)} ${useSchema ? 'itemprop="eligibleDuration"' : ''}>
					${trialPeriod}
				</span>
			</div>
		`;
	}

	renderPopularBadge(isPopular, settings) {
		if (!isPopular) return '';
		
		return `
			<div ${getStyle('cc-membership-popular-badge', settings)}>
				<span class="material-icons">star</span>
				<span>Most Popular</span>
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('Offer');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { membership: membershipData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${membershipData.isPopular ? this.renderPopularBadge(membershipData.isPopular, settings) : ''}
				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${membershipData.planName && membershipData.planName !== content.headline ? `
					<div ${getStyle('cc-membership-plan-name', settings)}>${membershipData.planName}</div>
				` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderPricing(membershipData.price, useSchema, settings)}
				${this.renderTrialPeriod(membershipData.trialPeriod, useSchema, settings)}
				${this.renderFeatures(membershipData.features, useSchema, settings)}
				${this.renderLimitations(membershipData.limitations, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('membership-card', MembershipCard);
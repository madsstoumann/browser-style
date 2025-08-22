import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderEngagement, renderLinks, renderMedia } from '../base/utils.js';

export class SoftwareCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-software');
	}

	renderOperatingSystems(operatingSystems, useSchema, settings) {
		if (!operatingSystems?.length) return '';
		
		return `
			<div ${getStyle('cc-software-os', settings)}>
				<div ${getStyle('cc-software-os-list', settings)}>
					${operatingSystems.map(os => `
						<span ${getStyle('cc-software-os-item', settings)} ${useSchema ? 'itemprop="operatingSystem"' : ''}>${os}</span>
					`).join('')}
				</div>
			</div>
		`;
	}

	renderDeveloper(developer, useSchema, settings) {
		if (!developer) return '';
		
		return `
			<div ${getStyle('cc-software-developer', settings)} ${useSchema ? 'itemprop="author" itemscope itemtype="https://schema.org/Organization"' : ''}>
				<span ${useSchema ? 'itemprop="name"' : ''}>${developer.name}</span>
				${developer.website && useSchema ? `<meta itemprop="url" content="${developer.website}">` : ''}
			</div>
		`;
	}

	renderSoftwareMeta(softwareData, useSchema, settings) {
		const meta = [];
		
		if (softwareData.applicationCategory) {
			meta.push(`
				<div ${getStyle('cc-software-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="applicationCategory"' : ''}>${softwareData.applicationCategory}</span>
				</div>
			`);
		}
		
		if (softwareData.version) {
			meta.push(`
				<div ${getStyle('cc-software-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="softwareVersion"' : ''}>v${softwareData.version}</span>
				</div>
			`);
		}
		
		if (softwareData.fileSize) {
			meta.push(`
				<div ${getStyle('cc-software-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="fileSize"' : ''}>${softwareData.fileSize}</span>
				</div>
			`);
		}
		
		if (!meta.length) return '';
		
		return `
			<div ${getStyle('cc-software-meta', settings)}>
				${meta.join('')}
			</div>
		`;
	}

	renderSystemRequirements(requirements, settings) {
		if (!requirements) return '';
		
		const reqItems = [];
		
		if (requirements.ram) {
			reqItems.push(`<li><strong>RAM:</strong> ${requirements.ram}</li>`);
		}
		
		if (requirements.storage) {
			reqItems.push(`<li><strong>Storage:</strong> ${requirements.storage}</li>`);
		}
		
		if (requirements.processor) {
			reqItems.push(`<li><strong>Processor:</strong> ${requirements.processor}</li>`);
		}
		
		if (!reqItems.length) return '';
		
		return `
			<details ${getStyle('cc-software-requirements', settings)}>
				<summary ${getStyle('cc-software-requirements-title', settings)}>System Requirements</summary>
				<ul ${getStyle('cc-software-requirements-list', settings)}>
					${reqItems.join('')}
				</ul>
			</details>
		`;
	}

	renderScreenshots(screenshots, settings) {
		if (!screenshots?.length) return '';
		
		return `
			<div ${getStyle('cc-software-screenshots', settings)}>
				<h4 ${getStyle('cc-software-screenshots-title', settings)}>Screenshots</h4>
				<div ${getStyle('cc-software-screenshots-grid', settings)}>
					${screenshots.map((screenshot, index) => `
						<img 
							src="${screenshot}" 
							alt="Screenshot ${index + 1}"
							${getStyle('cc-software-screenshot', settings)}
							loading="lazy"
						>
					`).join('')}
				</div>
			</div>
		`;
	}

	renderPrice(price, useSchema, settings) {
		if (!price) return '';
		
		const { current, currency, type } = price;
		const currencySymbol = currency === 'USD' ? '$' : currency;
		
		return `
			<div ${getStyle('cc-software-price', settings)} ${useSchema ? 'itemprop="offers" itemscope itemtype="https://schema.org/Offer"' : ''}>
				${useSchema ? `<meta itemprop="priceCurrency" content="${currency || 'USD'}">` : ''}
				<span ${getStyle('cc-software-price-amount', settings)} ${useSchema ? `itemprop="price" content="${current}"` : ''}>
					${currencySymbol}${current}
				</span>
				${type ? `<span ${getStyle('cc-software-price-type', settings)}>${type}</span>` : ''}
				${useSchema ? `<meta itemprop="availability" content="https://schema.org/InStock">` : ''}
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('SoftwareApplication');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { software: softwareData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderSoftwareMeta(softwareData, useSchema, settings)}
				${this.renderDeveloper(softwareData.developer, useSchema, settings)}
				${this.renderOperatingSystems(softwareData.operatingSystem, useSchema, settings)}
				${this.renderPrice(softwareData.price, useSchema, settings)}
				
				${content.text ? `<div ${getStyle('cc-software-details', settings)}>${content.text}</div>` : ''}
				
				${this.renderSystemRequirements(softwareData.systemRequirements, settings)}
				${this.renderScreenshots(softwareData.screenshots, settings)}
				
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('software-card', SoftwareCard);
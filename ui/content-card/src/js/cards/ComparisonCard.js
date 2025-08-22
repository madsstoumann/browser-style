import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class ComparisonCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-comparison');
	}

	renderComparisonItems(items, settings) {
		if (!items?.length) return '';
		
		return `
			<div ${getStyle('cc-comparison-items', settings)}>
				${items.map(item => `
					<div ${getStyle('cc-comparison-item', settings)}>
						${item.image ? `
							<img 
								src="${item.image}" 
								alt="${item.name}"
								${getStyle('cc-comparison-item-image', settings)}
								loading="lazy"
							>
						` : ''}
						<div ${getStyle('cc-comparison-item-info', settings)}>
							<div ${getStyle('cc-comparison-item-name', settings)}>${item.name}</div>
							${item.price ? `<div ${getStyle('cc-comparison-item-price', settings)}>${item.price}</div>` : ''}
						</div>
					</div>
				`).join('')}
			</div>
		`;
	}

	getWinnerIcon(winner, itemKey) {
		if (winner === itemKey) {
			return '<span class="material-icons cc-comparison-winner">check_circle</span>';
		}
		return '';
	}

	renderComparisonTable(items, criteria, settings) {
		if (!items?.length || !criteria?.length) return '';
		
		return `
			<div ${getStyle('cc-comparison-table', settings)}>
				<table ${getStyle('cc-comparison-table-element', settings)}>
					<thead>
						<tr ${getStyle('cc-comparison-header-row', settings)}>
							<th ${getStyle('cc-comparison-feature-header', settings)}>Feature</th>
							${items.map(item => `
								<th ${getStyle('cc-comparison-item-header', settings)}>${item.name}</th>
							`).join('')}
						</tr>
					</thead>
					<tbody>
						${criteria.map(criterion => `
							<tr ${getStyle('cc-comparison-row', settings)}>
								<td ${getStyle('cc-comparison-feature', settings)}>
									${criterion.feature}
									${criterion.winner ? this.getWinnerIcon(criterion.winner, 'feature') : ''}
								</td>
								${items.map((item, index) => {
									const itemKey = Object.keys(criterion).find(key => 
										key !== 'feature' && key !== 'winner' && 
										key.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
									);
									const value = criterion[itemKey] || criterion[`item${index + 1}`] || '-';
									const isWinner = criterion.winner === itemKey || criterion.winner === `item${index + 1}`;
									
									return `
										<td ${getStyle('cc-comparison-value', settings)} ${isWinner ? getStyle('cc-comparison-winner-cell', settings) : ''}>
											${value}
											${isWinner ? this.getWinnerIcon(criterion.winner, itemKey) : ''}
										</td>
									`;
								}).join('')}
							</tr>
						`).join('')}
					</tbody>
				</table>
			</div>
		`;
	}

	renderRecommendation(comparison, settings) {
		const { recommendation, summary } = comparison;
		if (!recommendation && !summary) return '';
		
		const recommendedItem = comparison.items?.find((item, index) => {
			const itemKey = Object.keys(comparison).find(key => 
				key.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
			) || `item${index + 1}`;
			return recommendation === itemKey || recommendation === item.name.toLowerCase();
		});
		
		return `
			<div ${getStyle('cc-comparison-recommendation', settings)}>
				<h4 ${getStyle('cc-comparison-recommendation-title', settings)}>
					<span class="material-icons">thumb_up</span>
					Our Recommendation
				</h4>
				${recommendedItem ? `
					<div ${getStyle('cc-comparison-recommended-item', settings)}>
						<strong>${recommendedItem.name}</strong>
					</div>
				` : ''}
				${summary ? `
					<p ${getStyle('cc-comparison-recommendation-text', settings)}>${summary}</p>
				` : ''}
			</div>
		`;
	}

	renderProsCons(items, criteria, settings) {
		// Generate pros/cons based on winning criteria for each item
		if (!items?.length || !criteria?.length) return '';
		
		const prosConsData = items.map((item, itemIndex) => {
			const itemKey = Object.keys(criteria[0]).find(key => 
				key !== 'feature' && key !== 'winner' && 
				key.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
			) || `item${itemIndex + 1}`;
			
			const pros = criteria.filter(c => c.winner === itemKey).map(c => c.feature);
			const cons = criteria.filter(c => c.winner && c.winner !== itemKey).map(c => c.feature);
			
			return { item, pros: pros.slice(0, 3), cons: cons.slice(0, 3) }; // Limit to 3 each
		});
		
		if (prosConsData.every(data => !data.pros.length && !data.cons.length)) return '';
		
		return `
			<div ${getStyle('cc-comparison-pros-cons', settings)}>
				<h4 ${getStyle('cc-comparison-pros-cons-title', settings)}>Pros & Cons</h4>
				<div ${getStyle('cc-comparison-pros-cons-grid', settings)}>
					${prosConsData.map(({ item, pros, cons }) => `
						<div ${getStyle('cc-comparison-item-pros-cons', settings)}>
							<h5 ${getStyle('cc-comparison-item-title', settings)}>${item.name}</h5>
							${pros.length ? `
								<div ${getStyle('cc-comparison-pros', settings)}>
									<strong>Pros:</strong>
									<ul>
										${pros.map(pro => `<li><span class="material-icons">add</span>${pro}</li>`).join('')}
									</ul>
								</div>
							` : ''}
							${cons.length ? `
								<div ${getStyle('cc-comparison-cons', settings)}>
									<strong>Cons:</strong>
									<ul>
										${cons.map(con => `<li><span class="material-icons">remove</span>${con}</li>`).join('')}
									</ul>
								</div>
							` : ''}
						</div>
					`).join('')}
				</div>
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('Table');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { comparison: comparisonData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderComparisonItems(comparisonData.items, settings)}
				${this.renderComparisonTable(comparisonData.items, comparisonData.criteria, settings)}
				${this.renderRecommendation(comparisonData, settings)}
				${this.renderProsCons(comparisonData.items, comparisonData.criteria, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('comparison-card', ComparisonCard);
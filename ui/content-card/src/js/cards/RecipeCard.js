import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderAuthors, renderEngagement, renderLinks, renderMedia, renderTags } from '../base/utils.js';

export class RecipeCard extends BaseCard {
	constructor() {
		super();
	}

	render() {
		const renderContext = this._setSchema('Recipe');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { recipe: recipeData = {} } = this.data;
		const rating = this.data.engagement?.reactions?.[0]; // First reaction is "like" for rating

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.category && useSchema ? `<meta itemprop="recipeCategory" content="${content.category}">` : ''}
				${content.readingTime && useSchema ? `<meta itemprop="totalTime" content="${content.readingTime}">` : ''}
				${recipeData.prepTime && useSchema ? `<meta itemprop="prepTime" content="${recipeData.prepTime}">` : ''}
				${recipeData.cookTime && useSchema ? `<meta itemprop="cookTime" content="${recipeData.cookTime}">` : ''}
				${recipeData.servings && useSchema ? `<meta itemprop="recipeYield" content="${recipeData.servings}">` : ''}
				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				
				${this.data.authors?.length ? renderAuthors(this.data.authors, useSchema, settings) : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${content.readingTime ? `<div ${getStyle('cc-recipe-meta', settings)}>${content.readingTime}</div>` : ''}
				
				${Array.isArray(content.text) ? `
					<details ${getStyle('cc-recipe-ingredients', settings)}>
						<summary>Ingredients</summary>
						<ul ${useSchema ? 'itemprop="recipeIngredient"' : ''}>
							${content.text.map(ingredient => `<li>${ingredient.headline || ingredient.text || ingredient}</li>`).join('')}
						</ul>
					</details>
				` : (content.text ? `<div ${getStyle('cc-text', settings)}>${content.text}</div>` : '')}
				
				${recipeData.instructions ? `
					<div ${getStyle('cc-recipe-instructions', settings)}>
						<h3>Instructions</h3>
						${Array.isArray(recipeData.instructions) ? `
							<ol ${useSchema ? 'itemprop="recipeInstructions" itemscope itemtype="https://schema.org/ItemList"' : ''}>
								${recipeData.instructions.map((instruction, index) => `
									<li ${useSchema ? 'itemprop="itemListElement" itemscope itemtype="https://schema.org/HowToStep"' : ''}>
										${useSchema ? `<meta itemprop="position" content="${index + 1}">` : ''}
										<span ${useSchema ? 'itemprop="text"' : ''}>${instruction}</span>
									</li>
								`).join('')}
							</ol>
						` : `
							<div ${useSchema ? 'itemprop="recipeInstructions"' : ''}>
								<p>${recipeData.instructions}</p>
							</div>
						`}
					</div>
				` : ''}
				
				${rating && rating.count && useSchema ? `
					<div ${getStyle('cc-recipe-rating', settings)} itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
						<meta itemprop="ratingValue" content="${rating.value || 1}">
						<meta itemprop="ratingCount" content="${rating.count || 0}">
						<meta itemprop="bestRating" content="${rating.max || 5}">
						<meta itemprop="worstRating" content="${rating.min || 0}">
					</div>
				` : ''}
				
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('recipe-card', RecipeCard);
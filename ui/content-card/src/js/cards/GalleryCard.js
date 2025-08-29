import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderEngagement, renderLinks, renderMedia } from '../base/utils.js';

export class GalleryCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-gallery');
	}

	renderGalleryInfo(galleryData, settings) {
		const info = [];
		
		if (galleryData.totalCount) {
			info.push(`
				<div ${getStyle('cc-gallery-info-item', settings)}>
					<span class="material-icons">photo_library</span>
					<span>${galleryData.totalCount} items</span>
				</div>
			`);
		}
		
		if (galleryData.albumName) {
			info.push(`
				<div ${getStyle('cc-gallery-info-item', settings)}>
					<span class="material-icons">collections</span>
					<span>${galleryData.albumName}</span>
				</div>
			`);
		}
		
		if (!info.length) return '';
		
		return `
			<div ${getStyle('cc-gallery-info', settings)}>
				${info.join('')}
			</div>
		`;
	}

	renderCategories(categories, settings) {
		if (!categories?.length) return '';
		
		return `
			<div ${getStyle('cc-gallery-categories', settings)}>
				<h4 ${getStyle('cc-gallery-categories-title', settings)}>Categories</h4>
				<div ${getStyle('cc-gallery-categories-list', settings)}>
					${categories.map(category => `
						<span ${getStyle('cc-gallery-category', settings)}>${category}</span>
					`).join('')}
				</div>
			</div>
		`;
	}

	renderDownloadOptions(downloadOptions, settings) {
		if (!downloadOptions?.length) return '';
		
		return `
			<div ${getStyle('cc-gallery-download', settings)}>
				<h4 ${getStyle('cc-gallery-download-title', settings)}>Download Options</h4>
				<div ${getStyle('cc-gallery-download-options', settings)}>
					${downloadOptions.map(option => `
						<button type="button" ${getStyle('cc-gallery-download-option', settings)}>
							<span class="material-icons">download</span>
							<span>${option}</span>
						</button>
					`).join('')}
				</div>
			</div>
		`;
	}

	renderSlideshowToggle(slideshowEnabled, settings) {
		if (!slideshowEnabled) return '';
		
		return `
			<div ${getStyle('cc-gallery-slideshow', settings)}>
				<button type="button" ${getStyle('cc-gallery-slideshow-btn', settings)}>
					<span class="material-icons">slideshow</span>
					<span>Start Slideshow</span>
				</button>
			</div>
		`;
	}

	renderFeaturedMedia(featuredMedia, useSchema, settings) {
		if (!featuredMedia) return '';
		
		return `
			<div ${getStyle('cc-gallery-featured', settings)}>
				<img 
					src="${featuredMedia}" 
					alt="Featured gallery image"
					${getStyle('cc-gallery-featured-image', settings)}
					${useSchema ? 'itemprop="primaryImageOfPage"' : ''}
					loading="lazy"
				>
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('MediaGallery');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { gallery: galleryData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderGalleryInfo(galleryData, settings)}
				
				${galleryData.featuredMedia && !this.data.media ? this.renderFeaturedMedia(galleryData.featuredMedia, useSchema, settings) : ''}
				
				${this.renderCategories(galleryData.categories, settings)}
				${this.renderSlideshowToggle(galleryData.slideshowEnabled, settings)}
				${this.renderDownloadOptions(galleryData.downloadOptions, settings)}
				
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('gallery-card', GalleryCard);
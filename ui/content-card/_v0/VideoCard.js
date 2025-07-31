import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderHeader, renderLinks, renderMedia } from '../base/utils.js';

export class VideoCard extends BaseCard {
	constructor() {
		super();
	}

	// Check if this should fallback to ArticleCard behavior
	shouldFallbackToArticle() {
		if (!this.data?.media?.sources) return false;
		
		// Find YouTube sources without playsinline
		const youtubeSource = this.data.media.sources.find(source => source.type === 'youtube');
		return youtubeSource && !youtubeSource.playsinline;
	}

	renderYouTubeInline(source) {
		if (!source?.src) return '';
		
		let videoId;
		try {
			const url = new URL(source.src);
			if (url.hostname === 'youtu.be') {
				videoId = url.pathname.slice(1);
			} else if (url.hostname.includes('youtube.com')) {
				videoId = url.searchParams.get('v');
			}
		} catch (e) {
			// Fallback for malformed URLs
			const parts = source.src.split('v=');
			if (parts.length > 1) {
				videoId = parts[1].split('&')[0];
			} else {
				const pathParts = source.src.split('/');
				videoId = pathParts.pop().split('?')[0];
			}
		}

		if (!videoId) return '';

		return `
			<iframe ${getStyle('cc-media-video', this.settings)}
				src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
				title="${source.alt || 'YouTube video player'}">
			</iframe>
		`;
	}

	renderVideoMedia() {
		if (!this.data?.media?.sources) return '';
		
		const settings = this.settings;
		const youtubeSource = this.data.media.sources.find(source => source.type === 'youtube');
		
		// If YouTube with playsinline, render iframe
		if (youtubeSource && youtubeSource.playsinline) {
			return `
				<figure ${getStyle('cc-media', settings)}>
					${this.renderYouTubeInline(youtubeSource)}
				</figure>
			`;
		}
		
		// Otherwise use standard media rendering
		return renderMedia(this.data.media, this.data.ribbon, this.data.sticker, this.settings.useSchema, settings);
	}

	render() {
		if (!this.data) return '';
		
		// Fallback to ArticleCard behavior for YouTube without playsinline
		if (this.shouldFallbackToArticle()) {
			return this.renderAsArticle();
		}
		
		const settings = this.settings;
		const { content = {} } = this.data;
		const headlineTag = content.headlineTag || 'h2';

		return `
			${this.renderVideoMedia()}
			<div ${getStyle('cc-content', settings)}>
				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)}>${content.headline}</${headlineTag}>` : ''}
				${content.summary ? `<p ${getStyle('cc-summary', settings)}>${content.summary}</p>` : ''}
				${renderLinks(this.data.links, settings)}
				${renderActions(this.data.actions, settings)}
			</div>
		`;
	}

	// Fallback to ArticleCard-like behavior
	renderAsArticle() {
		const settings = this.settings;
		const useSchema = settings.useSchema;
		const { content = {} } = this.data;
		const headlineTag = content.headlineTag || 'h2';

		return `
			${renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings)}
			<div ${getStyle('cc-content', settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/VideoObject"' : ''}>
				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				${renderLinks(this.data.links, settings)}
				${renderActions(this.data.actions, settings)}
			</div>
		`;
	}
}

customElements.define('video-card', VideoCard);
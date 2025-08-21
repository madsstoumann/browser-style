import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class SocialCard extends BaseCard {
	constructor() {
		super();
	}

	getPlatformIcon(platform) {
		const platformIcons = {
			'Twitter': 'alternate_email',
			'LinkedIn': 'work',
			'Facebook': 'facebook',
			'Instagram': 'photo_camera',
			'YouTube': 'play_circle',
			'TikTok': 'movie'
		};
		return platformIcons[platform] || 'share';
	}

	renderSocialMeta(socialData, useSchema, settings) {
		const meta = [];
		
		if (socialData.platform) {
			const icon = this.getPlatformIcon(socialData.platform);
			meta.push(`
				<div ${getStyle('cc-social-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="publisher" itemscope itemtype="https://schema.org/Organization"' : ''}>
						<span ${useSchema ? 'itemprop="name"' : ''}>${socialData.platform}</span>
					</span>
				</div>
			`);
		}
		
		if (socialData.author) {
			meta.push(`
				<div ${getStyle('cc-social-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="author" itemscope itemtype="https://schema.org/Person"' : ''}>
						<span ${useSchema ? 'itemprop="name"' : ''}>${socialData.author}</span>
					</span>
				</div>
			`);
		}
		
		if (!meta.length) return '';
		
		return `
			<div ${getStyle('cc-social-meta', settings)}>
				${meta.join('')}
			</div>
		`;
	}

	renderEngagementMetrics(engagement, settings) {
		if (!engagement) return '';
		
		const metrics = [];
		
		if (engagement.likes) {
			metrics.push(`
				<div ${getStyle('cc-social-metric', settings)}>
					<span>${engagement.likes.toLocaleString()}</span>
				</div>
			`);
		}
		
		if (engagement.shares) {
			metrics.push(`
				<div ${getStyle('cc-social-metric', settings)}>
					<span>${engagement.shares.toLocaleString()}</span>
				</div>
			`);
		}
		
		if (engagement.comments) {
			metrics.push(`
				<div ${getStyle('cc-social-metric', settings)}>
					<span>${engagement.comments.toLocaleString()}</span>
				</div>
			`);
		}
		
		if (!metrics.length) return '';
		
		return `
			<div ${getStyle('cc-social-engagement', settings)}>
				${metrics.join('')}
			</div>
		`;
	}

	renderHashtags(hashtags, settings) {
		if (!hashtags?.length) return '';
		
		return `
			<div ${getStyle('cc-social-hashtags', settings)}>
				${hashtags.map(hashtag => `
					<span ${getStyle('cc-social-hashtag', settings)}>${hashtag}</span>
				`).join('')}
			</div>
		`;
	}

	renderMediaAttachments(mediaAttachments, settings) {
		if (!mediaAttachments?.length) return '';
		
		return `
			<div ${getStyle('cc-social-attachments', settings)}>
				${mediaAttachments.map(media => `
					<img 
						src="${media}" 
						alt="Social media attachment"
						${getStyle('cc-social-attachment', settings)}
						loading="lazy"
					>
				`).join('')}
			</div>
		`;
	}

	renderPostContent(socialData, useSchema, settings) {
		if (!socialData.postContent) return '';
		
		// Simple hashtag and mention parsing for display
		let content = socialData.postContent;
		
		// Make hashtags clickable (for display purposes)
		content = content.replace(/#(\w+)/g, '<span class="cc-social-hashtag">#$1</span>');
		
		// Make mentions clickable (for display purposes)  
		content = content.replace(/@(\w+)/g, '<span class="cc-social-mention">@$1</span>');
		
		return `
			<div ${getStyle('cc-social-content', settings)} ${useSchema ? 'itemprop="text"' : ''}>
				${content}
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('SocialMediaPosting');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { social: socialData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.published?.datetime && useSchema ? `<meta itemprop="datePublished" content="${content.published.datetime}">` : ''}
				
				${this.renderSocialMeta(socialData, useSchema, settings)}
				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="headline"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${this.renderPostContent(socialData, useSchema, settings)}
				
				${content.summary && content.summary !== socialData.postContent ? `
					<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="abstract"' : ''}>${content.summary}</p>
				` : ''}
				
				${this.renderMediaAttachments(socialData.mediaAttachments, settings)}
				${this.renderHashtags(socialData.hashtags, settings)}
				${this.renderEngagementMetrics(socialData.engagement, settings)}
				
				${content.published?.formatted ? `
					<div ${getStyle('cc-social-timestamp', settings)}>
						<time>${content.published.formatted}</time>
					</div>
				` : ''}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('social-card', SocialCard);
import { ICONS } from '../icons.js';
import { getSrcset } from '../../layout/index.js';

// Helper function to clean up template whitespace
export function cleanHTML(html) {
	return html.replace(/>\s+</g, '><').replace(/^\s+|\s+$/g, '');
}

// Helper function for getting CSS styles
export function getStyle(componentName, settings = {}) {
	const styles = settings?.styles || {};
	const styleOverride = styles[componentName];

	if (styleOverride) {
		if (Array.isArray(styleOverride)) {
			return `class="${styleOverride.join(' ')}"`;
		} else if (typeof styleOverride === 'string') {
			return `class="${styleOverride}"`;
		} else if (typeof styleOverride === 'object') {
			const classes = styleOverride.class || '';
			const inlineStyle = styleOverride.style || '';
			return `class="${classes}" style="${inlineStyle}"`;
		}
	}

	return `class="${componentName}"`;
}

export function renderSVG(name) {
	if (!name || !ICONS[name]) return '';
	return `<svg viewBox="0 -960 960 960" width="24" height="24"><path d="${ICONS[name]}"></path></svg>`;
}

export function renderImage(image, useSchema = false, settings = {}) {
	if (!image?.src) return '';
	const schemaAttr = useSchema ? 'itemprop="image"' : '';
	
	// Generate responsive srcset and sizes
	const { srcset, sizes } = _generateResponsiveSrcset(image.src);
	
	return `<img 
		${getStyle('cc-media-image', settings)} 
		src="${image.src}" 
		${srcset ? `srcset="${srcset}"` : ''}
		${sizes ? `sizes="${sizes}"` : ''}
		alt="${image.alt || ''}" 
		decoding="${image.decoding || 'async'}"
		${image.width ? `width="${image.width}"` : ''}
		${image.height ? `height="${image.height}"` : ''}
		loading="${image.loading ? image.loading : 'lazy'}"
		${schemaAttr}
	>`;
}

export function renderYouTube(video, settings = {}) {
	if (!video?.src) return '';
	let videoId;
	try {
		const url = new URL(video.src);
		if (url.hostname === 'youtu.be') {
			videoId = url.pathname.slice(1);
		} else if (url.hostname.includes('youtube.com')) {
			videoId = url.searchParams.get('v');
		}
	} catch (e) {
		// fallback for malformed urls
	}

	if (!videoId) {
		// Fallback for simple cases if URL parsing fails
		const parts = video.src.split('v=');
		if (parts.length > 1) {
			videoId = parts[1].split('&')[0];
		} else {
			const pathParts = video.src.split('/');
			videoId = pathParts.pop().split('?')[0];
		}
	}

	// If playsinline is true, render iframe instead of thumbnail
	if (video.playsinline) {
		return `<iframe 
			${getStyle('cc-media-video', settings)}
			src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
			title="${video.alt || 'YouTube video player'}">
		</iframe>`;
	}

	// Default: render thumbnail image
	return `<img 
		${getStyle('cc-media-image', settings)}
		decoding="async"
		loading="lazy"
		src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" 
		alt="${video.alt || 'YouTube video player'}"
		data-video-id="${videoId}"
	>`;
}

export function renderVideo(video, settings = {}) {
	if (!video?.src) return '';
	const opts = video.options || {};
	return `<video ${getStyle('cc-media-video', settings)} src="${video.src}"
		${opts.autoplay ? `autoplay playsinline` : ''}
		${opts.controls !== false ? `controls` : ''}
		${opts.muted ? `muted` : ''}
		${opts.loop ? `loop` : ''}
		${video.poster ? `poster="${video.poster}"` : ''}
		${video.width ? `width="${video.width}"` : ''}
		${video.height ? `height="${video.height}"` : ''}
		${video.crossorigin ? `crossorigin="${video.crossorigin}"` : ''}
		preload="${opts.preload || 'metadata'}"></video>`;
}

export function renderRibbon(ribbon, settings = {}) {
	if (!ribbon?.text) return '';
	const styleAttr = ribbon.color ? `style="background-color: ${ribbon.color};"` : '';
	const styleClass = ribbon.style ? ` cc-ribbon--${ribbon.style}` : '';
	const baseStyle = getStyle('cc-ribbon', settings).slice(0, -1); // remove closing quote

	return `<div ${baseStyle}${styleClass}" role="status" ${styleAttr}>
		${ribbon.icon ? renderSVG(ribbon.icon) : ''}
		${ribbon.text}
	</div>`;
}

export function renderSticker(sticker, settings = {}) {
	if (!sticker?.text) return '';
	return `<span ${getStyle('cc-sticker', settings)} role="status">${sticker.text}</span>`;
}

export function renderMedia(media, ribbon, sticker, useSchema = false, settings = {}) {
	if (!media?.sources?.length) return '';
	return cleanHTML(`
	<figure ${getStyle('cc-media', settings)}>
		${media.sources
			.map((entry) => {
				if (entry.type === 'image') return renderImage(entry, useSchema, settings)
				if (entry.type === 'video') return renderVideo(entry, settings)
				if (entry.type === 'youtube') return renderYouTube(entry, settings)
			})
			.join('')}
		${renderRibbon(ribbon, settings)}
		${renderSticker(sticker, settings)}
		${media.caption ? `<figcaption ${getStyle('cc-media-caption', settings)}>${media.caption}</figcaption>`: ''}
	</figure>`)
}

export function renderActions(actions, settings = {}) {
	if (!actions?.length) return '';
	
	const renderBtn = (action) => {
		// Generate unique ID for popover if needed
		const popoverId = action.popover ? `popover-${Math.random().toString(36).slice(2)}` : '';
		const popoverAttrs = action.popover ? `popovertarget="${popoverId}" popovertargetaction="show"` : '';
		
		return {
			button: `<button type="button" ${getStyle('cc-action', settings)} ${(action.icon ? `aria-label="${action.text}"` : (action.ariaLabel ? `aria-label="${action.ariaLabel}"` : ''))} ${popoverAttrs}>
				${action.icon ? renderSVG(action.icon) : ''} ${action.text}
			</button>`,
			popover: action.popover ? `
				<div id="${popoverId}" popover="${action.popover.type || 'auto'}" ${getStyle('cc-popover', settings)}>
					<button ${getStyle('cc-popover-close', settings)} popovertarget="${popoverId}" popovertargetaction="hide">✕</button>
					${action.popover.video ? renderPopoverVideo(action.popover.video, settings) : `<div ${getStyle('cc-popover-content', settings)}>${action.popover.content || ''}</div>`}
				</div>
			` : ''
		};
	};
	
	const rendered = actions.map(action => renderBtn(action));
	const buttons = rendered.map(r => r.button).join('');
	const popovers = rendered.map(r => r.popover).filter(p => p).join('');
	
	return `
		<nav ${getStyle('cc-actions', settings)}>${buttons}</nav>
		${popovers}
	`;
}

function renderPopoverVideo(video, settings = {}) {
	if (!video?.src) return '';
	const opts = video.options || {};
	return `
		<video ${getStyle('cc-popover-video', settings)} 
			src="${video.src}"
			${opts.controls ? 'controls' : ''}
			${opts.muted ? 'muted' : ''}
			${opts.autoplay ? 'autoplay' : ''}
			${opts.playsinline ? 'playsinline' : ''}
			${opts.loop ? 'loop' : ''}
			${video.poster ? `poster="${video.poster}"` : ''}
			preload="${opts.preload || 'metadata'}">
		</video>
	`;
}

export function renderTags(tags, settings = {}) {
	if (!tags?.length) return '';
	
	const renderTag = (tag) => {
		// Handle both string tags and object tags with links
		if (typeof tag === 'string') {
			return `<span ${getStyle('cc-tag', settings)}>${tag}</span>`;
		} else if (tag && tag.name) {
			// Tag object with optional URL
			if (tag.url) {
				return `<a href="${tag.url}" ${getStyle('cc-tag', settings)} class="cc-tag-link">${tag.name}</a>`;
			} else {
				return `<span ${getStyle('cc-tag', settings)}>${tag.name}</span>`;
			}
		}
		return '';
	};
	
	return `
		<div ${getStyle('cc-tags', settings)}>
			${tags.map(tag => renderTag(tag)).join('')}
		</div>
	`;
}

export function renderAuthors(authors, includeSchema = false, settings = {}) {
	if (!authors?.length) return '';
	return `
		<div ${getStyle('cc-authors', settings)}>
			${authors.map(author => {
				const avatar = author.avatar;
				const avatarImg = avatar ?
					`<img src="${avatar.src}" 
						alt="${avatar.alt || author.name}" 
						${avatar.width !== undefined ? `width="${avatar.width}"` : ''} 
						${avatar.height !== undefined ? `height="${avatar.height}"` : ''} 
						${includeSchema ? 'itemprop="image"' : ''}
						${getStyle('cc-avatar', settings)}>`
					: '';

				return `<address ${getStyle('cc-author', settings)} ${includeSchema ? 'itemprop="author" itemscope itemtype="https://schema.org/Person"' : ''}>
					${avatarImg}
					<div ${getStyle('cc-author-details', settings)}>
						<strong ${getStyle('cc-author-name', settings)} ${includeSchema ? 'itemprop="name"' : ''}>${author.name}</strong>
						${author.role ? `<small ${getStyle('cc-author-role', settings)} ${includeSchema ? 'itemprop="jobTitle"' : ''}>${author.role}</small>` : ''}
					</div>
				</address>`;
			}).join('')}
		</div>
	`;
}

export function renderEngagement(engagement, useSchema = false, settings = {}) {
	if (!engagement) return '';
	
	const metrics = [];
	const schemaCounters = [];
	
	// View count
	if (engagement.viewCount) {
		metrics.push(`<span ${getStyle('cc-metric', settings)}>${engagement.viewCount.toLocaleString()} views</span>`);
		if (useSchema) {
			schemaCounters.push(`
				<div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
					<meta itemprop="interactionType" content="https://schema.org/WatchAction">
					<meta itemprop="userInteractionCount" content="${engagement.viewCount}">
				</div>
			`);
		}
	}
	
	// Like count (also check reactions for backward compatibility)
	const likeCount = engagement.likeCount || 
		(engagement.reactions && engagement.reactions.find(r => r.type === 'like')?.count);
	if (likeCount) {
		metrics.push(`<span ${getStyle('cc-metric', settings)}>${likeCount.toLocaleString()} likes</span>`);
		if (useSchema) {
			schemaCounters.push(`
				<div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
					<meta itemprop="interactionType" content="https://schema.org/LikeAction">
					<meta itemprop="userInteractionCount" content="${likeCount}">
				</div>
			`);
		}
	}
	
	// Share count
	if (engagement.shareCount) {
		metrics.push(`<span ${getStyle('cc-metric', settings)}>${engagement.shareCount.toLocaleString()} shares</span>`);
		if (useSchema) {
			schemaCounters.push(`
				<div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
					<meta itemprop="interactionType" content="https://schema.org/ShareAction">
					<meta itemprop="userInteractionCount" content="${engagement.shareCount}">
				</div>
			`);
		}
	}
	
	// Comment count
	if (engagement.commentCount) {
		metrics.push(`<span ${getStyle('cc-metric', settings)}>${engagement.commentCount.toLocaleString()} comments</span>`);
		if (useSchema) {
			schemaCounters.push(`
				<div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
					<meta itemprop="interactionType" content="https://schema.org/CommentAction">
					<meta itemprop="userInteractionCount" content="${engagement.commentCount}">
				</div>
			`);
		}
	}
	
	if (!metrics.length) return '';
	
	return `
		<div ${getStyle('cc-engagement', settings)}>
			${metrics.join('')}
			${useSchema ? schemaCounters.join('') : ''}
		</div>
	`;
}

export function renderHeader(content, settings = {}) {
	if (!content) return '';
	const hasPublished = content.published && (content.published.datetime || content.published.formatted);
	const hasModified = content.modified && (content.modified.datetime || content.modified.formatted);
	const hasReadingTime = content.readingTime;
	const hasCategory = content.category;

	if (!hasCategory && !hasPublished && !hasReadingTime && !hasModified) return '';

	return `
		<header ${getStyle('cc-header', settings)}>
			${hasCategory ? `<span ${getStyle('cc-category', settings)}>${content.category}</span>` : ''}
			${hasPublished ? `<time ${getStyle('cc-published', settings)} datetime="${content.published.datetime}">${content.published.formatted || content.published.relative}</time>` : ''}
		   ${hasModified ? `<small ${getStyle('cc-modified', settings)}><time datetime="${content.modified.datetime}">${content.modified.formatted || content.modified.relative}</time></small>` : ''}
			${hasReadingTime ? `<small ${getStyle('cc-reading-time', settings)}>${content.readingTime}</small>` : ''}
		</header>
	`;
}

export function renderLinks(links, settings = {}, actions = null) {
	if (!links?.length) return '';
	
	const renderLink = (link) => {
		const isOnlyLink = links.length === 1 && (!actions || actions.length === 0);
		
		let style = getStyle('cc-link', settings);
		if (isOnlyLink) {
			style = style.slice(0, -1) + ' cc-wrapper"';
		}
		if (isOnlyLink && link.hideText) {
			style = style.slice(0, -1) + ' cc-hidetext"';
		}
		
		return `<a href="${link.url}" ${style} ${(link.icon ? `aria-label="${link.text}"` : (link.ariaLabel ? `aria-label="${link.ariaLabel}"` : ''))}>
			${link.icon ? `${renderSVG(link.icon)} <span class="cc-link-text">${link.hideText ? '' : link.text}</span>` : link.text}
		</a>`;
	};
	
	return `<nav ${getStyle('cc-links', settings)}>${links.map(link => renderLink(link)).join('')}</nav>`;
}

// Private helper function for responsive srcset generation
function _generateResponsiveSrcset(imageSrc) {
	try {
		// This would need to be implemented based on your specific srcset generation logic
		// For now, returning basic fallback
		return {
			srcset: null,
			sizes: '100vw'
		};
	} catch (error) {
		return { srcset: null, sizes: null };
	}
}
import { ICONS } from './icons.js';

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

export function renderImage(image, useSchema = false, settings = {}, element = null) {
	if (!image?.src) return '';
	const schemaAttr = useSchema ? 'itemprop="image"' : '';
	
	// Generate responsive srcset and sizes with aspect ratio calculation
	const { srcset, sizes } = _generateResponsiveSrcset(image.src, element, settings);
	
	return `<img 
		${getStyle('cc-media-image', settings)} 
		src="${image.src}" 
		${srcset ? `srcset="${srcset}"` : ''}
		${sizes ? `sizes="${sizes}"` : ''}
		alt="${image.alt || ''}" 
		decoding="${image.decoding || 'async'}"
		${image.width ? `width="${image.width}"` : ''}
		${image.height ? `height="${image.height}"` : ''}
		${image.fetchpriority ? `fetchpriority="${image.fetchpriority}"` : ''}
		loading="${image.loading ? image.loading : 'lazy'}"
		${schemaAttr}
	>`;
}

// Helper function to detect YouTube URLs
export function isYouTubeUrl(url) {
	if (!url) return false;
	try {
		const urlObj = new URL(url);
		return urlObj.hostname === 'youtu.be' || urlObj.hostname.includes('youtube.com');
	} catch (e) {
		return url.includes('youtube.com') || url.includes('youtu.be');
	}
}

// Helper function to extract YouTube video ID
export function extractYouTubeId(url) {
	if (!url) return null;
	let videoId;
	try {
		const urlObj = new URL(url);
		if (urlObj.hostname === 'youtu.be') {
			videoId = urlObj.pathname.slice(1);
		} else if (urlObj.hostname.includes('youtube.com')) {
			videoId = urlObj.searchParams.get('v');
		}
	} catch (e) {
		// fallback for malformed urls
	}

	if (!videoId) {
		// Fallback for simple cases if URL parsing fails
		const parts = url.split('v=');
		if (parts.length > 1) {
			videoId = parts[1].split('&')[0];
		} else {
			const pathParts = url.split('/');
			videoId = pathParts.pop().split('?')[0];
		}
	}

	return videoId;
}

export function renderYouTube(video, useSchema = false, settings = {}) {
	if (!video?.src) return '';
	const videoId = extractYouTubeId(video.src);
	if (!videoId) return '';

	// If playsinline is true, render iframe instead of thumbnail (with schema if enabled)
	if (video.playsinline) {
		const schemaAttrs = useSchema ? 'itemscope itemtype="https://schema.org/VideoObject"' : '';
		const nameAttr = useSchema && video.alt ? `<meta itemprop="name" content="${video.alt}">` : '';
		const embedUrlAttr = useSchema ? `<meta itemprop="embedUrl" content="https://www.youtube.com/embed/${videoId}">` : '';
		const thumbnailUrlAttr = useSchema ? `<meta itemprop="thumbnailUrl" content="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg">` : '';
		const uploadDateAttr = useSchema && video.uploadDate ? `<meta itemprop="uploadDate" content="${video.uploadDate}">` : '';

		return `<div ${schemaAttrs}>
			${nameAttr}
			${embedUrlAttr}
			${thumbnailUrlAttr}
			${uploadDateAttr}
			<iframe 
				${getStyle('cc-media-video', settings)}
				src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
				title="${video.alt || 'YouTube video player'}">
			</iframe>
		</div>`;
	}

	// Default: render thumbnail image (NO schema - this is just a link/image, not a video object)
	return `<img 
		${getStyle('cc-media-image', settings)}
		decoding="async"
		loading="lazy"
		src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" 
		alt="${video.alt || 'YouTube video player'}"
		data-video-id="${videoId}"
	>`;
}

export function renderVideo(video, useSchema = false, settings = {}) {
	if (!video?.src) return '';
	const opts = video.options || {};
	const schemaAttrs = useSchema ? 'itemscope itemtype="https://schema.org/VideoObject"' : '';
	const contentUrlAttr = useSchema ? 'itemprop="contentUrl"' : '';
	const nameAttr = useSchema && video.name ? `<meta itemprop="name" content="${video.name}">` : '';
	const descriptionAttr = useSchema && video.description ? `<meta itemprop="description" content="${video.description}">` : '';
	const durationAttr = useSchema && video.duration ? `<meta itemprop="duration" content="${video.duration}">` : '';
	const uploadDateAttr = useSchema && video.uploadDate ? `<meta itemprop="uploadDate" content="${video.uploadDate}">` : '';
	const thumbnailUrlAttr = useSchema && video.poster ? `<meta itemprop="thumbnailUrl" content="${video.poster}">` : '';
	
	return `<div ${schemaAttrs}>
		${nameAttr}
		${descriptionAttr}
		${durationAttr}
		${uploadDateAttr}
		${thumbnailUrlAttr}
		<video ${getStyle('cc-media-video', settings)} src="${video.src}" ${contentUrlAttr}
			${opts.autoplay ? `autoplay playsinline` : ''}
			${opts.controls !== false ? `controls` : ''}
			${opts.muted ? `muted` : ''}
			${opts.loop ? `loop` : ''}
			${video.poster ? `poster="${video.poster}"` : ''}
			${video.width ? `width="${video.width}"` : ''}
			${video.height ? `height="${video.height}"` : ''}
			${video.crossorigin ? `crossorigin="${video.crossorigin}"` : ''}
			preload="${opts.preload || 'metadata'}"></video>
	</div>`;
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

export function renderMedia(element, useSchema = false, settings = {}) {
	const { media, ribbon, sticker } = element.data || {};
	if (!media?.sources?.length) return '';
	return cleanHTML(`
	<figure ${getStyle('cc-media', settings)}>
		${media.sources
			.map((entry) => {
				if (entry.type === 'image') {
					// Get high priority layout positions from config
					const config = window._layoutSrcsetData?.config;
					const highPriorityPositions = config?.settings?.highPriority || [0, 1];
					
					// Optimize loading for images in high priority layout positions
					const layoutPosition = parseInt(element.getAttribute?.('data-position') || '-1');
					const optimizedEntry = highPriorityPositions.includes(layoutPosition) ? {
						...entry,
						loading: 'eager',
						fetchpriority: 'high'
					} : entry;
					return renderImage(optimizedEntry, useSchema, settings, element);
				}
				if (entry.type === 'video') return renderVideo(entry, useSchema, settings)
				if (entry.type === 'youtube') return renderYouTube(entry, useSchema, settings)
			})
			.join('')}
		${renderRibbon(ribbon, settings)}
		${renderSticker(sticker, settings)}
		${media.caption ? `<figcaption ${getStyle('cc-media-caption', settings)}>${media.caption}</figcaption>`: ''}
	</figure>`)
}

export function renderActions(actions, useSchema = false, settings = {}) {
	if (!actions?.length) return '';
	
	const renderBtn = (action) => {
		// Generate unique ID for popover if needed
		const popoverId = action.popover ? `popover-${Math.random().toString(36).slice(2)}` : '';
		const popoverAttrs = action.popover ? `popovertarget="${popoverId}" popovertargetaction="show"` : '';
		
		// Generate attributes string from action.attributes object
		const attributeString = action.attributes ? 
			Object.entries(action.attributes)
				.filter(([key, value]) => !useSchema || !key.startsWith('item') || useSchema) // Only include schema attrs if useSchema is true
				.map(([key, value]) => value === true ? key : `${key}="${value}"`)
				.join(' ') : '';
		
		// Fallback type if not specified in attributes
		const typeAttr = action.attributes?.type ? '' : 'type="button"';
		
		// Generate VoteAction meta tags if this is a VoteAction and useSchema is true
		const isVoteAction = useSchema && action.attributes?.itemtype === 'https://schema.org/VoteAction';
		const voteActionMeta = isVoteAction ? `
			${action.attributes['data-target'] ? `<meta itemprop="target" content="${action.attributes['data-target']}">` : ''}
			${action.attributes['data-object'] ? `<meta itemprop="object" content="${action.attributes['data-object']}">` : ''}
		`.trim() : '';
		
		return {
			button: `<button ${typeAttr} ${attributeString} ${getStyle('cc-action', settings)} ${(action.icon ? `aria-label="${action.text}"` : (action.ariaLabel ? `aria-label="${action.ariaLabel}"` : ''))} ${popoverAttrs}>
				${voteActionMeta}
				${action.icon ? renderSVG(action.icon) : ''} ${action.text}
			</button>`,
			popover: action.popover ? `
				<div id="${popoverId}" popover="${action.popover.type || 'auto'}" ${getStyle('cc-popover', settings)}>
					<button ${getStyle('cc-popover-close', settings)} popovertarget="${popoverId}" popovertargetaction="hide">✕</button>
					${action.popover.video ? renderPopoverVideo(action.popover.video, useSchema, settings) : `<div ${getStyle('cc-popover-content', settings)}>${action.popover.content || ''}</div>`}
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

function renderPopoverVideo(video, useSchema = false, settings = {}) {
	if (!video?.src) return '';
	const opts = video.options || {};
	
	// Check if this is a YouTube video
	if (video.type === 'youtube' || isYouTubeUrl(video.src)) {
		const videoId = extractYouTubeId(video.src);
		if (videoId) {
			const embedParams = new URLSearchParams();
			if (opts.autoplay) embedParams.append('autoplay', '1');
			if (opts.muted) embedParams.append('mute', '1');
			if (opts.controls !== false) embedParams.append('controls', '1');
			if (opts.playsinline) embedParams.append('playsinline', '1');
			
			const schemaAttrs = useSchema ? 'itemscope itemtype="https://schema.org/VideoObject"' : '';
			const nameAttr = useSchema && video.alt ? `<meta itemprop="name" content="${video.alt}">` : '';
			const embedUrlAttr = useSchema ? `<meta itemprop="embedUrl" content="https://www.youtube.com/embed/${videoId}">` : '';
			const thumbnailUrlAttr = useSchema ? `<meta itemprop="thumbnailUrl" content="${video.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}">` : '';
			const uploadDateAttr = useSchema && video.uploadDate ? `<meta itemprop="uploadDate" content="${video.uploadDate}">` : '';
			const descriptionAttr = useSchema && video.description ? `<meta itemprop="description" content="${video.description}">` : '';
			
			return `<div ${schemaAttrs}>
				${nameAttr}
				${embedUrlAttr}
				${thumbnailUrlAttr}
				${uploadDateAttr}
				${descriptionAttr}
				<iframe 
					${getStyle('cc-popover-youtube', settings)}
					data-src="https://www.youtube.com/embed/${videoId}?${embedParams.toString()}"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
					title="${video.alt || 'YouTube video player'}">
				</iframe>
			</div>`;
		}
	}
	
	// Regular video element
	const schemaAttrs = useSchema ? 'itemscope itemtype="https://schema.org/VideoObject"' : '';
	const contentUrlAttr = useSchema ? 'itemprop="contentUrl"' : '';
	const nameAttr = useSchema && video.name ? `<meta itemprop="name" content="${video.name}">` : '';
	const descriptionAttr = useSchema && video.description ? `<meta itemprop="description" content="${video.description}">` : '';
	const durationAttr = useSchema && video.duration ? `<meta itemprop="duration" content="${video.duration}">` : '';
	const uploadDateAttr = useSchema && video.uploadDate ? `<meta itemprop="uploadDate" content="${video.uploadDate}">` : '';
	const thumbnailUrlAttr = useSchema && (video.thumbnailUrl || video.poster) ? `<meta itemprop="thumbnailUrl" content="${video.thumbnailUrl || video.poster}">` : '';
	
	return `<div ${schemaAttrs}>
		${nameAttr}
		${descriptionAttr}
		${durationAttr}
		${uploadDateAttr}
		${thumbnailUrlAttr}
		<video ${getStyle('cc-popover-video', settings)} src="${video.src}" ${contentUrlAttr}
			${opts.controls ? 'controls' : ''}
			${opts.muted ? 'muted' : ''}
			${opts.playsinline ? 'playsinline' : ''}
			${opts.loop ? 'loop' : ''}
			${video.poster ? `poster="${video.poster}"` : ''}
			${opts.autoplay ? 'data-autoplay' : ''}
			${opts.resetOnClose ? 'data-reset' : ''}
			preload="${opts.preload || 'metadata'}">
		</video>
	</div>`;
}

export function initializePopoverToggleListeners(container = document) {
	container.querySelectorAll('[popover]').forEach(popover => {
		// Skip if listener already added
		if (popover.dataset.toggleListenerAdded) return;
		popover.dataset.toggleListenerAdded = 'true';
		
		popover.addEventListener('toggle', ({ newState }) => {
			if (newState === 'open') {
				// Handle YouTube iframes - set src from data-src
				const youtubeIframe = popover.querySelector('iframe[data-src*="youtube.com"]');
				if (youtubeIframe && youtubeIframe.dataset.src) {
					youtubeIframe.src = youtubeIframe.dataset.src;
				}
				
				// Handle regular videos - play if autoplay is set
				const video = popover.querySelector('video');
				if (video && 'autoplay' in video.dataset) {
					video.play().catch(() => {}); // Ignore autoplay failures
				}
			} else {
				// Handle YouTube iframes - remove src to stop playback and save bandwidth
				const youtubeIframe = popover.querySelector('iframe[src*="youtube.com"]');
				if (youtubeIframe) {
					youtubeIframe.src = 'about:blank';
				}
				
				// Handle regular videos - pause and optionally reset
				const video = popover.querySelector('video');
				if (video) {
					video.pause();
					if ('reset' in video.dataset) {
						video.currentTime = 0;
					}
				}
			}
		});
	});
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

// Extract aspect ratio from layout attribute
function extractAspectRatio(element, config) {
	if (!element || !config?.aspectRatio?.enabled) return null;
	
	const layoutAttr = element.getAttribute?.('layout') || '';
	const aspectRatioMatch = layoutAttr.match(/ar(\d+)x(\d+)/);
	
	if (aspectRatioMatch) {
		const arKey = `ar${aspectRatioMatch[1]}x${aspectRatioMatch[2]}`;
		return config.aspectRatio.calculations[arKey] || null;
	}
	
	return null;
}

// Build transform URL based on provider configuration
function buildTransformUrl(imageSrc, transforms, config) {
	if (!config?.providers?.[config.defaultProvider]) return imageSrc;
	
	const provider = config.providers[config.defaultProvider];
	const { urlPattern, paramMap } = provider;
	
	// Filter out null/undefined transforms and map parameter names
	const validTransforms = Object.entries(transforms)
		.filter(([key, value]) => value != null)
		.map(([paramKey, value]) => {
			const paramName = paramMap[paramKey] || paramKey;
			return `${paramName}${urlPattern.pathConfig.assignment}${value}`;
		});
	
	if (validTransforms.length === 0) return imageSrc;
	
	if (urlPattern.type === 'path') {
		const { prefix, separator } = urlPattern.pathConfig;
		const transformString = validTransforms.join(separator);
		
		// Parse URL to inject transforms before path
		try {
			const url = new URL(imageSrc);
			const transformedPath = `${prefix}${transformString}${url.pathname}${url.search}`;
			return `${url.protocol}//${url.host}${transformedPath}`;
		} catch {
			// Fallback for relative URLs
			return `${prefix}${transformString}/${imageSrc}`;
		}
	}
	
	// Query-based transforms (future implementation if needed)
	return imageSrc;
}

// Generate srcset with image transforms and aspect ratio calculations
function generateSrcsetString(imageSrc, element, breakpoints, config) {
	if (!imageSrc || !Array.isArray(breakpoints) || breakpoints.length === 0) {
		return null;
	}
	
	// Extract aspect ratio configuration
	const aspectConfig = extractAspectRatio(element, config);
	
	return breakpoints
		.map(width => {
			let transforms = {
				...config?.defaultTransforms,
				width
			};
			
			// Calculate height based on aspect ratio
			if (aspectConfig) {
				let height;
				switch (aspectConfig.calculate) {
					case 'square':
						height = width;
						break;
					case 'height-from-width':
						height = Math.round(width / aspectConfig.ratio);
						break;
				}
				
				if (height) {
					transforms.height = height;
				}
			}
			
			// Apply responsive overrides based on breakpoint
			const responsiveOverride = config?.responsive?.[getBreakpointName(width)];
			if (responsiveOverride) {
				transforms = { ...transforms, ...responsiveOverride };
			}
			
			// Build transform URL
			const transformedUrl = buildTransformUrl(imageSrc, transforms, config);
			return `${transformedUrl} ${width}w`;
		})
		.join(', ');
}

// Helper to determine breakpoint name from width
function getBreakpointName(width) {
	// Map width to breakpoint names based on config thresholds
	if (width <= 380) return 'xs';
	if (width <= 540) return 'sm';
	if (width <= 720) return 'md';
	if (width <= 920) return 'lg';
	if (width <= 1140) return 'xl';
	return 'xxl';
}

function _generateResponsiveSrcset(imageSrc, element, settings = {}) {
	try {
		const breakpoints = settings.srcsetBreakpoints || [];
		const config = settings.imageTransformConfig || null;
		
		let srcset;
		if (config?.defaultProvider && config.providers?.[config.defaultProvider]) {
			// Use new transform-based srcset generation
			srcset = generateSrcsetString(imageSrc, element, breakpoints, config);
		} else {
			// Fallback to simple query parameter approach
			srcset = breakpoints
				.map(width => `${imageSrc}?w=${width} ${width}w`)
				.join(', ');
		}
		
		const sizes = settings.layoutSrcset || 'auto';
		
		return {
			srcset,
			sizes
		};
	} catch (error) {
		console.warn('Error generating responsive srcset:', error);
		return { srcset: null, sizes: null };
	}
}
import { ICONS } from './icons.js';

class ContentCard extends HTMLElement {
	#data; #root; #settings; #popoverId;

	static get observedAttributes() {
		return ['data', 'settings', 'content'];
	}

	constructor() {
		super();
	}

	_ensureSettingsInitialized() {
		if (this.#settings === undefined) {
			let settingsAttr = this.getAttribute('settings');
			let parsedSettings = null;
			if (settingsAttr) {
				try {
					parsedSettings = JSON.parse(settingsAttr);
				} catch (e) {
					console.error('Failed to parse settings attribute JSON during init:', e);
				}
			}
			const defaultSettings = {
				styles: {},
				type: this.getAttribute('type') || 'none',
			};
			this.#settings = { ...defaultSettings, ...(parsedSettings || {}) };
		}
	}

	set dataset(obj) {
		this._ensureSettingsInitialized();

		this.#data = obj?.data || {};
		this.#settings = { ...this.#settings, ...(obj?.settings || {}) };

		this._prepareAndRender();
	}

	get dataset() {
		return { data: this.#data, settings: this.#settings };
	}

	resolvePath(obj, path) {
		if (!obj || !path) return "";
		return path.split('.').reduce((acc, cur) => acc && acc[cur], obj) || "";
	}

	getStyle(name) {
		this._ensureSettingsInitialized();
		const styles = this.#settings?.styles || {};
		const userClass = this.resolvePath(styles, name);

		let classList = name;
		if (userClass) {
			classList += ` ${userClass}`;
		}
		return `class="${classList}"`;
	}

	async attributeChangedCallback(attr, oldVal, newVal) {
		if (newVal === oldVal) return;

		this._ensureSettingsInitialized();

		if (attr === 'settings') {
			let parsedSettings = null;
			try {
				parsedSettings = JSON.parse(newVal);
			} catch (e) {
				console.error('Failed to parse settings attribute JSON:', e);
				return;
			}
			this.#settings = { ...this.#settings, ...parsedSettings };

			this._prepareAndRender();

		} else if (attr === 'data') {
			try {
				const res = await fetch(newVal);
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
				this.#data = await res.json();
				this._prepareAndRender();
			} catch (e) {
				console.error(`Failed to fetch or process data from ${newVal}:`, e);
				this.#data = null;
				this._prepareAndRender();
			}
		} else if (attr === 'content') {
			try {
				const res = await fetch('data.json');
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
				const allData = await res.json();
				const itemData = allData.find(item => item.id === newVal);
			   if (itemData) {
				   this.#data = itemData;
				   if (itemData.type) {
					   this.setAttribute('type', itemData.type);
				   }
				   this._prepareAndRender();
			   } else {
				   console.error(`Item with id "${newVal}" not found in data.json`);
				   this.innerHTML = `<p>Error: Item with id "${newVal}" not found.</p>`;
			   }
			} catch (e) {
				console.error(`Failed to fetch or process data for content="${newVal}":`, e);
				this.innerHTML = `<p>Error loading content.</p>`;
			}
		}
	}

	_prepareAndRender() {
		this._init();
		this._generatePopoverId();
		this.render();
	}

	_generatePopoverId() {
		if (this.#data?.popover || (this.#data?.type === 'video' && this.#data?.video?.src)) {
			this.#popoverId = this.#data.id ? `popover-${this.#data.id}` : `popover-${crypto.randomUUID()}`;
		} else {
			this.#popoverId = null;
		}
	}

	_init() {
		// this._ensureSettingsInitialized();

		if (this.#root) return;

		this.#root = this;
		// if (this.#data?.id) {
			// this.id = this.#data.id;
		// }
	}

	connectedCallback() {
		// this._ensureSettingsInitialized();
	}

	renderImage(image, useSchema = false) {
		if (!image?.src) return '';
		const schemaAttr = useSchema ? 'itemprop="image"' : '';
		return `<img 
			${this.getStyle('cc-media-image')} 
			src="${image.src}" 
			${image.srcset ? `srcset="${image.srcset}"` : ''}
			alt="${image.alt || ''}" 
			decoding="${image.decoding || 'async'}"
			${image.width ? `width="${image.width}"` : ''}
			${image.height ? `height="${image.height}"` : ''}
			loading="${image.loading ? image.loading : 'lazy'}"
			${schemaAttr}
		>`;
	}

	renderYouTube(video) {
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

		return `<img 
			${this.getStyle('cc-media-image')}
			decoding="async"
			loading="lazy"
			src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" 
			alt="${video.alt || 'YouTube video player'}"
			data-video-id="${videoId}"
		>`;
	}

	renderRibbon(ribbon) {
		if (!ribbon?.text) return '';
		const styleAttr = ribbon.color ? `style="background-color: ${ribbon.color};"` : '';
		const styleClass = ribbon.style ? ` ic-ribbon--${ribbon.style}` : '';
		const baseStyle = this.getStyle('cc-ribbon').slice(0, -1); // remove closing quote

		return `<div ${baseStyle}${styleClass}" role="status" ${styleAttr}>
			${ribbon.icon ? this.renderSVG(ribbon.icon) : ''}
			${ribbon.text}
		</div>`;
	}

	renderSticker(sticker) {
		if (!sticker?.text) return '';
		return `<span ${this.getStyle('cc-sticker')} role="status">${sticker.text}</span>`;
	}

	renderMedia(media, ribbon, sticker, useSchema = false) {
		this._ensureSettingsInitialized();
		if (!media?.sources?.length) return '';
		return `
		<figure ${this.getStyle('cc-media')}>
		
			${media.sources
				.map((entry) => {
					if (entry.type === 'image') return this.renderImage(entry, useSchema)
					if (entry.type === 'video') return this.renderVideo(entry)
					if (entry.type === 'youtube') return this.renderYouTube(entry)
				})
				.join('')}
			${this.renderRibbon(ribbon)}
			${this.renderSticker(sticker)}
			${media.caption ? `<figcaption ${this.getStyle('cc-media-caption')}>${media.caption}</figcaption>`: ''}
		</figure>`
	}

	renderVideo(video) {
		this._ensureSettingsInitialized();
		if (!video?.src) return '';
		const opts = video.options || {};
		return `<video ${this.getStyle('cc-media-video')} src="${video.src}"
			${opts.autoplay ? `autoplay playsinline` : ''}
			${opts.controls ? `controls` : ''}
			${opts.loop ? `loop` : ''}
			${opts.muted ? `muted` : ''}
			${video.poster ? `poster="${video.poster}"` : ''}
			${video.width ? `width="${video.width}"` : ''}
			${video.height ? `height="${video.height}"` : ''}
			${video.crossorigin ? `crossorigin="${video.crossorigin}"` : ''}
			preload="${opts.preload || 'metadata'}"></video>`
	}

	renderSVG(name) {
		if (!name || !ICONS[name]) return '';
		return `<svg viewBox="0 -960 960 960" width="24" height="24"><path d="${ICONS[name]}"></path></svg>`;
	}

	renderPopover(data) {
		if (!this.#popoverId) return '';

		let content = '';
		const popoverData = data.popover || { type: 'video', video: data.video }; // Fallback for video type

		if (!popoverData) return '';

		switch (popoverData.type) {
			case 'video':
				if (popoverData.video) {
					const video = popoverData.video;
					const opts = video.options || {};
					const videoAttrs = `
						class="ic-popover-video"
						src="${video.src}"
						${opts.controls ? 'controls' : ''}
						${opts.muted ? 'muted' : ''}
						${opts.autoplay ? 'data-autoplay' : ''}
						${opts.playsinline ? 'playsinline' : ''}
						${opts.resetOnClose ? 'data-reset' : ''}
						preload="metadata"
					`.trim();
					content = `<video ${videoAttrs}></video>`;
				}
				break;
			case 'article':
				if (popoverData.content) {
					content = `<div class="ic-popover-content">${popoverData.content}</div>`;
				}
				break;
			// Future cases for 'image', 'text', etc. can be added here.
		}

		if (!content) return '';

		return `
			<div id="${this.#popoverId}" popover class="ic-popover">
				<button type="button" popovertarget="${this.#popoverId}" popovertargetaction="hide" aria-label="Close and hide the modal overlay" class="ic-popover-close">✕</button>
				${content}
			</div>
		`;
	}

	renderVideoPopover(data) {
		if (!this.#popoverId) return '';

		const video = data.video;
		const opts = video.options || {};
		const videoAttrs = `
				class="ic-popover-video"
				src="${video.src}"
				${opts.controls ? 'controls' : ''}
				${opts.muted ? 'muted' : ''}
				${opts.autoplay ? 'data-autoplay' : ''}
				${opts.playsinline ? 'playsinline' : ''}
				${opts.resetOnClose ? 'data-reset' : ''}
				preload="metadata"
		`.trim();

		return `
			<div id="${this.#popoverId}" popover class="ic-popover">
				<button type="button" popovertarget="${this.#popoverId}" popovertargetaction="hide" aria-label="Close and hide the modal overlay" class="ic-popover-close">✕</button>
				<video ${videoAttrs}></video>
			</div>
		`;
	}

	renderLinks(links, actions) {
		if (!links?.length) return '';
		
		const renderLink = (link) => {
			const isOnlyLink = links.length === 1 && (!actions || actions.length === 0);
			
			let style = this.getStyle(`cc-link`);
			if (isOnlyLink) {
				style = style.slice(0, -1) + ' cc-wrapper"';
			}
			if (isOnlyLink && link.hideText) {
				style = style.slice(0, -1) + ' cc-hidetext"';
			}
			
			return `<a href="${link.url}" ${style} ${(link.icon ? `aria-label="${link.text}"` : (link.ariaLabel ? `aria-label="${link.ariaLabel}"` : ''))}>
				${link.icon ? `${this.renderSVG(link.icon)} <span class="cc-link-text">${link.hideText ? '' : link.text}</span>` : link.text}
			</a>`;
		};
		
		return `<nav class="cc-links">${links.map(link => renderLink(link)).join('')}</nav>`;
	}

	renderActions(actions) {
		if (!actions?.length) return '';
		
		const renderBtn = (a) => {
			const popoverAttrs = a.popover ? `popovertarget="${this.#popoverId}" popovertargetaction="show"` : '';
			return `<button type="button" ${this.getStyle(`cc-action`)} ${(a.icon ? `aria-label="${a.text}"` : (a.ariaLabel ? `aria-label="${a.ariaLabel}"` : ''))} ${popoverAttrs}>
				${a.icon ? this.renderSVG(a.icon) : ''} ${a.text}
			</button>`;
		};
		
		return `<nav class="cc-actions">${actions.map(a => renderBtn(a)).join('')}</nav>`;
	}

	renderTags(tags) {
		if (!tags?.length) return '';
		return `
			<ul ${this.getStyle('cc-tags')}>
				${tags.map(tag =>
					`<li><a href="${tag.url}" ${this.getStyle('cc-tag')}>${tag.name}</a></li>`
				).join('')}
			</ul>
		`;
	}

	renderAuthors(authors, includeSchema = false) {
		if (!authors?.length) return '';
		return `
			<div ${this.getStyle('cc-authors')}>
				${authors.map(author => {
					const avatar = author.avatar;
					const avatarImg = avatar ?
						`<img src="${avatar.src}" 
							alt="${avatar.alt || author.name}" 
							${avatar.width !== undefined ? `width="${avatar.width}"` : ''} 
							${avatar.height !== undefined ? `height="${avatar.height}"` : ''} 
							${this.getStyle('cc-avatar')}>`
						: '';

					return `<address ${this.getStyle('cc-author')} ${includeSchema ? 'itemprop="author" itemscope itemtype="https://schema.org/Person"' : ''}>
						${avatarImg}
						<div ${this.getStyle('cc-author-deails')}>
							<strong ${this.getStyle('cc-author-name')} ${includeSchema ? 'itemprop="name"' : ''}>${author.name}</strong>
							${author.role ? `<small ${this.getStyle('cc-author-role')} ${includeSchema ? 'itemprop="jobTitle"' : ''}>${author.role}</small>` : ''}
						</div>
					</address>`;
				}).join('')}
			</div>
		`;
	}

	renderEngagement(engagement) {
		if (!engagement) return '';
		return `
			<div ${this.getStyle('cc-engagement')}>
				${engagement.reactions?.map(r =>
					`<button type="button"
						${this.getStyle('cc-reaction')}
						${r.ariaLabel ? `aria-label="${r.ariaLabel}"` : ''}
						${r.active ? 'aria-pressed="true"' : ''}
					>
						${r.icon ? this.renderSVG(r.icon) : ''} 
						${r.count}
					</button>`
				).join('') || ''}
				${typeof engagement.commentCount === 'number' ? `<span ${this.getStyle('cc-comments')}>${engagement.commentCount} comments</span>` : ''}
				${typeof engagement.shareCount === 'number' ? `<span ${this.getStyle('cc-shares')}>${engagement.shareCount} shares</span>` : ''}
				${typeof engagement.viewCount === 'number' ? `<span ${this.getStyle('cc-views')}>${engagement.viewCount} views</span>` : ''}
			</div>
		`;
	}

	renderHeader(content) {
		if (!content) return '';
		const hasPublished = content.published && (content.published.datetime || content.published.formatted);
		const hasModified = content.modified && (content.modified.datetime || content.modified.formatted);
		const hasReadingTime = content.readingTime;
		const hasCategory = content.category;

		if (!hasCategory && !hasPublished && !hasReadingTime && !hasModified) return '';

		return `
			<header ${this.getStyle('cc-header')}>
				${hasCategory ? `<span ${this.getStyle('cc-category')}>${content.category}</span>` : ''}
				${hasPublished ? `<time ${this.getStyle('cc-published')} datetime="${content.published.datetime}">${content.published.formatted || content.published.relative}</time>` : ''}
			   ${hasModified ? `<small ${this.getStyle('cc-modified')}><time datetime="${content.modified.datetime}">${content.modified.formatted || content.modified.relative}</time></small>` : ''}
				${hasReadingTime ? `<small ${this.getStyle('cc-reading-time')}>${content.readingTime}</small>` : ''}
			</header>
		`;
	}

	renderProduct(product) {
		this._ensureSettingsInitialized();
		if (!this.#data || this.#data.type !== 'product') return '';
		
		const { content = {}, product: productData = {} } = this.#data;
		const price = productData.price || {};
		const rating = productData.rating || {};
		const headlineTag = content.headlineTag || 'h2';

		return `
			<article ${this.getStyle('cc-content')}>
				${this.#data.id ? `<meta itemprop="sku" content="${this.#data.id}">` : ''}
				${content.category ? `<meta itemprop="category" content="${content.category}">` : ''}
				
				${this.renderHeader(content)}
				
				${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')} itemprop="name">${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				
				${this.renderAuthors(this.#data.authors)}
				
				${content.summary ? `<p ${this.getStyle('cc-summary')} itemprop="description">${content.summary}</p>` : ''}
				
				${content.text ? `<div ${this.getStyle('cc-text')}>${content.text}</div>` : ''}
				
				${price.current ? `
					<div ${this.getStyle('cc-product-price')} itemprop="offers" itemscope itemtype="https://schema.org/Offer">
						<meta itemprop="priceCurrency" content="${price.currency || 'USD'}">
						<span itemprop="price" content="${price.current}">${price.currency || ''} ${price.current}</span>
					${price.original && price.original > price.current ? `<del ${this.getStyle('cc-product-price-original')}>${price.currency || ''} ${price.original}</del>` : ''}
					${price.discountText ? `<span ${this.getStyle('cc-product-discount')}>${price.discountText}</span>` : ''}
						<meta itemprop="availability" content="https://schema.org/${productData.availability && productData.availability.toLowerCase().includes('out of stock') ? 'OutOfStock' : 'InStock'}">
						<meta itemprop="itemCondition" content="https://schema.org/NewCondition">
					</div>
				` : ''}
				
				${productData.availability ? `<span ${this.getStyle('cc-product-availability')}>${productData.availability}</span>` : ''}
				
				${productData.validUntil ? `<span ${this.getStyle('cc-product-validity')}>Offer valid until ${productData.validUntil}</span>` : ''}
				
				${rating.value ? `
					<div ${this.getStyle('cc-product-rating')} itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
						<meta itemprop="ratingValue" content="${rating.value || 1}">
						<meta itemprop="ratingCount" content="${rating.count || 0}">
						<meta itemprop="bestRating" content="${rating.starCount || 5}">
						<meta itemprop="worstRating" content="1">
						<span>${'★'.repeat(Math.round(rating.value))}${'☆'.repeat((rating.starCount || 5) - Math.round(rating.value))}
						(${rating.value} / ${rating.starCount || 5}, ${rating.count} ratings)</span>
					</div>
				` : ''}
				
				${this.renderEngagement(this.#data.engagement)}
				${this.renderTags(this.#data.tags)}
				${this.renderLinks(this.#data.links, this.#data.actions)}
				${this.renderActions(this.#data.actions)}
			</article>
		`;
	}

	renderEvent() {
		this._ensureSettingsInitialized();
		if (!this.#data || this.#data.type !== 'event') return '';
		
		const { content = {}, event: eventData = {} } = this.#data;
		const headlineTag = content.headlineTag || 'h2';

		return `
			<article ${this.getStyle('cc-content')}>
				${content.category ? `<meta itemprop="eventType" content="${content.category}">` : ''}
				${eventData.status ? `<meta itemprop="eventStatus" content="https://schema.org/EventStatus${eventData.status}">` : ''}
				${eventData.attendanceMode ? `<meta itemprop="eventAttendanceMode" content="https://schema.org/${eventData.attendanceMode}">` : ''}
				
				${this.renderHeader(content)}
				
				${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')} itemprop="name">${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				
				${this.renderAuthors(this.#data.authors)}
				
				${content.summary ? `<p ${this.getStyle('cc-summary')} itemprop="description">${content.summary}</p>` : ''}
				
				${content.text ? `<div ${this.getStyle('cc-text')}>${content.text}</div>` : ''}
				
				${eventData.startDate ? `<meta itemprop="startDate" content="${eventData.startDate}">` : ''}
				${eventData.endDate ? `<meta itemprop="endDate" content="${eventData.endDate}">` : ''}
				
				${eventData.location ? `
					<div ${this.getStyle('cc-event-location')} itemprop="location" itemscope itemtype="https://schema.org/Place">
						<span itemprop="name">${eventData.location.name}</span>
						${eventData.location.address ? `
							<span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
								<span itemprop="streetAddress">${eventData.location.address}</span>
							</span>
						` : ''}
					</div>
				` : ''}
				
				${eventData.organizer ? `
					<div ${this.getStyle('cc-event-organizer')} itemprop="organizer" itemscope itemtype="https://schema.org/Organization">
						<span itemprop="name">${eventData.organizer.name}</span>
					</div>
				` : ''}
				
				${eventData.offers && eventData.offers.length ? `
					${eventData.offers.map(offer => `
						<div ${this.getStyle('cc-event-offer')} itemprop="offers" itemscope itemtype="https://schema.org/Offer">
							<span itemprop="name">${offer.name}</span>
							${offer.price ? `<span itemprop="price" content="${offer.price}">${offer.currency || '$'}${offer.price}</span>` : ''}
							${offer.price ? `<meta itemprop="priceCurrency" content="${offer.currency || 'USD'}">` : ''}
							<meta itemprop="availability" content="https://schema.org/InStock">
						</div>
					`).join('')}
				` : ''}
				
				${this.renderEngagement(this.#data.engagement)}
				${this.renderTags(this.#data.tags)}
				${this.renderLinks(this.#data.links, this.#data.actions)}
				${this.renderActions(this.#data.actions)}
			</article>
		`;
	}

	renderRecipe() {
		this._ensureSettingsInitialized();
		if (!this.#data || this.#data.type !== 'recipe') return '';
		
		const { content = {}, recipe: recipeData = {}, engagement } = this.#data;
		const headlineTag = content.headlineTag || 'h2';
		const rating = engagement?.reactions?.[0]; // Assuming first reaction is "like" for rating

		return `
			<article ${this.getStyle('cc-content')}>
				${content.category ? `<meta itemprop="recipeCategory" content="${content.category}">` : ''}
				${content.readingTime ? `<meta itemprop="totalTime" content="${content.readingTime}">` : ''}
				${recipeData.prepTime ? `<meta itemprop="prepTime" content="${recipeData.prepTime}">` : ''}
				${recipeData.cookTime ? `<meta itemprop="cookTime" content="${recipeData.cookTime}">` : ''}
				${recipeData.servings ? `<meta itemprop="recipeYield" content="${recipeData.servings}">` : ''}
				
				${this.renderHeader(content)}
				
				${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')} itemprop="name">${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				
				${this.renderAuthors(this.#data.authors, true)}
				
				${content.summary ? `<p ${this.getStyle('cc-summary')} itemprop="description">${content.summary}</p>` : ''}
				
				${Array.isArray(content.text) ? `
					<details ${this.getStyle('cc-recipe-ingredients')}>
						<summary>Ingredients</summary>
						<ul itemprop="recipeIngredient">
							${content.text.map(ingredient => `<li>${ingredient.headline || ingredient.text || ingredient}</li>`).join('')}
						</ul>
					</details>
				` : (content.text ? `<div ${this.getStyle('cc-text')}>${content.text}</div>` : '')}
				
				${recipeData.instructions ? `
					<div ${this.getStyle('cc-recipe-instructions')} itemprop="recipeInstructions">
						<h3>Instructions</h3>
						${Array.isArray(recipeData.instructions) ? 
							recipeData.instructions.map((instruction, index) => `
								<div itemscope itemtype="https://schema.org/HowToStep">
									<meta itemprop="position" content="${index + 1}">
									<p itemprop="text">${instruction}</p>
								</div>
							`).join('') :
							`<p>${recipeData.instructions}</p>`
						}
					</div>
				` : ''}
				
				${rating && rating.count ? `
					<div ${this.getStyle('cc-recipe-rating')} itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
						<meta itemprop="ratingValue" content="${rating.value || 1}">
						<meta itemprop="ratingCount" content="${rating.count || 0}">
						<meta itemprop="bestRating" content="5">
						<meta itemprop="worstRating" content="1">
					</div>
				` : ''}
				
				${this.renderEngagement(this.#data.engagement)}
				${this.renderTags(this.#data.tags)}
				${this.renderLinks(this.#data.links, this.#data.actions)}
				${this.renderActions(this.#data.actions)}
			</article>
		`;
	}

	renderNewsArticle() {
		this._ensureSettingsInitialized();
		if (!this.#data || this.#data.type !== 'news') return '';
		
		const { content = {} } = this.#data;
		const headlineTag = content.headlineTag || 'h2';

		return `
			<article ${this.getStyle('cc-content')}>
				${content.category ? `<meta itemprop="articleSection" content="${content.category}">` : ''}
				${content.published?.datetime ? `<meta itemprop="datePublished" content="${content.published.datetime}">` : ''}
				${content.modified?.datetime ? `<meta itemprop="dateModified" content="${content.modified.datetime}">` : ''}
				${content.readingTime ? `<meta itemprop="wordCount" content="${content.readingTime}">` : ''}
				
				${this.renderHeader(content)}
				
				${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')} itemprop="headline">${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				
				${this.renderAuthors(this.#data.authors, true)}
				
				${content.summary ? `<p ${this.getStyle('cc-summary')} itemprop="description">${content.summary}</p>` : ''}
				
				${content.text ? `<div ${this.getStyle('cc-text')} itemprop="articleBody">${content.text}</div>` : ''}
				
				${this.renderEngagement(this.#data.engagement)}
				${this.renderTags(this.#data.tags)}
				${this.renderLinks(this.#data.links, this.#data.actions)}
				${this.renderActions(this.#data.actions)}
			</article>
		`;
	}

	renderArticle() {
		this._ensureSettingsInitialized();
		if (!this.#data || this.#data.type !== 'article') return '';
		
		const { content = {} } = this.#data;
		const headlineTag = content.headlineTag || 'h2';

		return `
			<article ${this.getStyle('cc-content')}>
				${content.category ? `<meta itemprop="articleSection" content="${content.category}">` : ''}
				${content.published?.datetime ? `<meta itemprop="datePublished" content="${content.published.datetime}">` : ''}
				${content.modified?.datetime ? `<meta itemprop="dateModified" content="${content.modified.datetime}">` : ''}
				
				${this.renderHeader(content)}
				
				${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')} itemprop="headline">${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
				
				${this.renderAuthors(this.#data.authors, true)}
				
				${content.summary ? `<p ${this.getStyle('cc-summary')} itemprop="description">${content.summary}</p>` : ''}
				
				${content.text ? `<div ${this.getStyle('cc-text')} itemprop="articleBody">${content.text}</div>` : ''}
				
				${this.renderEngagement(this.#data.engagement)}
				${this.renderTags(this.#data.tags)}
				${this.renderLinks(this.#data.links, this.#data.actions)}
				${this.renderActions(this.#data.actions)}
			</article>
		`;
	}


renderContent(data) {
	// Check if this is a product card and use dedicated product renderer
	if (data.type === 'product') {
		return this.renderProduct();
	}
	
	// Check if this is an event card and use dedicated event renderer
	if (data.type === 'event') {
		return this.renderEvent();
	}
	
	// Check if this is a recipe card and use dedicated recipe renderer
	if (data.type === 'recipe') {
		return this.renderRecipe();
	}
	
	// Check if this is a news article card and use dedicated news renderer
	if (data.type === 'news') {
		return this.renderNewsArticle();
	}
	
	// Check if this is an article card and use dedicated article renderer
	if (data.type === 'article') {
		return this.renderArticle();
	}
	
	const content = data.content || {};
	const published = content.published?.formatted || '';
	const headlineTag = content.headlineTag || 'h2';
	
	// If text is an array and type is accordion or timeline, use special renderers
	if (Array.isArray(content.text)) {
		if (data.type === 'accordion') {
			return this.renderAccordion(content, data);
		} else if (data.type === 'timeline') {
			return this.renderTimeline(content, data);
		}
	}
	return `
		<article ${this.getStyle('cc-content')}>
			${this.renderHeader(content)}
		   ${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')}>${content.headline}${content.subheadline ? ` <span class="cc-subheadline">${content.subheadline}</span>` : ''}</${headlineTag}>` : ''}
			${this.renderAuthors(data.authors)}
			${content.summary ? `<p ${this.getStyle('cc-summary')}>${content.summary}</p>` : ''}
			${content.text ? `<div ${this.getStyle('cc-text')}>${content.text}</div>` : ''}
			${this.renderEngagement(data.engagement)}
			${this.renderTags(data.tags)}
			${this.renderLinks(data.links, data.actions)}
			${this.renderActions(data.actions)}
		</article>
	`;
}

renderAccordion(content, data) {
   const headlineTag = content.headlineTag || 'h2';
   // Generate a unique name for this accordion instance
   const accordionName = `accordion-${data.id || Math.random().toString(36).slice(2)}`;
   return `
	   <article ${this.getStyle('cc-content')}>
		   ${this.renderHeader(content)}
		   ${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')}>${content.headline}</${headlineTag}>` : ''}
		   <div class="cc-accordion">
			   ${content.text.map((item, idx) => `
				   <details class="cc-accordion-item" name="${accordionName}">
					   <summary class="cc-accordion-title">${item.headline}</summary>
					   <div class="cc-accordion-panel">${item.text}</div>
				   </details>
			   `).join('')}
		   </div>
		   ${this.renderLinks(data.links, data.actions)}
		   ${this.renderActions(data.actions)}
	   </article>
   `;
}

renderTimeline(content, data) {
	const headlineTag = content.headlineTag || 'h2';
	return `
		<article ${this.getStyle('cc-content')}>
			${this.renderHeader(content)}
			${content.headline ? `<${headlineTag} ${this.getStyle('cc-headline')}>${content.headline}</${headlineTag}>` : ''}
			<ol class="cc-timeline">
				${content.text.map(item => `
					<li class="cc-timeline-item">
						<div class="cc-timeline-headline">${item.headline}</div>
						<div class="cc-timeline-text">${item.text}</div>
					</li>
				`).join('')}
			</ol>
			${this.renderLinks(data.links, data.actions)}
			${this.renderActions(data.actions)}
		</article>
	`;
}

	render() {
		if (!this.#data) {
			// Don't render if there's no data yet, especially for attribute-driven components
			if (!this.hasAttribute('content') && !this.hasAttribute('data')) {
				this.innerHTML = '<p>No data provided.</p>';
			}
			return;
		}

		const { type, media, ribbon, sticker, content, actions, links, tags, authors, engagement, product, popover } = this.#data;

		// Clear any existing schema attributes
		this.removeAttribute('itemscope');
		this.removeAttribute('itemtype');

		// Set schema.org attributes on the content-card element itself
		if (type === 'product') {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', 'https://schema.org/Product');
		} else if (type === 'event') {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', 'https://schema.org/Event');
		} else if (type === 'recipe') {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', 'https://schema.org/Recipe');
		} else if (type === 'news') {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', 'https://schema.org/NewsArticle');
		} else if (type === 'article') {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', 'https://schema.org/Article');
		}

		// Render with proper structure - media area first, content area second
		this.#root.innerHTML = `
			${this.renderMedia(media, ribbon, sticker, ['product', 'event', 'recipe', 'article', 'news'].includes(type))}
			${content ? this.renderContent(this.#data) : ''}
			${this.renderPopover(this.#data)}
		`;
	}


}

customElements.define('content-card', ContentCard);

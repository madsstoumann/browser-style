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
		this._ensureSettingsInitialized();

		if (this.#root) return;

		this.#root = this;
		if (this.#data?.id) {
			this.id = this.#data.id;
		}
	}

	connectedCallback() {
		this._ensureSettingsInitialized();
	}

	renderImage(image) {
		if (!image?.src) return '';
		return `<img 
			${this.getStyle('cc-media-image')} 
			src="${image.src}" 
			${image.srcset ? `srcset="${image.srcset}"` : ''}
			alt="${image.alt || ''}" 
			decoding="${image.decoding || 'async'}"
			${image.width ? `width="${image.width}"` : ''}
			${image.height ? `height="${image.height}"` : ''}
			loading="${image.loading ? image.loading : 'lazy'}"
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

		return `<iframe 
			${this.getStyle('cc-media-iframe')}
			src="https://www.youtube.com/embed/${videoId}" 
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
			allowfullscreen
			title="${video.alt || 'YouTube video player'}"
		></iframe>`;
	}

	renderRibbon(ribbon) {
		if (!ribbon?.text) return '';
		const styleAttr = ribbon.color ? `style="background-color: ${ribbon.color};"` : '';
		const styleClass = ribbon.style ? ` ic-ribbon--${ribbon.style}` : '';
		const baseStyle = this.getStyle('cc-ribbon').slice(0, -1); // remove closing quote

		return `<div ${baseStyle}${styleClass}" role="status" ${styleAttr}>
			${ribbon.icon ? `<span class="ic-ribbon-icon">${ribbon.icon}</span>` : ''}
			${ribbon.text}
		</div>`;
	}

	renderSticker(sticker) {
		if (!sticker?.text) return '';
		return `<span ${this.getStyle('cc-sticker')} role="status">${sticker.text}</span>`;
	}

	renderMedia(media, ribbon, sticker) {
		this._ensureSettingsInitialized();
		if (!media?.sources?.length) return '';
		return `
		<figure ${this.getStyle('cc-media')}>
		
			${media.sources
				.map((entry) => {
					if (entry.type === 'image') return this.renderImage(entry)
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

	renderActions(actions) {
		if (!actions) return '';
		const renderBtn = (a) => {
			const popoverAttrs = a.popover ? `popovertarget="${this.#popoverId}" popovertargetaction="show"` : '';
			if (a.type === 'link') {
				let style = this.getStyle(`cc-action-link`);
				if (a.isWrapper) {
					style = style.slice(0, -1) + ' cc-wrapper"';
				}
			   return `<a href="${a.url}" ${style} ${(a.icon ? `aria-label="${a.text}"` : (a.ariaLabel ? `aria-label="${a.ariaLabel}"` : ''))}>
					   ${a.icon ? `<span class="material-symbols-outlined ${this.getStyle('cc-action-icon').replace('class="', '').replace('"', '')}">${a.icon}</span> <span class="cc-link-text">${a.text}</span>` : a.text}
				   </a>`;
			}
		   return `<button type="button" ${this.getStyle(`cc-action-button`)} ${(a.icon ? `aria-label="${a.text}"` : (a.ariaLabel ? `aria-label="${a.ariaLabel}"` : ''))} ${popoverAttrs}>
					   ${a.icon ? `<span class="material-symbols-outlined ${this.getStyle('cc-action-icon').replace('class=\"', '').replace('\"', '')}">${a.icon}</span>` : a.text}
				   </button>`;
		}
	   const primaryBlock = actions.primary?.length
		   ? `<nav class="cc-primary-actions" aria-label="Primary actions">${actions.primary.map(a => renderBtn({...a, role: 'primary'})).join('')}</nav>`
		   : '';
	   const secondaryBlock = actions.secondary?.length
		   ? `<nav class="cc-secondary-actions" aria-label="Secondary actions">${actions.secondary.map(a => renderBtn({...a, role: 'secondary'})).join('')}</nav>`
		   : '';
	   return `${primaryBlock}${secondaryBlock}`;
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

	renderAuthors(authors) {
		// this._ensureSettingsInitialized();
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

					return `<address ${this.getStyle('cc-author')}>
						${avatarImg}
						<div ${this.getStyle('cc-author-deails')}>
							<strong ${this.getStyle('cc-author-name')}>${author.name}</strong>
							${author.role ? `<small ${this.getStyle('cc-author-role')}>${author.role}</small>` : ''}
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
						${r.icon ? `<span ${this.getStyle('cc-reaction-icon')}>${r.icon}</span>` : ''} 
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
		if (!product) return '';
		const price = product.price || {};
		const rating = product.rating || {};

		return [
			(price.current ? `<div ${this.getStyle('cc-product-price')}>
					<span>${price.currency || ''} ${price.current}</span>
					${price.original && price.original > price.current ? `<del ${this.getStyle('cc-product-price-original')}>${price.currency || ''} ${price.original}</del>` : ''}
					${price.discountText ? `<span ${this.getStyle('cc-product-discount')}>${price.discountText}</span>` : ''}
				</div>` : ''),
			(product.availability ? `<span ${this.getStyle('cc-product-availability')}>${product.availability}</span>` : ''),
			(product.validUntil ? `<span ${this.getStyle('cc-product-validity')}>Offer valid until ${product.validUntil}</span>` : ''),
			(rating.value ? `<span ${this.getStyle('cc-product-rating')}>
					${'★'.repeat(Math.round(rating.value))}${'☆'.repeat((rating.starCount || 5) - Math.round(rating.value))}
					(${rating.value} / ${rating.starCount || 5}, ${rating.count} ratings)
				</span>` : '')
		].filter(Boolean).join('');
	}


renderContent(data) {
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
			${this.renderProduct(data.product)}
			${this.renderEngagement(data.engagement)}
			${this.renderTags(data.tags)}
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

		const { type, media, ribbon, sticker, content, actions, tags, authors, engagement, product, popover } = this.#data;

		this.#root.innerHTML = `
			${this.renderMedia(media, ribbon, sticker)}
			${content ? this.renderContent(this.#data) : ''}
			${this.renderPopover(this.#data)}
		`;
	}


}

customElements.define('content-card', ContentCard);

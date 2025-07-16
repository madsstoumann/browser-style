class ItemCard extends HTMLElement {
	#data; #root; #settings; #popoverId;

	static get observedAttributes() {
		return ['data', 'settings'];
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
	}

	connectedCallback() {
		this._ensureSettingsInitialized();
	}

	renderImage(image) {
		if (!image?.src) return '';
		return `<img 
			${this.getStyle('ic-media-image')} 
			src="${image.src}" 
			${image.srcset ? `srcset="${image.srcset}"` : ''}
			alt="${image.alt || ''}" 
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
			${this.getStyle('ic-media-youtube')}
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
		const baseStyle = this.getStyle('ic-ribbon').slice(0, -1); // remove closing quote

		return `<div ${baseStyle}${styleClass}" role="status" ${styleAttr}>
			${ribbon.icon ? `<span class="ic-ribbon-icon">${ribbon.icon}</span>` : ''}
			${ribbon.text}
		</div>`;
	}

	renderSticker(sticker) {
		if (!sticker?.text) return '';
		return `<span ${this.getStyle('ic-sticker')} role="status">${sticker.text}</span>`;
	}

	renderMedia(media, ribbon, sticker) {
		this._ensureSettingsInitialized();
		if (!media?.sources?.length) return '';
		return `
		<figure ${this.getStyle('ic-media')}>
			${this.renderRibbon(ribbon)}
			${this.renderSticker(sticker)}
			${media.sources
				.map((entry) => {
					if (entry.type === 'image') return this.renderImage(entry)
					if (entry.type === 'video') return this.renderVideo(entry)
					if (entry.type === 'youtube') return this.renderYouTube(entry)
				})
				.join('')}
			${media.caption ? `<figcaption ${this.getStyle('ic-media-caption')}>${media.caption}</figcaption>`: ''}
		</figure>`
	}

	renderVideo(video) {
		this._ensureSettingsInitialized();
		if (!video?.src) return '';
		const opts = video.options || {};
		return `<video ${this.getStyle('ic-media-video')} src="${video.src}"
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
					content = `<div class="ic-popover-article">${popoverData.content}</div>`;
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
				let style = this.getStyle(`ic-action-${a.role || 'link'}`);
				if (a.isWrapper) {
					style = style.slice(0, -1) + ' ic-wrapper"';
				}
				return `<a href="${a.url}" ${style} ${a.ariaLabel ? `aria-label="${a.ariaLabel}"` : ''}>
						${a.icon ? `<span ${this.getStyle('ic-action-icon')}>${a.icon}</span>` : ''}${a.text}
					</a>`;
			}
			return `<button type="button" ${this.getStyle(`ic-action-${a.role || 'button'}`)} ${a.ariaLabel ? `aria-label="${a.ariaLabel}"` : ''} ${popoverAttrs}>
						${a.icon ? `<span ${this.getStyle('ic-action-icon')}>${a.icon}</span>` : ''}${a.text}
					</button>`;
		}
		return `
			<div ${this.getStyle('ic-actions')}>
				${actions.primary?.map(a => renderBtn({...a, role: 'primary'})).join('') || ''}
				${actions.secondary?.map(a => renderBtn({...a, role: 'secondary'})).join('') || ''}
			</div>
		`;
	}

	renderTags(tags) {
		if (!tags?.length) return '';
		return `
			<ul ${this.getStyle('ic-tags')}>
				${tags.map(tag =>
					`<li><a href="${tag.url}" ${this.getStyle('ic-tag')}>${tag.name}</a></li>`
				).join('')}
			</ul>
		`;
	}

	renderAuthors(authors) {
		this._ensureSettingsInitialized();
		if (!authors?.length) return '';
		return `
			<div ${this.getStyle('ic-authors')}>
				${authors.map(author => `
					<address ${this.getStyle('ic-author')}>
						<a href="${author.url || '#'}" ${this.getStyle('ic-author-link')}>
							${author.avatar ? `<img src="${author.avatar.src}" alt="${author.avatar.alt || author.name}" width="${author.avatar.width}" height="${author.avatar.height}" ${this.getStyle('ic-avatar')}>` : ''}
							<span ${this.getStyle('ic-author-name')}>${author.name}</span>
						</a>
						${author.role ? `<span ${this.getStyle('ic-author-role')}>${author.role}</span>` : ''}
						${author.contacts?.map(c =>
							`<a href="${c.type === 'email' ? `mailto:${c.value}` : c.value}" ${this.getStyle('ic-contact')}>${c.label}</a>`
						).join('') || ''}
					</address>
				`).join('')}
			</div>
		`;
	}

	renderEngagement(engagement) {
		if (!engagement) return '';
		return `
			<div ${this.getStyle('ic-engagement')}>
				${engagement.reactions?.map(r =>
					`<button type="button"
						${this.getStyle('ic-reaction')}
						${r.ariaLabel ? `aria-label="${r.ariaLabel}"` : ''}
						${r.active ? 'aria-pressed="true"' : ''}
					>
						${r.icon ? `<span ${this.getStyle('ic-reaction-icon')}>${r.icon}</span>` : ''} 
						${r.count}
					</button>`
				).join('') || ''}
				${typeof engagement.commentCount === 'number' ? `<span ${this.getStyle('ic-comments')}>${engagement.commentCount} comments</span>` : ''}
				${typeof engagement.shareCount === 'number' ? `<span ${this.getStyle('ic-shares')}>${engagement.shareCount} shares</span>` : ''}
				${typeof engagement.viewCount === 'number' ? `<span ${this.getStyle('ic-views')}>${engagement.viewCount} views</span>` : ''}
			</div>
		`;
	}

	renderMeta(content) {
		if (!content) return '';
		const hasPublished = content.published && (content.published.datetime || content.published.formatted);
		const hasModified = content.modified && (content.modified.datetime || content.modified.formatted);
		const hasReadingTime = content.readingTime;

		if (!hasPublished && !hasReadingTime && !hasModified) return '';

		return `
			<div ${this.getStyle('ic-meta')}>
				${hasPublished ? `<time ${this.getStyle('ic-published')} datetime="${content.published.datetime}">${content.published.formatted || content.published.relative}</time>` : ''}
				${hasModified ? `<small ${this.getStyle('ic-modified')}> (Updated: <time datetime="${content.modified.datetime}">${content.modified.formatted || content.modified.relative}</time>)</small>` : ''}
				${hasReadingTime ? `<span ${this.getStyle('ic-reading-time')}>${content.readingTime}</span>` : ''}
			</div>
		`;
	}

	renderProduct(product) {
		this._ensureSettingsInitialized();
		if (!product) return '';
		const price = product.price || {};
		const rating = product.rating || {};

		return [
			(price.current ? `<div ${this.getStyle('ic-product-price')}>
					<span>${price.currency || ''} ${price.current}</span>
					${price.original && price.original > price.current ? `<del ${this.getStyle('ic-product-price-original')}>${price.currency || ''} ${price.original}</del>` : ''}
					${price.discountText ? `<span ${this.getStyle('ic-product-discount')}>${price.discountText}</span>` : ''}
				</div>` : ''),
			(product.availability ? `<span ${this.getStyle('ic-product-availability')}>${product.availability}</span>` : ''),
			(product.validUntil ? `<span ${this.getStyle('ic-product-validity')}>Offer valid until ${product.validUntil}</span>` : ''),
			(rating.value ? `<span ${this.getStyle('ic-product-rating')}>
					${'★'.repeat(Math.round(rating.value))}${'☆'.repeat((rating.starCount || 5) - Math.round(rating.value))}
					(${rating.value} / ${rating.starCount || 5}, ${rating.count} ratings)
				</span>` : '')
		].filter(Boolean).join('');
	}

	renderContent(data) {
		const content = data.content || {};
		const published = content.published?.formatted || '';
		const headlineTag = content.headlineTag || 'h2';

		return `
			<div ${this.getStyle('ic-content')}>
				${content.category ? `<p ${this.getStyle('ic-category')}>${content.category}</p>` : ''}
				${content.headline ? `<${headlineTag} ${this.getStyle('ic-headline')}>${content.headline}</${headlineTag}>` : ''}
				${content.subheadline ? `<p ${this.getStyle('ic-subheadline')}>${content.subheadline}</p>` : ''}
				${content.summary ? `<p ${this.getStyle('ic-summary')}>${content.summary}</p>` : ''}
				${content.text ? `<div ${this.getStyle('ic-text')}>${content.text}</div>` : ''}
				${this.renderMeta(content)}
				${this.renderProduct(data.product)}
				${this.renderEngagement(data.engagement)}
				${this.renderAuthors(data.authors)}
				${this.renderTags(data.tags)}
				${this.renderActions(data.actions)}
			</div>
		`;
	}

	render() {
		if (!this.#root) {
			this._init();
			if (!this.#root) {
				return;
			}
		}

		if (!this.#data) {
			this.#root.innerHTML = '';
			return;
		}

		this.#root.innerHTML = `
			${this.renderMedia(this.#data.media, this.#data.ribbon, this.#data.sticker)}
			${this.#data?.content ? this.renderContent(this.#data) : ''}
			${this.renderPopover(this.#data)}
		`;
	}


}

customElements.define('item-card', ItemCard);

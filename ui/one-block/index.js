const styles = `
:host {
	display: block; /* Ensure the host takes up space */
	border: 2px solid blue; /* Add a border */
	padding: 1em; /* Add some padding so content isn't touching the border */
}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class OneBlock extends HTMLElement {
	#data; #root; #settings;

	static get observedAttributes() {
		return ['data', 'settings'];
	}

	constructor() { super(); }

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
				useShadow: !this.hasAttribute('noshadow'),
			};
			this.#settings = { ...defaultSettings, ...(parsedSettings || {}) };
		}
	}

	set dataset(obj) {
		this._ensureSettingsInitialized();

		this.#data = obj?.data || {};
		const oldUseShadow = this.#settings?.useShadow;
		this.#settings = { ...this.#settings, ...(obj?.settings || {}) };

		if (this.#root && this.#settings.useShadow !== oldUseShadow) {
			this.#root = null;
		}

		this._init();
		this.render();
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

		if (this.#settings?.useShadow) {
			return `part="${name}"`;
		} else {
			let classList = name;
			if (userClass) {
				classList += ` ${userClass}`;
			}
			return `class="${classList}"`;
		}
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
			const oldUseShadow = this.#settings?.useShadow;
			this.#settings = { ...this.#settings, ...parsedSettings };

			if (this.#root && this.#settings.useShadow !== oldUseShadow) {
				this.#root = null;
			}
			this._init();
			this.render();

		} else if (attr === 'data') {
			try {
				const res = await fetch(newVal);
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
				this.#data = await res.json();
				this._init();
				this.render();
			} catch (e) {
				console.error(`Failed to fetch or process data from ${newVal}:`, e);
				this.#data = null;
				this._init();
				this.render();
			}
		}
	}

	_init() {
		this._ensureSettingsInitialized();

		if (this.#root) return;

		const useShadow = this.#settings?.useShadow ?? true;

		this.#root = useShadow ? this.attachShadow({ mode: 'open' }) : this;

		if (useShadow && this.#root instanceof ShadowRoot) {
			this.#root.adoptedStyleSheets = [sheet];
		}
	}

	connectedCallback() {
		this._ensureSettingsInitialized();
	}

	renderImage(image) {
		return ``;
	}

	renderMedia(media) {
		this._ensureSettingsInitialized();
		const type = this.getAttribute('type') || this.#settings?.type;
		return `
		<figure ${this.getStyle('ob-media')}>
			${media.sources
				.map((entry) => {
					if (entry.type === 'image') return this.renderImage(entry)
					if (entry.type === 'video') return this.renderVideo(entry)
					if (entry.type === 'youtube') return this.renderYouTube(entry)
				})
				.join('')}
			${media.caption ? `<figcaption ${this.getStyle('ob-media-caption')}>${media.caption}</figcaption>`: ''}
		</figure>`
	}

	renderVideo(video) {
		this._ensureSettingsInitialized();
		return `<video ${this.getStyle('ob-media-video')} src="${video.src.url}"
			${video.autoplay ? `autoplay playsinline` : ''}
			${video.controls ? `controls` : ''}
			${video.loop ? `loop` : ''}
			${video.muted ? `muted` : ''}
			${video.poster ? `poster="${video.poster.url}"` : ''}
			${video.preload ? `preload="${video.preload}"` : ''}
			${video.width ? `width="${video.width}"` : ''}
			${video.height ? `height="${video.height}"` : ''}
			${video.crossorigin ? `crossorigin="${video.crossorigin}"` : ''}
			preload="none"></video>`
	}

	renderActions(actions) {
		if (!actions) return '';
		const renderBtn = (a) =>
			a.type === 'link'
				? `<a href="${a.url}" ${this.getStyle(`ob-action-${a.role || 'link'}`)} ${a.ariaLabel ? `aria-label="${a.ariaLabel}"` : ''}>
						${a.icon ? `<span ${this.getStyle('ob-action-icon')}>${a.icon}</span>` : ''}${a.text}
					</a>`
				: `<button type="button" ${this.getStyle(`ob-action-${a.role || 'button'}`)} ${a.ariaLabel ? `aria-label="${a.ariaLabel}"` : ''}>
						${a.icon ? `<span ${this.getStyle('ob-action-icon')}>${a.icon}</span>` : ''}${a.text}
					</button>`;
		return `
			<div ${this.getStyle('ob-actions')}>
				${actions.primary?.map(a => renderBtn({...a, role: 'primary'})).join('') || ''}
				${actions.secondary?.map(a => renderBtn({...a, role: 'secondary'})).join('') || ''}
			</div>
		`;
	}

	renderTags(tags) {
		if (!tags?.length) return '';
		return `
			<ul ${this.getStyle('ob-tags')}>
				${tags.map(tag =>
					`<li><a href="${tag.url}" ${this.getStyle('ob-tag')}>${tag.name}</a></li>`
				).join('')}
			</ul>
		`;
	}

	renderAuthors(authors) {
		this._ensureSettingsInitialized();
		if (!authors?.length) return '';
		return `
			<address ${this.getStyle('ob-authors')}>
				${authors.map(author => `
					${author.avatar ? `<img src="${author.avatar.src}" alt="${author.avatar.alt || author.name}" width="${author.avatar.width}" height="${author.avatar.height}" ${this.getStyle('ob-avatar')}>` : ''}
					<span ${this.getStyle('ob-author')}>${author.name}</span>
					${author.contacts?.map(c =>
						`<a href="${c.type === 'email' ? `mailto:${c.value}` : c.value}" ${this.getStyle('ob-contact')}>${c.label}</a>`
					).join('') || ''}
				`).join('')}
			</address>
		`;
	}

	renderEngagement(engagement) {
		if (!engagement) return '';
		return `
			<div ${this.getStyle('ob-engagement')}>
				${engagement.reactions?.map(r =>
					`<button type="button"
						${this.getStyle('ob-reaction')}
						${r.ariaLabel ? `aria-label="${r.ariaLabel}"` : ''}
						${r.active ? 'aria-pressed="true"' : ''}
					>
						${r.icon ? `<span ${this.getStyle('ob-reaction-icon')}>${r.icon}</span>` : ''} 
						${r.count}
					</button>`
				).join('') || ''}
				${typeof engagement.commentCount === 'number' ? `<span ${this.getStyle('ob-comments')}>${engagement.commentCount} comments</span>` : ''}
				${typeof engagement.shareCount === 'number' ? `<span ${this.getStyle('ob-shares')}>${engagement.shareCount} shares</span>` : ''}
				${typeof engagement.viewCount === 'number' ? `<span ${this.getStyle('ob-views')}>${engagement.viewCount} views</span>` : ''}
			</div>
		`;
	}

	renderProduct(product) {
		this._ensureSettingsInitialized();
		if (!product) return '';
		const price = product.price || {};
		const rating = product.rating || {};

		return `
			<section ${this.getStyle('ob-product')}>
				<h4 ${this.getStyle('ob-product-name')}>${product.name}</h4>
				${price.current ? `<div ${this.getStyle('ob-product-price')}>
					<spa>${price.currency || ''} ${price.current}</span>
					${price.original && price.original > price.current ? `<del ${this.getStyle('ob-product-price-original')}>${price.currency || ''} ${price.original}</del>` : ''}
					${price.discountText ? `<span ${this.getStyle('ob-product-discount')}>${price.discountText}</span>` : ''}
				</div>` : ''}
				${product.availability ? `<span ${this.getStyle('ob-product-availability')}>${product.availability}</span>` : ''}
				${rating.value ? `<span ${this.getStyle('ob-product-rating')}>
					${'★'.repeat(Math.round(rating.value))}${'☆'.repeat((rating.starCount || 5) - Math.round(rating.value))}
					(${rating.value} / ${rating.starCount || 5}, ${rating.count} ratings)
				</span>` : ''}
			</section>
		`;
	}

	renderContent(data) {
		this._ensureSettingsInitialized();
		const content = data.content || {};
		const type = this.getAttribute('type') || this.#settings?.type;
		return `
			<article ${this.getStyle('ob-content')}>
				${content.category ? `<strong ${this.getStyle('ob-tagline')}>${content.category}</strong>` : ''}
				${content.headline ? `<h2 ${this.getStyle('ob-headline')}>${content.headline}</h2>` : ''}
				${content.subheadline ? `<h3 ${this.getStyle('ob-subheadline')}>${content.subheadline}</h3>` : ''}
				${content.summary ? `<p ${this.getStyle('ob-summary')}>${content.summary}</p>` : ''}
				${content.text ? `<div ${this.getStyle('ob-text')}>${content.text}</div>` : ''}
				${this.renderAuthors(data.authors)}
				${this.renderTags(data.tags)}
				${this.renderEngagement(data.engagement)}
				${this.renderProduct(data.product)}
				${this.renderActions(data.actions)}
			</article>
		`;
	}

	render() {
		//${this.#data?.media ? this.renderMedia(this.#data.media) : ''} 
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
			
			${this.#data?.content ? this.renderContent(this.#data) : ''}
		`;
	}
}

customElements.define('one-block', OneBlock);

export default class DevTo extends HTMLElement {
	static CONFIG = {
		LANG: 'en',
		ITEMS_PER_PAGE: 30,
		ENDPOINTS: {
			USER_ARTICLES: (username, page, perPage, baseUrl) =>
				baseUrl
					? `${baseUrl}/articles.json`
					: `https://dev.to/api/articles?username=${username}&page=${page}&per_page=${perPage}`,
			SINGLE_ARTICLE: (id, baseUrl) =>
				baseUrl
					? `${baseUrl}/articles/${id}.json`
					: `https://dev.to/api/articles/${id}`
		},
		I18N: {
			en: {
				more: 'More &hellip;',
				reactions: 'reactions'
			}
		}
	};

	static observedAttributes = ['author', 'article', 'theme', 'itemsperpage', 'lang', 'i18n', 'baseurl'];

	#articles = [];
	#currentPage = 1;
	#isLoading = false;
	#root;
	#abortController;
	#updateTimeout;
	#dateFormatter;
	#i18n = DevTo.CONFIG.I18N;
	#lang = DevTo.CONFIG.LANG;
	
	constructor() {
		super();
		this.#root = this.hasAttribute('noshadow') ? this : this.attachShadow({ mode: 'open' });
		this.#loadStyles();
		window.addEventListener('popstate', () => {
			const url = new URL(window.location.href);
			const articleId = url.searchParams.get('article');
			const pageNum = url.searchParams.get('page');

			if (articleId) {
				this.setAttribute('article', articleId);
			} else {
				this.removeAttribute('article');
				const savedPage = pageNum ? parseInt(pageNum, 10) : 1;
				if (this.#articles.length > 0) {
					// We have cached articles, re-render up to the saved page
					this.#currentPage = savedPage;
					const end = this.#currentPage * this.itemsPerPage;
					const articlesToShow = this.#articles.slice(0, end);
					this.renderArticlesList(articlesToShow, true);
					// Re-add More button if there are more articles
					if (end < this.#articles.length) {
						const btn = document.createElement('button');
						btn.part = 'more';
						btn.innerHTML = this.t('more');
						btn.addEventListener('click', async () => {
							btn.disabled = true;
							this.#currentPage++;
							await this.#fetchArticles(this.getAttribute('author'));
						});
						this.#root.appendChild(btn);
					}
				} else {
					this.#currentPage = savedPage;
					this.updateContent();
				}
			}
		});
	}

	async #loadStyles() {
		try {
			const cssPath = new URL('./index.css', import.meta.url).href;
			// Try CSS module import first (modern browsers)
			const styleSheet = await import('./index.css', { with: { type: 'css' } })
				.catch(() => null);

			if (styleSheet?.default instanceof CSSStyleSheet) {
				this.#root.adoptedStyleSheets = [styleSheet.default];
				return;
			}

			// Fallback: fetch and construct CSSStyleSheet
			const response = await fetch(cssPath);
			const css = await response.text();
			
			if ('adoptedStyleSheets' in this.#root && typeof CSSStyleSheet !== 'undefined') {
				const sheet = new CSSStyleSheet();
				sheet.replaceSync(css);
				this.#root.adoptedStyleSheets = [sheet];
			} else {
				// Final fallback: inject style tag directly (older browsers)
				const style = document.createElement('style');
				style.textContent = css;
				this.#root.appendChild(style);
			}
		} catch (error) {
			console.warn('Could not load styles:', error);
		}
	}

	async connectedCallback() {
		try {
			const i18nAttr = this.getAttribute('i18n');
			if (i18nAttr) this.#i18n = JSON.parse(i18nAttr);
		} catch(e) {
			console.warn('Invalid i18n JSON:', e);
		}
		this.#lang = this.getAttribute('lang') || DevTo.CONFIG.LANG;
		this.#dateFormatter = new Intl.DateTimeFormat(this.#lang, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		// Check URL for article or page parameter on initial load
		const url = new URL(window.location.href);
		const articleId = url.searchParams.get('article');
		const pageNum = url.searchParams.get('page');
		if (articleId) {
			this.setAttribute('article', articleId);
		} else if (pageNum) {
			this.#currentPage = parseInt(pageNum, 10) || 1;
		}

		await this.updateContent();
	}

	disconnectedCallback() {
		this.#cleanup();
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		
		if (name === 'author' || name === 'baseurl') {
			this.#currentPage = 1;
			this.#articles = [];
		}

		if (['author', 'article', 'lang', 'i18n', 'baseurl'].includes(name) && (name !== 'article' || newValue !== null)) {
			clearTimeout(this.#updateTimeout);
			this.#updateTimeout = setTimeout(() => this.updateContent(), 100);
		}
	}

	get itemsPerPage() {
		return Number(this.getAttribute('itemsperpage')) || DevTo.CONFIG.ITEMS_PER_PAGE;
	}

	t(key) {
		return this.#i18n[this.#lang]?.[key] || this.#i18n.en[key];
	}

	#cleanup() {
		this.#abortController?.abort();
		clearTimeout(this.#updateTimeout);
	}

	static #encode = str => str.replace(/[&<>"']/g, m => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
	})[m]);

	async updateContent() {
		if (this.#isLoading) this.#abortController?.abort();
		this.#abortController = new AbortController();
		this.#isLoading = true;

		try {
			const article = this.getAttribute('article');
			const author = this.getAttribute('author');
			
			if (article) await this.#fetchArticle(article);
			else if (author) await this.#fetchArticles(author);
		} finally {
			this.#isLoading = false;
		}
	}

	async #fetchArticles(author) {
		const baseUrl = this.getAttribute('baseurl');

		// When using baseurl and we have cached articles, paginate locally
		if (baseUrl && this.#articles.length > 0 && this.#currentPage > 1) {
			const start = (this.#currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const articles = this.#articles.slice(start, end);
			this.renderArticlesList(articles, false);

			const moreButton = this.#root.querySelector('[part~="more"]');
			const hasMore = (this.#currentPage * this.itemsPerPage) < this.#articles.length;
			if (hasMore) {
				moreButton?.removeAttribute('disabled');
			} else {
				moreButton?.remove();
			}

			// Save current page to URL so refresh loads all pages
			const url = new URL(window.location.href);
			url.searchParams.delete('article');
			if (this.#currentPage > 1) {
				url.searchParams.set('page', this.#currentPage);
			} else {
				url.searchParams.delete('page');
			}
			history.replaceState({ currentPage: this.#currentPage }, '', url);
			return;
		}

		try {
			const response = await fetch(
				DevTo.CONFIG.ENDPOINTS.USER_ARTICLES(author, this.#currentPage, this.itemsPerPage, baseUrl),
				{ signal: this.#abortController.signal }
			);
			let articles = await response.json();

			// When using baseurl, handle client-side pagination
			if (baseUrl) {
				this.#articles = articles;
				// On initial load, show all pages up to currentPage
				const end = this.#currentPage * this.itemsPerPage;
				articles = this.#articles.slice(0, end);
			} else {
				this.#articles = this.#currentPage === 1 ? articles : [...this.#articles, ...articles];
			}

			this.renderArticlesList(articles, true);

			const moreButton = this.#root.querySelector('[part~="more"]');
			const hasMore = baseUrl
				? (this.#currentPage * this.itemsPerPage) < this.#articles.length
				: articles.length >= this.itemsPerPage;

			if (hasMore) {
				if (!moreButton) {
					const btn = document.createElement('button');
					btn.part = 'more';
					btn.innerHTML = this.t('more');
					btn.addEventListener('click', async () => {
						btn.disabled = true;
						this.#currentPage++;
						await this.#fetchArticles(author);
					});
					this.#root.appendChild(btn);
				}
				moreButton?.removeAttribute('disabled');
			} else {
				moreButton?.remove();
			}

			// Save current page to URL so refresh loads all pages
			const url = new URL(window.location.href);
			url.searchParams.delete('article');
			if (this.#currentPage > 1) {
				url.searchParams.set('page', this.#currentPage);
			} else {
				url.searchParams.delete('page');
			}
			history.replaceState({ currentPage: this.#currentPage }, '', url);
		} catch (error) {
			if (error.name !== 'AbortError') console.error('Error fetching articles:', error);
		}
	}

	async #fetchArticle(id) {
		const baseUrl = this.getAttribute('baseurl');
		try {
			const response = await fetch(
				DevTo.CONFIG.ENDPOINTS.SINGLE_ARTICLE(id, baseUrl),
				{ signal: this.#abortController.signal }
			);
			const article = await response.json();
			this.renderArticle(article);
		} catch (error) {
			if (error.name !== 'AbortError') console.error('Error fetching article:', error);
		}
	}

	renderArticlesList(articles, isFirstPage = true) {
		const articlesToRender = articles.length === 0 ? this.#articles : articles;
		const list = articlesToRender.map(article => `
			<li>
				<a href="${article.url}" data-id="${article.id}">
					<img src="${article.cover_image}" alt="${DevTo.#encode(article.title)}">
				</a>
				<a href="${article.url}" data-id="${article.id}">
					${DevTo.#encode(article.title)}
					<time datetime="${article.published_timestamp}">${this.#dateFormatter.format(new Date(article.published_timestamp))}</time>
				</a>
			</li>
		`).join('');

		if (isFirstPage) {
			this.#root.innerHTML = `
				<header part="list-header">
					<slot name="headline"></slot>
					<slot name="description"></slot>
				</header>
				<ul part="list">${list}</ul>`;
			this.#root.querySelector('ul').addEventListener('click', e => {
				const link = e.target.closest('a');
				if (link && this.getAttribute('links') !== 'external') {
					e.preventDefault();
					this.setAttribute('article', link.dataset.id);
				}
			});
			if (articles.length === 0 && this.#articles.length >= this.itemsPerPage) {
				const btn = document.createElement('button');
				btn.part = 'more';
				btn.innerHTML = this.t('more');
				btn.addEventListener('click', async () => {
					btn.disabled = true;
					this.#currentPage++;
					await this.#fetchArticles(this.getAttribute('author'));
				});
				this.#root.appendChild(btn);
			}
		} else {
			const ul = this.#root.querySelector('ul');
			if (ul) ul.insertAdjacentHTML('beforeend', list);
		}
	}

	renderArticle(article) {
		const date = new Date(article.published_timestamp);
		this.#root.innerHTML = `
			<header>
				<time datetime="${date.toISOString()}">${this.#dateFormatter.format(date)}</time>
				<h1>${DevTo.#encode(article.title)}</h1>
				<img src="${article.cover_image}" alt="${DevTo.#encode(article.title)}" part="cover">
			</header>
			<address>
				<img src="${article.user.profile_image_90}" alt="${DevTo.#encode(article.user.name)}" part="avatar">
				<div>
					<strong>${DevTo.#encode(article.user.name)}</strong>
					<small>${article.public_reactions_count} ${this.t('reactions')}</small>
					<ul>${article.tags.map(tag => `<li>${DevTo.#encode(tag)}</li>`).join('')}</ul>
				</div>
			</address>
			<article>${article.body_html}</article>
		`;

		const url = new URL(window.location.href);
		url.searchParams.delete('page');
		url.searchParams.set('article', article.id);
		history.pushState({ articleId: article.id, previousPage: this.#currentPage }, article.title, url);
	}
}

customElements.define('dev-to', DevTo);
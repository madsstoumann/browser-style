const DEV_TO_ENDPOINTS = {
	USER_ARTICLES: (username) => `https://dev.to/api/articles?username=${username}`,
	SINGLE_ARTICLE: (id) => `./article.json`
	// SINGLE_ARTICLE: (id) => `https://dev.to/api/articles/${id}`
};

const styles = new CSSStyleSheet();
styles.replaceSync(`
	/* Base Styles */
	:host {
		--ff-antique: Superclarendon, 'Bookman Old Style', 'URW Bookman', 'URW Bookman L', 'Georgia Pro', Georgia, serif;
		--ff-classical: Optima, Candara, 'Noto Sans', source-sans-pro, sans-serif;
		--ff-didone: Didot, 'Bodoni MT', 'Noto Serif Display', 'URW Palladio L', P052, Sylfaen, serif;
		--ff-geometric: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif;
		--ff-handwritten: 'Segoe Print', 'Bradley Hand', Chilanka, TSCu_Comic, casual, cursive;
		--ff-humanist: Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif;
		--ff-inustrial: Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif;
		--ff-monospace-code: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
		--ff-monospace-slab: 'Nimbus Mono PS', 'Courier New', monospace;
		--ff-neo-grotesque: Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif;
		--ff-oldstyle: 'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif;
		--ff-rounded: ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri, source-sans-pro, sans-serif;
		--ff-slab: Rockwell, 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small', serif;
		--ff-system: system-ui, sans-serif;
		--ff-transitional: Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif;

		--gray-light: #e2e2e2;
		--gray-text: #aaa;

		background: Canvas;
		color: CanvasText;
		color-scheme: light dark;
		display: grid;
		row-gap: 1rlh;
		// width: 100%;
	}
	
	:host * {
		box-sizing: border-box;
	}

	:host::part(cover) {
  	aspect-ratio: 1000 / 420;
		width: 100%;
	}

	img {
		max-width: 100%;
	}

	.js-actions-panel {
		display: none;
	}


	/* Classic Theme */

	:host([theme="classic"]) {
		font-family: var(--ff-transitional);
		font-size: clamp(0.9375rem, 0.5469rem + 1.25vw, 1.25rem);
		line-height: 1.6;

		address {
			align-items: center;
			display: grid;
			font-family: var(--ff-geometric);
			font-style: normal;
			gap: 2ch;
			grid-template-columns: max-content 1fr;

			small {
				color: var(--gray-text);
			}
			
			ul {
				all: unset;
				display: grid;
				font-size: small;
				gap: 1ch;
				grid-auto-flow: column;
				justify-content: start;
				list-style: none;
				padding-inline: 0;

				li {
					background: light-dark(#f8f8f8, #333);
					border-radius: 0.25em;
					padding: 0.25em 0.5em;
				}
			}
		}

		article {
			p:first-of-type::first-letter {
				font-family: var(--ff-didone);
				initial-letter: 3.5 4;
				margin-inline-end: 1ch;
			}
		}

		code {
			background: light-dark(#f8f8f8, #333);
			font-family: var(--ff-monospace-code);
			font-size: 0.75em;
		}
		
		header {
			display: contents;
		}

		h1 { 
			font-family: var(--ff-didone);
			font-size: clamp(4rem, 0.25rem + 12vw, 7rem);
			letter-spacing: -0.025em;
			line-height: 1.2;
			margin-block-end: .335em;
			margin-inline: auto;
			max-inline-size: 15ch;
			padding-inline: .25ch;
			text-wrap: balance;
			text-align: center;
		}

		hr {
		  border: double var(--gray-light);
  		border-width: 4px 0 0;
  		margin-block: .5rlh;
		}

		pre {
			background: light-dark(#f8f8f8, #333);
			border-radius: 0.25em;
			line-height: 1.4;
			padding: .5ch 1ch;
			white-space: pre-wrap;
		}

		time {
			color: var(--gray-text);
			font-family: var(--ff-geometric);
			font-weight: 100;
			letter-spacing: 0.05em;
			margin-block-start: 1rlh;
			text-align: center;
			text-transform: uppercase;
		}
	}

	address, article {
		inline-size: 100%;
		max-inline-size: 66ch;
		margin-inline: auto;
		padding-inline: 2ch;
	}

	:host([theme="classic"]) h1::after {
		background-color: currentColor;	
		content: '';
		display: block;
		height: .0625em;
		margin-block-start: .335em;
		margin-inline: auto;
		width: 35%;
	}

	:host([theme="classic"])::part(avatar) {
		border: 1px solid var(--gray-light);
		border-radius: 50%;
		width: 4em;
	}
`);

class DevTo extends HTMLElement {
	#abortController;
	#defaultLang = 'en';
	#isLoading = false;
	#root;
	#updateTimeout;
	
	static get observedAttributes() {
		return ['author', 'article', 'theme'];
	}

	constructor() {
		super();
		this.#root = this.hasAttribute('noshadow') ? this : this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
	}

	disconnectedCallback() {
		this.#abortController?.abort();
		clearTimeout(this.#updateTimeout);
	}

	async connectedCallback() {
		await this.updateContent();
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && (name === 'author' || name === 'article')) {
			clearTimeout(this.#updateTimeout);
			this.#updateTimeout = setTimeout(() => this.updateContent(), 100);
		}
	}

	async updateContent() {
		if (this.#isLoading) {
			this.#abortController?.abort();
		}
		
		this.#abortController = new AbortController();
		this.#isLoading = true;

		const author = this.getAttribute('author');
		const article = this.getAttribute('article');

		try {
			if (article) {
				await this.fetchArticle(article);
			} else if (author) {
				await this.fetchArticles(author);
			}
		} finally {
			this.#isLoading = false;
		}
	}

	async fetchArticles(author) {
		try {
			const response = await fetch(
				DEV_TO_ENDPOINTS.USER_ARTICLES(author), 
				{ signal: this.#abortController.signal }
			);
			const articles = await response.json();
			this.renderArticlesList(articles);
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error fetching articles:', error);
			}
		}
	}

	async fetchArticle(id) {
		try {
			const response = await fetch(
				DEV_TO_ENDPOINTS.SINGLE_ARTICLE(id), 
				{ signal: this.#abortController.signal }
			);
			const article = await response.json();
			this.renderArticle(article);
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error fetching article:', error);
			}
		}
	}

	renderArticlesList(articles) {
		const list = articles.map(article => `
			<li>
				<a href="#" data-id="${article.id}">${article.title}</a>
				<p>${article.description}</p>
			</li>
		`).join('');

		this.#root.innerHTML = `<ul>${list}</ul>`;

		this.#root.querySelectorAll('a').forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const id = e.target.dataset.id;
				this.setAttribute('article', id);
			});
		});
	}

	#formatDate(dateString) {
		const date = new Date(dateString);
		const lang = this.getAttribute('lang') || this.#defaultLang;
		
		return {
			datetime: date.toISOString(),
			formatted: new Intl.DateTimeFormat(lang, {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			}).format(date)
		};
	}

	renderArticle(article) {
		const { datetime, formatted } = this.#formatDate(article.published_timestamp);
		this.#root.innerHTML = `
			<header>
				<time datetime="${datetime}">${formatted}</time>
				<h1>${article.title}</h1>
				<img src="${article.cover_image}" alt="${article.title}" part="cover">
			</header>

			<address>
				<img src="${article.user.profile_image_90}" alt="${article.user.name}" part="avatar">
				<div>
					<strong>${article.user.name}</strong>
					<small>${article.user.website_url}</small>
					<ul>${article.tags.map(tag => `<li>${tag}</li>`).join('')}</ul>
				</div>
			</address>

			<article>
				${article.body_html}
			</article>
		`;
	}
}

customElements.define('dev-to', DevTo);
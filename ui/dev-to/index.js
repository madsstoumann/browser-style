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


		/* List of Articles */
		ul[part="list"] {
			container-type: inline-size;
			display: grid;
			gap: 1rlh;
			margin-inline: auto;
			max-width: 900px;
			padding: 0;
			width: 100%;

			a {
				color: inherit;
				text-decoration: none;
			}

			img {
				border: 1px solid var(--gray-light);
			}

			li {
				display: grid;
				font-size: clamp(0.875rem, 0.5625rem + 1.6667vw, 1.5rem);
				gap: 1ch;
				grid-template-columns: 20cqi 1fr;
			}

			time {
			color: var(--gray-text);
			display: block;
			font-family: var(--ff-geometric);
			font-size: small;
			}
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

	/* More Button */
	:host::part(more) {
		background: light-dark(#f8f8f8, #333);
		border: 1px solid var(--gray-light);
		border-radius: 0.25em;
		cursor: pointer;
		display: block;
		font-family: inherit;
		font-size: 1em;
		margin: 2rem auto;
		padding: 0.5em 1em;
	}
	:host::part(more):disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Back Button */
	:host::part(back) {
		all: unset;
		cursor: pointer;
		display: none;
		text-align: center;
	}
	:host([links~="internal"])::part(back) {
		display: block;
	}
`);

// Constants
const ENDPOINTS = {
  USER_ARTICLES: (username, page, perPage) => 
    `https://dev.to/api/articles?username=${username}&page=${page}&per_page=${perPage}`,
  SINGLE_ARTICLE: (id) => `https://dev.to/api/articles/${id}`
};

const ELEMENTS = {
  BACK_BUTTON: ({ onClick }) => {
    const btn = document.createElement('button');
    btn.part = 'back';
    btn.innerHTML = '&larr; Back to Articles';
    btn.addEventListener('click', onClick);
    return btn;
  },
  MORE_BUTTON: ({ label, onClick }) => {
    const btn = document.createElement('button');
    btn.part = 'more';
    btn.innerHTML = label;
    btn.addEventListener('click', onClick);
    return btn;
  }
};

const DEFAULTS = {
  LANG: 'en',
  LIST_LABEL: 'More &hellip;',
  ITEMS_PER_PAGE: 30
};

class DevTo extends HTMLElement {
  #articles = [];
  #currentPage = 1;
  #isLoading = false;
  #root;
  #abortController;
  #updateTimeout;

  static get observedAttributes() {
    return ['author', 'article', 'theme', 'itemsperpage'];
  }

  constructor() {
    super();
    this.#root = this.hasAttribute('noshadow') ? this : this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];
  }

  get itemsPerPage() {
    return Number(this.getAttribute('itemsperpage')) || DEFAULTS.ITEMS_PER_PAGE;
  }

  get listLabel() {
    return this.getAttribute('list-label') || DEFAULTS.LIST_LABEL;
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  async connectedCallback() {
    await this.updateContent();
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'author') {
      this.#currentPage = 1;
      this.#articles = [];
    }
    
    if (name === 'author' || (name === 'article' && newValue !== null)) {
      clearTimeout(this.#updateTimeout);
      this.#updateTimeout = setTimeout(() => this.updateContent(), 100);
    }
  }

  #cleanup() {
    this.#abortController?.abort();
    clearTimeout(this.#updateTimeout);
  }

  async updateContent() {
    if (this.#isLoading) {
      this.#abortController?.abort();
    }
    
    this.#abortController = new AbortController();
    this.#isLoading = true;

    try {
      const article = this.getAttribute('article');
      const author = this.getAttribute('author');
      
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
        ENDPOINTS.USER_ARTICLES(author, this.#currentPage, this.itemsPerPage),
        { signal: this.#abortController.signal }
      );
      const articles = await response.json();

      this.#articles = this.#currentPage === 1 ? articles : [...this.#articles, ...articles];
      this.renderArticlesList(articles, this.#currentPage === 1);
      
      const moreButton = this.#root.querySelector('[part~="more"]');
      if (articles.length >= this.itemsPerPage) {
        if (!moreButton) this.#addMoreButton();
        moreButton?.removeAttribute('disabled');
      } else {
        moreButton?.remove();
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Error fetching articles:', error);
    }
  }

  async fetchArticle(id) {
    try {
      const response = await fetch(
        ENDPOINTS.SINGLE_ARTICLE(id),
        { signal: this.#abortController.signal }
      );
      const article = await response.json();
      this.renderArticle(article);
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Error fetching article:', error);
    }
  }

  #addMoreButton() {
    const button = ELEMENTS.MORE_BUTTON({
      label: this.listLabel,
      onClick: async () => {
        button.disabled = true;
        this.#currentPage++;
        await this.fetchArticles(this.getAttribute('author'));
      }
    });
    this.#root.appendChild(button);
  }

  #formatDate(dateString) {
    const date = new Date(dateString);
    const lang = this.getAttribute('lang') || DEFAULTS.LANG;
    
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

  renderArticlesList(articles, isFirstPage = true) {
    const encode = str => str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);

    const articlesToRender = articles.length === 0 ? this.#articles : articles;
    const list = articlesToRender.map(article => `
      <li>
        <img src="${article.cover_image}" alt="${article.title}">
        <a href="${article.url}" target="_blank" data-id="${article.id}">
          ${encode(article.title)}
          <time datetime="${article.published_timestamp}">${this.#formatDate(article.published_timestamp).formatted}</time>
        </a>
      </li>
    `).join('');

    if (isFirstPage) {
      this.#root.innerHTML = `<ul part="list">${list}</ul>`;
      const ul = this.#root.querySelector('ul');
      
      ul.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link && this.getAttribute('links') !== 'external') {
          e.preventDefault();
          this.setAttribute('article', link.dataset.id);
        }
      });

      if (articles.length === 0 && this.#articles.length >= this.itemsPerPage) {
        this.#addMoreButton();
      }
    } else {
      const ul = this.#root.querySelector('ul');
      if (ul) {
        ul.insertAdjacentHTML('beforeend', list);
      }
    }
  }

  renderArticle(article) {
    const { datetime, formatted } = this.#formatDate(article.published_timestamp);
    
    this.#root.innerHTML = `
      <button part="back">&larr; Back to Articles</button>
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
      <article>${article.body_html}</article>
    `;
    const backBtn = this.#root.querySelector('[part="back"]');
    backBtn.addEventListener('click', () => {
      this.removeAttribute('article');
      this.renderArticlesList([], true);
    });
  }
}

customElements.define('dev-to', DevTo);
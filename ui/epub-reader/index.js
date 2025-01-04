class EpubReader extends HTMLElement {
	#db;
	#parser;
	#JSZip;
	#elements = {};
	#uid = null;
	#current = {
		id: null,
		title: 'Library'
	};

	static get observedAttributes() {
		return ['styles', 'jszip'];
	}

	static icons = {
		annotate: 'M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-11a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1m3 0v18, M13 8l2 0, M13 12l2 0',
		bookmark: 'M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z',
		close: 'M18 6l-12 12, M6 6l12 12',
		font: 'M17.5 15.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0, M3 19v-10.5a3.5 3.5 0 0 1 7 0v10.5, M3 13h7, M21 12v7',
		library: 'M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0, M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0, M3 6l0 13, M12 6l0 13, M21 6l0 13',
		list: 'M9 6l11 0, M9 12l11 0, M9 18l11 0, M5 6l0 .01, M5 12l0 .01, M5 18l0 .01',
		next: 'M9 6l6 6l-6 6',
		prev: 'M15 6l-6 6l6 6',
		search: 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0, M21 21l-6 -6'
	};

	get stylesPath() {
		return this.getAttribute('styles') || './styles.css';
	}

	get jszipPath() {
		return this.getAttribute('jszip') || 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.#initDependencies();
	}

	async #initDependencies() {
		this.#uid = crypto.getRandomValues(new Uint32Array(1))[0];
		try {
			await import(this.jszipPath);
			this.#JSZip = window.JSZip;
			this.#initDB();
			this.#initStyles();
			this.#parser = new DOMParser();
		} catch(err) {
			console.error(`Failed to load JSZip from ${this.jszipPath}:`, err);
		}
	}

	async #initStyles() {
		const sheet = new CSSStyleSheet();
		try {
			sheet.replaceSync(await (await fetch(this.stylesPath)).text());
			this.shadowRoot.adoptedStyleSheets = [sheet];
		} catch(err) {
			console.error(`Failed to load styles from ${this.stylesPath}:`, err);
		}
	}

	connectedCallback() {
		this.render();
		this.setupListeners();
	}

	render() {
		this.shadowRoot.innerHTML = `
			<header part="header">
				<button type="button" popovertarget="lib${this.#uid}">
					${this.renderIcon('library')}
				</button>
				<strong part="title">${this.#current.title}</strong>
				<nav hidden>
					<button type="button" popovertarget="toc${this.#uid}">
						${this.renderIcon('list')}
					</button>
					${this.renderIcon('search')}
					${this.renderIcon('font')}
					${this.renderIcon('annotate')}
					${this.renderIcon('bookmark')}
				</nav>
			</header>
			<main>
				<aside part="lib start" id="lib${this.#uid}" popover>
					<input type="file" accept=".epub" id="fileInput">
					<ul id="bookList"></ul>
				</aside>
				<button type="button" part="prev">
					${this.renderIcon('prev')}
				</button>
				<section part="content"></section>
				<button type="button" part="next">
					${this.renderIcon('next')}
				</button>
				<aside part="toc end" id="toc${this.#uid}" popover></aside>
			</main>
			<footer part="footer">
				<small>pagination / progress</small>
			</footer>
		`;
	}

	renderIcon(name) {
		const paths = EpubReader.icons[name];
		return paths ? `<svg viewBox="0 0 24 24" part="icon">${paths.split(',').map((path) => `<path d="${path}"></path>`).join('')}</svg>` : '';
	}

	async #initDB() {
		const request = indexedDB.open('epubReader', 1);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			db.createObjectStore('books', { keyPath: 'id' });
		};
		request.onsuccess = (event) => {
			this.#db = event.target.result;
			this.loadBookList();
		};
	}

	setupListeners() {
		this.#elements = {
			content: this.shadowRoot.querySelector(`[part="content"]`),
			file: this.shadowRoot.getElementById('fileInput'),
			lib: this.shadowRoot.querySelector(`[part~="lib"]`),
			nav: this.shadowRoot.querySelector('header nav'),
			next: this.shadowRoot.querySelector(`[part~="next"]`),
			prev: this.shadowRoot.querySelector(`[part~="prev"]`),
			title: this.shadowRoot.querySelector(`[part~="title"]`),
			toc: this.shadowRoot.querySelector(`[part~="toc"]`),
		};
		
		this.#elements.file?.addEventListener('change', this.handleFileUpload.bind(this));
		this.#elements.next?.addEventListener('click', () => {
			const content = this.#elements.content;
			const pages = Math.ceil(content.scrollWidth / content.clientWidth);
			const currentPage = Math.ceil(content.scrollLeft / content.clientWidth);
			console.log(currentPage, pages);
			content.scrollTo({
				left: Math.min((currentPage + 1) * content.clientWidth, (pages - 1) * content.clientWidth),
				behavior: 'smooth'
			});
		});
		this.#elements.toc?.addEventListener('click', (e) => {
			if (e.target.tagName === 'LI' && e.target.getAttribute('data-src')) {
				this.readPage(e.target.getAttribute('data-src'));
			}
		});
	}

	toSnakeCase(str) {
		return str
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/(^_|_$)/g, '');
	}

	// Shared parser method
	parseDocument(content, type = 'text/xml') {
		return this.#parser.parseFromString(content, type);
	}

	// Helper method for getting attributes
	getAttr(element, attr) {
		return element?.getAttribute(attr) || '';
	}

	async handleFileUpload(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		const zip = new this.#JSZip();
		const unzipped = await zip.loadAsync(await file.arrayBuffer());
		
		// Load essential files first
		const [containerXml, contentOpf] = await Promise.all([
			unzipped.file('META-INF/container.xml')?.async('text'),
			unzipped.file(this.parseContainerXml(await unzipped.file('META-INF/container.xml')?.async('text')))?.async('text')
		]);

		const bookTitle = this.parseBookTitle(contentOpf);
		const bookId = `${this.toSnakeCase(bookTitle)}_${file.size}`;
		const contentOpfPath = this.parseContainerXml(containerXml);

		// Process all files in parallel
		const files = Object.fromEntries(
			await Promise.all(
				Object.entries(unzipped.files)
					.filter(([_, file]) => !file.dir)
					.map(async ([path, file]) => [path, await file.async('base64')])
			)
		);
		
		this.storeBook({ id: bookId, name: bookTitle, files, contentOpfPath });
	}

	parseContainerXml(xml) {
		const doc = this.parseDocument(xml);
		return this.getAttr(doc.querySelector('rootfile'), 'full-path');
	}

	parseBookTitle(opf) {
		const doc = this.parseDocument(opf);
		return doc.querySelector('title')?.textContent || 'Untitled';
	}

	storeBook(bookData) {
		const transaction = this.#db.transaction(['books'], 'readwrite');
		transaction.objectStore('books').put(bookData);
		transaction.oncomplete = () => {
			this.loadBookList();
			// Clear the file input using elements reference
			this.#elements.file.value = '';
		};
	}

	async deleteBook(bookId, event) {
		event.stopPropagation(); // Prevent opening the book when clicking delete
		const transaction = this.#db.transaction(['books'], 'readwrite');
		const store = transaction.objectStore('books');
		await store.delete(bookId);
		this.loadBookList();
	}

	async loadBookList() {
		const bookList = this.shadowRoot.getElementById('bookList');
		if (!bookList) return;

		const transaction = this.#db.transaction(['books'], 'readonly');
		const store = transaction.objectStore('books');
		const request = store.getAll();

		request.onsuccess = () => {
			bookList.innerHTML = '';
			request.result.forEach(book => {
				const li = document.createElement('li');
				const titleSpan = document.createElement('span');
				titleSpan.textContent = book.name;
				li.appendChild(titleSpan);
				li.addEventListener('click', () => this.openBook(book.id));
				
				const deleteBtn = document.createElement('button');
				deleteBtn.textContent = '×';
				deleteBtn.className = 'delete-btn';
				deleteBtn.addEventListener('click', (e) => this.deleteBook(book.id, e));
				
				li.appendChild(deleteBtn);
				bookList.appendChild(li);
			});
		};
	}

	async #findBaseFolder(zip, contentOpfPath) {
		// Always use the content.opf location as source of truth
		const basePath = contentOpfPath.split('/');
		basePath.pop(); // Remove the filename
		return basePath.join('/');
	}

	async openBook(bookId) {
		this.#current.id = bookId;
		const transaction = this.#db.transaction(['books'], 'readonly');
		const store = transaction.objectStore('books');
		const request = store.get(bookId);

		request.onsuccess = async () => {
			const book = request.result;
			if (book) {
				this.#current.title = book.name;
				this.#elements.title.textContent = book.name;
				this.#elements.nav.hidden = false;
				
				const zip = new this.#JSZip();
				for (const [path, content] of Object.entries(book.files)) {
					zip.file(path, content, { base64: true });
				}
				
				// Find base folder first
				const baseFolder = await this.#findBaseFolder(zip, book.contentOpfPath);
				
				// Get first page path
				const opfContent = await zip.file(book.contentOpfPath)?.async('text');
				const doc = this.parseDocument(opfContent);
				const firstItemRef = doc.querySelector('spine itemref')?.getAttribute('idref');
				const firstItem = doc.querySelector(`manifest item[id="${firstItemRef}"]`);
				
				if (firstItem) {
					const href = firstItem.getAttribute('href');
					const fullPath = baseFolder ? `${baseFolder}/${href}` : href;
					this.renderToc(zip, book.contentOpfPath, baseFolder);
					this.readPage(fullPath);
				}
			}

			this.#elements.lib.togglePopover(false);
		};
	}

	async renderToc(zip, contentOpfPath, baseFolder) {
		try {
			const opfContent = await zip.file(contentOpfPath)?.async('text');
			const opfDoc = this.parseDocument(opfContent);
		
			// Try to find NCX file
			const tocId = opfDoc.querySelector('spine')?.getAttribute('toc');
			const tocFile = opfDoc.querySelector(`manifest item[id="${tocId}"]`)?.getAttribute('href');
			const tocPath = baseFolder ? `${baseFolder}/${tocFile}` : tocFile;
			
			let toc = '<h2>Table of Contents</h2><ul>';
		
			// Try NCX first
			if (tocPath) {
				const ncxContent = await zip.file(tocPath)?.async('text');
				const ncxDoc = this.parseDocument(ncxContent);
				const navPoints = ncxDoc.querySelectorAll('navPoint');
				
				navPoints.forEach(point => {
					const label = point.querySelector('text')?.textContent;
					const src = point.querySelector('content')?.getAttribute('src');
					if (label && src) {
						const fullPath = baseFolder ? `${baseFolder}/${src}` : src;
						toc += `<li data-src="${fullPath}">${label}</li>`;
					}
				});
			}
			
			toc += '</ul>';
			this.#elements.toc.innerHTML = toc;
		}
		catch(err) {
			console.error('Error rendering TOC:', err);
		}
	}

	async readPage(pagePath) {
		const transaction = this.#db.transaction(['books'], 'readonly');
		const store = transaction.objectStore('books');
		const request = store.get(this.#current.id);

		request.onsuccess = async () => {
			const book = request.result;
			if (book) {
				const zip = new this.#JSZip();
				for (const [path, content] of Object.entries(book.files)) {
					zip.file(path, content, { base64: true });
				}

				// Remove URL resolution since we now have full paths
				const content = await zip.file(pagePath)?.async('text');
				if (content) {
					await this.renderContent(content, zip, book.contentOpfPath);
					this.#elements.toc.togglePopover(false);
				}
			}
		};
	}

	async renderContent(content, zip, opfPath) {
		const doc = this.parseDocument(content, 'text/html');
		const basePath = opfPath.split('/').slice(0, -1).join('/');
		
		const processImages = async (selector, srcAttr) => {
			const images = doc.querySelectorAll(selector);
			if (!images.length) return;
		
			await Promise.all(Array.from(images).map(async img => {
				const src = img.getAttribute(srcAttr);
				if (!src) return;
		
				// Try all possible paths in parallel instead of sequentially
				const paths = [
					`${basePath}/${src.replace(/^\.\.\//, '')}`,
					src.replace(/^\.\.\//, ''),
					`OEBPS/${src.replace(/^\.\.\//, '')}`
				];
				
				const results = await Promise.all(
					paths.map(path => zip.file(path)?.async('base64'))
				);
				
				const imageBase64 = results.find(r => r);
				if (imageBase64) {
					const mime = /\.jpe?g$/i.test(src) ? 'image/jpeg' : 'image/png';
					const dataUrl = `data:${mime};base64,${imageBase64}`;
					
					if (srcAttr === 'xlink:href') {
						img.removeAttribute('xlink:href');
						img.setAttribute('href', dataUrl);
					} else {
						img.src = dataUrl;
					}
				}
			}));
		};
		
		await Promise.all([
			processImages('svg image', 'xlink:href'),
			processImages('img', 'src')
		]);
		
		this.#elements.content.innerHTML = doc.body.innerHTML;
	}
}

customElements.define('epub-reader', EpubReader);

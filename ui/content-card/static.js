#!/usr/bin/env node

/**
 * Static Site Generator for Content Cards
 * 
 * This script takes HTML files from /public and generates static versions in /dist
 * by server-side rendering all the content cards with their data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { launch } from 'puppeteer';
import { createServer } from 'http';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentCardStaticGenerator {
	constructor() {
		this.contentCardRoot = __dirname;
		this.publicDir = path.join(this.contentCardRoot, 'public');
		this.distDir = path.join(this.contentCardRoot, 'dist');
		this.dataFile = path.join(this.contentCardRoot, 'data.json');
		this.server = null;
		this.serverPort = 3333;
		
		// Load content data
		this.data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
		console.log(`📄 Loaded ${this.data.length} content items`);
	}

	/**
	 * Start a temporary HTTP server to serve the files
	 */
	async startServer() {
		return new Promise((resolve, reject) => {
			this.server = createServer(async (req, res) => {
				try {
					let filePath;
					const url = req.url;
					
					// Map URLs to file paths
					if (url.startsWith('/ui/content-card/public/')) {
						filePath = path.join(this.contentCardRoot, url.replace('/ui/content-card/', ''));
					} else if (url.startsWith('/ui/content-card/')) {
						filePath = path.join(this.contentCardRoot, url.replace('/ui/content-card/', ''));
					} else if (url.startsWith('/ui/layout/')) {
						filePath = path.join(this.contentCardRoot, '../layout/', url.replace('/ui/layout/', ''));
					} else if (url === '/') {
						// Default to demo.html
						filePath = path.join(this.publicDir, 'demo.html');
					} else {
						// Try to serve from public directory
						filePath = path.join(this.publicDir, url);
					}
					
					if (fs.existsSync(filePath)) {
						const content = await readFile(filePath);
						const ext = path.extname(filePath);
						const contentTypes = {
							'.html': 'text/html',
							'.js': 'text/javascript',
							'.json': 'application/json',
							'.css': 'text/css',
							'.avif': 'image/avif',
							'.png': 'image/png'
						};
						
						res.writeHead(200, { 
							'Content-Type': contentTypes[ext] || 'text/plain',
							'Access-Control-Allow-Origin': '*'
						});
						res.end(content);
					} else {
						res.writeHead(404);
						res.end('Not Found: ' + url + ' -> ' + filePath);
					}
				} catch (error) {
					console.error('Server error:', error);
					res.writeHead(500);
					res.end('Server Error');
				}
			});
			
			this.server.listen(this.serverPort, () => {
				console.log(`🌐 Temporary server started on http://localhost:${this.serverPort}`);
				resolve();
			});
			
			this.server.on('error', reject);
		});
	}

	/**
	 * Stop the temporary HTTP server
	 */
	stopServer() {
		if (this.server) {
			this.server.close();
			console.log(`🛑 Temporary server stopped`);
		}
	}

	/**
	 * Get content data by ID
	 */
	getContentById(id) {
		return this.data.find(item => item.id === id);
	}

	/**
	 * Render a content card with its data
	 */
	renderContentCard(element, contentId) {
		const data = this.getContentById(contentId);
		if (!data) {
			console.warn(`⚠️ Content not found: ${contentId}`);
			element.innerHTML = `<div style="border: 2px dashed #ff9500; padding: 1rem; color: #b7791f; background: #fff3e0;">
				⚠️ Content not found: "${contentId}"
			</div>`;
			return;
		}

		// Basic card rendering based on type
		const cardHTML = this.generateCardHTML(data);
		element.innerHTML = cardHTML;
		
		console.log(`✅ Rendered ${data.type}-card for ${contentId}`);
	}

	/**
	 * Generate HTML for a content card based on its data - matching real component output
	 */
	generateCardHTML(data) {
		const { content, media, sticker, ribbon, authors, engagement, tags, links, actions } = data;
		const useSchema = true; // Enable schema markup like the real components
		
		let html = '';
		
		// Add media if present (matching renderMedia from utils.js)
		if (media && media.sources && media.sources[0]) {
			const source = media.sources[0];
			if (source.type === 'image') {
				html += `<div class="cc-media">`;
				
				// Add sticker if present
				if (sticker) {
					html += `<div class="cc-sticker cc-sticker--${sticker.style} cc-sticker--${sticker.position}">${sticker.text}</div>`;
				}
				
				html += `<img src="${source.src}" alt="${source.alt}" loading="lazy"${useSchema ? ' itemprop="image"' : ''}>`;
				
				if (media.caption) {
					html += `<figcaption class="cc-caption">${media.caption}</figcaption>`;
				}
				
				html += `</div>`;
			}
		}
		
		// Add content section
		if (content) {
			html += '<div class="cc-content">';
			
			// Schema meta tags (like real NewsCard)
			if (useSchema) {
				if (content.category) {
					html += `<meta itemprop="articleSection" content="${content.category}">`;
				}
				if (content.published?.datetime) {
					html += `<meta itemprop="datePublished" content="${content.published.datetime}">`;
				}
				if (content.modified?.datetime) {
					html += `<meta itemprop="dateModified" content="${content.modified.datetime}">`;
				}
			}
			
			// Category
			if (content.category) {
				html += `<div class="cc-category">${content.category}</div>`;
			}
			
			// Headline
			if (content.headline) {
				const tag = content.headlineTag || 'h2';
				html += `<${tag} class="cc-headline"${useSchema ? ' itemprop="headline"' : ''}>${content.headline}`;
				if (content.subheadline) {
					html += ` <span class="cc-subheadline">${content.subheadline}</span>`;
				}
				html += `</${tag}>`;
			}
			
			// Authors (if present)
			if (authors && authors.length) {
				html += '<div class="cc-authors">';
				authors.forEach(author => {
					html += `<div class="cc-author"${useSchema ? ' itemprop="author"' : ''}>${author.name}</div>`;
				});
				html += '</div>';
			}
			
			// Summary
			if (content.summary) {
				html += `<p class="cc-summary"${useSchema ? ' itemprop="description"' : ''}>${content.summary}</p>`;
			}
			
			// Full text (if present)
			if (content.text) {
				html += `<div class="cc-text"${useSchema ? ' itemprop="articleBody"' : ''}>${content.text}</div>`;
			}
			
			// Engagement (likes, shares, etc.)
			if (engagement) {
				html += '<div class="cc-engagement">';
				if (engagement.likes) html += `<span class="cc-likes">${engagement.likes} likes</span>`;
				if (engagement.shares) html += `<span class="cc-shares">${engagement.shares} shares</span>`;
				html += '</div>';
			}
			
			// Tags
			if (tags && tags.length) {
				html += '<div class="cc-tags">';
				tags.forEach(tag => {
					html += `<span class="cc-tag">${tag}</span>`;
				});
				html += '</div>';
			}
			
			// Links
			if (links && links.length) {
				html += '<div class="cc-links">';
				links.forEach(link => {
					html += `<a href="${link.url}" class="cc-link">${link.text}</a>`;
				});
				html += '</div>';
			}
			
			// Actions
			if (actions && actions.length) {
				html += '<div class="cc-actions">';
				actions.forEach(action => {
					html += `<button class="cc-action cc-action--${action.type}">${action.label}</button>`;
				});
				html += '</div>';
			}
			
			// Published date
			if (content.published) {
				html += `<time class="cc-date" datetime="${content.published.datetime}"${useSchema ? ' itemprop="datePublished"' : ''}>
					${content.published.formatted}
				</time>`;
			}
			
			html += '</div>'; // Close cc-content
		}
		
		return html;
	}

	/**
	 * Process a single HTML file using headless browser to get actual rendered content
	 */
	async processHTMLFile(inputPath, outputPath) {
		console.log(`🔄 Processing ${path.basename(inputPath)} with headless browser...`);
		
		const browser = await launch({ 
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});
		
		try {
			const page = await browser.newPage();
			
			// Enable console logging from the page
			page.on('console', msg => {
				if (msg.type() === 'error') {
					console.error(`🔴 Browser error: ${msg.text()}`);
				}
			});
			
			// Load the file via local HTTP server
			const fileName = path.basename(inputPath);
			const pageUrl = `http://localhost:${this.serverPort}/ui/content-card/public/${fileName}`;
			console.log(`📂 Loading: ${pageUrl}`);
			
			await page.goto(pageUrl, { 
				waitUntil: 'networkidle2',
				timeout: 30000 
			});
			
			// Wait for content cards to be rendered
			console.log('⏳ Waiting for content cards to render...');
			
			// Wait for build script to complete
			await page.waitForFunction(
				() => window._cardData && document.querySelectorAll('[content]').length > 0,
				{ timeout: 15000 }
			);
			
			// Give a bit more time for all cards to render
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Get the fully rendered HTML
			let html = await page.content();
			
			// Remove build scripts from the HTML string
			html = html.replace(/<script[^>]*>[\s\S]*?import.*build\.js[\s\S]*?<\/script>/gi, '');
			html = html.replace(/<script[^>]*>[\s\S]*?initContentCards[\s\S]*?<\/script>/gi, '');
			
			// Add generation comment
			html = html.replace(
				'</head>', 
				`<!-- Generated statically on ${new Date().toISOString()} --></head>`
			);
			
			// Write the processed HTML
			fs.writeFileSync(outputPath, html);
			
			// Count rendered cards for reporting
			const cardCount = (html.match(/content="/g) || []).length;
			console.log(`✅ Generated ${path.basename(outputPath)} with ${cardCount} cards rendered`);
			
		} catch (error) {
			console.error(`❌ Error processing ${path.basename(inputPath)}:`, error.message);
			throw error;
		} finally {
			await browser.close();
		}
	}

	/**
	 * Copy assets from public to dist
	 */
	copyAssets() {
		const publicAssetsDir = path.join(this.publicDir, 'assets');
		const distAssetsDir = path.join(this.distDir, 'assets');
		
		if (fs.existsSync(publicAssetsDir)) {
			// Create assets directory in dist
			if (!fs.existsSync(distAssetsDir)) {
				fs.mkdirSync(distAssetsDir, { recursive: true });
			}
			
			// Copy all asset files
			const assets = fs.readdirSync(publicAssetsDir);
			assets.forEach(asset => {
				const srcPath = path.join(publicAssetsDir, asset);
				const destPath = path.join(distAssetsDir, asset);
				fs.copyFileSync(srcPath, destPath);
			});
			
			console.log(`📁 Copied ${assets.length} assets to dist/assets/`);
		}
	}

	/**
	 * Process HTML file with JSDOM (simpler approach)
	 */
	processHTMLFileSimple(inputPath, outputPath) {
		console.log(`🔄 Processing ${path.basename(inputPath)} with JSDOM...`);
		
		// Read the source HTML
		const htmlContent = fs.readFileSync(inputPath, 'utf8');
		
		// Create DOM
		const dom = new JSDOM(htmlContent);
		const document = dom.window.document;
		
		// Find all content cards with content attributes
		const cardSelectors = [
			'news-card[content]', 'article-card[content]', 'product-card[content]',
			'recipe-card[content]', 'quote-card[content]', 'event-card[content]',
			'faq-card[content]', 'timeline-card[content]', 'business-card[content]',
			'poll-card[content]', 'achievement-card[content]', 'announcement-card[content]',
			'booking-card[content]', 'comparison-card[content]', 'contact-card[content]',
			'course-card[content]', 'gallery-card[content]', 'job-card[content]',
			'location-card[content]', 'membership-card[content]', 'profile-card[content]',
			'review-card[content]', 'social-card[content]', 'software-card[content]',
			'statistic-card[content]'
		];
		
		let cardsProcessed = 0;
		
		cardSelectors.forEach(selector => {
			const cards = document.querySelectorAll(selector);
			cards.forEach(card => {
				const contentId = card.getAttribute('content');
				if (contentId) {
					this.renderContentCard(card, contentId);
					cardsProcessed++;
				}
			});
		});
		
		// Remove build scripts
		const allScripts = document.querySelectorAll('script');
		allScripts.forEach(script => {
			if (script.textContent.includes('build.js') || 
			    script.src?.includes('build.js') ||
			    script.textContent.includes('initContentCards')) {
				console.log(`🗑️ Removing build script`);
				script.remove();
			}
		});
		
		// Add generation comment
		const comment = document.createComment(` Generated statically on ${new Date().toISOString()} `);
		document.head.appendChild(comment);
		
		// Write the processed HTML
		const processedHTML = dom.serialize();
		fs.writeFileSync(outputPath, processedHTML);
		
		console.log(`✅ Generated ${path.basename(outputPath)} with ${cardsProcessed} cards rendered`);
	}

	/**
	 * Generate static files for all HTML files in public directory
	 */
	async generateAll() {
		console.log('🚀 Starting static site generation...');
		
		// Ensure dist directory exists
		if (!fs.existsSync(this.distDir)) {
			fs.mkdirSync(this.distDir, { recursive: true });
		}
		
		// Copy assets
		this.copyAssets();
		
		// Process all HTML files in public directory
		const publicFiles = fs.readdirSync(this.publicDir);
		const htmlFiles = publicFiles.filter(file => file.endsWith('.html'));
		
		console.log(`📄 Found ${htmlFiles.length} HTML files to process`);
		
		for (const htmlFile of htmlFiles) {
			const inputPath = path.join(this.publicDir, htmlFile);
			const outputPath = path.join(this.distDir, htmlFile);
			
			// Use simple JSDOM approach for now
			this.processHTMLFileSimple(inputPath, outputPath);
		}
		
		console.log('✨ Static site generation complete!');
		console.log(`📂 Generated files available in: ${this.distDir}`);
	}
}

// Run the generator if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const generator = new ContentCardStaticGenerator();
	generator.generateAll().catch(error => {
		console.error('❌ Static generation failed:', error);
		process.exit(1);
	});
}

export { ContentCardStaticGenerator };
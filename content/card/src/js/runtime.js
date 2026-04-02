// Reusable build script for content cards
import { applySrcsets } from '@browser.style/layout/src/srcsets.js';
import { srcsetMap, layoutConfig } from '@browser.style/layout/maps';

// Determine the base path for content-card folder relative to current location
function getBasePath() {
	return '/ui/content-card/';
}

/**
 * Normalize card data from CMS structure to flat rendering structure
 *
 * CMS structure (with type-specific data):
 * { id, headline, subheadline, summary, category, tags, media, actions, links, data: { type, product: {...}, ... } }
 *
 * CMS structure (generic content, no data property):
 * { id, headline, subheadline, summary, category, tags, media, actions, links }
 *
 * Flat rendering structure:
 * { id, type, media, actions, links, content: { headline, subheadline, summary, category, ... }, tags, ... }
 */
function normalizeCardData(item) {
	// If item has 'data' property with 'type', it's CMS format with type-specific data
	if (item.data && item.data.type) {
		const { id, headline, subheadline, summary, category, tags, media, actions, links, data } = item;
		const { type, content: dataContent, ...restData } = data;

		// Merge top-level CMS fields into content object
		const content = {
			...(dataContent || {}),
			...(headline && { headline }),
			...(subheadline && { subheadline }),
			...(summary && { summary }),
			...(category && { category })
		};

		// Use data.tags if they have URLs, otherwise use top-level tags
		const normalizedTags = (data.tags && Array.isArray(data.tags)) ? data.tags : tags;

		return {
			id,
			type,
			content,
			// Common fields from root level
			...(media && { media }),
			...(actions?.length > 0 && { actions }),
			...(links?.length > 0 && { links }),
			...(normalizedTags?.length > 0 && { tags: normalizedTags }),
			...restData
		};
	}

	// If item has root-level CMS fields but no data property, it's a generic content card
	if (item.headline || item.summary || item.subheadline) {
		const { id, headline, subheadline, summary, category, tags, media, actions, links, ...rest } = item;

		// Build content object from root-level fields
		const content = {
			...(headline && { headline }),
			...(subheadline && { subheadline }),
			...(summary && { summary }),
			...(category && { category })
		};

		return {
			id,
			// No type = generic content card
			content,
			...(media && { media }),
			...(actions?.length > 0 && { actions }),
			...(links?.length > 0 && { links }),
			...(tags?.length > 0 && { tags }),
			...rest
		};
	}

	// Already in flat format (legacy)
	return item;
}

/**
 * Normalize an array of card data
 */
function normalizeCardDataArray(dataArray) {
	return dataArray.map(normalizeCardData);
}

// Content loading function - consolidates data loading logic
function setContentForElement(element, contentId, dataArray, additionalSettings = {}) {
	try {
		if (!dataArray) {
			console.warn('No data array provided to setContentForElement');
			element.innerHTML = `<div style="border: 2px dashed #ff6b6b; padding: 1rem; color: #d63031; background: #ffe0e0;">
				❌ No data provided
			</div>`;
			return;
		}

		const data = dataArray.find(item => item.id === contentId);
		
		if (data) {
			// Merge with existing settings (which may already contain layoutIndex/layoutSrcset)
			const existingSettings = element.settings || {};
			const mergedSettings = { useSchema: true, ...existingSettings, ...additionalSettings };
			element.dataset = { data, settings: mergedSettings };
		} else {
			console.warn(`Content with id "${contentId}" not found`);
			console.log('Available IDs:', dataArray.map(item => item.id).join(', '));
			element.innerHTML = `<div style="border: 2px dashed #ff9500; padding: 1rem; color: #b7791f; background: #fff3e0;">
				⚠️ Content not found: "${contentId}"
			</div>`;
		}
	} catch (error) {
		console.error('Failed to set content for element:', error);
		element.innerHTML = `<div style="border: 2px dashed #ff6b6b; padding: 1rem; color: #d63031; background: #ffe0e0;">
			❌ Error loading content<br>
			<small>${error.message}</small>
		</div>`;
	}
}

// Import all card components from the centralized index
async function importAllCards() {
	try {
		const basePath = getBasePath();
		const allCards = await import(`${basePath}src/js/cards/index.js`);
		return allCards;
	} catch (error) {
		return {};
	}
}

async function initializeLayoutSrcsets() {
	try {
		// Use layout system's applySrcsets utility
		applySrcsets('lay-out', srcsetMap, layoutConfig);

		// Load config for additional settings
		const basePath = getBasePath();
		const config = await fetch(`${basePath}config.json`).then(r => r.json());

		// Set layout data on child elements for image priority
		const layoutElements = document.querySelectorAll('lay-out');
		layoutElements.forEach((element) => {
			Array.from(element.children).forEach((child, childIndex) => {
				child.setAttribute('data-layout-index', childIndex);

				// Set layout data in settings for BaseCard to use
				try {
					child.settings; // Triggers _ensureSettingsInitialized()
					if (child._settings) {
						child._settings.layoutIndex = childIndex;
						child._settings.srcsetBreakpoints = config.settings?.defaultSrcsetBreakpoints || [240, 320, 480, 720, 1200];
						child._settings.imageTransformConfig = config.imageTransforms;
					}
				} catch (error) {
					// Silently continue if settings can't be set
				}
			});
		});
	} catch (error) {
		// Silently fail and continue
	}
}

// Create layout position mapping for high priority image loading
function createLayoutPositionMap() {
	try {
		window._layoutPositions = new Map();
		
		let layoutPosition = 0;
		
		// Get all top-level elements in document order
		const bodyChildren = Array.from(document.body.children);
		
		bodyChildren.forEach((element) => {
			if (element.tagName.toLowerCase() === 'lay-out') {
				// Process all cards within this layout
				Array.from(element.children).forEach((child) => {
					if (child.hasAttribute('content')) {
						child.setAttribute('data-position', layoutPosition);
						window._layoutPositions.set(child, layoutPosition);
					}
				});
				layoutPosition++;
			} else if (element.hasAttribute('content')) {
				// Individual card outside layout
				element.setAttribute('data-position', layoutPosition);
				window._layoutPositions.set(element, layoutPosition);
				layoutPosition++;
			}
		});
		
	} catch (error) {
		// Silently fail and continue
	}
}

async function initializeCards(dataSrc = 'data.json', allCards = null) {
	try {
		// Use the provided path directly - supports both relative and absolute paths
		const dataPath = dataSrc;
		const rawData = await fetch(dataPath).then(r => r.json());

		// Normalize data from Contentful format to flat rendering format
		const allData = normalizeCardDataArray(rawData);

		// Store globally to avoid multiple loads
		window._cardData = allData;

		// Get card types dynamically from imported cards (use passed allCards if available)
		if (!allCards) {
			allCards = await importAllCards();
		}
		const cardTypes = Object.keys(allCards).map(className => {
			// Convert PascalCase to kebab-case (e.g., NewsCard -> news-card)
			return className.replace(/Card$/, '').replace(/([A-Z])/g, '-$1').toLowerCase().slice(1) + '-card';
		});

		// Wait for custom elements to be defined (only wait for ones that exist)
		const definedPromises = cardTypes.map(async (type) => {
			try {
				await customElements.whenDefined(type);
				return type;
			} catch {
				return null; // Element not defined, skip
			}
		});

		await Promise.all(definedPromises);

		// Load data for existing cards with content attributes
		const cardSelectors = cardTypes.map(type => `${type}[content]`);
		
		cardSelectors.forEach(selector => {
			const cards = document.querySelectorAll(selector);
			cards.forEach(card => {
				const contentId = card.getAttribute('content');
				setContentForElement(card, contentId, allData);
			});
		});
		
		// Get main container for dynamic cards (if exists)
		const main = document.querySelector('main');
		
		if (main) {
			// Collect all statically defined content IDs to avoid duplicates
			const definedContent = new Set();
			cardSelectors.forEach(selector => {
				Array.from(document.querySelectorAll(selector))
					.forEach(el => definedContent.add(el.getAttribute('content')));
			});

			allData.forEach(item => {
				if (definedContent.has(item.id)) return;

				// Determine tag name: use type if present, otherwise fallback to content-card
				let tagName;
				if (item.type) {
					tagName = `${item.type}-card`;
					if (item.type === 'video') {
						tagName = 'article-card';
					}
				} else {
					// No type means generic content card
					tagName = 'content-card';
				}

				if (!cardTypes.includes(tagName)) {
					// Fallback to content-card for unknown types
					tagName = 'content-card';
				}

				const wrapper = document.createElement('div');
				wrapper.innerHTML = `<${tagName} content="${item.id}"></${tagName}>`;
				const cardElement = wrapper.firstElementChild;
				main.appendChild(cardElement);

				setContentForElement(cardElement, item.id, allData);
			});
		}

		try {
			const basePath = getBasePath();
			const { initializePopoverToggleListeners } = await import(`${basePath}src/js/base/utils.js`);
			
			setTimeout(() => {
				initializePopoverToggleListeners();
			}, 100);
		} catch (error) {
			// Silently continue if popover listeners can't be initialized
		}

	} catch (error) {
		// Silently fail and continue
	}
}

// Add global function to update srcsets for new layout elements
function setupGlobalLayoutUpdater() {
	window.updateLayoutSrcsets = function(container = document) {
		// Use layout system's applySrcsets for dynamically added elements
		applySrcsets('lay-out:not([srcsets])', srcsetMap, layoutConfig);

		// Set layout data on child elements for image priority
		const newLayoutElements = container.querySelectorAll('lay-out');
		newLayoutElements.forEach((element) => {
			Array.from(element.children).forEach((child, childIndex) => {
				child.setAttribute('data-layout-index', childIndex);

				// Set layout data in settings for BaseCard to use
				try {
					child.settings; // Triggers _ensureSettingsInitialized()
					if (child._settings) {
						child._settings.layoutIndex = childIndex;
					}
				} catch (error) {
					// Silently continue if settings can't be set
				}
			});
		});
	};
}

// Main initialization function
// dataSrc can be a relative or absolute path (e.g., 'data/data.json', '/path/to/data.json')
export async function initContentCards(dataSrc = 'data.json') {
	
	// Import all card components once
	const allCards = await importAllCards();
	
	// Setup global layout updater
	setupGlobalLayoutUpdater();
	
	// Initialize layout srcsets first, then layout positions, then cards
	await initializeLayoutSrcsets();
	createLayoutPositionMap();
	await initializeCards(dataSrc, allCards);
	
}

// Note: No auto-initialization - must be called explicitly with desired data source
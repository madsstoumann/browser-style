// Reusable build script for content cards
// Import layout srcsets utilities
import { generateLayoutSrcsets, createLayoutsDataMap } from '@browser.style/layout';

// Import data loading utilities - this will be imported dynamically
// import { setContentForElement } from './data-loader.js';

// Determine the base path for content-card folder relative to current location
function getBasePath() {
	// Use absolute path from server root to avoid relative path issues
	const basePath = '/ui/content-card/';
	return basePath;
}

// Import all card components from the centralized index
async function importAllCards() {
	try {
		const basePath = getBasePath();
		const allCards = await import(`${basePath}cards/index.js`);
		return allCards;
	} catch (error) {
		return {};
	}
}

// Extract unique layout types from config
function extractLayoutTypes(config) {
	const layoutTypes = new Set();
	
	if (config.systems?.[0]?.breakpoints) {
		const breakpoints = config.systems[0].breakpoints;
		
		for (const breakpoint of Object.values(breakpoints)) {
			if (breakpoint.layouts) {
				for (const layout of breakpoint.layouts) {
					if (typeof layout === 'string') {
						layoutTypes.add(layout);
					} else if (typeof layout === 'object') {
						for (const layoutType of Object.keys(layout)) {
							layoutTypes.add(layoutType);
						}
					}
				}
			}
		}
	}
	
	return Array.from(layoutTypes);
}

async function initializeLayoutSrcsets() {
	try {
		
		// Load optimized local configuration
		const basePath = getBasePath();
		const config = await fetch(`${basePath}layout-config.json`).then(r => r.json());
		const layoutPath = config.settings.layoutDataPath;
		
		// Extract unique layout types from the config
		const layoutTypes = extractLayoutTypes(config);
		
		// Dynamically load only the layout data we need
		const layoutPromises = layoutTypes.map(async (layoutType) => {
			try {
				const data = await fetch(`${layoutPath}${layoutType}.json`).then(r => r.json());
				return [layoutType, data];
			} catch (error) {
				return [layoutType, null];
			}
		});
		
		const layoutResults = await Promise.all(layoutPromises);
		const layoutData = {};
		
		// Build layoutData object from results
		layoutResults.forEach(([layoutType, data]) => {
			if (data) {
				layoutData[`${layoutType}.json`] = data;
			}
		});
		

		// Store globally for card system to use
		window._layoutSrcsetData = {
			config,
			layoutsData: createLayoutsDataMap(layoutData)
		};

		// Set srcsets on all lay-out elements
		const layoutElements = document.querySelectorAll('lay-out');

		layoutElements.forEach((element) => {
			try {
				const srcsets = generateLayoutSrcsets(element, config, window._layoutSrcsetData.layoutsData);
				
				if (srcsets && srcsets !== config.settings.fallbackSrcset) {
					element.setAttribute('srcsets', srcsets);
				} else {
					element.setAttribute('srcsets', config.settings.fallbackSrcset);
				}
				
				// Set layout data on child elements
				Array.from(element.children).forEach((child, childIndex) => {
					child.setAttribute('data-layout-index', childIndex);
					
					// Set layout data in settings for BaseCard to use
					try {
						child.settings; // Triggers _ensureSettingsInitialized()
						if (child._settings) {
							child._settings.layoutIndex = childIndex;
							child._settings.layoutSrcsets = srcsets || window._layoutSrcsetData.config.settings.fallbackSrcset;
							child._settings.srcsetBreakpoints = window._layoutSrcsetData.config.settings.defaultSrcsetBreakpoints;
							
						}
					} catch (error) {
						// Silently continue if settings can't be set
					}
				});
				
			} catch (error) {
				element.setAttribute('srcsets', config.settings.fallbackSrcset);
			}
		});


	} catch (error) {
		// Silently fail and continue
	}
}

async function initializeCards(dataSrc = 'data.json', allCards = null) {
	try {
		const basePath = getBasePath();
		const dataPath = `${basePath}${dataSrc}`;
		const allData = await fetch(dataPath).then(r => r.json());
		
		// Import data loader with correct path and make it globally available
		const dataLoaderModule = await import(`${basePath}data-loader.js`);
		const { setContentForElement } = dataLoaderModule;
		
		// Store globally to avoid multiple loads
		window._cardData = allData;
		window._setContentForElement = setContentForElement;

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
				
				let tagName = `${item.type}-card`;
				
				if (item.type === 'video') {
					tagName = 'article-card';
				}
				
				if (!cardTypes.includes(tagName)) {
					return;
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
			const { initializePopoverToggleListeners } = await import(`${basePath}base/utils.js`);
			
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
		if (!window._layoutSrcsetData) return;
		
		const newLayoutElements = container.querySelectorAll('lay-out:not([srcsets])');
		
		newLayoutElements.forEach((element) => {
			try {
				const srcsets = generateLayoutSrcsets(element, window._layoutSrcsetData.config, window._layoutSrcsetData.layoutsData);
				if (srcsets && srcsets !== window._layoutSrcsetData.config.settings.fallbackSrcset) {
					element.setAttribute('srcsets', srcsets);
				}
				
				// Set layout data on child elements
				Array.from(element.children).forEach((child, childIndex) => {
					child.setAttribute('data-layout-index', childIndex);
					
					// Set layout data in settings for BaseCard to use
					try {
						child.settings; // Triggers _ensureSettingsInitialized()
						if (child._settings) {
							child._settings.layoutIndex = childIndex;
							child._settings.layoutSrcsets = srcsets || window._layoutSrcsetData.config.settings.fallbackSrcset;
							child._settings.srcsetBreakpoints = window._layoutSrcsetData.config.settings.defaultSrcsetBreakpoints;
						}
					} catch (error) {
						// Silently continue if settings can't be set
					}
				});
				
			} catch (error) {
				element.setAttribute('srcsets', window._layoutSrcsetData.config.settings.fallbackSrcset);
			}
		});
	};
}

// Main initialization function
export async function initContentCards(dataSrc = 'data.json') {
	
	// Import all card components once
	const allCards = await importAllCards();
	
	// Setup global layout updater
	setupGlobalLayoutUpdater();
	
	// Initialize layout srcsets first, then cards
	await initializeLayoutSrcsets();
	await initializeCards(dataSrc, allCards);
	
}

// Auto-initialize when imported as a module script
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initContentCards);
} else {
	initContentCards();
}
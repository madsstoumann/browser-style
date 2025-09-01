// Reusable build script for content cards
import { generateLayoutSrcsets, createLayoutsDataMap, applyCSSDefaults, getLayoutConstraints, getSrcset } from '@browser.style/layout';

// Determine the base path for content-card folder relative to current location
function getBasePath() {
	return '/ui/content-card/';
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
		const config = await fetch(`${basePath}config.json`).then(r => r.json());
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
		
		// Apply CSS custom properties if layoutRootElement is specified
		applyCSSDefaults(config);

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
				
				// Get layout constraints for this element
				const constraints = getLayoutConstraints(element, config);
				
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
							
							// Pre-calculate constraint-aware sizes
							if (constraints?.hasMaxWidth) {
								child._settings.layoutSrcset = getSrcset(child._settings.layoutSrcsets, childIndex, config, constraints);
							}
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
		const allData = await fetch(dataPath).then(r => r.json());
		
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
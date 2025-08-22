// Reusable build script for content cards
// Import layout srcsets utilities
import { generateLayoutSrcsets, createLayoutsDataMap } from '@browser.style/layout';

// Import data loading utilities - this will be imported dynamically
// import { setContentForElement } from './data-loader.js';

// Determine the base path for content-card folder relative to current location
function getBasePath() {
	// Use absolute path from server root to avoid relative path issues
	const basePath = '/ui/content-card/';
	console.log(`📁 Using absolute base path: ${basePath}`);
	return basePath;
}

// Import all card components from the centralized index
async function importAllCards() {
	try {
		const basePath = getBasePath();
		const allCards = await import(`${basePath}cards/index.js`);
		const cardNames = Object.keys(allCards);
		console.log(`📦 Imported ${cardNames.length} card components from cards/index.js`);
		console.log(`✅ Available cards: ${cardNames.join(', ')}`);
		return allCards;
	} catch (error) {
		console.error('💥 Failed to import cards from cards/index.js:', error);
		return {};
	}
}

async function initializeLayoutSrcsets() {
	try {
		console.log('🔧 Loading layout configuration...');
		
		// Load configuration and layout data
		const basePath = getBasePath();
		const layoutPath = '/ui/layout/';
		
		const [config, gridData, columnsData, bentoData, asymmetricalData, ratiosData] = await Promise.all([
			fetch(`${layoutPath}config.json`).then(r => r.json()),
			fetch(`${layoutPath}systems/layouts/grid.json`).then(r => r.json()),
			fetch(`${layoutPath}systems/layouts/columns.json`).then(r => r.json()),
			fetch(`${layoutPath}systems/layouts/bento.json`).then(r => r.json()),
			fetch(`${layoutPath}systems/layouts/asymmetrical.json`).then(r => r.json()),
			fetch(`${layoutPath}systems/layouts/ratios.json`).then(r => r.json())
		]);

		// Store globally for card system to use
		window._layoutSrcsetData = {
			config,
			layoutsData: createLayoutsDataMap({
				'grid.json': gridData,
				'columns.json': columnsData,
				'bento.json': bentoData,
				'asymmetrical.json': asymmetricalData,
				'ratios.json': ratiosData
			})
		};

		// Set srcsets on all lay-out elements
		console.log('📐 Setting layout srcsets...');
		const layoutElements = document.querySelectorAll('lay-out');
		console.log(`📊 Found ${layoutElements.length} lay-out elements`);

		layoutElements.forEach((element, index) => {
			try {
				const srcsets = generateLayoutSrcsets(element, config, window._layoutSrcsetData.layoutsData);
				
				if (srcsets && srcsets !== 'default:100vw') {
					element.setAttribute('srcsets', srcsets);
					console.log(`✅ Set srcsets for lay-out ${index + 1}:`, srcsets);
				} else {
					element.setAttribute('srcsets', 'default:100vw');
					console.log(`ℹ️  Set fallback srcsets for lay-out ${index + 1}`);
				}
				
				// Set layout data on child elements
				Array.from(element.children).forEach((child, childIndex) => {
					child.setAttribute('data-layout-index', childIndex);
					
					// Set layout data in settings for BaseCard to use
					try {
						child.settings; // Triggers _ensureSettingsInitialized()
						if (child._settings) {
							child._settings.layoutIndex = childIndex;
							child._settings.layoutSrcsets = srcsets || 'default:100vw';
							child._settings.srcsetBreakpoints = [280, 480, 900];
							
							console.log(`📍 Set layout index ${childIndex}, srcsets "${srcsets}", and breakpoints [280, 480, 900] on child ${childIndex + 1} of lay-out ${index + 1}`);
						}
					} catch (error) {
						console.warn(`⚠️ Could not set layout data on child ${childIndex + 1} of lay-out ${index + 1}:`, error);
					}
				});
				
			} catch (error) {
				console.warn(`⚠️  Failed to generate srcsets for lay-out ${index + 1}:`, error);
				element.setAttribute('srcsets', 'default:100vw');
			}
		});

		console.log('🎉 Layout srcsets complete!');

	} catch (error) {
		console.error('💥 Failed to initialize layout srcsets:', error);
	}
}

async function initializeCards() {
	try {
		console.log('🃏 Loading content data...');
		const basePath = getBasePath();
		const dataPath = `${basePath}data.json`;
		const allData = await fetch(dataPath).then(r => r.json());
		console.log(`📄 Loaded ${allData.length} content items`);
		
		// Import data loader with correct path and make it globally available
		console.log(`🔍 Base path: "${basePath}", Data loader path: "${basePath}data-loader.js"`);
		const dataLoaderModule = await import(`${basePath}data-loader.js`);
		const { setContentForElement } = dataLoaderModule;
		
		// Store globally to avoid multiple loads
		window._cardData = allData;
		window._setContentForElement = setContentForElement;

		// Define all possible card types for waiting
		const cardTypes = [
			'news-card', 'article-card', 'product-card', 'recipe-card', 'quote-card',
			'event-card', 'faq-card', 'timeline-card', 'business-card', 'poll-card',
			'achievement-card', 'announcement-card', 'booking-card', 'comparison-card',
			'contact-card', 'course-card', 'gallery-card', 'job-card', 'location-card',
			'membership-card', 'profile-card', 'review-card', 'social-card',
			'software-card', 'statistic-card'
		];

		// Wait for custom elements to be defined (only wait for ones that exist)
		const definedPromises = cardTypes.map(async (type) => {
			try {
				await customElements.whenDefined(type);
				return type;
			} catch {
				return null; // Element not defined, skip
			}
		});

		const definedElements = (await Promise.all(definedPromises)).filter(Boolean);
		console.log(`✅ ${definedElements.length} custom elements defined`);

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

			// Create dynamic cards for remaining data
			let dynamicCardsCreated = 0;
			allData.forEach(item => {
				if (definedContent.has(item.id)) return;
				
				// Map data type to custom element type
				let tagName;
				switch(item.type) {
					case 'news': tagName = 'news-card'; break;
					case 'article':
					case 'video':  // Map video to article-card
						tagName = 'article-card'; break;
					case 'poll': tagName = 'poll-card'; break;
					case 'product': tagName = 'product-card'; break;
					case 'recipe': tagName = 'recipe-card'; break;
					case 'quote': tagName = 'quote-card'; break;
					case 'event': tagName = 'event-card'; break;
					case 'faq': tagName = 'faq-card'; break;
					case 'timeline': tagName = 'timeline-card'; break;
					case 'business': tagName = 'business-card'; break;
					case 'achievement': tagName = 'achievement-card'; break;
					case 'announcement': tagName = 'announcement-card'; break;
					case 'booking': tagName = 'booking-card'; break;
					case 'comparison': tagName = 'comparison-card'; break;
					case 'contact': tagName = 'contact-card'; break;
					case 'course': tagName = 'course-card'; break;
					case 'gallery': tagName = 'gallery-card'; break;
					case 'job': tagName = 'job-card'; break;
					case 'location': tagName = 'location-card'; break;
					case 'membership': tagName = 'membership-card'; break;
					case 'profile': tagName = 'profile-card'; break;
					case 'review': tagName = 'review-card'; break;
					case 'social': tagName = 'social-card'; break;
					case 'software': tagName = 'software-card'; break;
					case 'statistic': tagName = 'statistic-card'; break;
					default:
						console.warn(`❌ Unknown card type: ${item.type} for item: ${item.id}`);
						return;
				}
				
				// Create element using innerHTML (avoids createElement issues)
				const wrapper = document.createElement('div');
				wrapper.innerHTML = `<${tagName} content="${item.id}"></${tagName}>`;
				const cardElement = wrapper.firstElementChild;
				main.appendChild(cardElement);
				
				// Use setContentForElement - layout data already set during initialization
				setContentForElement(cardElement, item.id, allData);
				dynamicCardsCreated++;
				console.log(`✅ Created ${tagName} for ${item.id}`);
			});

			console.log(`🎉 Cards initialized! ${dynamicCardsCreated} dynamic cards created`);
		} else {
			console.log('🎉 Cards initialized! (No main container for dynamic cards)');
		}

		// Initialize smart popover toggle listeners for YouTube lazy loading and video play/pause
		try {
			const basePath = getBasePath();
			const { initializePopoverToggleListeners } = await import(`${basePath}base/utils.js`);
			
			// Add a small delay to ensure DOM is fully rendered
			setTimeout(() => {
				initializePopoverToggleListeners();
			}, 100);
		} catch (error) {
			console.warn('⚠️  Failed to initialize popover toggle listeners:', error);
		}

	} catch (error) {
		console.error('❌ Failed to initialize cards:', error);
	}
}

// Add global function to update srcsets for new layout elements
function setupGlobalLayoutUpdater() {
	window.updateLayoutSrcsets = function(container = document) {
		if (!window._layoutSrcsetData) return;
		
		const newLayoutElements = container.querySelectorAll('lay-out:not([srcsets])');
		console.log(`🔄 Updating srcsets for ${newLayoutElements.length} new lay-out elements`);
		
		newLayoutElements.forEach((element, index) => {
			try {
				const srcsets = generateLayoutSrcsets(element, window._layoutSrcsetData.config, window._layoutSrcsetData.layoutsData);
				if (srcsets && srcsets !== 'default:100vw') {
					element.setAttribute('srcsets', srcsets);
					console.log(`✅ Updated srcsets for new lay-out ${index + 1}:`, srcsets);
				}
				
				// Set layout data on child elements
				Array.from(element.children).forEach((child, childIndex) => {
					child.setAttribute('data-layout-index', childIndex);
					
					// Set layout data in settings for BaseCard to use
					try {
						child.settings; // Triggers _ensureSettingsInitialized()
						if (child._settings) {
							child._settings.layoutIndex = childIndex;
							child._settings.layoutSrcsets = srcsets || 'default:100vw';
							child._settings.srcsetBreakpoints = [280, 480, 900];
						}
					} catch (error) {
						console.warn(`⚠️ Could not set layout data on updated child ${childIndex}:`, error);
					}
				});
				
			} catch (error) {
				console.warn(`⚠️  Failed to update srcsets for new lay-out ${index + 1}:`, error);
			}
		});
	};
}

// Main initialization function
export async function initContentCards() {
	console.log('🚀 Initializing content card system...');
	
	// Import all card components
	await importAllCards();
	
	// Setup global layout updater
	setupGlobalLayoutUpdater();
	
	// Initialize layout srcsets first, then cards
	await initializeLayoutSrcsets();
	await initializeCards();
	
	console.log('✨ Content card system initialized successfully!');
}

// Auto-initialize when imported as a module script
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initContentCards);
} else {
	initContentCards();
}
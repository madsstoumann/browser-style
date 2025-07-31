// Simple data loader utility for content cards
let cachedData = null;

export async function loadData() {
	if (cachedData) return cachedData;

	// Try different possible paths for data.json
	const possiblePaths = [
		'./data.json',                    // Same directory as test file
		'./ui/content-card/data.json',    // From root
		'../data.json',                   // From cards subdirectory
	];

	for (const path of possiblePaths) {
		try {
			const response = await fetch(path);
			if (response.ok) {
				cachedData = await response.json();
				console.log(`✅ Loaded data.json from: ${path}`);
				return cachedData;
			}
		} catch (e) {
			// Try next path
			continue;
		}
	}

	throw new Error(`Could not load data.json from any of the expected paths: ${possiblePaths.join(', ')}`);
}

export async function getContentById(id) {
	const data = await loadData();
	const item = data.find(item => item.id === id);
	
	if (!item) {
		console.warn(`Content with id "${id}" not found`);
		console.log('Available IDs:', data.map(item => item.id).join(', '));
	}
	
	return item;
}

export async function setContentForElement(element, contentId, settings = {}) {
	try {
		const data = await getContentById(contentId);
		if (data) {
			element.dataset = { data, settings };
		} else {
			element.innerHTML = `<div style="border: 2px dashed #ff9500; padding: 1rem; color: #b7791f; background: #fff3e0;">
				⚠️ Content not found: "${contentId}"
			</div>`;
		}
	} catch (error) {
		console.error('Failed to load content data:', error);
		element.innerHTML = `<div style="border: 2px dashed #ff6b6b; padding: 1rem; color: #d63031; background: #ffe0e0;">
			❌ Could not load data.json<br>
			<small>${error.message}</small>
		</div>`;
	}
}
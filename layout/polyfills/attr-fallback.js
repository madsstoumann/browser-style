(function() {
	'use strict';

	function supportsEnhancedAttr() {
		const el = document.createElement('div');
		document.body.appendChild(el);
		try {
			el.style.setProperty('--test', 'attr(data-test type(<number>), 0)');
			el.dataset.test = '123';
			const value = getComputedStyle(el).getPropertyValue('--test').trim();
			return value === '123';
		} catch (e) {
			return false;
		} finally {
			el.remove();
		}
	}

	if (supportsEnhancedAttr()) return;

	const fallbackCSS = document.createElement('link');
	fallbackCSS.rel = 'stylesheet';
	fallbackCSS.href = new URL('./attr-fallback.css', import.meta.url).href;
	document.head.appendChild(fallbackCSS);

	// Typed-attr() attributes only. Spacing is token-only in v4 (p()/pi()/cg()/…
	// in the breakpoint attributes) and items() is a breakpoint token — neither
	// goes through attr(), so they need no fallback entry.
	const ATTR_MAP = {
		'bleed': '--layout-bleed',
		'columns': '--layout-gtc',
		'rows': '--layout-gtr',
		'max-width': '--layout-mw',
		'self': '--layout-ps',
		'size': '--_sz',
		'degree': '--_dg',
		'trans-x': '--_tx',
		'trans-y': '--_ty',
		'trans-x-viewport': '--_txv',
		'trans-y-viewport': '--_tyv',
		'zoom-in': '--_zi',
		'zoom-out': '--_zo',
		'range': '--_animr',
		'range-start': '--_animrs',
		'range-end': '--_animre',
		'lanes-min': '--layout-lanes-min',
		'lanes-max': '--layout-lanes-max'
	};

	function applyAttrFallback(element) {
		if (element.tagName !== 'LAY-OUT') return;

		Object.entries(ATTR_MAP).forEach(([attr, prop]) => {
			if (element.hasAttribute(attr)) {
				const value = element.getAttribute(attr);
				element.style.setProperty(prop, value);
			}
		});
	}

	function processExistingElements() {
		document.querySelectorAll('lay-out').forEach(applyAttrFallback);
	}

	function observeNewElements() {
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === 1) {
						if (node.tagName === 'LAY-OUT') {
							applyAttrFallback(node);
						}
						node.querySelectorAll?.('lay-out').forEach(applyAttrFallback);
					}
				});

				if (mutation.type === 'attributes' && mutation.target.tagName === 'LAY-OUT') {
					const attr = mutation.attributeName;
					if (ATTR_MAP[attr]) {
						const value = mutation.target.getAttribute(attr);
						if (value !== null) {
							mutation.target.style.setProperty(ATTR_MAP[attr], value);
						} else {
							mutation.target.style.removeProperty(ATTR_MAP[attr]);
						}
					}
				}
			});
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: Object.keys(ATTR_MAP)
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			processExistingElements();
			observeNewElements();
		});
	} else {
		processExistingElements();
		observeNewElements();
	}
})();

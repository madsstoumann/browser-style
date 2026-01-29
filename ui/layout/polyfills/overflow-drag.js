/**
 * Drag-to-scroll for lay-out[overflow] elements
 * Works with dynamically added elements via event delegation
 */
(function() {
	let el = null, startX = 0, scrollStart = 0;

	document.addEventListener('pointerdown', (e) => {
		el = e.target.closest('lay-out[overflow]');
		if (!el) return;
		startX = e.clientX;
		scrollStart = el.scrollLeft;
		el.setPointerCapture(e.pointerId);
		el.style.cursor = 'grabbing';
	});

	document.addEventListener('pointermove', (e) => {
		if (!el) return;
		el.scrollLeft = scrollStart - (e.clientX - startX);
	});

	document.addEventListener('pointerup', () => {
		if (el) el.style.cursor = '';
		el = null;
	});

	document.addEventListener('pointercancel', () => {
		if (el) el.style.cursor = '';
		el = null;
	});
})();

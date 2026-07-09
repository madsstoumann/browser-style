/**
 * Drag-to-scroll for lay-out[overflow] elements
 * Works with dynamically added elements via event delegation.
 * Dragging only engages after a small movement threshold, so plain clicks —
 * including native ::scroll-button() arrows and ::scroll-marker dots — pass through.
 */
(function() {
	const THRESHOLD = 6; // px of horizontal movement before a drag starts
	let el = null, dragging = false, startX = 0, scrollStart = 0, pointerId = 0;

	document.addEventListener('pointerdown', (e) => {
		el = e.target.closest('lay-out[overflow]');
		if (!el) return;
		dragging = false;
		startX = e.clientX;
		scrollStart = el.scrollLeft;
		pointerId = e.pointerId;
	});

	document.addEventListener('pointermove', (e) => {
		if (!el) return;
		const dx = e.clientX - startX;
		if (!dragging) {
			if (Math.abs(dx) < THRESHOLD) return;
			dragging = true;
			el.setPointerCapture(pointerId);
			el.style.cursor = 'grabbing';
		}
		el.scrollLeft = scrollStart - dx;
	});

	const end = () => {
		if (el && dragging) el.style.cursor = '';
		el = null;
		dragging = false;
	};
	document.addEventListener('pointerup', end);
	document.addEventListener('pointercancel', end);
})();

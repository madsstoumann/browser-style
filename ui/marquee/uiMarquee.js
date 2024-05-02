export default function uiMarquee(node) {
	const span = node?.querySelector('span');
	if (!span) return;

	const isRTL = getComputedStyle(span).direction === 'rtl';

	const ro = new ResizeObserver(entries => {
		for (let entry of entries) {
			if (span.offsetWidth > 0) {  // Check to avoid division by zero
				const shiftPercentage = (span.scrollWidth / span.offsetWidth) * 100;
				const direction = isRTL ? '' : '-';
				span.style.setProperty('--_x', `${direction}${shiftPercentage}%`);
			}
		}
	});

	ro.observe(span);
}

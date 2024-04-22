export default function uiRatingHistogram(node) {
	const nodes = Array.from(node.querySelectorAll('[data-value]'));
	if (nodes.length) {
		nodes.forEach(progress => {
			setTimeout(() => progress.value = Number(progress.dataset.value), 200);
		});
	}
}
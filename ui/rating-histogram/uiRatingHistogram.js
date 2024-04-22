export default function uiRatingHistogram(node, delay = 200) {
	const nodes = Array.from(node.querySelectorAll('[data-value]'));
	if (nodes.length) {
		nodes.forEach(progress => {
			progress.value = 0;
			setTimeout(() => progress.value = Number(progress.dataset.value), delay);
		});
	}
}
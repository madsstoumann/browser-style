export default function uiMarquee(node) {
	if (!node) return
	const ro = new ResizeObserver(entries => {
		for (let entry of entries) {
			node.style.setProperty('--_x', `-${(node.scrollWidth / node.offsetWidth) * 100}%`)
		}
	})
	ro.observe(node);
}
export default function uiShare(node) {
	const button = node.querySelector('button');
	if ('share' in window.navigator) {
		button.addEventListener('click', () => {
			window.navigator.share({
				title: document.title,
				url: window.location.href
			});
		})
	}
	else {
		button.hidden = true;
		const links = node.querySelectorAll('a');
		links.forEach(link => {
			link.href += window.location.href;
			link.hidden = false;
		})
	}
}
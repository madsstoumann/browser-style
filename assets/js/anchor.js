export default function anchor() {
	if (!("anchorName" in document.documentElement.style)) {
		document.querySelectorAll('[anchor]').forEach(popover => {
			const anchor = document.getElementById(popover.getAttribute('anchor'));
			if (anchor) {
				popover.addEventListener("beforetoggle", (event) => {
					if (event.newState === 'open') {
						const anchorRect = anchor.getBoundingClientRect();
						popover.style.setProperty('--anchor-top', anchorRect.top + 'px');
						popover.style.setProperty('--anchor-left', anchorRect.left + 'px');
						popover.style.setProperty('--anchor-height', anchorRect.height + 'px');
						popover.style.setProperty('--anchor-width', anchorRect.width + 'px');
					}
				})
				popover.addEventListener("toggle", (event) => {
					if (event.newState === 'open') {
						const popoverRect = popover.getBoundingClientRect();
						popover.style.setProperty('--popover-height', popoverRect.height + 'px');
						popover.style.setProperty('--popover-width', popoverRect.width + 'px');
					}
				})
			}
		})
	}
}
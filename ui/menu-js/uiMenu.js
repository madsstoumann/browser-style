import uiDetails from './../details/uiDetails.js';
export default function uiMenu(menu) {
	const _p = {}, panel = new Proxy(_p, {
		set: (target, key, value) => {
			target[key] = value
			return true
		}
	})
	menu.querySelectorAll('ui-details').forEach(uiDetails);
	menu.addEventListener('ui-details:toggle', event => panel.open = event.detail.open ? event.target : null)
	menu.addEventListener('keydown', event => {
		if (event.key === "Escape" && panel.open) {
			panel.open.dispatchEvent(new CustomEvent('ui-details:open', { detail: { open: false } }))
		}
	})
	document.addEventListener('click', event => {
		if (panel.open && !menu.contains(event.target)) {
			panel.open.dispatchEvent(new CustomEvent('ui-details:open', { detail: { open: false } }))
		}
	})
}
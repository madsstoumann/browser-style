export default function uiDetails(node) {
  const toggle = (summary, force = null, dispatch = true) => {
    const details = summary.parentNode
    const open = typeof force === 'boolean' ? force : "true" !== summary.getAttribute('aria-expanded')
    summary.setAttribute('aria-expanded', open)
    details.toggleAttribute('open', open)
    summary.nextElementSibling.inert = !open
    if (details.hasAttribute('autocollapse') && open) {
      details.parentNode.querySelectorAll(`ui-details[autocollapse] > ui-summary`).forEach(sub => 
        sub !== summary && toggle(sub, false, false)
      )
    }
    if (dispatch) details.dispatchEvent(new CustomEvent('ui-details:toggle', { detail: { open }, bubbles: true }))
  }
	const open = node.hasAttribute('open')
	const summary = node.firstElementChild
	const expand = summary.nextElementSibling
	expand.id = expand.id || window.crypto.randomUUID()
	expand.inert = !open
	summary.setAttribute('aria-expanded', open)
	summary.setAttribute('role', 'button')
	summary.tabIndex = 0
	summary.setAttribute('aria-controls', expand.id)
	summary.addEventListener('click', () => toggle(summary))
	summary.addEventListener('keydown', e => {
		if (e.code === 'Space' || e.code === 'Enter') {
			e.preventDefault()
			toggle(summary)
		}
	})
	node.addEventListener('ui-details:open', event => {
		toggle(event.target.firstElementChild, event.detail.open)
	})
}
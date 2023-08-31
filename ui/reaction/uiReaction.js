export default function uiReaction(node) {
  const button = node.querySelector('button')
  node.addEventListener('click', e => {
    if (e.target.value) {
      button.textContent = e.target.value
    }
  })
}
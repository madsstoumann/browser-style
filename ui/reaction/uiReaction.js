export default function uiReaction(node) {
  const button = node.querySelector('button')
  node.addEventListener('click', e => {
    if (e.target.value) {
      button.firstElementChild.innerHTML = `<text x="0" y="21">${e.target.value}</text>`
    }
  })
}
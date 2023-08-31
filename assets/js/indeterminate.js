export default function indeterminate(group) {
  const toggle = node => {
    if (node.nodeName === 'INPUT') {
      if (node.dataset.index === group.dataset.index) {
        if (node.checked) {
          node.checked = false
          group.dataset.index = -1
        }
      } else {
        group.dataset.index = node.dataset.index
      }
    }
  }
  [...group.elements].forEach((input, index) => {
    input.dataset.index = index
    if (input.checked) group.dataset.index = index
  })
  group.addEventListener('click', e => toggle(e.target))
}
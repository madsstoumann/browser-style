// export default function setProperty(input, attr) {
//   const key = attr ? attr : input.dataset.key || input.name
//   const node = scope(input, input.dataset.scope)
//   if (key && node) { 
//     const value = attr ? input[attr] : input.value + (input.dataset.unit || '')
//     node.style.setProperty(key.startsWith('--') ? key : '--' + key, value)
//   }
// }

export default function initProperties(input) {
  const keys = input.dataset.key.split(',') || [input.name]
  const scopes = input.dataset.scope?.split(',') || [input.dataset.scope || 'self']
  const types = input.dataset.type?.split(',') || ['property']
  keys.forEach((item, index) => {
    let key = item || input.name
    const node = scope(input, scopes[index])

    if (key && node) { 
      if (types[index] === 'property') {
        key = key.startsWith('--') ? key : '--' + key
        setProperty(node, key, value(input))
        if (input.hasAttribute('min')) setProperty(node, '--min', input.min)
        if (input.hasAttribute('max')) setProperty(node, '--max', input.max)
        input.addEventListener('input', () => setProperty(node, key, value(input)) )
      }
      else {
        node.setAttribute(key, value(input))
        input.addEventListener('input', () => node.setAttribute(key, value(input)) )
      }
    }
  })
}

const setProperty = (node, key, value) => node.style.setProperty(key, value)
const value = (input) => input.value + (input.dataset.unit || '')


function scope(input, scope) {
  switch (scope) {
    case 'fieldset': return input.closest('fieldset')
    case 'form': return input.form
    case 'next': return input.nextElementSibling
    case 'parent': return input.parentNode
    case 'prev': return input.previousElementSibling
    case 'root': return document.documentElement
    case 'self': return input
    default: return scope?.length ? document.querySelector(scope) : input
  }
}
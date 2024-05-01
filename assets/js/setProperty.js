export default function initProperties(input) {
  const keys = input.dataset.key.split(',') || [input.name]
  const scopes = input.dataset.scope?.split(',') || [input.dataset.scope || 'self']
  const types = input.dataset.type?.split(',') || ['property']
  const units = input.dataset.unit?.split(',') || ['']
  keys.forEach((item, index) => {
    let key = item || input.name
    const node = scope(input, scopes[index])
    const unit = units[index] || ''

    if (key && node) { 
      if (types[index] === 'property') {
        key = key.startsWith('--') ? key : '--' + key
        
        setProperty(node, key, input.value + unit)
        if (input.hasAttribute('min')) setProperty(node, '--min', input.min)
        if (input.hasAttribute('max')) setProperty(node, '--max', input.max)
        input.addEventListener('input', () => setProperty(node, key, input.value + unit) )
      }
      else {
        node.setAttribute(key, input.value + unit)
        input.addEventListener('input', () => node.setAttribute(key, input.value + unit) )
      }
    }
  })
}

const setProperty = (node, key, value) => node.style.setProperty(key, value)

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
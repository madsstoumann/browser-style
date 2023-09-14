export default function setProperty(input, attr) {
  const key = attr ? attr : input.dataset.key || input.name
  const node = scope(input, input.dataset.scope)
  if (key && node) { 
    const value = attr ? input[attr] : input.value + (input.dataset.unit || '')
    node.style.setProperty(key.startsWith('--') ? key : '--' + key, value)
  }
}
function scope(input, scope) {
  switch (scope) {
    case 'fieldset': return input.closest('fieldset')
    case 'form': return input.form
    case 'next': return input.nextElementSibling
    case 'parent': return input.parentNode
    case 'prev': return input.previousElementSibling
    case 'root': return document.documentElement
    default: return scope?.length ? document.querySelector(scope) : input
  }
}
export default function setProperty(input, attr) {
  const keys = input.dataset?.key.split(',') || [input.name]
  const scopes = input.dataset.scope?.split(',') || [input.dataset.scope || 'self']
  const types = input.dataset.type?.split(',') || ['property']
  
  keys.forEach((item, index) => {
    const node = scope(input, scopes[index])
    const key = attr ? attr : item || input.name
    if (key && node) { 
      const value = attr ? input[attr] : input.value + (input.dataset.unit || '')
      if (types[index] === 'property') {
        node.style.setProperty(key.startsWith('--') ? key : '--' + key, value)
      }
      else {
        node.setAttribute(key, value)
      }
    }
  })
}
export default function uiCalculator(node) {
  const display = node.elements.display
  const fit = () => {
    const length = display.value.length
    display.style.fontSize = length > 7 ? `${(display.offsetWidth / length) + 7}px` : '3rem'
  }
  const handleKeydown = event => {
    let key = event.key || (event.target?.value)
    if (key === ' ') key = event.target.value
    if (['0','1','2','3','4','5','6','7','8','9','+','-','*','/','.'].includes(key)) {
      display.value += key
      fit()
    } else if (key === 'Enter') {
      node.dispatchEvent(new Event('submit'))
    } else if (key === 'Escape' || key === 'c') {
      node.dispatchEvent(new Event('reset'))
    } else if (key === 'Backspace') {
      display.value = display.value.slice(0, -1)
    }
  }
  const handleClick = event => {
    if (event.detail === 0) return
    handleKeydown(event)
  }
  node.addEventListener('keydown', handleKeydown)
  node.addEventListener('click', handleClick)
  node.addEventListener('reset', () => { display.value = ''; fit() })
  node.addEventListener('submit', event => {
    event.preventDefault()
    try {
      display.value = eval(display.value)
      fit()
      window.navigator.clipboard.writeText(display.value)
    } catch (error) {
      display.value = ''
      fit()
    }
  })
}
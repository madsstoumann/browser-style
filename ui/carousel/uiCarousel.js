export default function uiCarousel(node) {
  let index = 0;
  const dots = [...node.querySelectorAll('ol > li')]
  const next = node.querySelector('[data-action=next]')
  const prev = node.querySelector('[data-action=prev]')
  const pages = [...node.querySelectorAll('.ui-scroll >*')]
  const scroll = node.querySelector('.ui-scroll')
  const scrollToPage = (index, behavior = 'smooth') => {
    pages[index].scrollIntoView({
      behavior, block: 'nearest', inline: 'start'
    })
    setButtons()
  }
  const setButtons = () => {
    prev.disabled = (index === 0)
    next.disabled = (index === pages.length - 1)
    dots.forEach((dot, i) => dot.ariaSelected = i === index)
  }
  next.addEventListener('click', () => {
    index++; if (index >= pages.length) index = 0;
    scrollToPage(index)
  })
  prev.addEventListener('click', () => {
    index--; if (index < 0) index = pages.length - 1;
    scrollToPage(index)
  })
  scroll.addEventListener('scrollend', e => {
    index = Math.round(scroll.scrollLeft / scroll.offsetWidth)
    setButtons()
  })
  scrollToPage(0, 'auto')
}
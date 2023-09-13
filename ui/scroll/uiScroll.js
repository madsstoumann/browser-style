export default function uiScroll(scroll, settings = {}) {
  const config = Object.assign({
    scrollAutoPlay: 0,
    scrollNav: 'ui-scroll-nav',
    scrollNext: `<ui-icon type="chevron right"></ui-icon>`,
    scrollPrev: `<ui-icon type="chevron left"></ui-icon>`,
  }, settings, scroll.dataset)
  if (!config.scrollNav) return
  const pages = [...scroll.querySelectorAll('& >*')]
  const length = pages.length
  const [dots, next, prev] = uiScrollNav(scroll, length, config)
  let index = 0

  const scrollToPage = (index, behavior = 'smooth') => {
    pages[index].scrollIntoView({
      behavior, block: 'nearest', inline: 'start'
    })
    updateUI()
  }
  const updateUI = () => {
    prev.disabled = (index === 0)
    next.disabled = (index === length - 1)
    dots.forEach((dot, i) => dot.ariaSelected = i === index)
    pages.forEach((elm, current) => elm.classList.toggle('--active', index === current) )
  }
  next.addEventListener('click', () => {
    index++; if (index >= length) index = 0
    scrollToPage(index)
  })
  prev.addEventListener('click', () => {
    index--; if (index < 0) index = length - 1
    scrollToPage(index)
  })
  scroll.addEventListener('scrollend', e => {
    index = Math.round(scroll.scrollLeft / scroll.offsetWidth)
    updateUI()
  })
  scrollToPage(0, 'auto')

  if (config.scrollAutoPlay) {
    setInterval(() => {
      index++; if (index >= length) index = 0
      scrollToPage(index)
    }, parseInt(config.scrollAutoPlay, 10))
  }
}

function uiScrollNav(node, items, config = {}) { 
  const nav = node.nextElementSibling || document.createElement('nav')
  const dots = nav.querySelector('ol') || document.createElement('ol')
  const next = nav.querySelector('[data-action=next]') || document.createElement('button')
  const prev = nav.querySelector('[data-action=prev]') || document.createElement('button')

  if (!nav.children.length) {
    dots.innerHTML = `<li></li>`.repeat(items)
    next.innerHTML = config.scrollNext
    prev.innerHTML = config.scrollPrev
    nav.classList.add(config.scrollNav)
    if (config.scrollNavModifier) nav.classList.add(config.scrollNavModifier)
    nav.append(prev, dots, next)
    node.after(nav)
  }
  return [[...dots.children], next, prev]
}
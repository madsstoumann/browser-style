import throttle from './../../assets/js/throttle.js'
export default function uiScroll(scroll, settings = {}) {
  const config = Object.assign({
    scrollActive: '--active',
    scrollAutoPlay: 0,
    scrollNav: 'ui-scroll-nav',
    scrollNext: '--icon',
    scrollNextInner: `<ui-icon type="chevron right"></ui-icon>`,
    scrollPrev: '--icon',
    scrollPrevInner: `<ui-icon type="chevron left"></ui-icon>`,
  }, settings, scroll.dataset)
  const items = [...scroll.querySelectorAll('& >*')]
  if (!items) return
  let index = 0, itemsPerPage = 1, pages = 1
  const [dots, next, prev] = uiScrollNav(scroll, pages, config)

  const resizeObserver = new ResizeObserver(throttle(() => {
    index = 0;
    itemsPerPage = Math.floor(scroll.offsetWidth / items[0].offsetWidth);
    pages = Math.ceil(items.length / itemsPerPage);
    dots.innerHTML = `<li></li>`.repeat(pages)
    scrollToPage(0, 'auto')
  }, 250))

  const scrollToPage = (index, behavior = 'smooth') => {
    items[index * itemsPerPage].scrollIntoView({
      behavior, block: 'nearest', inline: 'start'
    })
    updateUI()
  }
  const updateUI = () => {
    prev.disabled = (index === 0)
    next.disabled = (index === pages - 1)
    Array.from(dots.children).forEach((dot, i) => dot.ariaSelected = i === index)
    items.forEach((elm, current) => elm.classList.toggle(config.scrollActive, index === current) )
  }
  next.addEventListener('click', () => {
    index++; if (index >= pages) index = 0
    scrollToPage(index)
  })
  prev.addEventListener('click', () => {
    index--; if (index < 0) index = pages - 1
    scrollToPage(index)
  })
  scroll.addEventListener('scrollend', e => {
    const endOfScroll = scroll.scrollLeft + scroll.offsetWidth >= scroll.scrollWidth
    if (endOfScroll) index = pages - 1
    else index = Math.round(scroll.scrollLeft / scroll.offsetWidth)
    updateUI()
  })

  if (config.scrollAutoPlay) {
    setInterval(() => {
      index++; if (index >= pages) index = 0
      scrollToPage(index)
    }, parseInt(config.scrollAutoPlay, 10))
  }
  resizeObserver.observe(scroll)
}

function uiScrollNav(node, items, config = {}) { 
  const nav = node.nextElementSibling || document.createElement('nav')
  const dots = nav.querySelector('ol') || document.createElement('ol')
  const next = nav.querySelector('[data-action=next]') || document.createElement('button')
  const prev = nav.querySelector('[data-action=prev]') || document.createElement('button')

  if (!nav.children.length) {
    next.classList.add(config.scrollNext)
    next.innerHTML = config.scrollNextInner
    prev.classList.add(config.scrollPrev)
    prev.innerHTML = config.scrollPrevInner
    nav.classList.add(config.scrollNav)
    if (config.scrollNavModifier) nav.classList.add(config.scrollNavModifier)
    nav.append(prev, dots, next)
    node.after(nav)
  }
  return [dots, next, prev]
}
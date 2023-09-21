export default function uiScroll(scroll, settings = {}) {
  const config = Object.assign({
    scrollActive: '--active',
    scrollAutoPlay: 0,
    scrollBehavior: 'smooth',
    scrollNav: 'ui-scroll-nav',
    scrollNext: '--icon',
    scrollNextInner: `<ui-icon type="chevron right"></ui-icon>`,
    scrollPrev: '--icon',
    scrollPrevInner: `<ui-icon type="chevron left"></ui-icon>`,
    scrollResizeThreshold: 25,
    scrollTabs: '',
  }, settings, scroll.dataset)
  
  const items = [...scroll.querySelectorAll('& >*')]
  if (!items || !config.scrollNav) return

  const [dots, nav, next, prev] = scrollNav(scroll)
  const tabs = config.scrollTabs && scroll.closest(config.scrollTabs)?.querySelectorAll('[role=tab]') || []
  let index, inlineSize, itemsPerPage, pages

  /* Methods */
  function scrollNav() {
    const nav = scroll.nextElementSibling || document.createElement('nav')
    const dots = nav.querySelector('ol') || document.createElement('ol')
    const next = nav.querySelector('[data-action=next]') || document.createElement('button')
    const prev = nav.querySelector('[data-action=prev]') || document.createElement('button')
    if (!nav.children.length) {
      next.classList.add(config.scrollNext)
      next.innerHTML = config.scrollNextInner
      prev.classList.add(config.scrollPrev)
      prev.innerHTML = config.scrollPrevInner
      config.scrollNav.split(' ').forEach(className => nav.classList.add(className))
      nav.append(prev, dots, next)
      scroll.after(nav)
    }
    return [dots, nav, next, prev]
  }

  function scrollToPage(index, behavior = config.scrollBehavior) {
    items[index * itemsPerPage].scrollIntoView({
      behavior, block: 'nearest', inline: 'start'
    })
    updateUI(index)
  }

  function updateData() {
    index = 0
    inlineSize = scroll.offsetWidth
    itemsPerPage = Math.floor(inlineSize / items[0].offsetWidth) || 1
    pages = Math.ceil(items.length / itemsPerPage)
    dots.innerHTML = `<li></li>`.repeat(pages)
    nav.classList.toggle('--hidden', pages === 1)
  }

  function updateUI(index) {
    prev.disabled = (index === 0)
    next.disabled = (index === pages - 1)
    Array.from(dots.children).forEach((dot, current) => dot.ariaSelected = index === current)
    items.forEach((elm, current) => elm.classList.toggle(config.scrollActive, index === current) )
    if (tabs.length) {
      tabs.forEach((tab, current) => {
        tab.ariaSelected = index === current
        if (index === current) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      })
    }
  }

  /* Event Listeners */
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
    updateUI(index)
  })

  tabs.forEach(tab => {
    tab.addEventListener('click', event => {
      event.preventDefault()
      const index = items.findIndex(panel => panel.id === tab.getAttribute('aria-controls'))
      if (index > -1) scrollToPage(index)
    })
  })

  /* Auto Play */
  if (config.scrollAutoPlay) {
    setInterval(() => {
      index++; if (index >= pages) index = 0
      scrollToPage(index)
    }, parseInt(config.scrollAutoPlay, 10))
  }

  /* Resize Observer / Init */
  const resizeObserver = new ResizeObserver((entries) => {
    const entryInlineSize = Math.floor(entries[0].contentBoxSize[0].inlineSize)
    if (Math.abs(entryInlineSize - inlineSize) > parseInt(config.scrollResizeThreshold, 10)) {
      updateData()
      scrollToPage(0)
    }
  })
  resizeObserver.observe(scroll)

  updateData() 
  scrollToPage(0)
}
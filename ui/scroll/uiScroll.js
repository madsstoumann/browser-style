export default function uiScroll(scroll, settings = {}) {
  const config = Object.assign({
    scrollActive: '--active',
    scrollAutoPlay: 0,
    scrollBehavior: 'smooth',
    scrollNav: 'ui-scroll-nav',
    scrollNextCallback: null,
    scrollNext: '--icon',
    scrollNextInner: `<ui-icon type="chevron right"></ui-icon>`,
    scrollPrevCallback: null,
    scrollPrev: '--icon',
    scrollPrevInner: `<ui-icon type="chevron left"></ui-icon>`,
    scrollResizeThreshold: 75,
    scrollTabs: '',
  }, settings, scroll.dataset)

  const items = [...scroll.querySelectorAll('& >*')]
  if (!items || !config.scrollNav) return

  const [dots, nav, next, prev] = scrollNav(scroll)
  const tabs = config.scrollTabs && scroll.closest(config.scrollTabs)?.querySelectorAll('[role=tab]') || []
  let index, inlineSize, itemsPerPage, pages

  /* Create navigation */
  function scrollNav() {
    const nav = scroll.nextElementSibling || document.createElement('nav')
    const dots = nav.querySelector('ol') || document.createElement('ol')
    const next = nav.querySelector('[data-action=next]') || document.createElement('button')
    const prev = nav.querySelector('[data-action=prev]') || document.createElement('button')
    if (!nav.children.length) {
      next.classList.add(config.scrollNext)
      next.innerHTML = config.scrollNextInner
      next.type = 'button'
      prev.classList.add(config.scrollPrev)
      prev.innerHTML = config.scrollPrevInner
      prev.type = 'button'
      config.scrollNav.split(' ').forEach(className => nav.classList.add(className))
      nav.append(prev, dots, next)
      scroll.after(nav)
    }
    return [dots, nav, next, prev]
  }

  function scrollToPage(index, behavior = config.scrollBehavior, scrollIntoView = true) {
    if (scrollIntoView) {
      items[index * itemsPerPage].scrollIntoView({
        behavior, block: 'nearest', inline: 'start'
      })
    }
    updateUI(index)
  }

  function updateData() {
    index = 0
    inlineSize = scroll.offsetWidth
    itemsPerPage = Math.floor(inlineSize / items[0].offsetWidth) || 1
    pages = Math.ceil(items.length / itemsPerPage)
    dots.innerHTML = Array.from({length: pages}).map((_, index) => `<li data-index="${index}"></li>`).join('')
    nav.classList.toggle('--hidden', pages === 1)
  }

  function updateUI(index) {
    prev.disabled = (index === 0)
    next.disabled = (index === pages - 1)
    Array.from(dots.children).forEach((dot, current) => dot.ariaSelected = index === current)
    if (tabs.length) {
      tabs.forEach((tab, current) => {
        tab.ariaSelected = index === current
        if (index === current) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      })
    }
  }

  /* Event Listeners */
  dots.addEventListener('click', event => {
    const index = parseInt(event.target.dataset.index, 10)
    if (index > -1) scrollToPage(index)
  })
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

  /* Observers / Init */
  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle(config.scrollActive, entry.isIntersecting)
      entry.target.inert = !entry.isIntersecting
    })
  })
  items.forEach(item => intersectionObserver.observe(item))

  const resizeObserver = new ResizeObserver((entries) => {
    const entryInlineSize = Math.floor(entries[0].contentBoxSize[0].inlineSize)
    if (Math.abs(entryInlineSize - inlineSize) > parseInt(config.scrollResizeThreshold, 10)) {
      updateData()
      scrollToPage(0)
    }
  })
  resizeObserver.observe(scroll)

  updateData()

  /* Set initial tab from location.hash, using #![ID] */
  if (config.scrollTabs && location.hash) {
    const id = location.hash.replace('#!', '')
    const tabIndex = items.findIndex(item => item.getAttribute('id') === id)
    if (tabIndex > -1) index = tabIndex
  }

  /* Auto Play */
  if (config.scrollAutoPlay) {
    let intervalId = null
    const autoPlay = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          intervalId = setInterval(() => {
            index++; if (index >= pages) index = 0
            scrollToPage(index)
          }, parseInt(config.scrollAutoPlay, 10))
        }
        else clearInterval(intervalId)
      })
    }, { threshold: 0.5 })
    autoPlay.observe(scroll)
  }

  scrollToPage(index, 'auto', false)
}
import datasetWithTypes from './../../assets/js/datasetWithTypes.js';
export default function uiScroll(scroll, args = {}) {
  const config = Object.assign({
    scrollActive: '--active',
    scrollAutoPlay: 0,
    scrollAutoPlaying: '--playing',
    scrollBehavior: 'smooth',
    scrollHidden: '--hidden',
    scrollInfinite: false,
    scrollNav: 'ui-scroll-nav',
    scrollNavCallback: null,
    scrollNext: '--icon',
    scrollNextInner: `<ui-icon type="chevron right"></ui-icon>`,
    scrollPrev: '--icon',
    scrollPrevInner: `<ui-icon type="chevron left"></ui-icon>`,
    scrollPlay: '--icon',
    scrollPlayInner: `<ui-icon type="play-pause"></ui-icon>`,
    scrollResizeThreshold: 75,
    scrollTabs: '',
  }, (typeof args === 'object') ? args : datasetWithTypes(scroll.dataset || {}))

  /* Hack for Chrome issue with smooth scrolling, when there are multiple containers with smooth-scrolling on same page */
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  if (isChrome && config.scrollAutoPlay > 0) {
    // Count the number of uiScroll instances
    // const uiScrollInstances = document.querySelectorAll('[data-scroll-enabled]').length;
    // If the browser is Chrome and there are multiple instances, set scroll behavior to 'instant'
    // if (uiScrollInstances > 1) config.scrollBehavior = 'instant';
  }

  if (scroll.hasAttribute('data-scroll-enabled')) return
  scroll.dataset.scrollEnabled = true

  const items = [...scroll.querySelectorAll('& >*')]
  if (!items || !config.scrollNav) return

  const [dots, nav, next, prev, play] = scrollNav(scroll)
  const callback = config.scrollNavCallback ? (typeof window[config.scrollNavCallback] === 'function') ? window[config.scrollNavCallback] : () => true : () => true
  const tabs = config.scrollTabs && scroll.closest(config.scrollTabs)?.querySelectorAll('[role=tab]') || []
  let index, inlineSize, itemsPerPage, pages

  let intervalId = null
  let isPlaying = config.scrollAutoPlay > 0

  function handleAutoPlay(isIntersecting) {
    if (isIntersecting) {
      if (isPlaying) {
        intervalId = setInterval(() => {
          index++
          if (index >= pages) {
            scrollToPage(0, 'instant')
            index = 0
          } else {
            scrollToPage(index) /* CHROME ISSUE, use `instant` instead of `smooth` IF MULTIPLE INSTANCES */
          }
        }, parseInt(config.scrollAutoPlay, 10))
        nav.style.setProperty('--playstate', 'running')
        nav.classList.add(config.scrollAutoPlaying)
      }
    } else {
      clearInterval(intervalId)
      nav.style.setProperty('--playstate', 'paused')
      nav.classList.remove(config.scrollAutoPlaying)
    }
  }

  /* Create navigation */
  function scrollNav() {
    const nav = scroll.nextElementSibling || document.createElement('nav')
    const dots = nav.querySelector('ol') || document.createElement('ol')
    const next = nav.querySelector('[data-action=next]') || document.createElement('button')
    const prev = nav.querySelector('[data-action=prev]') || document.createElement('button')
    const play = nav.querySelector('[data-action=play]') || document.createElement('button')
    if (!nav.children.length) {
      next.classList.add(config.scrollNext)
      next.innerHTML = config.scrollNextInner
      next.type = 'button'
      next.dataset.action = 'next'
      prev.classList.add(config.scrollPrev)
      prev.innerHTML = config.scrollPrevInner
      prev.type = 'button'
      prev.dataset.action = 'prev'
      play.classList.add(config.scrollPlay)
      play.innerHTML = config.scrollPlayInner
      play.type = 'button'
      play.dataset.action = 'play'
      play.hidden = !config.scrollAutoPlay
      config.scrollNav.split(' ').forEach(className => nav.classList.add(className))
      nav.append(play, prev, dots, next)
      scroll.after(nav)
    }
    return [dots, nav, next, prev, play]
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
    dots.innerHTML = Array.from({ length: pages }).map((_, index) => `<li data-index="${index}"></li>`).join('')
    items.forEach((item, index) => { item.style.scrollSnapAlign = index % itemsPerPage === 0 ? 'start' : 'none' })
    nav.classList.toggle(config.scrollHidden, pages === 1) /* Hide scroll navigation if only one page */
  }

  function updateUI(index) {
    if (!config.scrollInfinite) {
      prev.disabled = (index === 0)
      next.disabled = (index === pages - 1)
    }
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
    if (callback()) scrollToPage(index)
  })
  prev.addEventListener('click', () => {
    index--; if (index < 0) index = pages - 1
    scrollToPage(index)
  })
  play.addEventListener('click', () => {
    isPlaying = !isPlaying
    handleAutoPlay(isPlaying)
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
      if (entry.isIntersecting) {
        index = Math.floor(items.findIndex(item => item === entry.target) / itemsPerPage)
        updateUI(index)
      }
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
    nav.style.setProperty('--duration', `${config.scrollAutoPlay}ms`)
    const autoPlay = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        handleAutoPlay(entry.isIntersecting)
      })
    }, { threshold: 0.85 })
    autoPlay.observe(scroll)
  }
  scrollToPage(index, 'auto', false)
}

export default function uiTabs(node) {
  const panels = [...node.querySelectorAll('[role=tabpanel]')]
  const scroll = node.querySelector('.ui-scroll')
  const tabs = node.querySelectorAll('[role=tab]')
  const scrollBehavior = window.getComputedStyle(scroll).scrollBehavior || 'smooth';

  const scrollToPanel = (index, behavior = scrollBehavior) => {
    panels[index].scrollIntoView({
      behavior, block: 'nearest', inline: 'start'
    })
  }
  const setSelected = index => {
    tabs.forEach(tab => tab.ariaSelected = false)
    tabs[Math.abs(index)].ariaSelected = true
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault()
      const index = panels.findIndex(panel => panel.id === tab.getAttribute('aria-controls'))
      if (index > -1) {
        scrollToPanel(index)
        if (!scroll) setSelected(index)
      }
    })
  })
  scroll.addEventListener('scrollend', e => {
    const index = Math.round(scroll.scrollLeft / scroll.offsetWidth)
    setSelected(index)
  })
  if (location.hash?.includes('#!')) {
    const index = panels.findIndex(panel => panel.id === location.hash.slice(2))
    if (index > -1) {
      scrollToPanel(index, 'auto')
      if (!scroll) setSelected(index)
    }
  } else {
    setSelected(0)
  }
}
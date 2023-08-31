export default function listTarget(list) {
  const items = list.querySelectorAll('& > li')
  items.forEach(item => {
    const heading = item.querySelector('& > a')
    heading.addEventListener('click', e => {
      e.preventDefault()
      if (item.classList.contains('--open')) {
        item.classList.remove('--open')
        return
      }
      items.forEach(item => item.classList.remove('--open'))
      item.classList.add('--open')
    })
  })
}
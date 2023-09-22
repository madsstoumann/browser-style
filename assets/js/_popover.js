if (!HTMLElement.prototype.hasOwnProperty('popover')) {
  const popovers = document.querySelectorAll('[popover]')
  popovers.forEach(popover => {
    const triggers = document.querySelectorAll(`[popovertarget="${popover.id}"]`);
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        popover.classList.toggle('popover-open')
      })
    })
  })
}
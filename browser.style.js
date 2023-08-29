/* uiAccordion, uiBlinds: `.js-list-target` */
function listTarget(list) {
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

/* uiCarousel */
function uiCarousel(node) {
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

/* uiChat */
function uiChat(node, locale = document.documentElement.lang || 'en') {
  const timeAgo = (timestamp) => {
    let value;
    const diff = (new Date().getTime() - timestamp.getTime()) / 1000;
    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    if (years > 0) {
      value = rtf.format(0 - years, "year");
    } else if (months > 0) {
      value = rtf.format(0 - months, "month");
    } else if (days > 0) {
      value = rtf.format(0 - days, "day");
    } else if (hours > 0) {
      value = rtf.format(0 - hours, "hour");
    } else if (minutes > 0) {
      value = rtf.format(0 - minutes, "minute");
    } else {
      value = rtf.format(0 - diff, "second");
    }
    return value;
  }
  node.querySelectorAll('time[datetime]').forEach(timeElement => {
    const date = new Date(timeElement.dateTime)
    if (date) timeElement.textContent += timeAgo(date)
  })
}

/* uiCountdown */
function uiCountDown(element) {
  const locale = element.lang || document.documentElement.getAttribute('lang') || 'en-US';
  const endTime = new Date(element.getAttribute('datetime')).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const zero = new Intl.NumberFormat(locale).format(0);

  const getRemainingTime = (endTime, currentTime = new Date().getTime()) => endTime - currentTime;
  const showTime = () => {
    const remainingTime = getRemainingTime(endTime);
    if (remainingTime < 0) element.classList.add('--expired');
    element.innerHTML = 
      timePart(Math.floor(remainingTime / (24 * 60 * 60 * 1000)), 'day') +
      timePart(Math.floor((remainingTime / (60 * 60 * 1000)) % 24), 'hour') +
      timePart(Math.floor((remainingTime / (60 * 1000)) % 60), 'minute') +
      timePart(Math.floor((remainingTime / 1000) % 60), 'second');
    if (remainingTime >= 1000) requestAnimationFrame(showTime);
  }
  const timePart = (part, type) => {
    const parts = rtf.formatToParts(part === 0 ? 2 : part, type);
    if (parts && parts.length === 3) parts.shift();
    const [unit, label] = parts; 
    return `<span><strong>${part === 0 ? zero : unit.value}</strong><small>${label.value}</small></span>`
  }
  /* use with .padStart(2,'0') ? */
  requestAnimationFrame(showTime);
}

/* uiDigitalClock */
// function uiDigitalClock(node) {
//   const now = () => {
//     node.textContent = new Date().toLocaleTimeString()
//     setTimeout(requestAnimationFrame(now), 1000)
//   }
//   now()
// }

// const uiDigitalClock = node => setInterval(() => node.textContent = new Date().toLocaleTimeString(), 1000)

function uiDigitalClock(node) {
	let last = 0;
	const render = now => {
		if (!last || now - last >= 1000) {
			last = now;
			node.textContent = new Date().toLocaleTimeString();
		}
		requestAnimationFrame(render);
	}
	window.requestAnimationFrame(render);
}


/* uiEmbed */
function uiEmbed(button) {
  button.addEventListener('click', () => {
    const video = button.previousElementSibling;
    video.src = video.dataset.src;
  })
}

/* uiTabs */
function uiTabs(node) {
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

/* uiToast — `popover` fallback */
if (!HTMLElement.prototype.hasOwnProperty('popover')) {
  const popovers = document.querySelectorAll('[popover]')
  popovers.forEach(popover => {
    const triggers = document.querySelectorAll(`[popovertarget="${popover.id}"]`);
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        console.log(popover, trigger)
        popover.classList.toggle('popover-open')
      })
    })
  })
}






/* Transfer List */
function transferList(fs) {
  const E = fs.elements; if (!E) return
  const move = (from, to) => {
    [...E[from].selectedOptions].forEach(option => {
      E[to].add(option)
      E[from].size = E[from].options.length
      E[to].size = E[to].options.length
      E[to].selectedIndex = -1
    })
  }
  E.fromStart.addEventListener('click', () => move('start', 'end'))
  E.fromEnd.addEventListener('click', () => move('end', 'start'))
}


function scope(input, scope) {
  switch (scope) {
    case 'fieldset': return input.closest('fieldset')
    case 'form': return input.form
    case 'next': return input.nextElementSibling
    case 'parent': return input.parentNode
    case 'prev': return input.previousElementSibling
    case 'root': return document.documentElement
    default: return scope?.length ? document.querySelector(scope) : input
  }
}

function setProperty(input) {
  const key = input.dataset.key || input.name
  const node = this.scope(input, input.dataset.scope)
  if (key && node) { 
    const value = input.value + (input.dataset.unit || '')
    node.style.setProperty(key.startsWith('--') ? key : '--' + key, value)
  }
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.trunc(Math.log(bytes) / Math.log(1024));
  return bytes > 0 ? `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`:'0 B';
}

function fileUpload(input) {
  const image = file => file.type.includes('image') ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}">` : ''
  const render = () => ul.innerHTML = [...input.files].map((file, index) => `<li data-index="${index}">${image(file)}<span>${file.name} <small>(${formatBytes(file.size)})</small></span></li>`).join('')
  const remove = index => {
    const files = [...input.files];
    files.splice(index, 1)
    const filelist = new DataTransfer();
    files.forEach(file => filelist.items.add(file))
    input.files = filelist.files
    render()
  }
  const ul = document.createElement('ul')
  input.parentNode.after(ul)
  input.addEventListener('change', () => render())
  ul.addEventListener('click', e => remove(e.target.dataset.index))
  ul.classList.add('ui-file-list')
}

/* Allow a radio-button-group to be un-selected, ie. `:indeterminate` */
function indeterminate(group) {
  const toggle = node => {
    if (node.nodeName === 'INPUT') {
      if (node.dataset.index === group.dataset.index) {
        if (node.checked) {
          node.checked = false
          group.dataset.index = -1
        }
      } else {
        group.dataset.index = node.dataset.index
      }
    }
  }
  [...group.elements].forEach((input, index) => {
    input.dataset.index = index
    if (input.checked) group.dataset.index = index
  })
  group.addEventListener('click', e => toggle(e.target))
}



/* One Time Code */
function oneTimeCode(input) {
  if (!input) return
  input.addEventListener('input', () => input.style.setProperty('--_otp-digit-pos', input.selectionStart))
}






/* CIRCULAR RANGE */
function rangeCircular(label) {
  const input = label.firstElementChild;
  input.style.cssText = `--min: ${input.min-0}; --max: ${input.max-0||100};`;
	const CX = input.offsetWidth / 2, CY = input.offsetHeight / 2;
	const radian = 360 / (input.max-0||100 - input.min-0);
	const pointerMove = event => {
		const degree = (((Math.atan2(event.offsetY - CY, event.offsetX - CX) * 180 / Math.PI) + 360) % 360);
		input.value = (degree / radian);
		input.dispatchEvent(new Event('input'));
	}
	label.addEventListener('pointerdown', () => label.addEventListener('pointermove', pointerMove));
	['pointerleave', 'pointerup'].forEach(evt => 	label.addEventListener(evt, () => label.removeEventListener('pointermove', pointerMove)));
}

/* LISTS WITH :target */








/* Init uiChat */
document.querySelectorAll('.ui-chat').forEach(node => uiChat(node))

/* Init Carousel / Sliders */
document.querySelectorAll('.ui-carousel, .ui-slider').forEach(node => uiCarousel(node))


/* Analog Clock */
document.querySelectorAll('.ui-analog-clock').forEach(clock => {
    /* to set current time */
  const time = new Date();
  const hour = -3600 * (time.getHours() % 12);
  const mins = -60 * time.getMinutes();
  clock.style.setProperty('--_dm', `${mins}s`);
  clock.style.setProperty('--_dh', `${(hour+mins)}s`);
})




document.querySelectorAll('.ui-tabs').forEach(node => uiTabs(node))



document.querySelectorAll('.ui-range-circular').forEach(label => rangeCircular(label))



/* Init indeterminate */
document.querySelectorAll('fieldset[name]').forEach(group => indeterminate(group));

/* Init Transfer Lists */
document.querySelectorAll('.ui-transfer-list').forEach(fs => transferList(fs));

/* Init Props */
document.querySelectorAll('[data-key]').forEach(input => { 
  input.addEventListener('input', () => setProperty(input))
  setProperty(input)
})

document.querySelectorAll('.js-list-target').forEach(list => {
  listTarget(list)
})


/* Init File Upload */
document.querySelectorAll('[type=file][multiple]').forEach(input => fileUpload(input))

/* Init One Time Code */
document.querySelectorAll('.ui-onetimecode').forEach(input => oneTimeCode(input))

document.querySelectorAll('.ui-countdown').forEach(element => uiCountDown(element, element.dataset))

document.querySelectorAll('.ui-digital-clock').forEach(element => uiDigitalClock(element))

document.querySelectorAll('.ui-embed button').forEach(button => uiEmbed(button))
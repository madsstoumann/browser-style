import timeAgo from './../../assets/js/timeAgo.js'
export default function uiChat(node, locale = document.documentElement.lang || 'en') {
  node.querySelectorAll('time[datetime]').forEach(timeElement => {
    const date = new Date(timeElement.dateTime)
    if (date) timeElement.textContent += timeAgo(date, locale)
  })
}
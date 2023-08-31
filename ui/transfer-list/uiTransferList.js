export default function uiTransferList(fs) {
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
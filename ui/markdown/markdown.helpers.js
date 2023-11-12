export function addItem(list, level, type, text) {
	if (level === 0) {
		if (list.type === type) list.children.push({ text, nested: [] })
		return
	}
	const listItem = list.children.at(-1)
	const nestedList = listItem.nested.at(-1)
	if (!nestedList || level === 1 && nestedList.type !== type) 
		listItem.nested.push({
			type,
			children: [],
		})
	addItem(listItem.nested.at(-1), level - 1, type, text)
}
export function generateList(list) {
  const listElement = document.createElement(list.type);
  generateListItems(list.children, listElement);
  return listElement;
}
function generateListItems(listItems, parentElement) {
  for (const listItem of listItems) {
    const listItemElement = document.createElement('li');
    listItemElement.textContent = listItem.text;
    parentElement.appendChild(listItemElement);
    listItem.nested.forEach(list => {
    	listItemElement.appendChild(generateList(list))
    })
  }
}
export function liquid(tag, text) {
	switch (tag) {
		case 'codepen':
			return `<iframe height="600" src="https://codepen.io/${text.replace('/pen/', '/embed/')}?height=600&amp;default-tab=result&amp;embed-version=2" scrolling="no" frameborder="no" allowtransparency="true" loading="lazy" style="width: 100%;"></iframe>`
		case 'jsfiddle':
			return `<iframe width="100%" height="300" src="https://jsfiddle.net/${text}/embedded/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>`
		case 'youtube':
			return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${text}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
	}
}
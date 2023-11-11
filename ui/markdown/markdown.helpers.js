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
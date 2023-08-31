import formatBytes from '../../assets/js/formatBytes.js';
export default function uiFileList(input) {
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
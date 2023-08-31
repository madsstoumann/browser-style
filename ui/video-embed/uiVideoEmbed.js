export default function uiVideoEmbed(button) {
  button.addEventListener('click', () => {
    const video = button.previousElementSibling;
    video.src = video.dataset.src;
  })
}
// if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));

function setColorScheme(scheme) { document.documentElement.dataset.bs = scheme; localStorage.setItem('color-scheme', scheme) }
const isDarkMode = () => localStorage.getItem('color-scheme') === 'dark-mode' || (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('color-scheme'))
if (isDarkMode()) setColorScheme('dark-mode');

const h1 = document.querySelector('.bs-header');
if (!!h1) {
  const scheme = document.createElement('button');
  scheme.innerHTML = `<svg viewBox="0 0 400 400"><circle r="180" cx="200" cy="200" fill="#FFF" stroke="#000" stroke-width="20" /><path d=" M 200 375 A 175 175 0 0 1 200 25" /><path d=" M 200 300 A 100 100 0 0 1 200 100" fill="#FFF" /><path d=" M 200 100 A 100 100 180 0 1 200 300" /></svg>`
  scheme.addEventListener('click', () => setColorScheme(isDarkMode() ? 'light-mode' : 'dark-mode') )
  h1.appendChild(scheme)
}
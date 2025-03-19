export default function uiDigitalClock(node) {
  const setProperty = (name, delay) => node.style.setProperty(name,`${delay}s`);
  const time = new Date();
  const hours = time.getHours() * 3600;
  const minutes = time.getMinutes() * 60;
  const seconds = time.getSeconds();
  setProperty('--delay-hours',  -Math.abs(hours + minutes + seconds));
  setProperty('--delay-minutes', -Math.abs(minutes + seconds));
  setProperty('--delay-seconds', -Math.abs(seconds));
}
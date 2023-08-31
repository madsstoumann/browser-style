export default function uiAnalogClock(node) {
  const time = new Date();
  const hour = -3600 * (time.getHours() % 12);
  const mins = -60 * time.getMinutes();
  node.style.setProperty('--_dm', `${mins}s`);
  node.style.setProperty('--_dh', `${(hour+mins)}s`);
}
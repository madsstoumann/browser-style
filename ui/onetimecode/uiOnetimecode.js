export default function uiOnetimecode(input) {
  if (!input) return
  input.addEventListener('input', () => input.style.setProperty('--_otp-digit-pos', input.selectionStart))
}
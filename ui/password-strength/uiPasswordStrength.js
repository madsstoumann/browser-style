export default function uiPasswordStrength(node) {
  node.addEventListener('input', function() {
    const result = zxcvbn(node.value);
    node.parentNode.style.setProperty('--strength', result.score);
  })
}
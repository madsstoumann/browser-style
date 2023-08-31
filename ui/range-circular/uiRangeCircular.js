export default function uiRangeCircular(label) {
  const input = label.firstElementChild;
  input.style.cssText = `--min: ${input.min-0}; --max: ${input.max-0||100};`;
	const CX = input.offsetWidth / 2, CY = input.offsetHeight / 2;
	const radian = 360 / (input.max-0||100 - input.min-0);
	const pointerMove = event => {
		const degree = (((Math.atan2(event.offsetY - CY, event.offsetX - CX) * 180 / Math.PI) + 360) % 360);
		input.value = (degree / radian);
		input.dispatchEvent(new Event('input'));
	}
	label.addEventListener('pointerdown', () => label.addEventListener('pointermove', pointerMove));
	['pointerleave', 'pointerup'].forEach(evt => 	label.addEventListener(evt, () => label.removeEventListener('pointermove', pointerMove)));
}
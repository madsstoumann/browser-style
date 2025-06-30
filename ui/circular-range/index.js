export default function circularRange(node) {
	const CX = node.offsetWidth / 2, CY = node.offsetHeight / 2;
	const min = Number(node.getAttribute('min')) || 0;
	const max = Number(node.getAttribute('max')) || 100;
	const step = Number(node.getAttribute('step')) || 1;
	const range = max - min;
	const radian = 360 / range;

	node.tabIndex = 0;
	node.style.setProperty('--_min', min);

	let lastValue = Number(node.getAttribute('value')) || min;

	const setValue = (newValue) => {
		const steppedValue = Math.round((newValue - min) / step) * step + min;
		const clampedValue = Math.max(min, Math.min(max, steppedValue));
		lastValue = clampedValue;
		node.setAttribute('value', clampedValue);
	}

	const pointerMove = event => {
		const degree = (((Math.atan2(event.offsetY - CY, event.offsetX - CX) * 180 / Math.PI) + 90 + 360) % 360);
		let value = (degree / radian) + min;
		if (Math.abs(value - lastValue) > range / 2) {
			value = (value < lastValue) ? max : min;
		}
		setValue(value);
	}

	const keydown = event => {
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
		event.preventDefault();
		const currentValue = Number(node.getAttribute('value')) || min;
		const newValue = currentValue + (event.key === 'ArrowUp' ? step : -step);
		setValue(newValue);
	}

	node.addEventListener('keydown', keydown);
	node.addEventListener('pointerdown', () => {
		lastValue = Number(node.getAttribute('value')) || min;
		node.addEventListener('pointermove', pointerMove);
	});
	['pointerleave', 'pointerup'].forEach(evt => 	node.addEventListener(evt, () => node.removeEventListener('pointermove', pointerMove)));
}
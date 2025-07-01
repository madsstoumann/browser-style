export default function circularRange(node) {
	const CX = node.offsetWidth / 2, CY = node.offsetHeight / 2;
	const min = Number(node.getAttribute('min')) || 0;
	const max = Number(node.getAttribute('max')) || 100;
	const step = Number(node.getAttribute('step')) || 1;
	const startAngle = Number(node.getAttribute('start')) || 0;
	const endAngle = Number(node.getAttribute('end')) || 360;
	const range = max - min;
	const angleRange = endAngle - startAngle;
	const radian = angleRange / range;

	node.tabIndex = 0;

	let lastValue;

	const setValue = (newValue) => {
		const steppedValue = Math.round((newValue - min) / step) * step + min;
		const clampedValue = Math.max(min, Math.min(max, steppedValue));
		const fillPercentage = (clampedValue - min) / range;

		lastValue = clampedValue;
		node.setAttribute('value', clampedValue);
		node.style.setProperty('--_value', clampedValue);
		node.style.setProperty('--_fill-angle', `${startAngle + (fillPercentage * angleRange)}deg`);
		node.style.setProperty('--_start-angle', `${startAngle}deg`);
		node.style.setProperty('--_end-angle', `${endAngle}deg`);
	}

	const pointerMove = event => {
		const degree = (((Math.atan2(event.offsetY - CY, event.offsetX - CX) * 180 / Math.PI) + 90 + 360) % 360);
		const relativeDegree = (degree - startAngle + 360) % 360;
		let value = (relativeDegree / radian) + min;

		if (angleRange < 360) {
			if (relativeDegree > angleRange) {
				const midGap = (360 - angleRange) / 2;
				setValue(relativeDegree - angleRange < midGap ? max : min);
				return;
			}
		} else {
			if (Math.abs(value - lastValue) > range / 2) {
				value = (value < lastValue) ? max : min;
			}
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

	setValue(Number(node.getAttribute('value')) || min);

	node.addEventListener('keydown', keydown);
	node.addEventListener('pointerdown', () => {
		lastValue = Number(node.getAttribute('value')) || min;
		node.addEventListener('pointermove', pointerMove);
	});
	['pointerleave', 'pointerup'].forEach(evt => 	node.addEventListener(evt, () => node.removeEventListener('pointermove', pointerMove)));
}
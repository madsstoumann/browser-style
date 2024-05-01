export default function uiRangeMinmax(fieldset) {
	const ranges = fieldset.querySelectorAll('input[type="range"]');
	const [minRange, maxRange] = ranges;
	const setProperty = (node, key, value) => node.style.setProperty(key, value);

	function updateValues() {
		const minValue = Number(minRange.value);
		const maxValue = Number(maxRange.value);

		if (minValue >= maxValue) {
			if (minValue === maxValue) {
				if (document.activeElement === minRange) {
					maxRange.value = Math.min(100, minValue + 1); // Adjust max if min is moved up to max
				} else if (document.activeElement === maxRange) {
					minRange.value = Math.max(0, maxValue - 1); // Adjust min if max is moved down to min
				}
			}
		}
		setProperty(fieldset, '--v1', minRange.value);
		setProperty(fieldset, '--v2', maxRange.value);
	}

	fieldset.addEventListener('input', updateValues);
	updateValues();
}
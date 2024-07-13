export default function uiProgressMeter(node) {
	const progress = node.querySelector('progress');
	const output = node.querySelector('output');
	const labels = Array.from(node.querySelectorAll('label'));
	const checkboxes = Array.from(node.querySelectorAll('input[type="checkbox"]'));
	const max = progress.max;
	const duration = 2000;

	labels.forEach(label => {
		const value = label.querySelector('input').value;
		const percentage = (value / max) * 100;
		label.style.setProperty('--_x', `${percentage}%`);
		label.style.setProperty('--_w', `${label.offsetWidth}px`);
	});

	const animateProgress = (start, end, duration) => {
		const startTime = performance.now();

		const updateProgress = (currentTime) => {
			const elapsed = currentTime - startTime;
			const progressFraction = Math.min(elapsed / duration, 1);
			const currentValue = start + (end - start) * progressFraction;
			const currentPercentage = (currentValue / max) * 100;
			const currentValueText = `${output.dataset.unitBefore || ''}${currentValue.toFixed(2)}${output.dataset.unitAfter || ''}`;

			progress.value = currentValue;
			output.textContent = currentValueText;
			output.style.setProperty('--_x', `${currentPercentage}%`);
			output.style.setProperty('--_w', `${output.offsetWidth}px`);

			checkboxes.forEach(checkbox => {
				const achievementValue = parseFloat(checkbox.value);
				checkbox.checked = currentValue >= achievementValue;
			});

			if (progressFraction < 1) {
				requestAnimationFrame(updateProgress);
			}
		};

		requestAnimationFrame(updateProgress);
	};

	const initialProgress = parseFloat(progress.getAttribute('value'));
	progress.value = 0;
	animateProgress(0, initialProgress, duration);
}

export default function uiSpinner(node) {
	const input = node.querySelector('[type=number]');
	const stepDown = node.querySelector('[name=step-down]');
	const stepFirst = node.querySelector('[name=step-first]');
	const stepLast = node.querySelector('[name=step-last]');
	const stepUp = node.querySelector('[name=step-up]');

	stepUp.addEventListener('click', () => input.stepUp())
	stepDown.addEventListener('click', () => input.stepDown())
	if (stepFirst) stepFirst.addEventListener('click', () => input.value = input.min)
	if (stepLast) stepLast.addEventListener('click', () => input.value = input.max)
}
export default function uiCountdown(node, locale = 'en-US') {
	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
	const setDelay = (name, delay) => {
		node.style.setProperty(`--delay-${name}`, `${delay}s`);
	}
	const setLabel = (type) => {
		const parts = rtf.formatToParts(3, type)
		 return parts.at(parts.length -1)?.value
	}

	const date = node.dataset.time ? new Date(node.dataset.time) : new Date()
	if (!node.dataset.time) date.setFullYear(date.getFullYear() + 1);

	const end = date.getTime();
	const remaining = end - Date.now();

	const DAY = 86400;
	const HOUR = 3600;

	const seconds = Math.floor((remaining / 1000) % 60);
	const days = Math.floor(remaining / (DAY * 1000));
	const hours = Math.floor((remaining / (HOUR * 1000)) % 24);
	const minutes = Math.floor((remaining / (60 * 1000)) % 60);

	const SECONDS = -Math.abs(60 - seconds)
	const MINUTES = -Math.abs(HOUR - (minutes * 60) - (60 - 1) - SECONDS);
	const HOURS =  -Math.abs(DAY - (hours * HOUR) + MINUTES);

	[...node.children].forEach((child, index) => {
		child.textContent = setLabel(child.dataset.label)
	})
	
	setDelay('days', -Math.abs(31536000 - (days * DAY) + HOURS));
	setDelay('hours', HOURS);
	setDelay('minutes', MINUTES);
	setDelay('seconds', SECONDS);
}
export default function countDown(element) {
	const locale = element.lang || document.documentElement.getAttribute('lang') || 'en-US';
	const endTime = new Date(element.getAttribute('datetime')).getTime();
	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
	const zero = new Intl.NumberFormat(locale).format(0);

	const getRemainingTime = (endTime, currentTime = new Date().getTime()) => endTime - currentTime;
	const showTime = () => {
		const remainingTime = getRemainingTime(endTime);
		element.innerHTML = 
			timePart(Math.floor(remainingTime / (24 * 60 * 60 * 1000)), 'day') +
			timePart(Math.floor((remainingTime / (60 * 60 * 1000)) % 24), 'hour') +
			timePart(Math.floor((remainingTime / (60 * 1000)) % 60), 'minute') +
			timePart(Math.floor((remainingTime / 1000) % 60), 'second');
		if (remainingTime >= 1000) requestAnimationFrame(showTime);
	}
	const timePart = (part, type) => {
		const parts = rtf.formatToParts(part === 0 ? 2 : part, type);
		if (parts && parts.length === 3) parts.shift();
		const [unit, label] = parts; 
		return `<span><strong>${part === 0 ? zero : unit.value}</strong><small>${label.value}</small></span>`
	}
	requestAnimationFrame(showTime);
}
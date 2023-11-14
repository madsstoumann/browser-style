import datasetWithTypes from './../../assets/js/datasetWithTypes.js';
export default function uiCalendar(node, args = {}) {
	const today = new Date();
	const config = Object.assign({
		class: 'ui-calendar',
		locale: (node.getAttribute('lang') || document.documentElement.getAttribute('lang') || 'en-US'),
		today: {
			day: today.getDate(),
			month: today.getMonth(),
			year: today.getFullYear()
		}
	}, (typeof args === 'object') ? args : datasetWithTypes(node.dataset || {}));

	const pad = (val) => (val + 1).toString().padStart(2, '0');
	const render = (date, locale) => {
		const month = date.getMonth();
		const year = date.getFullYear();
		const numOfDays = new Date(year, month + 1, 0).getDate();
		const renderToday = (year === config.today.year) && (month === config.today.month);

		return `<div class="${config.class}">
			<time datetime="${year}-${(pad(month))}">${new Intl.DateTimeFormat(locale, { month: 'long'}).format(date)} <i>${year}</i></time>
			<ul>${weekdays(config.info.firstDay,locale).map(name => `<li><abbr title="${name.long}">${name.short}</abbr></li>`).join('')}</ul>
			<ol data-firstday="${config.info.firstDay}">
			${[...Array(numOfDays).keys()].map(i => {
				const cur = new Date(year, month, i + 1);
				let day = cur.getDay(); if (day === 0) day = 7;
				const today = renderToday && (config.today.day === i + 1) ? ' data-today':'';
				return `<li data-day="${day}"${today}${i === 0 || day === config.info.firstDay ? ` data-weeknumber="${new Intl.NumberFormat(locale).format(getWeek(cur))}"`:''}${config.info.weekend.includes(day) ? ` data-weekend`:''}>
					<time datetime="${year}-${(pad(month))}-${pad(i)}" tabindex="0">${new Intl.NumberFormat(locale).format(i + 1)}</time>
				</li>`
			}).join('')}
			</ol>
		</div>`;
	}

	const weekdays = (firstDay, locale) => {
		const date = new Date(0)
		return [...Array(7).keys()].map((i) => {
			date.setDate(5 + (firstDay - 1) + i)
			return {
				long: new Intl.DateTimeFormat([locale], { weekday: 'long'}).format(date),
				short: new Intl.DateTimeFormat([locale], { weekday: 'short'}).format(date)
			}
		})
	}

	const date = config.date ? new Date(config.date) : today;
	if (!config.info) config.info = new Intl.Locale(config.locale).weekInfo || { firstDay: 7, weekend: [6, 7] };
	node.innerHTML = config.year ? [...Array(12).keys()].map(i => render(new Date(date.getFullYear(), i, date.getDate()), config.locale, date.getMonth())).join('') : render(date, config.locale)
}

function getWeek(cur) {
	const date = new Date(cur.getTime());
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	const week = new Date(date.getFullYear(), 0, 4);
	return 1 + Math.round(((date.getTime() - week.getTime()) / 86400000 - 3 + (week.getDay() + 6) % 7) / 7);
}
const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host::part(canvas) {
		background: var(--sun-phase-bg,hsl(210, 55%, 50%));
		border-radius: var(--sun-phase-bdrs, 1rem);
	}
	:host::part(line-night) {
		fill: none;
		stroke: var(--sun-phase-line-night-bdc,hsl(210, 55%, 40%));
		stroke-width: var(--sun-phase-line-night-bdw, 2);
	}
	:host::part(line-day) {
		fill: none;
		stroke: var(--sun-phase-line-day-bdc,hsl(210, 85%, 80%));
		stroke-width: var(--sun-phase-line-day-bdw, 2);
	}
	:host::part(baseline) {
		stroke: var(--sun-phase-baseline-bdc, hsl(210, 55%, 65%));
		stroke-width: var(--sun-phase-baseline-bdw, 1.25);
	}
	:host::part(sun) {
		fill: var(--sun-phase-sun-bg, #fff);
		filter: url(#glow);
		stroke-width: 0;
	}
	/* STATES */
	:host::part(night) {
		--sun-phase-baseline-bdc: hsl(210, 35%, 35%);
		--sun-phase-bg: hsl(210, 55%, 10%);
		--sun-phase-line-day-bdc: hsl(210, 55%, 20%);
		--sun-phase-line-night-bdc: hsl(210, 55%, 40%);
		--sun-phase-sun-bg: hsl(210, 55%, 15%);
	}
	:host::part(rising) {
		--sun-phase-sun-bg: hsla(0, 0%, 100%, 0.65);
	}
	:host::part(setting) {
		--sun-phase-sun-bg: hsla(0, 0%, 100%, 0.45);
	}
	`);

export default class SunPhase extends HTMLElement {
	#root;
	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];


		/* DEMO */
		const sunrise = new Date('2023-10-01T06:21:00'); // Example sunrise time
			const sunset = new Date('2023-10-01T20:03:00'); // Example sunset time
			const time = new Date('2023-10-01T19:50:00'); // Set to 8:00 AM
			const sunriseMinutes = sunrise.getHours() * 60 + sunrise.getMinutes();
			const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();
			const currentMinutes =
				time.getHours() * 60 + time.getMinutes();
		this.#root.innerHTML = this.#render(sunriseMinutes, sunsetMinutes, currentMinutes);


	}

	#render(sunrise, sunset, time, settings = {}) {
		const {
			arcHeight = 60,
			height = 100,
			sunRadius = 6,
			width = 200
		} = settings;

		const baseline = height / 2;
		const totalMinutesInDay = 24 * 60;
		const sunriseX = (width / totalMinutesInDay) * sunrise;
		const sunsetX = (width / totalMinutesInDay) * sunset;
		const tDay = (xPos) => (xPos - sunriseX) / (sunsetX - sunriseX);

		const getDayPathY = (xPos) => {
			const t = tDay(xPos);
			return t >= 0 && t <= 1
				? Math.pow(1 - t, 2) * baseline +
						2 * (1 - t) * t * (baseline - arcHeight) +
						Math.pow(t, 2) * baseline
				: null;
		};

		const arcStartBefore = height - getDayPathY(2 * sunriseX);
		const arcEndAfter = height - getDayPathY(width - 2 * (width - sunsetX));

		const nightPathStart = `M 0 ${arcStartBefore} Q ${
			sunriseX / 2
		} ${arcStartBefore} ${sunriseX} ${baseline}`;
		const dayPath = `M ${sunriseX} ${baseline} Q ${
			(sunriseX + sunsetX) / 2
		} ${baseline - arcHeight} ${sunsetX} ${baseline}`;
		const nightPathEnd = `M ${sunsetX} ${baseline} Q ${
			(width + sunsetX) / 2
		} ${arcEndAfter} ${width} ${arcEndAfter}`;

		let sunX, sunY, t, part = 'night';
		const threshold = 30;
		if (time < sunrise) {
			t = time / sunrise;
			sunX = width * (time / totalMinutesInDay);
			sunY = 75 * (1 - t * t) + baseline * (t * t);
		} else if (time > sunset) {
			t = (time - sunset) / (totalMinutesInDay - sunset);
			sunX = sunsetX + (width - sunsetX) * t;
			sunY = baseline * (1 - t) + 75 * t + (75 - baseline) * (1 - t) * t;
		} else {
			t = (time - sunrise) / (sunset - sunrise);
			sunX = sunriseX + (sunsetX - sunriseX) * t;
			sunY =
				baseline * (Math.pow(1 - t, 2) + Math.pow(t, 2)) +
				(baseline - arcHeight) * (2 * (1 - t) * t);
			part = 'day';
		}

		if (time <= sunrise + threshold) {
			part = 'rising';
		} else if (
			time >= sunset - threshold &&
			time <= sunset
		) {
			part = 'setting';
		} else if (time >= sunrise && time <= sunset) {
			part = 'day';
		} else {
			part = 'night';
		}

		return `
		<svg viewBox="0 0 ${width} ${height}" part="canvas ${part}">
			<defs>
				<filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
					<feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
					<feColorMatrix in="blur" mode="matrix" values="
						0.5 0 0 0 0.5
						0 0.5 0 0 0.5
						0 0 0.5 0 0.5
						0 0 0 2 0" result="glow" />
					<feMerge>
						<feMergeNode in="glow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
				<path d="${nightPathStart}" part="line-night" />
				<path d="${dayPath}" part="line-day" />
				<path d="${nightPathEnd}" part="line-night" />
				<line x1="0" y1="${baseline}" x2="${width}" y2="${baseline}" part="baseline" />
				<circle cx="${sunX}" cy="${sunY}" r="${sunRadius}" part="sun" />
		</svg>`;
	}
}
customElements.define('sun-phase', SunPhase);
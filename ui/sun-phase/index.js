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
		--sun-phase-bg: hsl(210, 55%, 30%);
		--sun-phase-sun-bg: hsla(0, 0%, 100%, 0.5);
	}
	:host::part(setting) {
		--sun-phase-bg:hsl(210, 55%, 20%);
		--sun-phase-sun-bg: hsla(0, 0%, 100%, 0.5);
	}
	`);

export default class SunPhase extends HTMLElement {
	#root;

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
	}

	connectedCallback() {
		const sunriseAttr = this.getAttribute('sunrise');
		const sunsetAttr = this.getAttribute('sunset');
		const timeAttr = this.getAttribute('time');

		if (sunriseAttr && sunsetAttr && timeAttr) {
			const sunrise = this.#parseTimeToMinutes(sunriseAttr);
			const sunset = this.#parseTimeToMinutes(sunsetAttr);
			const time = this.#parseTimeToMinutes(timeAttr);
			
			this.#root.innerHTML = this.#render(sunrise, sunset, time);
		}
	}

	#parseTimeToMinutes(timeStr) {
		if (/^\d+$/.test(timeStr)) {
			return parseInt(timeStr, 10);
		}

		const timePattern = /^(\d{1,2}):(\d{1,2})$/;
		const match = timeStr.match(timePattern);
		
		if (match) {
			const hours = parseInt(match[1], 10);
			const minutes = parseInt(match[2], 10);
			return hours * 60 + minutes;
		}
		return 0;
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
			// For morning night path: follow the bezier curve
			t = time / sunrise; // normalized position along the path (0 to 1)
			sunX = width * (time / totalMinutesInDay);
			
			// Bezier curve formula: P = (1-t)²P₁ + 2(1-t)tP₂ + t²P₃
			// Where P₁ = start point, P₂ = control point, P₃ = end point
			const p1y = arcStartBefore;
			const p2y = arcStartBefore;
			const p3y = baseline;
			
			sunY = Math.pow(1-t, 2) * p1y + 2 * (1-t) * t * p2y + Math.pow(t, 2) * p3y;
		} else if (time > sunset) {
			// For evening night path: follow the bezier curve
			t = (time - sunset) / (totalMinutesInDay - sunset);
			sunX = sunsetX + (width - sunsetX) * t;
			
			// Bezier curve formula for evening path
			const p1y = baseline;
			const p2y = arcEndAfter;
			const p3y = arcEndAfter;
			
			sunY = Math.pow(1-t, 2) * p1y + 2 * (1-t) * t * p2y + Math.pow(t, 2) * p3y;
		} else {
			// For daytime path (unchanged)
			t = (time - sunrise) / (sunset - sunrise);
			sunX = sunriseX + (sunsetX - sunriseX) * t;
			sunY =
				baseline * (Math.pow(1 - t, 2) + Math.pow(t, 2)) +
				(baseline - arcHeight) * (2 * (1 - t) * t);
			part = 'day';
		}

		// Fix: Only set "rising" if we're within threshold minutes of sunrise
		if (time >= sunrise - threshold && time <= sunrise + threshold) {
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
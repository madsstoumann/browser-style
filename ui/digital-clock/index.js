CSS.registerProperty({
	name: '--seconds',
	syntax: '<integer>',
	initialValue: '0',
	inherits: false
});

CSS.registerProperty({
	name: '--minutes',
	syntax: '<integer>',
	initialValue: '0',
	inherits: false
});

CSS.registerProperty({
	name: '--hours',
	syntax: '<integer>',
	initialValue: '0',
	inherits: false
});

const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    background-color: var(--digital-clock-bg, var(--CanvasGray));
    border-radius: var(--digital-clock-bdrs, var(--input-bdrs));
    box-sizing: border-box;
    color-scheme: light dark;
    display: flex;
    direction: ltr;
    gap: var(--digital-clock-gap, 1ch);
    inline-size: min-content;
    padding: var(--digital-clock-p, .75ch 1.5ch);
  }
  [part~=ampm]::after {
    content: counter(hours, am-pm);
  }
  [part~=date] {
    font-family: var(--digital-clock-date-ff, inherit);
    font-size: var(--digital-clock-date-fs, inherit);
    font-weight: var(--digital-clock-date-fw, inherit);
    text-wrap: nowrap;
  } 
  [part~=label] {
    font-family: var(--digital-clock-label-ff, inherit);
    font-size: var(--digital-clock-label-fs, inherit);
    font-weight: var(--digital-clock-label-fw, inherit);
    text-wrap: nowrap;
  }
  [part~=time] {
    all: unset;
    display: grid;
    font-size: var(--digital-clock-fs, inherit);
    font-variant-numeric: tabular-nums;
    font-weight: var(--digital-clock-fw, inherit);
    grid-auto-flow: column;
    inline-size: min-content;
    list-style: none;
    text-wrap: nowrap;
  }
  [part~=ampm],
  [part~=hours] {
    animation: hours 86400s steps(24, end) infinite;
    animation-delay: var(--delay-hours, 0s);
    counter-reset: hours var(--hours);
  }
  [part~=hours]::after {
    content: counter(hours, var(--number-system, decimal-leading-zero)) ' ';
  }
  [part~=minutes] {
    animation: minutes 3600s steps(60, end) infinite;
    animation-delay: var(--delay-minutes, 0s);
    counter-reset: minutes var(--minutes);
  }
  [part~=minutes]::before {
    content: ':';
  }
  [part~=minutes]::after {
    content: counter(minutes, var(--number-system, decimal-leading-zero)) ' ';
  }
  [part~=seconds] {
    animation: seconds 60s steps(60, end) infinite;
    animation-delay: var(--delay-seconds, 0s);
    counter-reset: seconds var(--seconds);
  }
  [part~=seconds]::before {
    content: ':';
  }
  [part~=seconds]::after {
    content: counter(seconds, var(--number-system, decimal-leading-zero)) ' ';
  }
  :host([time*="12hour"])::part(hours) {
    counter-reset: hours calc(mod(var(--hours) - 1, 12) + 1);
  }

  @keyframes hours {
    from { --hours: 0; }
    to { --hours: 24; } 
  }
  @keyframes minutes { 
    from { --minutes: 0; }
    to { --minutes: 60; } 
  }
  @keyframes seconds { 
    from { --seconds: 0;}
    to { --seconds: 60; }
  }
`);

let counterStyleInjected = false;

export default class DigitalClock extends HTMLElement {
	#root;
	#date;
	#label;

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];

		const hasDate = this.hasAttribute('date');
		const hasLabel = this.hasAttribute('label');
		const time = this.getAttribute('time');
		const is12Hour = time?.includes('12hour');

		this.#root.innerHTML = `
			${hasLabel ? `<span part="label"></span>`:''}
			${hasDate ? `<span part="date"></span>`:''}
			<ol part="time">
				<li part="hours"></li>
				<li part="minutes"></li>
				${time?.includes('short') ? '':`<li part="seconds"></li>`}
				${is12Hour ? `<li part="ampm"></li>` : ''}
			</ol>
		`;

		if (hasDate) {
			this.#date = this.#root.querySelector('[part=date]');
		}
		if (hasLabel) {
			this.#label = this.#root.querySelector('[part=label]');
			this.#label.textContent = this.getAttribute('label') || '';
		}
		this.#updateClock(hasDate);

		if (!counterStyleInjected) {
			/* Safari Hack: Safari has issues with counter-style in shadow DOM */
			this.#injectCounterStyle();
			counterStyleInjected = true;
		}
	}

	#formatDate(date, format) {
		const lang = this.getAttribute('lang') ||  document.documentElement.lang || navigator.language;
		let options;
		switch (format) {
			case 'narrow':
				options = { 
					day: 'numeric',
					month: 'numeric',
					year: '2-digit'
				};
				break;
			case 'short':
				options = { 
					day: 'numeric',
					month: 'short',
					year: '2-digit'
				};
				break;
			case 'full':
			default:
				options = { 
					weekday: 'long',
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				};
		}
		return new Intl.DateTimeFormat(lang, options).format(date);
	}

	#injectCounterStyle() {
		const style = document.createElement('style');
		style.textContent = `
			@counter-style am-pm {
				system: cyclic;
				symbols: "am" "am" "am" "am" "am" "am" "am" "am" "am" "am" "am" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "am";
			}
		`;
		document.head.appendChild(style);
	}

	#roundTzOffset(offset) {
		return Math.round((parseFloat(offset) || 0) * 4) / 4
	};

	#updateClock(hasDate) {
		const time = new Date();
		const tzOffset = this.#roundTzOffset(this.getAttribute('timezone') || '0');
		const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
		const tzTime = new Date(utc + (3600000 * tzOffset));

		const hours = tzTime.getHours() * 3600;
		const minutes = tzTime.getMinutes() * 60;
		const seconds = tzTime.getSeconds();

		this.style.setProperty('--delay-hours', `-${hours + minutes + seconds}s`);
		this.style.setProperty('--delay-minutes', `-${minutes + seconds}s`);
		this.style.setProperty('--delay-seconds', `-${seconds}s`);
		this.style.setProperty('--number-system', this.getAttribute('number-system') || 'decimal-leading-zero');
		if (hasDate) this.#updateDate(tzTime);
	}

	#updateDate(tzTime) {
		const dateAttr = this.getAttribute('date');
		if (dateAttr) {
			this.#date.textContent = this.#formatDate(tzTime, dateAttr);
			this.#date.hidden = false;
		} else {
			this.#date.hidden = true;
		}
	}
}

customElements.define('digital-clock', DigitalClock);

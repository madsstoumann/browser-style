/**
 * <ui-analog-clock>
 * Light DOM web component wrapper for the CSS-first analog clock.
 * Auto-generates standard structural elements (ol, ul, nav, span) when omitted.
 * Sets CSS initial variables for the current time based on timezone.
 * @version 4.0.0
 */

class UiAnalogClock extends HTMLElement {
	static observedAttributes = ['timezone', 'date', 'numerals', 'indices', 'marker', 'marker-hour', 'label', 'type'];
	#dateEl;

	connectedCallback() {
		if (!this.querySelector(':scope > nav')) this.render();
		this.updateClock();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		if (['numerals', 'indices', 'marker', 'marker-hour', 'type'].includes(name)) {
			// Wipe and re-render structure if these structural attributes change
			this.innerHTML = '';
			this.render();
		}
		this.updateClock();
	}

	render() {
		const label = this.getAttribute('label');
		const indices = this.getAttribute('indices');
		const numerals = this.getAttribute('numerals');

		// Ticks
		if (indices) {
			const count = indices === 'hours' ? 12 : parseInt(indices) || 60;
			const ul = document.createElement('ul');
			const marker = this.getAttribute('marker') || '|';
			const markerHour = this.getAttribute('marker-hour') || marker;

			for (let i = 0; i < count; i++) {
				const li = document.createElement('li');
				const isHourMark = (count === 12) || i % 5 === 0;
				if (isHourMark) li.setAttribute('data-hour', '');
				li.textContent = isHourMark ? markerHour : marker;
				ul.appendChild(li);
			}
			this.appendChild(ul);
		}

		// Numerals
		if (numerals) {
			let count = parseInt(numerals) || 12;
			count = Math.min(12, Math.max(1, count));
			const ol = document.createElement('ol');
			for (let i = 0; i < count; i++) {
				const li = document.createElement('li');
				const num = ((i * (12 / count))) % 12 || 12;
				li.textContent = this.formatNumber(num);
				ol.appendChild(li);
			}
			this.appendChild(ol);
		}

		// Hands
		const nav = document.createElement('nav');
		['seconds', 'minutes', 'hours'].forEach(hand => {
			const b = document.createElement('b');
			b.setAttribute('data-hand', hand);
			nav.appendChild(b);
		});
		
		if (this.hasAttribute('date')) {
			this.#dateEl = document.createElement('time');
			nav.appendChild(this.#dateEl);
		}
		this.appendChild(nav);

		// Label
		if (label) {
			const span = document.createElement('span');
			span.textContent = label;
			this.appendChild(span);
		}
	}

	formatNumber(num) {
		const type = this.getAttribute('type') || 'arab';
		const map = {
			'roman': ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'],
			'roman-alt': ['I','II','III','IIII','V','VI','VII','VIII','IX','X','XI','XII']
		};
		if (!map[type]) return num.toString();
		return map[type][num - 1];
	}

	roundTzOffset(offset) {
		return Math.round((parseFloat(offset) || 0) * 4) / 4;
	}

	updateClock() {
		const time = new Date();
		const tzOffset = this.roundTzOffset(this.getAttribute('timezone') || -(time.getTimezoneOffset() / 60));
		
		// Setup UTC tracking then apply tzOffset
		const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
		const tzTime = new Date(utc + (3600000 * tzOffset));

		const hour = -3600 * (tzTime.getHours() % 12);
		const mins = -60 * tzTime.getMinutes();
		const secs = -tzTime.getSeconds();

		if (this.#dateEl && this.hasAttribute('date')) {
			this.#dateEl.textContent = this.formatDate(tzTime);
		}

		// Update base CSS vars injected dynamically onto the host block
		this.style.setProperty('--_dh', `${(hour+mins)}s`);
		this.style.setProperty('--_dm', `${mins}s`);
		this.style.setProperty('--_ds', `${secs}s`);
		
		if (this.hasAttribute('label')) {
			let span = this.querySelector(':scope > span');
			if (!span) {
				span = document.createElement('span');
				this.appendChild(span);
			}
			span.textContent = this.getAttribute('label');
		}
	}

	formatDate(tzTime) {
		const dateSetting = this.getAttribute('date');
		if (dateSetting === "short") return tzTime.getDate();
		return new Intl.DateTimeFormat(document.documentElement.lang || 'en', { 
			weekday: "short", 
			day: "numeric" 
		}).format(tzTime);
	}
}

customElements.define('ui-analog-clock', UiAnalogClock);
export { UiAnalogClock };

class SpeedTicket extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.data = null;
		this.state = {
			speed: 50,
			roadType: 'cityZone',
			vehicle: 'car',
			factors: []
		};
		this._form = null;
		this.setupStyles();
	}

	setupStyles() {
		const styleSheet = new CSSStyleSheet();
		styleSheet.replaceSync(`
			:host {
				--speed-ticket-accent: hsl(207, 100%, 25%);
				--speed-ticket-muted-c: hsl(215.4, 16.3%, 46.9%);
				--speed-ticket-bdrs: 0.5rem;
				--speed-ticket-p: 1rem;


				container-type: inline-size;
				display: block;
				font-family: system-ui, sans-serif;
			}

			form {
				display: grid;
				gap: 1rem;
				grid-template-columns: 1fr;
			}

			@container (min-width: 42rem) {
				form {
						grid-template-columns: 1fr 1fr;
				}
			}

			[name="speed"] {
				label { 
					display: grid;
					grid-template-columns: 1fr 1fr;
					input { grid-column: span 2; }
					small:last-of-type { text-align: end; }
				}
					strong:has(output[name="result"]) {
						color: var(--speed-ticket-accent);
						font-size: 2.25rem;
						font-weight: 700;
					}
			}

			fieldset {
				display: grid;
				border: 2px solid #e0e0e0;
				border-radius: var(--speed-ticket-bdrs);
				margin: 0;
				padding: var(--speed-ticket-p);
				row-gap: 0.5rem;
			}
			
			legend {
				color: var(--speed-ticket-accent);
				display: contents;
				font-size: var(--speed-ticket-legend-fs, 1.5rem);
				font-weight: bold;
				small {
					color: var(--speed-ticket-muted-c);
					font-size: 0.9rem;
					font-weight: 300;
				}
			}
			


			

			
			input[type="radio"], input[type="checkbox"] {
				margin-right: 8px;
			}
			

			
			output[name="description"] {
				display: block;
				margin: 10px 0;
				padding: 10px;
				border-radius: 4px;
			}
			
			output[name="description"].info {
				background: #f0f9ff;
				color: #0369a1;
			}
			
			output[name="description"].success {
				background: #f0fdf4;
				color: #166534;
			}
			
			output[name="description"].warning {
				background: #fffbeb;
				color: #d97706;
			}
			
			output[name="description"].danger {
				background: #fef2f2;
				color: #dc2626;
			}
			
			output[name="fine"] {
				font-size: 2.5em;
				
				display: block;
			font-family: Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif;
font-weight: bold;
			}
			

			
			.range-labels {
				display: flex;
				justify-content: space-between;
				font-size: 0.9em;
				color: #666;
			}
		`);
		
		this.shadowRoot.adoptedStyleSheets = [styleSheet];
	}

	async connectedCallback() {
		await this.loadData();
		this.render();
	}

	async loadData() {
		try {
			const dataUrl = this.getAttribute('data') || './data.json';
			const response = await fetch(dataUrl);
			this.data = await response.json();
		} catch (error) {
			console.error('Failed to load data:', error);
		}
	}

	render() {
		if (!this.data) return;
		const speedLimit = this.data.roadTypes[this.state.roadType].defaultSpeed;
		const description = this.calculateDescription(this.state.speed, speedLimit);
		const fineResult = this.calculateFine();

		this.shadowRoot.innerHTML = `
			<form>
				<fieldset name="speed">
					<legend>${this.data.labels.yourSpeed}
						<small>${this.data.labels.speedLimit}:
							<output name="limit" aria-live="polite" aria-atomic="true">${speedLimit}</output> ${this.data.speedRange.unit}
						</small>
					</legend>
					<strong>
						<output name="result">${this.state.speed}</output>
						${this.data.speedRange.unit}
					</strong>
					<output name="description" class="${this.getViolationStatus(this.state.speed, speedLimit)}" aria-live="polite" aria-atomic="true">${description}</output>
					<output name="fine" aria-live="polite" aria-atomic="true">${fineResult.fine}</output>
					<label>
						<input type="range" 
									 min="${this.data.speedRange.min}" 
									 max="${this.data.speedRange.max}" 
									 name="value" 
									 value="${this.state.speed}" 
									 step="${this.data.speedRange.step}">
							<small aria-hidden>${this.data.speedRange.min} ${this.data.speedRange.unit}</small>
							<small aria-hidden>${this.data.speedRange.max} ${this.data.speedRange.unit}</small>
					</label>
				</fieldset>

				<fieldset name="road">
					<legend>${this.data.labels.roadType}</legend>
					${Object.values(this.data.roadTypes).map(roadType => `
						<label>
							${roadType.label}
							<small>${roadType.description}</small>
							<input type="radio" 
										 name="roadtype" 
										 value="${roadType.value}" 
										 data-id="${roadType.id}"
										 ${roadType.id === this.state.roadType ? 'checked' : ''}>
						</label>
					`).join('')}
				</fieldset>

				<fieldset name="vehicles">
					<legend>${this.data.labels.vehicle}</legend>
					${Object.values(this.data.vehicles).map(vehicle => `
						<label>
							${vehicle.label}
							<input type="radio" 
										 name="vehicle" 
										 value="${vehicle.value}" 
										 data-id="${vehicle.id}"
										 ${vehicle.id === this.state.vehicle ? 'checked' : ''}>
						</label>
					`).join('')}
				</fieldset>

				<fieldset name="factors">
					<legend>${this.data.labels.factors}</legend>
					${Object.values(this.data.factors).map(factor => `
						<label>
							<input type="checkbox" 
										 name="factor" 
										 value="${factor.value}" 
										 data-id="${factor.id}"
										 ${this.state.factors.includes(factor.id) ? 'checked' : ''}>
							<strong>${factor.label}</strong>
							<small>${factor.description}</small>
						</label>
					`).join('')}
				</fieldset>
			</form>
		`;

		this._form = this.shadowRoot.querySelector('form');
		this._form.addEventListener('input', this.handleInput.bind(this));
	}

	handleInput(event) {
		const { target } = event;
		const { name, value, checked } = target;

		switch (name) {
			case 'value':
				this.state.speed = parseInt(value);
				break;
			case 'roadtype':
				if (checked) this.state.roadType = target.dataset.id;
				break;
			case 'vehicle':
				if (checked) this.state.vehicle = target.dataset.id;
				break;
			case 'factor':
				const factorId = target.dataset.id;
				if (checked) {
					if (!this.state.factors.includes(factorId)) {
						this.state.factors.push(factorId);
					}
				} else {
					this.state.factors = this.state.factors.filter(id => id !== factorId);
				}
				break;
		}

		const speedLimit = this.data.roadTypes[this.state.roadType].defaultSpeed;
		this._form.elements.result.value = this.state.speed;
		this._form.elements.limit.value = speedLimit;

		const description = this.calculateDescription(this.state.speed, speedLimit);
		this._form.elements.description.value = description;
		this._form.elements.description.className = this.getViolationStatus(this.state.speed, speedLimit);

		// Calculate and display the fine
		const fineResult = this.calculateFine();
		this._form.elements.fine.value = fineResult.fine;
	}

	getViolationStatus(speed, speedLimit) {
		if (speed <= speedLimit) return 'success';
		const percentageOver = ((speed / speedLimit) * 100) - 100;
		return percentageOver >= 30 ? 'danger' : percentageOver >= 10 ? 'warning' : 'info';
	}

	calculateDescription(speed, speedLimit) {
		if (speed <= speedLimit) return this.data.messages.noFine;

		const percentageOver = ((speed / speedLimit) * 100) - 100;
		const penaltyRange = this.data.penaltyRanges
			.slice()
			.reverse()
			.find(range => percentageOver >= range.percentageOver);

		return penaltyRange 
			? `${penaltyRange.description} - ${penaltyRange.consequence}`
			: this.data.messages.defaultViolation;
	}

	calculateFine() {
		const speedLimit = this.data.roadTypes[this.state.roadType].defaultSpeed;
		const vehicle = this.data.vehicles[this.state.vehicle];

		if (this.state.speed <= speedLimit) return { fine: "0" };

		const percentageOver = ((this.state.speed / speedLimit) * 100) - 100;

		const vehicleLimit = this.data.vehicleSpecificLimits[vehicle.id];
		if (vehicleLimit && this.state.speed > vehicleLimit.maxSpeed) {
			return { fine: "0", consequence: this.data.vehicleSpecificLimits[vehicle.id]?.message || "Overskridelse af køretøjsspecifik hastighedsgrænse" };
		}

		const penaltyRange = this.data.penaltyRanges
			.slice()
			.reverse()
			.find(range => percentageOver >= range.percentageOver);

		if (!penaltyRange) return { fine: "0" };

		let finalFine;
		if (vehicle.category === 'bus' || vehicle.category === 'truck' || vehicle.category === 'bus100' || this.state.factors.includes('trailer')) {
			finalFine = penaltyRange.rate3;
		} else if (speedLimit >= 100 && (vehicle.category === 'car' || vehicle.category === 'mc')) {
			finalFine = penaltyRange.rate2;
		} else {
			finalFine = penaltyRange.rate1;
		}

		if (percentageOver >= 30 && (this.state.roadType === 'cityZone' || (this.state.roadType === 'countryRoad' && speedLimit <= 90))) {
			finalFine += this.data.specialRules.highSpeedByzone.penalty;
		}
		if (this.state.speed >= 140) {
			finalFine += Math.floor((this.state.speed - 140) / 10) * 600 + 1200;
		}

		finalFine = this.state.factors.reduce((currentFine, factorId) => {
			const factor = this.data.factors[factorId];
			return factor?.multiplier ? currentFine * factor.multiplier : currentFine;
		}, finalFine);

		const roundedFine = Math.round(finalFine);
		const formattedFine = new Intl.NumberFormat(this.data.locale, { style: 'currency', currency: this.data.currency || 'DKK' }).format(roundedFine);
		const isUnconditional = this.isUnconditionalLoss(percentageOver, vehicle);

		return {
			fine: formattedFine,
			consequence: isUnconditional ? this.data.messages.unconditionalLoss : penaltyRange.consequence
		};
	}

	isUnconditionalLoss(percentageOver, vehicle) {
		if (this.state.speed >= 200) return true;
		
		const rules = [
			() => (vehicle.category === 'car' || vehicle.category === 'mc') && !this.state.factors.includes('trailer') && percentageOver >= 101 && this.state.speed >= 101,
			() => (vehicle.category === 'car' || vehicle.category === 'mc') && this.state.factors.includes('trailer') && percentageOver >= 100 && this.state.speed >= 101,
			() => (vehicle.category === 'bus' || vehicle.category === 'truck' || vehicle.category === 'bus100') && percentageOver >= 101 && this.state.speed >= 101
		];
		
		return rules.some(rule => rule());
	}
}

customElements.define('speed-ticket', SpeedTicket);

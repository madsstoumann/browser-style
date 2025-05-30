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
				display: block;
				font-family: system-ui, -apple-system, sans-serif;
			}
			
			form {
				max-width: 600px;
				margin: 0 auto;
				padding: 20px;
			}
			
			fieldset {
				margin: 20px 0;
				padding: 15px;
				border: 2px solid #e0e0e0;
				border-radius: 8px;
			}
			
			legend {
				font-weight: bold;
				padding: 0 10px;
				color: #333;
			}
			
			legend small {
				font-weight: normal;
				color: #666;
				font-size: 0.9em;
			}
			
			label {
				display: block;
				margin: 10px 0;
				cursor: pointer;
			}
			
			input[type="range"] {
				width: 100%;
				margin: 10px 0;
			}
			
			input[type="radio"], input[type="checkbox"] {
				margin-right: 8px;
			}
			
			output {
				font-weight: bold;
				color: #2563eb;
			}
			
			output[name="result"] {
				font-size: 2em;
				display: block;
				margin: 10px 0;
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
			
			small {
				display: block;
				color: #666;
				font-size: 0.9em;
				margin-top: 2px;
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

		this.shadowRoot.innerHTML = `
			<form>
				<fieldset name="speed">
					<legend>${this.data.labels.yourSpeed}
						<small>${this.data.labels.speedLimit}:
							<output name="limit">${speedLimit}</output> ${this.data.speedRange.unit}
						</small>
					</legend>
					<strong>
						<output name="result">${this.state.speed}</output>
						${this.data.speedRange.unit}
					</strong>
					<output name="description" class="${this.getViolationStatus(this.state.speed, speedLimit)}">${description}</output>
					<label>
						<input type="range" 
									 min="${this.data.speedRange.min}" 
									 max="${this.data.speedRange.max}" 
									 name="value" 
									 value="${this.state.speed}" 
									 step="${this.data.speedRange.step}">
						<div class="range-labels">
							<span>${this.data.speedRange.min} ${this.data.speedRange.unit}</span>
							<span>${this.data.speedRange.max} ${this.data.speedRange.unit}</span>
						</div>
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

				<fieldset name="vehicle">
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
										 name="factors" 
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
			case 'factors':
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
		
		if (this.state.speed <= speedLimit) {
			return { fine: 0, message: this.data.messages.noFine };
		}

		const percentageOver = ((this.state.speed / speedLimit) * 100) - 100;
		const penaltyRange = this.data.penaltyRanges
			.slice()
			.reverse()
			.find(range => percentageOver >= range.percentageOver);

		if (!penaltyRange) {
			return { fine: 0, message: this.data.messages.noFineCalculated };
		}

		let rate = penaltyRange.rate1;
		if (vehicle.category === 'bus' || vehicle.category === 'truck' || vehicle.category === 'bus100') {
			rate = penaltyRange.rate3;
		} else if (speedLimit >= 100 && (vehicle.category === 'car' || vehicle.category === 'mc')) {
			rate = penaltyRange.rate2;
		}

		const fine = this.state.factors.includes('roadwork') 
			? rate * this.data.specialRules.roadwork.multiplier 
			: rate;
		const formattedFine = fine.toLocaleString(this.data.locale);

		return {
			fine: formattedFine,
			message: `${this.data.messages.fine} ${formattedFine} ${this.data.messages.unit}`,
			consequence: penaltyRange.consequence
		};
	}
}

customElements.define('speed-ticket', SpeedTicket);

import CircularRange from '@browser.style/circular-range';
import VideoScrub from '@browser.style/video-scrub';

/**
 * @module SpeedTicket
 * @version 1.0.0
 * @date 2025-08-10
 * @author Mads Stoumann
 * @description A web component for calculating speed tickets based on user input and predefined rules.
 */
class SpeedTicket extends HTMLElement {
	static DANGER_THRESHOLD = 30; // fallback if not provided in data
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.data = null;
		this.state = { speed: 0, roadType: '', vehicle: '', factors: new Set() };
		this._form = null;
		this.setupStyles();
	}

	setupStyles() {
		const styleSheet = new CSSStyleSheet();
		styleSheet.replaceSync(`
			:host {
				--speed-ticket-accent: hsl(207, 100%, 45%);
				--speed-ticket-muted-c: hsl(215.4, 16.3%, 46.9%);
				--speed-ticket-bdrs: 0.5rem;
				--speed-ticket-p: 1rem;

				--speed-success-bg: #33FF00;
				--speed-success-fg: #333;
				--speed-warning-bg: #F2C94C;
				--speed-warning-fg: #333;
				--speed-danger-bg: #EB5757;
				--speed-danger-fg: white;
				--speed-info-bg: #f0f9ff;
				--speed-info-fg: #0369a1;

				display: block;
				font-family: Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, system-ui, sans-serif;
			}

			:host * { box-sizing: border-box; }

			fieldset { all: unset; }
			form { display: grid; grid-template-rows: min-content 1fr 1fr min-content; height: 100dvh; }
			label { display: block; }
			input, select { font-family: inherit; font-size: small; }
			select { border: 0; padding: 1ch 2ch; }

			
			select, summary {
				appearance: none;
				background: #FFF;
				border: 0;
				color: #222;
				padding: 1ch 2ch;
				font-size: small;
				
			}


			[name="speed"] { display: contents; }
			[part="header"] { 
				color: #FFF;
				font-size: clamp(1.75rem, 4vw, 2.5rem);
				grid-area: 1 / 1;
				margin-block: 1ch;
				text-align: center;
				z-index: 1;
				small {
					display: block;
					font-size: 0.9rem;
					font-weight: 300;
				}
			}
			[name="result"] {
				align-items: center;
				display: flex;
				justify-content: center;
				padding: 1ch 2ch;
			}
			[name="selection"] {
				display: flex;
				flex-wrap: wrap;
				gap: 1rem;
				grid-area: 4 / 1 / 5 / 1;
				justify-content: center;
				padding: 1ch 2ch;
				z-index: 1;

				legend { font-size: x-small; font-weight: 400; margin-block-end: .5ch; }
				span { font-size: small; font-weight: 300; }
			}

			circular-range { grid-area: 2 / 1 / 4 / 1; place-self: center; }
			video-scrub { grid-area: 1 / 1 / 5 / 1; pointer-events: none; --video-scrub-h: 100%; }

			input[type="radio"], input[type="checkbox"] {
				margin-right: .5rem;
			}

			output[name="description"] {
				display: block;
				font-size: clamp(.75rem, 2vw, 1rem);
				padding: 1ch 2ch;
			}
			
			.info {
				background: var(--speed-info-bg);
				color: var(--speed-info-fg);
			}
			
			.success {
				background-color: var(--speed-success-bg);
				color: var(--speed-success-fg);
			}
			
			.warning {
				background-color: var(--speed-warning-bg);
				color: var(--speed-warning-fg);
			}
			
			.danger {
				background-color: var(--speed-danger-bg);
				color: var(--speed-danger-fg);
			}
			
			output[name="fine"] {
				font-size: clamp(1.5rem, 3vw, 2.5rem);
				display: block;
				
				font-weight: bold;
			}

			@keyframes pulse-info {
				0% { transform: scale(1); }
				50% { transform: scale(1.05); }
				100% { transform: scale(1); }
			}

			output[name="summary"] {
				border-radius: 2em;
				font-size: small;
				grid-row: 5;
				grid-column: 1;
				isolation: isolate;
				align-self: end;
				padding: .5em 1.5em;
				text-box: cap alphabetic;
				transition: background-color 0.3s ease, color 0.3s ease, opacity 0.2s ease;
				&:empty { visibility: hidden; }
			}

			output[name="summary"].pulse {
				animation: pulse-info 0.3s ease-in-out;
			}
				[part=unit] {
					color: #EEEe;
					grid-column: 1;
					grid-row: 4;
					isolation: isolate;
				}

			circular-range {
				--circular-range-output-fs: 3rem;
				--circular-range-output-fw: 700;
				--circular-range-output-gr: 3;
				--circular-range-rows: 7;
				--circular-range-track-sz: 1.35rem;
				--circular-range-fill: var(--speed-success-bg);
				--circular-range-thumb: var(--speed-success-bg);
				--circular-range-labels-c: #FFF8;
				--circular-range-indice-c: #FFF8;
				
				--circular-range-track: #F0F0F073;
			
	

				&::part(active-label) {
					color: #FFF;
					font-weight: bold;
				}
							&::part(label-0) { padding-inline-start: 1rem; }
		&::part(label-200) { padding-inline-end: 1rem; }
		
		&::part(track)::after { mix-blend-mode: exclusion; }


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
			const response = await fetch(this.getAttribute('data') || './data.json');
			this.data = await response.json();
			this.initializeState();
			this.compileAllRules?.();
			this.preprocessPenaltyRanges();
		} catch (error) {
			console.error('Failed to load data:', error);
		}
	}

	initializeState() {
		if (!this.data) return;
		const { roadTypes, vehicles, speedRange, defaults } = this.data;
		// Apply defaults from data.json
		this.state.roadType = defaults?.roadType && roadTypes[defaults.roadType] ? defaults.roadType : Object.keys(roadTypes)[0];
		this.state.vehicle = defaults?.vehicle && vehicles[defaults.vehicle] ? defaults.vehicle : Object.keys(vehicles)[0];
		this.state.factors = new Set(Array.isArray(defaults?.factors) ? defaults.factors.filter(f => this.data.factors[f]) : []);
		this.state.speed = speedRange?.default ?? roadTypes[this.state.roadType]?.defaultSpeed ?? 0;
	}

	/**
	 * Calculate vehicle-specific speed limits based on data-driven rules
	 * Uses speedLimitRules from data.json to determine limits
	 */
	calculateVehicleSpeedLimit() {
		if (!this.data?.speedLimitRules) {
			// Fallback to road default if no rules defined
			return {
				min: this.data.roadTypes[this.state.roadType].minSpeed || 30,
				max: this.data.roadTypes[this.state.roadType].maxSpeed || this.data.roadTypes[this.state.roadType].defaultSpeed,
				default: this.data.roadTypes[this.state.roadType].defaultSpeed
			};
		}

		// Find the first matching rule using basic field values (avoid circular dependency)
		const matchingRule = this.data.speedLimitRules.find(rule =>
			(rule._compiled ? rule._compiled(this) : this.evaluateConditionsForSpeedLimit(rule.conditions))
		);

		if (matchingRule) {
			return matchingRule.limits;
		}

		// Fallback to road default
		return {
			min: this.data.roadTypes[this.state.roadType].minSpeed || 30,
			max: this.data.roadTypes[this.state.roadType].maxSpeed || this.data.roadTypes[this.state.roadType].defaultSpeed,
			default: this.data.roadTypes[this.state.roadType].defaultSpeed
		};
	}

	/**
	 * Evaluate conditions specifically for speed limit calculation (avoids circular dependency)
	 */
	evaluateConditionsForSpeedLimit(conditions) {
		return this.#evaluateConditionsGeneric(conditions, field => this.getBasicFieldValue(field));
	}

	/**
	 * Evaluate a single condition for speed limit calculation (avoids circular dependency)
	 */
	evaluateConditionForSpeedLimit(condition) {
		// Kept for backward compatibility; now routed through generic evaluator.
		return this.#evaluateConditionGeneric(condition, field => this.getBasicFieldValue(field));
	}

	/**
	 * Get basic field values without calculating vehicle-specific speed limits (avoids circular dependency)
	 */
	getBasicFieldValue(field) {
		const basicSpeedLimit = this.data.roadTypes[this.state.roadType].defaultSpeed;
		const fields = {
			'speed': this.state.speed,
			'speedLimit': basicSpeedLimit,
			'percentageOver': Math.round(((this.state.speed - basicSpeedLimit) / basicSpeedLimit) * 100),
			'roadType': this.state.roadType,
			'vehicle.category': this.data.vehicles[this.state.vehicle].category,
			'factors': Array.from(this.state.factors)
		};
		return fields[field] || null;
	}

	render() {
		if (!this.data) return;
		this.shadowRoot.innerHTML = this.createHTML();
		this._form = this.shadowRoot.querySelector('form');
		this._form.addEventListener('input', this.handleInput.bind(this));
		this._form.addEventListener('change', this.handleInput.bind(this));
		this.updateUI();
	}

	createHTML() {
		const { roadTypes, vehicles, factors, labels, speedRange, circularRange } = this.data;
		const speedLimit = roadTypes[this.state.roadType].defaultSpeed;
		const { description, fine, summary, violationStatus } = this.calculateAll();

		return `
			<form>
				<fieldset name="speed">
					<legend part="header">${labels.yourSpeed}
						<small>${labels.speedLimit}:
							<output name="limit" aria-live="polite" aria-atomic="true">${speedLimit}</output> ${speedRange.unit}
						</small>
					</legend>

					<video-scrub 
						poster="${roadTypes[this.state.roadType].poster}"
						src="${roadTypes[this.state.roadType].video}"
						preload="auto"
						min="${speedRange.min}" max="${speedRange.max}" value="${this.state.speed}">
					</video-scrub>

					<circular-range
						name="value" min="${speedRange.min}" max="${speedRange.max}" 
						value="${this.state.speed}" step="${speedRange.step}"
						start="${circularRange.start}" end="${circularRange.end}"
						indices="${circularRange.indices}" labels="${circularRange.labels}"
						active-label="${speedLimit}" enable-min>
						<span part="unit">${speedRange.unit}</span>
						<output name="summary" class="${violationStatus}" aria-live="polite" aria-atomic="true">${summary}</output>
					</circular-range>
				</fieldset>

				<fieldset name="selection">
					<fieldset name="road">
						<!--<legend>${labels.roadType}</legend>-->
						<select name="roadtype">
							${Object.values(roadTypes).map(r => `
								<option value="${r.id}" ${r.id === this.state.roadType ? 'selected' : ''}>
									${r.label}
								</option>
							`).join('')}
						</select>
					</fieldset>

					<fieldset name="vehicles">
						<!--<legend>${labels.vehicle}</legend>-->
						<select name="vehicle">
							${Object.values(vehicles).map(v => `
								<option value="${v.id}" ${v.id === this.state.vehicle ? 'selected' : ''}>
									${v.label}
								</option>
							`).join('')}
						</select>
					</fieldset>

					<details name="factors">
						<summary>${labels.factors}</summary>
						<div class="factor-list" part="factors-list">
						${Object.values(factors).map(f => `
							<label>
								<input type="checkbox" name="factor" value="${f.id}" ${this.state.factors.has(f.id) ? 'checked' : ''}>
								<span>${f.label}</span>
							</label>
						`).join('')}
						</div>
					</details>
				</fieldset>
				<fieldset name="result" class="${violationStatus}">
					<output name="fine" aria-live="polite" aria-atomic="true">${fine}</output>	
					<output name="description" aria-live="polite" aria-atomic="true">${description}</output>
				</fieldset>
			</form>
		`;
	}

	handleInput(event) {
		const { name, checked, value, dataset } = event.target;
		if (!name) return;

		switch (name) {
			case 'value': 
				this.state.speed = parseInt(value, 10); 
				break;
			case 'roadtype': 
				this.state.roadType = value; 
				break;
			case 'vehicle': 
				this.state.vehicle = value; 
				break;
			case 'factor': {
				const factorId = value;
				if (checked) this.state.factors.add(factorId); else this.state.factors.delete(factorId);
				break;
			}
		}

		this.scheduleUpdate();
		if (name === 'roadtype') {
			// Simple, direct property updates
			const videoScrub = this.shadowRoot.querySelector('video-scrub');
			if (videoScrub) {
				videoScrub.src = this.data.roadTypes[this.state.roadType].video;
				videoScrub.poster = this.data.roadTypes[this.state.roadType].poster;
			}
		}
	}

	// Batch multiple rapid state changes into a single UI update within a microtask / frame
	scheduleUpdate() {
		if (this._pendingUpdate) return;
		this._pendingUpdate = true;
		Promise.resolve().then(() => {
			this._pendingUpdate = false;
			this.updateUI();
		});
	}

	updateUI() {
		// Compute and cache core derived values once per cycle
		const ctx = this.computeContext();
		const { speedLimit, description, fine, summary, violationStatus } = ctx;
		const form = this._form.elements;

		// Update form outputs
		form.limit.value = speedLimit;
		form.description.value = description;
		form.fine.value = fine;
		if (form.summary) form.summary.value = summary;

		// Update fieldset class instead of output class
		const resultFieldset = this.shadowRoot.querySelector('[name="result"]');
		if (resultFieldset) {
			resultFieldset.className = violationStatus;
		}

		// Update summary output class to match
		const summaryOutput = this.shadowRoot.querySelector('output[name="summary"]');
		if (summaryOutput) {
			summaryOutput.className = violationStatus;
		}

		// Update circular range with vehicle-specific limit
		const cr = this.shadowRoot.querySelector('circular-range');
		if (cr) cr.setAttribute('active-label', String(speedLimit));

		// Update video scrub
		const vs = this.shadowRoot.querySelector('video-scrub');
		if (vs) vs.value = this.state.speed;

		this.updateSpeedometerColors(this.state.speed, speedLimit, ctx);
	}

	/**
	 * Compute core derived context (cached per update cycle) to avoid duplicate calculations.
	 */
	computeContext() {
		const vehicleSpeedLimits = this.calculateVehicleSpeedLimit();
		const speedLimit = vehicleSpeedLimits.default;
		const speed = this.state.speed;
		const percentageOver = speedLimit > 0 ? ((speed / speedLimit) * 100) - 100 : 0;
		const penaltyRange = this.findPenaltyRange(percentageOver);
		// Reuse existing logic for description / fine / summary / violationStatus via calculateAll with context
		const { description, fine, summary, violationStatus } = this.calculateAll({ speedLimit, percentageOver, penaltyRange });
		return { speed, speedLimit, percentageOver, penaltyRange, description, fine, summary, violationStatus, penaltyContext: { speed, speedLimit, percentageOver, penaltyRange } };
	}

	updateSpeedometerColors(speed, speedLimit, ctx) {
		const circularRange = this.shadowRoot.querySelector('circular-range');
		
		if (!circularRange) return;

		// Get colors from CSS custom properties
		const rootStyles = getComputedStyle(this);
		const speedColors = {
			success: { 
				color: rootStyles.getPropertyValue('--speed-success-bg').trim(), 
				class: 'success' 
			},
			warning: { 
				color: rootStyles.getPropertyValue('--speed-warning-bg').trim(), 
				class: 'warning' 
			},
			danger: { 
				color: rootStyles.getPropertyValue('--speed-danger-bg').trim(), 
				class: 'danger' 
			}
		};

		let status = speedColors.success;
		let middleColor = speedColors.success.color;
		let endColor = speedColors.success.color;

		// Determine status based on speed relative to limit (match calculateAll logic)
		const percentageOver = ctx?.percentageOver ?? ((speed / speedLimit) * 100) - 100;
		
		const violationStatus = this.classifyViolation(speed, speedLimit, percentageOver);
		if (violationStatus === 'success') {
			status = speedColors.success;
		} else if (violationStatus === 'danger') {
			status = speedColors.danger;
			middleColor = speedColors.warning.color;
			endColor = speedColors.danger.color;
		} else {
			status = speedColors.warning;
			middleColor = speedColors.warning.color;
			endColor = speedColors.warning.color;
		}

		// Update circular-range colors only
		circularRange.style.setProperty('--circular-range-fill', speedColors.success.color);
		circularRange.style.setProperty('--circular-range-fill-middle', middleColor);
		circularRange.style.setProperty('--circular-range-fill-end', endColor);
		circularRange.style.setProperty('--circular-range-thumb', status.color);
	}

	calculateAll(existingCtx) {
		// Accept precomputed context to avoid recomputation
		const ctx = existingCtx || {};
		const vehicleSpeedLimits = existingCtx ? null : this.calculateVehicleSpeedLimit();
		const speedLimit = existingCtx ? ctx.speedLimit : vehicleSpeedLimits.default;
		const speed = this.state.speed;
		const percentageOver = existingCtx ? ctx.percentageOver : ((speed / speedLimit) * 100) - 100;
		
		const penaltyRange = existingCtx ? ctx.penaltyRange : this.findPenaltyRange(percentageOver);
		// Base calculations
		const violationStatus = this.classifyViolation(speed, speedLimit, percentageOver);
		const defaultViolation = this.data.messages.defaultViolation;
		let description = this.data.messages.noFine;
		let summary = '';
		if (speed > speedLimit) {
			const desc = penaltyRange?.description;
			const consequence = penaltyRange?.consequence;
			description = (desc && consequence) ? `${desc} - ${consequence}` : (desc || defaultViolation);
			summary = penaltyRange?.summary || 'Empty';
		}
		const fine = this.calculateFineAmount({ speedLimit, percentageOver, penaltyRange });
		return { description, fine, summary, violationStatus };
	}

	findPenaltyRange(percentageOver) {
		const arr = this._penaltyRangesAsc || this.data.penaltyRanges;
		let low = 0, high = arr.length - 1, best = null;
		while (low <= high) {
			const mid = (low + high) >> 1;
			const item = arr[mid];
			if (percentageOver >= item.percentageOver) {
				best = item; // candidate, search right for higher threshold still <= percentageOver
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}
		return best;
	}

	preprocessPenaltyRanges() {
		if (!this.data?.penaltyRanges) return;
		// Ensure ascending order for binary search (original logic expected descending find of first match)
		this._penaltyRangesAsc = [...this.data.penaltyRanges].sort((a,b) => a.percentageOver - b.percentageOver);
	}

	classifyViolation(speed, speedLimit, percentageOver) {
		if (speed <= speedLimit) return 'success';
		const threshold = this.data?.thresholds?.dangerPercentageOver ?? SpeedTicket.DANGER_THRESHOLD;
		return percentageOver >= threshold ? 'danger' : 'warning';
	}

	calculateFineAmount(existingCtx) {
		const speed = this.state.speed;
		const ctx = existingCtx || {};
		const vehicleSpeedLimits = existingCtx ? null : this.calculateVehicleSpeedLimit();
		const speedLimit = existingCtx ? ctx.speedLimit : vehicleSpeedLimits.default;
		const vehicle = this.data.vehicles[this.state.vehicle];
		const percentageOver = existingCtx ? Math.round(ctx.percentageOver) : Math.round(((speed - speedLimit) / speedLimit) * 100);

		// Edge cases
		if (!speed || speed === 0 || speed <= speedLimit) return "0";
		if (speed > 300) return "0";

		// Check for unconditional license loss
		const consequenceType = this.evaluateConsequenceRules();
		if (consequenceType && this.data.consequenceTypes[consequenceType]?.preventsFine) return "0";

		const penaltyRange = existingCtx ? ctx.penaltyRange : this.findPenaltyRange(percentageOver);
		if (!penaltyRange) return "0";

		// Calculate fine
		let finalFine = penaltyRange[this.evaluateRateSelectionRules()];
		finalFine += this.evaluatePenaltyRules();
		for (const factorId of this.state.factors) {
			const factor = this.data.factors[factorId];
			if (factor?.multiplier) finalFine *= factor.multiplier;
		}

		return new Intl.NumberFormat(this.data.locale, { 
			style: 'currency', 
			currency: this.data.currency || 'DKK' 
		}).format(Math.round(finalFine));
	}

	evaluateRateSelectionRules() {
		return this.data.ruleEngine.rateSelectionRules
			.find(rule => (rule._compiled ? rule._compiled(this) : this.evaluateConditions(rule.conditions)))?.result || 'rate1';
	}

	evaluatePenaltyRules() {
		return this.data.ruleEngine.penaltyRules.reduce((total, rule) => {
			const match = rule._compiled ? rule._compiled(this) : this.evaluateConditions(rule.conditions);
			if (match) return total + (rule.penalty || this.evaluateFormula(rule.formula));
			return total;
		}, 0);
	}

	evaluateConsequenceRules() {
		const consequences = this.data.ruleEngine.consequenceRules
			.filter(rule => (rule._compiled ? rule._compiled(this) : this.evaluateConditions(rule.conditions)))
			.map(rule => rule.consequence);
		
		return this.getMostSevereConsequence(consequences);
	}

	compileAllRules() {
		const compileSet = (rules, useBasic = false) => {
			if (!Array.isArray(rules)) return;
			rules.forEach(rule => {
				if (rule && rule.conditions) rule._compiled = this.compileConditions(rule.conditions, useBasic);
			});
		};
		compileSet(this.data?.speedLimitRules, true);
		const re = this.data?.ruleEngine;
		if (re) {
			compileSet(re.rateSelectionRules);
			compileSet(re.penaltyRules);
			compileSet(re.consequenceRules);
		}
		if (this.data?.factors) {
			Object.values(this.data.factors).forEach(f => {
				if (f.conditions) f._compiled = this.compileConditions(f.conditions);
			});
		}
	}

	compileConditions(conditions, useBasic = false) {
		return (component) => component.#evaluateConditionsGeneric(
			conditions,
			field => useBasic ? component.getBasicFieldValue(field) : component.getFieldValue(field)
		);
	}

	getMostSevereConsequence(consequences) {
		return consequences
			.filter(c => this.data.consequenceTypes[c])
			.sort((a, b) => this.data.consequenceTypes[b].severity - this.data.consequenceTypes[a].severity)[0] || null;
	}

	evaluateConditions(conditions) {
		return this.#evaluateConditionsGeneric(conditions, field => this.getFieldValue(field));
	}

	evaluateCondition(condition) {
		return this.#evaluateConditionGeneric(condition, field => this.getFieldValue(field));
	}

	// === Generic condition evaluation helpers ===
	#evaluateConditionsGeneric(conditions, valueGetter) {
		if (!conditions || !conditions.length) return true;
		return conditions.every(cond => {
			if (cond.type === 'or') return cond.rules?.some(rule => this.#evaluateConditionsGeneric([rule], valueGetter));
			if (cond.type === 'and') return cond.rules?.every(rule => this.#evaluateConditionsGeneric([rule], valueGetter));
			return this.#evaluateConditionGeneric(cond, valueGetter);
		});
	}

	#evaluateConditionGeneric(condition, valueGetter) {
		if (!condition) return false;
		const value = valueGetter(condition.field);
		const target = condition.value;
		const op = condition.operator;
		switch (op) {
			case '=': return value === target;
			case '>=': return value >= target;
			case '<=': return value <= target;
			case '>': return value > target;
			case '<': return value < target;
			case 'in': return Array.isArray(target) && target.includes(value);
			case 'includes': return Array.isArray(value) && value.includes(target);
			case 'not_includes': return Array.isArray(value) && !value.includes(target);
			default: return false;
		}
	}

	getFieldValue(field) {
		const vehicleSpeedLimits = this.calculateVehicleSpeedLimit();
		const speedLimit = vehicleSpeedLimits.default;
		const fields = {
			'speed': this.state.speed,
			'speedLimit': speedLimit,
			'percentageOver': Math.round(((this.state.speed - speedLimit) / speedLimit) * 100),
			'roadType': this.state.roadType,
			'vehicle.category': this.data.vehicles[this.state.vehicle].category,
			'factors': Array.from(this.state.factors)
		};
		return fields[field] || null;
	}

	evaluateFormula(formula) {
		if (formula?.type === 'calculation' && 
			formula.expression === 'Math.floor((speed - 140) / 10) * 600 + 1200') {
			return Math.floor((this.state.speed - 140) / 10) * 600 + 1200;
		}
		return 0;
	}
}

customElements.define('speed-ticket', SpeedTicket);

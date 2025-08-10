import CircularRange from '@browser.style/circular-range';
import VideoScrub from '@browser.style/video-scrub';

/**
 * @typedef {Object} Condition
 * @property {string} field
 * @property {string} operator
 * @property {any} value
 * @typedef {Object} CompoundCondition
 * @property {'and'|'or'} type
 * @property {(Condition|CompoundCondition)[]} rules
 * @typedef {Object} PenaltyRange
 * @property {number} percentageOver
 * @property {number} rate1
 * @property {number} rate2
 * @property {number} rate3
 * @property {string} [description]
 * @property {string} [consequence]
 * @property {string} [summary]
 * @typedef {Object} ComputedContext
 * @property {number} speed
 * @property {number} speedLimit
 * @property {number} percentageOver Normalized integer percentage over limit
 * @property {PenaltyRange|null} penaltyRange
 * @property {string} description
 * @property {string} fine
 * @property {string} summary
 * @property {string} violationStatus
 */

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
		this._lastRender = null; // snapshot of last rendered core values
		this._currentCtx = null; // per-cycle cached context for field value access
		this._compiledConditionCache = new Map(); // hash -> compiled predicate
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
			if (this.shadowRoot && !this.shadowRoot.innerHTML) {
				this.shadowRoot.innerHTML = '<div role="alert" part="error">Failed to load speed ticket data.</div>';
			}
		}
	}

	initializeState() {
		if (!this.data) return;
		const { roadTypes, vehicles, speedRange, defaults } = this.data;
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
					<fieldset name="road" aria-label="${labels.roadType}">
						<select name="roadtype">
							${Object.values(roadTypes).map(r => `
								<option value="${r.id}" ${r.id === this.state.roadType ? 'selected' : ''}>
									${r.label}
								</option>
							`).join('')}
						</select>
					</fieldset>

					<fieldset name="vehicles" aria-label="${labels.vehicle}">
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
		this._currentCtx = ctx; // used by getFieldValue during this cycle
		const { speedLimit, description, fine, summary, violationStatus, speed } = ctx;
		const prev = this._lastRender || {};
		const form = this._form.elements;

		// Early exit if nothing meaningful changed
		if (prev.speed === speed && prev.speedLimit === speedLimit && prev.description === description && prev.fine === fine && prev.summary === summary && prev.violationStatus === violationStatus) {
			this._currentCtx = null;
			return;
		}

		// Conditional DOM mutations (only when value changed)
		if (speedLimit !== prev.speedLimit) form.limit.value = speedLimit;
		if (description !== prev.description) form.description.value = description;
		if (fine !== prev.fine) form.fine.value = fine;
		if (form.summary && summary !== prev.summary) form.summary.value = summary;

		if (violationStatus !== prev.violationStatus) {
			const resultFieldset = this.shadowRoot.querySelector('[name="result"]');
			if (resultFieldset) resultFieldset.className = violationStatus;
			const summaryOutput = this.shadowRoot.querySelector('output[name="summary"]');
			if (summaryOutput) summaryOutput.className = violationStatus;
		}

		if (speedLimit !== prev.speedLimit) {
			const cr = this.shadowRoot.querySelector('circular-range');
			if (cr) cr.setAttribute('active-label', String(speedLimit));
		}

		if (speed !== prev.speed) {
			const vs = this.shadowRoot.querySelector('video-scrub');
			if (vs) vs.value = speed;
		}

		if (speed !== prev.speed || speedLimit !== prev.speedLimit || violationStatus !== prev.violationStatus) {
			this.updateSpeedometerColors(speed, speedLimit, ctx);
		}

		// Store snapshot
		this._lastRender = { speed, speedLimit, description, fine, summary, violationStatus };
		this._currentCtx = null; // clear per-cycle cache reference after updates
	}

	/**
	 * Compute core derived context (cached per update cycle) to avoid duplicate calculations.
	 */
	computeContext() {
		// Establish temporary context early so downstream lookups reuse it
		const vehicleSpeedLimits = this.calculateVehicleSpeedLimit();
		const speedLimit = vehicleSpeedLimits.default;
		const speed = this.state.speed;
		const percentageOver = Math.round(speedLimit > 0 ? ((speed / speedLimit) * 100) - 100 : 0);
		const penaltyRange = this.findPenaltyRange(percentageOver);
		this._currentCtx = { speed, speedLimit, percentageOver, penaltyRange }; // provisional
		const { description, fine, summary, violationStatus } = this.calculateAll({ speedLimit, percentageOver, penaltyRange });
		const full = { speed, speedLimit, percentageOver, penaltyRange, description, fine, summary, violationStatus, penaltyContext: { speed, speedLimit, percentageOver, penaltyRange } };
		return full;
	}

	updateSpeedometerColors(speed, speedLimit, ctx) {
		const circularRange = this.shadowRoot.querySelector('circular-range');
		
		if (!circularRange) return;

		// Load colors either from data.statusColors or CSS custom properties fallback
		const rootStyles = getComputedStyle(this);
		const dataColors = this.data?.statusColors;
		const resolveColor = (id, cssVar) => (dataColors?.[id]?.fill) || rootStyles.getPropertyValue(cssVar).trim();
		const speedColors = {
			success: { color: resolveColor('success', '--speed-success-bg'), class: 'success' },
			warning: { color: resolveColor('warning', '--speed-warning-bg'), class: 'warning' },
			danger: { color: resolveColor('danger', '--speed-danger-bg'), class: 'danger' }
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
		const percentageOver = existingCtx ? ctx.percentageOver : Math.round(((speed / speedLimit) * 100) - 100);
		
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
		const percentageOver = existingCtx ? ctx.percentageOver : Math.round(((speed - speedLimit) / speedLimit) * 100);

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
		const key = JSON.stringify(conditions) + '::' + useBasic;
		if (this._compiledConditionCache.has(key)) return this._compiledConditionCache.get(key);
		const fn = (component) => component.#evaluateConditionsGeneric(
			conditions,
			field => useBasic ? component.getBasicFieldValue(field) : component.getFieldValue(field)
		);
		this._compiledConditionCache.set(key, fn);
		return fn;
	}

	// === Public API ===
	/** Set the current speed (number, km/t). */
	setSpeed(value) {
		const v = Number(value);
		if (!Number.isFinite(v)) return;
		if (this.state.speed === v) return;
		this.state.speed = v;
		this.scheduleUpdate();
	}
	/** Set the current road type by id. */
	setRoadType(id) {
		if (!this.data?.roadTypes[id] || this.state.roadType === id) return;
		this.state.roadType = id;
		const videoScrub = this.shadowRoot?.querySelector('video-scrub');
		if (videoScrub) {
			videoScrub.src = this.data.roadTypes[id].video;
			videoScrub.poster = this.data.roadTypes[id].poster;
		}
		this.scheduleUpdate();
	}
	/** Set the current vehicle by id. */
	setVehicle(id) {
		if (!this.data?.vehicles[id] || this.state.vehicle === id) return;
		this.state.vehicle = id;
		this.scheduleUpdate();
	}
	/** Toggle a factor; pass force=true/false to explicitly add/remove. */
	toggleFactor(id, force) {
		if (!this.data?.factors[id]) return;
		const has = this.state.factors.has(id);
		const shouldAdd = force === true || (force === undefined && !has);
		if (shouldAdd) this.state.factors.add(id); else if (has) this.state.factors.delete(id);
		this.scheduleUpdate();
	}
	/** Apply a partial state patch: { speed, roadType, vehicle, addFactors, removeFactors }. */
	applyState(patch = {}) {
		if ('speed' in patch) this.setSpeed(patch.speed);
		if ('roadType' in patch) this.setRoadType(patch.roadType);
		if ('vehicle' in patch) this.setVehicle(patch.vehicle);
		if (Array.isArray(patch.addFactors)) patch.addFactors.forEach(f => this.state.factors.add(f));
		if (Array.isArray(patch.removeFactors)) patch.removeFactors.forEach(f => this.state.factors.delete(f));
		this.scheduleUpdate();
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
		// Use current context if present to avoid recomputation
		const speedLimit = this._currentCtx?.speedLimit ?? vehicleSpeedLimits.default;
		const fields = {
			'speed': this.state.speed,
			'speedLimit': speedLimit,
			'percentageOver': Math.round(this._currentCtx?.percentageOver ?? (((this.state.speed - speedLimit) / speedLimit) * 100)),
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

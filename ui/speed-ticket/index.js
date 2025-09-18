import CircularRange from '@browser.style/circular-range';
import VideoScrub from '@browser.style/video-scrub';

class SpeedTicket extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.data = null;
		this.state = { speed: 0, roadType: '', vehicle: '', factors: new Set(), selectedSpeedLimit: null };
		this.previousSummary = null;
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

				* { box-sizing: border-box; }
			}

			@keyframes pulse-info {
				0% { transform: scale(1); }
				50% { transform: scale(1.1); }
				100% { transform: scale(1); }
			}

			@media (max-height: 600px) { 
				[name="result"] { height: 3rem; } 
			}

			.danger {
				background-color: var(--speed-danger-bg);
				color: var(--speed-danger-fg);
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

			[name="result"] {
				align-items: center;
				display: flex;
				height: 4rem;
				justify-content: center;
				padding: 1ch 2ch;
			}

			[name="selection"] {
				display: flex;
				flex-wrap: wrap;
				gap: 1rem;
				grid-area: 4 / 1 / 5 / 1;
				justify-content: center;
				padding: 2ch;
				z-index: 1;

				legend { 
					font-size: x-small; 
					font-weight: 400; 
					margin-block-end: .5ch; 
				}

				span { 
					font-size: small; 
					font-weight: 300; 
				}

				@media (max-width: 600px) {
					flex-wrap: nowrap;
					overflow-x: auto;
					scroll-snap-type: x mandatory;
					justify-content: start;

					> * {
						scroll-snap-align: start;
						scroll-margin: 0 1rem;
						flex: 0 0 75vw;
					}
				}
			}

			[name="speed"] { 
				display: contents; 
			}

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

			[part=unit] {
				color: #EEEe;
				grid-column: 1;
				grid-row: 4;
				isolation: isolate;
			}

			circular-range {
				--circular-range-bg: rgba(0, 0, 0, 0.2);
				--circular-range-bg-mask: linear-gradient(to bottom, #000 50%, #0000 85%);
				--circular-range-bg-scale: 1.1;
				--circular-range-output-fs: 3rem;
				--circular-range-output-fw: 700;
				--circular-range-output-gr: 3;
				--circular-range-rows: 7;
				--circular-range-track-sz: 1.35rem;
				--circular-range-fill: var(--speed-success-bg);
				--circular-range-thumb: var(--speed-success-bg);
				--circular-range-labels-c: #FFF8;
				--circular-range-indice-c: #FFF8;
				--circular-range-track: #ACACAC;
				--circular-range-w: 60dvh;
				grid-area: 2 / 1 / 4 / 1; 
				place-self: center;

				&::part(active-label) {
					color: #FFF;
					font-weight: bold;
				}

				&::part(label-0) { 
					padding-inline-start: 1rem; 
				}

				&::part(label-200) { 
					padding-inline-end: 1rem; 
				}
			}

			details[open] {
				&::details-content {
					padding-block: 1ch;
				}
			}

			fieldset { 
				all: unset; 
			}

			form { 
				display: grid; 
				grid-template-rows: min-content 1fr 1fr min-content; 
				height: 100dvh; 
			}

			input, select { 
				font-family: inherit;
			}

			input[type="radio"], input[type="checkbox"] {
				margin-right: .5rem;
			}

			label { 
				display: block; 
			}

			output[name="description"] {
				display: block;
				font-size: clamp(.75rem, 2vw, 1rem);
				padding: 1ch 2ch;		
			}

			output[name="fine"] {
				font-size: clamp(1.5rem, 3vw, 2.5rem);
				display: block;
				font-weight: bold;
			}

			output[name="summary"] {
				border-radius: 2em;
				font-size: small;
				grid-row: 5;
				grid-column: 1;
				isolation: isolate;
				align-self: end;
				padding: .5em 1.5em;
				text-box: text;
				transition: background-color 0.3s ease, color 0.3s ease, opacity 0.2s ease;

				&:empty { 
					visibility: hidden; 
				}

				&.pulse {
					animation: pulse-info 0.5s ease-in-out;
				}
			}

			select, summary, button[popovertarget] {
				align-items: center;
				align-self: start;
				appearance: none;
				background-color: #0002;
				background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23FFF' class='size-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E%0A");
				background-position: right 10px center;
				background-repeat: no-repeat;
				background-size: 20px;
				backdrop-filter: blur(5px);
				color: #FFF;
				border: 1px solid #8D8D8D;
				border-radius: .33em;
				cursor: pointer;
				display: flex;
				font: inherit;
				justify-content: space-between;
				min-width: 12rem;
				padding: 1.25ch 2ch;
				anchor-name: --anchor;
			}

			[popover] {
				background-color: #0002;
				border: 1px solid #8D8D8D;
				border-radius: .33em;
				color: #FFF;
				max-width: 20rem;
				padding: 1rem;
				position-anchor: --anchor;
				position-area: top span-right;
				position-try-fallbacks: --bottom-span-right, --top-span-left, --bottom-span-left;
				margin: 0;
				min-width: 12rem;

				label {
					display: flex;
					align-items: center;
					gap: .5rem;
					margin-bottom: .5rem;
				}
			}

			select {
				font-size: inherit;
				@supports (appearance: base-select) {
					&, &::picker(select) { 
						appearance: base-select; 
					}
					
					background-image: none;

					&:open::picker-icon { 
						scale: -1; 
					}

					&::picker-icon {
						content: "";
						width: 20px;
						height: 20px;
						background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23FFF' class='size-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E%0A");
						transition: scale 0.2s ease-out;
					}
				}
			}

			video-scrub {
				--video-scrub-aspect-ratio: none;
				--video-scrub-h: 100%;
				--video-scrub-mask: radial-gradient(circle at 50% 50%, #000 50%, #0000 90%);
				--video-scrub-overlay: linear-gradient(to bottom, #0001, #0004 25%);
				grid-area: 1 / 1 / 5 / 1;
				pointer-events: none;
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
		} catch (error) {
			console.error('Failed to load data:', error);
			this.shadowRoot.innerHTML += '<div role="alert">Failed to load speed ticket data.</div>';
		}
	}

	initializeState() {
		if (!this.data) return;
		const { roadTypes, vehicles, speedRange, defaults } = this.data;
		this.state.roadType = defaults?.roadType || Object.keys(roadTypes)[0];
		this.state.vehicle = defaults?.vehicle || Object.keys(vehicles)[0];
		this.state.factors = new Set(defaults?.factors || []);
		const defaultSpeedLimit = this.getDefaultSpeedForRoadType(this.state.roadType);
		this.state.selectedSpeedLimit = defaultSpeedLimit;
		this.state.speed = speedRange?.default || defaultSpeedLimit || 0;
	}

	getDefaultSpeedForRoadType(roadType) {
		const roadTypeData = this.data.roadTypes[roadType];
		if (!roadTypeData?.allowedSpeeds) return 0;
		const defaultSpeed = roadTypeData.allowedSpeeds.find(speed => speed.default);
		return defaultSpeed?.speed || roadTypeData.allowedSpeeds[0]?.speed || 0;
	}

	getAllowedSpeedsForCurrentConditions() {
		const matchingRules = this.data.speedLimitRules?.filter(rule =>
			this.evaluateConditions(rule.conditions, true)
		) || [];

		matchingRules.sort((a, b) => (a.priority || 999) - (b.priority || 999));

		const rule = matchingRules[0];
		if (rule?.limits?.[this.state.roadType]) {
			const speeds = rule.limits[this.state.roadType];
			const defaultSpeed = rule.limits.default?.[this.state.roadType] || speeds[0];
			return speeds.map(speed => ({
				speed: speed,
				label: `${this.data.roadTypes[this.state.roadType].label} ${speed}`,
				default: speed === defaultSpeed
			}));
		}

		return this.data.roadTypes[this.state.roadType]?.allowedSpeeds || [];
	}

	getVisibleFactorsForCurrentVehicle() {
		const currentVehicleId = this.state.vehicle;
		const currentVehicleCategory = this.data.vehicles[currentVehicleId]?.category;

		return Object.values(this.data.factors || {}).filter(factor => {
			if (!factor.visibleFor) return true;

			return factor.visibleFor.includes(currentVehicleId) ||
				   factor.visibleFor.includes(currentVehicleCategory);
		});
	}

	getSpeedLimit() {
		if (this.state.selectedSpeedLimit !== null) {
			return this.state.selectedSpeedLimit;
		}

		const matchingRules = this.data.speedLimitRules?.filter(rule =>
			this.evaluateConditions(rule.conditions, true)
		) || [];

		matchingRules.sort((a, b) => (a.priority || 999) - (b.priority || 999));

		const rule = matchingRules[0];
		if (rule?.limits?.default?.[this.state.roadType]) {
			return rule.limits.default[this.state.roadType];
		}

		return this.getDefaultSpeedForRoadType(this.state.roadType);
	}

	render() {
		if (!this.data) return;
		const { roadTypes, vehicles, labels, speedRange, circularRange } = this.data;
		const visibleFactors = this.getVisibleFactorsForCurrentVehicle();
		const speedLimit = this.getSpeedLimit();
		const results = this.calculateResults();

		const currentVideo = roadTypes[this.state.roadType].video;
		const prefetchVideos = [...new Set(Object.values(roadTypes).map(r => r.video))]
			.filter(video => video !== currentVideo)
			.join(',');

		this.shadowRoot.innerHTML += `
			<form>
				<fieldset name="speed">
					<legend part="header">${labels.yourSpeed}
						<small>${labels.speedLimit}: <output name="limit">${speedLimit}</output> ${speedRange.unit}</small>
					</legend>
					<video-scrub src="${currentVideo}"
						${roadTypes[this.state.roadType].poster ? `poster="${roadTypes[this.state.roadType].poster}"` : ''} 
						${prefetchVideos ? `prefetch="${prefetchVideos}"` : ''}
						min="${speedRange.min}" max="${speedRange.max}" value="${this.state.speed}"></video-scrub>
					<circular-range name="value" min="${speedRange.min}" max="${speedRange.max}" value="${this.state.speed}" 
						start="${circularRange.start}" end="${circularRange.end}" indices="${circularRange.indices}" 
						labels="${circularRange.labels}" active-label="${speedLimit}">
						<span part="unit">${speedRange.unit}</span>
						<output name="summary" class="${results.status}">${results.summary}</output>
					</circular-range>
				</fieldset>
				<fieldset name="selection">
					<select name="vehicle">
						${Object.values(vehicles).map(v => `<option value="${v.id}" ${v.id === this.state.vehicle ? 'selected' : ''}>${v.label}</option>`).join('')}
					</select>
					<select name="roadtype">
						${this.generateRoadTypeOptions()}
					</select>
					
					<button type="button" popovertarget="factors-popover">${labels.factors}</button>
					<div id="factors-popover" popover>
						${visibleFactors.map(f => `<label><input type="checkbox" name="factor" value="${f.id}" ${this.state.factors.has(f.id) ? 'checked' : ''}><span>${f.label}</span></label>`).join('')}
					</div>
				</fieldset>
				<fieldset name="result" class="${results.status}">
					<output name="fine">${results.fine}</output>
					<output name="description">${results.description}</output>
				</fieldset>
			</form>
		`;
		this.shadowRoot.querySelector('form').addEventListener('input', e => this.handleInput(e));
		this.shadowRoot.querySelector('form').addEventListener('change', e => this.handleInput(e));
	}

	handleInput(event) {
		const { name, checked, value } = event.target;
		if (!name) return;

		switch (name) {
			case 'value': this.state.speed = parseInt(value, 10); break;
			case 'roadtype': 
				const [roadType, speedLimit] = value.split(':');
				const previousRoadType = this.state.roadType;
				this.state.roadType = roadType;
				this.state.selectedSpeedLimit = parseInt(speedLimit, 10);
				// Only update video if roadtype actually changed
				if (previousRoadType !== roadType) {
					this.updateVideoSrc(); 
				}
				break;
			case 'vehicle':
				this.state.vehicle = value;
				this.updateRoadTypeDropdown();
				this.updateFactorsPopover();
				break;
			case 'factor':
				if (checked) this.state.factors.add(value);
				else this.state.factors.delete(value);
				this.updateRoadTypeDropdown();
				break;
		}
		this.updateUI();
	}

	updateVideoSrc() {
		const videoScrub = this.shadowRoot.querySelector('video-scrub');
		if (videoScrub) {
			const road = this.data.roadTypes[this.state.roadType];
			videoScrub.src = road.video;
			videoScrub.poster = road.poster;
		}
	}

	generateRoadTypeOptions() {
		return Object.values(this.data.roadTypes).map(roadType => {
			let speedOptions;
			if (roadType.id === this.state.roadType) {
				speedOptions = this.getAllowedSpeedsForCurrentConditions();
			} else {
				const originalRoadType = this.state.roadType;
				this.state.roadType = roadType.id;
				speedOptions = this.getAllowedSpeedsForCurrentConditions();
				this.state.roadType = originalRoadType;
			}

			return `<optgroup label="${roadType.label}">
				${speedOptions.map(speedOption => {
					const isSelected = roadType.id === this.state.roadType &&
						(this.state.selectedSpeedLimit === speedOption.speed ||
						 (this.state.selectedSpeedLimit === null && speedOption.default));
					return `<option value="${roadType.id}:${speedOption.speed}" ${isSelected ? 'selected' : ''}>${speedOption.label}</option>`
				}).join('')}
			</optgroup>`
		}).join('');
	}

	updateRoadTypeDropdown() {
		const roadTypeSelect = this.shadowRoot.querySelector('select[name="roadtype"]');
		if (roadTypeSelect) {
			roadTypeSelect.innerHTML = this.generateRoadTypeOptions();
		}
	}

	updateFactorsPopover() {
		const factorsPopover = this.shadowRoot.querySelector('#factors-popover');
		if (!factorsPopover) return;

		const visibleFactors = this.getVisibleFactorsForCurrentVehicle();

		const visibleFactorIds = new Set(visibleFactors.map(f => f.id));
		for (const factorId of this.state.factors) {
			if (!visibleFactorIds.has(factorId)) {
				this.state.factors.delete(factorId);
			}
		}

		factorsPopover.innerHTML = visibleFactors.map(f =>
			`<label><input type="checkbox" name="factor" value="${f.id}" ${this.state.factors.has(f.id) ? 'checked' : ''}><span>${f.label}</span></label>`
		).join('');
	}

	updateUI() {
		const speedLimit = this.getSpeedLimit();
		const results = this.calculateResults();
		const form = this.shadowRoot.querySelector('form');
		
		if (form.limit) form.limit.textContent = speedLimit;
		if (form.fine) form.fine.textContent = results.fine;
		if (form.description) form.description.textContent = results.description;
		if (form.summary) {
			const summaryChanged = this.previousSummary !== null && this.previousSummary !== results.summary;
			form.summary.textContent = results.summary;
			form.summary.className = results.status;
			
			if (summaryChanged) {
				form.summary.classList.add('pulse');
				setTimeout(() => form.summary.classList.remove('pulse'), 600);
			}
			
			this.previousSummary = results.summary;
		}
		
		const resultFieldset = form.querySelector('[name="result"]');
		if (resultFieldset) resultFieldset.className = results.status;
		
		const circularRange = form.querySelector('circular-range');
		if (circularRange) {
			circularRange.setAttribute('active-label', speedLimit);
			circularRange.value = this.state.speed;
		}
		
		const videoScrub = form.querySelector('video-scrub');
		if (videoScrub) videoScrub.value = this.state.speed;
		
		this.updateColors(results.status);
	}

	updateColors(status) {
		const circularRange = this.shadowRoot.querySelector('circular-range');
		if (!circularRange) return;

		const rootStyles = getComputedStyle(this);
		const dataColors = this.data?.statusColors;
		const resolveColor = (id, cssVar) => (dataColors?.[id]?.fill) || rootStyles.getPropertyValue(cssVar).trim();
		const speedColors = {
			success: { color: resolveColor('success', '--speed-success-bg'), class: 'success' },
			warning: { color: resolveColor('warning', '--speed-warning-bg'), class: 'warning' },
			danger: { color: resolveColor('danger', '--speed-danger-bg'), class: 'danger' }
		};

		let currentStatus = speedColors.success;
		let middleColor = speedColors.success.color;
		let endColor = speedColors.success.color;

		if (status === 'success') {
			currentStatus = speedColors.success;
		} else if (status === 'danger') {
			currentStatus = speedColors.danger;
			middleColor = speedColors.warning.color;
			endColor = speedColors.danger.color;
		} else {
			currentStatus = speedColors.warning;
			middleColor = speedColors.warning.color;
			endColor = speedColors.warning.color;
		}

		circularRange.style.setProperty('--circular-range-fill', speedColors.success.color);
		circularRange.style.setProperty('--circular-range-fill-middle', middleColor);
		circularRange.style.setProperty('--circular-range-fill-end', endColor);
		circularRange.style.setProperty('--circular-range-thumb', currentStatus.color);
	}

	calculateResults() {
		const speedLimit = this.getSpeedLimit();
		const speed = this.state.speed;
		const percentageOver = Math.round(((speed / speedLimit) * 100) - 100);
		const penaltyRange = this.findPenaltyRange(percentageOver);
		
		const status = this.getViolationStatus(speed, speedLimit, percentageOver);
		let description = this.data.messages.noFine;
		let summary = '';
		
		if (speed > speedLimit && penaltyRange) {
			const desc = penaltyRange.description;
			const consequence = penaltyRange.consequence;
			description = (desc && consequence) ? `${desc} - ${consequence}` : (desc || this.data.messages.defaultViolation);
			summary = penaltyRange.summary || '';
		}
		
		const fine = this.calculateFine(speedLimit, percentageOver, penaltyRange);
		return { description, fine, summary, status };
	}

	findPenaltyRange(percentageOver) {
		return this.data.penaltyRanges
			.filter(range => percentageOver >= range.percentageOver)
			.sort((a, b) => b.percentageOver - a.percentageOver)[0] || null;
	}

	getViolationStatus(speed, speedLimit, percentageOver) {
		if (speed <= speedLimit) return 'success';
		const threshold = this.data?.thresholds?.dangerPercentageOver || 30;
		return percentageOver >= threshold ? 'danger' : 'warning';
	}

	calculateFine(speedLimit, percentageOver, penaltyRange) {
		const speed = this.state.speed;
		const maxRealisticSpeed = this.data.speedRange?.max || 300;

		if (!speed || speed <= speedLimit || speed > maxRealisticSpeed) return "";

		const consequenceType = this.getConsequence();
		if (consequenceType && this.data.consequenceTypes[consequenceType]?.preventsFine) return "";

		if (!penaltyRange) return "";

		let fine = penaltyRange[this.getRate()];
		fine += this.getPenalties();

		for (const factorId of this.state.factors) {
			const factor = this.data.factors[factorId];
			if (factor?.multiplier) fine *= factor.multiplier;
		}

		return new Intl.NumberFormat(this.data.locale, {
			style: 'currency',
			currency: this.data.currency || 'DKK'
		}).format(Math.round(fine));
	}

	getRate() {
		return this.data.ruleEngine.rateSelectionRules
			.find(rule => this.evaluateConditions(rule.conditions))?.result || 'rate1';
	}

	getPenalties() {
		return this.data.ruleEngine.penaltyRules.reduce((total, rule) => {
			if (this.evaluateConditions(rule.conditions)) {
				if (rule.penalty) {
					return total + rule.penalty;
				} else if (rule.formulaId) {
					return total + this.executeFormula(rule.formulaId);
				}
			}
			return total;
		}, 0);
	}

	getConsequence() {
		const consequences = this.data.ruleEngine.consequenceRules
			.filter(rule => this.evaluateConditions(rule.conditions))
			.map(rule => rule.consequence);
		
		return consequences
			.filter(c => this.data.consequenceTypes[c])
			.sort((a, b) => this.data.consequenceTypes[b].severity - this.data.consequenceTypes[a].severity)[0] || null;
	}


	setSpeed(value) {
		const v = Number(value);
		if (Number.isFinite(v) && this.state.speed !== v) {
			this.state.speed = v;
			this.updateUI();
		}
	}
	
	setRoadType(id) {
		if (this.data?.roadTypes[id] && this.state.roadType !== id) {
			this.state.roadType = id;
			this.state.selectedSpeedLimit = this.getDefaultSpeedForRoadType(id);
			this.updateVideoSrc();
			this.updateUI();
		}
	}
	
	setVehicle(id) {
		if (this.data?.vehicles[id] && this.state.vehicle !== id) {
			this.state.vehicle = id;
			this.updateUI();
		}
	}
	
	toggleFactor(id, force) {
		if (!this.data?.factors[id]) return;
		const has = this.state.factors.has(id);
		const shouldAdd = force === true || (force === undefined && !has);
		if (shouldAdd) this.state.factors.add(id);
		else if (has) this.state.factors.delete(id);
		this.updateUI();
	}

	evaluateConditions(conditions, useBasicSpeedLimit = false) {
		if (!conditions?.length) return true;
		return conditions.every(cond => {
			if (cond.type === 'or') return cond.rules?.some(rule => this.evaluateConditions([rule], useBasicSpeedLimit));
			if (cond.type === 'and') return cond.rules?.every(rule => this.evaluateConditions([rule], useBasicSpeedLimit));
			return this.evaluateCondition(cond, useBasicSpeedLimit);
		});
	}

	evaluateCondition(condition, useBasicSpeedLimit = false) {
		if (!condition) return false;
		const value = this.getFieldValue(condition.field, useBasicSpeedLimit);
		const target = condition.value;
		const op = condition.operator;
		
		switch (op) {
			case '=': return value === target;
			case '>=': return value >= target;
			case '<=': return value <= target;
			case '>': return value > target;
			case '<': return value < target;
			case 'in': return Array.isArray(target) && target.includes(value);
			case 'not_in': return Array.isArray(target) && !target.includes(value);
			case 'includes': return Array.isArray(value) && value.includes(target);
			case 'not_includes': return Array.isArray(value) && !value.includes(target);
			default: return false;
		}
	}

	getFieldValue(field, useBasicSpeedLimit = false) {
		const speedLimit = useBasicSpeedLimit ? 
			this.getDefaultSpeedForRoadType(this.state.roadType) : 
			this.getSpeedLimit();
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

	executeFormula(formulaId) {
		const formula = this.data.formulas?.[formulaId];
		if (!formula) {
			console.warn(`Formula not found: ${formulaId}`);
			return 0;
		}

		switch (formula.type) {
			case 'escalatingPenalty':
				return this.calculateEscalatingPenalty(formula);
			case 'fixedAmount':
				return formula.amount || 0;
			case 'percentage':
				return Math.round(this.state.speed * (formula.percentage || 0) / 100);
			default:
				console.warn(`Unknown formula type: ${formula.type}`);
				return 0;
		}
	}

	calculateEscalatingPenalty(formula) {
		const { baseSpeed, increment, multiplier, base } = formula;
		if (this.state.speed <= baseSpeed) return 0;
		return Math.floor((this.state.speed - baseSpeed) / increment) * multiplier + base;
	}

}

customElements.define('speed-ticket', SpeedTicket);

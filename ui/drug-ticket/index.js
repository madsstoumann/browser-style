(function() {
	/* --- 1. INITIALIZATION & CACHING --- */
	const form = document.getElementById('app');
	const E = form.elements; // Cache all form elements
	const scroller = form.querySelector('[data-scroll]');

	// Cache constants for the range slider
	const incMin = parseFloat(E.inc.min);
	const incMax = parseFloat(E.inc.max);
	const incRange = incMax - incMin;
	let scrollRange = scroller.firstElementChild.scrollWidth - scroller.clientWidth;
	const locale = document.documentElement.lang || 'da-DK';
	const totFinOutput = E.tot_fin;
	let previousTotalFormatted = null;

	/* --- 2. UTILITIES --- */
	const F = (num) => parseInt(num).toLocaleString(locale);

	const triggerTotalAnimation = () => {
		if (!totFinOutput) return;
		totFinOutput.classList.remove('is-animating');
		// Force reflow to allow re-triggering the animation
		void totFinOutput.offsetWidth;
		totFinOutput.classList.add('is-animating');
	};

	const debounce = (func, delay) => {
		let timeout;
		return function(...args) {
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(this, args), delay);
		};
	};

	/* --- 3. TRACKING --- */
	const pushDataLayerEvent = debounce(() => {
		const isTHC = E.drg.value === 'cannabis';
		const isGas = E.drg.value === 'lattergas';
		let other = '';
		if (isTHC) {
			other = `~thc_${E.thc_lvl.value}`;
		} else if (isGas) {
			other = `~gas_${E.gas_amt.value}`;
		}

		const eventData = {
			'event': 'drug_fine_app',
			'category': E.drg.value,
			'label': E.lic_yrs[0].checked ? 'Ja' : 'Nej',
			'expense': parseInt(E.tot_fin.value.replace(/\./g, '')),
			'other': other
		};

		console.log('dataLayer push:', eventData);
		if (window.dataLayer) {
			window.dataLayer.push(eventData);
		}
	}, 500);

	/* --- 4. CORE LOGIC --- */
	function calculate(init = false) {
		// --- Read inputs and define state ---
		const isTHC = E.drg.value === 'cannabis';
		const isGas = E.drg.value === 'lattergas';
		const lowTHC = E.thc_lvl.value === 'low';
		const medTHC = E.thc_lvl.value === 'medium';
		const highTHC = E.thc_lvl.value === 'high';
		const hasLicenseOver3Years = E.lic_yrs[0].checked;
		const gasAmount = E.gas_amt.value;

		// --- Perform calculations and update UI ---
		const yearlyIncome = E.inc.value * 12;
		E.inc_out.value = F(E.inc.value);
		E.inc_yer.value = F(yearlyIncome);
		scroller.scrollLeft = (E.inc.value - incMin) / incRange * scrollRange;

		// Update gas outputs
		const gasValue = F(gasAmount);
		E.gas_amt_low.value = E.gas_amt_med.value = E.gas_amt_high.value = gasValue;
		E.gas_pos.value = F(isGas ? 10000 : 0);
		E.fin.value = F(Math.max(1500, Math.round((yearlyIncome / 25) / (isTHC && lowTHC ? 2 : 1))));

		// --- Update visibility of sections ---
		const visibilityMap = {
			thc: isTHC,
			gas: isGas,
			gas_inf_dsc: isGas,
			gas_pos: isGas,
			gas_amt_low: isGas && gasAmount === '3000',
			gas_amt_med: isGas && gasAmount === '5000',
			gas_amt_high: isGas && gasAmount === '50000',
			lic: isGas || (isTHC && medTHC),
			ant_crs: !(isTHC && lowTHC),
			lic_tst: !(isTHC && lowTHC),
			vic_fnd: !(isTHC && lowTHC),
			ant_dsc: !(isTHC && lowTHC),
			lic_tst_dsc: !(isTHC && lowTHC),
			lic_clp_dsc: isTHC && lowTHC,
			drv_ban_dsc: (isTHC && medTHC || isGas) && !hasLicenseOver3Years,
			cnd_dsq_dsc: (isTHC && medTHC || isGas) && hasLicenseOver3Years,
			unc_dsq_3ys: (isTHC && highTHC) || (!isTHC && !isGas),
		};

		for (const key in visibilityMap) {
			if (E[key]) {
				E[key].hidden = !visibilityMap[key];
			}
		}

		const total = [...E.brk.elements]
			.reduce((sum, elm) =>
				sum + (elm.hidden ? 0 : parseInt((elm.value || '0').replace(/\./g, '')))
			, 0);

		const totalFormatted = F(total);
		if (previousTotalFormatted !== null && totalFormatted !== previousTotalFormatted) {
			triggerTotalAnimation();
		}
		previousTotalFormatted = totalFormatted;
		E.tot.value = E.tot_fin.value = totalFormatted;
		if (!init) pushDataLayerEvent();
	}

	/* --- 5. EVENT HANDLING --- */
	form.addEventListener('input', calculate);

	if (totFinOutput) {
		totFinOutput.addEventListener('animationend', () => {
			totFinOutput.classList.remove('is-animating');
		});
	}

	// --- Custom scroller logic ---
	let isDragging = false, startX, scrollLeft;
	scroller.addEventListener('pointerdown', (e) => {
		isDragging = true;
		startX = e.clientX;
		scrollLeft = scroller.scrollLeft;
	});
	scroller.addEventListener('pointermove', (e) => {
		if (!isDragging) return;
		scroller.scrollLeft = scrollLeft - (e.clientX - startX);
		E.inc.value = Math.round(incMin + (scroller.scrollLeft / scrollRange) * incRange);
		calculate();
	});
	scroller.addEventListener('pointerup', () => isDragging = false);
	scroller.addEventListener('pointercancel', () => isDragging = false);
	scroller.addEventListener('pointerleave', () => isDragging = false);

	/* --- 6. BROWSER RESIZE HANDLING --- */
	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			const currentValue = E.inc.value;
			scrollRange = scroller.firstElementChild.scrollWidth - scroller.clientWidth;
			scroller.scrollLeft = (currentValue - incMin) / incRange * scrollRange;
		}, 250);
	});

	/* --- 7. DYNAMIC VIDEO BACKGROUND --- */
	const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	const handleMotionChange = (e) => {
		const existingVideo = document.querySelector('.video-bg');
		if (e.matches) {
			if (existingVideo) {
				existingVideo.remove();
			}
		} else {
			if (!existingVideo) {
				const video = document.createElement('video');
				video.className = 'video-bg';
				video.autoplay = true;
				// video.loop = true;
				video.muted = true;
				video.playsInline = true;
				video.loading = 'lazy';
				const source = document.createElement('source');
				source.src = 'video.mp4';
				source.type = 'video/mp4';
				video.appendChild(source);
				document.body.prepend(video);
			}
		}
	};
	handleMotionChange(motionQuery);
	motionQuery.addEventListener('change', handleMotionChange);

	// Initial calculation on page load
	calculate(true);
})();
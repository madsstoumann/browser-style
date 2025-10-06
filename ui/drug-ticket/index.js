(function() {
	// 1. INITIALIZATION & CACHING
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

	// Utility function
	const F = (num) => parseInt(num).toLocaleString(locale);
	const triggerTotalAnimation = () => {
		if (!totFinOutput) return;
		totFinOutput.classList.remove('is-animating');
		// Force reflow to allow re-triggering the animation
		void totFinOutput.offsetWidth;
		totFinOutput.classList.add('is-animating');
	};

	if (totFinOutput) {
		totFinOutput.addEventListener('animationend', () => {
			totFinOutput.classList.remove('is-animating');
		});
	}

	// 2. CORE LOGIC
	function calculate() {
		// --- Read inputs and define state ---
		const isTHC = E.drg.value === '1', isGas = E.drg.value === '2', lowTHC = E.thc_lvl.value === 'low', medTHC = E.thc_lvl.value === 'medium', highTHC = E.thc_lvl.value === 'high';
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
		E.thc.hidden = !isTHC;
		E.gas.hidden = E.gas_inf_dsc.hidden = !isGas;
		E.gas_amt_low.hidden = !isGas || gasAmount !== '3000';
		E.gas_amt_med.hidden = !isGas || gasAmount !== '5000';
		E.gas_amt_high.hidden = !isGas || gasAmount !== '50000';
		E.gas_pos.hidden = !isGas;

		E.lic.hidden = !isGas && (!isTHC || !medTHC);
		E.ant_crs.hidden = E.lic_tst.hidden = E.vic_fnd.hidden = E.ant_dsc.hidden = E.lic_tst_dsc.hidden  = (isTHC && lowTHC);
		E.lic_clp_dsc.hidden = !(isTHC && lowTHC);
		E.drv_ban_dsc.hidden = !((isTHC && medTHC || isGas) && !hasLicenseOver3Years);
		E.cnd_dsq_dsc.hidden = !((isTHC && medTHC || isGas) && hasLicenseOver3Years);
		E.unc_dsq_3ys.hidden = !((isTHC && highTHC) || (!isTHC && !isGas));

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
	}

	// 3. EVENT HANDLING
	form.addEventListener('input', calculate);

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

	// 4. BROWSER RESIZE HANDLING
	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			const currentValue = E.inc.value;
			scrollRange = scroller.firstElementChild.scrollWidth - scroller.clientWidth;
			scroller.scrollLeft = (currentValue - incMin) / incRange * scrollRange;
		}, 250);
	});


	// Initial calculation on page load
	calculate();

	// Conditionally load video background based on motion preferences
	const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

	const handleMotionChange = (e) => {
		const existingVideo = document.querySelector('.video-bg');
		if (e.matches) {
			// If user prefers reduced motion, remove video if it exists
			if (existingVideo) {
				existingVideo.remove();
			}
		} else {
			// If user does not prefer reduced motion, add video if it doesn't exist
			if (!existingVideo) {
				const video = document.createElement('video');
				video.className = 'video-bg';
				video.autoplay = true;
				video.loop = true;
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

	// Initial check
	handleMotionChange(motionQuery);

	// Listen for changes
	motionQuery.addEventListener('change', handleMotionChange);
})();
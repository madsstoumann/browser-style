(function() {
	/* --- 1. INITIALIZATION & CACHING --- */
	const form = document.getElementById('app');
	const E = form.elements;
	const scroller = form.querySelector('[data-scroll]');
	const incMin = parseFloat(E.inc.min);
	const incMax = parseFloat(E.inc.max);
	const incRange = incMax - incMin;
	let scrollRange = scroller.firstElementChild.scrollWidth - scroller.clientWidth;
	const locale = document.documentElement.lang || 'da-DK';
	const currency = form.dataset.currency || 'DKK';
	const totFinOutput = E.tot_fin;
	let previousTotalFormatted = null;

	/* --- 2. UTILITIES --- */
	const F = (num) => parseInt(num).toLocaleString(locale);
	const FC = (num) => new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

	const triggerTotalAnimation = () => {
		if (!totFinOutput) return;
		totFinOutput.classList.remove('is-animating');
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
		}

		const eventData = {
			'event': 'drug_fine_app',
			'category': E.drg.value,
			'label': E.lic_yrs[0].checked ? 'Ja' : 'Nej',
			'expense': parseInt(E.tot_fin.value.replace(/\./g, '')),
			'other': other
		};

		// console.log('dataLayer push:', eventData);
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

		// --- Perform calculations and update UI ---
		const yearlyIncome = E.inc.value;
		E.inc_out.value = FC(E.inc.value);
		scroller.scrollLeft = (E.inc.value - incMin) / incRange * scrollRange;
		E.fin.value = F(Math.max(1500, Math.round((yearlyIncome / 25) / (isTHC && lowTHC ? 2 : 1))));

		E.bld_ana.value = F(isTHC ? 2079 : 2899);
		// --- Update visibility of sections ---
		const visibilityMap = {
			thc: isTHC,
			thc_info_low: isTHC && lowTHC,
			thc_info_med: isTHC && medTHC,
			thc_info_high: isTHC && highTHC,
			gas_inf_dsc: isGas,
			lic: (isTHC && medTHC),
			other_info: E.drg.value === 'andre',
			ant_crs: !(isTHC && lowTHC),
			lic_tst: !(isTHC && lowTHC),
			vic_fnd: !(isTHC && lowTHC),
			ant_dsc: !(isTHC && lowTHC),
			lic_tst_dsc: !(isTHC && lowTHC),
			lic_clp_dsc: isTHC && lowTHC,
			drv_ban_dsc: (isTHC && medTHC) && !hasLicenseOver3Years,
			cnd_dsq_dsc: (isTHC && medTHC) && hasLicenseOver3Years,
			unc_dsq_3ys: (isTHC && highTHC) || !isTHC,
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

		const totalRounded = Math.round(total / 500) * 500;
	const totalFormatted = F(total);
		if (previousTotalFormatted !== null && totalFormatted !== previousTotalFormatted) {
			triggerTotalAnimation();
		}
		previousTotalFormatted = totalFormatted;
		E.tot.value = totalFormatted;
		E.tot_fin.value = FC(totalRounded);
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
	const videoElm = document.querySelector('.video-bg');
	if (videoElm && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		videoElm.play().catch(() => {});
	}
	if (videoElm) {
		videoElm.addEventListener('ended', () => {
			setTimeout(() => {
				videoElm.currentTime = 0;
				videoElm.play().catch(() => {});
			}, 4000);
		});
	}

	// Initial calculation on page load
	calculate(true);
})();
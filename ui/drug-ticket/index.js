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

	// Utility function
	const F = (num) => parseInt(num).toLocaleString(locale);

	// 2. CORE LOGIC
	function calculate() {
		// --- Read inputs and define state ---
		const isTHC = E.drg.value === '1', isGas = E.drg.value === '2', lowTHC = E.thc_lvl.value === 'low', medTHC = E.thc_lvl.value === 'medium', highTHC = E.thc_lvl.value === 'high', gasPos = E.gas_amt.value !== '0';
		const hasLicenseOver3Years = E.lic_yrs[0].checked;

		// --- Perform calculations and update UI ---
		E.inc_out.value = F(E.inc.value);
		E.inc_yer.value = F(E.inc.value * 12);
		scroller.scrollLeft = (E.inc.value - incMin) / incRange * scrollRange;
		E.gas_amt_out.value = F(isGas ? E.gas_amt.value : 0);
		E.gas_pos.value = F(isGas && E.gas_amt.value !== '0' ? 10000 : 0);
		E.fin.value = F(Math.max(1500, Math.round(((E.inc.value * 12) / 25) / (isTHC && lowTHC ? 2 : 1))));

		// --- Update visibility of sections ---
		E.thc.hidden = !isTHC;
		E.gas.hidden = E.gas_inf_dsc.hidden = !isGas;
		E.gas_amt_out.hidden = E.gas_pos.hidden = E.gas_pos_dsc.hidden = !isGas || !gasPos;
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

		E.tot.value = E.tot_fin.value = F(total);
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
})();
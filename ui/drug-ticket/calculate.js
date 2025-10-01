function calculate(E) {
	const isTHC = E.drg.value === '1', isGas = E.drg.value === '2', lowTHC = E.thc_lvl.value === 'low', medTHC = E.thc_lvl.value === 'medium', highTHC = E.thc_lvl.value === 'high', gasPos = E.gas_amt.value !== '0';
	const licUnder3 = E.lic_yrs[0].checked;
	const locale = document.documentElement.lang || 'da-DK';
	const F = (num) => parseInt(num).toLocaleString(locale);
	const T = (elm, condition) => elm.hidden = !condition;

	E.inc.style.setProperty('--_v', (E.inc.value - incMin) / incRange * 100 + '%');
	E.inc_out.value = F(E.inc.value);
	E.inc_yer.value = F(E.inc.value * 12);
	E.gas_amt_out.value = F(isGas ? E.gas_amt.value : 0);
	E.gas_pos.value = F(isGas && gasPos ? 10000 : 0);
	E.fin.value = F(Math.max(1500, Math.round(((E.inc.value * 12) / 25) / (isTHC && lowTHC ? 2 : 1))));

	T(E.thc, isTHC);
	[E.gas, E.gas_inf_dsc].forEach(elm => T(elm, isGas));
	[E.gas_amt_out, E.gas_pos, E.gas_pos_dsc].forEach(elm => T(elm, isGas && gasPos));
	T(E.lic, isGas || (isTHC && medTHC));
	[E.ant_crs, E.lic_tst, E.vic_fnd, E.ant_dsc, E.lic_tst_dsc].forEach(elm => T(elm, !(isTHC && lowTHC)));
	T(E.lic_clp_dsc, isTHC && lowTHC);
	T(E.drv_ban_dsc, (isTHC && medTHC || isGas) && !licUnder3);
	T(E.cnd_dsq_dsc, (isTHC && medTHC || isGas) && licUnder3);
	T(E.unc_dsq_3ys, (isTHC && highTHC) || (!isTHC && !isGas));

	const total = [...E.brk.elements]
		.filter(elm => !elm.hidden)
		.reduce((sum, elm) => sum + parseInt((elm.value || '0').replace(/\./g, '')), 0);

	E.tot.value = E.tot_fin.value = F(total);
}
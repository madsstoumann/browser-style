import { icons } from './icons.js';
import { t } from './utility.js';

const bound = (context) => ({
	t: (key) => t(key, context.lang, context.i18n),
	icon: (iconName) => context.renderIcon(iconName)
});

export function renderForm(context) {
	const { t, icon } = bound(context);
	const currentDensity = context.settings.density;
	const densityControls = Object.keys(context.settings.densityOptions).map(key => {
		const { label, icon: densityIcon, i18n } = context.settings.densityOptions[key];
		return `<label class="ui-button" title="${t(i18n)}">
			<input type="radio" name="density_option" value="${key}"${key === currentDensity ? ' checked' : ''} data-sr>
			${icon(icons[densityIcon])}
		</label>`;
	}).join('');

	return `
	<fieldset name="selection" hidden>
		<button type="button" name="selectall" title="${t('selectAll')}"${!context.settings.isTouch ? ' hidden' : ''}>${icon(icons.listCheck)}</button>
		<small><output name="selected">0</output> ${t('selected')}</small>
	</fieldset>
	<fieldset name="actions">
		<button type="button" name="print" title="${t('print')}" hidden>${icon(icons.printer)}</button>
		<fieldset name="textoptions" hidden>
			<label class="ui-button" title="${t('layoutFixed')}"><input type="checkbox" name="layoutfixed" data-sr checked>${icon(icons.layoutFixed)}</label>
			<label class="ui-button" title="${t('textWrap')}"><input type="checkbox" name="textwrap" data-sr checked>${icon(icons.textWrap)}</label>
		</fieldset>
		<fieldset name="density" hidden>${densityControls}</fieldset>
		<button type="button" name="csv" hidden>${icon(icons.csv)}</button>
		<button type="button" name="json" hidden>${icon(icons.json)}</button>
	</fieldset>
	<fieldset name="navigation">
		${renderNavigation(context)}
	</fieldset>`;
}

export function renderNavigation(context) {
	const { t, icon } = bound(context);

	return `
	<fieldset name="rows" hidden>
		<label>${t('rowsPerPage')}:
			<select name="itemsperpage">${context.settings.pagesize.map(value => `<option${value === context.state.itemsPerPage ? ' selected' : ''}>${value}</option>`).join('')}</select>
		</label>
		<small>
			<output name="start"></output>&ndash;<output name="end"></output> ${t('of')} <output name="total"></output>
		</small>
	</fieldset>
	<fieldset name="pagination" hidden>
		<button type="button" name="first" title="${t('first')}">${icon(icons.chevronLeftPipe)}</button>
		<button type="button" name="stepdown" title="${t('prev')}">${icon(icons.chevronLeft)}</button>
		<label title="${t('page')}">
			<input type="number" name="page" min="1" size="1">
		</label>
		${t('of')}<output name="pages"></output>
		<button type="button" name="stepup" title="${t('next')}">${icon(icons.chevronRight)}</button>
		<button type="button" name="last" title="${t('last')}">${icon(icons.chevronRightPipe)}</button>
	</fieldset>`;
}

export function renderSearch(context) {
	const { t, icon } = bound(context);
	const columnFilterId = `${crypto.randomUUID()}`;

	return `
	<fieldset name="search" form="${context.form.id}" hidden>
		<label>
			<input type="search" name="searchterm" form="${context.form.id}" placeholder="${t('search')}" value="${context.getAttribute('searchterm') || ''}">
		</label>
		<label>
			<select name="searchmethod" form="${context.form.id}">
				<option value="includes" selected>${t('includes')}</option>
				<option value="start">${t('startsWith')}</option>
				<option value="end">${t('endsWith')}</option>
				<option value="equals">${t('equals')}</option>
			</select>
		</label>
		<button type="button" name="columns" title="${t('columns')}" id="pa${columnFilterId}" popovertarget="cf${columnFilterId}">${icon(icons.columns)}</button>
	</fieldset>
	<fieldset name="columnfilter" form="${context.form.id}" id="cf${columnFilterId}" style="--_pa:pa${columnFilterId};" hidden></fieldset>`;
}
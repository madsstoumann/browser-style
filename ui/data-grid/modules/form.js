import { icons } from './icons.js';
import { baseTranslate } from './i18n.js';

const bound = (context) => ({
	translate: (key) => baseTranslate(key, context.options.locale, context.options.i18n),
	icon: (iconName) => context.renderIcon(iconName)
});

export function renderForm(context) {
	const { translate, icon } = bound(context);

	return `
	<fieldset name="selection"><small><output name="selected">0</output> ${translate('selected')}</small></fieldset>
	<fieldset name="actions">
		${context.options.printable ? `<button type="button" name="print">${icon(icons.printer)}</button>` : ''}
		${context.options.density ? `<button type="button" name="density">${icon(icons.density)}</button>` : ''}
		${context.options.exportable ? `<button type="button" name="csv">${icon(icons.csv)}</button>` : ''}
		${context.options.exportable ? `<button type="button" name="json">${icon(icons.json)}</button>` : ''}
	</fieldset>
	<fieldset name="navigation">${renderNavigation(context)}</fieldset>`;
}

export function renderNavigation(context) {
	const { translate, icon } = bound(context);

	return `
	<label>${translate('rowsPerPage')}:
		<select name="itemsperpage">${context.options.pagesize.map(value => `<option${value === context.state.itemsPerPage ? ` selected` : ''}>${value}</option>`).join('')}</select>
	</label>
	<small>
		<output name="start"></output>&ndash;<output name="end"></output> ${translate('of')} <output name="total"></output>
	</small>
	<fieldset>
		<button type="button" name="first" title="${translate('first')}">${icon(icons.chevronLeftPipe)}</button>
		<button type="button" name="stepdown" title="${translate('prev')}">${icon(icons.chevronLeft)}</button>
		<label title="${translate('page')}">
			<input type="number" name="page" min="1" size="1">
		</label>
		${translate('of')}<output name="pages"></output>
		<button type="button" name="stepup" title="${translate('next')}">${icon(icons.chevronRight)}</button>
		<button type="button" name="last" title="${translate('last')}">${icon(icons.chevronRightPipe)}</button>
	</fieldset>`;
}

export function renderSearch(context) {
	const { translate } = bound(context);

	return `
	<fieldset name="search" form="${context.form.id}">
		<label>
			<input type="search" name="searchterm" form="${context.form.id}" placeholder="${translate('search')}" value="${context.getAttribute('searchterm') || ''}">
		</label>
		<label>
			<select name="searchmethod" form="${context.form.id}">
				<option value="includes" selected>${translate('includes')}</option>
				<option value="start">${translate('startsWith')}</option>
				<option value="end">${translate('endsWith')}</option>
				<option value="equals">${translate('equals')}</option>
			</select>
		</label>
	</fieldset>`;
}

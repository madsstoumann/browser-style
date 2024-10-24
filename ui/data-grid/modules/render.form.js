import { icons } from './icons.js';
import { t } from './utility.js';

/**
 * Binds context-specific translation and icon rendering functions.
 *
 * @param {Object} context - The context object that contains language and rendering methods.
 * @returns {Object} - An object containing `t` (translation) and `icon` (icon rendering) functions.
 */
const bound = (context) => ({
	t: (key) => t(key, context.lang, context.i18n),
	icon: (iconName) => context.renderIcon(iconName)
});

/**
 * Renders the form with various controls such as density options, print/export buttons, and navigation.
 *
 * @param {Object} context - The context object containing configuration, state, and rendering methods.
 * @returns {string} - The HTML string representing the rendered form.
 */
export function renderForm(context) {
	const { t, icon } = bound(context);
	const currentDensity = context.options.density;
	const densityGroupName = `density-${window.crypto.randomUUID()}`;
	const densityControls = currentDensity
		? Object.keys(context.densityOptions).map(key => {
			const { label, icon: densityIcon } = context.densityOptions[key];
			return `<label class="ui-button">
				<input type="radio" name="${densityGroupName}" value="${key}"${key === currentDensity ? ' checked' : ''} data-sr>
				${icon(icons[densityIcon])}
			</label>`;
		}).join('')
		: '';

	return `
	<fieldset name="selection">
		<small><output name="selected">0</output> ${t('selected')}</small>
	</fieldset>
	<fieldset name="actions">
		${context.options.printable ? `<button type="button" name="print">${icon(icons.printer)}</button>` : ''}
		${currentDensity ? `<fieldset name="density">${densityControls}</fieldset>` : ''}
		${context.options.exportable ? `<button type="button" name="csv">${icon(icons.csv)}</button>` : ''}
		${context.options.exportable ? `<button type="button" name="json">${icon(icons.json)}</button>` : ''}
	</fieldset>
	<fieldset name="navigation">${renderNavigation(context)}</fieldset>`;
}

/**
 * Renders the navigation controls for the table, including pagination and items per page.
 *
 * @param {Object} context - The context object containing state, options, and rendering methods.
 * @returns {string} - The HTML string representing the navigation controls.
 */
export function renderNavigation(context) {
	const { t, icon } = bound(context);

	return `
	<label>${t('rowsPerPage')}:
		<select name="itemsperpage">${context.options.pagesize.map(value => `<option${value === context.state.itemsPerPage ? ' selected' : ''}>${value}</option>`).join('')}</select>
	</label>
	<small>
		<output name="start"></output>&ndash;<output name="end"></output> ${t('of')} <output name="total"></output>
	</small>
	<fieldset>
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

/**
 * Renders the search input and method selection for filtering table data.
 *
 * @param {Object} context - The context object containing form configuration and attributes.
 * @returns {string} - The HTML string representing the search fieldset.
 */
export function renderSearch(context) {
	const { t } = bound(context);

	return `
	<fieldset name="search" form="${context.form.id}">
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
	</fieldset>`;
}

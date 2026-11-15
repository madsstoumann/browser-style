import { visibleWhenLogic } from './visible-when.js';

/**
 * Texts and fields that follow the answers, written on the form instead of as rules:
 * `showWhen` and `visibleWhen` on a field or a layout entry, `cases` on a text block, `note` on a choice.
 * A condition here is the name of a named condition ("lowThc", read as vars.lowThc === true) or JSON Logic,
 * so a translated form definition can carry names only and no logic.
 */

/* A named condition's name, or a condition as it is. */
export const conditionOf = when => (typeof when === 'string' ? { '===': [{ var: `vars.${when}` }, true] } : when ?? true);

/* showWhen and visibleWhen as rules the engine runs like any other: when the condition is false, the field is hidden
   or the step skipped; with both, both must hold. visibleWhen on a row field of a repeating group is a row rule.
   Each carries `at`, where it was written, for validation messages. */
export function implicitRules(form) {
	const rules = [];
	for (const [id, field] of form.fields) {
		const property = field.property;
		if (property?.showWhen !== undefined) rules.push({ id: `showWhen:${id}`, when: { '!': conditionOf(property.showWhen) }, then: [{ hide: id }], at: `properties.${id}.showWhen` });
		if (property?.visibleWhen !== undefined) rules.push({ id: `visibleWhen:${id}`, when: { '!': visibleWhenLogic(property.visibleWhen) }, then: [{ hide: id }], at: `properties.${id}.visibleWhen` });
		if (property?.type !== 'list') continue;
		for (const [item, cell] of Object.entries(property.items?.properties ?? {})) {
			if (cell?.visibleWhen === undefined) continue;
			rules.push({ id: `visibleWhen:${id}.${item}`, forEach: id, when: { '!': visibleWhenLogic(cell.visibleWhen, { base: 'row.' }) }, then: [{ hide: `${id}.${item}` }], at: `properties.${id}.items.properties.${item}.visibleWhen` });
		}
	}
	for (const entry of [...form.steps, ...(form.panels ?? [])]) {
		if (entry.showWhen !== undefined) rules.push({ id: `showWhen:step:${entry.id}`, when: { '!': conditionOf(entry.showWhen) }, then: [{ skip: entry.id }], at: `structure.layout.${entry.id}.showWhen` });
		if (entry.visibleWhen !== undefined) rules.push({ id: `visibleWhen:step:${entry.id}`, when: { '!': visibleWhenLogic(entry.visibleWhen) }, then: [{ skip: entry.id }], at: `structure.layout.${entry.id}.visibleWhen` });
	}
	return rules;
}

/* The notes of the chosen choices: a text for one choice, a list for a multiple choice; null when none has a note. */
export function noteOf(property, value) {
	const choices = property?.options?.choices;
	if (!Array.isArray(choices) || value === undefined || value === null) return null;
	const chosen = Array.isArray(value) ? value : [value];
	const notes = choices.filter(choice => choice && typeof choice === 'object' && typeof choice.note === 'string' && choice.note && chosen.includes(choice.value)).map(choice => choice.note);
	if (!notes.length) return null;
	return Array.isArray(value) ? notes : notes[0];
}

/* Which cases of a text block match: their positions, all of them or only the first (show: "first"). */
export function matchingCases(property, test) {
	if (!Array.isArray(property?.cases)) return null;
	const hits = [];
	for (const [index, entry] of property.cases.entries()) {
		if (!test(conditionOf(entry?.when))) continue;
		hits.push(index);
		if (property.show === 'first') break;
	}
	return hits;
}

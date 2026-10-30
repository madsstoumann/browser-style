/**
 * The form designer: the steps-and-fields outline, and inspectors for the form, a step and a field.
 * Every view gets `editor`: { form, rules, selection, advanced, commit({ form?, rules? }), select({ … }) }.
 */
import { h, field, check, select, button, download } from './dom.js';
import { addField, addStep, clone, fieldId, moveItem, removeField, removeStep, renameField, renameStep, rulesUsingField, stepOfField, stepsOf } from './model.js';
import { extractSnippet, insertSnippet } from './snippets.js';
import { whenPicker } from './when.js';
import { changeType, fieldFromType, groupTypes, searchTypes, typeOf } from '../../form-rules/index.js';

/* Settings for a field whose type no installed package describes. */
const FALLBACK_SETTINGS = {
	string: ['placeholder', 'length', 'pattern', 'checks'],
	number: ['range', 'checks'],
	integer: ['range', 'checks'],
	select: ['choices'],
	content: ['content'],
	file: ['files'],
	list: ['items', 'rows']
};
const ITEM_TYPES = [['string', 'Text'], ['number', 'Number'], ['integer', 'Whole number'], ['boolean', 'Yes / no'], ['select', 'Choice']];
const FORMATS = [['', 'Plain number'], ['decimal', 'Two decimals'], ['currency', 'Amount of money'], ['percent', 'Percent']];
const MB = 1048576;
const INSTALLED = 'From installed packages';

const typeOfField = (editor, property) => typeOf(property, editor.types);
const titleOf = (editor, id) => {
	const property = editor.form.fields.properties[id];
	return property?.title || typeOfField(editor, property)?.title || id;
};

/* === The type picker: a searchable list, grouped; types from packages other than core come last, under their package === */

export function pickType(editor, { title = 'Add a field', current = null, onpick, onsnippet = null }) {
	const registry = editor.types;
	const search = h('input', { type: 'search', placeholder: 'Search field types', 'aria-label': 'Search field types', autocomplete: 'off' });
	const list = h('div', { part: 'type-list' });
	const dialog = h('dialog', { part: 'type-picker', 'aria-label': title },
		h('form', { method: 'dialog' },
			h('header', { part: 'row' }, h('h2', {}, title), h('button', { value: 'cancel', 'aria-label': 'Close' }, '×')),
			search,
			list));
	const choose = type => {
		dialog.close();
		onpick(type);
	};
	const item = type => h('li', {}, button([
		h('span', { part: 'badge' }, type.glyph ?? '?'),
		h('span', {}, h('strong', {}, type.title), type.description ? h('small', {}, type.description) : null)
	], () => choose(type), { 'aria-current': current === type.kind ? 'true' : null, 'data-kind': type.kind }));
	const snippetItem = (snippet, own = false) => h('li', { part: own ? 'own' : null }, button([
		h('span', { part: 'badge' }, '⧉'),
		h('span', {}, h('strong', {}, snippet.title ?? snippet.snippet), h('small', {}, snippet.description ?? `${(snippet.fields ?? Object.keys(snippet.properties)).length} fields`))
	], () => { dialog.close(); onsnippet(snippet); }, { 'data-snippet': snippet.snippet }),
	own ? [
		button('Download', () => download(`${snippet.snippet}.json`, snippet), { 'aria-label': `Download ${snippet.title ?? snippet.snippet}` }),
		button('Delete', () => {
			if (!confirm(`Delete your snippet "${snippet.title ?? snippet.snippet}"?`)) return;
			editor.deleteSnippet(snippet.snippet);
			draw();
		}, { part: 'danger', 'aria-label': `Delete ${snippet.title ?? snippet.snippet}` })
	] : null);
	const matching = snippets => {
		const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
		return onsnippet ? (snippets ?? []).filter(snippet => words.every(word => [snippet.title, snippet.description, snippet.snippet, ...(snippet.keywords ?? [])].join(' ').toLowerCase().includes(word))) : [];
	};
	const draw = () => {
		const found = searchTypes(registry, search.value);
		const snippets = matching(editor.snippets);
		const own = matching(editor.ownSnippets);
		const core = found.filter(type => type.package === 'core');
		const installed = registry.packages.filter(entry => entry.package !== 'core')
			.map(entry => ({ entry, types: found.filter(type => type.package === entry.package) }))
			.filter(group => group.types.length);
		list.replaceChildren(...[
			...groupTypes(registry, core).map(group => h('section', {}, h('h3', {}, group.group), h('ul', {}, group.types.map(item)))),
			installed.length ? h('section', { part: 'installed' }, h('h3', {}, INSTALLED),
				installed.map(({ entry, types }) => [h('h4', {}, entry.title), h('ul', {}, types.map(item))])) : null,
			snippets.length ? h('section', { part: 'snippets' }, h('h3', {}, 'Snippets: several fields at once'), h('ul', {}, snippets.map(snippet => snippetItem(snippet)))) : null,
			own.length ? h('section', { part: 'snippets' }, h('h3', {}, 'Your snippets'), h('ul', {}, own.map(snippet => snippetItem(snippet, true)))) : null,
			found.length || snippets.length || own.length ? null : h('p', {}, `No field type matches "${search.value}". Install a type package to add more.`)
		].filter(Boolean));
	};
	search.addEventListener('input', draw);
	search.addEventListener('keydown', event => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		const first = searchTypes(registry, search.value)[0];
		if (first) choose(first);
	});
	dialog.addEventListener('close', () => dialog.remove());
	draw();
	editor.append(dialog);
	dialog.showModal();
	search.focus();
	return dialog;
}

/* === The outline (left pane) === */

export function renderOutline(editor) {
	const { form, selection } = editor;
	const steps = stepsOf(form);
	return h('nav', { 'aria-label': 'Steps and fields' },
		h('h2', {}, 'Steps and fields'),
		h('ol', { part: 'outline' }, steps.map((step, index) => h('li', {},
			button(`${index + 1}  ${step.name}`, () => editor.select({ view: 'form', step: step.id, field: null }), {
				part: 'outline-step', 'aria-current': selection.step === step.id && !selection.field ? 'true' : null
			}),
			step.hidden ? h('small', {}, 'only when a rule includes it') : null,
			h('ul', {}, step.fields.map(id => h('li', {},
				button([h('span', { part: 'badge' }, typeOfField(editor, form.fields.properties[id])?.glyph ?? '?'), ' ', titleOf(editor, id)],
					() => editor.select({ view: 'form', step: step.id, field: id }),
					{ part: 'outline-field', 'aria-current': selection.field === id ? 'true' : null })
			)),
			(step.slots ?? []).map(slot => h('li', { part: 'outline-slot' }, `slot: ${slot}`))),
			button('+ Field', () => pickType(editor, {
				title: `Add a field to ${step.name}`,
				onpick: type => {
					const result = addField(form, step.id, null, fieldFromType(type));
					editor.commit({ form: result.form });
					editor.select({ view: 'form', step: step.id, field: result.id });
				},
				onsnippet: snippet => {
					const result = insertSnippet(form, editor.rules, snippet, step.id);
					editor.commit({ form: result.form, rules: result.rules });
					editor.select({ view: 'form', step: step.id, field: result.fields[0] ?? null });
				}
			}), { part: 'add' })
		))),
		button('+ Step', () => {
			const result = addStep(form, `Step ${steps.length + 1}`);
			editor.commit({ form: result.form });
			editor.select({ view: 'form', step: result.id, field: null });
		}, { part: 'add' })
	);
}

/* === Inspectors (main pane) === */

export function renderFormView(editor) {
	const { form, selection } = editor;
	if (selection.field && form.fields.properties[selection.field]) return fieldInspector(editor, selection.field);
	if (selection.step && stepsOf(form).some(step => step.id === selection.step)) return stepInspector(editor, selection.step);
	return formInspector(editor);
}

function formInspector(editor) {
	const { form, rules } = editor;
	const update = fn => {
		const nextForm = clone(form);
		const nextRules = clone(rules);
		fn(nextForm, nextRules);
		editor.commit({ form: nextForm, rules: nextRules });
	};
	return h('section', { part: 'inspector' },
		h('h2', {}, 'Form'),
		field('Title', h('input', { value: form.fields.title ?? '', onchange: e => update(f => { f.fields.title = e.target.value; }) })),
		field('Form id', h('input', { value: form.id, pattern: '[a-z0-9][a-z0-9\\-]*', onchange: e => update((f, r) => { f.id = e.target.value; r.fields.form = e.target.value; }) }), 'Lowercase letters, digits and dashes'),
		field('Rule set id', h('input', { value: rules.id, onchange: e => update((f, r) => { r.id = e.target.value; }) })),
		field('Rule set version', h('input', { type: 'number', min: 1, value: rules.fields.version ?? 1, onchange: e => update((f, r) => { r.fields.version = Number(e.target.value) || 1; }) }), 'Raise it when you publish changed rules'),
		h('p', {}, h('small', {}, 'Select a step or a field in the outline to edit it.'))
	);
}

function stepInspector(editor, stepId) {
	const { form, rules } = editor;
	const steps = stepsOf(form);
	const step = steps.find(s => s.id === stepId);
	const index = form.fields.structure.layout.indexOf(step);
	const update = fn => {
		const next = clone(form);
		fn(stepsOf(next).find(s => s.id === stepId), next);
		editor.commit({ form: next });
	};
	const move = direction => {
		const next = clone(form);
		next.fields.structure.layout = moveItem(next.fields.structure.layout, index, direction);
		editor.commit({ form: next });
	};
	return h('section', { part: 'inspector' },
		h('h2', {}, `Step: ${step.name}`),
		field('Name', h('input', { value: step.name, onchange: e => update(s => { s.name = e.target.value; }) })),
		editor.advanced ? field('Step id', h('input', {
			value: step.id,
			onchange: e => {
				const result = renameStep(form, rules, step.id, e.target.value.trim());
				if (!result.renamed) { e.target.value = step.id; return; }
				editor.commit({ form: result.form, rules: result.rules });
				editor.select({ step: e.target.value.trim() });
			}
		}), 'Rules that skip or include this step are updated') : null,
		check('Only shown when a rule includes it', step.hidden === true, value => update(s => { if (value) s.hidden = true; else delete s.hidden; })),
		whenPicker(editor, step.showWhen, {
			label: 'Show this step', always: true,
			apply: (value, nextRules) => {
				const next = clone(form);
				const s = stepsOf(next).find(x => x.id === stepId);
				if (value === undefined) delete s.showWhen; else s.showWhen = value;
				editor.commit(nextRules ? { form: next, rules: nextRules } : { form: next });
			}
		}),
		field('Slots for fields from services', h('input', {
			value: (step.slots ?? []).join(', '),
			onchange: e => update(s => {
				const slots = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
				if (slots.length) s.slots = slots; else delete s.slots;
			})
		}), 'Comma-separated, for example cover.extra'),
		step.fields.length ? button('Save fields as snippet…', () => saveSnippetDialog(editor, step)) : null,
		h('div', { part: 'row' },
			button('Move up', () => move(-1), { disabled: index <= 0 }),
			button('Move down', () => move(1), { disabled: index >= form.fields.structure.layout.length - 1 }),
			button('Delete step', () => {
				const used = step.fields.flatMap(id => rulesUsingField(rules, id));
				const message = `Delete "${step.name}" and its ${step.fields.length} field(s)?` + (used.length ? `\nRules that use them: ${[...new Set(used)].join(', ')}` : '');
				if (!confirm(message)) return;
				editor.commit({ form: removeStep(form, stepId) });
				editor.select({ step: null, field: null });
			}, { part: 'danger', disabled: steps.length <= 1 })
		)
	);
}

/* Saves some of a step's fields, with the rules that use only them, as one of the editor's own snippets. */
function saveSnippetDialog(editor, step) {
	const { form, rules } = editor;
	const title = h('input', { name: 'title', required: true, value: step.name });
	const description = h('input', { name: 'description' });
	const boxes = step.fields.map(id => h('input', { type: 'checkbox', name: 'field', value: id, checked: true, onchange: () => boxes[0].setCustomValidity('') }));
	const result = () => extractSnippet(form, rules, boxes.filter(box => box.checked).map(box => box.value), { title: title.value.trim(), description: description.value.trim() });
	const dialog = h('dialog', { part: 'type-picker', 'aria-label': 'Save as snippet' },
		h('form', {
			method: 'dialog',
			onsubmit: event => {
				if (!boxes.some(box => box.checked) && event.submitter?.value !== 'cancel') { event.preventDefault(); boxes[0].setCustomValidity('Pick at least one field'); boxes[0].reportValidity(); return; }
				const { snippet, skipped } = result();
				if (event.submitter?.value === 'download') download(`${snippet.snippet}.json`, snippet);
				else if (event.submitter?.value === 'save') {
					if (editor.ownSnippets.some(s => s.snippet === snippet.snippet) && !confirm(`Replace your snippet "${snippet.title}"?`)) { event.preventDefault(); return; }
					editor.saveSnippet(snippet);
				} else return;
				editor.notify(`Snippet "${snippet.title}" ${event.submitter.value === 'save' ? 'saved: find it under + Field' : 'downloaded'}.${skipped.length ? ` Left out rules that also use other fields: ${skipped.join(', ')}.` : ''}`);
			}
		},
		h('header', { part: 'row' }, h('h2', {}, 'Save as snippet'), h('button', { value: 'cancel', 'aria-label': 'Close', formnovalidate: true }, '×')),
		field('Title', title),
		field('Description', description, 'Shown in the + Field picker'),
		h('fieldset', {}, h('legend', {}, 'Fields'), step.fields.map((id, i) => h('label', {}, boxes[i], titleOf(editor, id)))),
		h('p', {}, h('small', {}, 'Rules that use only these fields come along, with the variables and services they need. Your snippets are kept in this browser; download one to share it as a file.')),
		h('div', { part: 'row' }, h('button', { value: 'save' }, 'Save'), h('button', { value: 'download' }, 'Download'))));
	dialog.addEventListener('close', () => dialog.remove());
	editor.append(dialog);
	dialog.showModal();
	title.select();
}

const NUMBER_TEXT = /^-?\d+(\.\d+)?$/;

function fieldInspector(editor, id) {
	const { form, rules } = editor;
	const property = form.fields.properties[id];
	const step = stepOfField(form, id);
	const update = fn => {
		const next = clone(form);
		fn(next.fields.properties[id], next);
		editor.commit({ form: next });
	};
	const setOrDelete = (object, key, value) => { if (value === '' || value === undefined || value === null || value === false) delete object[key]; else object[key] = value; };
	/* A change that may also add a named condition to the rule set. */
	const updateWith = (fn, nextRules) => {
		const next = clone(form);
		fn(next.fields.properties[id], next);
		editor.commit(nextRules ? { form: next, rules: nextRules } : { form: next });
	};
	const validation = property.validation ?? {};
	const choices = property.options?.choices ?? [];
	const numeric = choices.length > 0 && choices.every(choice => typeof choice.value === 'number');
	const index = step.fields.indexOf(id);
	const type = typeOfField(editor, property);
	const settings = new Set(type?.settings ?? FALLBACK_SETTINGS[property.type] ?? []);
	const content = property.type === 'content';
	const consent = property.ui?.widget === 'consent';
	const setIn = (key, name, value) => update(p => { p[key] = { ...(p[key] ?? {}) }; setOrDelete(p[key], name, value); if (!Object.keys(p[key]).length) delete p[key]; });
	const packageTitle = type && type.package !== 'core' ? editor.types.packages.find(entry => entry.package === type.package)?.title : null;

	const moveWithin = direction => {
		const next = clone(form);
		const s = stepsOf(next).find(x => x.id === step.id);
		s.fields = moveItem(s.fields, index, direction);
		editor.commit({ form: next });
	};

	return h('section', { part: 'inspector' },
		h('h2', {}, `Field: ${titleOf(editor, id)}`),
		h('div', { part: 'row type' },
			h('p', {}, h('span', { part: 'badge' }, type?.glyph ?? '?'), ' ', type ? type.title : `Unknown type (${property.kind ?? property.type})`, packageTitle ? h('small', {}, ` from ${packageTitle}`) : null),
			button('Change type', () => pickType(editor, { title: 'Change the field type', current: type?.kind, onpick: next => update((p, f) => { f.fields.properties[id] = changeType(p, next); }) }))),
		field(content ? 'Heading' : consent ? 'Name in lists' : 'Label', h('input', { value: property.title ?? '', onchange: e => update(p => setOrDelete(p, 'title', e.target.value)) }), content ? 'Optional' : consent ? 'The person sees the consent text below, not this' : null),
		field('Field id', h('input', {
			value: id,
			pattern: '[A-Za-z][A-Za-z0-9_]*',
			onchange: e => {
				const to = e.target.value.trim();
				const result = /^[A-Za-z][A-Za-z0-9_]*$/.test(to) ? renameField(form, rules, id, to) : { renamed: false };
				if (!result.renamed) { e.target.value = id; return; }
				editor.commit({ form: result.form, rules: result.rules });
				editor.select({ field: to });
			}
		}), 'The key in the submitted data; rules using it are updated'),
		settings.has('content') ? casesEditor(property) : null,
		settings.has('content') ? field(property.cases ? 'Text when no case matches' : 'Text', h('textarea', { part: 'prose', rows: property.cases ? 2 : 5, value: property.content ?? '', onchange: e => update(p => setOrDelete(p, 'content', e.target.value)) }), property.cases ? 'Optional' : 'A blank line starts a new paragraph') : null,
		settings.has('consent') ? consentEditor(property, setIn) : null,
		content ? null : field('Help text', h('input', { value: property.description ?? '', onchange: e => update(p => setOrDelete(p, 'description', e.target.value)) })),
		settings.has('placeholder') ? field('Placeholder', h('input', { value: property.ui?.placeholder ?? '', onchange: e => setIn('ui', 'placeholder', e.target.value) })) : null,
		content || property.ui?.widget === 'hidden' || settings.has('calculated') ? null : check(consent ? 'Must be ticked to send the form' : 'Required', property.required === true, value => update(p => setOrDelete(p, 'required', value))),
		check('Hidden until a rule shows it', property.ui?.hidden === true, value => update(p => {
			p.ui = { ...(p.ui ?? {}) };
			setOrDelete(p.ui, 'hidden', value);
		})),
		property.ui?.widget === 'hidden' ? null : whenPicker(editor, property.showWhen, {
			label: 'Show this field', always: true,
			apply: (value, nextRules) => updateWith(p => setOrDelete(p, 'showWhen', value), nextRules)
		}),
		settings.has('choices') && property.type === 'select' ? choicesEditor(property, numeric, update) : null,
		settings.has('default') ? field(property.ui?.widget === 'hidden' ? 'Value' : 'Starts with', h('input', {
			type: property.type === 'number' || property.type === 'integer' ? 'number' : 'text',
			value: property.default ?? '',
			onchange: e => update(p => setOrDelete(p, 'default', e.target.value === '' ? '' : (p.type === 'number' || p.type === 'integer' ? Number(e.target.value) : e.target.value)))
		}), property.ui?.widget === 'hidden' ? 'Used when the page gives none' : null) : null,
		settings.has('source') ? field('Take the value from', h('input', {
			value: property.from ?? '', placeholder: 'context.campaign', pattern: '(context|facts)\\..+',
			onchange: e => update(p => setOrDelete(p, 'from', e.target.value.trim()))
		}), 'context.<name> is set by the page that shows the form; facts.<name> by events') : null,
		settings.has('files') ? filesEditor(property.validation ?? {}, setIn) : null,
		settings.has('calculated') ? calculatedEditor(property) : null,
		settings.has('optionSource') ? field('Ask this service', select([['', '…'], ...Object.keys(rules.fields.services ?? {})], property.options?.source ?? '', value => update(p => { p.options = { ...(p.options ?? {}), source: value }; })),
			property.type === 'string' ? 'Called as the person types, with q set to the text' : 'It returns the list as [{ value, label }]; add services under Rules') : null,
		settings.has('items') ? itemsEditor(property) : null,
		settings.has('rows') ? h('div', { part: 'row' },
			field('Fewest rows', h('input', { type: 'number', min: 0, value: validation.minItems ?? '', onchange: e => setIn('validation', 'minItems', e.target.value === '' ? '' : Number(e.target.value)) })),
			field('Most rows', h('input', { type: 'number', min: 1, value: validation.maxItems ?? '', onchange: e => setIn('validation', 'maxItems', e.target.value === '' ? '' : Number(e.target.value)) })),
			field('Show as', select([['table', 'A table'], ['rows', 'Stacked rows']], property.ui?.widget === 'table' ? 'table' : 'rows', value => setIn('ui', 'widget', value === 'table' ? 'table' : ''))))
			: null,
		content ? null : field('Privacy', select([['none', 'Not personal'], ['personal', 'Personal'], ['special', 'Special (health, national id, …)']], property.privacy ?? 'none', value => update(p => {
			setOrDelete(p, 'privacy', value === 'none' ? '' : value);
			if (value !== 'none') delete p.track;
		})), 'Special data is never saved in a draft; personal and special data never go to analytics'),
		property.type === 'select' && !property.options?.multiple && (property.privacy ?? 'none') === 'none' ? check('Send the chosen option to analytics', property.track === true, value => update(p => setOrDelete(p, 'track', value))) : null,
		settings.has('range') ? h('div', { part: 'row' },
			field('Lowest', h('input', { type: 'number', value: validation.minimum ?? '', onchange: e => update(p => { p.validation = { ...(p.validation ?? {}) }; setOrDelete(p.validation, 'minimum', e.target.value === '' ? '' : Number(e.target.value)); }) })),
			field('Highest', h('input', { type: 'number', value: validation.maximum ?? '', onchange: e => update(p => { p.validation = { ...(p.validation ?? {}) }; setOrDelete(p.validation, 'maximum', e.target.value === '' ? '' : Number(e.target.value)); }) }))
		) : null,
		settings.has('pattern') && editor.advanced ? field('Pattern', h('input', { value: validation.pattern ?? '', onchange: e => update(p => { p.validation = { ...(p.validation ?? {}) }; setOrDelete(p.validation, 'pattern', e.target.value); }) }), 'A regular expression, for example ^[0-9]{4}$') : null,
		settings.has('length') ? h('div', { part: 'row' },
			field('Min. length', h('input', { type: 'number', min: 0, value: validation.minLength ?? '', onchange: e => setIn('validation', 'minLength', e.target.value === '' ? '' : Number(e.target.value)) })),
			field('Max. length', h('input', { type: 'number', min: 1, value: validation.maxLength ?? '', onchange: e => setIn('validation', 'maxLength', e.target.value === '' ? '' : Number(e.target.value)) }))
		) : null,
		settings.has('checks') ? checksEditor(editor, validation, update) : null,
		field('Step', select(stepsOf(form).map(s => [s.id, s.name]), step.id, value => {
			const next = clone(form);
			stepsOf(next).forEach(s => { s.fields = s.fields.filter(f => f !== id); });
			stepsOf(next).find(s => s.id === value).fields.push(id);
			editor.commit({ form: next });
			editor.select({ step: value });
		})),
		h('div', { part: 'row' },
			button('Move up', () => moveWithin(-1), { disabled: index <= 0 }),
			button('Move down', () => moveWithin(1), { disabled: index >= step.fields.length - 1 }),
			button('Delete field', () => {
				const used = rulesUsingField(rules, id);
				if (!confirm(`Delete "${property.title ?? id}"?` + (used.length ? `\nThese rules use it and will need fixing: ${used.join(', ')}` : ''))) return;
				editor.commit({ form: removeField(form, id) });
				editor.select({ field: null });
			}, { part: 'danger' })
		)
	);

	/* A text block with cases: "When <named condition> show: …". */
	function casesEditor(p) {
		const cases = p.cases ?? [];
		const setCase = (index, fn, nextRules) => updateWith(q => { fn(q.cases[index]); }, nextRules);
		return h('fieldset', { part: 'cases' },
			h('legend', {}, 'Texts that depend on the answers'),
			cases.length ? field('Show', select([['all', 'Every matching text'], ['first', 'Only the first matching text']], p.show ?? 'all', value => update(q => setOrDelete(q, 'show', value === 'first' ? 'first' : '')))) : h('p', {}, h('small', {}, 'Add a case to show a text only when a condition holds, for example "When Medium THC level show: Driving ban".')),
			h('ol', {}, cases.map((entry, index) => h('li', {},
				whenPicker(editor, entry.when, { label: 'When', apply: (value, nextRules) => setCase(index, item => { if (value === undefined) delete item.when; else item.when = value; }, nextRules) }),
				field('Show', h('textarea', { rows: 2, value: entry.content ?? '', onchange: e => setCase(index, item => { item.content = e.target.value; }) })),
				h('div', { part: 'row' },
					button('Move up', () => update(q => { q.cases = moveItem(q.cases, index, -1); }), { disabled: index === 0 }),
					button('Remove', () => update(q => { q.cases.splice(index, 1); if (!q.cases.length) { delete q.cases; delete q.show; } }), { part: 'danger', 'aria-label': `Remove case ${index + 1}` }))
			))),
			button('+ Case', () => update(q => { q.cases = [...(q.cases ?? []), { content: '' }]; })));
	}

	function consentEditor(p, set) {
		const notice = p.consent?.notice ?? {};
		const setNotice = (name, value) => update(q => {
			q.consent = { ...(q.consent ?? {}), notice: { ...(q.consent?.notice ?? {}) } };
			setOrDelete(q.consent.notice, name, value);
		});
		return h('fieldset', { part: 'consent' },
			h('legend', {}, 'Consent'),
			field('What the person agrees to', h('textarea', { part: 'prose', rows: 3, value: p.consent?.text ?? '', onchange: e => update(q => { q.consent = { ...(q.consent ?? {}), text: e.target.value }; }) }), 'Recorded word for word with the answer'),
			h('div', { part: 'row' },
				field('Link text', h('input', { value: notice.label ?? '', onchange: e => setNotice('label', e.target.value) })),
				field('Notice version', h('input', { value: notice.version ?? '', onchange: e => setNotice('version', e.target.value) }), 'Raise it when the notice changes')),
			field('Privacy notice address', h('input', { type: 'url', value: notice.url ?? '', onchange: e => setNotice('url', e.target.value) })));
	}

	/* A calculated value shows a variable from the rule set, formatted. */
	function calculatedEditor(p) {
		const variables = Object.entries(rules.fields.variables ?? {}).map(([name, v]) => [`vars.${name}`, v.title ?? name]);
		const format = p.ui?.format ?? {};
		const kind = format.style === 'currency' ? 'currency' : format.style === 'percent' ? 'percent' : format.minimumFractionDigits === 2 ? 'decimal' : '';
		const setFormat = (next, currency = format.currency ?? 'EUR') => update(q => {
			q.ui = { ...(q.ui ?? {}) };
			if (next === 'currency') q.ui.format = { style: 'currency', currency };
			else if (next === 'percent') q.ui.format = { style: 'percent' };
			else if (next === 'decimal') q.ui.format = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
			else delete q.ui.format;
		});
		return h('fieldset', { part: 'calculated' },
			h('legend', {}, 'Calculated value'),
			field('Shows', select([['', '…'], ...variables], p.from ?? '', value => update(q => setOrDelete(q, 'from', value))), variables.length ? 'The rules work it out; the server works it out again' : 'Add a variable under Rules first'),
			h('div', { part: 'row' },
				field('Format', select(FORMATS, kind, value => setFormat(value))),
				kind === 'currency' ? field('Currency', h('input', { value: format.currency ?? '', size: 4, maxLength: 3, onchange: e => setFormat('currency', e.target.value.trim().toUpperCase() || 'EUR') }), 'ISO code, for example DKK') : null));
	}

	/* The fields of one row in a repeating group. */
	function itemsEditor(p) {
		const items = Object.entries(p.items?.properties ?? {});
		const setItems = fn => update(q => {
			q.items = { ...(q.items ?? {}), properties: { ...(q.items?.properties ?? {}) } };
			fn(q.items.properties);
		});
		return h('fieldset', { part: 'choices' },
			h('legend', {}, 'Fields in each row'),
			h('ol', {}, items.map(([key, item]) => h('li', { part: 'row' },
				field('Label', h('input', { value: item.title ?? '', onchange: e => setItems(all => { all[key] = { ...all[key], title: e.target.value }; }) })),
				field('Type', select(ITEM_TYPES, item.type, type => setItems(all => {
					all[key] = { ...all[key], type };
					if (type === 'select' && !all[key].options?.choices) all[key].options = { choices: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }] };
					if (type !== 'select') delete all[key].options;
				}))),
				check('Required', item.required === true, on => setItems(all => { all[key] = { ...all[key] }; setOrDelete(all[key], 'required', on); })),
				item.type === 'select' ? field('Choices', h('input', {
					value: (item.options?.choices ?? []).map(choice => choice.label).join(', '),
					onchange: e => setItems(all => { all[key] = { ...all[key], options: { choices: e.target.value.split(',').map(text => text.trim()).filter(Boolean).map(label => ({ value: fieldId(label), label })) } }; })
				}), 'Comma-separated') : null,
				button('Remove', () => setItems(all => { delete all[key]; }), { 'aria-label': `Remove ${item.title ?? key}`, disabled: items.length <= 1 })))),
			button('+ Row field', () => setItems(all => {
				const key = fieldId(`Field ${items.length + 1}`, Object.keys(all));
				all[key] = { type: 'string', title: `Field ${items.length + 1}` };
			})));
	}

	function filesEditor(rules, set) {
		return h('fieldset', { part: 'files' },
			h('legend', {}, 'Files'),
			field('Allowed types', h('input', { value: rules.accept ?? '', placeholder: '.pdf,image/*', onchange: e => set('validation', 'accept', e.target.value.trim()) }), 'Empty allows any file'),
			h('div', { part: 'row' },
				field('Largest file (MB)', h('input', { type: 'number', min: 0.1, step: 0.1, value: rules.maxSize ? Math.round(rules.maxSize / MB * 10) / 10 : '', onchange: e => set('validation', 'maxSize', e.target.value === '' ? '' : Math.round(Number(e.target.value) * MB)) })),
				field('Number of files', h('input', { type: 'number', min: 1, value: rules.maxFiles ?? 1, onchange: e => set('validation', 'maxFiles', Number(e.target.value) || 1) }))),
			h('p', {}, h('small', {}, 'Files are only sent with the final submit and are never saved in a draft.')));
	}

	function choicesEditor(p, isNumeric, apply) {
		const parse = text => (isNumeric && NUMBER_TEXT.test(text) ? Number(text) : text);
		return h('fieldset', { part: 'choices' },
			h('legend', {}, 'Choices'),
			settings.has('multiple') ? check('Several can be chosen', p.options?.multiple === true, value => apply(q => { q.options = { ...q.options }; setOrDelete(q.options, 'multiple', value); })) : null,
			check('Values are numbers (rules can compare them)', isNumeric, value => apply(q => {
				q.options.choices = q.options.choices.map((choice, i) => ({ ...choice, value: value ? (NUMBER_TEXT.test(String(choice.value)) ? Number(choice.value) : i + 1) : String(choice.value) }));
			})),
			h('ol', {}, (p.options?.choices ?? []).map((choice, i) => h('li', { part: 'row' },
				field('Label', h('input', { value: choice.label, onchange: e => apply(q => { q.options.choices[i].label = e.target.value; }) })),
				field('Value', h('input', { value: String(choice.value), onchange: e => apply(q => { q.options.choices[i].value = parse(e.target.value); }) })),
				button('Remove', () => apply(q => { q.options.choices.splice(i, 1); }), { 'aria-label': `Remove ${choice.label}`, disabled: p.options.choices.length <= 1 }),
				Object.assign(field('Text shown when chosen', h('input', { value: choice.note ?? '', onchange: e => apply(q => setOrDelete(q.options.choices[i], 'note', e.target.value)) }), 'Optional; texts elsewhere can show it as {values.' + id + '.note}'), { part: 'note' })
			))),
			button('+ Choice', () => apply(q => {
				const n = q.options.choices.length + 1;
				q.options.choices.push({ value: isNumeric ? n : `option-${n}`, label: `Option ${n}` });
			}))
		);
	}
}

/* Field checks are host functions, picked by name (see readme § Functions). */
function checksEditor(editor, validation, update) {
	const names = Object.keys(editor.functions ?? {});
	const chosen = [].concat(validation.check ?? []);
	if (!names.length && !chosen.length) return null;
	return h('fieldset', { part: 'choices-inline' }, h('legend', {}, 'Checks'),
		[...new Set([...names, ...chosen])].map(name => check(name, chosen.includes(name), on => update(p => {
			p.validation = { ...(p.validation ?? {}) };
			const next = on ? [...chosen, name] : chosen.filter(item => item !== name);
			if (!next.length) delete p.validation.check;
			else p.validation.check = next.length === 1 ? next[0] : next;
		}))));
}

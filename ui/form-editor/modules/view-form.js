/**
 * The form designer: the steps-and-fields outline, and inspectors for the form, a step and a field.
 * Every view gets `editor`: { form, rules, selection, advanced, commit({ form?, rules? }), select({ … }) }.
 */
import { h, field, check, select, button } from './dom.js';
import { addField, addStep, clone, moveItem, removeField, removeStep, renameField, renameStep, rulesUsingField, stepOfField, stepsOf } from './model.js';

const TYPES = [['string', 'Text'], ['number', 'Number'], ['integer', 'Whole number'], ['boolean', 'Yes / no'], ['select', 'Choice']];
const WIDGETS = {
	string: [['', 'Text'], ['email', 'Email'], ['tel', 'Phone'], ['url', 'Web address'], ['date', 'Date'], ['time', 'Time'], ['textarea', 'Long text']],
	select: [['', 'Dropdown'], ['radio', 'Radio buttons']],
	boolean: [['toggle', 'Switch']]
};
const TYPE_BADGE = { string: 'Aa', number: '123', integer: '123', boolean: 'y/n', select: '☰' };

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
				button([h('span', { part: 'badge' }, TYPE_BADGE[form.fields.properties[id]?.type] ?? '?'), ' ', form.fields.properties[id]?.title ?? id],
					() => editor.select({ view: 'form', step: step.id, field: id }),
					{ part: 'outline-field', 'aria-current': selection.field === id ? 'true' : null })
			)),
			(step.slots ?? []).map(slot => h('li', { part: 'outline-slot' }, `slot: ${slot}`))),
			button('+ Field', () => {
				const result = addField(form, step.id, 'New field');
				editor.commit({ form: result.form });
				editor.select({ view: 'form', step: step.id, field: result.id });
			}, { part: 'add' })
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
		field('Slots for fields from services', h('input', {
			value: (step.slots ?? []).join(', '),
			onchange: e => update(s => {
				const slots = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
				if (slots.length) s.slots = slots; else delete s.slots;
			})
		}), 'Comma-separated, for example cover.extra'),
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
	const validation = property.validation ?? {};
	const choices = property.options?.choices ?? [];
	const numeric = choices.length > 0 && choices.every(choice => typeof choice.value === 'number');
	const widgets = WIDGETS[property.type];
	const index = step.fields.indexOf(id);

	const moveWithin = direction => {
		const next = clone(form);
		const s = stepsOf(next).find(x => x.id === step.id);
		s.fields = moveItem(s.fields, index, direction);
		editor.commit({ form: next });
	};

	return h('section', { part: 'inspector' },
		h('h2', {}, `Field: ${property.title ?? id}`),
		field('Label', h('input', { value: property.title ?? '', onchange: e => update(p => { p.title = e.target.value; }) })),
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
		field('Help text', h('input', { value: property.description ?? '', onchange: e => update(p => setOrDelete(p, 'description', e.target.value)) })),
		field('Type', select(TYPES, property.type, value => update(p => {
			p.type = value;
			if (value === 'select' && !p.options?.choices) p.options = { choices: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }] };
			if (value !== 'select') delete p.options;
			if (p.ui?.widget && !(WIDGETS[value] ?? []).some(([w]) => w === p.ui.widget)) delete p.ui.widget;
		}))),
		widgets ? field('Shown as', select(widgets, property.ui?.widget ?? '', value => update(p => {
			p.ui = { ...(p.ui ?? {}) };
			setOrDelete(p.ui, 'widget', value);
		}))) : null,
		check('Required', property.required === true, value => update(p => setOrDelete(p, 'required', value))),
		check('Hidden until a rule shows it', property.ui?.hidden === true, value => update(p => {
			p.ui = { ...(p.ui ?? {}) };
			setOrDelete(p.ui, 'hidden', value);
		})),
		property.type === 'select' ? choicesEditor(property, numeric, update) : null,
		property.type === 'number' || property.type === 'integer' ? h('div', { part: 'row' },
			field('Lowest', h('input', { type: 'number', value: validation.minimum ?? '', onchange: e => update(p => { p.validation = { ...(p.validation ?? {}) }; setOrDelete(p.validation, 'minimum', e.target.value === '' ? '' : Number(e.target.value)); }) })),
			field('Highest', h('input', { type: 'number', value: validation.maximum ?? '', onchange: e => update(p => { p.validation = { ...(p.validation ?? {}) }; setOrDelete(p.validation, 'maximum', e.target.value === '' ? '' : Number(e.target.value)); }) }))
		) : null,
		property.type === 'string' && editor.advanced ? field('Pattern', h('input', { value: validation.pattern ?? '', onchange: e => update(p => { p.validation = { ...(p.validation ?? {}) }; setOrDelete(p.validation, 'pattern', e.target.value); }) }), 'A regular expression, for example ^[0-9]{4}$') : null,
		property.type === 'string' ? field('Min. length', h('input', { type: 'number', min: 0, value: validation.minLength ?? '', onchange: e => update(p => { p.validation = { ...(p.validation ?? {}) }; setOrDelete(p.validation, 'minLength', e.target.value === '' ? '' : Number(e.target.value)); }) })) : null,
		checksEditor(editor, validation, update),
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

	function choicesEditor(p, isNumeric, apply) {
		const parse = text => (isNumeric && NUMBER_TEXT.test(text) ? Number(text) : text);
		return h('fieldset', { part: 'choices' },
			h('legend', {}, 'Choices'),
			check('Several can be chosen', p.options?.multiple === true, value => apply(q => { q.options = { ...q.options }; setOrDelete(q.options, 'multiple', value); })),
			check('Values are numbers (rules can compare them)', isNumeric, value => apply(q => {
				q.options.choices = q.options.choices.map((choice, i) => ({ ...choice, value: value ? (NUMBER_TEXT.test(String(choice.value)) ? Number(choice.value) : i + 1) : String(choice.value) }));
			})),
			h('ol', {}, (p.options?.choices ?? []).map((choice, i) => h('li', { part: 'row' },
				field('Label', h('input', { value: choice.label, onchange: e => apply(q => { q.options.choices[i].label = e.target.value; }) })),
				field('Value', h('input', { value: String(choice.value), onchange: e => apply(q => { q.options.choices[i].value = parse(e.target.value); }) })),
				button('Remove', () => apply(q => { q.options.choices.splice(i, 1); }), { 'aria-label': `Remove ${choice.label}`, disabled: p.options.choices.length <= 1 })
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

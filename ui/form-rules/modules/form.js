/**
 * Reads form definitions and rule sets, whether given plain or as UCF content
 * (`{ id, model, meta, fields: { … } }`), into one normalized shape.
 */

export function unwrap(doc) {
	if (doc && typeof doc === 'object' && typeof doc.model === 'string' && doc.fields && typeof doc.fields === 'object') {
		return { ...doc.fields, id: doc.fields.id ?? doc.id };
	}
	return doc ?? {};
}

const choiceValues = property => {
	const choices = property?.options?.choices;
	return Array.isArray(choices) ? choices.map(choice => (choice && typeof choice === 'object' ? choice.value : choice)) : null;
};

/* A step is a `structure.layout` entry of type "step". */
export function normalizeForm(definition) {
	const form = unwrap(definition);
	const properties = form.properties ?? {};
	const requiredList = new Set(Array.isArray(form.required) ? form.required : []);
	const layout = Array.isArray(form.structure?.layout) ? form.structure.layout : [];
	const steps = [];
	const fields = new Map();
	const slots = new Map();

	layout.filter(entry => entry?.type === 'step').forEach((entry, index) => {
		const id = entry.id ?? `step-${index + 1}`;
		const step = {
			id,
			name: entry.name ?? id,
			hidden: entry.hidden === true,
			source: 'form',
			fields: [...(entry.fields ?? [])],
			slots: [...(entry.slots ?? [])]
		};
		steps.push(step);
		step.slots.forEach(slot => slots.set(slot, id));
		step.fields.forEach(fieldId => {
			const property = properties[fieldId];
			fields.set(fieldId, {
				id: fieldId,
				step: id,
				source: 'form',
				property,
				choices: choiceValues(property),
				hidden: property?.ui?.hidden === true,
				required: property?.required === true || requiredList.has(fieldId)
			});
		});
	});

	return { id: form.id, title: form.title, steps, fields, slots, properties };
}

export function normalizeRuleSet(ruleSet) {
	const rules = unwrap(ruleSet);
	return {
		...rules,
		context: rules.context ?? {},
		services: rules.services ?? {},
		listen: rules.listen ?? [],
		rules: rules.rules ?? [],
		patches: rules.patches ?? []
	};
}

const patchField = (patch, fieldId, stepId, slot) => {
	const property = patch.fields[fieldId];
	return {
		id: fieldId,
		step: stepId,
		source: patch.id,
		...(slot ? { slot } : {}),
		property,
		choices: choiceValues(property),
		hidden: property?.ui?.hidden === true,
		required: property?.required === true
	};
};

/* Adds mounted patches to a copy of the normalized form: fields at the slots they name, steps after their anchor. */
export function withPatchFields(form, patches) {
	if (!patches.length) return form;
	const fields = new Map(form.fields);
	const steps = form.steps.map(step => ({ ...step, fields: [...step.fields] }));
	for (const patch of patches) {
		for (const [slot, fieldIds] of Object.entries(patch.place ?? {})) {
			const stepId = form.slots.get(slot);
			const step = steps.find(s => s.id === stepId);
			if (!step) continue;
			for (const fieldId of fieldIds) {
				if (!patch.fields?.[fieldId]) continue;
				step.fields.push(fieldId);
				fields.set(fieldId, patchField(patch, fieldId, stepId, slot));
			}
		}
		for (const inserted of patch.steps ?? []) {
			let at = steps.findIndex(step => step.id === inserted.after);
			if (at < 0) continue;
			/* After the anchor and any steps already inserted after it. */
			while (steps[at + 1]?.after === inserted.after) at++;
			const ids = (inserted.fields ?? []).filter(fieldId => patch.fields?.[fieldId]);
			steps.splice(at + 1, 0, { id: inserted.id, name: inserted.name ?? inserted.id, hidden: false, source: patch.id, after: inserted.after, fields: ids, slots: [] });
			ids.forEach(fieldId => fields.set(fieldId, patchField(patch, fieldId, inserted.id)));
		}
	}
	return { ...form, steps, fields };
}

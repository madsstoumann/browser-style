/**
 * merge(form, ruleSet, patch, { owner, service?, into? }) → { ruleSet, errors }
 *
 * Mounts a patch (extra fields and rules returned by a service, or carried by an
 * event) into a rule set. A patch can only add: its fields land in the slot the
 * fetching rule named and its steps after the step it named, its ids are namespaced by service, its rules sit below a
 * priority ceiling, and they may only narrow fields of the base form.
 * On any error the rule set is returned unchanged.
 */

import { isRule } from './logic.js';
import { actionName, actionTargets, ACTIONS, gotoOf, NARROWING, renameTargets, VARIABLE_ACTIONS } from './actions.js';
import { normalizeForm, normalizeRuleSet } from './form.js';

export const PATCH_PRIORITY_CEILING = -1;
export const MAX_PATCH_DEPTH = 2;

/* Rewrites `values.<local>` to `values.<ns>.<local>` for the patch's own fields. */
function renameReads(logic, localFields, ns) {
	if (Array.isArray(logic)) return logic.map(item => renameReads(item, localFields, ns));
	if (!isRule(logic)) return logic;
	const [op] = Object.keys(logic);
	const args = logic[op];
	if (op === 'var') {
		const rename = path => {
			if (typeof path !== 'string' || !path.startsWith('values.')) return path;
			const rest = path.slice(7);
			const local = [...localFields].find(field => rest === field || rest.startsWith(`${field}.`));
			return local ? `values.${ns}.${rest}` : path;
		};
		return { var: Array.isArray(args) ? [rename(args[0]), ...args.slice(1)] : rename(args) };
	}
	return { [op]: renameReads(args, localFields, ns) };
}

export function merge(formDefinition, ruleSetDocument, patch, { owner = null, service, into, after } = {}) {
	const form = normalizeForm(formDefinition);
	const ruleSet = normalizeRuleSet(ruleSetDocument);
	const errors = [];
	const fail = (code, message, path = '') => errors.push({ code, message, path });

	if (!patch || typeof patch !== 'object') {
		fail('patch-shape', 'A patch must be an object');
		return { ruleSet: ruleSetDocument, errors };
	}

	/* The owner is the rule whose fetch asked for this patch (a base rule or a mounted patch rule).
	   An event-carried patch names its namespace and slot itself, and may have no owner: it then stays mounted. */
	const ownerRule = owner == null ? null : ruleSet.rules.find(rule => rule.id === owner)
		?? ruleSet.patches.flatMap(p => p.rules ?? []).find(rule => rule.id === owner);
	if (owner != null && !ownerRule) {
		fail('owner', `Unknown owner rule "${owner}"`, 'owner');
		return { ruleSet: ruleSetDocument, errors };
	}
	const fetch = service && into
		? { service, into, after }
		: ownerRule && [...(ownerRule.then ?? []), ...(ownerRule.else ?? [])].map(action => action.fetch).find(Boolean);
	if (!fetch) {
		fail('owner', `Rule "${owner}" has no fetch action, so it cannot own a patch`, 'owner');
		return { ruleSet: ruleSetDocument, errors };
	}
	const ns = fetch.service;
	const depth = (ownerRule?.depth ?? 0) + 1;
	if (depth > MAX_PATCH_DEPTH) fail('depth', `Patches may nest ${MAX_PATCH_DEPTH} deep`, 'owner');

	if (typeof patch.patch !== 'string' || !patch.patch) fail('patch-shape', 'A patch needs a "patch" id', 'patch');
	if (patch.for?.form && form.id && patch.for.form !== form.id) fail('target', `Patch is for form "${patch.for.form}", not "${form.id}"`, 'for.form');
	if (patch.for?.rules && ruleSet.id && patch.for.rules !== ruleSet.id) fail('target', `Patch is for rule set "${patch.for.rules}", not "${ruleSet.id}"`, 'for.rules');
	if (typeof patch.for?.minVersion === 'number' && (ruleSet.version ?? 0) < patch.for.minVersion) {
		fail('version', `Patch needs rule set version ${patch.for.minVersion} or later`, 'for.minVersion');
	}

	const localFields = new Set(Object.keys(patch.fields ?? {}));
	const qualify = id => (localFields.has(id) ? `${ns}.${id}` : id);
	const fields = {};
	localFields.forEach(id => { fields[`${ns}.${id}`] = patch.fields[id]; });

	const place = {};
	for (const [slot, ids] of Object.entries(patch.place ?? {})) {
		if (slot !== fetch.into) fail('slot', `Patch may only place fields in "${fetch.into}", not "${slot}"`, `place.${slot}`);
		if (!form.slots.has(slot)) fail('slot', `The form has no slot "${slot}"`, `place.${slot}`);
		for (const id of ids ?? []) {
			if (!localFields.has(id)) fail('field', `Placed field "${id}" is not defined in the patch`, `place.${slot}`);
		}
		place[slot] = (ids ?? []).map(qualify);
	}

	const baseSteps = new Set(form.steps.map(step => step.id));
	const localSteps = new Set();
	const placedFields = new Set(Object.values(place).flat());
	const steps = (patch.steps ?? []).map((step, index) => {
		const path = `steps[${index}]`;
		if (!fetch.after) fail('step', `Rule "${owner}" fetches without "after", so its reply may not insert steps`, path);
		else if (!baseSteps.has(fetch.after)) fail('step', `The form has no step "${fetch.after}"`, path);
		if (typeof step?.id !== 'string' || !step.id) fail('step', 'An inserted step needs an id', path);
		else if (localSteps.has(step.id)) fail('duplicate', `Step id "${step.id}" is used twice`, path);
		localSteps.add(step?.id);
		(step?.fields ?? []).forEach(id => {
			if (!localFields.has(id)) fail('field', `Step field "${id}" is not defined in the patch`, path);
			else if (placedFields.has(`${ns}.${id}`)) fail('duplicate', `Field "${id}" is placed twice`, path);
			placedFields.add(`${ns}.${id}`);
		});
		return { id: `${ns}.${step?.id}`, name: step?.name ?? step?.id, after: fetch.after, fields: (step?.fields ?? []).map(qualify) };
	});
	const qualifyStep = id => (localSteps.has(id) ? `${ns}.${id}` : id);
	const rules = (patch.rules ?? []).map((rule, index) => {
		const path = `rules[${index}]`;
		if (!rule?.id) fail('rule-id', 'Every patch rule needs an id', path);
		const check = (action, at) => {
			const name = actionName(action);
			if (!ACTIONS.includes(name)) {
				fail('action', `Unknown action "${name}"`, at);
				return;
			}
			if (VARIABLE_ACTIONS.includes(name)) {
				fail('widen', `A patch rule may not change variables ("${name}")`, at);
				return;
			}
			const targets = actionTargets(action);
			const targetFields = targets.fields;
			const stepTargets = name === 'goto' ? [gotoOf(action).step, gotoOf(action).from].filter(Boolean) : targets.steps;
			const touchesBase = targetFields.some(id => !localFields.has(id)) || stepTargets.some(id => !localSteps.has(id));
			if (touchesBase && !NARROWING.has(name)) {
				fail('widen', `A patch rule may only narrow the base form; "${name}" on a base field or step is not allowed`, at);
			}
			targetFields.filter(id => !localFields.has(id) && !form.fields.has(id)).forEach(id => fail('field', `Unknown field "${id}"`, at));
			stepTargets.filter(id => !baseSteps.has(id) && !localSteps.has(id)).forEach(id => fail('step', `Unknown step "${id}"`, at));
		};
		(rule.then ?? []).forEach((action, i) => check(action, `${path}.then[${i}]`));
		(rule.else ?? []).forEach((action, i) => check(action, `${path}.else[${i}]`));

		const rename = action => renameTargets(action, qualify, qualifyStep);
		return {
			...rule,
			id: `${ns}/${rule.id}`,
			priority: Math.min(rule.priority ?? 0, ruleSet.patchPriorityCeiling ?? PATCH_PRIORITY_CEILING),
			depth,
			when: renameReads(rule.when ?? true, localFields, ns),
			then: (rule.then ?? []).map(rename),
			...(rule.else ? { else: rule.else.map(rename) } : {})
		};
	});

	if (errors.length) return { ruleSet: ruleSetDocument, errors };

	const mounted = { id: `${ns}/${patch.patch}`, service: ns, owner, fields, place, ...(steps.length ? { steps } : {}), ...(patch.data !== undefined ? { data: patch.data } : {}), rules, expires: patch.expires ?? null };
	const patches = [...ruleSet.patches.filter(p => !(p.owner === owner && p.service === ns)), mounted];
	return { ruleSet: { ...ruleSet, patches }, errors };
}

/* Removes patches whose `expires` is before `now` (an ISO string the host passes in, keeping merge pure). */
export function expirePatches(ruleSetDocument, now) {
	const ruleSet = normalizeRuleSet(ruleSetDocument);
	return { ...ruleSet, patches: ruleSet.patches.filter(patch => !patch.expires || patch.expires > now) };
}

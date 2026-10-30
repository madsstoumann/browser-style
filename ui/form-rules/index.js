/**
 * @browser.style/form-rules
 * A pure, JSON-defined rule engine for multi-step forms.
 * The same module runs in the browser and in Node.
 */

export { evaluate, accepts, calculatedFrom, hasNoValue, hasValueType } from './modules/evaluate.js';
export { fillText, placeholdersOf, textData, PLACEHOLDER_ROOTS } from './modules/text.js';
export { conditionOf, implicitRules, matchingCases, noteOf } from './modules/show.js';
export { validate } from './modules/validate.js';
export { merge, expirePatches, patchFieldKind, MAX_PATCH_DEPTH, PATCH_PRIORITY_CEILING, PATCH_FIELD_KINDS } from './modules/merge.js';
export { handleEvent } from './modules/events.js';
export { apply, getPath, OPERATORS } from './modules/logic.js';
export { ACTIONS, ROW_ACTIONS, rowTarget } from './modules/actions.js';
export { normalizeForm, normalizeRuleSet, presentOf, unwrap, PANEL_PLACES, PRESENT_MODES } from './modules/form.js';
export { defineTypes, loadTypes, loadPackages, typeOf, fieldFromType, changeType, searchTypes, groupTypes } from './modules/types.js';
export { trustedContext, serverContextKeys, CONTEXT_SOURCES } from './modules/context.js';
export { consentRecords } from './modules/consent.js';
export { safeUrl } from './modules/urls.js';
export { createSession, snapshot, keep, complete, discard, expire, resume, formInfo, privacyOf, isFinal, isExpired, SESSION_STATUS, PRIVACY } from './modules/session.js';

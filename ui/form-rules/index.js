/**
 * @browser.style/form-rules
 * A pure, JSON-defined rule engine for multi-step forms.
 * The same module runs in the browser and in Node.
 */

export { evaluate, accepts, hasNoValue, hasValueType } from './modules/evaluate.js';
export { validate } from './modules/validate.js';
export { merge, expirePatches, MAX_PATCH_DEPTH, PATCH_PRIORITY_CEILING } from './modules/merge.js';
export { handleEvent } from './modules/events.js';
export { apply, getPath, OPERATORS } from './modules/logic.js';
export { ACTIONS } from './modules/actions.js';
export { normalizeForm, normalizeRuleSet, unwrap } from './modules/form.js';
export { defineTypes, loadTypes, loadPackages, typeOf, fieldFromType, changeType, searchTypes, groupTypes } from './modules/types.js';
export { trustedContext, serverContextKeys, CONTEXT_SOURCES } from './modules/context.js';
export { consentRecords } from './modules/consent.js';
export { createSession, snapshot, keep, complete, discard, expire, resume, formInfo, privacyOf, isFinal, isExpired, SESSION_STATUS, PRIVACY } from './modules/session.js';

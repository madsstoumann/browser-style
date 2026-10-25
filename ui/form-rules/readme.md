# Form Rules

A pure, JSON-defined rule engine for multi-step forms. Forms, rule sets and the answers are all JSON, and can be stored as UCF content and synced through UCM. Same input, same output, in the browser and in Node.

> The whole system (JSON formats, operators and actions, custom functions, sessions, tracking, embedding, what is deferred) is explained in the [forms guide](../../docs/forms.md).

```bash
npm install @browser.style/form-rules
```

```js
import { evaluate, validate, merge, handleEvent } from '@browser.style/form-rules';

const { valid, errors } = validate(form, rules, { functions });
const state = evaluate(form, rules, { values, context, facts, previous, today: '2026-10-24', functions });
```

`evaluate()` does no I/O. It returns:

| Key | Holds |
| --- | --- |
| `steps`, `path` | Every step with `visible`, and the ids of the visible ones in order |
| `jumps` | The gotos taken: `{ from, to, rules }` |
| `vars` | The rule set's variables after this evaluation |
| `fields` | Per field: `visible`, `enabled`, `required`, `options` (narrowed choices), `step`, `source` |
| `values` | What would be submitted: visible, enabled fields only, `setValue` applied, unavailable options removed |
| `matched` | Ids of the rules that matched |
| `effects` | `fetch` and `emit` requests for the host to carry out, and `track` edges (`rule.enter` / `rule.leave`) of rules marked `"track": true` |
| `issues` | `{ field, code, message?, level? }`: `required`, `option-unavailable`, the field's own constraints (`minimum`, `pattern`, …), its checks, and `invalid` rules. `level: "warning"` does not block |
| `explain` | Which rules decided each flag, e.g. `"plan.options": ["senior-north"]`; a rule's `else` branch shows as `"senior-north:else"` |

Pass the previous state's `matched` as `previous` so `emit` and `track` fire once per change, not on every evaluation.

**Analytics.** `"track": true` on a rule reports when it starts and stops matching; on a `select` field it marks the chosen option as safe to send to analytics. `validate()` refuses `track` on any other field type, so typed values never reach a tracker. The events themselves are built by form-flow (`ui/form-flow/readme.md` § Tracking).

## The three documents

| Document | Schema | Example |
| --- | --- | --- |
| Form definition: UCM-shaped properties, steps as `structure.layout` entries of type `step`, `slots` for remote fields | `schemas/form-definition.schema.json` | `examples/insurance.form.json` |
| Rule set: `variables`, `services`, `listen`, `rules` | `schemas/form-rules.schema.json` | `examples/insurance.rules.json`, `examples/loan.rules.json` (advanced) |
| Patch: extra fields, steps, rules and data from a service or event | `schemas/form-patch.schema.json` | `examples/offers.patch.json`, `examples/api/*.json` |

Both the form and the rule set may be plain objects or UCF content (`{ id, model, meta, fields }`).

## Rules

```json
{
  "id": "senior-north",
  "priority": 10,
  "when": { "and": [
    { ">=": [{ "var": "values.ageGroup" }, 30] },
    { ">": [{ "num": { "var": "values.zip" } }, 2000] }
  ] },
  "then": [
    { "options": { "field": "plan", "only": ["plus", "senior"] } },
    { "fetch": { "service": "offers", "into": "cover.extra" } },
    { "emit": { "type": "quote.segment", "data": { "segment": "senior-north" } } }
  ],
  "else": [{ "options": { "field": "plan", "only": ["basic", "plus"] } }]
}
```

Conditions are a strict subset of [JSON Logic](https://jsonlogic.com): no `==` / `!=`, no type coercion, `num` for explicit number conversion, missing values read as `null`. Conditions can read `values.*`, `context.*`, `facts.*` and `step`.

Actions: `show`, `hide`, `enable`, `disable`, `require`, `optional`, `setValue`, `clear`, `options` (`only` / `exclude`), `skip`, `include`, `goto`, `set` / `add` (variables), `invalid`, `fetch`, `emit`.

- **`goto`** jumps forward: `{ "goto": "review" }`. Leaving the step it jumps from, the steps in between are passed over, like `skip`, so their values are not submitted. It jumps from the step of the last field the rule reads, or from `{ "goto": { "step": "review", "from": "where" } }`. Only forward jumps are valid; Back follows the path. When several gotos leave the same step, the higher priority wins, then the nearest target. A target that is hidden is ignored with a `goto-target` issue.
- **`fetch`** names what the reply may add: `"into": "<slot>"` for fields, `"after": "<step>"` for whole steps (the patch's `steps`). A service with `"method": "GET"` gets the values as query parameters, so a static JSON file works as a test API (`examples/api/health.json`).

- **Declarative.** State is computed from scratch each time; when a condition stops matching, its effect goes away.
- **Conflicts.** Higher `priority` wins; on a tie the restrictive value wins (hide, disable, required). Option lists intersect.
- **Hidden values are absent.** A hidden field or skipped step reads as `null` in conditions and is not submitted.

## Field types

Field types are data: `types/core.json` is the core package (text, choices, email, phone, consent, text block, hidden value, file upload, …), and country or domain packages such as `ui/form-types/dk` add their own, with their checks. `defineTypes`, `loadTypes`, `loadPackages`, `typeOf`, `fieldFromType`, `changeType`, `searchTypes` and `groupTypes` read them; all are pure. Schema: `schemas/form-types.schema.json`. The [forms guide](../../docs/forms.md#field-types-and-packages) explains the format.

Property types beyond the plain inputs: `content` (a text block, never submitted), `file` (value `[{ name, size, type }]`, checked against `accept`, `maxSize`, `maxFiles`, never saved in a draft), a `boolean` with `ui.widget: "consent"` (`consentRecords(form, values)` gives what each ticked box said), and any field may prefill `from` `context.*` / `facts.*` or its `default`. A required boolean must be `true`.

## Variables

A rule set may declare `variables`, which conditions read as `vars.<name>`:

```json
"variables": {
  "age":   { "type": "number", "compute": { "yearsBetween": [{ "cprDate": { "var": "values.cpr" } }, { "var": "today" }] } },
  "score": { "type": "number", "initial": 50 }
}
```

A **computed** variable is an expression over the values (and earlier variables). Any other variable starts at `initial`; matching rules `set` it (priority wins) and then `add` to it. Every evaluation starts again from `initial`, so the same answers always give the same score: nothing counts twice. `validate()` refuses a rule that feeds its own input (reads `vars.score` and adds to it), undeclared names and writes to computed variables. `explain["vars.score"]` lists the rules that changed it. Example: `examples/loan.rules.json`.

## Validation

- **Field constraints** in the form definition (`minimum`, `maximum`, `minLength`, `maxLength`, `pattern`) are checked by the engine too, not only by the browser, with `validation.messages` overriding the default text per code.
- **Rules across fields**: `{ "invalid": { "field": "amount", "message": "…", "code": "income", "level": "warning"? } }` in any rule. The condition can read any field, variable or service answer.
- **Functions** are the plug-in point. The engine has no domain checks built in: the host passes `functions` (`{ name: fn }`) to `evaluate()` and `validate()`, and the JSON uses them by name: as an operator (`{ "cprDate": [{ "var": "values.cpr" }] }`), as a field check (`"validation": { "check": "dk-cpr" }`: return `null` to pass or `{ code, message, level? }`), or in a condition (`{ "check": ["dk-cpr", { "var": "values.cpr" }] }`). `validate()` reports names no function provides. The Danish checks are in `ui/form-types/dk/functions.js`, IBAN and Luhn in `ui/form-types/banking/functions.js`.
- **Dates** are ISO strings and "today" is an input (`{ "var": "today" }`), never a clock: `yearsBetween`, `daysBetween` and `round` are built in.
- **Backend checks**: a patch may carry `data`, which conditions read as `services.<service>.…` while it is mounted, so a service can approve, refuse or cap (`examples/api/eligibility.json`). `{ "fetch": { "service": "eligibility", "wait": true } }` marks the request as one the user must wait for; `into` and `after` are optional when the reply is only data.

## Patches and events

`merge(form, rules, patch, { owner })` mounts a service reply. Fields are namespaced (`offers.travelCover`) and may only land in the slot the fetch named, and its `steps` only after the step the fetch named (ids `health.health`); patch rules sit below the base rules' priority and may only narrow base fields. A patch stays active only while its owner rule matches.

`handleEvent(form, rules, store, event)` applies an incoming event the rule set `listen`s for: `set` writes `facts`, `replace` swaps in a newer rule set version, `patch` mounts an always-active patch. Duplicate and out-of-order events are ignored.

## Sessions

A session is one person's saved progress through one form version (`schemas/form-session.schema.json`). It is user data with an expiry, not content, so it does not belong in the CMS. The helpers are pure; `<form-flow>`'s `session.js` stores them.

| Function | Does |
| --- | --- |
| `createSession({ id, definition, ruleSet, owner, now })` | A new draft pinned to the form and rule set versions; anonymous drafts expire after 30 days, a user's 90 days after the last save |
| `snapshot(session, { definition, ruleSet, state, step, facts, now })` | The draft after a save: `state.values` (visible fields only) without fields marked `privacy: "special"`, plus step, facts and matched rules |
| `keep(session, { storage, now })` | Records that the person chose to keep the draft on the `device` or the `server` |
| `complete`, `discard`, `expire` | Final states. They drop the answers; `complete` is idempotent |
| `resume(session, { definition, ruleSet, now })` | What `setup()` needs to continue, against the current versions: `{ ok, values, facts, step, previous, migrated, changes }`, or `{ ok: false, reason }` |

Fields declare `privacy`: `none` (default for form fields), `personal` (default for patch fields) or `special` (never saved). A form's `version` (top level or `meta.version`) is recorded in the session; raising `resetDrafts` makes saved drafts start over.

## Tests

```bash
npm test
```

`fixtures/*.json` are conformance cases (form + rules + input → expected state). Any other runtime of the engine should pass the same files.

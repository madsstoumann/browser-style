# Form Rules

A pure, JSON-defined rule engine for multi-step forms. Forms, rule sets and the answers are all JSON, and can be stored as UCF content and synced through UCM. Same input, same output, in the browser and in Node.

```bash
npm install @browser.style/form-rules
```

```js
import { evaluate, validate, merge, handleEvent } from '@browser.style/form-rules';

const { valid, errors } = validate(form, rules);
const state = evaluate(form, rules, { values, context, facts, previous });
```

`evaluate()` does no I/O. It returns:

| Key | Holds |
| --- | --- |
| `steps`, `path` | Every step with `visible`, and the ids of the visible ones in order |
| `jumps` | The gotos taken: `{ from, to, rules }` |
| `fields` | Per field: `visible`, `enabled`, `required`, `options` (narrowed choices), `step`, `source` |
| `values` | What would be submitted: visible, enabled fields only, `setValue` applied, unavailable options removed |
| `matched` | Ids of the rules that matched |
| `effects` | `fetch` and `emit` requests for the host to carry out |
| `issues` | `required` and `option-unavailable` problems |
| `explain` | Which rules decided each flag, e.g. `"plan.options": ["senior-north"]`; a rule's `else` branch shows as `"senior-north:else"` |

Pass the previous state's `matched` as `previous` so `emit` fires once per change, not on every evaluation.

## The three documents

| Document | Schema | Example |
| --- | --- | --- |
| Form definition: UCM-shaped properties, steps as `structure.layout` entries of type `step`, `slots` for remote fields | `schemas/form-definition.schema.json` | `examples/insurance.form.json` |
| Rule set: `services`, `listen`, `rules` | `schemas/form-rules.schema.json` | `examples/insurance.rules.json` |
| Patch: extra fields and rules from a service or event | `schemas/form-patch.schema.json` | `examples/offers.patch.json` |

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

Actions: `show`, `hide`, `enable`, `disable`, `require`, `optional`, `setValue`, `clear`, `options` (`only` / `exclude`), `skip`, `include`, `goto`, `fetch`, `emit`.

- **`goto`** jumps forward: `{ "goto": "review" }`. Leaving the step it jumps from, the steps in between are passed over, like `skip`, so their values are not submitted. It jumps from the step of the last field the rule reads, or from `{ "goto": { "step": "review", "from": "where" } }`. Only forward jumps are valid; Back follows the path. When several gotos leave the same step, the higher priority wins, then the nearest target. A target that is hidden is ignored with a `goto-target` issue.
- **`fetch`** names what the reply may add: `"into": "<slot>"` for fields, `"after": "<step>"` for whole steps (the patch's `steps`). A service with `"method": "GET"` gets the values as query parameters, so a static JSON file works as a test API (`examples/api/health.json`).

- **Declarative.** State is computed from scratch each time; when a condition stops matching, its effect goes away.
- **Conflicts.** Higher `priority` wins; on a tie the restrictive value wins (hide, disable, required). Option lists intersect.
- **Hidden values are absent.** A hidden field or skipped step reads as `null` in conditions and is not submitted.

## Patches and events

`merge(form, rules, patch, { owner })` mounts a service reply. Fields are namespaced (`offers.travelCover`) and may only land in the slot the fetch named, and its `steps` only after the step the fetch named (ids `health.health`); patch rules sit below the base rules' priority and may only narrow base fields. A patch stays active only while its owner rule matches.

`handleEvent(form, rules, store, event)` applies an incoming event the rule set `listen`s for: `set` writes `facts`, `replace` swaps in a newer rule set version, `patch` mounts an always-active patch. Duplicate and out-of-order events are ignored.

## Tests

```bash
npm test
```

`fixtures/*.json` are conformance cases (form + rules + input → expected state). Any other runtime of the engine should pass the same files.

# Schema-driven forms — a guide

> **Guide, not reference.** This walks through the whole forms system: what each package does, the JSON documents, the rule vocabulary, extending it with your own functions, sessions, tracking, embedding, and what is not built yet. The package readmes ([form-rules](../ui/form-rules/readme.md), [form-flow](../ui/form-flow/readme.md), [form-editor](../ui/form-editor/readme.md), [form-embed](../ui/form-embed/readme.md)) hold the API tables; the JSON Schemas in `ui/form-rules/schemas/` are the source of truth for the formats.

The short version:

- **Everything is JSON.** A form, its rules, the replies of services and a saved draft are four JSON documents with a schema each. Forms and rule sets are UCF content (models `form-definition` and `form-rules`), so they can live in the CMS and sync through UCM.
- **One pure engine.** `evaluate()` takes the documents and the answers and returns the state of the form. It does no I/O and reads no clock, so the same input gives the same output in the browser, in Node, and in any other runtime that passes the conformance fixtures.
- **Native fields.** `<form-flow>` renders plain `<input>`, `<select>` and `<textarea>` in light DOM, styled by `ui/base` form.css, and uses the browser's own constraint validation.
- **Closed vocabularies.** Conditions use a strict subset of JSON Logic; rules choose from a fixed list of actions. Anything domain-specific (CPR numbers, IBAN, …) is a host function you plug in, never part of the engine.
- **Field types are data.** What an editor offers when adding a field comes from installed type packages (JSON): a generic core package, plus country or domain packages such as Denmark (CPR, CVR) or Banking (IBAN), each bringing its own checks. Nothing country-specific is in core.

---

## The cast

| Package | Element | Role |
|---|---|---|
| [`@browser.style/form-rules`](../ui/form-rules/) | none | The engine: `evaluate`, `validate`, `merge`, `handleEvent`, session helpers, schemas, conformance fixtures |
| [`@browser.style/form-flow`](../ui/form-flow/) | `<form-flow>` | Renders a form step by step, runs the engine on every input, carries out its effects (fetch, emit, track), saves and resumes sessions |
| [`@browser.style/form-editor`](../ui/form-editor/) | `<form-editor>` | Visual editor for developers and content editors; its output is the form JSON and the rule JSON |
| [`@browser.style/form-embed`](../ui/form-embed/) | `<form-embed>` | Puts a published form on a client site with one script tag, in Shadow DOM or light DOM |
| [`@browser.style/form-types-dk`](../ui/form-types/dk/), [`-banking`](../ui/form-types/banking/) | none | Optional field type packages: Danish CPR and CVR, IBAN; each with its checks. See [Field types](#field-types-and-packages) |

Demos:

| Page | Shows |
|---|---|
| [/ui/form-flow/](https://v4.browser.style/ui/form-flow/) | The insurance example: options narrowed by age and zip, a service patch, a goto |
| [/ui/form-flow/loan.html](https://v4.browser.style/ui/form-flow/loan.html) | The advanced loan example: variables and a score, CPR checks, an eligibility service, inserted steps, tracking |
| [/ui/form-flow/session.html](https://v4.browser.style/ui/form-flow/session.html) | Save and continue later, resume links, the done state |
| [/ui/form-flow/contact.html](https://v4.browser.style/ui/form-flow/contact.html) | The core field types: text blocks, a hidden value, a file upload, consent |
| [/ui/form-editor/](https://v4.browser.style/ui/form-editor/) | The editor; `?example=loan` opens the loan example, `?example=contact` the field types example |
| [/ui/form-embed/](https://v4.browser.style/ui/form-embed/) | A "client site" embedding forms in shadow and light mode |

How they fit together:

```
 form-editor ──writes──▶ form.json + rules.json ──publish──▶ forms/{id}/{version}.json
                               │                                   │
                               ▼                                   ▼
                          <form-flow> ◀───────── wraps ──────── <form-embed>
                               │
              evaluate() on every input (form-rules)
                               │
             effects ──▶ fetch (services) · emit (ff:emit) · track (ff:track)
```

---

## Quick start

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/ui/step/ui-step.css">
<link rel="stylesheet" href="/ui/form-flow/index.css">

<form-flow form="insurance.form.json" rules="insurance.rules.json" explain></form-flow>

<script type="module" src="/ui/form-flow/index.js"></script>
<script type="module">
  const flow = document.querySelector('form-flow');
  flow.addEventListener('ff:submit', event => console.log(event.detail.values));
</script>
```

`explain` adds a "Why" list showing which rule decided what; leave it off in production. Without a renderer, in Node or a test:

```js
import { evaluate, validate } from '@browser.style/form-rules';

const { valid, errors } = validate(form, rules);
const state = evaluate(form, rules, { values: { ageGroup: 30, zip: '2100' }, today: '2026-10-24' });
state.path;            // ['you', 'where', 'cover', 'review']
state.fields.plan;     // { visible: true, required: true, options: ['plus', 'senior'], … }
state.values;          // what would be submitted
```

---

## The four documents

| Document | Schema | Stored as | Example |
|---|---|---|---|
| Form definition | `form-definition.schema.json` | UCF content of model `form-definition` | `examples/insurance.form.json`, `examples/loan.form.json` |
| Rule set | `form-rules.schema.json` | UCF content of model `form-rules` | `examples/insurance.rules.json`, `examples/loan.rules.json` |
| Patch | `form-patch.schema.json` | A service reply or an event's data, never stored | `examples/offers.patch.json`, `examples/api/*.json` |
| Session | `form-session.schema.json` | User data in a draft store, with an expiry; **not** CMS content | Created by `createSession()` |

The form and the rule set may each be a UCF wrapper (`{ id, model, meta, fields }`) or the plain object that would sit in `fields`. Paths below are relative to `ui/form-rules/`.

### Form definition

UCM-shaped: `properties` are the fields, `structure.layout` is the list of steps.

```json
{
  "id": "form-insurance",
  "model": "form-definition",
  "meta": { "locale": "en", "status": "published" },
  "fields": {
    "title": "Insurance quote",
    "version": 3,
    "structure": { "layout": [
      { "type": "step", "id": "you",   "name": "About you",  "fields": ["ageGroup", "email"] },
      { "type": "step", "id": "cover", "name": "Your cover", "fields": ["plan"], "slots": ["cover.extra"] },
      { "type": "step", "id": "health", "name": "Health", "fields": ["conditions"], "hidden": true }
    ] },
    "type": "object",
    "properties": {
      "ageGroup": { "type": "select", "title": "Age group", "required": true, "track": true,
        "options": { "choices": [{ "value": 18, "label": "18–29" }, { "value": 30, "label": "30–49" }] } },
      "email": { "type": "string", "title": "Email", "ui": { "widget": "email" }, "privacy": "personal" },
      "plan":  { "type": "select", "title": "Plan", "ui": { "widget": "radio" }, "options": { "choices": [ … ] } }
    }
  }
}
```

**Form level**

| Key | |
|---|---|
| `id`, `title` | |
| `version` | Raise it on every publish. Sessions record it, and a draft from an older version is migrated on resume |
| `resetDrafts` | Raise it when old answers no longer make sense: saved drafts then start over |
| `structure.layout[]` | The steps, in order |
| `properties` | The fields, by id |

**Step**

| Key | |
|---|---|
| `type` | Always `"step"` |
| `id` | Lowercase, `a-z0-9-` |
| `name` | The step's heading |
| `fields` | Field ids, in order |
| `hidden` | Left out of the path unless a rule `include`s it |
| `slots` | Named places where fields from a service reply may land (`"cover.extra"`) |

**Field (property)**

| Key | |
|---|---|
| `type` | `string`, `number`, `integer`, `boolean`, `select`; `content` (a text block, no value); `file` (uploads) |
| `kind` | The field type it was made from (`email`, `consent`, `dk/cpr`, …), see [Field types](#field-types-and-packages). Optional and only for editors: the engine goes by `type` |
| `title`, `description` | Label and help text (a text block's optional heading) |
| `required` | Starting value of the flag; rules may change it. A required `boolean` must be `true`, like a required checkbox |
| `default` | Starting value, used while the field has no answer |
| `from` | Prefill from `context.<name>` or `facts.<name>` while the field has no answer (before `default`) |
| `content` | Text block: the text; a blank line starts a paragraph |
| `consent` | Consent fields: `{ text, notice: { label, url, version } }`, recorded with the answer |
| `validation` | `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`; for files `accept`, `maxSize` (bytes), `maxFiles`; `check` (name or names of host functions); `messages` (text per issue code, replacing the default) |
| `options` | `choices: [{ value, label }]` for `select`; `multiple: true` for checkboxes |
| `ui.widget` | `email`, `tel`, `url`, `date`, `time`, `textarea`, `hidden` for strings; `radio` for a select; `consent` for a boolean |
| `ui.placeholder` | Placeholder text |
| `ui.hidden` | Hidden unless a rule shows it |
| `track` | `select` only: the chosen option may be sent to analytics. See [Tracking](#tracking-and-privacy) |
| `privacy` | `none`, `personal` or `special`. See [Privacy](#privacy-settings) |

Values are typed by the definition: a choice with value `30` comes back as the number `30`.

### Rule set

```json
{
  "id": "insurance",
  "model": "form-rules",
  "fields": {
    "form": "form-insurance",
    "version": 3,
    "variables": { "score": { "type": "number", "initial": 50 } },
    "services": {
      "offers": { "url": "https://api.example.com/offers", "method": "POST", "send": ["ageGroup", "zip"], "timeoutMs": 4000 }
    },
    "listen": [
      { "type": "pricing.updated", "set": "facts.pricing" }
    ],
    "rules": [ … ]
  }
}
```

| Key | |
|---|---|
| `form` | Id of the form definition the rules belong to |
| `version` | Raise on every publish; an incoming `replace` event only applies a higher version |
| `variables` | Named values the rules compute or write, read as `vars.<name>`. See [Variables](#variables) |
| `services` | Named endpoints: `url`, `method` (`POST` default, or `GET`), `send` (the field ids sent), `timeoutMs` (default 5000 in form-flow) |
| `listen` | The incoming events the rule set accepts. See [Events](#events-both-ways) |
| `rules` | The rules |
| `patchPriorityCeiling` | Highest priority a mounted patch rule may have (default `-1`) |

**Rule**

```json
{
  "id": "senior-north",
  "title": "Seniors north of Copenhagen",
  "priority": 10,
  "track": true,
  "when": { "and": [
    { ">=": [{ "var": "values.ageGroup" }, 30] },
    { ">":  [{ "num": { "var": "values.zip" } }, 2000] }
  ] },
  "then": [
    { "options": { "field": "plan", "only": ["plus", "senior"] } },
    { "fetch": { "service": "offers", "into": "cover.extra" } }
  ],
  "else": [{ "options": { "field": "plan", "only": ["basic", "plus"] } }]
}
```

| Key | |
|---|---|
| `id` | Unique, `a-z0-9-` |
| `title` | Shown in the editor |
| `priority` | Higher wins in a conflict (default `0`) |
| `when` | A condition. See [Operators](#operators) |
| `then` | Actions while the condition is true |
| `else` | Actions while it is false |
| `track` | Report `rule.enter` / `rule.leave` to analytics |

### Patch

What a service returns, or what an event carries: fields, steps, rules and data to add to the running form.

```json
{
  "patch": "senior-north",
  "for": { "form": "form-insurance", "rules": "insurance", "minVersion": 3 },
  "fields": { "travelCover": { "type": "boolean", "title": "Add travel cover" } },
  "place": { "cover.extra": ["travelCover"] },
  "steps": [{ "id": "health", "name": "Health", "fields": ["conditions"] }],
  "data": { "approved": true, "maxAmount": 250000 },
  "rules": [{ "id": "travel-needs-plus", "when": { "===": [{ "var": "values.travelCover" }, true] },
              "then": [{ "options": { "field": "plan", "exclude": ["basic"] } }] }],
  "expires": "2026-10-24T08:00:00Z"
}
```

| Key | |
|---|---|
| `patch` | The patch's id |
| `for` | Which form and rule set it fits, and the lowest rule set version |
| `fields` | New fields, same format as form properties |
| `place` | Slot id → field ids. Only the slot named by the fetch (`into`) is accepted |
| `steps` | New steps, inserted after the step the fetch named (`after`) |
| `data` | Any JSON, read in conditions as `services.<service>.…` |
| `rules` | Extra rules, in the normal rule format |
| `expires` | When the patch stops applying (`expirePatches(ruleSet, now)`) |

The guarantees `merge()` enforces:

- **Namespaced.** Patch fields and steps get the service as prefix: `travelCover` from `offers` becomes `offers.travelCover`, read as `values.offers.travelCover`. The patch's own rules are rewritten to match.
- **Only where allowed.** Fields only in the slot the fetch named, steps only after the step it named.
- **Only narrowing.** Patch rules sit below `patchPriorityCeiling`, and on base fields they may only `hide`, `disable`, `require`, narrow `options`, `skip`, `goto`, `invalid`, `emit` and `fetch`. They can never show a hidden base field or loosen a requirement.
- **Bounded.** A patch may fetch another patch, two levels deep at most (`MAX_PATCH_DEPTH`).
- **Owned.** A patch is active only while the rule that fetched it matches. If the user changes an answer so the rule stops matching, the patch's fields disappear with it.
- **All or nothing.** On any error the rule set is returned unchanged with `errors`.

### Session

One person's progress through one form version. The engine creates and reads it; `<form-flow>`'s `session.js` stores it.

```json
{
  "id": "q7h2…",
  "form":  { "id": "form-loan", "version": 4, "resetDrafts": 0 },
  "rules": { "id": "loan", "version": 7 },
  "status": "draft",
  "rev": 12,
  "owner": { "kind": "anonymous" },
  "storage": "device",
  "lifetime": { "ttlDays": 30 },
  "consent": { "device": true, "at": "2026-10-24T09:00:00Z" },
  "step": "economy",
  "values": { "purpose": "car", "amount": 120000 },
  "facts": {},
  "matched": ["car-loan"],
  "created": "2026-10-24T08:55:00Z",
  "updated": "2026-10-24T09:00:00Z",
  "expires": "2026-11-23T08:55:00Z",
  "submitted": null,
  "receipt": null
}
```

| Key | |
|---|---|
| `id` | Random; also the idempotency key of the submit |
| `status` | `draft`, `submitted`, `expired`, `discarded`. Only a draft can change; the final states hold no answers |
| `rev` | Raised on every save; an older `rev` is a conflict |
| `owner` | `{ kind: "anonymous" }` or `{ kind: "user", sub }`, where `sub` is the login subject, never a name or an email |
| `storage` | `tab` (sessionStorage), `device` (localStorage, after the person chose it), `server` |
| `lifetime` | `ttlDays` (anonymous, from creation) or `idleDays` (signed in, from the last save) |
| `consent` | When the person chose to keep the draft beyond the open tab |
| `values` | Visible fields only, never fields with `privacy: "special"` |
| `receipt` | Set by the submit, e.g. `{ reference: "AB-1234" }` |

---

## How evaluation works

`evaluate(form, rules, input)` takes:

| Input | |
|---|---|
| `values` | The answers, typed |
| `context` | What the host knows: channel, campaign, logged-in user's segment, … (read as `context.*`) |
| `facts` | What incoming events have written (read as `facts.*`) |
| `previous` | The last state's `{ matched }`, so `emit` and `track` fire once per change |
| `today` | An ISO date. The engine never reads a clock |
| `functions` | The host's functions, `{ name: fn }` |

and returns `steps`, `path`, `jumps`, `vars`, `fields`, `values`, `matched`, `effects`, `issues` and `explain` (see the [form-rules readme](../ui/form-rules/readme.md) for the table).

Four rules of thumb explain almost every result:

1. **Declarative.** State is computed from scratch every time. When a condition stops matching, its effect goes away; nothing needs undoing.
2. **Hidden is absent.** A hidden field, or a field on a skipped step, reads as `null` in conditions and is not submitted. Its value stays in memory, so it comes back if the field is shown again.
3. **Conflicts.** The higher `priority` wins. On a tie, the restrictive value wins: hidden over shown, disabled over enabled, required over optional. Option lists from several rules intersect.
4. **Fixed point.** Because hiding a field can change which rules match, evaluation repeats until nothing changes (16 passes at most, then it throws). `validate()` catches most loops before they run.

---

## Operators

Conditions, variable formulas and computed values are a strict subset of [JSON Logic](https://jsonlogic.com): an object with one key, the operator, and its arguments. Everything else is a literal.

| Operator | Example | Notes |
|---|---|---|
| `var` | `{ "var": "values.zip" }`, `{ "var": ["values.zip", "0000"] }` | Reads a path; optional fallback. Missing reads as `null` |
| `===`, `!==` | `{ "===": [{ "var": "values.plan" }, "plus"] }` | Strict; arrays and objects compare by content |
| `>`, `>=`, `<`, `<=` | `{ "<=": [18, { "var": "vars.age" }, 65] }` | Numbers with numbers, strings with strings; anything else is false. Three arguments test a range |
| `and`, `or`, `!`, `!!` | | Empty arrays are false |
| `if` | `{ "if": [cond, a, cond2, b, c] }` | |
| `in` | `{ "in": ["glass", { "var": "values.addOns" }] }` | Item in array, or substring in string |
| `missing` | `{ "missing": ["values.email"] }` | The paths that are `null` or empty |
| `num` | `{ "num": { "var": "values.zip" } }` | Explicit conversion: a numeric string to a number, anything else `null` |
| `+`, `-`, `*`, `/`, `%` | | Numbers only, else `null`; division by zero is `null` |
| `min`, `max`, `round` | `{ "round": [{ "/": [a, b] }, 2] }` | `round` takes decimal places |
| `cat` | `{ "cat": ["DK-", { "var": "values.zip" }] }` | Joins as text |
| `yearsBetween`, `daysBetween` | `{ "yearsBetween": [{ "var": "values.birth" }, { "var": "today" }] }` | ISO dates |
| `check` | `{ "check": ["dk-cpr", { "var": "values.cpr" }] }` | True when the host check passes (warnings pass) |
| *any host function* | `{ "cprDate": [{ "var": "values.cpr" }] }` | See [Custom functions](#custom-functions) |

What is deliberately **not** there: `==` and `!=` (coercion makes runtimes disagree), and any operator that reads a clock or does I/O. An unknown operator throws, and `validate()` reports it before anything runs.

**What a condition can read**

| Path | |
|---|---|
| `values.<field>` | Answers. Patch fields: `values.<service>.<field>` |
| `vars.<name>` | Rule set variables |
| `context.<key>` | From the host |
| `facts.<key>` | From incoming events |
| `services.<service>.<key>` | A mounted patch's `data` |
| `step` | The current step id |
| `today` | The date passed in |

---

## Actions

An action is an object with one key. The list is closed: `validate()` refuses anything else.

| Action | Example | Does |
|---|---|---|
| `show`, `hide` | `{ "hide": ["email", "phone"] }` | Field visibility |
| `enable`, `disable` | `{ "disable": "plan" }` | Disabled fields are shown but not submitted |
| `require`, `optional` | `{ "require": "email" }` | |
| `setValue` | `{ "setValue": { "field": "plan", "value": "basic" } }` | Sets the submitted value |
| `clear` | `{ "clear": "addOns" }` | Submits it as empty |
| `options` | `{ "options": { "field": "plan", "only": ["plus"] } }`, `{ … "exclude": ["basic"] }` | Narrows the choices; an answer outside them gets an `option-unavailable` issue |
| `skip`, `include` | `{ "include": "health" }` | Takes a step out of, or into, the path |
| `goto` | `{ "goto": "review" }`, `{ "goto": { "step": "review", "from": "where" } }` | Jumps forward; the steps in between are passed over like `skip` |
| `set`, `add` | `{ "add": { "var": "score", "value": 10 } }` | Writes a variable; `value` may be an expression |
| `invalid` | `{ "invalid": { "field": "amount", "message": "Too high for your income", "code": "income", "level": "warning" } }` | A message on a field. `error` (default) blocks Next; `warning` does not |
| `fetch` | `{ "fetch": { "service": "offers", "into": "cover.extra" } }`, `{ … "after": "you" }`, `{ … "wait": true }` | Asks the host to call a service and merge the reply. `into` allows fields in a slot, `after` allows whole steps, `wait` holds Next until the reply is in |
| `emit` | `{ "emit": { "type": "quote.segment", "data": { … }, "on": "enter", "where": "any" } }` | Sends an event out when the rule starts (`enter`) or stops (`leave`) matching. `where: "server"` marks events only a server should send |

**`goto` in detail.** It jumps from the step of the last field the rule reads, or from `from`. Only forward jumps are valid; Back follows the path the user took. When several gotos leave the same step, the higher priority wins, then the nearest target. A hidden target is ignored with a `goto-target` issue.

**Inserting steps.** `fetch` with `after` lets a service reply add whole steps (the patch's `steps`), placed after that step and namespaced (`health.health`). A static JSON file works as a test API with `"method": "GET"`: see `examples/api/health.json` and the loan demo.

---

## Variables

```json
"variables": {
  "age":   { "type": "number", "compute": { "yearsBetween": [{ "cprDate": { "var": "values.cpr" } }, { "var": "today" }] } },
  "score": { "type": "number", "initial": 50 }
}
```

- A **computed** variable is a formula over values and earlier variables. Rules cannot write it.
- Any other variable starts at `initial`. Matching rules `set` it (the highest priority wins), and then every matching rule's `add` is summed.
- Every evaluation starts again from `initial`, so the same answers always give the same score; nothing counts twice when the user goes back and forth.
- `validate()` refuses a rule that reads the variable it adds to, undeclared names and writes to computed variables.
- `explain["vars.score"]` lists the rules that changed it.

---

## Validation

Validation happens at three levels, and the engine runs all of them, so a server running the same engine gets the same issues:

1. **Field constraints** in the definition: `required`, `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`. form-flow also sets them on the native control.
2. **Rules across fields**: an `invalid` action in any rule. Its condition can read any value, variable or service answer.
3. **Host checks**: `validation.check` on a field, or `check` in a condition.

Each issue is `{ field, code, message?, level? }`. `validation.messages` replaces the default text per code, so content editors can word the messages without touching rules.

`validate(form, rules, { functions })` is the static check of the documents themselves: unknown operators, actions, fields, steps, slots, services and functions; duplicate ids; backwards gotos; variable cycles; `track` on a non-choice field. The editor blocks export while it reports problems.

---

## Custom functions

The engine has no domain knowledge. Anything like "is this a valid Danish CPR number" or "what birth date does it encode" is a **host function**: plain JavaScript the host passes in, which the JSON refers to by name.

```js
// my-functions.js
export const functions = {
  // An operator: returns a value. Called with the evaluated arguments.
  cprDate: value => /* ISO date or null */,

  // A check: returns null to pass, or { code, message, level? } to fail.
  'dk-cpr': value => /^\d{6}-?\d{4}$/.test(value ?? '')
    ? null
    : { code: 'dk-cpr', message: 'A CPR number has 10 digits' }
};
export default functions;
```

Use them in three places in the JSON:

```json
"properties": {
  "cpr": { "type": "string", "title": "CPR number", "privacy": "special",
           "validation": { "check": "dk-cpr", "messages": { "dk-cpr": "Please check your CPR number" } } }
},
"variables": {
  "age": { "type": "number", "compute": { "yearsBetween": [{ "cprDate": { "var": "values.cpr" } }, { "var": "today" }] } }
},
"rules": [
  { "id": "valid-cpr", "when": { "check": ["dk-cpr", { "var": "values.cpr" }] }, "then": [{ "fetch": { "service": "eligibility", "wait": true } }] }
]
```

And pass them in wherever the engine runs:

```js
import { functions } from './my-functions.js';

evaluate(form, rules, { values, today, functions });
validate(form, rules, { functions });   // reports names nothing provides
flow.functions = functions;             // <form-flow>
editor.functions = functions;           // <form-editor>, or <form-editor functions="my-functions.js">
```

Rules for writing one:

- **Pure.** Same input, same output. No `fetch`, no `Date.now()`, no randomness: pass dates in through `today`. A function that needs a backend belongs in a service instead.
- **Total.** Accept `null`, empty strings and wrong types without throwing; return `null` for "no answer".
- **Named, not imported by URL.** The JSON holds only the name. For embedded forms the names come from a reviewed registry (`ui/form-embed/functions/registry.json`), never from a URL in the form.
- **Warnings for doubt.** Return `level: "warning"` when the value is probably wrong but may be right (some CPR numbers issued since 2007 fail modulus 11).
- **Every runtime needs them.** If forms are evaluated on a server later, the same functions must exist there under the same names.

Functions usually come with a [field type package](#field-types-and-packages): `ui/form-types/dk/functions.js` has the CPR and CVR checks and `cprDate`, `ui/form-types/banking/functions.js` IBAN and Luhn.

---

## Field types and packages

A **field type** is what an editor offers when someone adds a field: "Email", "Consent", "CPR number". It is data, not code: a title, a group, a short glyph, search keywords, and a **template**, the property a new field starts from. The engine never sees types; it only reads the properties they produce, so installing a package changes what the editor offers, not how forms are evaluated.

Types come in packages, one JSON file each (schema `ui/form-rules/schemas/form-types.schema.json`):

```json
{
  "package": "dk",
  "title": "Denmark",
  "version": "0.1.0",
  "functions": "./functions.js",
  "types": [
    { "kind": "dk/cpr", "title": "CPR number", "description": "Danish personal identification number",
      "group": "Contact", "glyph": "CPR", "privacy": "special", "keywords": ["national id", "personnummer"],
      "template": { "type": "string", "privacy": "special", "validation": { "check": "dk-cpr" } },
      "settings": ["placeholder", "checks"] }
  ]
}
```

| Package | Where | Types |
|---|---|---|
| Core | `ui/form-rules/types/core.json` | Text, Long text, Number, Whole number, Date, Time, Dropdown, Radio buttons, Checkboxes, Yes / no, Email, Phone, Web address, Consent, Text block, Hidden value, File upload |
| Denmark | `ui/form-types/dk/` (`@browser.style/form-types-dk`) | CPR number (`dk/cpr`), CVR number (`dk/cvr`); checks `dk-cpr`, `dk-cvr`, operator `cprDate` |
| Banking | `ui/form-types/banking/` (`@browser.style/form-types-banking`) | IBAN (`banking/iban`); checks `iban`, `luhn` |

A Swedish personnummer, a UK National Insurance number or a company's customer number is a new package of the same shape; nothing in core or the editor changes. Kinds outside core start with the package name (`se/personnummer`), so two packages never collide.

- **`settings`** lists what the editor's field panel shows besides label, id, help, required, hidden, privacy and step: `choices`, `multiple`, `range`, `length`, `pattern`, `checks`, `placeholder`, `default`, `content`, `consent`, `files`, `source`.
- **`privacy`** is the level a new field starts with (a CPR number is `special`, an email `personal`).
- **`functions`** points at the module with the package's checks, relative to the JSON file.

The helpers are pure and exported by form-rules, so an editor in another host (the Umbraco backoffice) can bundle them:

| Function | Does |
|---|---|
| `defineTypes(...packages)` | Merges package documents into a registry `{ packages, types, kinds, errors }` |
| `loadTypes(urls, { fetch?, base? })` | Fetches package files, then `defineTypes` |
| `loadPackages(urls, …)` | `loadTypes`, and imports each package's `functions`: `{ …registry, functions }` |
| `typeOf(property, registry)` | A field's type: its `kind`, or for older fields the type whose template fits best (`type`, `ui.widget`, checks) |
| `fieldFromType(type, { title })` | A new property from a type's template |
| `changeType(property, type)` | Switches a field's type, keeping label, help, required and hidden |
| `searchTypes(registry, query)`, `groupTypes(registry, types)` | What the editor's searchable picker shows |

`validate(form, rules, { functions, types })` reports a field whose `kind` no installed package provides.

### The core types that are more than an input

| Type | Property | Behaviour |
|---|---|---|
| **Text block** | `{ "type": "content", "title": "…", "content": "…" }` | No value and never submitted. Rules can show and hide it like a field |
| **Hidden value** | `{ "type": "string", "ui": { "widget": "hidden" }, "from": "context.campaign", "default": "direct" }` | Not shown; submitted like any answer. Takes the value from the page's context (or facts), else the default |
| **Consent** | `{ "type": "boolean", "ui": { "widget": "consent" }, "required": true, "consent": { "text": "…", "notice": { "label": "Privacy notice", "url": "…", "version": "2026-10" } } }` | A checkbox with the wording as its label. Required means it must be ticked. On submit, `consentRecords(form, values)` gives `{ field, text, notice, form }` for each ticked box; `ff:submit` carries them as `consents`, with the time |
| **File upload** | `{ "type": "file", "validation": { "accept": ".pdf,image/*", "maxSize": 5242880, "maxFiles": 2 } }` | The engine sees `[{ name, size, type }]` and checks `accept`, `maxSize` and `maxFiles`. The files themselves stay in the browser and travel only with the final submit, as `ff:submit`'s `files`; a draft never holds them |

---

## Services and patches

A service is a URL the browser calls when a rule says `fetch`. form-flow sends the fields listed in `send`, as a JSON body (`POST`) or as query parameters (`GET`), with a timeout. The reply is a patch, merged as described above.

```json
"services": { "eligibility": { "url": "/api/eligibility.json", "method": "GET", "send": ["amount", "income"] } }
```

```json
{ "fetch": { "service": "eligibility", "wait": true } }
```

A reply carrying only `data` is a backend check: conditions read it as `services.eligibility.approved`, and `wait` keeps the user on the step until it is in (`aria-busy` on the button). See `examples/api/eligibility.json` and the loan demo.

Set `flow.fetcher = async (effect, service) => patch` to route requests through a proxy or return mocks; returning `undefined` falls back to the built-in request. The editor's preview uses sample replies (`samples` attribute) instead of calling services.

**For now, browsers call services directly.** A service must be public, accept CORS from the sites the form runs on, and need no secret key. See [Deferred](#not-built-yet).

---

## Events both ways

**Out.** `emit` actions become `ff:emit` events on `<form-flow>` (`{ type, data, rule, where }`) when a rule starts or stops matching, never on every keystroke. The host forwards them wherever it likes.

**In.** A rule set lists the events it accepts in `listen`. Call `flow.receive(event)` (or `handleEvent(form, rules, store, event)` without a renderer) with a CloudEvents-shaped object `{ id, source, type, sequence?, data }`:

| Listener | Does |
|---|---|
| `{ "type": "pricing.updated", "set": "facts.pricing" }` | Writes `data` under `facts`, which conditions read |
| `{ "type": "rules.published", "replace": "rules" }` | Swaps in a newer version of the same rule set |
| `{ "type": "campaign.started", "patch": { "namespace": "campaign", "into": "cover.extra" } }` | Mounts `data` as an always-active patch |

Events of other types are ignored, as are duplicates (same `id`) and out-of-order events (lower `sequence` from the same `source`).

`<form-flow>` dispatches, all bubbling from the element: `ff:change`, `ff:step`, `ff:emit`, `ff:submit`, `ff:error`, `ff:track`, and with sessions `ff:resumed`, `ff:resume-failed`, `ff:saved`, `ff:link`, `ff:discarded`, `ff:done`. Detail shapes are in the [form-flow readme](../ui/form-flow/readme.md).

---

## Saving and resuming

`ui/form-flow/session.js` saves a partly filled form and makes a sent form final. The pure parts (`createSession`, `snapshot`, `keep`, `resume`, `complete`, `discard`, `expire`) are in form-rules, so a backend can use the same logic.

```js
import FlowSession, { MockServer } from '/ui/form-flow/session.js';

const session = new FlowSession(flow, {
  owner: { kind: 'anonymous' },
  server: new MockServer(),                       // a mock draft store until there is a backend
  send: async detail => ({ reference: 'AB-1234' })  // the real submission
});
await session.start();
```

| Who | Kept in | For |
|---|---|---|
| Anonymous, by default | `sessionStorage` (this tab) | Until the tab closes |
| Anonymous, after **Save on this device** | `localStorage` | 30 days from the start |
| Anonymous, after **Email me a link** | The server, opened by a one-time link | 30 days from the start |
| Signed in | The server, one open draft per form | 90 days after the last change |

- Only visible fields are saved. Values of fields the rules hid are dropped.
- On resume, the draft is checked against the **current** form and rules: removed fields and options no longer allowed come back as `changes` in `ff:resumed`. Raise `resetDrafts` on the form to make old drafts start over instead.
- After submit, every copy becomes a tombstone with no answers, other open tabs of the same draft lock (`BroadcastChannel`), and a page restored with Back checks again. A repeated submit returns the same receipt.
- `session.discard()` deletes every copy; `session.forgetHere()` removes the copies in this browser (call it on logout).

The server contract `MockServer` stands in for: reject saves after submit with `409`, return the same receipt for a repeated submit (the session id is the idempotency key), reject an older `rev`, store resume tokens hashed and accept them once.

---

## Privacy settings

Every field has a `privacy` level, set in the form definition or with the Privacy picker in the editor. A new field starts with its type's level:

| Level | Meaning | Saved in a draft |
|---|---|---|
| `none` | Not personal: plan, product, purpose | Always (default for form fields) |
| `personal` | Identifies a person: name, email, phone, address | Only after the person chose to keep the draft (device or server); default for fields from a patch |
| `special` | Special category or national id: health, CPR | **Never.** It is filled in again on resume |

File uploads are never saved in a draft either, whatever their level.

Other privacy decisions built into the system:

- **Hidden values are not submitted.** They stay in memory only while the page is open.
- **Anonymous drafts stay in the tab** unless the person asks to keep them, and the device option warns about shared computers.
- **Owners are subjects.** A session records a login subject, never a name or an email.
- **Tracking sends ids, not answers** (next section).
- **Personal-data forms on client sites** are meant for iframe mode, so the client page cannot read the fields (not built yet).

---

## Tracking and privacy

form-flow describes the funnel as `ff:track` events and hands each to `flow.tracker`. Nothing is tracked until the host sets a tracker.

```js
import { beacon, dataLayer, combine } from '/ui/form-flow/trackers/index.js';

const tracker = combine(beacon('/api/form-events', { consent: false }), dataLayer());
flow.tracker = tracker;
consentBanner.onAccept = () => tracker.grant();   // sends what was buffered
consentBanner.onReject = () => tracker.revoke();  // drops it
```

Events: `form.view`, `form.start`, `step.view`, `step.leave`, `step.blocked`, `field.error`, `field.revisit`, `rule.enter` / `rule.leave`, `service.request` / `service.reply` / `service.error`, `form.submit`, `form.abandon`, `form.resume`. All share one flat envelope `{ type, form, rules, version, session, seq, at, step, index, path, data }`. The full table is in the [form-flow readme](../ui/form-flow/readme.md#tracking).

The settings an author controls:

| Setting | Where | Effect |
|---|---|---|
| `"track": true` on a `select` field | Form definition (editor: *may go to analytics*) | Its chosen option is sent as `choices` on `form.submit` and `form.abandon`. `validate()` refuses it on any other type, so typed text never reaches a tracker. Never mark a field whose options are personal |
| `"track": true` on a rule | Rule set (editor: *Track this rule*) | Sends `rule.enter` / `rule.leave` with the rule id |
| `track-context` attribute | `<form-flow>` | Which context keys `form.start` may carry (default `channel campaign`) |
| The tracker itself | Host code | Set it only when consent allows, or use `consent: false` and `grant()` |

The tracking `session` is random per run: not a user id, not stored, and not the saved-draft id.

---

## The editor

`<form-editor>` edits both documents at once: an outline of steps and fields, a field panel drawn from the field's type (its `settings`), a searchable type picker listing the installed packages (`types` attribute; core is always there), rules shown as sentences with a When/Then/Otherwise builder, variables, services with sample replies, and a live `<form-flow explain>` preview. **Advanced** reveals ids, priorities, patterns, the listen list and raw JSON; it is off by default so content editors work with pickers only. Export is blocked while `validate()` reports problems. See the [form-editor readme](../ui/form-editor/readme.md).

---

## Embedding on client sites

`<form-embed>` puts a published form on any site with one script tag. The client page needs nothing else, not even `ui/base`.

```html
<script type="module" src="https://v4.browser.style/ui/form-embed/index.js"></script>
<form-embed form-id="loan" version="1" mode="shadow"></form-embed>
```

**The bundle.** Publishing writes one immutable file, `forms/{id}/{version}.json`, plus `latest.json` (used when `version` is left out):

```json
{ "id": "loan", "version": 1, "runtime": "0.1.0", "functions": ["cprDate", "dk-cpr", "dk-cvr"],
  "form": { … }, "rules": { … } }
```

`node ui/form-embed/publish.js loan 1 loan.form.json loan.rules.json` builds it, records the host functions the JSON uses, and fails on names the registry does not have. It stands in for the editor or CMS publish step. Service URLs in the bundle resolve against the bundle's URL, not the client page.

**Modes**

| `mode` | Use it when |
|---|---|
| `shadow` (default) | The client's CSS must not reach the form, and the form's CSS must not reach the page. Font and colour are inherited |
| `light` | The client wants its own CSS to style the fields. Form styles are wrapped in `@scope (form-embed)` and cascade layers, so they never touch the rest of the page and any unlayered site rule wins |
| `iframe` | Planned, for forms with personal data; reports an `ff:error` for now |

Light DOM is a deliberate exception to v4's light-DOM-only convention: embeds run on pages we do not control.

**Theming.** Clients set prefixed `--form-*` properties (`--form-accent`, `--form-text`, `--form-border`, `--form-radius`, `--form-font`, `--form-gap`, …), style `::part()` (`form`, `step`, `field`, `label`, `input`, `hint`, `warning`, `nav`, `button`, `button-primary`, …), and may pass a `stylesheet` URL that is adopted after the form styles. The internal tokens are set from the public ones on `:host`, so a client's own `--color-*` tokens never leak in.

```css
form-embed {
  --form-accent: #0b6e4f;
  --form-radius: 0;
  &::part(button-primary) { min-inline-size: 12ch; }
}
```

**Functions.** The bundle lists function names; they resolve through `ui/form-embed/functions/registry.json` (name → module). A missing name fails the load, so a check can never pass silently, and forms never carry script URLs. A client may add its own synchronous functions with `embed.functions = { … }`; they win on a name clash.

**Events and API.** The `ff:*` events cross the shadow root unchanged, and `ff:ready` (`{ id, version }`) is added. `<form-embed>` exposes `functions`, `context`, `facts`, `receive(event)`, `goTo(step)`, `state`, `values`, `bundle`, `flow` and `ready`.

**Client checklist.** CSP: `script-src` and `connect-src` for the form host, plus each service host in `connect-src`, and `img-src` for field icons; no `style-src` exception is needed because the styles are constructed stylesheets. Every service the form calls must send CORS headers for the client's origin. Details: [form-embed readme](../ui/form-embed/readme.md).

---

## Not built yet

These are designed but deliberately deferred. Nothing above depends on them.

| | Today | Later |
|---|---|---|
| **Server-side evaluation** | The engine runs in the browser only. A submitted form is not re-checked | The same rules run on the server (Node, or a .NET port that passes `fixtures/*.json`) to re-validate submissions and send `where: "server"` events |
| **Backend endpoints** | `MockServer` keeps drafts in `localStorage`; resume emails are mocked as `ff:link`; the beacon tracker needs an endpoint that appends rows | A draft store with the `MockServer` contract, a mailer for resume links, an event store for the beacon |
| **API gateway** | Services are called directly: they must be public, CORS-enabled, with no keys | A gateway (e.g. a Cloudflare Worker) holding keys and CORS rules, plugged in through `flow.fetcher` |
| **Iframe embed mode** | `mode="iframe"` reports an `ff:error` | A postMessage bridge with auto-height, required for forms with personal data |
| **Insights** | Events reach the tracker | A `<form-insights>` funnel dashboard |
| **Field types** | Core types plus installable packages, including text blocks, hidden values, consent and file uploads | Address, repeaters; where uploads are stored is up to each CMS adapter |

---

## Porting the engine

`ui/form-rules/fixtures/*.json` are conformance cases: a form, a rule set and an input, with the expected state. Any other runtime proves itself by passing all of them, and a change in behaviour needs a new fixture. Run the tests with `npm test` in `ui/form-rules`, `ui/form-flow` and `ui/form-editor`.

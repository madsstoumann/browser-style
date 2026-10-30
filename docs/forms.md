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
| [`@browser.style/form-types-dk`](../ui/form-types/dk/), [`-banking`](../ui/form-types/banking/), [`-formats`](../ui/form-types/formats/), [`-postcodes`](../ui/form-types/postcodes/), [`-eu`](../ui/form-types/eu/) | none | Optional field type packages: Danish CPR and CVR, IBAN, ISBN and barcodes, postcodes for 15 countries, EU VAT numbers; each with its checks. See [Field types](#field-types-and-packages) |
| [`@browser.style/form-widget-*`](../ui/form-widgets/) | none | Optional controls: rich text, type-ahead with `<auto-suggest>`, a spreadsheet grid with `<data-grid>`. Loaded only when a field uses them. See [Widget packages](#widget-packages) |

Demos:

| Page | Shows |
|---|---|
| [/ui/form-flow/](https://v4.browser.style/ui/form-flow/) | The insurance example: options narrowed by age and zip, a service patch, a goto |
| [/ui/form-flow/loan.html](https://v4.browser.style/ui/form-flow/loan.html) | The advanced loan example: variables and a score, CPR checks, an eligibility service, inserted steps, tracking |
| [/ui/form-flow/session.html](https://v4.browser.style/ui/form-flow/session.html) | Save and continue later, resume links, the done state |
| [/ui/form-flow/contact.html](https://v4.browser.style/ui/form-flow/contact.html) | The core field types: text blocks, a hidden value, a file upload, consent |
| [/ui/form-flow/drug-ticket.html](https://v4.browser.style/ui/form-flow/drug-ticket.html) | Texts that follow the answers: choice notes, a text block with cases, fields shown when a named condition holds |
| [/ui/form-flow/drug-ticket.html](https://v4.browser.style/ui/form-flow/drug-ticket.html) | A calculator on one page with a result panel beside it, texts that follow the answers, and a switch between the three layouts |
| [/ui/form-flow/order.html](https://v4.browser.style/ui/form-flow/order.html) | Order lines as rows, calculated totals, a slider, a city list from a service that depends on the country, street type-ahead, date and text rules, placeholders |
| [/ui/form-widgets/](https://v4.browser.style/ui/form-widgets/) | The three widget packages: rich text, `<auto-suggest>`, `<data-grid>` |
| [/ui/form-editor/](https://v4.browser.style/ui/form-editor/) | The editor; `?example=loan` opens the loan example, `?example=contact` the field types example, `?example=order` the order example, `?example=drug-ticket` the texts example |
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
| `structure.layout[]` | The steps, in order, and any result panels |
| `structure.present` | How the form is shown: one step at a time, on one page, or a page that unfolds. See [How a form is shown](#how-a-form-is-shown) |
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
| `showWhen` | Skipped while this is false, see [Texts that follow the answers](#texts-that-follow-the-answers) |

**Result panel** (see [How a form is shown](#how-a-form-is-shown))

| Key | |
|---|---|
| `type` | Always `"panel"` |
| `id` | Lowercase, `a-z0-9-`, not used by a step |
| `name` | Optional heading |
| `place` | `aside` (default: beside the form when there is room, after it when not), `end` (after the steps), `start` (before them) |
| `fields` | Text blocks and calculated values only |
| `hidden`, `showWhen` | As on a step |

**Field (property)**

| Key | |
|---|---|
| `type` | `string`, `number`, `integer`, `boolean`, `select`; `content` (a text block, no value); `file` (uploads); `list` (a repeating group, see [Repeating groups](#repeating-groups)) |
| `kind` | The field type it was made from (`email`, `consent`, `dk/cpr`, …), see [Field types](#field-types-and-packages). Optional and only for editors: the engine goes by `type` |
| `title`, `description` | Label and help text (a text block's optional heading) |
| `required` | Starting value of the flag; rules may change it. A required `boolean` must be `true`, like a required checkbox |
| `default` | Starting value, used while the field has no answer |
| `from` | Prefill from `context.<name>` or `facts.<name>` while the field has no answer (before `default`). `vars.<name>` makes a [calculated value](#calculated-values-and-placeholders) |
| `content` | Text block: the text; a blank line starts a paragraph. May hold [placeholders](#calculated-values-and-placeholders) |
| `consent` | Consent fields: `{ text, notice: { label, url, version } }`, recorded with the answer |
| `validation` | `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`; for files `accept`, `maxSize` (bytes), `maxFiles`; `check` (name or names of host functions); `messages` (text per issue code, replacing the default); for lists `minItems`, `maxItems` |
| `options` | `choices: [{ value, label }]` for `select`; `multiple: true` for checkboxes; `source` (a service name) for a list or suggestions from a service, `minLength` before suggesting. See [Option sources](#option-sources-and-type-ahead) |
| `items` | `list` only: `{ properties }`, the fields of one row |
| `ui.widget` | `email`, `tel`, `url`, `date`, `time`, `textarea`, `hidden`, `suggest` for strings; `radio` for a select; `consent` for a boolean; `range` (a slider) for numbers; `output` for a calculated value; `table` or `rows` for a list; or a name a [widget package](#widget-packages) provides |
| `ui.format` | `Intl.NumberFormat` options for showing a number (`{ "style": "currency", "currency": "DKK" }`), in outputs and placeholders |
| `ui.step` | Step of a slider or number input |
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
| `context` | Where each `context.<key>` may come from when a server re-checks a submit: `{ "segment": { "from": "server" } }`. See [What a server can trust](#what-a-server-can-trust) |
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
| `min`, `max`, `round` | `{ "round": [{ "/": [a, b] }, 2] }` | `round` takes decimal places; negative places round to tens (-1), hundreds (-2) |
| `sum` | `{ "sum": [1, 2, 3] }`, `{ "sum": { "var": "values.amounts" } }` | Adds numbers; anything else (an empty value) counts as nothing |
| `cat` | `{ "cat": ["DK-", { "var": "values.zip" }] }` | Joins as text |
| `startsWith`, `endsWith` | `{ "startsWith": [{ "var": "values.zip" }, "8"] }` | Text only, case-sensitive; wrap both sides in `lower` for "any case" |
| `lower`, `upper`, `trim` | `{ "lower": { "var": "values.email" } }` | Text only, else `null` |
| `length` | `{ ">": [{ "length": { "var": "values.lines" } }, 2] }` | Characters in a text, items in a list, else `null` |
| `substr` | `{ "substr": [{ "var": "values.cpr" }, 0, 6] }` | Start, then optional length; negative counts from the end |
| `yearsBetween`, `daysBetween` | `{ "yearsBetween": [{ "var": "values.birth" }, { "var": "today" }] }` | ISO dates |
| `datePart` | `{ "===": [{ "datePart": [{ "var": "values.date" }, "weekday"] }, 7] }` | `year`, `month`, `day`, `weekday` (1 Monday to 7 Sunday) or `week` (ISO week) of an ISO date |
| `map`, `filter` | `{ "map": [{ "var": "values.lines" }, { "var": "qty" }] }` | The second argument runs once per item, with the item as its data (`{ "var": "qty" }` reads the row's `qty`) |
| `reduce` | `{ "reduce": [list, { "+": [{ "var": "accumulator" }, { "var": "current.qty" }] }, 0] }` | As in JSON Logic |
| `some`, `all`, `none` | `{ "some": [{ "var": "values.lines" }, { "===": [{ "var": "product" }, "cake"] }] }` | `all` of an empty list is false |
| `check` | `{ "check": ["dk-cpr", { "var": "values.cpr" }] }` | True when the host check passes (warnings pass) |
| *any host function* | `{ "cprDate": [{ "var": "values.cpr" }] }` | See [Custom functions](#custom-functions) |

Inside `map`, `filter`, `reduce`, `some`, `all` and `none`, `var` reads the item, not the form: a rule that needs an answer from outside the list inside the loop should compute it into a variable first.

The editor writes the text words as these operators: *contains* is `in`, *starts with* and *ends with* are themselves, and all three are case-insensitive (both sides wrapped in `lower`) unless *match case* is ticked. Any comparison can be against a value or against another field (`{ "<": [{ "var": "values.from" }, { "var": "values.to" }] }`).

What is deliberately **not** there: `==` and `!=` (coercion makes runtimes disagree), regular expressions in conditions (runtimes differ; use `validation.pattern` or a host check), and any operator that reads a clock or does I/O. An unknown operator throws, and `validate()` reports it before anything runs.

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

## Calculated values and placeholders

A **calculated value** is a field the person sees but never types: a total, a price, a score. It is a field with `from: "vars.<name>"`, and its value is always the variable's, so the rules do the arithmetic once and both the form and the server show the same result.

```json
"variables": {
  "subtotal": { "type": "number", "compute": { "sum": { "map": [{ "var": "values.lines" }, { "*": [{ "var": ["qty", 0] }, { "var": ["price", 0] }] }] } } }
}
```

```json
"subtotal": { "type": "number", "title": "Subtotal", "from": "vars.subtotal",
  "ui": { "widget": "output", "format": { "style": "currency", "currency": "DKK" } } }
```

- A calculated value is submitted like any answer, but a posted value is ignored: the engine always takes the variable's, so the server's re-check stores what the server worked out. A value of the wrong type for the field is dropped.
- It cannot be `required`, and `setValue` or `clear` cannot target it. `validate()` reports an undeclared variable and a calculation that depends on itself.
- `<form-flow>` draws it as `<output>`, formatted with `ui.format` in the form's language.

**Placeholders.** A text block, a title, a help text and a message may say `{values.total}`, `{vars.score}`, `{context.campaign}` or `{facts.segment}`. They are filled on every change, with the same formatting as the field (`ui.format`, the chosen option's label for a choice). `{{` and `}}` write a literal brace. `validate()` reports a placeholder that names an unknown field or variable.

```json
"summary": { "type": "content", "content": "{values.items} items for {values.total}, delivered to {values.street}." }
```

`fillText(text, data, { format })` and `placeholdersOf(text)` are exported by form-rules, so a server can fill the same texts in a receipt.

---

## Texts that follow the answers

Many forms explain the answer just given: what a level means, which sanctions apply, a warning for one choice. Writing each variant as its own text block plus a rule that hides it works, but nothing in the field says when it shows, and a translator copies logic. Three things are written on the form instead, from simplest to most general. The [drug-ticket example](https://v4.browser.style/ui/form-flow/drug-ticket.html) uses all three and its rule set has no visibility rules.

**A note on a choice.** Text shown under the field while that choice is chosen:

```json
"thcLevel": { "type": "select", "ui": { "widget": "radio" }, "options": { "choices": [
  { "value": "low", "label": "Low", "note": "Low corresponds to 0.001–0.003 mg/kg blood." },
  { "value": "medium", "label": "Medium", "note": "Medium corresponds to 0.003–0.009 mg/kg blood." } ] } }
```

The engine returns the chosen choice's note as `state.notes.thcLevel` (a list for a multiple choice; nothing while the field is hidden). Any other text can show it with `{values.thcLevel.note}`.

**A text block with cases.** For a text that depends on several answers:

```json
"sanctions": { "type": "content", "title": "Sanctions", "show": "all", "cases": [
  { "when": "lowThc", "content": "1 penalty point on your license" },
  { "when": "newDriver", "content": "Driving ban" },
  { "when": "revoked", "content": "License revoked unconditionally for 3 years" } ],
  "content": "No sanctions" }
```

- `show: "all"` (the default) shows every matching case, `"first"` only the first. `content` is shown when no case matches.
- The engine returns the positions of the matching cases, `state.fields.sanctions.cases: [0, 2]`, so a server filling a receipt or an email shows exactly the texts the person saw. A hidden text block has no cases.
- Case texts may have placeholders.

**Show this field when.** Any field, and any step, can have `showWhen`:

```json
"licenseYears": { "type": "select", "title": "How long have you had your license?", "showWhen": "medThc", … }
```

The engine runs it as a rule of its own, `showWhen:<field>` (`showWhen:step:<step>` for a step), which hides the field (skips the step) while the condition is false. Since it is a rule like any other, hidden is absent, `explain` names it, `matched` lists it while it hides, a server re-check applies it, and a rule of higher priority can still show the field.

**Conditions by name.** `when` and `showWhen` take the name of a [named condition](#named-conditions) (`"lowThc"`, read as `vars.lowThc === true`) or JSON Logic. Write names: the form definition is what gets translated per language in the CMS, so a translation then carries only texts and names, and fixing a condition fixes it in every language.

**In the editor.** Each choice row has **Text shown when chosen**. A text block has **Texts that depend on the answers**: "+ Case" adds a row reading *When [named condition] Show: [text]*, with **Show** set to every matching text or only the first, and the block's own text becomes the text when no case matches. Every field and step has **Show this field** (or step): *Always* or a named condition. The pickers list the named conditions by title; **+ New named condition…** asks for a name and adds one to the rule set, and **Edit "…"** below the picker builds it with the same pickers as a rule's When (changing it there changes it everywhere). A condition written as JSON Logic shows as "A condition of its own", with **Save as named condition…**. Deleting a named condition lists the fields and steps that still use it, and renaming a field updates the conditions on the form.

`validate()` reports a case without a condition or text, an unknown named condition, a `show` other than all or first, cases on anything but a text block, and placeholders in notes and cases that read nothing. `conditionOf`, `implicitRules`, `matchingCases`, `noteOf` and `textData(state, { context, facts })` (the data `fillText` needs, with notes) are exported.

---

## How a form is shown

The same form and rules can run one step at a time, as one page, or as one page that grows as the person answers. That is a choice about presentation only, so it is one setting on the form, `structure.present`, and the engine keeps steps as they are: on one page a step is simply a section.

```json
"structure": {
  "present": { "mode": "page", "advance": "manual", "submit": false },
  "layout": [
    { "type": "step", "id": "calc", "name": "Your situation", "fields": ["income", "drug", "thcLevel"] },
    { "type": "panel", "id": "result", "name": "Your estimated cost", "place": "aside", "fields": ["headline", "sanctions", "total"] }
  ]
}
```

| Setting | | Good for |
|---|---|---|
| `mode: "steps"` (default) | One step at a time, Back and Next, a step list | Long forms, applications |
| `mode: "page"` | Every step on the path at once, as sections with headings; one Send at the end | Short forms, calculators, contact forms |
| `mode: "reveal"` | One page; the next section appears when the one before is complete, with a Continue button for a section that asks only optional questions | Guided questions, "find the right product" |
| `advance: "auto"` | Moves on as soon as a single choice (radio buttons or a dropdown) completes the current step: to the next step in `steps` mode, scrolling the next section into view in `reveal`. Not on the last step: Send is still pressed | One question per screen |
| `submit: false` | A calculator: no Send button, nothing is sent, results update as the person answers. Tracking reports `form.result` instead of `form.submit` | Price and fee calculators |

A section is **complete** when its controls are valid and, if it asks anything, at least one of its questions has an answer (a default counts).

**Result panels.** A layout entry of type `panel` holds text blocks and calculated values, never questions, so it never blocks Next or Send. It is shown in every mode and on every step: in steps mode it is a running total or a summary next to a long application. `skip` and `include` work on a panel as on a step (rules and `showWhen`), and its values are hidden, and not submitted, while it is hidden. Panels are never on the `path`; `state.panels` lists them with `visible`.

**Rules are the same in every mode.** `skip` hides a section on one page, `goto` hides the sections it passes over, and hidden is absent. Validation runs on Next (or Continue) for the current section and over every section on the path on Send; an invalid section further down is opened and focused.

**Sessions and tracking.** On one page the current step is the furthest section the person has reached, so a saved draft resumes there, and `step.view` (with `via: "page"` or `"reveal"`) is reported as each section is reached: funnels still work.

`<form-flow mode="…">` overrides the mode for a preview or a demo. In the editor, the form panel has **How it is shown** (layout, *Move on when a choice is made*, *Nothing is sent (a calculator)*), and **+ Result panel** in the outline adds a panel. The [drug-ticket example](https://v4.browser.style/ui/form-flow/drug-ticket.html) is one step and one panel, in page mode with `submit: false`, with a switch to see it in the other modes.

---

## Repeating groups

A field of type `list` is a set of rows with the same fields: order lines, children, previous jobs.

```json
"lines": { "type": "list", "title": "Order lines", "required": true,
  "ui": { "widget": "table" },
  "items": { "properties": {
    "product": { "type": "select", "title": "Product", "required": true, "options": { "choices": [ … ] } },
    "qty": { "type": "integer", "title": "Quantity", "required": true, "validation": { "minimum": 1 } }
  } },
  "validation": { "minItems": 1, "maxItems": 6 } }
```

- The value is an array of row objects: `[{ "product": "tea", "qty": 2 }]`. Rows that are wholly empty are dropped; keys that are not in `items` are dropped; each cell is held to its field's type.
- `required` on the list means at least one row; `required` on a row field applies to every filled row. `minItems` and `maxItems` count rows.
- Each cell is checked like a field: choices, range, length, pattern and checks. An issue carries `row` and `item` as well as `field` (`{ field: "lines", row: 0, item: "qty", code: "minimum" }`), so form-flow marks the right cell.
- Rules read the whole list: `{ "length": { "var": "values.lines" } }`, `{ "some": [{ "var": "values.lines" }, …] }`, or a total in a variable. Such a rule's actions apply to the list as one field (show, hide, require, …). To act on single rows, use a row rule (below).
- `ui.widget` is `table` (one line per row, for a few short fields) or `rows` (each row stacked as a group, the default, for rows with many fields). With the [grid widget package](#widget-packages), `data-grid` gives a spreadsheet with keyboard navigation.

---

### Row rules

A rule with `"forEach": "<list>"` runs once for every filled row of that list. Its condition reads the current row as `row.<item>` and its position as `index` (from 0), next to everything a form rule reads. Its actions change cells of that row, named `<list>.<item>`:

```json
{
  "id": "cake-note",
  "forEach": "lines",
  "when": { "===": [{ "var": "row.product" }, "cake"] },
  "then": [{ "require": "lines.note" }],
  "else": [{ "hide": "lines.note" }]
}
```

- Row actions are `show`, `hide`, `enable`, `disable`, `require`, `optional`, `setValue`, `clear` and `invalid`. Step, variable, fetch and event actions are refused, since they would fire once per row.
- The result has `rows`: `rows.lines[0].note` is `{ visible, enabled, required }`, for every list a row rule targets. `explain` names cells the same way, as `lines[0].note.visible`.
- A hidden or disabled cell behaves like a hidden field: it is not submitted, and other rules do not see it. `invalid` gives a row issue (`{ field: "lines", row: 0, item: "qty", code }`), and `level: "warning"` only warns.
- `index` and `row` count filled rows, the same rows issues count, so a wholly empty row in the middle does not shift them.
- `validate()` refuses a row rule that reads `row.x` and hides, disables, sets or clears `x`, and one that reads the whole list while hiding its cells, because either would never settle.
- In the editor, **Runs** on a rule switches it between "Once for the form" and "For each row of …"; the field pickers then offer the row's fields. The order example (`?example=order`) has two row rules.

## Option sources and type-ahead

A list of choices that comes from a service, rather than from the form, names it in `options.source`:

```json
"services": { "cities": { "url": "/api/cities", "method": "GET", "send": ["country"] } }
```

```json
"city":   { "type": "select", "title": "City", "options": { "source": "cities" } },
"street": { "type": "string", "title": "Street", "ui": { "widget": "suggest" }, "options": { "source": "streets", "minLength": 2 } }
```

- **A select with a source** (a *lookup*) gets its options from the service. The engine emits an `options` effect whenever the field is visible and the fields the service is sent have changed; form-flow calls the service and expects `[{ value, label }]` (or `{ choices: [...] }`). Because `send` names earlier answers, lists cascade: a new country gives a new list of cities. Rules can still narrow the list with the `options` action.
- **A string with a source** only suggests. form-flow calls the service as the person types (after `minLength` characters, debounced, with the text as `q`) and shows the replies in a native `<datalist>`, or in `<auto-suggest>` with the [suggest widget package](#widget-packages). Any text is a valid answer.
- `flow.fetcher` sees these calls too, so a proxy or a mock serves them like any other service.
- The engine checks a sourced answer against the list only when the list is passed in as `input.choices[field]`; otherwise it checks the type only. See [What a server can trust](#what-a-server-can-trust).

---

## Snippets

A snippet is a group of fields with the rules that belong to them, saved as one JSON file so editors do not build an address or a contact block again for every form. The editor's **+ Field** picker lists the installed snippets under *Snippets: several fields at once*.

```json
{
  "snippet": "contact",
  "title": "Contact details",
  "fields": ["name", "email", "phone"],
  "properties": { "name": { … }, "email": { … }, "phone": { … } },
  "rules": [{ "id": "contact-way", "when": { "and": [{ "!": { "var": "values.email" } }, { "!": { "var": "values.phone" } }] }, "then": [{ "require": ["email"] }] }]
}
```

Inserting one copies its fields into the chosen step and its rules, variables and services into the rule set. An id that is already taken gets a number (`email2`), and every rule, placeholder and service that names it is renamed with it, so a form can hold two addresses. A snippet is a copy: changing the snippet file later does not change forms that used it.

Snippets are data like type packages: `ui/form-editor/snippets/` has `address`, `contact` and `consent`, and the editor's `snippets` attribute lists the files to offer. `insertSnippet(form, rules, snippet, stepId)`, `extractSnippet(form, rules, fieldIds, { title })` and `snippetProblems(snippet)` are in `ui/form-editor/modules/snippets.js`.

**Your own snippets.** A step's **Save fields as snippet…** picks some of its fields and saves them, with the rules that use only those fields and the variables and services those rules need. A rule that also uses another field is left out, and the editor says which ones. Saved snippets are kept in this browser and listed under *Your snippets* in every form's picker. **Download** gives the JSON file, which can go into a `snippets` folder for everyone to use.

### Working with many rules

- **Notes.** A rule's `note` is for editors: why it is there, who asked for it. The engine ignores it. The Rules view shows it under the sentence.
- **Copy and paste.** **Copy rule** keeps the rule, with the variables and services it needs, for any form in this browser (and puts it on the clipboard as JSON). **Paste rule** in another form adds it under a free id. It adds the variables and services that form lacks and says which of the rule's fields that form does not have.
- **Find a rule.** With more than three rules, the Rules view has a search box (title, note and wording) and a field picker ("only rules that use Zip code").

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
- Variables are never submitted. A server that re-checks a submit computes them again from the answers, so changing them in the browser changes nothing that is stored. See [What a server can trust](#what-a-server-can-trust).


### Named conditions

A named condition is a computed yes/no variable with a title. It lets one condition be written once and used by many rules:

```json
"variables": {
  "isSenior": { "type": "boolean", "title": "Is senior customer", "compute": { ">=": [{ "var": "values.ageGroup" }, 50] } }
}
```

A rule reads it as `{ "===": [{ "var": "vars.isSenior" }, true] }`. The engine needs nothing new for this; the editor treats such variables as their own kind:

- **Named conditions** in the Rules view lists them and builds each one with the same pickers as a rule's When.
- A rule's field picker offers them as "Is senior customer (named condition)", and the rule then reads "When Is senior customer: …", or "When not Is senior customer: …".
- **Save as named condition…** under a rule's When moves its condition into a new named condition and makes the rule use it.
- Deleting one lists the rules and variables that still read it.

The insurance example's `senior-health` rule uses `isSenior`.

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
| Core | `ui/form-rules/types/core.json` | Text, Long text, Number, Whole number, Slider, Date, Time, Dropdown, Radio buttons, Checkboxes, Repeating group, List from a service, Type-ahead, Yes / no, Email, Phone, Web address, Consent, Text block, Hidden value, Calculated value, File upload |
| Denmark | `ui/form-types/dk/` (`@browser.style/form-types-dk`) | CPR number (`dk/cpr`), CVR number (`dk/cvr`); checks `dk-cpr`, `dk-cvr`, operator `cprDate` |
| Banking | `ui/form-types/banking/` (`@browser.style/form-types-banking`) | IBAN (`banking/iban`); checks `iban`, `luhn` |
| Formats | `ui/form-types/formats/` (`@browser.style/form-types-formats`) | ISBN, barcode (EAN / GTIN), IP address, UUID, colour; checks `isbn`, `gtin`, `ipv4` |
| Postcodes | `ui/form-types/postcodes/` (`@browser.style/form-types-postcodes`) | A postcode type per country (`postcodes/dk`, `postcodes/uk`, … 15 countries); checks `postcodeDk`, `postcodeUk`, … with an example in the message |
| EU | `ui/form-types/eu/` (`@browser.style/form-types-eu`) | EU VAT number (`eu/vat`); check `euVat`, the format of each member state |

A Swedish personnummer, a UK National Insurance number or a company's customer number is a new package of the same shape; nothing in core or the editor changes. Kinds outside core start with the package name (`se/personnummer`), so two packages never collide.

- **`settings`** lists what the editor's field panel shows besides label, id, help, required, hidden, privacy and step: `choices`, `multiple`, `range`, `length`, `pattern`, `checks`, `placeholder`, `default`, `content`, `consent`, `files`, `source` (where a hidden value comes from), `calculated` (variable and format), `items` (the row fields), `rows` (fewest, most, shown as), `optionSource` (the service a list comes from).
- **`privacy`** is the level a new field starts with (a CPR number is `special`, an email `personal`).
- **`functions`** points at the module with the package's checks, relative to the JSON file.
- **`widgets`** (browser only) points at a module of control adapters. See [Widget packages](#widget-packages).

The helpers are pure and exported by form-rules, so an editor in another host (the Umbraco backoffice) can bundle them:

| Function | Does |
|---|---|
| `defineTypes(...packages)` | Merges package documents into a registry `{ packages, types, kinds, errors }` |
| `loadTypes(urls, { fetch?, base? })` | Fetches package files, then `defineTypes` |
| `loadPackages(urls, { widgets? })` | `loadTypes`, and imports each package's `functions` (and with `widgets: true` its `widgets`): `{ …registry, functions, widgets }` |
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

## Widget packages

browser.style has richer controls than the native ones: `<rich-text>`, `<auto-suggest>`, `<data-grid>`. They are too heavy to load with every form, so each is a **widget package**: a type package whose `types.json` names a `widgets` module.

| Package | Where | `ui.widget` | For |
|---|---|---|---|
| Rich text | `ui/form-widgets/rich-text/` (`@browser.style/form-widget-rich-text`) | `rich-text` | A `string` holding HTML: bold, italic, lists, links |
| Suggest | `ui/form-widgets/suggest/` (`@browser.style/form-widget-suggest`) | `auto-suggest` | A `string` with `options.source`: type-ahead with keyboard navigation |
| Grid | `ui/form-widgets/grid/` (`@browser.style/form-widget-grid`) | `data-grid` | A `list`: the rows as a spreadsheet |

```html
<form-flow form="order.form.json" rules="order.rules.json"
  packages="/ui/form-widgets/grid/types.json /ui/form-widgets/suggest/types.json"></form-flow>
```

- The `widgets` module holds only small adapters. An adapter imports its component, and its stylesheet, the first time a field on the page uses it, so a form without such a field downloads nothing more.
- Without the package, the same field falls back to a native control (a text area, an input with a `<datalist>`, the built-in rows table). The value, the rules and the server's re-check are the same either way: a widget changes how an answer is typed, never what it is.
- The editor loads widget packages like type packages (`types` attribute), so its preview shows them.

**An adapter** is `{ render, read, write?, load?, group?, ownLabel? }`:

| Member | |
|---|---|
| `render({ id, property, value, flow, service })` | Returns the control's element. Mark the element that holds the value with `data-widget-control` |
| `read(control, property)` | The control's value, typed for the field |
| `write(control, value, property)` | Puts a value back (a `setValue`, a resumed draft) |
| `load(flow)` | Imports the component; called once, before the first render |
| `group` | `true` when the control is a group (a grid), so it is labelled by a `<fieldset>` and `<legend>` |
| `ownLabel` | `true` when the component draws its own label |

The control dispatches `input` (or `change`) when its value changes, and `<form-flow>` re-evaluates. An adapter never puts answers into HTML as markup: `<auto-suggest>` and `<data-grid>` interpolate text into templates, so their adapters escape it, and rich text is cleaned to a short allowlist of tags in the browser. **A server must clean rich text again**, since a posted value can hold anything.

---

## Language packs

`<form-flow locale="/ui/form-flow/locales/da.json">` sets the texts the form itself writes: buttons, row controls, the required marker, the default messages. Packs ship for `en`, `da`, `de`, `sv`, `nb`, `fr` and `es`; another language is one JSON file of the same shape.

```json
{ "locale": "da",
  "labels": { "prev": "Tilbage", "next": "Næste", "submit": "Send", "add-row": "+ Tilføj række", … },
  "messages": { "minimum": "Skal være mindst {limit}", "maxItems": "Højst {limit} rækker", … } }
```

- `labels` are form-flow's own texts; a `label-*` attribute still wins.
- `messages` are passed to the engine as `input.messages`, so the default text per issue code follows the language; `{limit}` is the field's limit. A field's own `validation.messages` still wins.
- `locale` also decides number and date formatting in outputs and placeholders. Without a pack, the language is the nearest `lang` attribute, then the browser's.
- The form's own wording (titles, help, choices) is content and is translated per language in the CMS, not here.

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

Services also feed [option lists and type-ahead](#option-sources-and-type-ahead); those calls go through the same `send`, `method` and `fetcher`.

Set `flow.fetcher = async (effect, service) => patch` to route requests through a proxy or return mocks; returning `undefined` falls back to the built-in request. The editor's preview uses sample replies (`samples` attribute) instead of calling services.

**What a reply may add.** A service's reply can add questions, but by default only plain ones: text, numbers, yes/no, choices and text blocks. A password, a hidden value, a consent or a file upload is refused (`field-kind`) unless the service lists it, so a compromised service cannot ask for a password or slip in a hidden answer. List what a service may add with `fields`:

```json
"services": { "partner": { "url": "/api/partner", "send": ["cpr"], "fields": ["string", "select", "consent"], "processor": true } }
```

**Personal data to services.** `validate()` refuses a service that is sent a `special` answer and warns about one that is sent a `personal` answer, until the service is marked `"processor": true`: covered by a data processing agreement. The editor shows the warnings under "things to check"; they do not block export.

**Links from data.** A URL that comes from a form, a reply or a stored entry is shown as a link only when `safeUrl()` lets it through: `http:`, `https:` or relative. form-flow uses it for consent notice links.

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

Events: `form.view`, `form.start`, `step.view`, `step.leave`, `step.blocked`, `field.error`, `field.revisit`, `rule.enter` / `rule.leave`, `service.request` / `service.reply` / `service.error`, `form.submit`, `form.result` (a calculator, once its answers rest), `form.abandon`, `form.resume`. All share one flat envelope `{ type, form, rules, version, session, seq, at, step, index, path, data }`. The full table is in the [form-flow readme](../ui/form-flow/readme.md#tracking).

The settings an author controls:

| Setting | Where | Effect |
|---|---|---|
| `"track": true` on a `select` field | Form definition (editor: *may go to analytics*) | Its chosen option is sent as `choices` on `form.submit`, `form.result` and `form.abandon`. `validate()` refuses it on any other type, so typed text never reaches a tracker. Never mark a field whose options are personal |
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

## What a server can trust

Everything in the browser can be changed by the person using it: values, variables, which step is shown, the engine itself. So a server never takes the browser's word for anything it can work out itself. It re-runs the same engine on the posted answers and stores only what that run lets through (the UCS adapters in universal-content-model do exactly this).

| Input | In the browser | On the server's re-check |
|---|---|---|
| `values` | The answers | Posted, then filtered again: hidden and skipped fields dropped, `setValue` applied, each answer held to its field's JSON type (a `type` issue otherwise, so a list posted for an email field cannot skip its pattern), options, required and validation checked |
| `vars.*` | Computed | **Not posted.** Computed again from the answers |
| `services.*` | The browser's fetch replies | **Not posted.** The server calls the services itself |
| `context.*` | Set by the page | Built by `trustedContext()`: keys the server supplies win, keys declared `"from": "server"` are never taken from the page |
| `facts.*` | Written by incoming events | **Not posted.** The server evaluates with no facts |

**Context.** The page sets `context`, and the page is in the user's hands, so a server must not believe a `context.segment` of `"gold"` because the browser says so. Declare the keys that decide something:

```json
"context": {
  "segment":  { "from": "server", "title": "Member segment" },
  "campaign": { "from": "page" }
}
```

A server builds the context it evaluates with from its own knowledge and the page's:

```js
import { trustedContext } from '@browser.style/form-rules';
const context = trustedContext(rules, { page: posted.context, server: { segment: member?.segment ?? null } });
```

A key the server supplies always wins. A key declared `"from": "server"` is dropped from the page's context even when the server has no value for it, so it reads as `null`. Undeclared keys come from the page, as before, which suits harmless ones like `channel` and `campaign`. The browser keeps evaluating with the page's context, so the page should still set server keys (rendered into it by the CMS) to show the right fields.

**Facts.** Facts come from events in the browser, so a server cannot check them. A rule that blocks or grants something on a fact is enforced in the browser only. Anything that must hold on the server belongs in a service the rules `fetch` (the server replays it) or in a server context key.

**Calculated values** are worked out again from the answers; a posted one is ignored.

**Lists from services.** A sourced select is checked against its list only when the server passes the list in as `input.choices`; without it, the answer is only held to its type. A server that must refuse a city that is not on the list fetches the list itself and passes it in.

**Rich text** is HTML typed in the browser. Clean it on the server with an allowlist before storing or showing it, whatever the browser did.

**Services.** The server sends the posted answers a service names in `send`. A service that answers for a person (a credit check, a member lookup) must identify them from something the server knows, not from an answer the person could change.

---

## Identity confirmation (designed, not built)

Some forms must know who is answering: an application, a consent that has to hold up, a form that shows a person their own data. Most countries have a national or bank-run electronic identity for this: MitID in Denmark, BankID in Sweden and Norway, the bank IDs in Finland, Smart-ID and Mobile-ID in the Baltics, itsme in Belgium, DigiD and iDIN in the Netherlands, the online ID card in Germany, SPID and CIE in Italy, Cl@ve in Spain, FranceConnect in France and ID Austria. The UK and the US have none for private services, so sites there use document-and-selfie checks. Under eIDAS 2, every EU member state must offer an EU Digital Identity Wallet from around the end of 2026. These details change, so check each scheme before relying on it.

Sites rarely connect to each scheme directly. A broker (Criipto, Signicat and others) puts many of them behind one OpenID Connect login. The client signs an agreement with the broker and pays per login. Brokers have free test environments with test users.

Identity fits the existing design without engine changes. It is an adapter feature with a small browser part:

1. **Providers are data.** One JSON profile per provider (MitID, Swedish BankID, itsme, the EU wallet, …), like the privacy profiles: the broker's OpenID Connect settings (issuer, client id, scopes) and a map from the provider's claims to our names. Secrets stay in the server's configuration. A new country is a new file, never code.
2. **A "Confirm identity" field type** draws a "Continue with MitID" button. It saves the draft, sends the person through the adapter to the broker and back, and the form continues where it was.
3. **Claims become server-owned context.** The adapter keeps the verified result (`context.identity.verified`, `name`, `birthdate`, the assurance level) and supplies it as [server context](#what-a-server-can-trust), keys declared `"from": "server"`. The browser can never claim them, and the server's re-check believes only its own copy. Rules then prefill and lock fields (`from: "context.identity.name"` with `disable`) or refuse a submit until the person is verified (`invalid` when `context.identity.verified` is not true).
4. **Privacy.** A national id number (the Danish CPR) is `special`. Store only what the form asks for, encrypted like other special fields. MitID gives a person id by default; matching it to a CPR number is a separate lookup at the broker.

Proving who someone is and signing a document are separate services in most schemes; a form usually needs only the first. Identity overlaps with [personal invitations](#not-built-yet), since both decide who is answering, and the two are designed together.

---

## Not built yet

These are designed but deliberately deferred. Nothing above depends on them.

| | Today | Later |
|---|---|---|
| **Backend endpoints** | `MockServer` keeps drafts in `localStorage`; resume emails are mocked as `ff:link`; the beacon tracker needs an endpoint that appends rows | A draft store with the `MockServer` contract, a mailer for resume links, an event store for the beacon |
| **API gateway** | Services are called directly: they must be public, CORS-enabled, with no keys | A gateway (e.g. a Cloudflare Worker) holding keys and CORS rules, plugged in through `flow.fetcher` |
| **Iframe embed mode** | `mode="iframe"` reports an `ff:error` | A postMessage bridge with auto-height, required for forms with personal data |
| **Insights** | Events reach the tracker | A `<form-insights>` funnel dashboard |
| **Field types** | Core types plus installable packages, including text blocks, hidden values, consent, file uploads, repeating groups, calculated values and lists from services | Rules that act on single rows of a repeating group; where uploads are stored is up to each CMS adapter |
| **Personal invitations** | A form can prefill from `context` | Invitation links with per-person prefill and one answer per invitation (adapter level) |
| **Identity confirmation** | Server context keys can carry who the person is | A "Confirm identity" field type and per-provider OpenID Connect profiles in the adapter, see [Identity confirmation](#identity-confirmation-designed-not-built) |

---

## Porting the engine

`ui/form-rules/fixtures/*.json` are conformance cases: a form, a rule set and an input, with the expected state. Any other runtime proves itself by passing all of them, and a change in behaviour needs a new fixture. Run the tests with `npm test` in `ui/form-rules`, `ui/form-flow` and `ui/form-editor`.

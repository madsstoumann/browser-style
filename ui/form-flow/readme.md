# Form Flow

`<form-flow>` renders a multi-step form from a JSON form definition and a [form-rules](../form-rules/) rule set. Fields are plain native controls in light DOM, styled by `@browser.style/base` form.css; steps use the `.ui-step` list from `ui/step`.

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/ui/step/ui-step.css">
<link rel="stylesheet" href="/ui/form-flow/index.css">

<form-flow
  form="insurance.form.json"
  rules="insurance.rules.json"
  explain>
</form-flow>

<script type="module" src="/ui/form-flow/index.js"></script>
```

Or from objects: `flow.setup(definition, rules, { values, context, facts })`.

## How it works

Every input re-runs `evaluate()` and applies the result:

| Rule result | In the DOM |
| --- | --- |
| Field hidden | Its label or group gets `hidden`, its controls `disabled` (so they are not submitted; the value stays in memory) |
| Field disabled / required | `disabled` / `required`, and the `<abbr>` marker |
| Options narrowed | `<option>`s, radios and checkboxes outside the list are hidden and disabled |
| `setValue` | The control is updated |
| Option no longer available | `setCustomValidity()` on the control |
| Step skipped | The step's `<fieldset>` is `disabled` and left out of the step list |

**Next** validates the current step with native constraint validation. **Send** validates every visible step and dispatches `ff:submit`.

## Effects and events

- `fetch` effects are sent to the service URL with the fields the service declares in `send` (POST as JSON, or GET as query parameters with `"method": "GET"`). The reply is merged as a patch: its fields appear in their slot, its steps after the step the fetch named. Set `flow.fetcher = async (effect, service) => patch` to use a proxy or a mock; return `undefined` to fall back to the built-in request.
- `goto` needs nothing from the host: the engine's `path` already leaves out the steps passed over, so Next lands on the target and Back returns along the path.
- `emit` effects are dispatched as `ff:emit`.
- `flow.receive(event)` applies an incoming event the rule set listens for (facts, a newer rule set, a patch).
- `flow.context = { … }` and `flow.facts = { … }` re-evaluate.

| Event | Detail |
| --- | --- |
| `ff:change` | `{ values, state }` after every evaluation |
| `ff:step` | `{ step }` |
| `ff:emit` | `{ type, data, rule, where }` |
| `ff:submit` | `{ form, rules, version, values, state }` |
| `ff:error` | `{ error, errors?, effect?, event? }` |

## Attributes

| Attribute | |
| --- | --- |
| `form`, `rules` | URLs of the form definition and the rule set |
| `explain` | Shows a "Why" list of which rule decided what |
| `label-prev`, `label-next`, `label-submit`, `label-unavailable`, `label-required` | Button and message texts |

## Field types

| Property | Control |
| --- | --- |
| `string` | `<input>`; `ui.widget` may be `email`, `tel`, `url`, `date`, `time`, … or `textarea` |
| `number`, `integer` | `<input type="number">` with `validation.minimum` / `maximum` |
| `boolean` | `<input type="checkbox" role="switch">` |
| `select` | `<select>`; a radio group with `ui.widget: "radio"`; checkboxes with `options.multiple` |

Values are typed from the definition: a choice `30` comes back as the number `30`.

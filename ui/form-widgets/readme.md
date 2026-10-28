# Form widgets

Optional controls for [`<form-flow>`](../form-flow/), packaged so a form only pays for them when it uses them.

| Package | `ui.widget` | Field type | Draws it with |
| --- | --- | --- | --- |
| [`rich-text`](rich-text/) | `rich-text` | `string` (HTML) | [`<rich-text>`](../rich-text/) |
| [`suggest`](suggest/) | `auto-suggest` | `string` with `options.source` | [`<auto-suggest>`](../auto-suggest/) |
| [`grid`](grid/) | `data-grid` | `list` (a repeating group) | [`<data-grid>`](../data/grid/) |

A widget package is a type package (`types.json`, see [form-rules § Field types](../form-rules/readme.md)) with a `widgets` module. Name it in the form's `packages` attribute, and `<form-flow>` loads its types, checks and widgets:

```html
<form-flow form="order.form.json" rules="order.rules.json" packages="/ui/form-widgets/grid/types.json"></form-flow>
```

The `widgets` module is small: it holds adapters only. Each adapter imports its component (and, for light-DOM components, its stylesheet) the first time a field uses it. Without the package, the same field falls back to the native control: a text area, an input with a native suggestion list, or the built-in table of a repeating group. The rules and the server see the same value either way, since a widget only changes how the answer is typed.

Write your own adapter as `{ render({ id, property, value, flow, service }), read(control, property), write?(control, value, property), load?(flow), group?, ownLabel? }`; [`docs/forms.md`](../../docs/forms.md#widget-packages) has the contract. Open [the demo](index.html) to try all three.

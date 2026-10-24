# Form Editor

`<form-editor>` is a visual editor for multi-step forms and their rules. It is meant for developers and content editors alike. It produces exactly two JSON documents, both UCF content:

- **`<form-id>.form.json`** is the form definition (model `form-definition`), and is what `<form-flow>` renders.
- **`<rules-id>.rules.json`** is the rule set (model `form-rules`), and is what `@browser.style/form-rules` evaluates.

Demo: [/ui/form-editor/](https://browser.style/ui/form-editor/)

## Use

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/ui/step/ui-step.css">
<link rel="stylesheet" href="/ui/form-flow/index.css">
<link rel="stylesheet" href="/ui/form-editor/index.css">

<form-editor
  form="insurance.form.json"
  rules="insurance.rules.json"
  samples='{ "offers": "offers.patch.json" }'>
</form-editor>
<script type="module" src="/ui/form-editor/index.js"></script>
```

All three attributes are optional. `form` and `rules` give the example that the **Example** button restores. `samples` maps a service name to a sample reply (a form patch), which the preview uses in place of calling the service. Without attributes, the editor starts with an empty form.

The editor saves a draft in `localStorage` (`form-editor:draft`) on every change and restores it on load.

## The page

| Part | What it does |
|---|---|
| Toolbar | Shows the form title and the Form, Rules and JSON tabs (JSON only when Advanced is on). Also has Undo/Redo (Ctrl/Cmd+Z, Shift for redo), Example, New, Import, Export and the Advanced toggle. |
| Outline | Lists steps, their fields (with a type badge) and their slots. **+ Field** and **+ Step** add new ones. |
| Form view | Edits whichever is selected: the form (title, ids, rule set version), a step (name, hidden, slots, order) or a field (label, id, help, type, widget, required, hidden, choices, min/max, pattern, step). Renaming a field id also updates every rule, action and service that names it. Deleting a field lists the rules that use it. |
| Rules view | Shows each rule as a sentence ("When Age group is at least 30–49 and Zip code is above 2000: offer only Plus, Senior in Plan."). Opening a rule shows a **When** builder (All/Any groups, field, operator and value pickers fitted to the field), plus **Then** and **Otherwise** action rows. A condition the builder cannot draw stays as a custom JSON block, which can be edited when Advanced is on. Also edits services (URL, which fields they send, timeout, sample reply). With Advanced on, it also edits the events the rule set listens for. |
| Preview | A live `<form-flow explain>` showing the current documents. Values the user has typed survive edits. **Restart** clears them. |
| Status | Shows the `validate()` result. **Export is blocked while there are problems.** |

**Advanced** shows ids, priorities, a field's pattern, the listen list and the raw JSON. It is off by default so content editors work with pickers and sentences only.

**Import** accepts one or more JSON files and detects each one's model: a form definition, a rule set, or a form patch (which becomes the sample reply of the first service). Plain, non-UCF documents are wrapped as UCF.

## API

| Member | |
|---|---|
| `load(form, rules?, samples?)` | Starts editing these documents. Undo history is cleared. |
| `output` | `{ form, rules }`, a copy of what Export downloads. |
| `setSample(service, text)` | Sets the preview's sample reply for a service. |
| `undo()`, `redo()` | |
| `fe:change` | Fired after every edit. `detail` is `output`. |
| `fe:export` | Fired on export. `detail` is `output`. |

The editing helpers are in `modules/model.js` (pure, Node-safe), and the condition ↔ builder conversion and the sentence summaries are in `modules/conditions.js`. Both are tested with `npm test`.

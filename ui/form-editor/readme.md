# Form Editor

`<form-editor>` is a visual editor for multi-step forms and their rules. It is meant for developers and content editors alike. It produces exactly two JSON documents, both UCF content:

> The whole system (JSON formats, operators and actions, custom functions, sessions, tracking, embedding, what is deferred) is explained in the [forms guide](../../docs/forms.md).

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

`types` lists the installed field type packages (URLs of their `types.json`, space-separated); the core package is always installed. The **+ Field** button and **Change type** open a searchable picker grouped by type, with types from other packages under *From installed packages*. A package's `functions` (its checks) are loaded with it. Set `editor.types` to pass a registry from `loadPackages()` directly.

```html
<form-editor types="/ui/form-types/dk/types.json /ui/form-types/banking/types.json"></form-editor>
```

`functions` is the URL of a module whose default export is `{ name: fn }`: the host functions the rules call (see form-rules § Validation). The editor offers them as field checks, validates with them and passes them to the preview; set `editor.functions` to pass them directly. The demo opens the advanced loan example with `?example=loan`.

All attributes are optional. `form` and `rules` give the example that the **Example** button restores. `samples` maps a service name to a sample reply (a form patch), which the preview uses in place of calling the service. Without attributes, the editor starts with an empty form.

The editor saves a draft in `localStorage` (`form-editor:draft:<form URL>`, one per example) on every change and restores it on load.

## The page

| Part | What it does |
|---|---|
| Toolbar | Shows the form title and the Form, Rules and JSON tabs (JSON only when Advanced is on). Also has Undo/Redo (Ctrl/Cmd+Z, Shift for redo), Example, New, Import, Export and the Advanced toggle. |
| Outline | Lists steps, their fields (with their type's glyph) and their slots. **+ Field** opens the type picker; **+ Step** adds a step. |
| Form view | Edits whichever is selected: the form (title, ids, rule set version), a step (name, hidden, slots, order) or a field (label, id, help, type (Change type), required, hidden, privacy, and the settings its type lists: choices, placeholder, min/max, length, pattern, checks, starting value, text, consent wording and notice, file limits, value source (none, personal, special) and, for non-personal choices, whether the chosen option may go to analytics, and the step). Renaming a field id also updates every rule, action and service that names it. Deleting a field lists the rules that use it. |
| Rules view | Shows each rule as a sentence ("When Age group is at least 30–49 and Zip code is above 2000: offer only Plus, Senior in Plan."). Opening a rule shows a **When** builder (All/Any groups, field, operator and value pickers fitted to the field), plus **Then** and **Otherwise** action rows. A condition the builder cannot draw stays as a custom JSON block, which can be edited when Advanced is on. Actions include `invalid` (a message on a field, blocking or only warning) and `set`/`add` on variables. Also edits variables (start value, or a calculation with Advanced on) and services (URL, method, which fields they send, timeout, sample reply; a fetch can be marked *wait for it*). A rule can be marked *Track this rule in analytics* (`"track": true`, see form-flow § Tracking). With Advanced on, it also edits the events the rule set listens for. |
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
